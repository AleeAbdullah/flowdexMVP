import type { BuyAssetOption, BuyMarketModel, BuySnapshot } from './buy-page-types';
import { parseDecimal } from './utils';

const VESTING_LABELS = ['5% TGE', '12mo cliff', '24mo vest', 'Full unlock 36 months'];
const LISTING_REFERENCE_USD = 0.05;
const STAKING_APY_TEXT = '12-18%';

function toAssetLabel(code: string) {
  const labels: Record<string, string> = {
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDT_TRC20: 'Tether TRC20',
    USDC: 'USD Coin',
    BNB: 'BNB',
    SOL: 'Solana',
    BTC: 'Bitcoin',
  };

  return labels[code] ?? code;
}

function buildAssetOptions(snapshot: NonNullable<BuySnapshot>): BuyAssetOption[] {
  return snapshot.assets.map((asset) => {
    const code = asset.asset.toUpperCase();
    return {
      code,
      label: toAssetLabel(code),
      symbol: code,
      chain: asset.chain,
      usdPrice: parseDecimal(asset.priceUsd),
      minAmount: 0,
      minConfirmations: 0,
    };
  });
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

export function buildBuyMarketModel(snapshot: BuySnapshot): BuyMarketModel {
  if (!snapshot) {
    return {
      currentTier: 0,
      tokenPriceUsd: 0,
      listingReferenceUsd: LISTING_REFERENCE_USD,
      discountPercent: 0,
      fundsRaisedUsd: 0,
      targetRaisedUsd: 0,
      remainingRaiseUsd: 0,
      tokensSold: 0,
      nextTierTokenPriceUsd: null,
      raisedProgressPercent: 0,
      stakingApyText: STAKING_APY_TEXT,
      vestingLabels: [...VESTING_LABELS],
      assetOptions: [],
      sourceUpdatedAt: null,
    };
  }

  const tokenPriceUsd = parseDecimal(snapshot.presale.tokenPriceUsd);
  const fundsRaisedUsd = parseMarketNumber(snapshot.presale.fundsRaisedUsd);
  const tokensSold = parseMarketNumber(snapshot.presale.tokensSold);
  const targetRaisedUsd = parseMarketNumber(snapshot.presale.targetRaisedUsd);
  const remainingRaiseUsd = Math.max(0, targetRaisedUsd - fundsRaisedUsd);
  const raisedProgressPercent = targetRaisedUsd > 0
    ? Math.min(100, (fundsRaisedUsd / targetRaisedUsd) * 100)
    : 0;

  return {
    currentTier: snapshot.presale.currentTier,
    tokenPriceUsd,
    listingReferenceUsd: LISTING_REFERENCE_USD,
    discountPercent: tokenPriceUsd > 0
      ? Math.max(0, Math.round(((LISTING_REFERENCE_USD - tokenPriceUsd) / LISTING_REFERENCE_USD) * 100))
      : 0,
    fundsRaisedUsd,
    targetRaisedUsd,
    remainingRaiseUsd,
    tokensSold,
    nextTierTokenPriceUsd: snapshot.presale.nextTierTokenPriceUsd
      ? parseDecimal(snapshot.presale.nextTierTokenPriceUsd)
      : null,
    raisedProgressPercent,
    stakingApyText: STAKING_APY_TEXT,
    vestingLabels: [...VESTING_LABELS],
    assetOptions: buildAssetOptions(snapshot),
    sourceUpdatedAt: snapshot.presale.updatedAt,
  };
}
