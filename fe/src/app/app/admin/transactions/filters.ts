import type { AdminPaymentFilters } from '@/dal/app/admin/admin.types';

export const defaultAdminTransactionFilters = {
  status: '',
  chain: '',
  asset: '',
  senderAddress: '',
  receiverAddress: '',
  from: '',
  to: '',
} satisfies AdminPaymentFilters;

export type AdminTransactionsSearchParams = Record<string, string | string[] | undefined>;

export function resolveAdminTransactionFilters(searchParams: AdminTransactionsSearchParams): AdminPaymentFilters {
  return {
    status: readFirst(searchParams.status),
    chain: readFirst(searchParams.chain),
    asset: readFirst(searchParams.asset),
    senderAddress: readFirst(searchParams.senderAddress),
    receiverAddress: readFirst(searchParams.receiverAddress),
    from: readFirst(searchParams.from),
    to: readFirst(searchParams.to),
  };
}

export function buildAdminTransactionsQueryString(filters: AdminPaymentFilters) {
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
