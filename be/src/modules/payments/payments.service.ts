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
import { TronWeb } from 'tronweb';
import { DataSource, EntityManager, In, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

import { normalizeAddress } from '../../common/utils/address';
import { divideFixed, formatFixed, normalizeFixed, parseFixed } from '../../common/utils/decimal';
import { env } from '../../infrastructure/config/env';
import {
  AlchemyService,
  BitcoinAddressTransaction,
  EvmTransfer,
  TronTransactionInfo,
} from '../alchemy/alchemy.service';
import {
  AdminPaymentFiltersDto,
} from './dto/admin-payments.dto';
import {
  BroadcastPreparedTronTransactionDto,
  BroadcastPreparedTronTransactionResponseDto,
  CreatePaymentIntentDto,
  PaymentCheckoutCapabilitiesDto,
  PaymentCheckoutSessionDto,
  PaymentLeaderDto,
  PaymentLeadersResponseDto,
  PaymentIntentPublicDto,
  PaymentIntentStatusDto,
  PaymentPortfolioBreakdownDto,
  PaymentPortfolioResponseDto,
  PaymentPortfolioTransactionDto,
  PaymentPublicDto,
  PreparedWalletActionDto,
  PreparePaymentWalletActionDto,
  SubmitPaymentTxResultDto,
} from './dto/payments.dto';
import { PaymentIntentEntity } from './entities/payment-intent.entity';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentWalletActionEntity } from './entities/payment-wallet-action.entity';
import {
  CHAIN_ASSET,
  PAYMENT_ASSET_DECIMALS,
  PaymentAsset,
  PaymentChain,
  PaymentIntentStatus,
  PaymentStatus,
  PaymentWalletActionKind,
  PaymentWalletActionStatus,
  PaymentWalletTxIdKind,
  TERMINAL_PAYMENT_INTENT_STATUSES,
} from './payments.types';
import { WalletActionExecutorRegistry } from './wallet-action-executors/wallet-action-executor.registry';
import { assertWalletActionIsUsable, assertWalletIntentIsUsable } from './wallet-action-executors/wallet-checkout.guards';
import { BtcAddressService } from './services/btc-address.service';
import { PaymentCheckoutCapabilityService } from './services/payment-checkout-capability.service';
import { EvmPaymentExecutionService } from './services/evm-payment-execution.service';
import { PaymentPricingService } from './services/payment-pricing.service';
import { PaymentStateService } from './services/payment-state.service';
import { SolanaPaymentExecutionService } from './services/solana-payment-execution.service';
import { TronPaymentExecutionService } from './services/tron-payment-execution.service';

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
const ETHEREUM_MAINNET_CHAIN_ID = 1;
const TRON_TRANSFER_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const MAX_TRON_SCAN_BLOCKS_PER_INTENT = 1_000;
const PORTFOLIO_PENDING_STATUSES = new Set<PaymentIntentStatus>([
  PaymentIntentStatus.WAITING,
  PaymentIntentStatus.DETECTED,
  PaymentIntentStatus.CONFIRMING,
]);
const PORTFOLIO_REVIEW_STATUSES = new Set<PaymentIntentStatus>([
  PaymentIntentStatus.UNDERPAID,
  PaymentIntentStatus.OVERPAID,
  PaymentIntentStatus.LATE_PAID,
]);
const PORTFOLIO_FAILED_STATUSES = new Set<PaymentIntentStatus>([
  PaymentIntentStatus.FAILED,
  PaymentIntentStatus.EXPIRED,
]);

