export type IAdminTransactionListItem = {
  id: string;
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
  status: string;
  txHash: string | null;
  expectedRecipientAddress: string;
  actualFromAddress: string | null;
  actualToAddress: string | null;
  actualAmountBaseUnits: string | null;
  failureReason: string | null;
  blockNumber: string | null;
  confirmedAt: string | null;
  simulationId: string | null;
  createdAt: string;
  updatedAt: string;
};

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
  walletAddress?: string;
  from?: string;
  to?: string;
};

export type IAdminTransactionsResponse = {
  items: IAdminTransactionListItem[];
};
