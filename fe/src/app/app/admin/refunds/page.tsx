import { AdminRefundsPage } from '@/components/flowdex/admin-refunds-page';
import { requireAdminAppContext } from '@/lib/auth-server';

export default async function AdminRefundsRoute() {
  await requireAdminAppContext();

  return <AdminRefundsPage />;
}
