export type IPresaleStats = {
  fundsRaisedRealUsd: string;
  fundsRaisedDisplayUsd: string;
  tokensSoldReal: string;
  tokensSoldDisplay: string;
  currentTier: number;
  currentTokenPriceUsd: string;
  displayMultiplier: number;
  updatedAt: string;
};

export type IPresaleTier = {
  id: string;
  order: number;
  tokenPriceUsd: string;
  tokenCapReal: string;
  isActive: boolean;
};

export type IPresaleTiersResponse = {
  items: IPresaleTier[];
};

export type ISupportedAsset = {
  assetCode: string;
  chain: string;
  minConfirmations: number;
  minAmount: string;
};

export type IPresaleConfig = {
  supportedAssets: ISupportedAsset[];
  minConfirmationsByAsset: Record<string, number>;
  displayMultiplier: number;
};
