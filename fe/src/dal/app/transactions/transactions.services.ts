import { API_ROUTES } from '@/api-routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import { extractAxiosError } from '@/lib/axios';
import {
  isLiveTransactionStatus,
  isTerminalTransactionStatus,
  type IWalletTransactionListItem,
  type IWalletTransactionsResponse,
  type IWalletTransactionSimulationResult,
  type IWalletTransactionTrackResult,
  type SimulateTransactionInput,
  type TrackTransactionInput,
} from './transactions.types';
import { describeTransactionSimulationReason } from './transactions.utils';

export const transactionsQueryKeys = {
  transactions: (walletAddress: string | null | undefined) => ['wallet', 'transactions', walletAddress ?? 'anonymous'] as const,
  transaction: (walletAddress: string | null | undefined, id: string) => ['wallet', 'transactions', walletAddress ?? 'anonymous', id] as const,
};

export const transactionsService = {
  async simulateTransaction(client: AxiosInstance, input: SimulateTransactionInput): Promise<IWalletTransactionSimulationResult> {
    const response = await client.post<IWalletTransactionSimulationResult>(API_ROUTES.bff.transactions.simulate, input);
    return response.data;
  },
  async trackTransaction(client: AxiosInstance, input: TrackTransactionInput): Promise<IWalletTransactionTrackResult> {
    const response = await client.post<IWalletTransactionTrackResult>(API_ROUTES.bff.transactions.track, input);
    return response.data;
  },
  async getTransactions(client: AxiosInstance): Promise<IWalletTransactionsResponse> {
    const response = await client.get<IWalletTransactionsResponse>(API_ROUTES.bff.transactions.root);
    return response.data;
  },
  async getTransaction(client: AxiosInstance, id: string): Promise<IWalletTransactionListItem> {
    const response = await client.get<IWalletTransactionListItem>(API_ROUTES.bff.transactions.detail(id));
    return response.data;
  },
};

export function useSimulateTransaction() {
  const axiosAuth = useAxiosAuth();

  return useMutation({
    mutationFn: (input: SimulateTransactionInput) => transactionsService.simulateTransaction(axiosAuth, input),
    onSuccess: (result) => {
      if (result.allowed) {
        toast.success('Simulation passed');
      } else {
        toast.error(describeTransactionSimulationReason(result.reason));
      }
    },
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Simulation request failed');
    },
  });
}

export function useTrackTransaction() {
  const axiosAuth = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TrackTransactionInput) => transactionsService.trackTransaction(axiosAuth, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      toast.success('Receipt created');
    },
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not track transaction');
    },
  });
}

export function useTransactions(
  walletAddress: string | null | undefined,
  initialData?: IWalletTransactionsResponse,
) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: transactionsQueryKeys.transactions(walletAddress),
    queryFn: () => transactionsService.getTransactions(axiosAuth),
    enabled: Boolean(walletAddress),
    initialData,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasLiveLifecycle = items.some(item => isLiveTransactionStatus(item.status));
      return hasLiveLifecycle ? 15000 : false;
    },
  });
}

export function useTransaction(walletAddress: string | null | undefined, id: string) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: transactionsQueryKeys.transaction(walletAddress, id),
    queryFn: () => transactionsService.getTransaction(axiosAuth, id),
    enabled: Boolean(walletAddress && id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) {
        return 15000;
      }

      return isTerminalTransactionStatus(status) ? false : 15000;
    },
  });
}
