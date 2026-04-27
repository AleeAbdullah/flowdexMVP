export type AppUserRole = 'USER' | 'ADMIN';

export type WalletNetwork = 'ETH_SEPOLIA' | 'BASE_SEPOLIA';
export type WalletProvider = 'ALCHEMY_EMBEDDED' | 'METAMASK';
export type WalletTrustLevel = 'PROVIDER_ASSERTED' | 'SIGNED';

export type AuthMe = {
  userId: string;
  email: string;
  role: AppUserRole;
  status: string;
  wallets: Wallet[];
};

export type Wallet = {
  id: string;
  address: string;
  network: WalletNetwork;
  chainId: number;
  provider: WalletProvider;
  trustLevel: WalletTrustLevel;
  alchemyAccountId: string;
  alchemyWalletId: string;
  isPrimary: boolean;
  verifiedAt: string | null;
};

export type WalletListResponse = {
  items: Wallet[];
};

export type CreateWalletChallengeInput = {
  provider: 'METAMASK';
  network: WalletNetwork;
  chainId: number;
  address: string;
  origin?: string;
};

export type WalletChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

export type LinkWalletInput = {
  provider?: WalletProvider;
  network: WalletNetwork;
  chainId: number;
  address: string;
  alchemyAccountId?: string;
  alchemyWalletId?: string;
  challengeId?: string;
  signature?: string;
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
      network: WalletNetwork;
      address: string;
      verifiedAt: string | null;
    } | null;
  };
  activeTransactionCount: number;
  confirmedTransactionCount: number;
  totalTrackedVolume: string;
  recentTransactions: TransactionListItem[];
};

export type SimulateTransactionInput = {
  walletId: string;
  network: WalletNetwork;
  chainId: number;
  to: string;
  value?: string;
  data?: string;
};

export type SimulateTransactionResult = {
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

export type TrackTransactionResult = {
  transactionId: string;
  status: string;
};

export type TransactionListItem = {
  id: string;
  userId: string;
  walletId: string;
  walletAddress: string;
  network: WalletNetwork;
  chainId: number | null;
  assetCode: string;
  amount: string;
  status: 'SUBMITTED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'DROPPED' | string;
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

export type TransactionsResponse = {
  items: TransactionListItem[];
};

export type AdminStats = {
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

export type AdminTransactionsResponse = {
  items: TransactionListItem[];
};
