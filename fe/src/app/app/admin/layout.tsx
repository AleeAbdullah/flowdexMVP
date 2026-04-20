import type { ReactNode } from 'react';
import { requireAdminAppContext } from '@/lib/auth-server';

export default async function AdminLayout(props: {
  children: ReactNode;
}) {
  await requireAdminAppContext();

  return props.children;
}