type PortfolioBreakdownAccumulator = {
  totalUsd: bigint;
  tokenAmount: bigint;
  transactionCount: number;
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentsRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepository: Repository<PaymentEntity>,
    @InjectRepository(PaymentWalletActionEntity)
    private readonly paymentWalletActionsRepository: Repository<PaymentWalletActionEntity>,
    private readonly dataSource: DataSource,
    private readonly alchemyService: AlchemyService,
    private readonly pricingService: PaymentPricingService,
    private readonly btcAddressService: BtcAddressService,
    private readonly evmPaymentExecutionService: EvmPaymentExecutionService,
    private readonly solanaPaymentExecutionService: SolanaPaymentExecutionService,
    private readonly tronPaymentExecutionService: TronPaymentExecutionService,
    private readonly stateService: PaymentStateService,
    private readonly walletActionExecutorRegistry: WalletActionExecutorRegistry,
    private readonly checkoutCapabilityService: PaymentCheckoutCapabilityService,
  ) {}

  async createIntent(input: CreatePaymentIntentDto, requestIp?: string): Promise<PaymentCheckoutSessionDto> {
    this.assertChainAsset(input.chain, input.asset);

    if (input.chain === PaymentChain.BITCOIN && !env.btcPaymentsEnabled) {
      throw new BadRequestException('Bitcoin payments are temporarily disabled');
    }

    const senderAddress = input.senderAddress ? this.normalizeSender(input.chain, input.senderAddress) : null;

    if (input.chain === PaymentChain.ETHEREUM && !senderAddress) {
      throw new BadRequestException('ETH senderAddress is required');
    }

    if (input.chain === PaymentChain.TRON && !senderAddress) {
      throw new BadRequestException('TRON senderAddress is required');
    }

    const quote = await this.pricingService.quotePurchase({
      asset: input.asset,
      tokenAmount: input.tokenAmount,
    });

    const capability = this.checkoutCapabilityService.issue();
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
        checkoutTokenHash: capability.tokenHash,
        status: PaymentIntentStatus.WAITING,
        expiresAt: new Date(now.getTime() + env.paymentIntentTtlMinutes * 60_000),
        lastCheckedAt: null,
        lastCheckResult: null,
      };

      const intent = manager.create(PaymentIntentEntity, {
        ...baseIntent,
        ...(await this.buildChainSpecificIntentFields(manager, input.chain)),
      });

      return {
        intent: this.toPublicIntent(await manager.save(intent)),
        checkoutToken: capability.rawToken,
      };
    });
  }

  async getIntentStatus(intentId: string): Promise<PaymentIntentStatusDto> {
    const intent = await this.paymentIntentsRepository.findOne({ where: { id: intentId } });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    return this.toStatusDto(intent, await this.findPaymentByIntent(intent.id));
  }

  getCheckoutCapabilities(): PaymentCheckoutCapabilitiesDto {
    return {
      items: [
        {
          chain: PaymentChain.ETHEREUM,
          asset: PaymentAsset.ETH,
          walletProvider: 'metamask',
          network: 'mainnet',
          decimals: PAYMENT_ASSET_DECIMALS[PaymentAsset.ETH],
          enabled: Boolean(env.ethTreasuryAddress.trim()),
        },
        {
          chain: PaymentChain.SOLANA,
          asset: PaymentAsset.SOL,
          walletProvider: 'metamask_solana',
          network: 'mainnet-beta',
          decimals: PAYMENT_ASSET_DECIMALS[PaymentAsset.SOL],
          enabled: Boolean(env.solTreasuryAddress.trim()),
        },
        {
          chain: PaymentChain.BITCOIN,
          asset: PaymentAsset.BTC,
          walletProvider: 'bitcoin',
          network: 'mainnet',
          decimals: PAYMENT_ASSET_DECIMALS[PaymentAsset.BTC],
          enabled: env.btcPaymentsEnabled,
        },
        {
          chain: PaymentChain.TRON,
          asset: PaymentAsset.USDT_TRC20,
          walletProvider: 'metamask_tron',
          network: 'mainnet',
          decimals: PAYMENT_ASSET_DECIMALS[PaymentAsset.USDT_TRC20],
          enabled: Boolean(env.tronTreasuryAddress.trim()),
        },
      ],
    };
  }

  async prepareWalletAction(
    intentId: string,
    checkoutToken: string,
    input: PreparePaymentWalletActionDto,
  ): Promise<PreparedWalletActionDto> {
    const senderAddress = this.normalizeSender(input.chain, input.senderAddress);
    const intent = await this.paymentIntentsRepository.findOne({ where: { id: intentId } });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }
    this.checkoutCapabilityService.assertCanPrepare(intent, checkoutToken);
    assertWalletIntentIsUsable(intent, senderAddress, input.chain);

    const executor = this.walletActionExecutorRegistry.get(input.chain);
    return executor.prepare({
      intent,
      senderAddress,
      dto: input,
    });
  }

  async submitWalletTxResult(
    intentId: string,
    checkoutToken: string,
    input: SubmitPaymentTxResultDto,
  ): Promise<PaymentIntentStatusDto> {
    const result = await this.dataSource.transaction(async manager => {
      const intent = await manager.findOne(PaymentIntentEntity, { where: { id: intentId } });
      if (!intent) {
        throw new NotFoundException('Payment intent not found');
      }
      this.checkoutCapabilityService.assertCanSubmit(intent, checkoutToken);
      if (intent.chain !== input.chain) {
        throw new BadRequestException('Transaction result chain does not match payment intent');
      }

      const action = await manager.findOne(PaymentWalletActionEntity, {
        where: {
          id: input.preparedActionId,
          paymentIntentId: intent.id,
        },
      });
      if (!action) {
        throw new NotFoundException('Prepared wallet action not found');
      }
      if (!intent.senderAddress || intent.senderAddress !== action.senderAddress) {
        throw new BadRequestException('Prepared wallet action does not match payment intent sender');
      }

      const executor = this.walletActionExecutorRegistry.get(input.chain);
      executor.assertTxId(input.txIdKind, input.txId);

      if (action.status === PaymentWalletActionStatus.SUBMITTED && action.txId === input.txId) {
        return {
          intent,
          payment: await manager.findOne(PaymentEntity, { where: { intentId: intent.id } }),
        };
      }
      assertWalletActionIsUsable(action, action.senderAddress, input.chain);

      const duplicate = await manager.findOne(PaymentWalletActionEntity, {
        where: {
          txIdKind: input.txIdKind,
          txId: input.txId,
        },
      });
      if (duplicate && duplicate.paymentIntentId !== intent.id) {
        throw new BadRequestException('Transaction hash is already attached to another payment intent');
      }

      const duplicatePayment = await manager.findOne(PaymentEntity, {
        where: {
          chain: input.chain,
          txHash: input.txId,
        },
      });
      if (duplicatePayment && duplicatePayment.intentId !== intent.id) {
        throw new BadRequestException('Transaction hash is already attached to another payment intent');
      }

      const existingPayment = await manager.findOne(PaymentEntity, { where: { intentId: intent.id } });
      if (existingPayment && existingPayment.txHash !== input.txId) {
        throw new BadRequestException('Payment intent already has a submitted transaction');
      }

      action.status = PaymentWalletActionStatus.SUBMITTED;
      action.txId = input.txId;
      action.txIdKind = input.txIdKind;
      action.usedAt = null;
      await manager.save(action);

      const payment = manager.create(PaymentEntity, {
        ...(existingPayment ?? {}),
        intentId: intent.id,
        chain: intent.chain,
        asset: intent.asset,
        amountBaseUnits: intent.expectedAmountBaseUnits,
        senderAddress: intent.senderAddress,
        receiverAddress: intent.receiverAddress,
        txHash: input.txId,
        outputIndex: null,
        status: PaymentStatus.CONFIRMING,
        blockNumber: null,
        confirmations: 0,
        confirmedAt: null,
        rawPayload: {
          source: 'wallet_tx_result',
          preparedActionId: action.id,
          txIdKind: input.txIdKind,
        },
      });
      await manager.save(payment);

      this.stateService.assertIntentTransition(intent.status, PaymentIntentStatus.CONFIRMING);
      intent.status = PaymentIntentStatus.CONFIRMING;
      intent.lastCheckedAt = null;
      intent.lastCheckResult = {
        source: 'WALLET_TX_RESULT',
        status: PaymentStatus.CONFIRMING,
        txHash: input.txId,
      };
      const savedIntent = await manager.save(intent);

      return {
        intent: savedIntent,
        payment,
      };
    });

    return this.toStatusDto(result.intent, result.payment ?? await this.findPaymentByIntent(result.intent.id));
  }

  async broadcastPreparedTronTransaction(
    intentId: string,
    preparedActionId: string,
    checkoutToken: string,
    input: BroadcastPreparedTronTransactionDto,
  ): Promise<BroadcastPreparedTronTransactionResponseDto> {
    const intent = await this.paymentIntentsRepository.findOne({ where: { id: intentId } });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }
    this.checkoutCapabilityService.assertCanSubmit(intent, checkoutToken);
    if (intent.chain !== PaymentChain.TRON) {
      throw new BadRequestException('Prepared wallet action is not a TRON payment');
    }

    const action = await this.paymentWalletActionsRepository.findOne({
      where: { id: preparedActionId, paymentIntentId: intent.id },
    });
    if (!action) {
      throw new NotFoundException('Prepared wallet action not found');
    }
    if (
      action.chain !== PaymentChain.TRON
      || action.actionKind !== PaymentWalletActionKind.TRON_TRANSACTION
      || action.senderAddress !== intent.senderAddress
    ) {
      throw new BadRequestException('Prepared TRON wallet action does not match payment intent');
    }

    if (action.txId) {
      this.tronPaymentExecutionService.assertTxIdFormat(action.txId);
      return { txId: action.txId };
    }

    assertWalletActionIsUsable(action, action.senderAddress, PaymentChain.TRON);
    const prepared = this.tronPaymentExecutionService.parsePreparedTransfer(action.requestJson);
    this.tronPaymentExecutionService.assertSignedTransactionMatchesPrepared(
      prepared,
      input.signedTransaction,
    );

    const txId = await this.alchemyService.broadcastTronTransaction(input.signedTransaction);
    if (!txId) {
      throw new ServiceUnavailableException('TRON wallet transaction broadcast failed');
    }
    this.tronPaymentExecutionService.assertTxIdFormat(txId);
    if (txId !== prepared.unsignedTransaction.txID) {
      throw new BadRequestException('Broadcast TRON transaction id does not match the prepared payment');
    }

    action.txId = txId;
    action.txIdKind = PaymentWalletTxIdKind.TRON_TX_HASH;
    await this.paymentWalletActionsRepository.save(action);

    return { txId };
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

  async getPublicPortfolio(walletAddress: string): Promise<PaymentPortfolioResponseDto> {
    const addresses = this.buildAddressLookupValues(walletAddress);
    const intents = await this.paymentIntentsRepository.find({
      where: addresses.map(senderAddress => ({ senderAddress })),
      order: { createdAt: 'DESC' },
    });
    const payments = intents.length
      ? await this.paymentsRepository.find({ where: { intentId: In(intents.map(intent => intent.id)) } })
      : [];
    const paymentsByIntentId = new Map(payments.map(payment => [payment.intentId, payment]));
    const byAsset = new Map<string, PortfolioBreakdownAccumulator>();
    const byChain = new Map<string, PortfolioBreakdownAccumulator>();
    const byStatus = new Map<string, PortfolioBreakdownAccumulator>();
    let totalInvestedUsd = 0n;
    let confirmedTokenAmount = 0n;
    let pendingTokenAmount = 0n;
    let reviewTokenAmount = 0n;
    let confirmedTransactions = 0;
    let pendingTransactions = 0;
    let reviewTransactions = 0;
    let failedTransactions = 0;
    let firstPaymentAt: Date | null = null;
    let latestPaymentAt: Date | null = null;

    const transactions = intents.map((intent): PaymentPortfolioTransactionDto => {
      const payment = paymentsByIntentId.get(intent.id) ?? null;
      const tokenAmount = parseFixed(intent.tokenAmount);
      const usdAmount = parseFixed(intent.usdAmount);

      firstPaymentAt = firstPaymentAt && firstPaymentAt < intent.createdAt ? firstPaymentAt : intent.createdAt;
      latestPaymentAt = latestPaymentAt && latestPaymentAt > intent.createdAt ? latestPaymentAt : intent.createdAt;
      this.addPortfolioBreakdown(byStatus, intent.status, usdAmount, tokenAmount);

      if (intent.status === PaymentIntentStatus.CONFIRMED) {
        totalInvestedUsd += usdAmount;
        confirmedTokenAmount += tokenAmount;
        confirmedTransactions += 1;
        this.addPortfolioBreakdown(byAsset, intent.asset, usdAmount, tokenAmount);
        this.addPortfolioBreakdown(byChain, intent.chain, usdAmount, tokenAmount);
      } else if (PORTFOLIO_PENDING_STATUSES.has(intent.status)) {
        pendingTokenAmount += tokenAmount;
        pendingTransactions += 1;
      } else if (PORTFOLIO_REVIEW_STATUSES.has(intent.status)) {
        reviewTokenAmount += tokenAmount;
        reviewTransactions += 1;
      } else if (PORTFOLIO_FAILED_STATUSES.has(intent.status)) {
        failedTransactions += 1;
      }

      return this.toPortfolioTransaction(intent, payment);
    });

    return {
      walletAddress,
      summary: {
        totalInvestedUsd: formatFixed(totalInvestedUsd),
        confirmedTokenAmount: formatFixed(confirmedTokenAmount),
        pendingTokenAmount: formatFixed(pendingTokenAmount),
        reviewTokenAmount: formatFixed(reviewTokenAmount),
        totalTransactions: intents.length,
        confirmedTransactions,
        pendingTransactions,
        reviewTransactions,
        failedTransactions,
        averageEntryPriceUsd: confirmedTokenAmount > 0n
          ? divideFixed(formatFixed(totalInvestedUsd), formatFixed(confirmedTokenAmount))
          : '0',
        firstPaymentAt,
        latestPaymentAt,
      },
      breakdowns: {
        byAsset: this.toPortfolioBreakdowns(byAsset),
        byChain: this.toPortfolioBreakdowns(byChain),
        byStatus: this.toPortfolioBreakdowns(byStatus),
      },
      transactions,
    };
  }

  async listAdminPayments(filters: AdminPaymentFiltersDto): Promise<{ items: Array<PaymentPublicDto & {
    rawPayload: Record<string, unknown> | null;
    tokenAmount: string;
    usdAmount: string;
  }> }> {
    const qb = this.paymentIntentsRepository.createQueryBuilder('intent');

    if (filters.chain) {
      qb.andWhere('intent.chain = :chain', { chain: filters.chain });
    }
    if (filters.asset) {
      qb.andWhere('intent.asset = :asset', { asset: filters.asset });
    }
    if (filters.status) {
      qb.andWhere('intent.status = :status', { status: filters.status });
    }
    if (filters.senderAddress) {
      this.applyAddressFilter(qb, 'intent.sender_address', filters.senderAddress, filters.chain);
    }
    if (filters.receiverAddress) {
      this.applyAddressFilter(qb, 'intent.receiver_address', filters.receiverAddress, filters.chain);
    }
    if (filters.from) {
      qb.andWhere('intent.created_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('intent.created_at <= :to', { to: filters.to });
    }

    const intents = await qb.orderBy('intent.created_at', 'DESC').getMany();
    if (!intents.length) {
      return { items: [] };
    }

    const payments = await this.paymentsRepository.find({
      where: { intentId: In(intents.map(intent => intent.id)) },
    });
    const paymentsByIntentId = new Map(payments.map(payment => [payment.intentId, payment]));

    return {
      items: intents.map(intent => this.toAdminListItem(intent, paymentsByIntentId.get(intent.id) ?? null)),
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
          try {
            await this.checkAndPersistIntent(intent);
          } catch {
            // A malformed provider response for one checkout must not prevent the remaining batch from reconciling.
          }
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
      case PaymentChain.TRON: {
        const blockNumber = await this.alchemyService.getTronSolidBlockNumber();
        if (blockNumber === null) {
          throw new ServiceUnavailableException('TRON_BLOCK_HEIGHT_UNAVAILABLE');
        }

        return {
          receiverAddress: this.normalizeTronAddress(env.tronTreasuryAddress, 'TRON treasury address'),
          tronCreatedBlockNumber: String(blockNumber),
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

    const submittedAction = await this.paymentWalletActionsRepository.findOne({
      where: {
        paymentIntentId: intent.id,
        status: PaymentWalletActionStatus.SUBMITTED,
      },
      order: { createdAt: 'DESC' },
    });

    if (intent.expiresAt <= new Date() && !submittedAction) {
      this.stateService.assertIntentTransition(intent.status, PaymentIntentStatus.EXPIRED);
      intent.status = PaymentIntentStatus.EXPIRED;
      intent.lastCheckedAt = new Date();
      intent.lastCheckResult = { reason: 'EXPIRED' };
      return this.paymentIntentsRepository.save(intent);
    }

    const match = await this.findMatch(intent, submittedAction);
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

      if (match.txHash) {
        const action = await manager.findOne(PaymentWalletActionEntity, {
          where: {
            paymentIntentId: intent.id,
            txId: match.txHash,
            status: PaymentWalletActionStatus.SUBMITTED,
          },
        });
        if (action) {
          action.status = PaymentWalletActionStatus.USED;
          action.usedAt = new Date();
          await manager.save(action);
        }
      }

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

  private async findMatch(
    intent: PaymentIntentEntity,
    submittedAction: PaymentWalletActionEntity | null,
  ): Promise<MatchResult> {
    switch (intent.chain) {
      case PaymentChain.ETHEREUM:
        return this.findEthereumMatch(intent);
      case PaymentChain.SOLANA:
        return this.findSubmittedSolanaPaymentMatch(intent);
      case PaymentChain.BITCOIN:
        return this.findBitcoinMatch(intent, submittedAction?.txId ?? null);
      case PaymentChain.TRON:
        return this.findTronUsdtMatch(intent, submittedAction?.txId ?? null);
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

  private async findSubmittedSolanaPaymentMatch(intent: PaymentIntentEntity): Promise<MatchResult> {
    const payment = await this.findPaymentByIntent(intent.id);
    if (!payment?.txHash || payment.status !== PaymentStatus.CONFIRMING) {
      return null;
    }

    const payer = payment.senderAddress ?? intent.senderAddress;
    if (!payer) {
      return null;
    }

    const verification = await this.solanaPaymentExecutionService.verifySolanaSignatureForIntent({
      signature: payment.txHash,
      payer,
      recipientAddress: payment.receiverAddress || intent.receiverAddress,
      lamports: payment.amountBaseUnits || intent.expectedAmountBaseUnits,
      memoOrReference: intent.solanaReference ?? intent.id,
    });

    if (verification.status === 'not_found') {
      return {
        status: PaymentStatus.CONFIRMING,
        amountBaseUnits: payment.amountBaseUnits,
        senderAddress: payer,
        receiverAddress: payment.receiverAddress,
        txHash: payment.txHash,
        outputIndex: null,
        blockNumber: payment.blockNumber,
        confirmations: 0,
        confirmedAt: null,
        rawPayload: { source: 'wallet_tx_result_poll', verification },
      };
    }

    if (verification.status === 'invalid') {
      return {
        status: PaymentStatus.FAILED,
        amountBaseUnits: payment.amountBaseUnits,
        senderAddress: payer,
        receiverAddress: payment.receiverAddress,
        txHash: payment.txHash,
        outputIndex: null,
        blockNumber: payment.blockNumber,
        confirmations: payment.confirmations,
        confirmedAt: null,
        rawPayload: { source: 'wallet_tx_result_poll', verification },
      };
    }

    if (verification.status === 'confirming') {
      return {
        status: PaymentStatus.CONFIRMING,
        amountBaseUnits: payment.amountBaseUnits,
        senderAddress: payer,
        receiverAddress: payment.receiverAddress,
        txHash: payment.txHash,
        outputIndex: null,
        blockNumber: payment.blockNumber,
        confirmations: verification.confirmations,
        confirmedAt: null,
        rawPayload: { source: 'wallet_tx_result_poll', verification },
      };
    }

    return {
      status: this.classifyMatchedAmount(
        intent,
        payment.amountBaseUnits,
        true,
        verification.confirmedAt,
      ),
      amountBaseUnits: payment.amountBaseUnits,
      senderAddress: payer,
      receiverAddress: payment.receiverAddress,
      txHash: payment.txHash,
      outputIndex: null,
      blockNumber: verification.blockNumber,
      confirmations: verification.confirmations,
      confirmedAt: verification.confirmedAt,
      rawPayload: { source: 'wallet_tx_result_poll', verification },
    };
  }

  private async findTronUsdtMatch(intent: PaymentIntentEntity, submittedTxId: string | null): Promise<MatchResult> {
    if (!intent.senderAddress || !intent.tronCreatedBlockNumber) {
      return null;
    }

    const latestBlock = await this.alchemyService.getTronSolidBlockNumber();
    if (latestBlock === null) {
      return null;
    }

    const createdBlock = Number(intent.tronCreatedBlockNumber);
    if (!Number.isInteger(createdBlock) || createdBlock <= 0) {
      return null;
    }

    const endBlock = Math.min(latestBlock, createdBlock + MAX_TRON_SCAN_BLOCKS_PER_INTENT);
    const expected = {
      contractHex: this.toTronLogAddressHex(env.tronUsdtContractAddress, 'TRON USDT contract address'),
      senderHex: this.toTronLogAddressHex(intent.senderAddress, 'TRON senderAddress'),
      receiverHex: this.toTronLogAddressHex(intent.receiverAddress, 'TRON receiverAddress'),
      amountBaseUnits: intent.expectedAmountBaseUnits,
    };

    if (submittedTxId) {
      const transaction = await this.alchemyService.getTronTransactionInfoById(submittedTxId);
      if (!transaction) {
        return null;
      }
      const match = this.extractTronUsdtTransferMatch(transaction, expected);
      if (!match) {
        return {
          status: PaymentStatus.FAILED,
          amountBaseUnits: intent.expectedAmountBaseUnits,
          senderAddress: intent.senderAddress,
          receiverAddress: intent.receiverAddress,
          txHash: submittedTxId,
          outputIndex: null,
          blockNumber: transaction.blockNumber ? String(transaction.blockNumber) : null,
          confirmations: 0,
          confirmedAt: null,
          rawPayload: { source: 'ALCHEMY_TRON', reason: 'SUBMITTED_TRANSACTION_MISMATCH' },
        };
      }
      return this.toTronMatch(intent, transaction, match.amountBaseUnits, latestBlock);
    }

    for (let blockNumber = createdBlock; blockNumber <= endBlock; blockNumber += 1) {
      const transactions = await this.alchemyService.getTronTransactionInfoByBlockNumber(blockNumber);
      for (const transaction of transactions) {
        const match = this.extractTronUsdtTransferMatch(transaction, expected);
        if (match) {
          return this.toTronMatch(intent, transaction, match.amountBaseUnits, latestBlock);
        }
      }
    }

    return null;
  }

  private extractTronUsdtTransferMatch(
    transaction: TronTransactionInfo,
    expected: {
      contractHex: string;
      senderHex: string;
      receiverHex: string;
      amountBaseUnits: string;
    },
  ): { amountBaseUnits: string } | null {
    for (const log of transaction.logs) {
      const contractHex = this.normalizeTronLogAddressHex(log.address);
      if (contractHex !== expected.contractHex) {
        continue;
      }

      const transferTopic = this.normalizeHex(log.topics[0]);
      const senderHex = this.topicToTronLogAddressHex(log.topics[1]);
      const receiverHex = this.topicToTronLogAddressHex(log.topics[2]);
      const amountBaseUnits = this.parseTronLogUint256(log.data);

      if (
        transferTopic === TRON_TRANSFER_TOPIC
        && senderHex === expected.senderHex
        && receiverHex === expected.receiverHex
        && amountBaseUnits === expected.amountBaseUnits
      ) {
        return { amountBaseUnits };
      }
    }

    return null;
  }

  private toTronMatch(
    intent: PaymentIntentEntity,
    transaction: TronTransactionInfo,
    amountBaseUnits: string,
    latestBlock: number,
  ): NonNullable<MatchResult> {
    const blockNumber = transaction.blockNumber ?? 0;
    const confirmations = blockNumber > 0 ? Math.max(0, latestBlock - blockNumber + 1) : 0;
    const matchedAt = transaction.blockTimeStamp ? new Date(transaction.blockTimeStamp) : null;
    const receiptResult = transaction.receiptResult?.toUpperCase() ?? null;
    const baseStatus = receiptResult && receiptResult !== 'SUCCESS'
      ? PaymentStatus.FAILED
      : this.classifyMatchedAmount(
          intent,
          amountBaseUnits,
          confirmations >= env.tronConfirmations,
          matchedAt,
        );

    return {
      status: baseStatus,
      amountBaseUnits,
      senderAddress: intent.senderAddress,
      receiverAddress: intent.receiverAddress,
      txHash: transaction.id,
      outputIndex: null,
      blockNumber: blockNumber > 0 ? String(blockNumber) : null,
      confirmations,
      confirmedAt: confirmations >= env.tronConfirmations ? matchedAt ?? new Date() : null,
      rawPayload: {
        source: 'ALCHEMY_TRON',
        ...transaction.raw,
      },
    };
  }

  private async findBitcoinMatch(intent: PaymentIntentEntity, submittedTxId: string | null): Promise<MatchResult> {
    const transactions = await this.alchemyService.getBitcoinAddressTransactions(intent.receiverAddress);

    for (const tx of transactions) {
      if (submittedTxId && tx.txid.toLowerCase() !== submittedTxId.toLowerCase()) {
        continue;
      }
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

    if (chain === PaymentChain.SOLANA) {
      return this.solanaPaymentExecutionService.normalizePublicKey(trimmed, 'senderAddress');
    }

    if (chain === PaymentChain.TRON) {
      return this.normalizeTronAddress(trimmed, 'senderAddress');
    }

    return trimmed;
  }

  private normalizeTronAddress(address: string, label: string): string {
    const trimmed = address.trim();
    if (!trimmed || !TronWeb.isAddress(trimmed)) {
      throw new BadRequestException(`Invalid ${label}`);
    }

    return TronWeb.address.fromHex(TronWeb.address.toHex(trimmed));
  }

  private toTronLogAddressHex(address: string, label: string): string {
    const normalized = this.normalizeTronAddress(address, label);
    return this.normalizeTronLogAddressHex(TronWeb.address.toHex(normalized));
  }

  private normalizeTronLogAddressHex(value: string | null | undefined): string {
    const normalized = this.normalizeHex(value);
    if (normalized.length === 42 && normalized.startsWith('41')) {
      return normalized.slice(2);
    }

    return normalized.length === 40 ? normalized : '';
  }

  private topicToTronLogAddressHex(value: string | null | undefined): string {
    const normalized = this.normalizeHex(value);
    return normalized.length >= 40 ? normalized.slice(-40) : '';
  }

  private normalizeHex(value: string | null | undefined): string {
    return (value ?? '').trim().replace(/^0x/iu, '').toLowerCase();
  }

  private parseTronLogUint256(value: string | null | undefined): string {
    const normalized = this.normalizeHex(value);
    if (!/^[0-9a-f]+$/u.test(normalized)) {
      return '0';
    }

    return BigInt(`0x${normalized}`).toString();
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
    qb: SelectQueryBuilder<ObjectLiteral>,
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

  private toAdminListItem(
    intent: PaymentIntentEntity,
    payment: PaymentEntity | null,
  ): PaymentPublicDto & {
    rawPayload: Record<string, unknown> | null;
    tokenAmount: string;
    usdAmount: string;
  } {
    return {
      intentId: intent.id,
      chain: intent.chain,
      asset: intent.asset,
      amountBaseUnits: payment?.amountBaseUnits ?? intent.expectedAmountBaseUnits,
      senderAddress: payment?.senderAddress ?? intent.senderAddress,
      receiverAddress: payment?.receiverAddress ?? intent.receiverAddress,
      txHash: payment?.txHash ?? null,
      status: intent.status as unknown as PaymentStatus,
      blockNumber: payment?.blockNumber ?? null,
      confirmations: payment?.confirmations ?? 0,
      confirmedAt: payment?.confirmedAt ?? null,
      createdAt: intent.createdAt,
      rawPayload: payment?.rawPayload ?? intent.lastCheckResult,
      tokenAmount: normalizeFixed(intent.tokenAmount),
      usdAmount: normalizeFixed(intent.usdAmount),
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

  private toPortfolioTransaction(intent: PaymentIntentEntity, payment: PaymentEntity | null): PaymentPortfolioTransactionDto {
    return {
      intentId: intent.id,
      chain: intent.chain,
      asset: intent.asset,
      tokenAmount: normalizeFixed(intent.tokenAmount),
      usdAmount: normalizeFixed(intent.usdAmount),
      expectedAmountBaseUnits: intent.expectedAmountBaseUnits,
      paidAmountBaseUnits: payment?.amountBaseUnits ?? null,
      senderAddress: intent.senderAddress,
      receiverAddress: intent.receiverAddress,
      txHash: payment?.txHash ?? null,
      intentStatus: intent.status,
      paymentStatus: payment?.status ?? null,
      confirmations: payment?.confirmations ?? 0,
      createdAt: intent.createdAt,
      confirmedAt: payment?.confirmedAt ?? null,
      expiresAt: intent.expiresAt,
    };
  }

  private addPortfolioBreakdown(
    breakdowns: Map<string, PortfolioBreakdownAccumulator>,
    key: string,
    totalUsd: bigint,
    tokenAmount: bigint,
  ): void {
    const current = breakdowns.get(key) ?? {
      totalUsd: 0n,
      tokenAmount: 0n,
      transactionCount: 0,
    };
    breakdowns.set(key, {
      totalUsd: current.totalUsd + totalUsd,
      tokenAmount: current.tokenAmount + tokenAmount,
      transactionCount: current.transactionCount + 1,
    });
  }

  private toPortfolioBreakdowns(breakdowns: Map<string, PortfolioBreakdownAccumulator>): PaymentPortfolioBreakdownDto[] {
    return Array.from(breakdowns.entries()).map(([key, value]) => ({
      key,
      totalUsd: formatFixed(value.totalUsd),
      tokenAmount: formatFixed(value.tokenAmount),
      transactionCount: value.transactionCount,
    }));
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
      case PaymentChain.TRON: {
        const params = new URLSearchParams({
          amount: formatUnits(intent.expectedAmountBaseUnits, PAYMENT_ASSET_DECIMALS[PaymentAsset.USDT_TRC20]),
          asset: PaymentAsset.USDT_TRC20,
        });
        return `tron:${intent.receiverAddress}?${params.toString()}`;
      }
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
