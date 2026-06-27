import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import bs58 from 'bs58';
import { formatUnits, getAddress, isAddress } from 'ethers';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { normalizeAddress } from '../../common/utils/address';
import { formatFixed, normalizeFixed, parseFixed } from '../../common/utils/decimal';
import { env } from '../../infrastructure/config/env';
import {
  AlchemyService,
  BitcoinAddressTransaction,
  EvmTransfer,
  SolanaParsedTransaction,
} from '../alchemy/alchemy.service';
import {
  AdminPaymentFiltersDto,
} from './dto/admin-payments.dto';
import {
  CreatePaymentIntentDto,
  PaymentLeaderDto,
  PaymentLeadersResponseDto,
  PaymentIntentPublicDto,
  PaymentIntentStatusDto,
  PaymentPublicDto,
} from './dto/payments.dto';
import { PaymentIntentEntity } from './entities/payment-intent.entity';
import { PaymentEntity } from './entities/payment.entity';
import {
  CHAIN_ASSET,
  PAYMENT_ASSET_DECIMALS,
  PaymentAsset,
  PaymentChain,
  PaymentIntentStatus,
  PaymentStatus,
  TERMINAL_PAYMENT_INTENT_STATUSES,
} from './payments.types';
import { BtcAddressService } from './services/btc-address.service';
import { PaymentPricingService } from './services/payment-pricing.service';
import { PaymentStateService } from './services/payment-state.service';

type MatchResult = {
  status: PaymentStatus;
  amountBaseUnits: string;
  senderAddress: string | null;
  receiverAddress: string;
  txHash: string | null;
  outputIndex: number | null;
  blockNumber: string | null;
  confirmations: number;
  confirmedAt: Date | null;
  rawPayload: Record<string, unknown> | null;
} | null;

