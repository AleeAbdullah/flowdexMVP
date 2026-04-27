import { AdminTransactionDetailPage } from '@/components/flowdex/admin-transaction-detail-page';
import type { TransactionListItem } from '@/dal/app/types';
import { backendFetchJson } from '@/lib/auth-server';

export default async function AdminTransactionDetailRoute(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await props.params;
  const transaction = await backendFetchJson<TransactionListItem>(`/admin/transactions/${id}`);

  return <AdminTransactionDetailPage transaction={transaction} />;
}
