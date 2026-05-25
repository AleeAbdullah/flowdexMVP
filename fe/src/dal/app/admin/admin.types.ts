import type { IPaymentPublic, PaymentAsset, PaymentChain, PaymentStatus } from '@/dal/app/payments/payments.types';

export type IAdminPaymentListItem = IPaymentPublic & {
  rawPayload: Record<string, unknown> | null;
  tokenAmount: string;
  usdAmount: string;
};

export type IAdminStats = {
  totalPaymentCount: number;
  confirmedPaymentCount: number;
  pendingPaymentCount: number;
  failedPaymentCount: number;
  totalConfirmedUsd: string;
  latestPaymentAt: string | null;
  countsByStatus: Record<string, number>;
  volumeByChain: Record<string, string>;
};

export type AdminPaymentFilters = {
  status?: PaymentStatus | string;
  chain?: PaymentChain | string;
  asset?: PaymentAsset | string;
  senderAddress?: string;
  receiverAddress?: string;
  from?: string;
  to?: string;
  assetCode?: string;
  network?: string;
  walletAddress?: string;
};

export type AdminTransactionFilters = AdminPaymentFilters;

export type IAdminPaymentsResponse = {
  items: IAdminPaymentListItem[];
};
