'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { AlertCircle, BarChart3, Loader2 } from '@/icons';
import {
  CRYPTO_MARKET_DEFAULT_LIMIT,
  CRYPTO_MARKET_DEFAULT_QUOTE,
  useCryptoMarkets,
  useCryptoQuoteCurrencies,
} from '@/dal/market/crypto/crypto.services';
import type { ICryptoMarketAsset } from '@/dal/market/crypto/crypto.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  TRADE_FEATURED_ASSET_COUNT,
  TRADE_QUOTE_CURRENCY_FALLBACKS,
} from './constants';
import {
  formatMarketCompact,
  formatMarketPercent,
  formatMarketPrice,
  formatMarketUpdatedAt,
  parseMarketNumber,
} from './utils';

export function TradeMarketClient() {
  const [quoteCurrency = CRYPTO_MARKET_DEFAULT_QUOTE, setQuoteCurrency] = useQueryState(
    'quote',
    parseAsString.withDefault(CRYPTO_MARKET_DEFAULT_QUOTE).withOptions({ history: 'push' }),
  );
  const normalizedQuoteCurrency = quoteCurrency.toLowerCase();
  const quoteCurrenciesQuery = useCryptoQuoteCurrencies();
  const marketsQuery = useCryptoMarkets({
    quote: normalizedQuoteCurrency,
    limit: CRYPTO_MARKET_DEFAULT_LIMIT,
  });

  const quoteCurrencyOptions = resolveQuoteCurrencyOptions(
    quoteCurrenciesQuery.data?.items,
    normalizedQuoteCurrency,
  );
  const market = marketsQuery.data;
  const assets = market?.items ?? [];
  const featuredAssets = assets.slice(0, TRADE_FEATURED_ASSET_COUNT);
  const hasInitialError = marketsQuery.isError && !market;
  const latestProviderTimestamp = resolveLatestProviderTimestamp(assets);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.35rem] border border-[color-mix(in_srgb,var(--accent-strong)_18%,var(--card-border))] bg-[var(--card-bg)] shadow-[0_28px_90px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg-2)_72%,var(--card-bg))] p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="brand" className="gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--green)] shadow-[0_0_12px_var(--green)]" />
                Live markets
              </Badge>
              <span className="text-xs font-semibold text-[var(--muted)]">
                Prices update every minute
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
                Crypto prices against {normalizedQuoteCurrency.toUpperCase()}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
                Featured assets show the top six by market cap, followed by a ranked market table with current price,
                24h move, market cap, and volume.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={normalizedQuoteCurrency}
              onValueChange={(value) => { void setQuoteCurrency(value.toLowerCase()); }}
            >
              <SelectTrigger
                aria-label="Select quote currency"
                className="h-11 min-w-[132px] rounded-[0.9rem] border-[var(--card-border)] bg-[var(--bg)] text-[var(--text)]"
              >
                <SelectValue placeholder="Quote" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {quoteCurrencyOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="brand"
              className="h-11 rounded-[0.9rem]"
              disabled={marketsQuery.isFetching}
              onClick={() => { void marketsQuery.refetch(); }}
            >
              {marketsQuery.isFetching ? <Loader2 aria-hidden="true" className="animate-spin" /> : <BarChart3 aria-hidden="true" />}
              Update Prices
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-4 md:p-5">
          <MarketStatusBanner
            cacheStatus={market?.cacheStatus}
            isFetching={marketsQuery.isFetching}
            isError={marketsQuery.isError}
            provider={market?.provider}
            servedAt={market?.servedAt}
            latestProviderTimestamp={latestProviderTimestamp}
          />

          {hasInitialError ? (
            <InitialMarketError />
          ) : (
            <>
              <FeaturedMarketStrip
                assets={featuredAssets}
                quoteCurrency={normalizedQuoteCurrency}
                loading={marketsQuery.isLoading}
              />
              <RankedMarketTable
                assets={assets}
                quoteCurrency={normalizedQuoteCurrency}
                loading={marketsQuery.isLoading}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function MarketStatusBanner(props: {
  cacheStatus?: string;
  isFetching: boolean;
  isError: boolean;
  provider?: string;
  servedAt?: string;
  latestProviderTimestamp: string | null;
}) {
  const isStale = props.cacheStatus === 'stale' || (props.isError && Boolean(props.servedAt));
  const statusLabel = isStale
    ? 'Using latest available cached prices'
    : props.isFetching
      ? 'Refreshing market prices'
      : 'Market prices are current';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[1rem] border px-4 py-3 text-sm md:flex-row md:items-center md:justify-between',
        isStale
          ? 'border-amber-400/25 bg-amber-400/10 text-amber-100'
          : 'border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_48%,var(--card-bg))] text-[color-mix(in_srgb,var(--text)_76%,transparent)]',
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {isStale ? <AlertCircle aria-hidden="true" className="h-4 w-4" /> : null}
        <span className="font-semibold">{statusLabel}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color-mix(in_srgb,currentColor_78%,transparent)]">
        <span>Provider: {(props.provider ?? 'CoinGecko').toUpperCase()}</span>
        <span>Last updated: {formatMarketUpdatedAt(props.latestProviderTimestamp ?? props.servedAt ?? null)}</span>
      </div>
    </div>
  );
}

function FeaturedMarketStrip(props: {
  assets: ICryptoMarketAsset[];
  quoteCurrency: string;
  loading: boolean;
}) {
  if (props.loading) {
    return (
      <div className="grid gap-2 lg:grid-cols-6">
        {Array.from({ length: TRADE_FEATURED_ASSET_COUNT }).map((_, index) => (
          <div
            key={index}
            className="h-[128px] animate-pulse rounded-[1rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_48%,var(--card-bg))]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[980px] grid-cols-6 gap-2 lg:min-w-0">
        {props.assets.map(asset => {
          const change = parseMarketNumber(asset.priceChangePercentage24h);
          const positive = change === null || change >= 0;

          return (
            <article
              key={asset.id}
              className="rounded-[1rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_46%,var(--card-bg))] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <AssetIdentity asset={asset} compact />
                <span className={cn('font-data text-xs font-semibold', positive ? 'text-[var(--green)]' : 'text-rose-300')}>
                  {formatMarketPercent(asset.priceChangePercentage24h)}
                </span>
              </div>
              <div className="mt-4 font-data text-xl font-bold text-[var(--text)]">
                {formatMarketPrice(asset.currentPrice, props.quoteCurrency)}
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">
                Rank #{asset.rank || '-'}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function RankedMarketTable(props: {
  assets: ICryptoMarketAsset[];
  quoteCurrency: string;
  loading: boolean;
}) {
  if (props.loading) {
    return (
      <div className="h-[420px] animate-pulse rounded-[1rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_48%,var(--card-bg))]" />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_42%,var(--card-bg))]">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg-2)_76%,var(--card-bg))] px-4 py-3">
        <div>
          <div className="text-sm font-bold text-[var(--text)]">Ranked Crypto Markets</div>
          <div className="mt-1 text-xs text-[var(--muted)]">Sorted by market capitalization</div>
        </div>
        <Badge variant="subtle">{props.quoteCurrency.toUpperCase()}</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[11px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">
              <th className="w-16 px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">24h</th>
              <th className="px-4 py-3 text-right">Market Cap</th>
              <th className="px-4 py-3 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {props.assets.map(asset => {
              const change = parseMarketNumber(asset.priceChangePercentage24h);
              const positive = change === null || change >= 0;

              return (
                <tr
                  key={asset.id}
                  className="border-b border-[var(--card-border)] last:border-b-0 hover:bg-[color-mix(in_srgb,var(--accent-strong)_5%,transparent)]"
                >
                  <td className="px-4 py-4 font-data text-[var(--muted)]">#{asset.rank || '-'}</td>
                  <td className="px-4 py-4">
                    <AssetIdentity asset={asset} />
                  </td>
                  <td className="px-4 py-4 text-right font-data font-semibold text-[var(--text)]">
                    {formatMarketPrice(asset.currentPrice, props.quoteCurrency)}
                  </td>
                  <td className={cn('px-4 py-4 text-right font-data font-semibold', positive ? 'text-[var(--green)]' : 'text-rose-300')}>
                    {formatMarketPercent(asset.priceChangePercentage24h)}
                  </td>
                  <td className="px-4 py-4 text-right font-data text-[color-mix(in_srgb,var(--text)_82%,transparent)]">
                    {formatMarketCompact(asset.marketCap, props.quoteCurrency)}
                  </td>
                  <td className="px-4 py-4 text-right font-data text-[color-mix(in_srgb,var(--text)_82%,transparent)]">
                    {formatMarketCompact(asset.totalVolume, props.quoteCurrency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetIdentity(props: {
  asset: ICryptoMarketAsset;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={cn('border border-[var(--card-border)] bg-[var(--bg-2)]', props.compact ? 'h-8 w-8' : 'h-10 w-10')}>
        {props.asset.imageUrl ? <AvatarImage src={props.asset.imageUrl} alt="" /> : null}
        <AvatarFallback className="bg-[var(--accent-bg)] text-xs font-bold text-[var(--accent-strong)]">
          {props.asset.symbol.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className={cn('truncate font-semibold text-[var(--text)]', props.compact ? 'text-sm' : 'text-base')}>
          {props.asset.symbol}
        </div>
        <div className="truncate text-xs text-[var(--muted)]">
          {props.asset.name}
        </div>
      </div>
    </div>
  );
}

function InitialMarketError() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[1rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_48%,var(--card-bg))] p-8 text-center">
      <AlertCircle aria-hidden="true" className="h-10 w-10 text-amber-200" />
      <h2 className="mt-4 text-xl font-bold text-[var(--text)]">Crypto prices are temporarily unavailable</h2>
      <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted)]">
        FlowDex could not load the first market snapshot. Try updating prices again in a moment.
      </p>
    </div>
  );
}

function resolveQuoteCurrencyOptions(items: string[] | undefined, activeQuoteCurrency: string) {
  const merged = new Set([...(items ?? TRADE_QUOTE_CURRENCY_FALLBACKS), activeQuoteCurrency]);
  return Array.from(merged)
    .filter(Boolean)
    .map(item => item.toLowerCase())
    .sort((a, b) => {
      if (a === CRYPTO_MARKET_DEFAULT_QUOTE) {
        return -1;
      }
      if (b === CRYPTO_MARKET_DEFAULT_QUOTE) {
        return 1;
      }
      return a.localeCompare(b);
    });
}

function resolveLatestProviderTimestamp(assets: ICryptoMarketAsset[]) {
  return assets.find(asset => asset.lastUpdated)?.lastUpdated ?? null;
}
