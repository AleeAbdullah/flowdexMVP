'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appService } from './services';
import type {
  CreatePurchaseIntentInput,
  CreateWalletChallengeInput,
  ReportTransactionInput,
  VerifyWalletSignatureInput,
} from './types';

export const appQueryKeys = {
  authMe: ['app', 'auth-me'] as const,
  wallets: ['app', 'wallets'] as const,
  transactions: ['app', 'transactions'] as const,
  transaction: (id: string) => ['app', 'transactions', id] as const,
};

export function useAuthMe() {
  return useQuery({
    queryKey: appQueryKeys.authMe,
    queryFn: appService.getAuthMe,
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
      ]);
    },
  });
}

export function useCreatePurchaseIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePurchaseIntentInput) => appService.createPurchaseIntent(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appQueryKeys.transactions });
    },
  });
}

export function useReportPurchaseTransaction(intentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReportTransactionInput) => appService.reportPurchaseTransaction(intentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appQueryKeys.transactions });
      await queryClient.invalidateQueries({ queryKey: appQueryKeys.transaction(intentId) });
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: appQueryKeys.transactions,
    queryFn: appService.getTransactions,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: appQueryKeys.transaction(id),
    queryFn: () => appService.getTransaction(id),
    enabled: Boolean(id),
  });
}
