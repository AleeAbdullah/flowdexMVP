export type PricingItem = {
  assetCode: string;
  chain: string;
  priceUsd: string;
  updatedAt: string | null;
};

export type PricingResponse = {
  items: PricingItem[];
};

export type PresaleStats = {
  fundsRaisedRealUsd: string;
  fundsRaisedDisplayUsd: string;
  tokensSoldReal: string;
  tokensSoldDisplay: string;
  currentTier: number;
  currentTokenPriceUsd: string;
  displayMultiplier: number;
  updatedAt: string;
};

export type PresaleTier = {
  id: string;
  order: number;
  tokenPriceUsd: string;
  tokenCapReal: string;
  isActive: boolean;
};

export type PresaleTiersResponse = {
  items: PresaleTier[];
};

export type SupportedAsset = {
  assetCode: string;
  chain: string;
  minConfirmations: number;
  minAmount: string;
};

export type PresaleConfig = {
  supportedAssets: SupportedAsset[];
  minConfirmationsByAsset: Record<string, number>;
  displayMultiplier: number;
};
