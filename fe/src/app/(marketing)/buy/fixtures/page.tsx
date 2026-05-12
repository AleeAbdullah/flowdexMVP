import { notFound } from 'next/navigation';
import { WalletBuyFixturesPageClient } from '../_components/wallet-buy-fixtures-page-client';
import { loadBuySnapshot } from '../utils/load-buy-snapshot';

export default async function BuyFixturesRoute() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const snapshot = await loadBuySnapshot();
  return <WalletBuyFixturesPageClient snapshot={snapshot} />;
}
