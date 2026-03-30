import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthContextModule } from './modules/auth-context/auth-context.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { AdminModule } from './modules/admin/admin.module';
import { PresaleModule } from './modules/presale/presale.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PurchaseIntentsModule } from './modules/purchase-intents/purchase-intents.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { HealthModule } from './infrastructure/health/health.module';
import { QueuesModule } from './infrastructure/queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: process.env.REDIS_URL,
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    HealthModule,
    QueuesModule,
    UsersModule,
    AuthContextModule,
    WalletsModule,
    PricingModule,
    PresaleModule,
    PurchaseIntentsModule,
    TransactionsModule,
    BlockchainModule,
    AdminModule,
  ],
})
export class AppModule {}
