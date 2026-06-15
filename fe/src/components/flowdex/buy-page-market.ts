import {
  FALLBACK_ASSET_PRICES,
  LISTING_REFERENCE_USD,
  STAKING_APY_TEXT,
  VESTING_LABELS,
} from './buy-page-content';
import type { BuyAssetOption, BuyMarketModel, BuySnapshot } from './buy-page-types';
import { parseDecimal } from './utils';

function toAssetLabel(code: string) {
  const labels: Record<string, string> = {
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
    BNB: 'BNB',
    SOL: 'Solana',
  };

  return labels[code] ?? code;
}

function buildFallbackAssets(): BuyAssetOption[] {
  return Object.entries(FALLBACK_ASSET_PRICES).map(([code, usdPrice]) => ({
    code,
    label: toAssetLabel(code),
    symbol: code,
    chain: code === 'SOL' ? 'SOLANA' : 'EVM',
    usdPrice,
    minAmount: 0,
    minConfirmations: 0,
  }));
}

function buildAssetOptions(snapshot: NonNullable<BuySnapshot>): BuyAssetOption[] {
  const pricingByAsset = new Map(
    snapshot.pricing.items.map(item => [item.assetCode.toUpperCase(), parseDecimal(item.priceUsd)]),
  );

  const supported = snapshot.presaleConfig.supportedAssets.map((asset) => {
    const code = asset.assetCode.toUpperCase();
    return {
      code,
      label: toAssetLabel(code),
      symbol: code,
      chain: asset.chain,
      usdPrice: pricingByAsset.get(code) ?? FALLBACK_ASSET_PRICES[code] ?? 0,
      minAmount: parseDecimal(asset.minAmount),
      minConfirmations: asset.minConfirmations,
    };
  });

  return supported.length ? supported : buildFallbackAssets();
}

function parseMarketNumber(value?: string | number | null) {
  const directValue = parseDecimal(value);
  if (directValue !== 0 || value === 0 || value === '0') {
    return directValue;
  }

  const match = String(value ?? '')
    .replace(/[$,\s]/gu, '')
    .match(/(-?\d+(?:\.\d+)?)([kmb])?/iu);

  if (!match) {
    return 0;
  }

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  const multiplier = match[2]?.toLowerCase() === 'b'
    ? 1_000_000_000
    : match[2]?.toLowerCase() === 'm'
      ? 1_000_000
      : match[2]?.toLowerCase() === 'k'
        ? 1_000
        : 1;

  return parsed * multiplier;
}

function estimateTargetRaisedUsd(snapshot: NonNullable<BuySnapshot>, currentTokenPriceUsd: number) {
  const activeTier = snapshot.presaleTiers.items.find(item => item.isActive);
  if (activeTier) {
    const tierCapTokens = parseDecimal(activeTier.tokenCapReal);
    if (tierCapTokens > 0 && currentTokenPriceUsd > 0) {
      return tierCapTokens * currentTokenPriceUsd;
    }
  }

  const aggregateCapTokens = snapshot.presaleTiers.items.reduce((acc, tier) => {
    return acc + parseDecimal(tier.tokenCapReal);
  }, 0);

  if (aggregateCapTokens > 0 && currentTokenPriceUsd > 0) {
    return aggregateCapTokens * currentTokenPriceUsd;
  }

  return 0;
}

function findNextTierTokenPriceUsd(snapshot: NonNullable<BuySnapshot>) {
  const activeTier = snapshot.presaleTiers.items.find(item => item.isActive);
  const currentOrder = activeTier?.order ?? snapshot.presaleStats.currentTier;
  const nextTier = [...snapshot.presaleTiers.items]
    .sort((a, b) => a.order - b.order)
    .find(item => item.order > currentOrder);

  if (!nextTier) {
    return null;
  }

  const nextPrice = parseDecimal(nextTier.tokenPriceUsd);
  return nextPrice > 0 ? nextPrice : null;
}

export function buildBuyMarketModel(snapshot: BuySnapshot): BuyMarketModel {
  if (!snapshot) {
    const tokenPriceUsd = 0.001;
    return {
      currentTier: 1,
      tokenPriceUsd,
      listingReferenceUsd: LISTING_REFERENCE_USD,
      discountPercent: Math.max(0, Math.round(((LISTING_REFERENCE_USD - tokenPriceUsd) / LISTING_REFERENCE_USD) * 100)),
      fundsRaisedUsd: 0,
      targetRaisedUsd: 0,
      remainingRaiseUsd: 0,
      tokensSold: 0,
      nextTierTokenPriceUsd: null,
      raisedProgressPercent: 0,
      stakingApyText: STAKING_APY_TEXT,
      vestingLabels: [...VESTING_LABELS],
      assetOptions: buildFallbackAssets(),
      sourceUpdatedAt: null,
    };
  }

  const tokenPriceUsd = parseDecimal(snapshot.presaleStats.currentTokenPriceUsd);
  const fundsRaisedUsd = parseMarketNumber(
    snapshot.presaleStats.fundsRaisedRealUsd || snapshot.presaleStats.fundsRaisedDisplayUsd,
  );
  const tokensSold = parseMarketNumber(
    snapshot.presaleStats.tokensSoldReal || snapshot.presaleStats.tokensSoldDisplay,
  );
  const targetRaisedUsd = estimateTargetRaisedUsd(snapshot, tokenPriceUsd);
  const remainingRaiseUsd = Math.max(0, targetRaisedUsd - fundsRaisedUsd);
  const raisedProgressPercent = targetRaisedUsd > 0
    ? Math.min(100, (fundsRaisedUsd / targetRaisedUsd) * 100)
    : 0;

  return {
    currentTier: snapshot.presaleStats.currentTier,
    tokenPriceUsd,
    listingReferenceUsd: LISTING_REFERENCE_USD,
    discountPercent: tokenPriceUsd > 0
      ? Math.max(0, Math.round(((LISTING_REFERENCE_USD - tokenPriceUsd) / LISTING_REFERENCE_USD) * 100))
      : 0,
    fundsRaisedUsd,
    targetRaisedUsd,
    remainingRaiseUsd,
    tokensSold,
    nextTierTokenPriceUsd: findNextTierTokenPriceUsd(snapshot),
    raisedProgressPercent,
    stakingApyText: STAKING_APY_TEXT,
    vestingLabels: [...VESTING_LABELS],
    assetOptions: buildAssetOptions(snapshot),
    sourceUpdatedAt: snapshot.presaleStats.updatedAt ?? null,
  };
}
