export type IPricingItem = {
  assetCode: string;
  chain: string;
  priceUsd: string;
  updatedAt: string | null;
};

export type IPricingResponse = {
  items: IPricingItem[];
};
