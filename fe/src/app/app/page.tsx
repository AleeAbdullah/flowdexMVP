import { redirect } from 'next/navigation';
import { getAuthenticatedAppContext } from '@/lib/auth-server';

export default async function AppIndex() {
  const { profile } = await getAuthenticatedAppContext();

  if (profile.wallets.length === 0) {
    redirect('/app/wallets');
  }

  redirect('/app/account');
}
