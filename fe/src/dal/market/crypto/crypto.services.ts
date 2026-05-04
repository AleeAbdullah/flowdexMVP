import { API_ROUTES } from '@/api-routes';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type {
  ICryptoMarketsResponse,
  ICryptoQuoteCurrenciesResponse,
} from './crypto.types';

const browserPublicProxyConfig = typeof window === 'undefined'
  ? undefined
  : { baseURL: API_ROUTES.proxy.publicBackend };

export const CRYPTO_MARKET_REFRESH_INTERVAL_MS = 60_000;
export const CRYPTO_MARKET_DEFAULT_LIMIT = 25;
export const CRYPTO_MARKET_DEFAULT_QUOTE = 'usd';

export const cryptoMarketQueryKeys = {
  markets: (input: { quote: string; limit: number }) => [
    'market',
    'crypto',
    input.quote,
    input.limit,
  ] as const,
  quoteCurrencies: ['market', 'crypto', 'quote-currencies'] as const,
};

export const cryptoMarketService = {
  getCryptoMarkets(input: { quote: string; limit?: number }) {
    const quote = input.quote.toLowerCase();
    const limit = input.limit ?? CRYPTO_MARKET_DEFAULT_LIMIT;
    return api.get<ICryptoMarketsResponse>(
      API_ROUTES.public.markets.crypto({ quote, limit }),
      browserPublicProxyConfig,
    );
  },
  getCryptoQuoteCurrencies() {
    return api.get<ICryptoQuoteCurrenciesResponse>(
      API_ROUTES.public.markets.cryptoQuoteCurrencies,
      browserPublicProxyConfig,
    );
  },
};

export function useCryptoMarkets(input: { quote: string; limit?: number }) {
  const quote = input.quote.toLowerCase();
  const limit = input.limit ?? CRYPTO_MARKET_DEFAULT_LIMIT;

  return useQuery({
    queryKey: cryptoMarketQueryKeys.markets({ quote, limit }),
    queryFn: () => cryptoMarketService.getCryptoMarkets({ quote, limit }),
    placeholderData: keepPreviousData,
    refetchInterval: CRYPTO_MARKET_REFRESH_INTERVAL_MS,
  });
}

export function useCryptoQuoteCurrencies() {
  return useQuery({
    queryKey: cryptoMarketQueryKeys.quoteCurrencies,
    queryFn: cryptoMarketService.getCryptoQuoteCurrencies,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
