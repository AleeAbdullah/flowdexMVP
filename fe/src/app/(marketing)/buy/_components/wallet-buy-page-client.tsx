'use client';

import { useEffect, useState } from 'react';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { useBuyCheckoutController } from '../hooks/use-buy-checkout-controller';
import { WalletBuyShell } from './wallet-buy-shell';

export function WalletBuyPageClient(props: {
  snapshot: BuySnapshot;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="section-shell py-16" aria-hidden="true">
        <div className="min-h-[36rem] rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--card-bg)]" />
      </div>
    );
  }

  return <WalletBuyPageClientInner snapshot={props.snapshot} />;
}

function WalletBuyPageClientInner(props: {
  snapshot: BuySnapshot;
}) {
  const controller = useBuyCheckoutController(props.snapshot);

  return <WalletBuyShell {...controller} />;
}
