import type { BuyTab } from './buy-page-types';

export const BUY_TAB_VALUES = ['buy', 'portfolio', 'leaders', 'staking', 'referrals'] as const;

export const BUY_TABS: Array<{ value: BuyTab; label: string }> = [
  { value: 'buy', label: 'Buy $FDN' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'leaders', label: 'Leaders' },
  { value: 'staking', label: 'Staking' },
  { value: 'referrals', label: 'Referrals' },
];

export const ASSET_SHOWCASE = [
  'Bitcoin',
  'Ethereum',
  'Tesla',
  'Apple',
  'Gold',
  'EUR/USD',
  'S&P 500',
  'Oil',
  'Nvidia',
  'ETFs',
  '500+ more',
];

export const QUICK_BUY_AMOUNTS = [500, 1000, 2500, 5000];

export const SCENARIOS = [
  { label: 'Listing', multiplier: 50 },
  { label: '5x', multiplier: 250 },
  { label: '10x', multiplier: 500 },
  { label: '50x', multiplier: 2500 },
];

export const LIVE_ACTIVITY = [
  { wallet: '0x6086...ae434', asset: 'ETH', amountUsd: 8859, volume: '8.86M' },
  { wallet: '0x930f...a918B', asset: 'USDT', amountUsd: 5554, volume: '5.55M' },
  { wallet: '0x930f...a918B', asset: 'SOL', amountUsd: 8631, volume: '8.63M' },
];

export const LEADERBOARD = [
  { rank: 1, alias: 'Whale', wallet: '0xD91c...eC34a', amountUsd: 48500 },
  { rank: 2, alias: 'Shark', wallet: '0x82bC...43e5C', amountUsd: 36200 },
  { rank: 3, alias: 'Shark', wallet: '0xAa19...d92F1', amountUsd: 27800 },
  { rank: 4, alias: 'Dolphin', wallet: '0x4b2A...7F12B', amountUsd: 22100 },
  { rank: 5, alias: 'Dolphin', wallet: '0xe8Dc...2239a', amountUsd: 18400 },
  { rank: 6, alias: 'Fish', wallet: '0x3fE7...1bA08', amountUsd: 14200 },
  { rank: 7, alias: 'Fish', wallet: '0x930f...a918B', amountUsd: 10800 },
  { rank: 8, alias: 'Fish', wallet: '0x6086...ae434', amountUsd: 9200 },
];

export const PORTFOLIO_METRICS = {
  tokens: 320_832,
  investedUsd: 9625,
  listingValueUsd: 16_042,
  roiPercent: 66.7,
};

export const PORTFOLIO_HOLDINGS = [
  { label: 'Launch Allocation', tokens: 210_000, note: 'Tier 1 locked' },
  { label: 'Bonus Tokens', tokens: 10_832, note: 'Referral rewards' },
  { label: 'Staking Queue', tokens: 100_000, note: 'Ready on launch' },
];

export const REFERRAL_LINK = 'flowdex.network/buy?ref=FDX-A3B7K9';

export const VESTING_LABELS = ['5% TGE', '12mo cliff', '24mo vest', 'Full unlock 36 months'];

export const LISTING_REFERENCE_USD = 0.05;
export const STAKING_APY_TEXT = '12-18%';

export const FALLBACK_ASSET_PRICES: Record<string, number> = {
  ETH: 2850,
  USDT: 1,
  USDC: 1,
  BNB: 610,
  SOL: 190,
};
