import type {
  IPaymentIntentPublic,
  IPaymentPublic,
  PaymentAsset,
  PaymentChain,
  PaymentIntentStatus,
} from '@/dal/app/payments/payments.types';

export type BuyFlowState =
  | 'disconnected'
  | 'checking_wallet'
  | 'unsupported_wallet'
  | 'unverified'
  | 'wrong_chain'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'creating_intent'
  | 'waiting_payment'
  | 'confirmed'
  | 'failed';

export type BuySubmissionState =
  | 'idle'
  | 'creating_intent'
  | 'waiting_payment'
  | 'success'
  | 'failed'
  | 'simulating'
  | 'awaiting_wallet_approval'
  | 'tracking';

export type BuyIssueReason =
  | 'connectionCanceled'
  | 'connectionFailed'
  | 'unsupportedWallet'
  | 'verificationFailed'
  | 'wrongChain'
  | 'simulateFailed'
  | 'sendCanceled'
  | 'sendFailed'
  | 'trackFailed'
  | 'intentFailed'
  | 'invalidPaymentWallet';

export type BuyUiTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type BuyActionId =
  | 'verifyWallet'
  | 'switchNetwork'
  | 'submitContribution'
  | 'retryTracking'
  | 'viewReceipts'
  | 'disconnectWallet'
  | 'startNewPayment';

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
  code: PaymentAsset;
  label: string;
  chain: PaymentChain | 'BASE_SEPOLIA' | 'ETH_SEPOLIA';
  networkLabel?: string;
  chainId: number | null;
  decimals: number;
  usdPrice: number;
  minAmount?: number;
  minConfirmations?: number;
};

export type ActivePaymentView = {
  intent: IPaymentIntentPublic;
  payment: IPaymentPublic | null;
};

export type PaymentInstructionSummary = {
  status: PaymentIntentStatus;
  statusTitle: string;
  statusDescription: string;
  statusTone: BuyUiTone;
  exactAmountDisplay: string;
  receiverAddress: string;
  networkLabel: string;
  expiresAtDisplay: string;
  paymentUri: string | null;
  qrValue: string;
  txHash: string | null;
};
