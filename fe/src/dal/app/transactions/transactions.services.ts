import { API_ROUTES } from '@/api-routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import { extractAxiosError } from '@/lib/axios';
import { dashboardQueryKeys } from '../dashboard/dashboard.services';
import {
  isLiveTransactionStatus,
  isTerminalTransactionStatus,
  type ISimulateTransactionResult,
  type ITrackTransactionResult,
  type ITransactionListItem,
  type ITransactionsResponse,
  type SimulateTransactionInput,
  type TrackTransactionInput,
} from './transactions.types';

export const transactionsQueryKeys = {
  transactions: ['app', 'transactions'] as const,
  transaction: (id: string) => ['app', 'transactions', id] as const,
};

export const transactionsService = {
  async simulateTransaction(client: AxiosInstance, input: SimulateTransactionInput): Promise<ISimulateTransactionResult> {
    const response = await client.post<ISimulateTransactionResult>(API_ROUTES.bff.transactions.simulate, input);
    return response.data;
  },
  async trackTransaction(client: AxiosInstance, input: TrackTransactionInput): Promise<ITrackTransactionResult> {
    const response = await client.post<ITrackTransactionResult>(API_ROUTES.bff.transactions.track, input);
    return response.data;
  },
  async getTransactions(client: AxiosInstance): Promise<ITransactionsResponse> {
    const response = await client.get<ITransactionsResponse>(API_ROUTES.bff.transactions.root);
    return response.data;
  },
  async getTransaction(client: AxiosInstance, id: string): Promise<ITransactionListItem> {
    const response = await client.get<ITransactionListItem>(API_ROUTES.bff.transactions.detail(id));
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
        toast.error(result.reason ?? 'Simulation blocked');
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.dashboardSummary }),
      ]);
      toast.success('Transaction tracked');
    },
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not track transaction');
    },
  });
}

export function useTransactions(initialData?: ITransactionsResponse) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: transactionsQueryKeys.transactions,
    queryFn: () => transactionsService.getTransactions(axiosAuth),
    enabled: Boolean(axiosAuth),
    initialData,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasLiveLifecycle = items.some(item => isLiveTransactionStatus(item.status));
      return hasLiveLifecycle ? 15000 : false;
    },
  });
}

export function useTransaction(id: string) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: transactionsQueryKeys.transaction(id),
    queryFn: () => transactionsService.getTransaction(axiosAuth, id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) {
        return 15000;
      }

      return isTerminalTransactionStatus(status) ? false : 15000;
    },
  });
}
