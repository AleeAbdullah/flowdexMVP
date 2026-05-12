import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { getAddress, Interface, isAddress } from 'ethers';
import { Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { LedgerTxStatus } from '../../common/enums/domain.enums';
import { normalizeAddress } from '../../common/utils/address';
import { assertNetworkChainPair, chainIdForNetwork, isSupportedNetwork, networkForChainId } from '../../common/utils/network';
import { env } from '../../infrastructure/config/env';
import { AlchemyService } from '../alchemy/alchemy.service';
import {
  AdminTransactionListItemDto,
  SimulateTransactionDto,
  TrackTransactionDto,
  WalletTransactionListItemDto,
  WalletTransactionSimulationDto,
  WalletTransactionTrackResultDto,
} from './dto/transactions.dto';
import { LedgerTransactionEntity } from './entities/ledger-transaction.entity';
import { SimulationIntentEntity } from './entities/simulation-intent.entity';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const ERC20_INTERFACE = new Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function transfer(address to, uint256 value)',
]);

type WalletAuthIdentity = {
  normalized: string;
  checksum: string;
};

type TransactionRequest = {
  to: string;
  chainId: number;
  value: string;
  data: string;
};

type VerificationResult = {
  actualToAddress: string;
  actualAmountBaseUnits: string;
  blockNumber: string | null;
  confirmedAt: Date | null;
  status: string;
  failureReason: string | null;
};

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(LedgerTransactionEntity)
    private readonly ledgerTransactionsRepository: Repository<LedgerTransactionEntity>,
    @InjectRepository(SimulationIntentEntity)
    private readonly simulationIntentsRepository: Repository<SimulationIntentEntity>,
    private readonly alchemyService: AlchemyService,
  ) {}

  async simulate(
    auth: AuthContext,
    input: SimulateTransactionDto,
  ): Promise<WalletTransactionSimulationDto> {
    const wallet = this.requireWalletAuth(auth);
    const network = networkForChainId(input.chainId);
    const request = this.buildTransactionRequest(input, this.getTreasuryAddress(network));

    const result = await this.alchemyService.simulateTransaction({
      network: this.toAlchemyNetwork(network),
      from: wallet.normalized,
      to: request.to,
      value: request.value === '0' ? undefined : request.value,
      data: request.data === '0x' ? undefined : request.data,
    });

    if (!result.allowed) {
      return {
        allowed: false,
        reason: result.reason,
        simulationId: null,
        request: null,
      };
    }

    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    const intent = await this.simulationIntentsRepository.save(
      this.simulationIntentsRepository.create({
        walletAddressNormalized: wallet.normalized,
        chainId: input.chainId,
        assetType: input.assetType,
        assetCode: input.assetCode.trim().toUpperCase(),
        assetContractAddress: input.assetContractAddress
          ? this.normalizeAndChecksum(input.assetContractAddress).normalized
          : null,
        assetDecimals: input.assetDecimals,
        amountBaseUnits: input.amountBaseUnits,
        amountDisplay: input.amountDisplay,
        expectedRecipientAddress: normalizeAddress(request.to),
        status: 'created',
        expiresAt,
        usedAt: null,
        requestPayload: {
          amountBaseUnits: input.amountBaseUnits,
          amountDisplay: input.amountDisplay,
          request,
          rawSimulation: result.raw,
        },
      }),
    );

    return {
      allowed: true,
      reason: null,
      simulationId: intent.id,
      request,
    };
  }

  async track(
    auth: AuthContext,
    input: TrackTransactionDto,
  ): Promise<WalletTransactionTrackResultDto> {
    const wallet = this.requireWalletAuth(auth);
    const txHash = String(input.txHash ?? '').trim();

    if (!TX_HASH_PATTERN.test(txHash)) {
      throw new BadRequestException('txHash must be a 32-byte hex hash');
    }

    const intent = await this.simulationIntentsRepository.findOne({
      where: {
        id: input.simulationId,
        walletAddressNormalized: wallet.normalized,
      },
    });

    if (!intent) {
      throw new NotFoundException('Simulation intent not found');
    }

    this.assertIntentIsTrackable(intent);

    const duplicate = await this.ledgerTransactionsRepository.findOne({
      where: {
        chainId: intent.chainId,
        txHash,
      },
    });

    if (duplicate) {
      if (duplicate.ownerWalletAddressNormalized === wallet.normalized) {
        return {
          publicId: duplicate.publicId,
          status: duplicate.status,
        };
      }

      throw new NotFoundException('Transaction not found');
    }

    const network = networkForChainId(intent.chainId);
    const chainTx = await this.alchemyService.getTransactionByHash(this.toAlchemyNetwork(network), txHash);
    const receipt = await this.alchemyService.getTransactionReceipt(this.toAlchemyNetwork(network), txHash);

    if (!chainTx) {
      throw new BadRequestException('Transaction not found on chain');
    }

    const verification = this.verifyTrackedTransaction({
      txHash,
      wallet,
      intent,
      chainTx,
      receipt,
      expectedRecipientAddress: this.getTreasuryAddress(network),
    });

    intent.status = 'used';
    intent.usedAt = new Date();
    await this.simulationIntentsRepository.save(intent);

    const entity = await this.ledgerTransactionsRepository.save(
      this.ledgerTransactionsRepository.create({
        publicId: randomUUID(),
        ownerWalletAddressNormalized: wallet.normalized,
        ownerWalletAddressChecksum: wallet.checksum,
        chainId: intent.chainId,
        network,
        assetType: intent.assetType,
        assetCode: intent.assetCode,
        assetContractAddress: intent.assetContractAddress,
        assetDecimals: intent.assetDecimals,
        amountBaseUnits: intent.amountBaseUnits,
        amountDisplay: intent.amountDisplay,
        status: verification.status,
        txHash,
        expectedRecipientAddress: intent.expectedRecipientAddress,
        actualFromAddress: wallet.normalized,
        actualToAddress: verification.actualToAddress,
        actualAmountBaseUnits: verification.actualAmountBaseUnits,
        failureReason: verification.failureReason,
        blockNumber: verification.blockNumber,
        confirmedAt: verification.confirmedAt,
        simulationId: intent.id,
        rawTrackPayload: { txHash, simulationId: input.simulationId },
        rawWebhookPayload: null,
      }),
    );

    return {
      publicId: entity.publicId,
      status: entity.status,
    };
  }

  async listForWallet(auth: AuthContext): Promise<{ items: WalletTransactionListItemDto[] }> {
    const wallet = this.requireWalletAuth(auth);
    const items = await this.ledgerTransactionsRepository.find({
      where: { ownerWalletAddressNormalized: wallet.normalized },
      order: { createdAt: 'DESC' },
    });

    return {
      items: items.map(item => this.toWalletDto(item)),
    };
  }

  async getForWallet(auth: AuthContext, publicId: string): Promise<WalletTransactionListItemDto> {
    const wallet = this.requireWalletAuth(auth);
    const item = await this.ledgerTransactionsRepository.findOne({
      where: {
        publicId,
        ownerWalletAddressNormalized: wallet.normalized,
      },
    });

    if (!item) {
      throw new NotFoundException('Transaction not found');
    }

    return this.toWalletDto(item);
  }

  async listAll(filters?: {
    status?: string;
    network?: string;
    assetCode?: string;
    walletAddress?: string;
    from?: string;
    to?: string;
  }): Promise<{ items: AdminTransactionListItemDto[] }> {
    const qb = this.ledgerTransactionsRepository.createQueryBuilder('tx');

    if (filters?.status) {
      qb.andWhere('tx.status = :status', { status: filters.status });
    }
    if (filters?.network) {
      qb.andWhere('tx.network = :network', { network: filters.network });
    }
    if (filters?.assetCode) {
      qb.andWhere('tx.asset_code = :assetCode', { assetCode: filters.assetCode });
    }
    if (filters?.walletAddress) {
      qb.andWhere('tx.owner_wallet_address_normalized = :walletAddress', {
        walletAddress: normalizeAddress(filters.walletAddress),
      });
    }
    if (filters?.from) {
      qb.andWhere('tx.created_at >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('tx.created_at <= :to', { to: filters.to });
    }

    const items = await qb.orderBy('tx.created_at', 'DESC').getMany();

    return {
      items: items.map(item => this.toAdminDto(item)),
    };
  }

  async getById(id: string): Promise<AdminTransactionListItemDto> {
    const item = await this.ledgerTransactionsRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Transaction not found');
    }
    return this.toAdminDto(item);
  }

  async reconcileById(id: string): Promise<AdminTransactionListItemDto> {
    const tx = await this.ledgerTransactionsRepository.findOne({ where: { id } });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }

    if (!tx.txHash) {
      throw new BadRequestException('Transaction has no txHash to reconcile');
    }

    if (!isSupportedNetwork(tx.network)) {
      throw new BadRequestException('Unsupported transaction network');
    }

    assertNetworkChainPair(tx.network, tx.chainId);

    const chainTx = await this.alchemyService.getTransactionByHash(this.toAlchemyNetwork(tx.network), tx.txHash);
    const receipt = await this.alchemyService.getTransactionReceipt(this.toAlchemyNetwork(tx.network), tx.txHash);

    if (!chainTx) {
      return this.toAdminDto(tx);
    }

    const verification = this.verifyTrackedTransaction({
      txHash: tx.txHash,
      wallet: {
        normalized: tx.ownerWalletAddressNormalized,
        checksum: tx.ownerWalletAddressChecksum,
      },
      intent: {
        chainId: tx.chainId,
        assetType: tx.assetType,
        assetCode: tx.assetCode,
        assetContractAddress: tx.assetContractAddress,
        assetDecimals: tx.assetDecimals,
        amountBaseUnits: tx.amountBaseUnits,
        amountDisplay: tx.amountDisplay,
        expectedRecipientAddress: tx.expectedRecipientAddress,
      },
      chainTx,
      receipt,
      expectedRecipientAddress: tx.expectedRecipientAddress,
    });

    tx.status = verification.status;
    tx.actualFromAddress = tx.ownerWalletAddressNormalized;
    tx.actualToAddress = verification.actualToAddress;
    tx.actualAmountBaseUnits = verification.actualAmountBaseUnits;
    tx.failureReason = verification.failureReason;
    tx.blockNumber = verification.blockNumber;
    tx.confirmedAt = verification.confirmedAt;

    await this.ledgerTransactionsRepository.save(tx);
    return this.toAdminDto(tx);
  }

  private assertIntentIsTrackable(intent: SimulationIntentEntity) {
    if (intent.status === 'used') {
      throw new BadRequestException('Simulation intent already used');
    }

    if (intent.status === 'cancelled') {
      throw new BadRequestException('Simulation intent cancelled');
    }

    if (intent.expiresAt.getTime() <= Date.now()) {
      intent.status = 'expired';
      void this.simulationIntentsRepository.save(intent);
      throw new BadRequestException('Simulation intent expired');
    }
  }

  private verifyTrackedTransaction(input: {
    txHash: string;
    wallet: WalletAuthIdentity;
    intent: Pick<
      SimulationIntentEntity,
      'chainId'
      | 'assetType'
      | 'assetCode'
      | 'assetContractAddress'
      | 'assetDecimals'
      | 'amountBaseUnits'
      | 'amountDisplay'
      | 'expectedRecipientAddress'
    >;
    chainTx: Awaited<ReturnType<AlchemyService['getTransactionByHash']>>;
    receipt: Awaited<ReturnType<AlchemyService['getTransactionReceipt']>>;
    expectedRecipientAddress: string;
  }): VerificationResult {
    const chainTx = input.chainTx;
    if (!chainTx) {
      throw new BadRequestException('Transaction not found on chain');
    }

    const resolvedInput = {
      ...input,
      chainTx,
    };

    const actualFrom = this.normalizeAndChecksum(chainTx.from).normalized;
    if (actualFrom !== input.wallet.normalized) {
      throw new BadRequestException('Transaction sender does not match wallet session');
    }

    if (input.intent.assetType === 'native') {
      return this.verifyNativeTransfer(resolvedInput);
    }

    return this.verifyErc20Transfer(resolvedInput);
  }

  private verifyNativeTransfer(input: {
    wallet: WalletAuthIdentity;
    intent: Pick<SimulationIntentEntity, 'amountBaseUnits'>;
    chainTx: NonNullable<Awaited<ReturnType<AlchemyService['getTransactionByHash']>>>;
    receipt: Awaited<ReturnType<AlchemyService['getTransactionReceipt']>>;
    expectedRecipientAddress: string;
  }): VerificationResult {
    if (!input.chainTx.to) {
      throw new BadRequestException('Native transaction missing recipient');
    }

    const actualTo = this.normalizeAndChecksum(input.chainTx.to);
    const expectedRecipient = this.normalizeAndChecksum(input.expectedRecipientAddress);

    if (actualTo.normalized !== expectedRecipient.normalized) {
      throw new BadRequestException('Transaction recipient does not match configured treasury');
    }

    if (BigInt(input.chainTx.value) !== BigInt(input.intent.amountBaseUnits)) {
      throw new BadRequestException('Transaction value does not match expected amount');
    }

    return {
      actualToAddress: actualTo.normalized,
      actualAmountBaseUnits: input.chainTx.value,
      blockNumber: input.receipt?.blockNumber ?? input.chainTx.blockNumber,
      confirmedAt: this.resolveConfirmedAt(input.receipt),
      status: this.resolveLedgerStatus(input.receipt),
      failureReason: input.receipt?.status === '0x0' ? 'CHAIN_REVERTED' : null,
    };
  }

  private verifyErc20Transfer(input: {
    wallet: WalletAuthIdentity;
    intent: Pick<SimulationIntentEntity, 'assetContractAddress' | 'amountBaseUnits'>;
    chainTx: NonNullable<Awaited<ReturnType<AlchemyService['getTransactionByHash']>>>;
    receipt: Awaited<ReturnType<AlchemyService['getTransactionReceipt']>>;
    expectedRecipientAddress: string;
  }): VerificationResult {
    const expectedContract = input.intent.assetContractAddress
      ? this.normalizeAndChecksum(input.intent.assetContractAddress)
      : null;

    if (!expectedContract) {
      throw new BadRequestException('ERC-20 transaction requires token contract address');
    }

    if (!input.chainTx.to) {
      throw new BadRequestException('ERC-20 transaction missing token contract');
    }

    const actualContract = this.normalizeAndChecksum(input.chainTx.to);
    if (actualContract.normalized !== expectedContract.normalized) {
      throw new BadRequestException('Transaction token contract does not match expected asset');
    }

    const pendingTransfer = this.decodeErc20TransferFromInput(input.chainTx.input, expectedContract.normalized);
    const expectedRecipient = this.normalizeAndChecksum(input.expectedRecipientAddress);

    if (pendingTransfer.to.normalized !== expectedRecipient.normalized) {
      throw new BadRequestException('Transaction recipient does not match configured treasury');
    }

    if (BigInt(pendingTransfer.amountBaseUnits) !== BigInt(input.intent.amountBaseUnits)) {
      throw new BadRequestException('Transaction amount does not match expected token transfer');
    }

    const settledTransfer = input.receipt?.blockNumber
      ? this.findConfirmedErc20Transfer(input.receipt.logs, {
          contractAddressNormalized: expectedContract.normalized,
          fromAddressNormalized: input.wallet.normalized,
          toAddressNormalized: expectedRecipient.normalized,
        })
      : null;

    if (input.receipt?.blockNumber && !settledTransfer) {
      throw new BadRequestException('Transaction receipt does not include the expected token transfer');
    }

    const actualAmount = settledTransfer?.amountBaseUnits ?? pendingTransfer.amountBaseUnits;

    return {
      actualToAddress: expectedRecipient.normalized,
      actualAmountBaseUnits: actualAmount,
      blockNumber: input.receipt?.blockNumber ?? input.chainTx.blockNumber,
      confirmedAt: this.resolveConfirmedAt(input.receipt),
      status: this.resolveLedgerStatus(input.receipt),
      failureReason: input.receipt?.status === '0x0' ? 'CHAIN_REVERTED' : null,
    };
  }

  private decodeErc20TransferFromInput(inputData: string | null, contractAddressNormalized: string) {
    if (!inputData || inputData === '0x') {
      throw new BadRequestException(`Transaction input missing for ERC-20 transfer on ${contractAddressNormalized}`);
    }

    const decoded = ERC20_INTERFACE.decodeFunctionData('transfer', inputData);
    const recipient = this.normalizeAndChecksum(String(decoded[0]));
    const amountBaseUnits = BigInt(decoded[1]).toString();

    return {
      to: recipient,
      amountBaseUnits,
    };
  }

  private findConfirmedErc20Transfer(
    logs: Array<Record<string, unknown>>,
    input: {
      contractAddressNormalized: string;
      fromAddressNormalized: string;
      toAddressNormalized: string;
    },
  ): { amountBaseUnits: string } | null {
    for (const log of logs) {
      const address = typeof log.address === 'string' ? normalizeAddress(log.address) : null;
      const data = typeof log.data === 'string' ? log.data : null;
      const topics = Array.isArray(log.topics) ? log.topics.filter((value): value is string => typeof value === 'string') : [];

      if (!address || !data || address !== input.contractAddressNormalized) {
        continue;
      }

      try {
        const parsed = ERC20_INTERFACE.parseLog({ data, topics });
        if (parsed?.name !== 'Transfer') {
          continue;
        }

        const from = this.normalizeAndChecksum(String(parsed.args[0]));
        const to = this.normalizeAndChecksum(String(parsed.args[1]));
        if (from.normalized !== input.fromAddressNormalized || to.normalized !== input.toAddressNormalized) {
          continue;
        }

        return {
          amountBaseUnits: BigInt(parsed.args[2]).toString(),
        };
      } catch {
        continue;
      }
    }

    return null;
  }

  private resolveLedgerStatus(
    receipt: Awaited<ReturnType<AlchemyService['getTransactionReceipt']>>,
  ): string {
    if (!receipt?.blockNumber) {
      return LedgerTxStatus.PENDING;
    }

    if (receipt.status === '0x0') {
      return LedgerTxStatus.FAILED;
    }

    return LedgerTxStatus.CONFIRMED;
  }

  private resolveConfirmedAt(
    receipt: Awaited<ReturnType<AlchemyService['getTransactionReceipt']>>,
  ): Date | null {
    if (!receipt?.blockNumber || receipt.status === '0x0') {
      return null;
    }

    return new Date();
  }

  private buildTransactionRequest(input: SimulateTransactionDto, treasuryAddress: string): TransactionRequest {
    if (!/^[0-9]+$/.test(input.amountBaseUnits)) {
      throw new BadRequestException('amountBaseUnits must be a base-unit integer string');
    }

    if (BigInt(input.amountBaseUnits) <= 0n) {
      throw new BadRequestException('amountBaseUnits must be greater than zero');
    }

    if (input.assetType === 'native') {
      return {
        to: getAddress(treasuryAddress),
        chainId: input.chainId,
        value: input.amountBaseUnits,
        data: '0x',
      };
    }

    const token = this.normalizeAndChecksum(input.assetContractAddress ?? '');
    const data = ERC20_INTERFACE.encodeFunctionData('transfer', [
      getAddress(treasuryAddress),
      BigInt(input.amountBaseUnits),
    ]);

    return {
      to: token.checksum,
      chainId: input.chainId,
      value: '0',
      data,
    };
  }

  private getTreasuryAddress(network: string): string {
    if (!isSupportedNetwork(network)) {
      throw new BadRequestException('Unsupported transaction network');
    }

    const address = network === 'BASE_SEPOLIA'
      ? env.treasuryAddressBaseSepolia
      : env.treasuryAddressEthSepolia;

    return this.normalizeAndChecksum(address).checksum;
  }

  private toAlchemyNetwork(network: string): 'eth-sepolia' | 'base-sepolia' {
    if (network === 'BASE_SEPOLIA') {
      return 'base-sepolia';
    }

    return 'eth-sepolia';
  }

  private requireWalletAuth(auth: AuthContext): WalletAuthIdentity {
    if (auth.authType !== 'wallet' || !auth.walletAddressNormalized) {
      throw new UnauthorizedException('Wallet session required');
    }

    const normalized = normalizeAddress(auth.walletAddressNormalized);
    const checksum = auth.walletAddressChecksum
      ? getAddress(auth.walletAddressChecksum)
      : getAddress(normalized);

    return {
      normalized,
      checksum,
    };
  }

  private normalizeAndChecksum(address: string): WalletAuthIdentity {
    if (!isAddress(address)) {
      throw new BadRequestException(`Invalid EVM address: ${address}`);
    }

    return {
      normalized: normalizeAddress(address),
      checksum: getAddress(address),
    };
  }

  private toWalletDto(entity: LedgerTransactionEntity): WalletTransactionListItemDto {
    return {
      publicId: entity.publicId,
      walletAddress: entity.ownerWalletAddressNormalized,
      walletAddressChecksum: entity.ownerWalletAddressChecksum,
      network: entity.network,
      chainId: entity.chainId,
      assetType: entity.assetType,
      assetCode: entity.assetCode,
      assetContractAddress: entity.assetContractAddress,
      assetDecimals: entity.assetDecimals,
      amountBaseUnits: entity.amountBaseUnits,
      amountDisplay: entity.amountDisplay,
      status: entity.status,
      txHash: entity.txHash,
      expectedRecipientAddress: entity.expectedRecipientAddress,
      actualFromAddress: entity.actualFromAddress,
      actualToAddress: entity.actualToAddress,
      actualAmountBaseUnits: entity.actualAmountBaseUnits,
      failureReason: entity.failureReason,
      blockNumber: entity.blockNumber,
      confirmedAt: entity.confirmedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toAdminDto(entity: LedgerTransactionEntity): AdminTransactionListItemDto {
    return {
      id: entity.id,
      publicId: entity.publicId,
      walletAddress: entity.ownerWalletAddressNormalized,
      walletAddressChecksum: entity.ownerWalletAddressChecksum,
      network: entity.network,
      chainId: entity.chainId,
      assetType: entity.assetType,
      assetCode: entity.assetCode,
      assetContractAddress: entity.assetContractAddress,
      assetDecimals: entity.assetDecimals,
      amountBaseUnits: entity.amountBaseUnits,
      amountDisplay: entity.amountDisplay,
      status: entity.status,
      txHash: entity.txHash,
      expectedRecipientAddress: entity.expectedRecipientAddress,
      actualFromAddress: entity.actualFromAddress,
      actualToAddress: entity.actualToAddress,
      actualAmountBaseUnits: entity.actualAmountBaseUnits,
      failureReason: entity.failureReason,
      blockNumber: entity.blockNumber,
      confirmedAt: entity.confirmedAt,
      simulationId: entity.simulationId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
