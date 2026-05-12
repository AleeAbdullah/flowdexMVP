import type { ReactNode } from 'react';

export default async function AppLayout(props: {
  children: ReactNode;
}) {
  return props.children;
}
