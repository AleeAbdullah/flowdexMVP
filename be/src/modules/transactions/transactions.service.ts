import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { getAddress, parseUnits } from 'ethers';
import { addFixed, compareFixed, normalizeFixed } from '../../common/utils/decimal';
import { In, Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { LedgerTxStatus } from '../../common/enums/domain.enums';
import { normalizeAddress } from '../../common/utils/address';
import { assertNetworkChainPair, chainIdForNetwork, isSupportedNetwork } from '../../common/utils/network';
import { env } from '../../infrastructure/config/env';
import { AlchemyService } from '../alchemy/alchemy.service';
import { UsersService } from '../users/users.service';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { SimulateTransactionDto, TrackTransactionDto, TransactionListItemDto } from './dto/transactions.dto';
import { AnalyticsSnapshotEntity } from './entities/analytics-snapshot.entity';
import { LedgerTransactionEntity } from './entities/ledger-transaction.entity';
import { SyncCheckpointEntity } from './entities/sync-checkpoint.entity';
import { WebhookDeliveryEntity } from './entities/webhook-delivery.entity';

const ACTIVE_LEDGER_STATUSES = new Set(['SUBMITTED', 'PENDING']);
const SUPPORTED_APP_NETWORKS = new Set(['ETH_SEPOLIA', 'BASE_SEPOLIA']);
const SIMULATION_TOKEN_MAX_AGE_SECONDS = 10 * 60;
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

type ActivityEvent = {
  txHash: string | null;
  from: string | null;
  to: string | null;
  value: string;
  asset: string;
  network: string | null;
  chainId: number | null;
  blockNumber: string | null;
  blockTime: Date | null;
  status: string;
};

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(LedgerTransactionEntity)
    private readonly ledgerTransactionsRepository: Repository<LedgerTransactionEntity>,
    @InjectRepository(WebhookDeliveryEntity)
    private readonly webhookDeliveriesRepository: Repository<WebhookDeliveryEntity>,
    @InjectRepository(SyncCheckpointEntity)
    private readonly syncCheckpointsRepository: Repository<SyncCheckpointEntity>,
    @InjectRepository(AnalyticsSnapshotEntity)
    private readonly analyticsSnapshotsRepository: Repository<AnalyticsSnapshotEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    private readonly usersService: UsersService,
    private readonly alchemyService: AlchemyService,
  ) {}

  async simulate(
    auth: AuthContext,
    input: SimulateTransactionDto,
  ): Promise<{ allowed: boolean; reason: string | null; simulationId: string | null }> {
    await this.usersService.syncAndRequireActive(auth);
    assertNetworkChainPair(input.network, input.chainId);

    const wallet = await this.requireOwnedWallet(auth.sub, input.walletId, input.network, input.chainId);
    const recipient = this.normalizeRecipient(input.to);
    this.assertTreasuryRecipient(input.network, recipient);
    const result = await this.alchemyService.simulateTransaction({
      network: this.toAlchemyNetwork(input.network),
      from: wallet.addressNormalized,
      to: recipient,
      value: input.value,
      data: input.data,
    });

    return {
      allowed: result.allowed,
      reason: result.reason,
      simulationId: result.allowed
        ? this.createSimulationToken(
          auth.sub,
          wallet.id,
          input.network,
          input.chainId,
          recipient,
          input.value,
          input.data,
        )
        : null,
    };
  }

  async track(
    auth: AuthContext,
    input: TrackTransactionDto,
  ): Promise<{ transactionId: string; status: string }> {
    await this.usersService.syncAndRequireActive(auth);
    assertNetworkChainPair(input.network, input.chainId);

    const wallet = await this.requireOwnedWallet(auth.sub, input.walletId, input.network, input.chainId);
    const recipient = this.normalizeRecipient(input.to);
    this.assertTreasuryRecipient(input.network, recipient);
    this.assertSimulationToken(
      input.simulationId,
      auth.sub,
      wallet.id,
      input.network,
      input.chainId,
      recipient,
      input.value,
      input.data,
    );

    const operationId = input.operationId?.trim() || null;
    const txHash = input.txHash?.trim() || null;
    const normalizedAmount = normalizeFixed(input.amount);

    if (!operationId && !txHash) {
      throw new BadRequestException('Either operationId or txHash is required');
    }

    if (txHash && !TX_HASH_PATTERN.test(txHash)) {
      throw new BadRequestException('txHash must be a 32-byte hex hash');
    }

    if (compareFixed(normalizedAmount, '0') <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    const existing = await this.findExistingTrackedTransaction(wallet.id, input.chainId, operationId, txHash);
    if (existing) {
      return {
        transactionId: existing.id,
        status: existing.status,
      };
    }

    const entity = this.ledgerTransactionsRepository.create({
      userId: auth.sub,
      walletId: wallet.id,
      network: input.network,
      chainId: input.chainId,
      assetCode: input.assetCode.trim().toUpperCase(),
      amount: normalizedAmount,
      status: txHash ? 'PENDING' : 'SUBMITTED',
      operationId,
      txHash,
      failureReason: null,
      rawTrackPayload: input as unknown as Record<string, unknown>,
    });

    const saved = await this.ledgerTransactionsRepository.save(entity);
    await this.refreshAnalyticsSnapshot(auth.sub);

    return {
      transactionId: saved.id,
      status: saved.status,
    };
  }

  async listForUser(auth: AuthContext): Promise<{ items: TransactionListItemDto[] }> {
    await this.usersService.syncAndRequireActive(auth);

    const items = await this.ledgerTransactionsRepository.find({
      where: { userId: auth.sub },
      order: { createdAt: 'DESC' },
    });

    return {
      items: await Promise.all(items.map(item => this.toDto(item))),
    };
  }

  async getForUser(auth: AuthContext, id: string): Promise<TransactionListItemDto> {
    await this.usersService.syncAndRequireActive(auth);

    const item = await this.ledgerTransactionsRepository.findOne({
      where: { id, userId: auth.sub },
    });

    if (!item) {
      throw new NotFoundException('Transaction not found');
    }

    return this.toDto(item);
  }

  async listAll(filters?: {
    status?: string;
    network?: string;
    assetCode?: string;
    userId?: string;
    from?: string;
    to?: string;
  }): Promise<{ items: TransactionListItemDto[] }> {
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
    if (filters?.userId) {
      qb.andWhere('tx.user_id = :userId', { userId: filters.userId });
    }
    if (filters?.from) {
      qb.andWhere('tx.created_at >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('tx.created_at <= :to', { to: filters.to });
    }

    const items = await qb.orderBy('tx.created_at', 'DESC').getMany();

    return {
      items: await Promise.all(items.map(item => this.toDto(item))),
    };
  }

  async getById(id: string): Promise<TransactionListItemDto> {
    const item = await this.ledgerTransactionsRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Transaction not found');
    }
    return this.toDto(item);
  }

  async reconcileById(id: string): Promise<TransactionListItemDto> {
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

    const network = this.toAlchemyNetwork(tx.network);
    const chainId = tx.chainId ?? chainIdForNetwork(tx.network);
    const chainTx = await this.alchemyService.getTransactionByHash(network, tx.txHash);
    const receipt = await this.alchemyService.getTransactionReceipt(network, tx.txHash);

    if (!chainTx) {
      return this.toDto(tx);
    }

    const activity: ActivityEvent = {
      txHash: chainTx.hash,
      from: chainTx.from,
      to: chainTx.to,
      value: this.hexToDecimal(chainTx.value),
      asset: 'ETH',
      network: tx.network,
      chainId,
      blockNumber: receipt?.blockNumber ?? chainTx.blockNumber,
      blockTime: null,
      status: receipt?.blockNumber ? 'CONFIRMED' : 'PENDING',
    };

    await this.processSettlementActivity(activity, {
      source: 'ADMIN_RECONCILE',
      txHash: tx.txHash,
      tx: chainTx,
      receipt,
    });

    const refreshed = await this.ledgerTransactionsRepository.findOne({ where: { id } });
    if (!refreshed) {
      throw new NotFoundException('Transaction not found after reconciliation');
    }

    return this.toDto(refreshed);
  }

  async ingestAddressActivityWebhook(
    payload: Record<string, unknown>,
    signature: string,
  ): Promise<{ received: true; duplicate: boolean }> {
    const dedupeKey = this.buildWebhookDedupeKey(payload);
    const existing = await this.webhookDeliveriesRepository.findOne({
      where: { dedupeKey },
    });

    if (existing) {
      return { received: true, duplicate: true };
    }

    const delivery = await this.webhookDeliveriesRepository.save(
      this.webhookDeliveriesRepository.create({
        source: 'ALCHEMY_ADDRESS_ACTIVITY',
        dedupeKey,
        status: 'RECEIVED',
        signature,
        rawPayload: payload,
      }),
    );

    try {
      const activities = this.extractActivities(payload);
      const affectedUsers = new Set<string>();

      for (const activity of activities) {
        const userId = await this.processSettlementActivity(activity, payload);
        if (userId) {
          affectedUsers.add(userId);
        }
      }

      for (const userId of affectedUsers) {
        await this.refreshAnalyticsSnapshot(userId);
      }

      delivery.status = 'PROCESSED';
      delivery.processedAt = new Date();
      await this.webhookDeliveriesRepository.save(delivery);

      return { received: true, duplicate: false };
    } catch (error) {
      delivery.status = 'FAILED';
      delivery.processingError = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      delivery.processedAt = new Date();
      await this.webhookDeliveriesRepository.save(delivery);
      throw error;
    }
  }

  @Cron('0 */10 * * * *')
  async backfillTransfers(): Promise<void> {
    if (!this.alchemyService.hasApiKey()) {
      return;
    }

    const wallets = await this.walletsRepository.find({
      where: {
        network: In(['ETH_SEPOLIA', 'BASE_SEPOLIA']),
      },
      take: 100,
    });

    for (const wallet of wallets) {
      if (!wallet.network) {
        continue;
      }

      const checkpoint = await this.getOrCreateCheckpoint(wallet.id, wallet.network);
      const result = await this.alchemyService.getAssetTransfers({
        network: this.toAlchemyNetwork(wallet.network),
        address: wallet.addressNormalized,
        pageKey: checkpoint.lastPageKey ?? undefined,
      });

      for (const transfer of result.transfers) {
        const activity = this.toActivityEvent(transfer, wallet.network);
        await this.processSettlementActivity(activity, transfer);
      }

      checkpoint.lastPageKey = result.pageKey;
      checkpoint.lastSyncedAt = new Date();
      await this.syncCheckpointsRepository.save(checkpoint);

      await this.refreshAnalyticsSnapshot(wallet.userId);
    }
  }

  async refreshAnalyticsSnapshot(userId: string): Promise<void> {
    const [walletCount, txs, existingSnapshot] = await Promise.all([
      this.walletsRepository.count({
        where: {
          userId,
          network: In(['ETH_SEPOLIA', 'BASE_SEPOLIA']),
        },
      }),
      this.ledgerTransactionsRepository.find({
        where: { userId },
      }),
      this.analyticsSnapshotsRepository.findOne({
        where: { userId },
      }),
    ]);

    const confirmed = txs.filter(tx => tx.status === 'CONFIRMED');
    const pending = txs.filter(tx => ACTIVE_LEDGER_STATUSES.has(tx.status));
    const totalVolume = confirmed.reduce((sum, tx) => addFixed(sum, tx.amount), '0');
    const lastTransactionAt = txs.length > 0
      ? txs.reduce((latest, tx) => (tx.updatedAt > latest ? tx.updatedAt : latest), txs[0].updatedAt)
      : null;

    const snapshot = existingSnapshot ?? this.analyticsSnapshotsRepository.create({ userId });
    snapshot.linkedWalletCount = walletCount;
    snapshot.totalTransactionCount = txs.length;
    snapshot.confirmedTransactionCount = confirmed.length;
    snapshot.pendingTransactionCount = pending.length;
    snapshot.totalVolume = totalVolume;
    snapshot.lastTransactionAt = lastTransactionAt;
    await this.analyticsSnapshotsRepository.save(snapshot);
  }

  private async toDto(entity: LedgerTransactionEntity): Promise<TransactionListItemDto> {
    const wallet = await this.walletsRepository.findOne({
      where: { id: entity.walletId },
    });
    const settlementDiagnostic = this.buildSettlementDiagnostic(entity, wallet);

    return {
      id: entity.id,
      userId: entity.userId,
      walletId: entity.walletId,
      walletAddress: wallet?.addressNormalized ?? '',
      network: entity.network,
      chainId: entity.chainId,
      assetCode: entity.assetCode,
      amount: normalizeFixed(entity.amount),
      status: entity.status,
      operationId: entity.operationId,
      txHash: entity.txHash,
      blockNumber: entity.blockNumber,
      blockTime: entity.blockTime,
      confirmedAt: entity.confirmedAt,
      failureReason: entity.failureReason,
      settlementDiagnostic,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private async processSettlementActivity(
    activity: ActivityEvent,
    rawPayload: Record<string, unknown>,
  ): Promise<string | null> {
    if (!activity.txHash || !activity.network || activity.chainId === null || !activity.from || !activity.to) {
      return null;
    }
    if (!isSupportedNetwork(activity.network) || !this.isNativeAsset(activity.asset)) {
      return null;
    }

    const treasuryAddress = this.getTreasuryAddress(activity.network);
    if (normalizeAddress(activity.to) !== normalizeAddress(treasuryAddress)) {
      return null;
    }

    const senderAddress = normalizeAddress(activity.from);
    const wallet = await this.walletsRepository.findOne({
      where: {
        chainId: activity.chainId,
        addressNormalized: senderAddress,
      },
    });
    if (!wallet || !wallet.network) {
      return null;
    }

    const existingByChainHash = await this.ledgerTransactionsRepository.findOne({
      where: { chainId: activity.chainId, txHash: activity.txHash },
    });
    if (existingByChainHash && existingByChainHash.walletId !== wallet.id) {
      return null;
    }

    const tracked = await this.ledgerTransactionsRepository.findOne({
      where: {
        walletId: wallet.id,
        chainId: activity.chainId,
        txHash: activity.txHash,
      },
      order: { createdAt: 'DESC' },
    });

    if (!tracked) {
      if (existingByChainHash) {
        return existingByChainHash.userId;
      }
      const unmatched = this.ledgerTransactionsRepository.create({
        userId: wallet.userId,
        walletId: wallet.id,
        network: wallet.network,
        chainId: activity.chainId,
        assetCode: activity.asset,
        amount: normalizeFixed(activity.value),
        status: LedgerTxStatus.UNMATCHED,
        txHash: activity.txHash,
        blockNumber: activity.blockNumber,
        blockTime: activity.blockTime,
        rawWebhookPayload: rawPayload,
      });
      await this.ledgerTransactionsRepository.save(unmatched);
      return wallet.userId;
    }

    const expectedTo = normalizeAddress(String(tracked.rawTrackPayload?.to ?? ''));
    const actualAmount = normalizeFixed(activity.value);
    const recipientMatches = expectedTo === normalizeAddress(treasuryAddress);
    const amountMatches = this.isNativeAsset(activity.asset)
      ? this.nativeAmountMatchesTrackedExpectation(actualAmount, tracked)
      : normalizeFixed(tracked.amount) === actualAmount;
    const expectationsPass = recipientMatches && amountMatches;

    tracked.assetCode = activity.asset;
    tracked.amount = actualAmount;
    tracked.blockNumber = activity.blockNumber;
    tracked.blockTime = activity.blockTime;
    tracked.rawWebhookPayload = rawPayload;

    if (expectationsPass) {
      tracked.status = LedgerTxStatus.CONFIRMED;
      tracked.failureReason = null;
      tracked.confirmedAt = activity.blockTime ?? new Date();
    } else {
      tracked.status = LedgerTxStatus.FAILED;
      tracked.failureReason = !recipientMatches
        ? 'WEBHOOK_EXPECTATION_MISMATCH_RECIPIENT'
        : 'WEBHOOK_EXPECTATION_MISMATCH_AMOUNT';
      tracked.confirmedAt = null;
    }

    await this.ledgerTransactionsRepository.save(tracked);
    return tracked.userId;
  }

  private async requireOwnedWallet(
    userId: string,
    walletId: string,
    network: string,
    chainId: number,
  ): Promise<WalletEntity> {
    const wallet = await this.walletsRepository.findOne({
      where: {
        id: walletId,
        userId,
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.network || wallet.network !== network) {
      throw new BadRequestException('Wallet network mismatch');
    }
    if (wallet.chainId !== chainId) {
      throw new BadRequestException('Wallet chainId mismatch');
    }

    if (!SUPPORTED_APP_NETWORKS.has(network)) {
      throw new BadRequestException('Unsupported network');
    }

    return wallet;
  }

  private toAlchemyNetwork(network: string): 'eth-sepolia' | 'base-sepolia' {
    if (network === 'BASE_SEPOLIA') {
      return 'base-sepolia';
    }

    return 'eth-sepolia';
  }

  private isNativeAsset(assetCode: string): boolean {
    return assetCode.trim().toUpperCase() === 'ETH';
  }

  private getTreasuryAddress(network: string): string {
    return network === 'BASE_SEPOLIA'
      ? env.treasuryAddressBaseSepolia
      : env.treasuryAddressEthSepolia;
  }

  private buildSettlementDiagnostic(
    entity: LedgerTransactionEntity,
    wallet: WalletEntity | null,
  ): string | null {
    if (entity.status === LedgerTxStatus.CONFIRMED) {
      return null;
    }

    if (entity.status === LedgerTxStatus.FAILED) {
      return entity.failureReason
        ? `Failed: ${entity.failureReason}`
        : 'Failed without explicit machine-readable reason.';
    }

    if (!entity.txHash) {
      return 'Awaiting on-chain tx hash. Track with txHash or operationId first.';
    }

    if (!wallet) {
      return 'Linked wallet record is missing for this transaction.';
    }

    if (!wallet.network || !isSupportedNetwork(wallet.network)) {
      return 'Wallet network is unsupported for settlement confirmation.';
    }

    if (entity.assetCode.trim().toUpperCase() !== 'ETH') {
      return 'V1 confirms native ETH only; token-transfer settlement is ignored.';
    }

    const expectedRecipient = String(entity.rawTrackPayload?.to ?? '').trim();
    if (!expectedRecipient) {
      return 'Missing expected treasury recipient in tracked payload.';
    }

    const treasury = this.getTreasuryAddress(wallet.network);
    try {
      const expectedRecipientNormalized = normalizeAddress(getAddress(expectedRecipient));
      const treasuryNormalized = normalizeAddress(getAddress(treasury));
      if (expectedRecipientNormalized !== treasuryNormalized) {
        return 'Tracked recipient does not match configured treasury address.';
      }
    } catch {
      return 'Tracked recipient or treasury configuration is invalid.';
    }

    if (entity.status === LedgerTxStatus.UNMATCHED) {
      return 'Webhook/backfill saw tx but it did not pass strict settlement matching.';
    }

    if (entity.blockNumber || entity.blockTime) {
      return 'Observed on-chain activity, awaiting strict settlement attribute match.';
    }

    return 'Awaiting treasury inbound webhook/backfill confirmation for tracked tx hash.';
  }

  private buildWebhookDedupeKey(payload: Record<string, unknown>): string {
    const id = typeof payload.id === 'string' ? payload.id : '';
    const webhookId = typeof payload.webhookId === 'string' ? payload.webhookId : '';
    const sequence = typeof payload.sequenceNumber === 'number' ? String(payload.sequenceNumber) : '';
    const activityFingerprint = this.extractRawActivityFingerprints(payload);
    const fallback = JSON.stringify(payload).slice(0, 240);
    return [id, webhookId, sequence, activityFingerprint || fallback].join('|');
  }

  private extractActivities(payload: Record<string, unknown>): ActivityEvent[] {
    const nested = payload.event as { activity?: unknown } | undefined;
    const candidates = Array.isArray(payload.activity)
      ? payload.activity
      : Array.isArray(nested?.activity)
        ? nested?.activity
        : Array.isArray((payload as { activities?: unknown[] }).activities)
          ? (payload as { activities: unknown[] }).activities
          : [];

    return candidates
      .map((item) => this.toActivityEvent(item, null))
      .filter((item): item is ActivityEvent => Boolean(item.txHash || item.from || item.to));
  }

  private extractRawActivityFingerprints(payload: Record<string, unknown>): string {
    const nested = payload.event as { activity?: unknown } | undefined;
    const candidates = Array.isArray(payload.activity)
      ? payload.activity
      : Array.isArray(nested?.activity)
        ? nested?.activity
        : Array.isArray((payload as { activities?: unknown[] }).activities)
          ? (payload as { activities: unknown[] }).activities
          : [];

    if (candidates.length === 0) {
      return '';
    }

    const fingerprints = candidates.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') {
        return [];
      }

      const item = entry as Record<string, unknown>;
      const hash = this.toNullableString(item.hash ?? item.txHash) ?? '';
      const uniqueId = this.toNullableString(item.uniqueId) ?? '';
      const logIndex = this.toNullableString(item.logIndex ?? item.transferIndex) ?? '';
      const from = this.toNullableString(item.fromAddress ?? item.from) ?? '';
      const to = this.toNullableString(item.toAddress ?? item.to) ?? '';
      return [`${hash}:${uniqueId}:${logIndex}:${from}:${to}`];
    });

    return fingerprints.sort().join(',');
  }

  private toActivityEvent(raw: unknown, fallbackNetwork: string | null): ActivityEvent {
    const event = typeof raw === 'object' && raw ? raw as Record<string, unknown> : {};
    const txHash = this.toNullableString(event.hash ?? event.txHash);
    const from = this.toNullableString(event.fromAddress ?? event.from);
    const to = this.toNullableString(event.toAddress ?? event.to);
    const value = this.toNullableString(event.value) ?? '0';
    const asset = (this.toNullableString(event.asset) ?? 'UNKNOWN').toUpperCase();
    const network = this.toNullableString(event.network) ?? fallbackNetwork;
    const chainId = network && isSupportedNetwork(network) ? chainIdForNetwork(network) : null;
    const blockNum = this.toNullableString(event.blockNum ?? event.blockNumber);
    const blockTimeText = this.toNullableString(
      (event.metadata as { blockTimestamp?: string } | undefined)?.blockTimestamp
      ?? event.blockTimestamp,
    );

    return {
      txHash,
      from,
      to,
      value,
      asset,
      network,
      chainId,
      blockNumber: blockNum,
      blockTime: blockTimeText ? new Date(blockTimeText) : null,
      status: blockNum ? 'CONFIRMED' : 'PENDING',
    };
  }

  private toNullableString(value: unknown): string | null {
    if (typeof value === 'number' || typeof value === 'bigint') {
      return String(value);
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private async getOrCreateCheckpoint(walletId: string, network: string): Promise<SyncCheckpointEntity> {
    const existing = await this.syncCheckpointsRepository.findOne({
      where: { walletId, network },
    });

    if (existing) {
      return existing;
    }

    return this.syncCheckpointsRepository.save(
      this.syncCheckpointsRepository.create({
        walletId,
        network,
      }),
    );
  }

  private createSimulationToken(
    userId: string,
    walletId: string,
    network: string,
    chainId: number,
    to: string,
    value?: string,
    data?: string,
  ): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = this.buildSimulationPayload(userId, walletId, network, chainId, to, value, data, issuedAt);
    const signature = this.signSimulationPayload(payload);
    return `${issuedAt}.${signature}`;
  }

  private assertSimulationToken(
    token: string,
    userId: string,
    walletId: string,
    network: string,
    chainId: number,
    to: string,
    value?: string,
    data?: string,
  ): void {
    const [issuedAtRaw, signature] = token.split('.');
    const issuedAt = Number.parseInt(issuedAtRaw ?? '', 10);

    if (!issuedAtRaw || !signature || !Number.isFinite(issuedAt)) {
      throw new BadRequestException('simulationId is invalid');
    }

    const now = Math.floor(Date.now() / 1000);
    const ageSeconds = now - issuedAt;
    if (ageSeconds < 0 || ageSeconds > SIMULATION_TOKEN_MAX_AGE_SECONDS) {
      throw new BadRequestException('simulationId is expired');
    }

    const payload = this.buildSimulationPayload(userId, walletId, network, chainId, to, value, data, issuedAt);
    const expected = this.signSimulationPayload(payload);
    const left = Buffer.from(expected, 'utf8');
    const right = Buffer.from(signature, 'utf8');

    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      throw new BadRequestException('simulationId signature is invalid');
    }
  }

  private signSimulationPayload(payload: string): string {
    return createHmac('sha256', env.internalAuthJwtSecret).update(payload).digest('hex');
  }

  private buildSimulationPayload(
    userId: string,
    walletId: string,
    network: string,
    chainId: number,
    to: string,
    value: string | undefined,
    data: string | undefined,
    issuedAt: number,
  ): string {
    return [
      userId,
      walletId,
      network,
      String(chainId),
      to.toLowerCase(),
      this.normalizeTokenPart(value),
      this.normalizeTokenPart(data),
      String(issuedAt),
    ].join('|');
  }

  private normalizeTokenPart(value: string | undefined): string {
    if (!value) {
      return '';
    }

    return value.trim().toLowerCase();
  }

  private hexToDecimal(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (/^0x[0-9a-f]+$/.test(trimmed)) {
      return BigInt(trimmed).toString(10);
    }
    return value;
  }

  private nativeAmountMatchesTrackedExpectation(
    actualWei: string,
    tracked: LedgerTransactionEntity,
  ): boolean {
    const candidates = new Set<string>();

    const trackedValue = String(tracked.rawTrackPayload?.value ?? '').trim().toLowerCase();
    if (trackedValue) {
      const parsed = this.parseWeiQuantity(trackedValue);
      if (parsed) {
        candidates.add(parsed);
      }
    }

    const trackedAmount = String(tracked.amount ?? '').trim();
    if (trackedAmount) {
      const asWeiQuantity = this.parseWeiQuantity(trackedAmount);
      if (asWeiQuantity) {
        candidates.add(asWeiQuantity);
      }

      const asEthToWei = this.parseEthAmountToWei(trackedAmount);
      if (asEthToWei) {
        candidates.add(asEthToWei);
      }
    }

    return candidates.has(actualWei);
  }

  private parseWeiQuantity(value: string): string | null {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }

    if (/^0x[0-9a-f]+$/.test(trimmed)) {
      return BigInt(trimmed).toString(10);
    }

    if (/^[0-9]+$/.test(trimmed)) {
      return BigInt(trimmed).toString(10);
    }

    return null;
  }

  private parseEthAmountToWei(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!/^[0-9]+(\.[0-9]+)?$/.test(trimmed)) {
      return null;
    }

    try {
      return parseUnits(trimmed, 18).toString();
    } catch {
      return null;
    }
  }

  private normalizeRecipient(value: string): string {
    try {
      return getAddress(value.trim());
    } catch {
      throw new BadRequestException('Recipient address is invalid');
    }
  }

  private assertTreasuryRecipient(network: string, recipient: string): void {
    const treasuryAddress = network === 'BASE_SEPOLIA'
      ? env.treasuryAddressBaseSepolia
      : env.treasuryAddressEthSepolia;

    if (!treasuryAddress) {
      throw new BadRequestException(`Treasury address is not configured for network ${network}`);
    }

    let normalizedTreasury: string;
    try {
      normalizedTreasury = getAddress(treasuryAddress.trim());
    } catch {
      throw new BadRequestException(`Treasury address configuration is invalid for network ${network}`);
    }

    if (normalizedTreasury !== recipient) {
      throw new BadRequestException('Recipient must match configured treasury address');
    }
  }

  private async findExistingTrackedTransaction(
    walletId: string,
    chainId: number,
    operationId: string | null,
    txHash: string | null,
  ): Promise<LedgerTransactionEntity | null> {
    if (operationId) {
      const byOperation = await this.ledgerTransactionsRepository.findOne({
        where: { operationId },
      });
      if (byOperation) {
        return byOperation;
      }
    }

    if (!txHash) {
      return null;
    }

    return this.ledgerTransactionsRepository.findOne({
      where: {
        walletId,
        chainId,
        txHash,
      },
    });
  }
}
