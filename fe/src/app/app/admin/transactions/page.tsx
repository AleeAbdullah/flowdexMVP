import { API_ROUTES } from '@/api-routes';
import type { IAdminTransactionsResponse } from '@/dal/app/admin/admin.types';
import { backendFetchJson } from '@/lib/auth-server';
import { AdminTransactionsPageClient } from './admin-transactions-page-client';
import {
  buildAdminTransactionsQueryString,
  resolveAdminTransactionFilters,
  type AdminTransactionsSearchParams,
} from './filters';

export default async function AdminTransactionsRoute(props: {
  searchParams: Promise<AdminTransactionsSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const initialFilters = resolveAdminTransactionFilters(searchParams);
  const queryString = buildAdminTransactionsQueryString(initialFilters);
  const initialData = await backendFetchJson<IAdminTransactionsResponse>(
    `${API_ROUTES.backend.admin.transactions.root}${queryString}`,
  );

  return (
    <AdminTransactionsPageClient
      initialData={initialData}
    />
  );
}
