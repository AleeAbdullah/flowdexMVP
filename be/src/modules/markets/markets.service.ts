import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

import { env } from '../../infrastructure/config/env';
import {
  CryptoMarketAssetDto,
  CryptoMarketsQueryDto,
  CryptoMarketsResponseDto,
  CryptoQuoteCurrenciesResponseDto,
} from './dto/markets.dto';

type CacheStatus = CryptoMarketsResponseDto['cacheStatus'];

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

type CoinGeckoMarketAsset = {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  last_updated: string | null;
};

const DEFAULT_QUOTE_CURRENCY = 'usd';
const DEFAULT_LIMIT = 25;
const MARKETS_CACHE_TTL_MS = 60_000;
const QUOTE_CURRENCIES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_QUOTE_CURRENCIES = [
  'usd',
  'eur',
  'gbp',
  'cad',
  'aud',
  'jpy',
  'pkr',
  'inr',
  'btc',
  'eth',
  'bnb',
  'sol',
];

@Injectable()
export class MarketsService {
  private readonly providerName = 'coingecko';
  private readonly marketsCache = new Map<string, CacheEntry<CryptoMarketsResponseDto>>();
  private readonly spotPriceCache = new Map<string, CacheEntry<string>>();
  private quoteCurrenciesCache: CacheEntry<CryptoQuoteCurrenciesResponseDto> | null = null;

  async getCryptoMarkets(query: CryptoMarketsQueryDto): Promise<CryptoMarketsResponseDto> {
    const quoteCurrency = this.normalizeQuoteCurrency(query.quote);
    const limit = query.limit ?? DEFAULT_LIMIT;
    await this.assertSupportedQuoteCurrency(quoteCurrency);

    const cacheKey = `${quoteCurrency}:${limit}`;
    const cached = this.marketsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return this.withResponseMetadata(cached.data, 'cached');
    }

    try {
      const providerItems = await this.fetchCoinGeckoMarkets(quoteCurrency, limit);
      const response: CryptoMarketsResponseDto = {
        items: providerItems.map(item => this.mapCoinGeckoAsset(item, quoteCurrency)),
        quoteCurrency,
        provider: this.providerName,
        servedAt: new Date().toISOString(),
        cacheStatus: 'fresh',
      };

      this.marketsCache.set(cacheKey, {
        data: response,
        expiresAt: Date.now() + MARKETS_CACHE_TTL_MS,
      });

      return response;
    } catch (error) {
      if (cached) {
        return this.withResponseMetadata(cached.data, 'stale');
      }

      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'Crypto market data is temporarily unavailable',
      );
    }
  }

  async getCryptoQuoteCurrencies(): Promise<CryptoQuoteCurrenciesResponseDto> {
    if (this.quoteCurrenciesCache && this.quoteCurrenciesCache.expiresAt > Date.now()) {
      return this.withResponseMetadata(this.quoteCurrenciesCache.data, 'cached');
    }

    try {
      const items = await this.fetchCoinGeckoQuoteCurrencies();
      const response: CryptoQuoteCurrenciesResponseDto = {
        items: items.length ? items : FALLBACK_QUOTE_CURRENCIES,
        provider: this.providerName,
        servedAt: new Date().toISOString(),
        cacheStatus: 'fresh',
      };

      this.quoteCurrenciesCache = {
        data: response,
        expiresAt: Date.now() + QUOTE_CURRENCIES_CACHE_TTL_MS,
      };

      return response;
    } catch {
      if (this.quoteCurrenciesCache) {
        return this.withResponseMetadata(this.quoteCurrenciesCache.data, 'stale');
      }

      return {
        items: FALLBACK_QUOTE_CURRENCIES,
        provider: this.providerName,
        servedAt: new Date().toISOString(),
        cacheStatus: 'stale',
      };
    }
  }

  async getCryptoSpotPriceUsd(assetCode: string): Promise<string | null> {
    const normalized = assetCode.trim().toUpperCase();
    const cached = this.spotPriceCache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const id = this.coinGeckoIdForAsset(normalized);
    if (!id) {
      return null;
    }

    const url = this.buildProviderUrl('/simple/price', {
      ids: id,
      vs_currencies: 'usd',
    });

    const response = await fetch(url, {
      headers: this.buildProviderHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as Record<string, { usd?: unknown }>;
    const usd = payload[id]?.usd;
    if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) {
      return null;
    }

    const price = String(usd);
    this.spotPriceCache.set(normalized, {
      data: price,
      expiresAt: Date.now() + MARKETS_CACHE_TTL_MS,
    });

    return price;
  }

  private async assertSupportedQuoteCurrency(quoteCurrency: string): Promise<void> {
    const currencies = await this.getCryptoQuoteCurrencies();
    if (!currencies.items.includes(quoteCurrency)) {
      throw new BadRequestException(`Unsupported quote currency: ${quoteCurrency}`);
    }
  }

  private normalizeQuoteCurrency(quoteCurrency?: string): string {
    return (quoteCurrency || DEFAULT_QUOTE_CURRENCY).trim().toLowerCase();
  }

  private coinGeckoIdForAsset(assetCode: string): string | null {
    const ids: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
    };

    return ids[assetCode] ?? null;
  }

  private async fetchCoinGeckoMarkets(quoteCurrency: string, limit: number): Promise<CoinGeckoMarketAsset[]> {
    const url = this.buildProviderUrl('/coins/markets', {
      vs_currency: quoteCurrency,
      order: 'market_cap_desc',
      per_page: String(limit),
      page: '1',
      sparkline: 'false',
      price_change_percentage: '24h',
    });

    const response = await fetch(url, {
      headers: this.buildProviderHeaders(),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko markets request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error('CoinGecko markets response was not an array');
    }

    return payload as CoinGeckoMarketAsset[];
  }

  private async fetchCoinGeckoQuoteCurrencies(): Promise<string[]> {
    const url = this.buildProviderUrl('/simple/supported_vs_currencies');
    const response = await fetch(url, {
      headers: this.buildProviderHeaders(),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko currencies request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error('CoinGecko currencies response was not an array');
    }

    return payload
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.toLowerCase());
  }

  private buildProviderUrl(pathname: string, params?: Record<string, string>): URL {
    const url = new URL(`${this.resolveProviderBaseUrl()}${pathname}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url;
  }

  private resolveProviderBaseUrl(): string {
    return env.coinGeckoApiBaseUrl || (env.coinGeckoApiKey
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3');
  }

  private buildProviderHeaders(): Record<string, string> {
    if (!env.coinGeckoApiKey) {
      return {};
    }

    return { 'x-cg-pro-api-key': env.coinGeckoApiKey };
  }

  private mapCoinGeckoAsset(item: CoinGeckoMarketAsset, quoteCurrency: string): CryptoMarketAssetDto {
    return {
      id: item.id,
      symbol: item.symbol.toUpperCase(),
      name: item.name,
      imageUrl: item.image,
      rank: item.market_cap_rank ?? 0,
      quoteCurrency,
      currentPrice: this.toNullableString(item.current_price) ?? '0',
      marketCap: this.toNullableString(item.market_cap),
      totalVolume: this.toNullableString(item.total_volume),
      priceChangePercentage24h: this.toNullableString(item.price_change_percentage_24h),
      lastUpdated: item.last_updated,
    };
  }

  private toNullableString(value: number | null): string | null {
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
  }

  private withResponseMetadata<T extends { servedAt: string; cacheStatus: CacheStatus }>(
    response: T,
    cacheStatus: CacheStatus,
  ): T {
    return {
      ...response,
      servedAt: new Date().toISOString(),
      cacheStatus,
    };
  }
}
