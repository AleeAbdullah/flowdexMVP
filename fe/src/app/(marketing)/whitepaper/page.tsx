import type { Metadata } from 'next';
import { WhitepaperPage } from '@/components/flowdex/whitepaper-page';

export const metadata: Metadata = {
  title: 'Whitepaper v7.1 | FlowDex',
  description: 'Read the FlowDex Network Whitepaper v7.1 covering the Universal Exchange thesis, $FDP utility, tokenomics, roadmap, governance, and risk factors.',
};

export default function WhitepaperRoute() {
  return <WhitepaperPage />;
}
