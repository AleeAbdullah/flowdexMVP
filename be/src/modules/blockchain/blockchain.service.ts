import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { getAddress, id, JsonRpcProvider } from 'ethers';
import type { Block, TransactionReceipt } from 'ethers';
import { TronWeb, utils as tronUtils } from 'tronweb';
import { DataSource, IsNull, Not, Repository } from 'typeorm';

import { BlockchainTxStatus, Chain, IntentStatus } from '../../common/enums/domain.enums';
import {
  addFixed,
  compareFixed,
  divideFixed,
  formatFixed,
  multiplyFixed,
  rescaleIntegerToFixed,
} from '../../common/utils/decimal';
import { env } from '../../infrastructure/config/env';
import { PresaleStateEntity } from '../presale/entities/presale-state.entity';
import { PresaleTierEntity } from '../presale/entities/presale-tier.entity';
import { SupportedAssetEntity } from '../pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { TokenAllocationEntity } from '../transactions/entities/token-allocation.entity';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { BlockchainTransactionEntity } from './entities/blockchain-transaction.entity';

type ChainTransfer = {
  transferIndex: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  blockNumber: string;
  blockTime: Date;
  confirmations: number;
  rawPayload: Record<string, unknown>;
};

const RECONCILIATION_REASONS = {
  INTENT_EXPIRED_NO_TX: 'INTENT_EXPIRED_NO_TX',
  TX_NOT_READY: 'TX_NOT_READY',
  TX_ALREADY_MATCHED: 'TX_ALREADY_MATCHED',
  TREASURY_ADDRESS_MISMATCH: 'TREASURY_ADDRESS_MISMATCH',
  SENDER_WALLET_MISMATCH: 'SENDER_WALLET_MISMATCH',
  AMOUNT_BELOW_MINIMUM: 'AMOUNT_BELOW_MINIMUM',
} as const;

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly evmProvider = new JsonRpcProvider(env.ethRpcUrl);
  private readonly tronWeb = new TronWeb({
    fullHost: env.tronFullHost,
  });
  private readonly erc20TransferTopic = id('Transfer(address,address,uint256)');

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseIntentEntity)
    private readonly purchaseIntentsRepository: Repository<PurchaseIntentEntity>,
    @InjectRepository(BlockchainTransactionEntity)
    private readonly blockchainTransactionsRepository: Repository<BlockchainTransactionEntity>,
    @InjectRepository(SupportedAssetEntity)
    private readonly supportedAssetsRepository: Repository<SupportedAssetEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(TokenAllocationEntity)
    private readonly tokenAllocationsRepository: Repository<TokenAllocationEntity>,
    @InjectRepository(PresaleStateEntity)
    private readonly presaleStateRepository: Repository<PresaleStateEntity>,
    @InjectRepository(PresaleTierEntity)
    private readonly presaleTierRepository: Repository<PresaleTierEntity>,
  ) {}

  @Cron('*/15 * * * * *')
  async scanChains(): Promise<void> {
    await this.runSafely('intent expiry', async () => {
      await this.expireStaleIntents();
    });

    await this.runSafely('reported transaction reconciliation', async () => {
      await this.reconcileReportedTransactions();
    });
  }

  @Cron('*/15 * * * * *')
  async trackConfirmations(): Promise<void> {
    await this.runSafely('confirmation tracking', async () => {
      await this.refreshTrackedTransactions();
    });
  }

  @Cron('0 * * * *')
  async backfillReconciliation(): Promise<void> {
    await this.runSafely('reconciliation backfill', async () => {
      await this.reconcileReportedTransactions(true);
      await this.refreshTrackedTransactions();
    });
  }

  private async expireStaleIntents(): Promise<void> {
    const result = await this.purchaseIntentsRepository
      .createQueryBuilder()
      .update(PurchaseIntentEntity)
      .set({
        status: IntentStatus.EXPIRED,
        failureReason: RECONCILIATION_REASONS.INTENT_EXPIRED_NO_TX,
      })
      .where('status = :status', { status: IntentStatus.PENDING })
      .andWhere('reported_tx_hash IS NULL')
      .andWhere('expires_at < :now', { now: new Date().toISOString() })
      .execute();

    if (result.affected) {
      this.logger.log(`Expired ${result.affected} stale purchase intents.`);
    }
  }

  private async reconcileReportedTransactions(includeMatched = false): Promise<void> {
    const intents = await this.purchaseIntentsRepository
      .createQueryBuilder('intent')
      .where('intent.reported_tx_hash IS NOT NULL')
      .andWhere('intent.status IN (:...statuses)', {
        statuses: includeMatched
          ? [IntentStatus.PENDING, IntentStatus.MATCHED, IntentStatus.CONFIRMING]
          : [IntentStatus.PENDING],
      })
      .orderBy('intent.created_at', 'ASC')
      .limit(50)
      .getMany();

    for (const intent of intents) {
      await this.runSafely(`reconcile ${intent.id}`, async () => {
        await this.reconcileIntent(intent);
      });
    }
  }

  private async refreshTrackedTransactions(): Promise<void> {
    const trackedTransactions = await this.blockchainTransactionsRepository.find({
      where: {
        matchedIntentId: Not(IsNull()),
        status: Not(BlockchainTxStatus.CONFIRMED),
      },
      order: { updatedAt: 'ASC' },
      take: 50,
    });

    for (const chainTx of trackedTransactions) {
      await this.runSafely(`confirm ${chainTx.txHash}`, async () => {
        await this.refreshTransactionConfirmation(chainTx);
      });
    }
  }

  private async reconcileIntent(intent: PurchaseIntentEntity): Promise<void> {
    if (!intent.reportedTxHash) {
      return;
    }

    const [asset, wallet] = await Promise.all([
      this.supportedAssetsRepository.findOne({ where: { id: intent.assetId } }),
      this.walletsRepository.findOne({ where: { id: intent.walletId, userId: intent.userId } }),
    ]);

    if (!asset || !wallet) {
      this.logger.warn(`Skipping reconciliation for ${intent.id}: missing asset or wallet.`);
      return;
    }

    const transfer = await this.fetchTransferForIntent(intent.reportedTxHash, asset, wallet);

    if (!transfer) {
      this.logger.debug(`Reported transaction ${intent.reportedTxHash} is not ready yet for intent ${intent.id}.`);
      return;
    }

    const validationError = this.validateTransfer(intent, asset, wallet, transfer);
    const existingChainTx = await this.blockchainTransactionsRepository.findOne({
      where: {
        chain: asset.chain,
        txHash: transfer.txHash,
        transferIndex: transfer.transferIndex,
      },
    });

    if (existingChainTx?.matchedIntentId && existingChainTx.matchedIntentId !== intent.id) {
      await this.markIntentFailed(intent, RECONCILIATION_REASONS.TX_ALREADY_MATCHED);
      this.logger.warn(`Intent ${intent.id} reported a tx hash already matched to another purchase intent.`);
      return;
    }

    const chainTx = await this.upsertBlockchainTransaction(
      asset,
      intent,
      transfer,
      !validationError,
      validationError,
    );

    if (validationError) {
      await this.markIntentFailed(intent, validationError);
      this.logger.warn(`Intent ${intent.id} failed reconciliation: ${validationError}`);
      return;
    }

    intent.expectedAmount = transfer.amount;
    intent.expectedTokensReal = divideFixed(
      multiplyFixed(transfer.amount, intent.quotedAssetPriceUsd),
      intent.quotedTokenPriceUsd,
    );
    intent.matchedBlockchainTxId = chainTx.id;
    intent.failureReason = null;

    if (transfer.confirmations >= asset.minConfirmations) {
      await this.finalizeConfirmedIntent(intent.id, chainTx.id);
      return;
    }

    chainTx.status = BlockchainTxStatus.CONFIRMING;
    chainTx.reconciliationReason = null;
    intent.status = IntentStatus.CONFIRMING;
    await this.blockchainTransactionsRepository.save(chainTx);
    await this.purchaseIntentsRepository.save(intent);
    this.logger.log(
      `Intent ${intent.id} matched reported tx ${chainTx.txHash} and is waiting for confirmations (${transfer.confirmations}/${asset.minConfirmations}).`,
    );
  }

  private async refreshTransactionConfirmation(chainTx: BlockchainTransactionEntity): Promise<void> {
    if (!chainTx.matchedIntentId) {
      return;
    }

    const [intent, asset] = await Promise.all([
      this.purchaseIntentsRepository.findOne({ where: { id: chainTx.matchedIntentId } }),
      this.supportedAssetsRepository.findOne({ where: { id: chainTx.assetId } }),
    ]);

    if (!intent || !asset) {
      return;
    }

    const refreshedTransfer = await this.fetchTransferByChainTransaction(chainTx, asset);

    if (!refreshedTransfer) {
      this.logger.warn(`Could not refresh confirmations for chain tx ${chainTx.txHash}.`);
      return;
    }

    chainTx.confirmations = refreshedTransfer.confirmations;
    chainTx.blockNumber = refreshedTransfer.blockNumber;
    chainTx.blockTime = refreshedTransfer.blockTime;
    chainTx.rawPayload = refreshedTransfer.rawPayload;
    chainTx.reconciliationReason = null;
    intent.failureReason = null;

    if (refreshedTransfer.confirmations >= asset.minConfirmations) {
      await this.blockchainTransactionsRepository.save(chainTx);
      await this.finalizeConfirmedIntent(intent.id, chainTx.id);
      return;
    }

    chainTx.status = BlockchainTxStatus.CONFIRMING;
    intent.status = IntentStatus.CONFIRMING;
    await this.blockchainTransactionsRepository.save(chainTx);
    await this.purchaseIntentsRepository.save(intent);
  }

  private async finalizeConfirmedIntent(intentId: string, chainTxId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const intentRepository = manager.getRepository(PurchaseIntentEntity);
      const blockchainRepository = manager.getRepository(BlockchainTransactionEntity);
      const allocationRepository = manager.getRepository(TokenAllocationEntity);
      const presaleStateRepository = manager.getRepository(PresaleStateEntity);
      const presaleTierRepository = manager.getRepository(PresaleTierEntity);

      const [intent, chainTx] = await Promise.all([
        intentRepository.findOne({ where: { id: intentId } }),
        blockchainRepository.findOne({ where: { id: chainTxId } }),
      ]);

      if (!intent || !chainTx) {
        return;
      }

      chainTx.status = BlockchainTxStatus.CONFIRMED;
      chainTx.reconciliationReason = null;
      intent.status = IntentStatus.CONFIRMED;
      intent.matchedBlockchainTxId = chainTx.id;
      intent.confirmedAt = chainTx.blockTime;
      intent.failureReason = null;

      const existingAllocation = await allocationRepository.findOne({
        where: { purchaseIntentId: intent.id },
      });

      if (!existingAllocation) {
        const state = await presaleStateRepository.findOne({
          where: { id: '00000000-0000-0000-0000-000000000001' },
        });

        if (!state) {
          throw new Error('Presale state not configured');
        }

        const tier = await this.resolveTierForIntent(presaleTierRepository, state.currentTierId, intent.quotedTokenPriceUsd);

        await allocationRepository.save(
          allocationRepository.create({
            userId: intent.userId,
            purchaseIntentId: intent.id,
            tierId: tier.id,
            tokensReal: intent.expectedTokensReal,
          }),
        );

        state.totalRaisedUsdReal = addFixed(
          state.totalRaisedUsdReal,
          multiplyFixed(intent.expectedAmount, intent.quotedAssetPriceUsd),
        );
        state.totalTokensSoldReal = addFixed(state.totalTokensSoldReal, intent.expectedTokensReal);

        const advancedTierId = await this.resolveAdvancedTierId(
          presaleTierRepository,
          state.currentTierId,
          state.totalTokensSoldReal,
        );
        state.currentTierId = advancedTierId;

        await presaleStateRepository.save(state);
      }

      await blockchainRepository.save(chainTx);
      await intentRepository.save(intent);
    });

    this.logger.log(`Intent ${intentId} reached confirmed status.`);
  }

  private async resolveTierForIntent(
    tierRepository: Repository<PresaleTierEntity>,
    fallbackTierId: string,
    quotedTokenPriceUsd: string,
  ): Promise<PresaleTierEntity> {
    const tier = await tierRepository.findOne({
      where: { tokenPriceUsd: quotedTokenPriceUsd },
    });

    if (tier) {
      return tier;
    }

    const fallbackTier = await tierRepository.findOne({ where: { id: fallbackTierId } });

    if (!fallbackTier) {
      throw new Error('Fallback presale tier not configured');
    }

    return fallbackTier;
  }

  private async resolveAdvancedTierId(
    tierRepository: Repository<PresaleTierEntity>,
    currentTierId: string,
    totalTokensSoldReal: string,
  ): Promise<string> {
    let activeTier = await tierRepository.findOne({ where: { id: currentTierId } });

    if (!activeTier) {
      return currentTierId;
    }

    while (compareFixed(totalTokensSoldReal, activeTier.tokenCapReal) >= 0) {
      const nextTier = await tierRepository
        .createQueryBuilder('tier')
        .where('tier.sort_order > :sortOrder', { sortOrder: activeTier.sortOrder })
        .andWhere('tier.is_active = true')
        .orderBy('tier.sort_order', 'ASC')
        .getOne();

      if (!nextTier) {
        return activeTier.id;
      }

      activeTier = nextTier;
    }

    return activeTier.id;
  }

  private async upsertBlockchainTransaction(
    asset: SupportedAssetEntity,
    intent: PurchaseIntentEntity,
    transfer: ChainTransfer,
    isMatch: boolean,
    reconciliationReason: string | null,
  ): Promise<BlockchainTransactionEntity> {
    const existing = await this.blockchainTransactionsRepository.findOne({
      where: {
        chain: asset.chain,
        txHash: transfer.txHash,
        transferIndex: transfer.transferIndex,
      },
    });

    const entity = existing ?? this.blockchainTransactionsRepository.create();
    entity.chain = asset.chain;
    entity.assetId = asset.id;
    entity.txHash = transfer.txHash;
    entity.transferIndex = transfer.transferIndex;
    entity.fromAddress = transfer.fromAddress;
    entity.toAddress = transfer.toAddress;
    entity.amount = transfer.amount;
    entity.blockNumber = transfer.blockNumber;
    entity.blockTime = transfer.blockTime;
    entity.confirmations = transfer.confirmations;
    entity.rawPayload = transfer.rawPayload;
    entity.status = isMatch
      ? transfer.confirmations >= asset.minConfirmations
        ? BlockchainTxStatus.CONFIRMED
        : BlockchainTxStatus.CONFIRMING
      : BlockchainTxStatus.UNMATCHED;
    entity.matchedIntentId = isMatch ? intent.id : null;
    entity.reconciliationReason = reconciliationReason;

    return this.blockchainTransactionsRepository.save(entity);
  }

  private validateTransfer(
    _intent: PurchaseIntentEntity,
    asset: SupportedAssetEntity,
    wallet: WalletEntity,
    transfer: ChainTransfer,
  ): string | null {
    const treasuryAddress = this.normalizeAddress(asset.chain, asset.treasuryAddress);
    const walletAddress = this.normalizeAddress(asset.chain, wallet.addressNormalized);

    if (transfer.toAddress !== treasuryAddress) {
      return RECONCILIATION_REASONS.TREASURY_ADDRESS_MISMATCH;
    }

    if (transfer.fromAddress !== walletAddress) {
      return RECONCILIATION_REASONS.SENDER_WALLET_MISMATCH;
    }

    if (compareFixed(transfer.amount, asset.minAmount) < 0) {
      return RECONCILIATION_REASONS.AMOUNT_BELOW_MINIMUM;
    }

    return null;
  }

  private async fetchTransferForIntent(
    txHash: string,
    asset: SupportedAssetEntity,
    wallet: WalletEntity,
  ): Promise<ChainTransfer | null> {
    if (asset.chain === Chain.ETH) {
      return this.fetchEvmNativeTransfer(txHash);
    }

    if (asset.chain === Chain.ERC20) {
      return this.fetchEvmErc20Transfer(txHash, asset, wallet.addressNormalized);
    }

    return this.fetchTrc20Transfer(txHash, asset, wallet.addressNormalized);
  }

  private async fetchTransferByChainTransaction(
    chainTx: BlockchainTransactionEntity,
    asset: SupportedAssetEntity,
  ): Promise<ChainTransfer | null> {
    if (asset.chain === Chain.ETH) {
      return this.fetchEvmNativeTransfer(chainTx.txHash);
    }

    if (asset.chain === Chain.ERC20) {
      return this.fetchEvmErc20Transfer(chainTx.txHash, asset, chainTx.fromAddress);
    }

    return this.fetchTrc20Transfer(chainTx.txHash, asset, chainTx.fromAddress);
  }

  private async fetchEvmNativeTransfer(txHash: string): Promise<ChainTransfer | null> {
    const [tx, receipt] = await Promise.all([
      this.evmProvider.getTransaction(txHash),
      this.evmProvider.getTransactionReceipt(txHash),
    ]);

    if (!tx || !receipt || !receipt.blockNumber || !tx.to || receipt.status !== 1) {
      return null;
    }

    const [latestBlock, block] = await Promise.all([
      this.evmProvider.getBlockNumber(),
      this.evmProvider.getBlock(receipt.blockNumber),
    ]);

    return this.buildEvmTransfer({
      txHash,
      receipt,
      block,
      latestBlock,
      transferIndex: 0,
      fromAddress: getAddress(tx.from),
      toAddress: getAddress(tx.to),
      amount: formatFixed(tx.value),
      rawPayload: {
        type: 'ETH_NATIVE',
        transactionHash: txHash,
        blockNumber: receipt.blockNumber,
      },
    });
  }

  private async fetchEvmErc20Transfer(
    txHash: string,
    asset: SupportedAssetEntity,
    preferredFromAddress: string,
  ): Promise<ChainTransfer | null> {
    const receipt = await this.evmProvider.getTransactionReceipt(txHash);

    if (!receipt || !receipt.blockNumber || receipt.status !== 1 || !asset.contractAddress) {
      return null;
    }

    const [latestBlock, block] = await Promise.all([
      this.evmProvider.getBlockNumber(),
      this.evmProvider.getBlock(receipt.blockNumber),
    ]);

    const contractAddress = getAddress(asset.contractAddress);
    const treasuryAddress = getAddress(asset.treasuryAddress);
    const preferredFrom = getAddress(preferredFromAddress);
    const matchingLogs = receipt.logs
      .filter(log => getAddress(log.address) === contractAddress && log.topics[0] === this.erc20TransferTopic)
      .map((log) => {
        const fromAddress = this.decodeEvmTopicAddress(log.topics[1]);
        const toAddress = this.decodeEvmTopicAddress(log.topics[2]);

        return {
          transferIndex: log.index,
          fromAddress,
          toAddress,
          amount: rescaleIntegerToFixed(BigInt(log.data), asset.decimals),
          rawPayload: {
            type: 'ERC20_TRANSFER',
            logIndex: log.index,
            contractAddress,
            transactionHash: txHash,
          },
        };
      })
      .sort((left, right) => {
        const leftScore = Number(left.toAddress === treasuryAddress) + Number(left.fromAddress === preferredFrom);
        const rightScore = Number(right.toAddress === treasuryAddress) + Number(right.fromAddress === preferredFrom);
        return rightScore - leftScore;
      });

    if (matchingLogs.length === 0) {
      return null;
    }

    const selected = matchingLogs[0];

    return this.buildEvmTransfer({
      txHash,
      receipt,
      block,
      latestBlock,
      ...selected,
    });
  }

  private async fetchTrc20Transfer(
    txHash: string,
    asset: SupportedAssetEntity,
    preferredFromAddress: string,
  ): Promise<ChainTransfer | null> {
    const transactionInfo = await this.tronWeb.trx.getTransactionInfo(txHash);
    const transactionLogs = Array.isArray((transactionInfo as { log?: Array<Record<string, unknown>> } | null)?.log)
      ? (transactionInfo as { log: Array<Record<string, unknown>> }).log
      : [];

    if (!transactionInfo || transactionLogs.length === 0 || !asset.contractAddress) {
      return null;
    }

    const latestBlockResponse = await this.tronWeb.trx.getCurrentBlock();
    const latestBlockNumber = Number(
      (latestBlockResponse as { block_header?: { raw_data?: { number?: number } } })?.block_header?.raw_data?.number ?? 0,
    );
    const contractAddress = this.normalizeAddress(Chain.TRC20, asset.contractAddress);
    const treasuryAddress = this.normalizeAddress(Chain.TRC20, asset.treasuryAddress);
    const preferredFrom = this.normalizeAddress(Chain.TRC20, preferredFromAddress);
    const transferTopic = this.erc20TransferTopic.slice(2).toLowerCase();

    const matchingLogs = transactionLogs
      .map((log, index) => {
        const address = String(log.address ?? '');
        const topics = Array.isArray(log.topics) ? log.topics.map(value => String(value).toLowerCase()) : [];
        const data = String(log.data ?? '');

        if (!topics[0] || topics[0] !== transferTopic) {
          return null;
        }

        const normalizedContract = this.normalizeTronAddressFromHex(address);

        if (normalizedContract !== contractAddress) {
          return null;
        }

        const fromAddress = this.decodeTronTopicAddress(topics[1]);
        const toAddress = this.decodeTronTopicAddress(topics[2]);

        return {
          transferIndex: index,
          fromAddress,
          toAddress,
          amount: rescaleIntegerToFixed(BigInt(`0x${data}`), asset.decimals),
          rawPayload: {
            type: 'TRC20_TRANSFER',
            logIndex: index,
            transactionHash: txHash,
          },
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((left, right) => {
        const leftScore = Number(left.toAddress === treasuryAddress) + Number(left.fromAddress === preferredFrom);
        const rightScore = Number(right.toAddress === treasuryAddress) + Number(right.fromAddress === preferredFrom);
        return rightScore - leftScore;
      });

    if (matchingLogs.length === 0) {
      return null;
    }

    const selected = matchingLogs[0];
    const blockNumber = String(Number((transactionInfo as { blockNumber?: number }).blockNumber ?? 0));
    const blockTime = new Date(Number((transactionInfo as { blockTimeStamp?: number }).blockTimeStamp ?? Date.now()));
    const confirmations = Math.max(0, latestBlockNumber - Number(blockNumber) + 1);

    return {
      txHash,
      transferIndex: selected.transferIndex,
      fromAddress: selected.fromAddress,
      toAddress: selected.toAddress,
      amount: selected.amount,
      blockNumber,
      blockTime,
      confirmations,
      rawPayload: {
        ...selected.rawPayload,
        blockNumber,
      },
    };
  }

  private buildEvmTransfer(params: {
    txHash: string;
    receipt: TransactionReceipt;
    block: Block | null;
    latestBlock: number;
    transferIndex: number;
    fromAddress: string;
    toAddress: string;
    amount: string;
    rawPayload: Record<string, unknown>;
  }): ChainTransfer {
    return {
      txHash: params.txHash,
      transferIndex: params.transferIndex,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      amount: params.amount,
      blockNumber: String(params.receipt.blockNumber),
      blockTime: new Date(Number((params.block?.timestamp ?? 0)) * 1000),
      confirmations: Math.max(0, params.latestBlock - params.receipt.blockNumber + 1),
      rawPayload: params.rawPayload,
    };
  }

  private decodeEvmTopicAddress(topic: string | null | undefined): string {
    if (!topic) {
      return '';
    }

    return getAddress(`0x${topic.slice(-40)}`);
  }

  private decodeTronTopicAddress(topic: string | null | undefined): string {
    if (!topic) {
      return '';
    }

    return tronUtils.address.fromHex(`41${topic.slice(-40)}`);
  }

  private normalizeTronAddressFromHex(hex: string): string {
    const normalized = hex.startsWith('41') ? hex : `41${hex.slice(-40)}`;
    return tronUtils.address.fromHex(normalized);
  }

  private normalizeAddress(chain: Chain, address: string): string {
    if (chain === Chain.ETH || chain === Chain.ERC20) {
      return getAddress(address);
    }

    if (tronUtils.address.isAddress(address)) {
      return tronUtils.address.fromHex(tronUtils.address.toHex(address));
    }

    return this.normalizeTronAddressFromHex(address);
  }

  private async runSafely(label: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Blockchain workflow failed during ${label}: ${message}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async markIntentFailed(intent: PurchaseIntentEntity, failureReason: string): Promise<void> {
    intent.status = IntentStatus.FAILED;
    intent.matchedBlockchainTxId = null;
    intent.failureReason = failureReason;
    await this.purchaseIntentsRepository.save(intent);
  }
}
