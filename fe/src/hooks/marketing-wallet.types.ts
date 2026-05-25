import type { IWalletTransactionSimulationResult } from '@/dal/app/transactions/transactions.types';

export type MarketingWalletUnsupportedReason =
  | 'missing_provider'
  | 'unsupported_injected_provider'
  | 'unsupported_walletconnect_session'
  | 'inconclusive_walletconnect_session'
  | 'missing_walletconnect_eth_sendTransaction'
  | 'missing_switch_chain'
  | 'wrong_chain'
  | 'account_mismatch'
  | 'provider_disconnected';

export type MarketingWalletExecutionReadiness = 'checking' | 'ready' | 'unsupported';

export type MarketingWalletProviderStatus = 'disconnected' | 'connected' | 'checking';

export type MarketingWalletConnectorKind = 'injected' | 'walletconnect';

export type MarketingWalletConnectionErrorCode =
  | 'connector_unavailable'
  | 'user_rejected'
  | 'connector_failed'
  | 'already_connected'
  | 'reconnect_required';

export type MarketingWalletVerificationStatus = 'unverified' | 'verifying' | 'verified';

export type MarketingWalletSubmissionStatus =
  | 'idle'
  | 'creating_intent'
  | 'waiting_payment'
  | 'simulating'
  | 'awaiting_wallet_approval'
  | 'tracking'
  | 'success'
  | 'failed';

export type MarketingWalletCheckoutErrorReason =
  | 'connection_canceled'
  | 'connection_failed'
  | 'unsupported_wallet'
  | 'verification_failed'
  | 'wrong_chain'
  | 'simulate_failed'
  | 'send_canceled'
  | 'send_failed'
  | 'track_failed';

export type MarketingWalletProviderState = {
  status: MarketingWalletProviderStatus;
  address: `0x${string}` | null;
  chainId: number | null;
  connectorKind: MarketingWalletConnectorKind | null;
  connectorName: string | null;
  walletConnectTopic: string | null;
  executionReadiness: MarketingWalletExecutionReadiness;
  unsupportedReason: MarketingWalletUnsupportedReason | null;
  availableConnectorNames: string[];
  pendingConnectorName: string | null;
  connectionErrorCode: MarketingWalletConnectionErrorCode | null;
  connectionErrorMessage: string | null;
  autoReconnectSuppressed: boolean;
};

export type MarketingWalletVerificationState = {
  status: MarketingWalletVerificationStatus;
  walletAddress: `0x${string}` | null;
  chainId: number | null;
  error: string | null;
};

export type MarketingWalletCheckoutState = {
  selectedAssetId: string | null;
  amountDisplay: string;
  submission: MarketingWalletSubmissionStatus;
  simulation: IWalletTransactionSimulationResult | null;
  receiptPublicId: string | null;
  txHash: `0x${string}` | null;
  errorReason: MarketingWalletCheckoutErrorReason | null;
  errorMessage: string | null;
};
