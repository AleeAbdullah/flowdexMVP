'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appService } from './services';
import type {
  AdminTransactionFilters,
  CreateWalletChallengeInput,
  LinkWalletInput,
  SimulateTransactionInput,
  TrackTransactionInput,
} from './types';

export const appQueryKeys = {
  authMe: ['app', 'auth-me'] as const,
  dashboardSummary: ['app', 'dashboard-summary'] as const,
  wallets: ['app', 'wallets'] as const,
  transactions: ['app', 'transactions'] as const,
  transaction: (id: string) => ['app', 'transactions', id] as const,
  adminStats: ['app', 'admin', 'stats'] as const,
  adminTransactions: (filters?: AdminTransactionFilters) =>
    ['app', 'admin', 'transactions', filters ?? {}] as const,
  adminTransaction: (id: string) => ['app', 'admin', 'transactions', id] as const,
};

export function useAuthMe() {
  return useQuery({
    queryKey: appQueryKeys.authMe,
    queryFn: appService.getAuthMe,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: appQueryKeys.dashboardSummary,
    queryFn: appService.getDashboardSummary,
    refetchInterval: (query) => {
      const items = query.state.data?.recentTransactions ?? [];
      const hasLiveLifecycle = items.some(item => ['SUBMITTED', 'PENDING'].includes(item.status));
      return hasLiveLifecycle ? 15000 : false;
    },
  });
}

export function useWallets() {
  return useQuery({
    queryKey: appQueryKeys.wallets,
    queryFn: appService.getWallets,
  });
}

export function useLinkWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LinkWalletInput) => appService.linkWallet(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.wallets }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.authMe }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.dashboardSummary }),
      ]);
    },
  });
}

export function useCreateWalletChallenge() {
  return useMutation({
    mutationFn: (input: CreateWalletChallengeInput) => appService.createWalletChallenge(input),
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appService.deleteWallet(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.wallets }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.authMe }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.dashboardSummary }),
      ]);
    },
  });
}

export function useSimulateTransaction() {
  return useMutation({
    mutationFn: (input: SimulateTransactionInput) => appService.simulateTransaction(input),
  });
}

export function useTrackTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TrackTransactionInput) => appService.trackTransaction(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.dashboardSummary }),
      ]);
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: appQueryKeys.transactions,
    queryFn: appService.getTransactions,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasLiveLifecycle = items.some(item => ['SUBMITTED', 'PENDING'].includes(item.status));
      return hasLiveLifecycle ? 15000 : false;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: appQueryKeys.transaction(id),
    queryFn: () => appService.getTransaction(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) {
        return 15000;
      }

      return ['CONFIRMED', 'FAILED', 'DROPPED'].includes(status) ? false : 15000;
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: appQueryKeys.adminStats,
    queryFn: appService.getAdminStats,
  });
}

export function useAdminTransactions(filters?: AdminTransactionFilters) {
  return useQuery({
    queryKey: appQueryKeys.adminTransactions(filters),
    queryFn: () => appService.getAdminTransactions(filters),
  });
}

export function useAdminTransaction(id: string) {
  return useQuery({
    queryKey: appQueryKeys.adminTransaction(id),
    queryFn: () => appService.getAdminTransaction(id),
    enabled: Boolean(id),
  });
}

export function useReconcileAdminTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appService.reconcileAdminTransaction(id),
    onSuccess: async (transaction) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.adminTransactions() }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.adminTransaction(transaction.id) }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.dashboardSummary }),
      ]);
    },
  });
}
