export type BuyConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

export type BuyVerificationState =
  | 'checking'
  | 'unverified'
  | 'verifying'
  | 'verified'
  | 'mismatch'
  | 'failed';

export type BuyNetworkState =
  | 'correct'
  | 'wrong'
  | 'switch-pending'
  | 'switch-failed-manual';

export type BuyContributionState =
  | 'idle'
  | 'no-valid-option'
  | 'simulate-pending'
  | 'simulate-failed'
  | 'send-pending'
  | 'send-canceled'
  | 'send-failed'
  | 'track-pending'
  | 'track-failed'
  | 'receipt-ready';

export type BuyShellStep =
  | 'connectWallet'
  | 'verifyWallet'
  | 'switchNetwork'
  | 'readyToContribute'
  | 'submittingContribution'
  | 'receiptReady'
  | 'recoverFromIssue';

export type BuyIssueReason =
  | 'walletConnectCanceled'
  | 'walletConnectUnavailable'
  | 'walletConnectionFailed'
  | 'verificationFailed'
  | 'sessionWalletMismatch'
  | 'wrongChain'
  | 'chainSwitchFailed'
  | 'noValidContributionOption'
  | 'simulateFailed'
  | 'sendCanceled'
  | 'sendFailed'
  | 'trackFailed';

export type BuyUiTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type BuyActionId =
  | 'connectMetamask'
  | 'connectCoinbaseWallet'
  | 'connectWalletConnect'
  | 'retryConnection'
  | 'verifyWallet'
  | 'switchNetwork'
  | 'submitContribution'
  | 'retryTracking'
  | 'viewReceipts'
  | 'disconnectWallet';

export type BuyInlineAlert = {
  id: string;
  title: string;
  description: string;
  tone: BuyUiTone;
};

export type BuyViewModel = {
  step: BuyShellStep;
  issueReason: BuyIssueReason | null;
  tone: BuyUiTone;
  status: string;
  title: string;
  description: string;
  dominantActionId: BuyActionId | null;
  dominantActionLabel: string | null;
  secondaryActionId: BuyActionId | null;
  secondaryActionLabel: string | null;
  alerts: BuyInlineAlert[];
  showWalletTray: boolean;
  showContributionForm: boolean;
  showContributionPlaceholder: boolean;
  showSupportDisclosure: boolean;
  isBusy: boolean;
};

export type BuyViewModelInput = {
  connectionState: BuyConnectionState;
  verificationState: BuyVerificationState;
  networkState: BuyNetworkState;
  contributionState: BuyContributionState;
  issueReason: BuyIssueReason | null;
  primaryWalletSupportCopy: string;
  selectedAssetCode: string | null;
  selectedChainLabel: string;
  walletConnectEnabled: boolean;
  needsChainVerification: boolean;
  manualChainSwitchHelp: string | null;
  connectedWalletAddress: string | null;
  sessionWalletAddress: string | null;
  contributionErrorMessage: string | null;
};

export type SupportedAssetOption = {
  id: string;
  code: string;
  label: string;
  chain: 'BASE_SEPOLIA' | 'ETH_SEPOLIA';
  chainId: number;
  decimals: number;
  minAmount: number;
  usdPrice: number;
  minConfirmations: number;
};
