import { API_ROUTES } from '@/api-routes';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type {
  IPresaleConfig,
  IPresaleStats,
  IPresaleTiersResponse,
} from './presale.types';

export const presaleQueryKeys = {
  presaleStats: ['market', 'presale-stats'] as const,
  presaleTiers: ['market', 'presale-tiers'] as const,
  presaleConfig: ['market', 'presale-config'] as const,
};

export const presaleService = {
  getPresaleStats() {
    return api.get<IPresaleStats>(API_ROUTES.public.presale.stats);
  },
  getPresaleTiers() {
    return api.get<IPresaleTiersResponse>(API_ROUTES.public.presale.tiers);
  },
  getPresaleConfig() {
    return api.get<IPresaleConfig>(API_ROUTES.public.presale.config);
  },
};

export function usePresaleStats() {
  return useQuery({
    queryKey: presaleQueryKeys.presaleStats,
    queryFn: presaleService.getPresaleStats,
  });
}

export function usePresaleTiers() {
  return useQuery({
    queryKey: presaleQueryKeys.presaleTiers,
    queryFn: presaleService.getPresaleTiers,
  });
}

export function usePresaleConfig() {
  return useQuery({
    queryKey: presaleQueryKeys.presaleConfig,
    queryFn: presaleService.getPresaleConfig,
  });
}
