export const TRANSACTION_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];

export function isLiveTransactionStatus(status: string | null | undefined) {
  return status === TRANSACTION_STATUSES.PENDING;
}

export function isTerminalTransactionStatus(status: string | null | undefined) {
  return status === TRANSACTION_STATUSES.CONFIRMED
    || status === TRANSACTION_STATUSES.FAILED;
}

export type SimulateTransactionInput = {
  chainId: number;
  assetType: 'native' | 'erc20';
  assetCode: string;
  assetContractAddress?: string;
  assetDecimals: number;
  amountBaseUnits: string;
  amountDisplay: string;
};

export type IWalletTransactionRequest = {
  to: string;
  chainId: number;
  value: string;
  data: string;
};

export type IWalletTransactionSimulationResult = {
  allowed: boolean;
  reason: string | null;
  simulationId: string | null;
  request: IWalletTransactionRequest | null;
};

export type TrackTransactionInput = {
  simulationId: string;
  txHash?: string;
};

export type IWalletTransactionTrackResult = {
  publicId: string;
  status: string;
};

export type IWalletTransactionListItem = {
  publicId: string;
  walletAddress: string;
  walletAddressChecksum: string;
  network: string;
  chainId: number;
  assetType: 'native' | 'erc20';
  assetCode: string;
  assetContractAddress: string | null;
  assetDecimals: number;
  amountBaseUnits: string;
  amountDisplay: string;
  status: TransactionStatus | string;
  txHash: string | null;
  expectedRecipientAddress: string;
  actualFromAddress: string | null;
  actualToAddress: string | null;
  actualAmountBaseUnits: string | null;
  failureReason: string | null;
  blockNumber: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IWalletTransactionsResponse = {
  items: IWalletTransactionListItem[];
};
