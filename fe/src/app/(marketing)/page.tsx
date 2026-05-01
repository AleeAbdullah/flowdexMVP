import type { Metadata } from 'next';
import { LandingPage } from '@/components/flowdex/landing-page';

export const metadata: Metadata = {
  title: 'FlowDex | Universal Exchange for Tokenized Global Markets',
  description: 'FlowDex is building a wallet-first universal exchange for crypto, tokenized equities, forex, commodities, and other tokenized market access.',
};

export default function HomePage() {
  return <LandingPage />;
}
