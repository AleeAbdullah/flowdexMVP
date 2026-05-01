import { API_ROUTES } from '@/api-routes';
import type { ITransactionsResponse } from '@/dal/app/transactions/transactions.types';
import { backendFetchJson } from '@/lib/auth-server';
import { TransactionsPageClient } from './transactions-page-client';

export default async function TransactionsRoute() {
  const initialData = await backendFetchJson<ITransactionsResponse>(API_ROUTES.backend.transactions.root);

  return <TransactionsPageClient initialData={initialData} />;
}
