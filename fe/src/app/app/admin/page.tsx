import { AdminDashboardPage } from '@/components/flowdex/admin-dashboard-page';
import { requireAdminAppContext } from '@/lib/auth-server';

export default async function AdminIndexRoute() {
  await requireAdminAppContext();

  return <AdminDashboardPage />;
}
