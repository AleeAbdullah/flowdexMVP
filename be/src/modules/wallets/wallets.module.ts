import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LedgerTransactionEntity } from '../transactions/entities/ledger-transaction.entity';
import { UsersModule } from '../users/users.module';
import { WalletChallengeEntity } from './entities/wallet-challenge.entity';
import { WalletEntity } from './entities/wallet.entity';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([WalletEntity, WalletChallengeEntity, LedgerTransactionEntity]),
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
