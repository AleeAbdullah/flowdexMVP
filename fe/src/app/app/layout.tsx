import type { ReactNode } from 'react';
import { AppShell } from '@/components/flowdex/app-shell';
import { getAuthenticatedAppContext } from '@/lib/auth-server';

export default async function AppLayout(props: {
  children: ReactNode;
}) {
  const { profile } = await getAuthenticatedAppContext();

  return <AppShell profile={profile}>{props.children}</AppShell>;
}
