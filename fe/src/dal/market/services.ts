import { api } from '@/lib/api-client';
import { MARKET_API_ROUTES } from './routes';
import type {
  PresaleConfig,
  PresaleStats,
  PresaleTiersResponse,
  PricingResponse,
} from './types';

export const marketService = {
  getPricing() {
    return api.get<PricingResponse>(MARKET_API_ROUTES.pricing);
  },
  getPresaleStats() {
    return api.get<PresaleStats>(MARKET_API_ROUTES.presaleStats);
  },
  getPresaleTiers() {
    return api.get<PresaleTiersResponse>(MARKET_API_ROUTES.presaleTiers);
  },
  getPresaleConfig() {
    return api.get<PresaleConfig>(MARKET_API_ROUTES.presaleConfig);
  },
};

export async function getPublicMarketSnapshot() {
  const [pricing, presaleStats, presaleTiers, presaleConfig] = await Promise.all([
    marketService.getPricing(),
    marketService.getPresaleStats(),
    marketService.getPresaleTiers(),
    marketService.getPresaleConfig(),
  ]);

  return {
    pricing,
    presaleStats,
    presaleTiers,
    presaleConfig,
  };
}
