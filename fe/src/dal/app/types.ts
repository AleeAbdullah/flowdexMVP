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

export type DashboardSummary = {
  profile: {
    userId: string;
    email: string;
    role: AppUserRole;
    status: string;
  };
  walletSummary: {
    linkedWalletCount: number;
    primaryWallet: {
      id: string;
      chain: Wallet['chain'];
      address: string;
      verifiedAt: string | null;
    } | null;
  };
  activePurchaseIntentCount: number;
  confirmedTransactionCount: number;
  totalContributedAmount: string;
  totalAllocatedTokens: string;
  recentTransactions: TransactionListItem[];
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
  userId: string;
  status: string;
  walletId: string;
  walletAddress: string | null;
  chain: string;
  assetCode: string;
  txHash: string | null;
  reportedTxHash: string | null;
  matchedTxHash: string | null;
  amountPaid: string;
  tokensAllocated: string | null;
  verificationFailureReason: string | null;
  refundEligible: boolean;
  confirmations: number;
  blockTime: string | null;
  confirmedAt: string | null;
  refund: TransactionRefund | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionsResponse = {
  items: TransactionListItem[];
};

export type AdminStats = {
  totalConfirmedVolumeReal: string;
  totalConfirmedVolumeDisplay: string;
  transactionCountsByStatus: Record<string, number>;
  unmatchedCount: number;
  refundCount: number;
  currentTier: number;
};

export type AdminTransactionFilters = {
  status?: string;
  chain?: string;
  assetCode?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export type AdminTransactionsResponse = {
  items: TransactionListItem[];
};

export type AdminUnmatchedTransaction = {
  id: string;
  chain: string;
  assetCode: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  confirmations: number;
  reconciliationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUnmatchedTransactionsResponse = {
  items: AdminUnmatchedTransaction[];
};

export type RefundRecord = {
  id: string;
  purchaseIntentId: string;
  approvedByUserId: string;
  assetId: string;
  refundAmount: string;
  destinationAddress: string;
  outboundTxHash: string | null;
  status: string;
  reason: string;
  createdAt: string;
  processedAt: string | null;
};

export type RefundListResponse = {
  items: RefundRecord[];
};

export type CreateRefundInput = {
  purchaseIntentId: string;
  refundAmount: string;
  destinationAddress: string;
  reason: string;
};
