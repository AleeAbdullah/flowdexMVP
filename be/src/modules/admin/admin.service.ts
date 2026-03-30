import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { RefundStatus } from '../../common/enums/domain.enums';
import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { PresaleService } from '../presale/presale.service';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { AdminAuditLogEntity } from './entities/admin-audit-log.entity';
import { RefundEntity } from './entities/refund.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundsRepository: Repository<RefundEntity>,
    @InjectRepository(AdminAuditLogEntity)
    private readonly adminAuditLogsRepository: Repository<AdminAuditLogEntity>,
    @InjectRepository(PurchaseIntentEntity)
    private readonly purchaseIntentsRepository: Repository<PurchaseIntentEntity>,
    @InjectRepository(BlockchainTransactionEntity)
    private readonly blockchainTransactionsRepository: Repository<BlockchainTransactionEntity>,
    private readonly transactionsService: TransactionsService,
    private readonly presaleService: PresaleService,
  ) {}

  listTransactions(filters: {
    status?: string;
    chain?: string;
    assetCode?: string;
    userId?: string;
    from?: string;
    to?: string;
  }) {
    return this.transactionsService.listAll(filters);
  }

  getTransaction(id: string) {
    return this.transactionsService.getById(id);
  }

  async getStats(): Promise<{
    totalConfirmedVolumeReal: string;
    totalConfirmedVolumeDisplay: string;
    transactionCountsByStatus: Record<string, number>;
    unmatchedCount: number;
    refundCount: number;
    currentTier: number;
  }> {
    const [intents, unmatchedCount, refundCount, currentTier] = await Promise.all([
      this.purchaseIntentsRepository.find(),
      this.blockchainTransactionsRepository.count({
        where: { matchedIntentId: IsNull() },
      }),
      this.refundsRepository.count(),
      this.presaleService.getCurrentTier(),
    ]);

    const transactionCountsByStatus = intents.reduce<Record<string, number>>((acc, intent) => {
      acc[intent.status] = (acc[intent.status] ?? 0) + 1;
      return acc;
    }, {});

    const totalConfirmedVolumeReal = intents
      .filter((intent) => intent.status === 'CONFIRMED' || intent.status === 'REFUNDED')
      .reduce((sum, intent) => sum + Number(intent.expectedAmount), 0);

    return {
      totalConfirmedVolumeReal: totalConfirmedVolumeReal.toString(),
      totalConfirmedVolumeDisplay: (totalConfirmedVolumeReal * 10).toString(),
      transactionCountsByStatus,
      unmatchedCount,
      refundCount,
      currentTier: currentTier.sortOrder,
    };
  }

  async listUnmatched() {
    return {
      items: await this.blockchainTransactionsRepository.find({
        where: { matchedIntentId: IsNull() },
        order: { createdAt: 'DESC' },
      }),
    };
  }

  async createRefund(
    auth: AuthContext,
    purchaseIntentId: string,
    refundAmount: string,
    destinationAddress: string,
    reason: string,
  ): Promise<{ refundId: string; status: RefundStatus }> {
    const intent = await this.purchaseIntentsRepository.findOne({
      where: { id: purchaseIntentId },
    });

    if (!intent) {
      throw new NotFoundException('Purchase intent not found');
    }

    const existingRefund = await this.refundsRepository.findOne({
      where: { purchaseIntentId },
    });
    if (existingRefund) {
      return { refundId: existingRefund.id, status: existingRefund.status };
    }

    const refund = await this.refundsRepository.save(
      this.refundsRepository.create({
        purchaseIntentId,
        approvedByUserId: auth.sub,
        assetId: intent.assetId,
        refundAmount,
        destinationAddress,
        reason,
        status: RefundStatus.APPROVED,
      }),
    );

    await this.adminAuditLogsRepository.save(
      this.adminAuditLogsRepository.create({
        adminUserId: auth.sub,
        action: 'refund.created',
        targetType: 'refund',
        targetId: refund.id,
        payload: {
          purchaseIntentId,
          refundAmount,
          destinationAddress,
        },
      }),
    );

    return { refundId: refund.id, status: refund.status };
  }

  async listRefunds(): Promise<{ items: RefundEntity[] }> {
    return {
      items: await this.refundsRepository.find({
        order: { createdAt: 'DESC' },
      }),
    };
  }
}
