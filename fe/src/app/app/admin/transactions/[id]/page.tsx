import { redirect } from 'next/navigation';
import { ROUTES } from '@/routes';

export default async function AdminTransactionDetailRoute() {
  redirect(ROUTES.ADMIN.TRANSACTIONS);
}
