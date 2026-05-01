import type { ITransactionListItem } from '../transactions/transactions.types';

export type IAdminStats = {
  totalConfirmedVolume: string;
  totalTransactionCount: number;
  activeTransactionCount: number;
  confirmedTransactionCount: number;
  failedTransactionCount: number;
  lastTransactionAt: string | null;
  transactionCountsByStatus: Record<string, number>;
};

export type AdminTransactionFilters = {
  status?: string;
  network?: string;
  assetCode?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export type IAdminTransactionsResponse = {
  items: ITransactionListItem[];
};
