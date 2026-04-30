import { API_ROUTES } from '@/api-routes';
import type { IWalletListResponse } from '@/dal/app/wallets/wallets.types';
import { backendFetchJson } from '@/lib/auth-server';
import { BuyPageClient } from './buy-page-client';

export default async function ProtectedBuyRoute() {
  const initialWallets = await backendFetchJson<IWalletListResponse>(API_ROUTES.backend.wallets.root);

  return <BuyPageClient initialWallets={initialWallets} />;
}
