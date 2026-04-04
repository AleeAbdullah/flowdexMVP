import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SupportedAssetEntity } from '../pricing/entities/supported-asset.entity';
import { PresaleStateEntity } from '../presale/entities/presale-state.entity';
import { PresaleTierEntity } from '../presale/entities/presale-tier.entity';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { TokenAllocationEntity } from '../transactions/entities/token-allocation.entity';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { BlockchainTransactionEntity } from './entities/blockchain-transaction.entity';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseIntentEntity,
      BlockchainTransactionEntity,
      SupportedAssetEntity,
      WalletEntity,
      TokenAllocationEntity,
      PresaleStateEntity,
      PresaleTierEntity,
    ]),
  ],
  providers: [BlockchainService],
})
export class BlockchainModule {}
