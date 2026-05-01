import { API_ROUTES } from '@/api-routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import { extractAxiosError } from '@/lib/axios';
import { authQueryKeys } from '../auth/auth.services';
import { dashboardQueryKeys } from '../dashboard/dashboard.services';
import type {
  CreateWalletChallengeInput,
  IWallet,
  IWalletChallenge,
  IWalletListResponse,
  LinkWalletInput,
} from './wallets.types';

export const walletsQueryKeys = {
  wallets: ['app', 'wallets'] as const,
};

export const walletsService = {
  async getWallets(client: AxiosInstance): Promise<IWalletListResponse> {
    const response = await client.get<IWalletListResponse>(API_ROUTES.bff.wallets.root);
    return response.data;
  },
  async createWalletChallenge(client: AxiosInstance, input: CreateWalletChallengeInput): Promise<IWalletChallenge> {
    const response = await client.post<IWalletChallenge>(API_ROUTES.bff.wallets.challenge, input);
    return response.data;
  },
  async linkWallet(client: AxiosInstance, input: LinkWalletInput): Promise<IWallet> {
    const response = await client.post<IWallet>(API_ROUTES.bff.wallets.link, input);
    return response.data;
  },
  async deleteWallet(client: AxiosInstance, id: string): Promise<{ deleted: true }> {
    const response = await client.delete<{ deleted: true }>(API_ROUTES.bff.wallets.detail(id));
    return response.data;
  },
};

export function useWallets(initialData?: IWalletListResponse) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: walletsQueryKeys.wallets,
    queryFn: () => walletsService.getWallets(axiosAuth),
    enabled: Boolean(axiosAuth),
    initialData,
  });
}

export function useLinkWallet() {
  const axiosAuth = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LinkWalletInput) => walletsService.linkWallet(axiosAuth, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletsQueryKeys.wallets }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.authMe }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.dashboardSummary }),
      ]);
      toast.success('Wallet linked');
    },
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not link wallet');
    },
  });
}

export function useCreateWalletChallenge() {
  const axiosAuth = useAxiosAuth();

  return useMutation({
    mutationFn: (input: CreateWalletChallengeInput) => walletsService.createWalletChallenge(axiosAuth, input),
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not create wallet challenge');
    },
  });
}

export function useDeleteWallet() {
  const axiosAuth = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => walletsService.deleteWallet(axiosAuth, id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletsQueryKeys.wallets }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.authMe }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.dashboardSummary }),
      ]);
      toast.success('Wallet removed');
    },
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not remove wallet');
    },
  });
}
