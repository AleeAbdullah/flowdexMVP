export const PAYMENT_CHAINS = {
  ETHEREUM: 'ETHEREUM',
  SOLANA: 'SOLANA',
  BITCOIN: 'BITCOIN',
  TRON: 'TRON',
} as const;

export const PAYMENT_ASSETS = {
  ETH: 'ETH',
  SOL: 'SOL',
  BTC: 'BTC',
  USDT_TRC20: 'USDT_TRC20',
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
export type PaymentStatus =
  | typeof PAYMENT_INTENT_STATUSES.DETECTED
  | typeof PAYMENT_INTENT_STATUSES.CONFIRMING
  | typeof PAYMENT_INTENT_STATUSES.CONFIRMED
  | typeof PAYMENT_INTENT_STATUSES.FAILED
  | typeof PAYMENT_INTENT_STATUSES.UNDERPAID
  | typeof PAYMENT_INTENT_STATUSES.OVERPAID
  | typeof PAYMENT_INTENT_STATUSES.LATE_PAID;
export type PaymentTransactionIdKind = 'evm_tx_hash' | 'solana_signature' | 'btc_tx_hash' | 'tron_tx_hash';

export type CreatePaymentIntentInput = {
  chain: PaymentChain;
  asset: PaymentAsset;
  tokenAmount: string;
  senderAddress?: string;
};

export type PreparePaymentWalletActionInput = {
  chain: PaymentChain;
  senderAddress: string;
  walletChainId?: string | number;
};

export type IPaymentWalletTransactionRequest = {
  to: `0x${string}`;
  chainId: number;
  value: `0x${string}`;
  data: `0x${string}`;
  gas?: `0x${string}`;
  gasPrice?: `0x${string}`;
  maxFeePerGas?: `0x${string}`;
  maxPriorityFeePerGas?: `0x${string}`;
};

export type IPreparedEvmWalletAction = {
  kind: 'evm_transaction';
  paymentIntentId: string;
  preparedActionId: string;
  chain: typeof PAYMENT_CHAINS.ETHEREUM;
  chainId: number;
  request: IPaymentWalletTransactionRequest;
  expiresAt: string;
};

export type IPreparedSolanaWalletAction = {
  kind: 'solana_transaction';
  paymentIntentId: string;
  preparedActionId: string;
  chain: typeof PAYMENT_CHAINS.SOLANA;
  cluster: 'mainnet-beta';
  walletChainId: string;
  payer: string;
  transaction: string;
  transactionEncoding: 'base64';
  expiresAt: string;
  lastValidBlockHeight: number;
};

export type IPreparedTronWalletAction = {
  kind: 'tron_transaction';
  paymentIntentId: string;
  preparedActionId: string;
  chain: typeof PAYMENT_CHAINS.TRON;
  walletChainId: string;
  tron: {
    kind: 'tron_transaction';
    network: 'mainnet';
    chainId: string;
    walletActionId: string;
    contractAddress: string;
    functionSelector: 'transfer(address,uint256)';
    recipientAddress: string;
    amountBaseUnits: string;
    feeLimitSun: string;
    payerAddress: string;
    payerAddressHex: string;
    unsignedTransaction: ITronUnsignedTransaction;
  };
  expiresAt: string;
};

export type ITronUnsignedTransaction = {
  visible: boolean;
  txID: string;
  raw_data: Record<string, unknown>;
  raw_data_hex: string;
};

export type ITronSignedTransaction = ITronUnsignedTransaction & {
  signature: string[];
};

export type BroadcastPreparedTronTransactionInput = {
  signedTransaction: ITronSignedTransaction;
};

export type BroadcastPreparedTronTransactionResponse = {
  txId: string;
};

export type IPreparedBitcoinWalletAction = {
  kind: 'bitcoin_transfer';
  paymentIntentId: string;
  preparedActionId: string;
  chain: typeof PAYMENT_CHAINS.BITCOIN;
  walletChainId: 'mainnet';
  bitcoin: {
    network: 'mainnet';
    recipientAddress: string;
    amountSats: string;
  };
  expiresAt: string;
};

export type IPreparedWalletAction =
  | IPreparedEvmWalletAction
  | IPreparedSolanaWalletAction
  | IPreparedBitcoinWalletAction
  | IPreparedTronWalletAction;

export type SubmitPaymentTxResultInput = {
  chain: PaymentChain;
  preparedActionId: string;
  txIdKind: PaymentTransactionIdKind;
  txId: string;
};

export type IPaymentCheckoutSession = {
  intent: IPaymentIntentPublic;
  checkoutToken: string;
};

export type IPaymentCheckoutCapability = {
  chain: PaymentChain;
  asset: PaymentAsset;
  walletProvider: 'metamask' | 'metamask_solana' | 'bitcoin' | 'metamask_tron';
  network: 'mainnet' | 'mainnet-beta';
  decimals: number;
  enabled: boolean;
};

export type IPaymentCheckoutCapabilitiesResponse = {
  items: IPaymentCheckoutCapability[];
};

export type IPaymentBuyAsset = IPaymentCheckoutCapability & {
  priceUsd: string;
  quotedAt: string;
  cacheStatus: 'fresh' | 'cached' | 'fixed';
};

export type IPaymentBuyConfigResponse = {
  presale: {
    currentTier: number;
    tokenPriceUsd: string;
    nextTierTokenPriceUsd: string | null;
    fundsRaisedUsd: string;
    tokensSold: string;
    currentTierTokenCap: string;
    aggregateTokenCap: string;
    targetRaisedUsd: string;
    updatedAt: string;
  };
  assets: IPaymentBuyAsset[];
  servedAt: string;
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
  transactionId: string | null;
  transactionIdKind: PaymentTransactionIdKind | null;
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

export type IPaymentPortfolioSummary = {
  totalInvestedUsd: string;
  confirmedTokenAmount: string;
  pendingTokenAmount: string;
  reviewTokenAmount: string;
  totalTransactions: number;
  confirmedTransactions: number;
  pendingTransactions: number;
  reviewTransactions: number;
  failedTransactions: number;
  averageEntryPriceUsd: string;
  firstPaymentAt: string | null;
  latestPaymentAt: string | null;
};

export type IPaymentPortfolioBreakdown = {
  key: string;
  totalUsd: string;
  tokenAmount: string;
  transactionCount: number;
};

export type IPaymentPortfolioTransaction = {
  intentId: string;
  paymentId: string | null;
  chain: PaymentChain;
  asset: PaymentAsset;
  tokenAmount: string;
  usdAmount: string;
  expectedAmountBaseUnits: string;
  paidAmountBaseUnits: string | null;
  senderAddress: string | null;
  receiverAddress: string;
  txHash: string | null;
  transactionId: string | null;
  transactionIdKind: PaymentTransactionIdKind | null;
  intentStatus: PaymentIntentStatus;
  paymentStatus: PaymentStatus | null;
  confirmations: number;
  createdAt: string;
  confirmedAt: string | null;
  expiresAt: string;
};

export type IPaymentPortfolioResponse = {
  walletAddress: string;
  summary: IPaymentPortfolioSummary;
  breakdowns: {
    byAsset: IPaymentPortfolioBreakdown[];
    byChain: IPaymentPortfolioBreakdown[];
    byStatus: IPaymentPortfolioBreakdown[];
  };
  transactions: IPaymentPortfolioTransaction[];
};