const MAX_ETH_TRANSFER_PAGES = 5;
const BTC_DERIVATION_ADVISORY_LOCK = 810_200_001;
const PAYMENT_SCANNER_ADVISORY_LOCK = 810_200_002;
const OPEN_BTC_INTENT_LIMIT = 3;

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentsRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepository: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
    private readonly alchemyService: AlchemyService,
    private readonly pricingService: PaymentPricingService,
    private readonly btcAddressService: BtcAddressService,
    private readonly stateService: PaymentStateService,
  ) {}

  async createIntent(input: CreatePaymentIntentDto, requestIp?: string): Promise<PaymentIntentPublicDto> {
    this.assertChainAsset(input.chain, input.asset);

    if (input.chain === PaymentChain.BITCOIN && !env.btcPaymentsEnabled) {
      throw new BadRequestException('Bitcoin payments are temporarily disabled');
    }

    const senderAddress = input.senderAddress ? this.normalizeSender(input.chain, input.senderAddress) : null;

    if (input.chain === PaymentChain.ETHEREUM && !senderAddress) {
      throw new BadRequestException('ETH senderAddress is required');
    }

    const quote = await this.pricingService.quotePurchase({
      asset: input.asset,
      tokenAmount: input.tokenAmount,
    });

    return this.dataSource.transaction(async manager => {
      if (input.chain === PaymentChain.BITCOIN) {
        await this.assertBtcIntentLimit(manager, senderAddress, requestIp);
      }

      const now = new Date();
      const baseIntent = {
        chain: input.chain,
        asset: input.asset,
        tokenAmount: quote.tokenAmount,
        tokenPriceUsd: quote.tokenPriceUsd,
        usdAmount: quote.usdAmount,
        quoteCurrency: quote.quoteCurrency,
        quotePriceUsd: quote.quotePriceUsd,
        quotedAt: quote.quotedAt,
        quoteExpiresAt: quote.quoteExpiresAt,
        expectedAmountBaseUnits: quote.expectedAmountBaseUnits,
        senderAddress,
        requestIp: requestIp ?? null,
        status: PaymentIntentStatus.WAITING,
        expiresAt: new Date(now.getTime() + env.paymentIntentTtlMinutes * 60_000),
        lastCheckedAt: null,
        lastCheckResult: null,
      };

      const intent = manager.create(PaymentIntentEntity, {
        ...baseIntent,
        ...(await this.buildChainSpecificIntentFields(manager, input.chain)),
      });

      return this.toPublicIntent(await manager.save(intent));
    });
  }

  async getIntentStatus(intentId: string): Promise<PaymentIntentStatusDto> {
    const intent = await this.paymentIntentsRepository.findOne({ where: { id: intentId } });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (this.canUseCachedStatus(intent)) {
      return this.toStatusDto(intent, await this.findPaymentByIntent(intent.id));
    }

    const updatedIntent = await this.checkAndPersistIntent(intent);
    return this.toStatusDto(updatedIntent, await this.findPaymentByIntent(updatedIntent.id));
  }

  async processEthereumAlchemyWebhook(input: {
    rawBody: string;
    signature: string;
    payload: unknown;
  }): Promise<{ received: true; processed: number }> {
    if (!this.alchemyService.verifyWebhookSignature(input.rawBody, input.signature)) {
      throw new UnauthorizedException('Invalid Alchemy webhook signature');
    }

    const transfers = this.extractEthereumWebhookTransfers(input.payload);
    let processed = 0;

    for (const transfer of transfers) {
      const didProcess = await this.processEthereumWebhookTransfer(transfer);
      if (didProcess) {
        processed += 1;
      }
    }

    return { received: true, processed };
  }

  async listPublicHistory(walletAddress: string): Promise<{ items: PaymentPublicDto[] }> {
    const addresses = this.buildAddressLookupValues(walletAddress);
    const items = await this.paymentsRepository.find({
      where: addresses.map(senderAddress => ({ senderAddress })),
      order: { createdAt: 'DESC' },
    });

    return { items: items.map(item => this.toPublicPayment(item)) };
  }

  async listPublicLeaders(limit = 10): Promise<PaymentLeadersResponseDto> {
    const normalizedLimit = Number.isFinite(limit) ? Math.trunc(limit) : 10;
    const safeLimit = Math.max(1, Math.min(50, normalizedLimit));
    const rows = await this.paymentsRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.intent', 'intent')
      .select('payment.sender_address', 'walletAddress')
      .addSelect('SUM(intent.usd_amount)', 'totalUsd')
      .addSelect('COUNT(payment.id)', 'paymentCount')
      .addSelect('MAX(payment.created_at)', 'latestPaymentAt')
      .where('payment.status = :status', { status: PaymentStatus.CONFIRMED })
      .andWhere('payment.sender_address IS NOT NULL')
      .groupBy('payment.sender_address')
      .orderBy('SUM(intent.usd_amount)', 'DESC')
      .addOrderBy('MAX(payment.created_at)', 'DESC')
      .limit(safeLimit)
      .getRawMany<{
        walletAddress: string;
        totalUsd: string;
        paymentCount: string;
        latestPaymentAt: Date | string;
      }>();

    return {
      items: rows.map((row, index): PaymentLeaderDto => ({
        rank: index + 1,
        walletAddress: row.walletAddress,
        totalUsd: normalizeFixed(row.totalUsd),
        paymentCount: Number(row.paymentCount),
        latestPaymentAt: row.latestPaymentAt instanceof Date
          ? row.latestPaymentAt
          : new Date(row.latestPaymentAt),
      })),
    };
  }

  async listAdminPayments(filters: AdminPaymentFiltersDto): Promise<{ items: Array<PaymentPublicDto & {
    rawPayload: Record<string, unknown> | null;
    tokenAmount: string;
    usdAmount: string;
  }> }> {
    const qb = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.intent', 'intent');

    if (filters.chain) {
      qb.andWhere('payment.chain = :chain', { chain: filters.chain });
    }
    if (filters.asset) {
      qb.andWhere('payment.asset = :asset', { asset: filters.asset });
    }
    if (filters.status) {
      qb.andWhere('payment.status = :status', { status: filters.status });
    }
    if (filters.senderAddress) {
      this.applyAddressFilter(qb, 'payment.sender_address', filters.senderAddress, filters.chain);
    }
    if (filters.receiverAddress) {
      this.applyAddressFilter(qb, 'payment.receiver_address', filters.receiverAddress, filters.chain);
    }
    if (filters.from) {
      qb.andWhere('payment.created_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('payment.created_at <= :to', { to: filters.to });
    }

    const payments = await qb.orderBy('payment.created_at', 'DESC').getMany();
    return {
      items: payments.map(payment => ({
        ...this.toPublicPayment(payment),
        rawPayload: payment.rawPayload,
        tokenAmount: payment.intent?.tokenAmount ?? '0',
        usdAmount: payment.intent?.usdAmount ?? '0',
      })),
    };
  }

  async getAdminStats(): Promise<{
    totalPaymentCount: number;
    confirmedPaymentCount: number;
    pendingPaymentCount: number;
    failedPaymentCount: number;
    totalConfirmedUsd: string;
    latestPaymentAt: Date | null;
    countsByStatus: Record<string, number>;
    volumeByChain: Record<string, string>;
  }> {
    const intents = await this.paymentIntentsRepository.find();
    const payments = await this.paymentsRepository.find({ relations: ['intent'] });
    const countsByStatus = intents.reduce<Record<string, number>>((acc, intent) => {
      acc[intent.status] = (acc[intent.status] ?? 0) + 1;
      return acc;
    }, {});
    const confirmedPayments = payments.filter(payment => payment.status === PaymentStatus.CONFIRMED);
    const totalConfirmedUsd = confirmedPayments
      .reduce((sum, payment) => sum + parseFixed(payment.intent?.usdAmount ?? '0'), 0n);
    const volumeByChain = confirmedPayments.reduce<Record<string, bigint>>((acc, payment) => {
      acc[payment.chain] = (acc[payment.chain] ?? 0n) + parseFixed(payment.intent?.usdAmount ?? '0');
      return acc;
    }, {});

    return {
      totalPaymentCount: intents.length,
      confirmedPaymentCount: countsByStatus.CONFIRMED ?? 0,
      pendingPaymentCount: (countsByStatus.WAITING ?? 0) + (countsByStatus.DETECTED ?? 0) + (countsByStatus.CONFIRMING ?? 0),
      failedPaymentCount: (countsByStatus.FAILED ?? 0) + (countsByStatus.EXPIRED ?? 0),
      totalConfirmedUsd: formatFixed(totalConfirmedUsd),
      latestPaymentAt: payments.length
        ? payments.reduce((latest, payment) => payment.updatedAt > latest ? payment.updatedAt : latest, payments[0].updatedAt)
        : null,
      countsByStatus,
      volumeByChain: Object.fromEntries(Object.entries(volumeByChain).map(([chain, amount]) => [chain, formatFixed(amount)])),
    };
  }

  async scanOpenIntents(): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const lockRows = await queryRunner.query(
        'SELECT pg_try_advisory_lock($1) AS "locked"',
        [PAYMENT_SCANNER_ADVISORY_LOCK],
      ) as Array<{ locked: boolean }>;
      if (!lockRows[0]?.locked) {
        return 0;
      }

      const intents = await this.paymentIntentsRepository.find({
        where: {
          status: In([
            PaymentIntentStatus.WAITING,
            PaymentIntentStatus.DETECTED,
            PaymentIntentStatus.CONFIRMING,
          ]),
        },
        order: { createdAt: 'ASC' },
        take: env.paymentScannerBatchSize,
      });

      let scanned = 0;
      for (const intent of intents) {
        if (!this.canUseCachedStatus(intent)) {
          await this.checkAndPersistIntent(intent);
          scanned += 1;
        }
      }

      return scanned;
    } finally {
      await queryRunner.query('SELECT pg_advisory_unlock($1)', [PAYMENT_SCANNER_ADVISORY_LOCK]).catch(() => undefined);
      await queryRunner.release();
    }
  }

  private async buildChainSpecificIntentFields(manager: EntityManager, chain: PaymentChain): Promise<Partial<PaymentIntentEntity>> {
    switch (chain) {
      case PaymentChain.ETHEREUM:
        return {
          receiverAddress: normalizeAddress(getAddress(env.ethTreasuryAddress)),
          ethCreatedBlockNumber: await this.alchemyService.getEthereumBlockNumber(),
        };
      case PaymentChain.SOLANA: {
        const reference = this.createSolanaReference();
        return {
          receiverAddress: env.solTreasuryAddress.trim(),
          solanaReference: reference,
        };
      }
      case PaymentChain.BITCOIN: {
        await manager.query('SELECT pg_advisory_xact_lock($1)', [BTC_DERIVATION_ADVISORY_LOCK]);
        const rows = await manager.query(`
          SELECT COALESCE(MAX(btc_derivation_index), -1) + 1 AS "nextIndex"
          FROM payment_intents
          WHERE btc_derivation_index IS NOT NULL
        `) as Array<{ nextIndex: string | number }>;
        const nextIndex = Number(rows[0]?.nextIndex ?? 0);
        const derived = this.btcAddressService.deriveReceiveAddress(nextIndex);
        return {
          receiverAddress: derived.address,
          btcDerivationIndex: derived.derivationIndex,
          btcDerivationPath: derived.derivationPath,
        };
      }
    }
  }

  private async checkAndPersistIntent(intent: PaymentIntentEntity): Promise<PaymentIntentEntity> {
    if (TERMINAL_PAYMENT_INTENT_STATUSES.has(intent.status)) {
      return intent;
    }

    if (intent.expiresAt <= new Date()) {
      this.stateService.assertIntentTransition(intent.status, PaymentIntentStatus.EXPIRED);
      intent.status = PaymentIntentStatus.EXPIRED;
      intent.lastCheckedAt = new Date();
      intent.lastCheckResult = { reason: 'EXPIRED' };
      return this.paymentIntentsRepository.save(intent);
    }

    const match = await this.findMatch(intent);
    intent.lastCheckedAt = new Date();

    if (!match) {
      intent.lastCheckResult = { reason: 'NO_MATCH' };
      return this.paymentIntentsRepository.save(intent);
    }

    const nextIntentStatus = this.stateService.toIntentStatus(match.status);
    this.stateService.assertIntentTransition(intent.status, nextIntentStatus);

    return this.persistMatch(intent, match, nextIntentStatus);
  }

  private async persistMatch(
    intent: PaymentIntentEntity,
    match: NonNullable<MatchResult>,
    nextIntentStatus = this.stateService.toIntentStatus(match.status),
  ): Promise<PaymentIntentEntity> {
    return this.dataSource.transaction(async manager => {
      const existing = await manager.findOne(PaymentEntity, { where: { intentId: intent.id } });
      const payment = manager.create(PaymentEntity, {
        ...(existing ?? {}),
        intentId: intent.id,
        chain: intent.chain,
        asset: intent.asset,
        amountBaseUnits: match.amountBaseUnits,
        senderAddress: match.senderAddress,
        receiverAddress: match.receiverAddress,
        txHash: match.txHash,
        outputIndex: match.outputIndex,
        status: match.status,
        blockNumber: match.blockNumber,
        confirmations: match.confirmations,
        confirmedAt: match.confirmedAt,
        rawPayload: match.rawPayload,
      });
      await manager.save(payment);

      intent.status = nextIntentStatus;
      intent.lastCheckedAt = new Date();
      intent.lastCheckResult = {
        source: 'ALCHEMY',
        status: match.status,
        txHash: match.txHash,
        amountBaseUnits: match.amountBaseUnits,
      };
      return manager.save(intent);
    });
  }

  private async findMatch(intent: PaymentIntentEntity): Promise<MatchResult> {
    switch (intent.chain) {
      case PaymentChain.ETHEREUM:
        return this.findEthereumMatch(intent);
      case PaymentChain.SOLANA:
        return this.findSolanaMatch(intent);
      case PaymentChain.BITCOIN:
        return this.findBitcoinMatch(intent);
    }
  }

  private async findEthereumMatch(intent: PaymentIntentEntity): Promise<MatchResult> {
    if (!intent.senderAddress || !intent.ethCreatedBlockNumber) {
      return null;
    }

    let pageKey: string | null = null;
    for (let page = 0; page < MAX_ETH_TRANSFER_PAGES; page += 1) {
      const response = await this.alchemyService.getEthereumAssetTransfers({
        fromAddress: intent.senderAddress,
        toAddress: intent.receiverAddress,
        fromBlock: intent.ethCreatedBlockNumber,
        pageKey: pageKey ?? undefined,
      });
      const match = response.transfers.find(transfer => this.isEthereumTransferCandidate(transfer, intent));
      if (match) {
        return this.toEthereumMatch(intent, match);
      }

      if (!response.pageKey) {
        break;
      }
      pageKey = response.pageKey;
    }

    return null;
  }

  private isEthereumTransferCandidate(transfer: EvmTransfer, intent: PaymentIntentEntity): boolean {
    const from = transfer.from ? normalizeAddress(transfer.from) : null;
    const to = transfer.to ? normalizeAddress(transfer.to) : null;
    return from === intent.senderAddress
      && to === intent.receiverAddress
      && this.getEthereumTransferBaseUnits(transfer) !== '0';
  }

  private async toEthereumMatch(intent: PaymentIntentEntity, transfer: EvmTransfer): Promise<NonNullable<MatchResult>> {
    const amountBaseUnits = this.getEthereumTransferBaseUnits(transfer);
    const receipt = transfer.hash ? await this.alchemyService.getEthereumTransactionReceipt(transfer.hash) : null;
    const latestBlockHex = await this.alchemyService.getEthereumBlockNumber();
    const blockNumber = receipt?.blockNumber ?? transfer.blockNum ?? null;
    const confirmations = blockNumber && latestBlockHex
      ? Math.max(0, Number(BigInt(latestBlockHex) - BigInt(blockNumber) + 1n))
      : 0;
    const status = this.classifyMatchedAmount(
      intent,
      amountBaseUnits,
      confirmations >= env.ethConfirmations,
      this.parseTransferTimestamp(transfer.metadata?.blockTimestamp),
    );

    return {
      status: receipt?.status === '0x0' ? PaymentStatus.FAILED : status,
      amountBaseUnits,
      senderAddress: intent.senderAddress,
      receiverAddress: intent.receiverAddress,
      txHash: transfer.hash,
      outputIndex: null,
      blockNumber,
      confirmations,
      confirmedAt: confirmations >= env.ethConfirmations ? new Date() : null,
      rawPayload: this.redactPayload(transfer as unknown as Record<string, unknown>),
    };
  }

  private async processEthereumWebhookTransfer(transfer: EvmTransfer): Promise<boolean> {
    if (!this.isProcessableEthereumWebhookTransfer(transfer)) {
      return false;
    }

    const from = normalizeAddress(getAddress(transfer.from!));
    const to = normalizeAddress(getAddress(transfer.to!));
    const amountBaseUnits = this.getEthereumTransferBaseUnits(transfer);
    const candidates = await this.paymentIntentsRepository.find({
      where: {
        chain: PaymentChain.ETHEREUM,
        senderAddress: from,
        receiverAddress: to,
        status: In([
          PaymentIntentStatus.WAITING,
          PaymentIntentStatus.DETECTED,
          PaymentIntentStatus.CONFIRMING,
        ]),
      },
      order: { createdAt: 'ASC' },
    });
    const intent = this.selectEthereumWebhookIntent(candidates, transfer, amountBaseUnits);
    if (!intent) {
      return false;
    }

    const match = await this.toEthereumMatch(intent, transfer);
    const nextIntentStatus = this.stateService.toIntentStatus(match.status);
    this.stateService.assertIntentTransition(intent.status, nextIntentStatus);
    await this.persistMatch(intent, match, nextIntentStatus);
    return true;
  }

  private selectEthereumWebhookIntent(
    candidates: PaymentIntentEntity[],
    transfer: EvmTransfer,
    amountBaseUnits: string,
  ): PaymentIntentEntity | null {
    const blockNum = this.parseHexBigInt(transfer.blockNum);
    const blockScoped = blockNum === null
      ? candidates
      : candidates.filter(intent => {
        const createdBlock = this.parseHexBigInt(intent.ethCreatedBlockNumber);
        return createdBlock === null || createdBlock <= blockNum;
      });

    return blockScoped.find(intent => intent.expectedAmountBaseUnits === amountBaseUnits)
      ?? blockScoped[0]
      ?? null;
  }

  private isProcessableEthereumWebhookTransfer(transfer: EvmTransfer): boolean {
    return Boolean(
      transfer.hash
      && transfer.from
      && transfer.to
      && isAddress(transfer.from)
      && isAddress(transfer.to)
      && this.getEthereumTransferBaseUnits(transfer) !== '0',
    );
  }

  private extractEthereumWebhookTransfers(payload: unknown): EvmTransfer[] {
    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const event = (payload as { event?: unknown }).event;
    if (!event || typeof event !== 'object') {
      return [];
    }

    const activity = (event as { activity?: unknown }).activity;
    if (!Array.isArray(activity)) {
      return [];
    }

    return activity
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(item => ({
        hash: String(item.hash ?? ''),
        from: typeof item.from === 'string'
          ? item.from
          : typeof item.fromAddress === 'string'
            ? item.fromAddress
            : null,
        to: typeof item.to === 'string'
          ? item.to
          : typeof item.toAddress === 'string'
            ? item.toAddress
            : null,
        value: typeof item.value === 'number' || typeof item.value === 'string' ? item.value : null,
        asset: typeof item.asset === 'string' ? item.asset : null,
        rawContract: item.rawContract && typeof item.rawContract === 'object'
          ? item.rawContract as EvmTransfer['rawContract']
          : undefined,
        blockNum: typeof item.blockNum === 'string' ? item.blockNum : undefined,
        metadata: item.metadata && typeof item.metadata === 'object'
          ? item.metadata as EvmTransfer['metadata']
          : undefined,
      }));
  }

  private parseHexBigInt(value: string | null | undefined): bigint | null {
    if (!value || !/^0x[0-9a-fA-F]+$/.test(value)) {
      return null;
    }

    return BigInt(value);
  }

  private getEthereumTransferBaseUnits(transfer: EvmTransfer): string {
    const rawValue = transfer.rawContract?.value;
    if (typeof rawValue === 'string' && /^0x[0-9a-fA-F]+$/.test(rawValue)) {
      return BigInt(rawValue).toString();
    }

    if (typeof transfer.value === 'number' || typeof transfer.value === 'string') {
      return parseFixed(String(transfer.value), 18).toString();
    }

    return '0';
  }

  private async findSolanaMatch(intent: PaymentIntentEntity): Promise<MatchResult> {
    const lookupAddress = intent.solanaReference ?? intent.receiverAddress;
    const signatures = await this.alchemyService.getSolanaSignaturesForAddress(lookupAddress, 20);

    for (const signature of signatures) {
      const tx = await this.alchemyService.getSolanaParsedTransaction(signature.signature);
      if (!tx || signature.err) {
        continue;
      }

      const transfer = this.findSolanaTransfer(tx, intent);
      if (!transfer) {
        continue;
      }

      return {
        status: this.classifyMatchedAmount(
          intent,
          transfer.lamports,
          true,
          signature.blockTime ? new Date(signature.blockTime * 1000) : null,
        ),
        amountBaseUnits: transfer.lamports,
        senderAddress: transfer.source,
        receiverAddress: intent.receiverAddress,
        txHash: signature.signature,
        outputIndex: null,
        blockNumber: String(signature.slot),
        confirmations: 1,
        confirmedAt: signature.blockTime ? new Date(signature.blockTime * 1000) : new Date(),
        rawPayload: this.redactPayload(tx),
      };
    }

    return null;
  }

  private findSolanaTransfer(tx: SolanaParsedTransaction, intent: PaymentIntentEntity): {
    source: string | null;
    lamports: string;
  } | null {
    const transaction = tx.transaction as Record<string, unknown> | undefined;
    const message = transaction?.message as Record<string, unknown> | undefined;
    const instructions = Array.isArray(message?.instructions) ? message.instructions : [];
    const accountKeys = Array.isArray(message?.accountKeys) ? message.accountKeys : [];
    const referenceMatched = intent.solanaReference
      ? accountKeys.some(key => typeof key === 'string'
        ? key === intent.solanaReference
        : typeof key === 'object' && key && (key as { pubkey?: unknown }).pubkey === intent.solanaReference)
      : false;

    for (const instruction of instructions) {
      if (!instruction || typeof instruction !== 'object') {
        continue;
      }

      const parsed = (instruction as { parsed?: unknown }).parsed;
      if (!parsed || typeof parsed !== 'object') {
        continue;
      }

      const info = (parsed as { info?: unknown }).info as Record<string, unknown> | undefined;
      const type = (parsed as { type?: unknown }).type;
      if (type !== 'transfer' || !info) {
        continue;
      }

      const destination = String(info.destination ?? '');
      const source = typeof info.source === 'string' ? info.source : null;
      const lamports = String(info.lamports ?? '0');
      const senderFallbackMatches = intent.senderAddress ? source === intent.senderAddress : false;

      if (destination === intent.receiverAddress && (referenceMatched || senderFallbackMatches)) {
        return { source, lamports };
      }
    }

    return null;
  }

  private async findBitcoinMatch(intent: PaymentIntentEntity): Promise<MatchResult> {
    const transactions = await this.alchemyService.getBitcoinAddressTransactions(intent.receiverAddress);

    for (const tx of transactions) {
      const output = tx.outputs.find(item => item.address === intent.receiverAddress);
      if (!output) {
        continue;
      }

      return this.toBitcoinMatch(intent, tx, output);
    }

    return null;
  }

  private toBitcoinMatch(
    intent: PaymentIntentEntity,
    tx: BitcoinAddressTransaction,
    output: { index: number; address: string; valueSats: string },
  ): NonNullable<MatchResult> {
    return {
      status: this.classifyMatchedAmount(
        intent,
        output.valueSats,
        tx.confirmations >= env.btcConfirmations,
        tx.blockTime ? new Date(tx.blockTime * 1000) : null,
      ),
      amountBaseUnits: output.valueSats,
      senderAddress: intent.senderAddress,
      receiverAddress: intent.receiverAddress,
      txHash: tx.txid,
      outputIndex: output.index,
      blockNumber: tx.blockHeight ? String(tx.blockHeight) : null,
      confirmations: tx.confirmations,
      confirmedAt: tx.confirmations >= env.btcConfirmations
        ? tx.blockTime ? new Date(tx.blockTime * 1000) : new Date()
        : null,
      rawPayload: tx.raw,
    };
  }

  private classifyMatchedAmount(
    intent: PaymentIntentEntity,
    actualBaseUnits: string,
    confirmed: boolean,
    matchedAt: Date | null,
  ): PaymentStatus {
    const actual = BigInt(actualBaseUnits);
    const expected = BigInt(intent.expectedAmountBaseUnits);

    if (actual < expected) {
      return PaymentStatus.UNDERPAID;
    }
    if (actual > expected) {
      return PaymentStatus.OVERPAID;
    }
    if ((matchedAt ?? new Date()) > intent.expiresAt) {
      return PaymentStatus.LATE_PAID;
    }

    return confirmed ? PaymentStatus.CONFIRMED : PaymentStatus.CONFIRMING;
  }

  private assertChainAsset(chain: PaymentChain, asset: PaymentAsset): void {
    if (CHAIN_ASSET[chain] !== asset) {
      throw new BadRequestException(`${asset} is not supported on ${chain}`);
    }
  }

  private normalizeSender(chain: PaymentChain, address: string): string {
    const trimmed = address.trim();
    if (!trimmed) {
      throw new BadRequestException('senderAddress cannot be empty');
    }

    if (chain === PaymentChain.ETHEREUM) {
      if (!isAddress(trimmed)) {
        throw new BadRequestException('Invalid EVM senderAddress');
      }
      return normalizeAddress(getAddress(trimmed));
    }

    return trimmed;
  }

  private buildAddressLookupValues(address: string): string[] {
    const trimmed = address.trim();
    if (!trimmed) {
      return [''];
    }

    if (!isAddress(trimmed)) {
      return [trimmed];
    }

    return Array.from(new Set([trimmed, normalizeAddress(getAddress(trimmed))]));
  }

  private applyAddressFilter(
    qb: ReturnType<Repository<PaymentEntity>['createQueryBuilder']>,
    column: string,
    address: string,
    chain?: PaymentChain,
  ): void {
    const values = chain === PaymentChain.ETHEREUM
      ? this.buildEvmAddressLookupValues(address)
      : chain
        ? [address.trim()]
        : this.buildAddressLookupValues(address);

    qb.andWhere(`${column} IN (:...values)`, { values });
  }

  private buildEvmAddressLookupValues(address: string): string[] {
    const trimmed = address.trim();
    return isAddress(trimmed) ? [normalizeAddress(getAddress(trimmed))] : [trimmed];
  }

  private parseTransferTimestamp(value: string | undefined): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private createSolanaReference(): string {
    return bs58.encode(randomBytes(32));
  }

  private async assertBtcIntentLimit(manager: EntityManager, senderAddress: string | null, requestIp?: string): Promise<void> {
    if (!senderAddress && !requestIp) {
      return;
    }

    const buildBaseQuery = () => manager
      .createQueryBuilder(PaymentIntentEntity, 'intent')
      .where('intent.chain = :chain', { chain: PaymentChain.BITCOIN })
      .andWhere('intent.status IN (:...statuses)', {
        statuses: [
          PaymentIntentStatus.WAITING,
          PaymentIntentStatus.DETECTED,
          PaymentIntentStatus.CONFIRMING,
        ],
      });

    if (senderAddress) {
      const senderCount = await buildBaseQuery()
        .andWhere('intent.sender_address = :senderAddress', { senderAddress })
        .getCount();
      if (senderCount >= OPEN_BTC_INTENT_LIMIT) {
        throw new BadRequestException('Too many open BTC payment intents');
      }
    }

    if (requestIp) {
      const ipCount = await buildBaseQuery()
        .andWhere('intent.request_ip = :requestIp', { requestIp })
        .getCount();
      if (ipCount >= OPEN_BTC_INTENT_LIMIT) {
        throw new BadRequestException('Too many open BTC payment intents');
      }
    }
  }

  private canUseCachedStatus(intent: PaymentIntentEntity): boolean {
    if (!intent.lastCheckedAt) {
      return false;
    }

    return Date.now() - intent.lastCheckedAt.getTime() < env.paymentStatusCacheSeconds * 1000;
  }

  private async findPaymentByIntent(intentId: string): Promise<PaymentEntity | null> {
    return this.paymentsRepository.findOne({ where: { intentId } });
  }

  private toStatusDto(intent: PaymentIntentEntity, payment: PaymentEntity | null): PaymentIntentStatusDto {
    return {
      intent: this.toPublicIntent(intent),
      payment: payment ? this.toPublicPayment(payment) : null,
    };
  }

  private toPublicIntent(intent: PaymentIntentEntity): PaymentIntentPublicDto {
    return {
      id: intent.id,
      chain: intent.chain,
      asset: intent.asset,
      tokenAmount: normalizeFixed(intent.tokenAmount),
      usdAmount: normalizeFixed(intent.usdAmount),
      expectedAmountBaseUnits: intent.expectedAmountBaseUnits,
      senderAddress: intent.senderAddress,
      receiverAddress: intent.receiverAddress,
      status: intent.status,
      expiresAt: intent.expiresAt,
      lastCheckedAt: intent.lastCheckedAt,
      instructions: {
        chain: intent.chain,
        asset: intent.asset,
        receiverAddress: intent.receiverAddress,
        expectedAmountBaseUnits: intent.expectedAmountBaseUnits,
        paymentUri: this.buildPaymentUri(intent),
        solanaReference: intent.solanaReference,
      },
    };
  }

  private toPublicPayment(payment: PaymentEntity): PaymentPublicDto {
    return {
      intentId: payment.intentId,
      chain: payment.chain,
      asset: payment.asset,
      amountBaseUnits: payment.amountBaseUnits,
      senderAddress: payment.senderAddress,
      receiverAddress: payment.receiverAddress,
      txHash: payment.txHash,
      status: payment.status,
      blockNumber: payment.blockNumber,
      confirmations: payment.confirmations,
      confirmedAt: payment.confirmedAt,
      createdAt: payment.createdAt,
    };
  }

  private buildPaymentUri(intent: PaymentIntentEntity): string | null {
    switch (intent.chain) {
      case PaymentChain.ETHEREUM:
        return `ethereum:${intent.receiverAddress}@1?value=${intent.expectedAmountBaseUnits}`;
      case PaymentChain.SOLANA: {
        const params = new URLSearchParams({
          amount: formatUnits(intent.expectedAmountBaseUnits, PAYMENT_ASSET_DECIMALS[PaymentAsset.SOL]),
          label: 'FlowDex',
          message: 'FlowDex Presale',
        });
        if (intent.solanaReference) {
          params.set('reference', intent.solanaReference);
        }
        return `solana:${intent.receiverAddress}?${params.toString()}`;
      }
      case PaymentChain.BITCOIN:
        return `bitcoin:${intent.receiverAddress}?amount=${formatUnits(intent.expectedAmountBaseUnits, PAYMENT_ASSET_DECIMALS[PaymentAsset.BTC])}`;
    }
  }

  private redactPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const json = JSON.stringify(payload);
    if (json.length <= 16_000) {
      return JSON.parse(json) as Record<string, unknown>;
    }

    return {
      truncated: true,
      preview: json.slice(0, 16_000),
    };
  }
}
