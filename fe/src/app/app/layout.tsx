import type { ReactNode } from 'react';
import { getAuthenticatedAppContext } from '@/lib/auth-server';
import { AppShell } from './_components/app-shell';

export default async function AppLayout(props: {
  children: ReactNode;
}) {
  const { session, profile } = await getAuthenticatedAppContext();
  const displayName = session.user.name || profile.email;

  return <AppShell profile={profile} displayName={displayName}>{props.children}</AppShell>;
}
