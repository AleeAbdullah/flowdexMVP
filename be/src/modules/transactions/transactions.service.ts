import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { SupportedAssetEntity } from '../pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { RefundEntity } from '../admin/entities/refund.entity';
import { TransactionListItemDto } from './dto/transactions.dto';
import { TokenAllocationEntity } from './entities/token-allocation.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(PurchaseIntentEntity)
    private readonly purchaseIntentsRepository: Repository<PurchaseIntentEntity>,
    @InjectRepository(BlockchainTransactionEntity)
    private readonly blockchainTransactionsRepository: Repository<BlockchainTransactionEntity>,
    @InjectRepository(RefundEntity)
    private readonly refundsRepository: Repository<RefundEntity>,
    @InjectRepository(TokenAllocationEntity)
    private readonly tokenAllocationsRepository: Repository<TokenAllocationEntity>,
    @InjectRepository(SupportedAssetEntity)
    private readonly supportedAssetsRepository: Repository<SupportedAssetEntity>,
  ) {}

  async listForUser(userId: string): Promise<{ items: TransactionListItemDto[] }> {
    const intents = await this.purchaseIntentsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      items: await Promise.all(intents.map((intent) => this.toDto(intent))),
    };
  }

  async getForUser(userId: string, id: string): Promise<TransactionListItemDto> {
    const intent = await this.purchaseIntentsRepository.findOne({
      where: { id, userId },
    });
    if (!intent) {
      throw new NotFoundException('Transaction not found');
    }

    return this.toDto(intent);
  }

  async listAll(filters?: {
    status?: string;
    chain?: string;
    assetCode?: string;
    userId?: string;
    from?: string;
    to?: string;
  }): Promise<{ items: TransactionListItemDto[] }> {
    const queryBuilder = this.purchaseIntentsRepository.createQueryBuilder('intent');

    if (filters?.status) {
      queryBuilder.andWhere('intent.status = :status', { status: filters.status });
    }
    if (filters?.userId) {
      queryBuilder.andWhere('intent.user_id = :userId', { userId: filters.userId });
    }
    if (filters?.from) {
      queryBuilder.andWhere('intent.created_at >= :from', { from: filters.from });
    }
    if (filters?.to) {
      queryBuilder.andWhere('intent.created_at <= :to', { to: filters.to });
    }

    const intents = await queryBuilder.orderBy('intent.created_at', 'DESC').getMany();
    const items = await Promise.all(intents.map((intent) => this.toDto(intent)));

    return {
      items: items.filter((item) => {
        if (filters?.chain && item.chain !== filters.chain) {
          return false;
        }
        if (filters?.assetCode && item.assetCode !== filters.assetCode) {
          return false;
        }
        return true;
      }),
    };
  }

  async getById(id: string): Promise<TransactionListItemDto> {
    const intent = await this.purchaseIntentsRepository.findOne({ where: { id } });
    if (!intent) {
      throw new NotFoundException('Transaction not found');
    }

    return this.toDto(intent);
  }

  private async toDto(intent: PurchaseIntentEntity): Promise<TransactionListItemDto> {
    const [chainTx, refund, allocation, asset] = await Promise.all([
      intent.matchedBlockchainTxId
        ? this.blockchainTransactionsRepository.findOne({
            where: { id: intent.matchedBlockchainTxId },
          })
        : null,
      this.refundsRepository.findOne({
        where: { purchaseIntentId: intent.id },
      }),
      this.tokenAllocationsRepository.findOne({
        where: { purchaseIntentId: intent.id },
      }),
      this.supportedAssetsRepository.findOne({
        where: { id: intent.assetId },
      }),
    ]);

    return {
      id: intent.id,
      status: intent.status,
      chain: asset?.chain ?? '',
      assetCode: asset?.assetCode ?? '',
      txHash: chainTx?.txHash ?? intent.reportedTxHash,
      amountPaid: intent.expectedAmount,
      tokensAllocated: allocation?.tokensReal ?? null,
      confirmations: chainTx?.confirmations ?? 0,
      blockTime: chainTx?.blockTime ?? null,
      refund: refund
        ? {
            id: refund.id,
            status: refund.status,
            refundAmount: refund.refundAmount,
            outboundTxHash: refund.outboundTxHash,
          }
        : null,
      createdAt: intent.createdAt,
      updatedAt: intent.updatedAt,
    };
  }
}
