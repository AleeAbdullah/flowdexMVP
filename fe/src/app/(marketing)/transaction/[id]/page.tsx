import { WalletTransactionDetailPageClient } from './_components/wallet-transaction-detail-page-client';

export default async function TransactionDetailRoute(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await props.params;
  return <WalletTransactionDetailPageClient id={id} />;
}
