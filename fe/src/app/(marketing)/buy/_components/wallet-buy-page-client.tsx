'use client';

import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { useBuyCheckoutController } from '../hooks/use-buy-checkout-controller';
import { WalletBuyShell } from './wallet-buy-shell';

export function WalletBuyPageClient(props: {
  snapshot: BuySnapshot;
}) {
  const controller = useBuyCheckoutController(props.snapshot);

  return <WalletBuyShell {...controller} />;
}
