import { AccountPage } from '@/components/flowdex/account-page';
import { getAuthenticatedAppContext } from '@/lib/auth-server';

export default async function AccountRoute() {
  const { session, profile } = await getAuthenticatedAppContext();

  return <AccountPage session={session} profile={profile} />;
}
