import type {
  IPaymentIntentPublic,
  IPaymentPublic,
  PaymentAsset,
  PaymentChain,
  PaymentIntentStatus,
} from '@/dal/app/payments/payments.types';

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
};

export type BuyWalletView = {
  paymentWalletAddress: string;
  paymentWalletModalOpen: boolean;
  paymentWalletError: string | null;
};

export type BuyActions = {
  selectAsset: (assetId: string) => void;
  changeAmount: (value: string) => void;
  buy: () => void;
  startNewPayment: () => void;
  setPaymentWalletAddress: (value: string) => void;
  setPaymentWalletModalOpen: (open: boolean) => void;
};
