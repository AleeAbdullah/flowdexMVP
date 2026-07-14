import type { IPaymentBuyConfigResponse } from '@/dal/app/payments/payments.types';

export type BuySnapshot = IPaymentBuyConfigResponse | null;

export type BuyAssetOption = {
  code: string;
  label: string;
  symbol: string;
  chain: string;
  usdPrice: number;
  minAmount: number;
  minConfirmations: number;
};

export type BuyMarketModel = {
  currentTier: number;
  tokenPriceUsd: number;
  listingReferenceUsd: number;
  discountPercent: number;
  fundsRaisedUsd: number;
  targetRaisedUsd: number;
  remainingRaiseUsd: number;
  tokensSold: number;
  nextTierTokenPriceUsd: number | null;
  raisedProgressPercent: number;
  stakingApyText: string;
  vestingLabels: string[];
  assetOptions: BuyAssetOption[];
  sourceUpdatedAt: string | null;
};
