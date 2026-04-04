import { AdminTransactionsPage } from '@/components/flowdex/admin-transactions-page';
import { requireAdminAppContext } from '@/lib/auth-server';

export default async function AdminTransactionsRoute() {
  await requireAdminAppContext();

  return <AdminTransactionsPage />;
}
