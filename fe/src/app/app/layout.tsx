import type { ReactNode } from 'react';
import { getAuthenticatedAppContext } from '@/lib/auth-server';
import { AppShell } from './_components/app-shell';

export default async function AppLayout(props: {
  children: ReactNode;
}) {
  const { profile } = await getAuthenticatedAppContext();

  return <AppShell profile={profile}>{props.children}</AppShell>;
}
