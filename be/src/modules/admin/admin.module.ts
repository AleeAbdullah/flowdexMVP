import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { PresaleStateEntity } from '../presale/entities/presale-state.entity';
import { PresaleModule } from '../presale/presale.module';
import { SupportedAssetEntity } from '../pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
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
      PresaleStateEntity,
      SupportedAssetEntity,
    ]),
    TransactionsModule,
    PresaleModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
