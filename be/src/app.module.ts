import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from './modules/alchemy/alchemy.module';
import { AuthContextModule } from './modules/auth-context/auth-context.module';
import { MarketsModule } from './modules/markets/markets.module';
import { AdminModule } from './modules/admin/admin.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './infrastructure/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    ScheduleModule.forRoot(),
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
    TransactionsModule,
    MarketsModule,
    AdminModule,
  ],
})
export class AppModule {}
