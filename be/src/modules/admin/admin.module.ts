import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { PresaleModule } from '../presale/presale.module';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuditLogEntity } from './entities/admin-audit-log.entity';
import { RefundEntity } from './entities/refund.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefundEntity,
      AdminAuditLogEntity,
      PurchaseIntentEntity,
      BlockchainTransactionEntity,
    ]),
    TransactionsModule,
    PresaleModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
