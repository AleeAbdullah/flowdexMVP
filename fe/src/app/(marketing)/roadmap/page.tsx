import type { Metadata } from 'next';
import { RoadmapPage } from '@/components/flowdex/roadmap-page';

export const metadata: Metadata = {
  title: 'Roadmap | FlowDex',
  description: 'Follow the FlowDex rollout from presale and market entry to multi-chain expansion, FlowChain migration, and network maturity.',
};

export default function RoadmapRoute() {
  return <RoadmapPage />;
}
