import { getAuthenticatedAppContext } from '@/lib/auth-server';

import { AccountSettingsClient } from './_components/account-settings-client';

export default async function AccountRoute() {
  const { session, profile } = await getAuthenticatedAppContext();
  const displayName = session.user.name || profile.email;

  return (
    <AccountSettingsClient
      displayName={displayName}
      profile={profile}
      sessionId={session.session.id}
    />
  );
}
