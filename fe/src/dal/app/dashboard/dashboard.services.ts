import { API_ROUTES } from '@/api-routes';
import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import { isLiveTransactionStatus } from '../transactions/transactions.types';
import type { IDashboardSummary } from './dashboard.types';

export const dashboardQueryKeys = {
  dashboardSummary: ['app', 'dashboard-summary'] as const,
};

export const dashboardService = {
  async getDashboardSummary(client: AxiosInstance): Promise<IDashboardSummary> {
    const response = await client.get<IDashboardSummary>(API_ROUTES.bff.dashboard.summary);
    return response.data;
  },
};

export function useDashboardSummary(initialData?: IDashboardSummary) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: dashboardQueryKeys.dashboardSummary,
    queryFn: () => dashboardService.getDashboardSummary(axiosAuth),
    enabled: Boolean(axiosAuth),
    initialData,
    refetchInterval: (query) => {
      const items = query.state.data?.recentTransactions ?? [];
      const hasLiveLifecycle = items.some(item => isLiveTransactionStatus(item.status));
      return hasLiveLifecycle ? 15000 : false;
    },
  });
}
