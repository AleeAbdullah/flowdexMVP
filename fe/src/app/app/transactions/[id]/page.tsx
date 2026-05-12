import { redirect } from 'next/navigation';

export default async function TransactionDetailRoute(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await props.params;
  redirect(`/transaction/${id}`);
}
