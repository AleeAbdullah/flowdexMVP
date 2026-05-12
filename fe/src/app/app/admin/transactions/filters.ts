import type { AdminTransactionFilters } from '@/dal/app/admin/admin.types';

export const defaultAdminTransactionFilters = {
  status: '',
  network: '',
  assetCode: '',
  walletAddress: '',
  from: '',
  to: '',
} satisfies AdminTransactionFilters;

export type AdminTransactionsSearchParams = Record<string, string | string[] | undefined>;

export function resolveAdminTransactionFilters(searchParams: AdminTransactionsSearchParams): AdminTransactionFilters {
  return {
    status: readFirst(searchParams.status),
    network: readFirst(searchParams.network),
    assetCode: readFirst(searchParams.assetCode),
    walletAddress: readFirst(searchParams.walletAddress),
    from: readFirst(searchParams.from),
    to: readFirst(searchParams.to),
  };
}

export function buildAdminTransactionsQueryString(filters: AdminTransactionFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
}

function readFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}
