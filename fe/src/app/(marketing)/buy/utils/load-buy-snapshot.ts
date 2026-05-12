import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { presaleService } from '@/dal/market/presale/presale.services';
import { pricingService } from '@/dal/market/pricing/pricing.services';

export async function loadBuySnapshot(): Promise<BuySnapshot> {
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
