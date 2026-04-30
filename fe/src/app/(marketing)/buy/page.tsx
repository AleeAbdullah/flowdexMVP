import type { Metadata } from 'next';
import { BuyPageClient } from '@/components/flowdex/buy-page-client';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { presaleService } from '@/dal/market/presale/presale.services';
import { pricingService } from '@/dal/market/pricing/pricing.services';

export const metadata: Metadata = {
  title: 'Buy $FDN | FlowDex',
  description: 'Public presale route with live pricing, tiers, and supported settlement assets.',
};

async function loadBuySnapshot(): Promise<BuySnapshot> {
  try {
    const [pricing, presaleStats, presaleTiers, presaleConfig] = await Promise.all([
      pricingService.getPricing(),
      presaleService.getPresaleStats(),
      presaleService.getPresaleTiers(),
      presaleService.getPresaleConfig(),
    ]);

    return {
      pricing,
      presaleStats,
      presaleTiers,
      presaleConfig,
    };
  } catch {
    return null;
  }
}

export default async function BuyRoute() {
  const snapshot = await loadBuySnapshot();
  return <BuyPageClient snapshot={snapshot} />;
}
