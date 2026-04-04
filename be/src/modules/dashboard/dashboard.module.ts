import { Module } from '@nestjs/common';

import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [UsersModule, WalletsModule, TransactionsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
