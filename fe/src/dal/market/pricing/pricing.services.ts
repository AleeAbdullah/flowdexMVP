import { API_ROUTES } from '@/api-routes';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { IPricingResponse } from './pricing.types';

export const pricingQueryKeys = {
  pricing: ['market', 'pricing'] as const,
};

export const pricingService = {
  getPricing() {
    return api.get<IPricingResponse>(API_ROUTES.public.pricing);
  },
};

export function usePricing() {
  return useQuery({
    queryKey: pricingQueryKeys.pricing,
    queryFn: pricingService.getPricing,
  });
}
