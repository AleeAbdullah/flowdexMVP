const TRANSACTION_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];

export function isTerminalTransactionStatus(status: string | null | undefined) {
  return status === TRANSACTION_STATUSES.CONFIRMED
    || status === TRANSACTION_STATUSES.FAILED;
}

export type IWalletTransactionRequest = {
  to: `0x${string}`;
  chainId: number;
  value: `0x${string}`;
  data: `0x${string}`;
  gas?: `0x${string}`;
  gasPrice?: `0x${string}`;
  maxFeePerGas?: `0x${string}`;
  maxPriorityFeePerGas?: `0x${string}`;
};

export type IWalletTransactionSimulationResult = {
  allowed: boolean;
  reason: string | null;
  simulationId: string | null;
  request: IWalletTransactionRequest | null;
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
