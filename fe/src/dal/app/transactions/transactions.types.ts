import type { WalletNetwork } from '../wallets/wallets.types';

export const TRANSACTION_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  DROPPED: 'DROPPED',
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];

export function isLiveTransactionStatus(status: string | null | undefined) {
  return status === TRANSACTION_STATUSES.SUBMITTED || status === TRANSACTION_STATUSES.PENDING;
}

export function isTerminalTransactionStatus(status: string | null | undefined) {
  return status === TRANSACTION_STATUSES.CONFIRMED
    || status === TRANSACTION_STATUSES.FAILED
    || status === TRANSACTION_STATUSES.DROPPED;
}

export type SimulateTransactionInput = {
  walletId: string;
  network: WalletNetwork;
  chainId: number;
  to: string;
  value?: string;
  data?: string;
};

export type ISimulateTransactionResult = {
  allowed: boolean;
  reason: string | null;
  simulationId: string | null;
};

export type TrackTransactionInput = {
  walletId: string;
  network: WalletNetwork;
  chainId: number;
  assetCode: string;
  amount: string;
  simulationId: string;
  to: string;
  value?: string;
  data?: string;
  operationId?: string;
  txHash?: string;
};

export type ITrackTransactionResult = {
  transactionId: string;
  status: string;
};

export type ITransactionListItem = {
  id: string;
  userId: string;
  walletId: string;
  walletAddress: string;
  network: WalletNetwork;
  chainId: number | null;
  assetCode: string;
  amount: string;
  status: TransactionStatus | string;
  operationId: string | null;
  txHash: string | null;
  blockNumber: string | null;
  blockTime: string | null;
  confirmedAt: string | null;
  failureReason: string | null;
  settlementDiagnostic: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ITransactionsResponse = {
  items: ITransactionListItem[];
};
