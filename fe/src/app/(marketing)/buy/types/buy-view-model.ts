import type {
  IPaymentIntentPublic,
  IPaymentPublic,
  PaymentAsset,
  PaymentChain,
  PaymentIntentStatus,
} from '@/dal/app/payments/payments.types';
import type {
  MarketingWalletExecutionReadiness,
  MarketingWalletProviderStatus,
  MarketingWalletUnsupportedReason,
  MarketingWalletVerificationStatus,
} from '@/hooks/marketing-wallet.types';
import type { WalletTxResult } from './checkout-wallet.types';

export type SupportedAssetOption = {
  id: string;
  code: PaymentAsset;
  label: string;
  chain: PaymentChain;
  chainId: number | null;
  decimals: number;
  usdPrice: number;
};

export type ActivePaymentView = {
  intent: IPaymentIntentPublic;
  payment: IPaymentPublic | null;
};

export type PaymentInstructionSummary = {
  intentId: string;
  status: PaymentIntentStatus;
  statusTitle: string;
  statusDescription: string;
  exactAmountDisplay: string;
  receiverAddress: string;
  networkLabel: string;
  expiresAtDisplay: string;
  paymentUri: string | null;
  qrValue: string;
};

export type MarketScenario = {
  label: string;
  price: string;
  cap: string;
  value: string;
  roi: string;
};

export type BuyMarketView = {
  currentTier: number;
  tokenPriceUsd: number;
  listingReferenceUsd: number;
  raisedDisplay: string;
  targetRaisedDisplay: string;
  tokensSoldDisplay: string;
  remainingTokensDisplay: string;
  tokenPriceDisplay: string;
  discountPercentDisplay: string;
  nextTierPriceDisplay: string;
  raisedProgressPercent: number;
};

export type BuyOrderView = {
  selectedAsset: SupportedAssetOption | null;
  supportedAssets: SupportedAssetOption[];
  amountDisplay: string;
  payDisplay: string;
  receiveDisplay: string;
  listingValueDisplay: string;
  roiDisplay: string;
  buyButtonLabel: string;
  error: string | null;
  canSubmit: boolean;
  scenarios: MarketScenario[];
};

export type BuyPaymentView = {
  instruction: PaymentInstructionSummary | null;
  isCreating: boolean;
  isCheckingStatus: boolean;
  statusError: string | null;
  walletTxResult: WalletTxResult | null;
};

export type BuyCheckoutStage =
  | 'closed'
  | 'choose_method'
  | 'connecting_wallet'
  | 'verifying_wallet'
  | 'wallet_ready'
  | 'preparing_wallet_action'
  | 'waiting_for_wallet_approval'
  | 'submitting_tx_result'
  | 'direct_address'
  | 'direct_instructions'
  | 'tracking'
  | 'failed';

export type BuyWalletStatusView = {
  providerStatus: MarketingWalletProviderStatus;
  address: string | null;
  chainId: number | null;
  walletChainId: string | null;
  connectorName: string | null;
  pendingConnectorName: string | null;
  availableConnectorNames: string[];
  executionReadiness: MarketingWalletExecutionReadiness;
  unsupportedReason: MarketingWalletUnsupportedReason | null;
  connectionErrorMessage: string | null;
  verificationStatus: MarketingWalletVerificationStatus;
  verifiedWalletAddress: string | null;
  verificationError: string | null;
  isDisconnecting: boolean;
  isVerifying: boolean;
};

export type BuyWalletView = {
  checkoutStage: BuyCheckoutStage;
  paymentWalletAddress: string;
  paymentWalletError: string | null;
  canUseWalletCheckout: boolean;
  walletStatus: BuyWalletStatusView;
};

export type BuyActions = {
  selectAsset: (assetId: string) => void;
  changeAmount: (value: string) => void;
  buy: () => void;
  closeCheckout: () => void;
  connectWallet: (connectorName: string) => void;
  disconnectWallet: () => void;
  verifyWallet: () => void;
  startWalletPayment: () => void;
  useDirectSend: () => void;
  createDirectPayment: () => void;
  startNewPayment: () => void;
  setPaymentWalletAddress: (value: string) => void;
};
