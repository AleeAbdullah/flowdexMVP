import { API_ROUTES } from '@/api-routes';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, extractAxiosError } from '@/lib/axios';
import { toast } from 'sonner';
import type {
  CreatePaymentIntentInput,
  IPaymentIntentPublic,
  IPaymentIntentStatusResponse,
  IPaymentsHistoryResponse,
  PaymentHistoryFilters,
} from './payments.types';

export const paymentsQueryKeys = {
  intentStatus: (intentId: string | null | undefined) => ['app', 'payments', 'intent-status', intentId ?? 'none'] as const,
  history: (walletAddress: string | null | undefined) => ['app', 'payments', 'history', walletAddress ?? 'none'] as const,
};

const browserPublicProxyConfig = typeof window === 'undefined'
  ? undefined
  : { baseURL: API_ROUTES.proxy.publicBackend };

export const paymentsService = {
  createPaymentIntent(input: CreatePaymentIntentInput) {
    return api.post<IPaymentIntentPublic>(
      API_ROUTES.public.payments.intents,
      input,
      browserPublicProxyConfig,
    );
  },
  getPaymentIntentStatus(intentId: string) {
    return api.get<IPaymentIntentStatusResponse>(
      API_ROUTES.public.payments.intentStatus(intentId),
      browserPublicProxyConfig,
    );
  },
  getPaymentHistory(filters: PaymentHistoryFilters) {
    return api.get<IPaymentsHistoryResponse>(
      API_ROUTES.public.payments.root,
      { ...browserPublicProxyConfig, params: filters },
    );
  },
};

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (input: CreatePaymentIntentInput) => paymentsService.createPaymentIntent(input),
    onError(error) {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not start this payment');
    },
  });
}

export function usePaymentIntentStatus(intentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: paymentsQueryKeys.intentStatus(intentId),
    queryFn: () => paymentsService.getPaymentIntentStatus(intentId!),
    enabled: Boolean(intentId && enabled),
    refetchInterval: false,
    retry: false,
  });
}

export function usePaymentHistory(walletAddress: string | null) {
  return useQuery({
    queryKey: paymentsQueryKeys.history(walletAddress),
    queryFn: () => paymentsService.getPaymentHistory({ walletAddress: walletAddress! }),
    enabled: Boolean(walletAddress),
  });
}
