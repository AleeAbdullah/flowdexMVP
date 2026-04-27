import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { addFixed, normalizeFixed } from '../../common/utils/decimal';
import { TransactionListItemDto } from '../transactions/dto/transactions.dto';
import { LedgerTransactionEntity } from '../transactions/entities/ledger-transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(LedgerTransactionEntity)
    private readonly ledgerTransactionsRepository: Repository<LedgerTransactionEntity>,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
  ) {}

  async listTransactions(auth: AuthContext, filters: {
    status?: string;
    network?: string;
    assetCode?: string;
    userId?: string;
    from?: string;
    to?: string;
  }): Promise<{ items: TransactionListItemDto[] }> {
    await this.usersService.syncAndRequireActive(auth);
    return this.transactionsService.listAll(filters);
  }

  async getTransaction(auth: AuthContext, id: string): Promise<TransactionListItemDto> {
    await this.usersService.syncAndRequireActive(auth);
    return this.transactionsService.getById(id);
  }

  async reconcileTransaction(auth: AuthContext, id: string): Promise<TransactionListItemDto> {
    await this.usersService.syncAndRequireActive(auth);
    return this.transactionsService.reconcileById(id);
  }

  async getStats(auth: AuthContext): Promise<{
    totalConfirmedVolume: string;
    totalTransactionCount: number;
    activeTransactionCount: number;
    confirmedTransactionCount: number;
    failedTransactionCount: number;
    lastTransactionAt: Date | null;
    transactionCountsByStatus: Record<string, number>;
  }> {
    await this.usersService.syncAndRequireActive(auth);

    const transactions = await this.ledgerTransactionsRepository.find();

    const transactionCountsByStatus = transactions.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.status] = (acc[tx.status] ?? 0) + 1;
      return acc;
    }, {});

    const totalConfirmedVolumeReal = normalizeFixed(
      transactions
        .filter(tx => tx.status === 'CONFIRMED')
        .reduce((sum, tx) => addFixed(sum, tx.amount), '0'),
    );

    const lastTransactionAt = transactions.length > 0
      ? transactions.reduce(
        (latest, tx) => (tx.updatedAt > latest ? tx.updatedAt : latest),
        transactions[0].updatedAt,
      )
      : null;

    return {
      totalConfirmedVolume: totalConfirmedVolumeReal,
      totalTransactionCount: transactions.length,
      activeTransactionCount: (transactionCountsByStatus.SUBMITTED ?? 0) + (transactionCountsByStatus.PENDING ?? 0),
      confirmedTransactionCount: transactionCountsByStatus.CONFIRMED ?? 0,
      failedTransactionCount: (transactionCountsByStatus.FAILED ?? 0) + (transactionCountsByStatus.DROPPED ?? 0),
      lastTransactionAt,
      transactionCountsByStatus,
    };
  }
}
