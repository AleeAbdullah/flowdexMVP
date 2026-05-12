import { Suspense, type ReactNode } from 'react';
import { MarketingShell } from '@/components/flowdex/marketing-shell';
import { PublicAuthToast } from '@/components/flowdex/public-auth-toast';

export default function MarketingLayout(props: {
  children: ReactNode;
}) {
  return (
    <MarketingShell>
      <Suspense fallback={null}>
        <PublicAuthToast />
      </Suspense>
      {props.children}
    </MarketingShell>
  );
}
