export type BuyFlowState =
  | 'disconnected'
  | 'checking_wallet'
  | 'unsupported_wallet'
  | 'unverified'
  | 'wrong_chain'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'failed';

export type BuySubmissionState = 'idle' | 'simulating' | 'awaiting_wallet_approval' | 'tracking' | 'success' | 'failed';

export type BuyIssueReason =
  | 'connectionCanceled'
  | 'connectionFailed'
  | 'unsupportedWallet'
  | 'verificationFailed'
  | 'wrongChain'
  | 'simulateFailed'
  | 'sendCanceled'
  | 'sendFailed'
  | 'trackFailed';

export type BuyUiTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type BuyActionId =
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
  state: BuyFlowState;
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
  flowState: BuyFlowState;
  submissionState: BuySubmissionState;
  issueReason: BuyIssueReason | null;
  primaryWalletSupportCopy: string;
  selectedAssetCode: string | null;
  selectedChainLabel: string;
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
