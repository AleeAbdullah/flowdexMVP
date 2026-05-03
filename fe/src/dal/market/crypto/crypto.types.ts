export type CryptoMarketCacheStatus = 'fresh' | 'cached' | 'stale';

export type ICryptoMarketAsset = {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  rank: number;
  quoteCurrency: string;
  currentPrice: string;
  marketCap: string | null;
  totalVolume: string | null;
  priceChangePercentage24h: string | null;
  lastUpdated: string | null;
};

export type ICryptoMarketsResponse = {
  items: ICryptoMarketAsset[];
  quoteCurrency: string;
  provider: string;
  servedAt: string;
  cacheStatus: CryptoMarketCacheStatus;
};

export type ICryptoQuoteCurrenciesResponse = {
  items: string[];
  provider: string;
  servedAt: string;
  cacheStatus: CryptoMarketCacheStatus;
};
