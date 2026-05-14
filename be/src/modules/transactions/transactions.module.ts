import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from '../alchemy/alchemy.module';
import { LedgerTransactionEntity } from './entities/ledger-transaction.entity';
import { SimulationIntentEntity } from './entities/simulation-intent.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    AlchemyModule,
    TypeOrmModule.forFeature([
      LedgerTransactionEntity,
      SimulationIntentEntity,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
