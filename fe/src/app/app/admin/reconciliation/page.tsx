import { AdminReconciliationPage } from '@/components/flowdex/admin-reconciliation-page';
import { requireAdminAppContext } from '@/lib/auth-server';

export default async function AdminReconciliationRoute() {
  await requireAdminAppContext();

  return <AdminReconciliationPage />;
}
