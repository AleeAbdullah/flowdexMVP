import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from './modules/alchemy/alchemy.module';
import { AuthContextModule } from './modules/auth-context/auth-context.module';
import { MarketsModule } from './modules/markets/markets.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './infrastructure/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    JwtModule.register({ global: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', ttl: 60_000, limit: 1_000 },
        { name: 'intent', ttl: 60_000, limit: 5 },
        { name: 'status', ttl: 60_000, limit: 30 },
        { name: 'history', ttl: 60_000, limit: 20 },
        { name: 'portfolio', ttl: 60_000, limit: 20 },
        { name: 'leaders', ttl: 60_000, limit: 30 },
        { name: 'buyConfig', ttl: 60_000, limit: 30 },
        { name: 'walletAction', ttl: 60_000, limit: 10 },
        { name: 'walletTxResult', ttl: 60_000, limit: 10 },
      ],
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
    AlchemyModule,
    UsersModule,
    AuthContextModule,
    PaymentsModule,
    MarketsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
