import { API_ROUTES } from '@/api-routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { axiosAuth, extractAxiosError } from '@/lib/axios';
import type {
  IWalletChallenge,
  IWalletSession,
  WalletChallengeInput,
  WalletVerifyInput,
} from './wallet-auth.types';

export const walletAuthQueryKeys = {
  session: ['wallet-auth', 'session'] as const,
};

export const walletAuthService = {
  async createChallenge(input: WalletChallengeInput): Promise<IWalletChallenge> {
    const response = await axiosAuth.post<IWalletChallenge>(API_ROUTES.walletAuth.challenge, input);
    return response.data;
  },
  async verify(input: WalletVerifyInput): Promise<IWalletSession> {
    const response = await axiosAuth.post<IWalletSession>(API_ROUTES.walletAuth.verify, input);
    return response.data;
  },
  async logout(): Promise<{ cleared: true }> {
    const response = await axiosAuth.post<{ cleared: true }>(API_ROUTES.walletAuth.logout);
    return response.data;
  },
  async getSession(): Promise<IWalletSession | null> {
    const response = await axiosAuth.get<IWalletSession | null>(API_ROUTES.walletAuth.session);
    return response.data;
  },
};

export function useWalletSession() {
  return useQuery({
    queryKey: walletAuthQueryKeys.session,
    queryFn: walletAuthService.getSession,
    staleTime: 30_000,
  });
}

export function useCreateWalletChallenge() {
  return useMutation({
    mutationFn: walletAuthService.createChallenge,
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not prepare wallet verification');
    },
  });
}

export function useVerifyWalletChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: walletAuthService.verify,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletAuthQueryKeys.session });
      toast.success('Wallet verified');
    },
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not verify wallet signature');
    },
  });
}

export function useLogoutWalletSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: walletAuthService.logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletAuthQueryKeys.session });
    },
  });
}
