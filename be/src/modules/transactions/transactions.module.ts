import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefundEntity } from '../admin/entities/refund.entity';
import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { SupportedAssetEntity } from '../pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { TokenAllocationEntity } from './entities/token-allocation.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseIntentEntity,
      BlockchainTransactionEntity,
      RefundEntity,
      TokenAllocationEntity,
      SupportedAssetEntity,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
