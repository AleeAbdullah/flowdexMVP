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
      raisedProgressPercent: 0,
      stakingApyText: STAKING_APY_TEXT,
      vestingLabels: [...VESTING_LABELS],
      assetOptions: buildFallbackAssets(),
      sourceUpdatedAt: null,
    };
  }

  const tokenPriceUsd = parseDecimal(snapshot.presaleStats.currentTokenPriceUsd);
  const fundsRaisedUsd = parseDecimal(
    snapshot.presaleStats.fundsRaisedDisplayUsd || snapshot.presaleStats.fundsRaisedRealUsd,
  );
  const targetRaisedUsd = estimateTargetRaisedUsd(snapshot, tokenPriceUsd);
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
    raisedProgressPercent,
    stakingApyText: STAKING_APY_TEXT,
    vestingLabels: [...VESTING_LABELS],
    assetOptions: buildAssetOptions(snapshot),
    sourceUpdatedAt: snapshot.presaleStats.updatedAt ?? null,
  };
}

