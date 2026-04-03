export type AppUserRole = 'USER' | 'ADMIN';

export type AuthMe = {
  userId: string;
  email: string;
  role: AppUserRole;
  status: string;
  wallets: Wallet[];
};

export type Wallet = {
  id: string;
  chain: 'ETH' | 'ERC20' | 'TRC20';
  address: string;
  isPrimary: boolean;
  verifiedAt: string | null;
};

export type WalletChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

export type WalletListResponse = {
  items: Wallet[];
};

export type CreateWalletChallengeInput = {
  chain: Wallet['chain'];
  address: string;
};

export type VerifyWalletSignatureInput = {
  challengeId: string;
  signature: string;
};

export type CreatePurchaseIntentInput = {
  walletId: string;
  assetCode: string;
  paymentAmount: string;
};

export type PurchaseIntentResponse = {
  intentId: string;
  paymentAddress: string;
  assetCode: string;
  paymentAmount: string;
  assetUsdPrice: string;
  tokenPriceUsd: string;
  tokensAllocatedPreview: string;
  expiresAt: string;
  currentTier: number;
};

export type ReportTransactionInput = {
  txHash: string;
};

export type TransactionRefund = {
  id: string;
  status: string;
  refundAmount: string;
  outboundTxHash: string | null;
};

export type TransactionListItem = {
  id: string;
  status: string;
  chain: string;
  assetCode: string;
  txHash: string | null;
  amountPaid: string;
  tokensAllocated: string | null;
  confirmations: number;
  blockTime: string | null;
  refund: TransactionRefund | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionsResponse = {
  items: TransactionListItem[];
};
