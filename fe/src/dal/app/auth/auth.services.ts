import { API_ROUTES } from '@/api-routes';
import { useQuery } from '@tanstack/react-query';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import type { AxiosInstance } from 'axios';
import type { IAuthMe } from './auth.types';

export const authQueryKeys = {
  authMe: ['app', 'auth-me'] as const,
};

export const authService = {
  async getAuthMe(client: AxiosInstance): Promise<IAuthMe> {
    const response = await client.get<IAuthMe>(API_ROUTES.bff.auth.me);
    return response.data;
  },
};

export function useAuthMe() {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: authQueryKeys.authMe,
    queryFn: () => authService.getAuthMe(axiosAuth),
    enabled: Boolean(axiosAuth),
  });
}
