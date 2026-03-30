import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PresaleModule } from '../presale/presale.module';
import { PricingModule } from '../pricing/pricing.module';
import { UsersModule } from '../users/users.module';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { PurchaseIntentEntity } from './entities/purchase-intent.entity';
import { PurchaseIntentsController } from './purchase-intents.controller';
import { PurchaseIntentsService } from './purchase-intents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseIntentEntity, WalletEntity]),
    UsersModule,
    WalletsModule,
    PricingModule,
    PresaleModule,
  ],
  controllers: [PurchaseIntentsController],
  providers: [PurchaseIntentsService],
  exports: [PurchaseIntentsService],
})
export class PurchaseIntentsModule {}
