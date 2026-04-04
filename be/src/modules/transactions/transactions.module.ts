import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefundEntity } from '../admin/entities/refund.entity';
import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { SupportedAssetEntity } from '../pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { UsersModule } from '../users/users.module';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { TokenAllocationEntity } from './entities/token-allocation.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      PurchaseIntentEntity,
      BlockchainTransactionEntity,
      RefundEntity,
      TokenAllocationEntity,
      SupportedAssetEntity,
      WalletEntity,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
