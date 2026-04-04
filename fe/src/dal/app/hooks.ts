'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appService } from './services';
import type {
  AdminTransactionFilters,
  CreateRefundInput,
  CreatePurchaseIntentInput,
  CreateWalletChallengeInput,
  ReportTransactionInput,
  VerifyWalletSignatureInput,
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
  adminUnmatchedTransactions: ['app', 'admin', 'reconciliation', 'unmatched'] as const,
  adminRefunds: ['app', 'admin', 'refunds'] as const,
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
      const hasLiveLifecycle = items.some(item => !['CONFIRMED', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(item.status));
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

export function useCreateWalletChallenge() {
  return useMutation({
    mutationFn: (input: CreateWalletChallengeInput) => appService.createWalletChallenge(input),
  });
}

export function useVerifyWalletSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyWalletSignatureInput) => appService.verifyWalletSignature(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.wallets }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.authMe }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.dashboardSummary }),
      ]);
    },
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

export function useCreatePurchaseIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePurchaseIntentInput) => appService.createPurchaseIntent(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.dashboardSummary }),
      ]);
    },
  });
}

export function useReportPurchaseTransaction(intentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReportTransactionInput) => appService.reportPurchaseTransaction(intentId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.transaction(intentId) }),
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
      const hasLiveLifecycle = items.some(item => !['CONFIRMED', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(item.status));
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

      return ['CONFIRMED', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(status) ? false : 15000;
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

export function useAdminUnmatchedTransactions() {
  return useQuery({
    queryKey: appQueryKeys.adminUnmatchedTransactions,
    queryFn: appService.getAdminUnmatchedTransactions,
  });
}

export function useAdminRefunds() {
  return useQuery({
    queryKey: appQueryKeys.adminRefunds,
    queryFn: appService.getAdminRefunds,
  });
}

export function useCreateAdminRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRefundInput) => appService.createAdminRefund(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appQueryKeys.adminRefunds }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.adminStats }),
        queryClient.invalidateQueries({ queryKey: ['app', 'admin', 'transactions'] }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.dashboardSummary }),
      ]);
    },
  });
}
