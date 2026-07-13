import { API_ROUTES } from '@/api-routes';
import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import type {
  AdminPaymentFilters,
  IAdminPaymentsResponse,
} from './admin.types';

const adminQueryKeys = {
  adminPayments: (filters?: AdminPaymentFilters) =>
    ['app', 'admin', 'payments', filters ?? {}] as const,
};

const adminService = {
  async getAdminPayments(client: AxiosInstance, filters?: AdminPaymentFilters): Promise<IAdminPaymentsResponse> {
    const response = await client.get<IAdminPaymentsResponse>(API_ROUTES.bff.admin.payments.root, {
      params: compactParams(filters),
    });
    return response.data;
  },
};

export function useAdminPayments(
  filters?: AdminPaymentFilters,
  initialData?: IAdminPaymentsResponse,
) {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: adminQueryKeys.adminPayments(filters),
    queryFn: () => adminService.getAdminPayments(axiosAuth, filters),
    enabled: Boolean(axiosAuth),
    initialData,
  });
}

function compactParams(filters?: AdminPaymentFilters) {
  return Object.fromEntries(
    Object.entries(filters ?? {}).filter(([, value]) => Boolean(value)),
  );
}
