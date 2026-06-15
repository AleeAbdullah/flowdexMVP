import type { Metadata } from 'next';
import { WalletBuyPageClient } from './_components/wallet-buy-page-client';
import { loadBuySnapshot } from './utils/load-buy-snapshot';

export const metadata: Metadata = {
  title: 'Buy $FDP | FlowDex',
  description: 'Public buy route with live pricing, tiers, and supported settlement assets.',
};

export default async function BuyRoute() {
  const snapshot = await loadBuySnapshot();
  return <WalletBuyPageClient snapshot={snapshot} />;
}
