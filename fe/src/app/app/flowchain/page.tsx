import { GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import {
  FeatureChipGrid,
  FeatureHighlightCard,
  FeatureStreamPanel,
  type FeatureStreamItem,
} from '../_components/feature-placeholder-support';

const highlightItems = [
  { title: 'Block Story', value: 'Multi-asset', note: 'Blocks and explorer rows should show the variety of market actions moving through the network.' },
  { title: 'Explorer UX', value: 'Proof-first', note: 'FlowChain screens can make settlement and chain truth legible to non-expert users without flattening the data.' },
  { title: 'Narrative Role', value: 'Execution backbone', note: 'The chain exists to strengthen the universal exchange story, not distract from it.' },
] as const;

const streamItems: FeatureStreamItem[] = [
  { label: 'Block #1204581', value: 'TSLA trade settled', status: 'Tokenized equity activity' },
  { label: 'Block #1204584', value: 'Gold buy confirmed', status: 'Commodity route proof' },
  { label: 'Block #1204590', value: 'EUR/USD swap staged', status: 'FX market activity' },
];

export default function FlowChainPage() {
  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="FlowChain"
          title="Show the chain layer as the proof and throughput engine for a multi-asset network."
          description="FlowChain should not read like a generic L1 landing page. It should feel like infrastructure designed around multi-asset execution, observable settlement, and market-specific activity."
        />
        <FeatureChipGrid
          items={[
            'TSLA trade block',
            'EUR/USD route',
            'Gold buy settlement',
            'Cross-chain proof',
          ]}
        />
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        {highlightItems.map(item => (
          <FeatureHighlightCard key={item.title} {...item} />
        ))}
      </div>

      <FeatureStreamPanel items={streamItems} />
    </div>
  );
}
