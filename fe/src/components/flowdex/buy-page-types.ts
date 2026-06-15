import type {
  IPresaleConfig,
  IPresaleStats,
  IPresaleTier,
} from '@/dal/market/presale/presale.types';
import type { IPricingItem } from '@/dal/market/pricing/pricing.types';
import type { BUY_TAB_VALUES } from './buy-page-content';

export type BuyTab = (typeof BUY_TAB_VALUES)[number];

export type BuySnapshot = {
  pricing: { items: IPricingItem[] };
  presaleStats: IPresaleStats;
  presaleTiers: { items: IPresaleTier[] };
  presaleConfig: IPresaleConfig;
} | null;

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
