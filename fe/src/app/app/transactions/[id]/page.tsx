import { TransactionDetailPage } from '@/components/flowdex/transaction-detail-page';
import { backendFetchJson } from '@/lib/auth-server';
import type { TransactionListItem } from '@/dal/app/types';

export default async function TransactionDetailRoute(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await props.params;
  const transaction = await backendFetchJson<TransactionListItem>(`/transactions/${id}`);

  return <TransactionDetailPage transaction={transaction} />;
}
