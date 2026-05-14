import { API_ROUTES } from '@/api-routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import { extractAxiosError } from '@/lib/axios';
import type {
  IAdminStats,
  AdminTransactionFilters,
  IAdminTransactionListItem,
  IAdminTransactionsResponse,
} from './admin.types';

export const adminQueryKeys = {
  adminStats: ['app', 'admin', 'stats'] as const,
  adminTransactions: (filters?: AdminTransactionFilters) =>
    ['app', 'admin', 'transactions', filters ?? {}] as const,
  adminTransaction: (id: string) => ['app', 'admin', 'transactions', id] as const,
};

export const adminService = {
  async getAdminStats(client: AxiosInstance): Promise<IAdminStats> {
    const response = await client.get<IAdminStats>(API_ROUTES.bff.admin.stats);
    return response.data;
  },
  async getAdminTransactions(client: AxiosInstance, filters?: AdminTransactionFilters): Promise<IAdminTransactionsResponse> {
    const response = await client.get<IAdminTransactionsResponse>(API_ROUTES.bff.admin.transactions.root, {
      params: compactParams(filters),
    });
    return response.data;
  },
  async getAdminTransaction(client: AxiosInstance, id: string): Promise<IAdminTransactionListItem> {
    const response = await client.get<IAdminTransactionListItem>(API_ROUTES.bff.admin.transactions.detail(id));
    return response.data;
  },
  async reconcileAdminTransaction(client: AxiosInstance, id: string): Promise<IAdminTransactionListItem> {
    const response = await client.post<IAdminTransactionListItem>(API_ROUTES.bff.admin.transactions.reconcile(id));
    return response.data;
  },
};

export function useAdminStats(initialData?: IAdminStats) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: adminQueryKeys.adminStats,
    queryFn: () => adminService.getAdminStats(axiosAuth),
    enabled: Boolean(axiosAuth),
    initialData,
  });
}

export function useAdminTransactions(
  filters?: AdminTransactionFilters,
  initialData?: IAdminTransactionsResponse,
) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: adminQueryKeys.adminTransactions(filters),
    queryFn: () => adminService.getAdminTransactions(axiosAuth, filters),
    enabled: Boolean(axiosAuth),
    initialData,
  });
}

export function useAdminTransaction(id: string) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: adminQueryKeys.adminTransaction(id),
    queryFn: () => adminService.getAdminTransaction(axiosAuth, id),
    enabled: Boolean(id),
  });
}

export function useReconcileAdminTransaction() {
  const axiosAuth = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.reconcileAdminTransaction(axiosAuth, id),
    onSuccess: async (transaction) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['app', 'admin', 'transactions'] }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminTransaction(transaction.id) }),
      ]);
      toast.success(`Reconciliation complete: ${transaction.status}`);
    },
    onError: (error) => {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Failed to reconcile transaction');
    },
  });
}

function compactParams(filters?: AdminTransactionFilters) {
  return Object.fromEntries(
    Object.entries(filters ?? {}).filter(([, value]) => Boolean(value)),
  );
}
