import { API_ROUTES } from '@/api-routes';
import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import {
  isTerminalTransactionStatus,
  type IWalletTransactionListItem,
} from './transactions.types';

const transactionsQueryKeys = {
  transaction: (walletAddress: string | null | undefined, id: string) => ['wallet', 'transactions', walletAddress ?? 'anonymous', id] as const,
};

const transactionsService = {
  async getTransaction(client: AxiosInstance, id: string): Promise<IWalletTransactionListItem> {
    const response = await client.get<IWalletTransactionListItem>(API_ROUTES.bff.transactions.detail(id));
    return response.data;
  },
};

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
