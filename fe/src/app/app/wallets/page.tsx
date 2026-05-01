import { API_ROUTES } from '@/api-routes';
import type { IWalletListResponse } from '@/dal/app/wallets/wallets.types';
import { backendFetchJson } from '@/lib/auth-server';
import { WalletsPageClient } from './wallets-page-client';

export default async function WalletsRoute() {
  const initialData = await backendFetchJson<IWalletListResponse>(API_ROUTES.backend.wallets.root);

  return <WalletsPageClient initialData={initialData} />;
}
