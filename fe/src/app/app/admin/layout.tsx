import type { ReactNode } from 'react';
import { requireAdminAppContext } from '@/lib/auth-server';
import { AdminShell } from './_components/admin-shell';

export default async function AdminLayout(props: {
  children: ReactNode;
}) {
  await requireAdminAppContext();

  return <AdminShell>{props.children}</AdminShell>;
}
