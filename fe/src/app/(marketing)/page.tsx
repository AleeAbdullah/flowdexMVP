import type { Metadata } from 'next';
import { LandingPage } from '@/components/flowdex/landing-page';

export const metadata: Metadata = {
  title: 'FlowDex | Protocol for Tokenized Global Markets',
  description: 'FlowDex is building a wallet-first protocol for crypto, tokenized equities, forex, commodities, and other tokenized market access.',
};

export default function HomePage() {
  return <LandingPage />;
}
