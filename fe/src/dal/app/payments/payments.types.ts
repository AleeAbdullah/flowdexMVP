export const PAYMENT_CHAINS = {
  ETHEREUM: 'ETHEREUM',
  SOLANA: 'SOLANA',
  BITCOIN: 'BITCOIN',
} as const;

export const PAYMENT_ASSETS = {
  ETH: 'ETH',
  SOL: 'SOL',
  BTC: 'BTC',
} as const;

export const PAYMENT_INTENT_STATUSES = {
  WAITING: 'WAITING',
  DETECTED: 'DETECTED',
  CONFIRMING: 'CONFIRMING',
  CONFIRMED: 'CONFIRMED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
  UNDERPAID: 'UNDERPAID',
  OVERPAID: 'OVERPAID',
  LATE_PAID: 'LATE_PAID',
} as const;

export const PAYMENT_STATUSES = {
  DETECTED: 'DETECTED',
  CONFIRMING: 'CONFIRMING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  UNDERPAID: 'UNDERPAID',
  OVERPAID: 'OVERPAID',
  LATE_PAID: 'LATE_PAID',
} as const;

export const PAYMENT_TERMINAL_STATUSES = new Set<PaymentIntentStatus>([
  PAYMENT_INTENT_STATUSES.CONFIRMED,
  PAYMENT_INTENT_STATUSES.EXPIRED,
  PAYMENT_INTENT_STATUSES.FAILED,
  PAYMENT_INTENT_STATUSES.UNDERPAID,
  PAYMENT_INTENT_STATUSES.OVERPAID,
  PAYMENT_INTENT_STATUSES.LATE_PAID,
]);

export type PaymentChain = (typeof PAYMENT_CHAINS)[keyof typeof PAYMENT_CHAINS];
export type PaymentAsset = (typeof PAYMENT_ASSETS)[keyof typeof PAYMENT_ASSETS];
export type PaymentIntentStatus = (typeof PAYMENT_INTENT_STATUSES)[keyof typeof PAYMENT_INTENT_STATUSES];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export type CreatePaymentIntentInput = {
  chain: PaymentChain;
  asset: PaymentAsset;
  tokenAmount: string;
  senderAddress?: string;
};

export type PaymentHistoryFilters = {
  walletAddress: string;
};

export type IPaymentInstructions = {
  chain: PaymentChain;
  asset: PaymentAsset;
  receiverAddress: string;
  expectedAmountBaseUnits: string;
  paymentUri: string | null;
  solanaReference: string | null;
};

export type IPaymentIntentPublic = {
  id: string;
  chain: PaymentChain;
  asset: PaymentAsset;
  tokenAmount: string;
  usdAmount: string;
  expectedAmountBaseUnits: string;
  senderAddress: string | null;
  receiverAddress: string;
  status: PaymentIntentStatus;
  expiresAt: string;
  lastCheckedAt: string | null;
  instructions: IPaymentInstructions;
};

export type IPaymentPublic = {
  intentId: string;
  chain: PaymentChain;
  asset: PaymentAsset;
  amountBaseUnits: string;
  senderAddress: string | null;
  receiverAddress: string;
  txHash: string | null;
  status: PaymentStatus;
  blockNumber: string | null;
  confirmations: number;
  confirmedAt: string | null;
  createdAt: string;
};

export type IPaymentIntentStatusResponse = {
  intent: IPaymentIntentPublic;
  payment: IPaymentPublic | null;
};

export type IPaymentsHistoryResponse = {
  items: IPaymentPublic[];
};

export type IPaymentLeader = {
  rank: number;
  walletAddress: string;
  totalUsd: string;
  paymentCount: number;
  latestPaymentAt: string;
};

export type IPaymentLeadersResponse = {
  items: IPaymentLeader[];
};
