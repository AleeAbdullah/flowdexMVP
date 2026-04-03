import type { ReactNode } from 'react';
import { MarketingShell } from '@/components/flowdex/marketing-shell';

export default function MarketingLayout(props: {
  children: ReactNode;
}) {
  return (
    <MarketingShell>
      <main>{props.children}</main>
    </MarketingShell>
  );
}
