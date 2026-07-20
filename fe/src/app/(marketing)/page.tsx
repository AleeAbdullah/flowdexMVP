import type { Metadata } from 'next';
import { LandingPage } from '@/components/flowdex/landing-page';

export const metadata: Metadata = {
  title: 'FlowDex | Protocol for Tokenized Global Markets',
  description: 'FlowDex delivers a unified, non-custodial market surface for decentralized crypto liquidity and institutional real-world asset tokenization.',
};

export default function HomePage() {
  return <LandingPage />;
}
