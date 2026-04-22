import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from '../alchemy/alchemy.module';
import { UsersModule } from '../users/users.module';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { AlchemyWebhooksController } from './alchemy-webhooks.controller';
import { AnalyticsSnapshotEntity } from './entities/analytics-snapshot.entity';
import { LedgerTransactionEntity } from './entities/ledger-transaction.entity';
import { SyncCheckpointEntity } from './entities/sync-checkpoint.entity';
import { WebhookDeliveryEntity } from './entities/webhook-delivery.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    AlchemyModule,
    UsersModule,
    TypeOrmModule.forFeature([
      LedgerTransactionEntity,
      WebhookDeliveryEntity,
      SyncCheckpointEntity,
      AnalyticsSnapshotEntity,
      WalletEntity,
    ]),
  ],
  controllers: [TransactionsController, AlchemyWebhooksController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
