import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { RefundStatus } from '../../common/enums/domain.enums';
import { multiplyFixed, normalizeFixed } from '../../common/utils/decimal';
import { PresaleStateEntity } from '../presale/entities/presale-state.entity';
import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { PresaleService } from '../presale/presale.service';
import { SupportedAssetEntity } from '../pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { AdminAuditLogEntity } from './entities/admin-audit-log.entity';
import { AdminUnmatchedTransactionDto } from './dto/admin.dto';
import { RefundEntity } from './entities/refund.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundsRepository: Repository<RefundEntity>,
    @InjectRepository(AdminAuditLogEntity)
    private readonly adminAuditLogsRepository: Repository<AdminAuditLogEntity>,
    @InjectRepository(PurchaseIntentEntity)
    private readonly purchaseIntentsRepository: Repository<PurchaseIntentEntity>,
    @InjectRepository(BlockchainTransactionEntity)
    private readonly blockchainTransactionsRepository: Repository<BlockchainTransactionEntity>,
    @InjectRepository(PresaleStateEntity)
    private readonly presaleStateRepository: Repository<PresaleStateEntity>,
    @InjectRepository(SupportedAssetEntity)
    private readonly supportedAssetsRepository: Repository<SupportedAssetEntity>,
    private readonly transactionsService: TransactionsService,
    private readonly presaleService: PresaleService,
    private readonly usersService: UsersService,
  ) {}

  async listTransactions(auth: AuthContext, filters: {
    status?: string;
    chain?: string;
    assetCode?: string;
    userId?: string;
    from?: string;
    to?: string;
  }) {
    await this.usersService.syncAndRequireActive(auth);
    return this.transactionsService.listAll(filters);
  }

  async getTransaction(auth: AuthContext, id: string) {
    await this.usersService.syncAndRequireActive(auth);
    return this.transactionsService.getById(id);
  }

  async getStats(auth: AuthContext): Promise<{
    totalConfirmedVolumeReal: string;
    totalConfirmedVolumeDisplay: string;
    transactionCountsByStatus: Record<string, number>;
    unmatchedCount: number;
    refundCount: number;
    currentTier: number;
  }> {
    await this.usersService.syncAndRequireActive(auth);

    const [intents, unmatchedCount, refundCount, currentTier, presaleState] = await Promise.all([
      this.purchaseIntentsRepository.find(),
      this.blockchainTransactionsRepository.count({
        where: { matchedIntentId: IsNull() },
      }),
      this.refundsRepository.count(),
      this.presaleService.getCurrentTier(),
      this.presaleStateRepository.findOne({
        where: { id: '00000000-0000-0000-0000-000000000001' },
      }),
    ]);

    const transactionCountsByStatus = intents.reduce<Record<string, number>>((acc, intent) => {
      acc[intent.status] = (acc[intent.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalConfirmedVolumeReal: presaleState
        ? normalizeFixed(presaleState.totalRaisedUsdReal)
        : '0',
      totalConfirmedVolumeDisplay: presaleState
        ? multiplyFixed(presaleState.totalRaisedUsdReal, presaleState.displayMultiplier.toString())
        : '0',
      transactionCountsByStatus,
      unmatchedCount,
      refundCount,
      currentTier: currentTier.sortOrder,
    };
  }

  async listUnmatched(auth: AuthContext): Promise<{ items: AdminUnmatchedTransactionDto[] }> {
    await this.usersService.syncAndRequireActive(auth);

    const [transactions, assets] = await Promise.all([
      this.blockchainTransactionsRepository.find({
        where: { matchedIntentId: IsNull() },
        order: { createdAt: 'DESC' },
      }),
      this.supportedAssetsRepository.find(),
    ]);

    const assetMap = new Map(assets.map((asset) => [asset.id, asset.assetCode]));

    return {
      items: transactions.map((transaction) => ({
        id: transaction.id,
        chain: transaction.chain,
        assetCode: assetMap.get(transaction.assetId) ?? '',
        txHash: transaction.txHash,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount,
        confirmations: transaction.confirmations,
        reconciliationReason: transaction.reconciliationReason,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      })),
    };
  }

  async createRefund(
    auth: AuthContext,
    purchaseIntentId: string,
    refundAmount: string,
    destinationAddress: string,
    reason: string,
  ): Promise<{ refundId: string; status: RefundStatus }> {
    await this.usersService.syncAndRequireActive(auth);

    const intent = await this.purchaseIntentsRepository.findOne({
      where: { id: purchaseIntentId },
    });

    if (!intent) {
      throw new NotFoundException('Purchase intent not found');
    }

    if (intent.status !== 'CONFIRMED') {
      throw new BadRequestException('Refunds can only be created for confirmed purchase intents');
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

    this.logger.log(`Admin ${auth.sub} created refund ${refund.id} for purchase intent ${purchaseIntentId}.`);

    return { refundId: refund.id, status: refund.status };
  }

  async listRefunds(auth: AuthContext): Promise<{ items: RefundEntity[] }> {
    await this.usersService.syncAndRequireActive(auth);

    return {
      items: await this.refundsRepository.find({
        order: { createdAt: 'DESC' },
      }),
    };
  }
}
