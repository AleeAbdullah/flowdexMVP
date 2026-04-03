'use client';

import { useQuery } from '@tanstack/react-query';
import { marketService } from './services';

export const marketQueryKeys = {
  pricing: ['market', 'pricing'] as const,
  presaleStats: ['market', 'presale-stats'] as const,
  presaleTiers: ['market', 'presale-tiers'] as const,
  presaleConfig: ['market', 'presale-config'] as const,
};

export function usePricing() {
  return useQuery({
    queryKey: marketQueryKeys.pricing,
    queryFn: marketService.getPricing,
  });
}

export function usePresaleStats() {
  return useQuery({
    queryKey: marketQueryKeys.presaleStats,
    queryFn: marketService.getPresaleStats,
  });
}

export function usePresaleTiers() {
  return useQuery({
    queryKey: marketQueryKeys.presaleTiers,
    queryFn: marketService.getPresaleTiers,
  });
}

export function usePresaleConfig() {
  return useQuery({
    queryKey: marketQueryKeys.presaleConfig,
    queryFn: marketService.getPresaleConfig,
  });
}
