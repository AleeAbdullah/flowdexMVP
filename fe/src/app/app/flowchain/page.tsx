import { AppFeaturePage } from '@/components/flowdex/app-feature-page';

export default function FlowChainPage() {
  return (
    <AppFeaturePage
      eyebrow="FlowChain"
      title="Show the chain layer as the proof and throughput engine for a multi-asset network."
      description="FlowChain should not read like a generic L1 landing page. It should feel like infrastructure designed around multi-asset execution, observable settlement, and market-specific activity."
      hero={(
        <div className="grid gap-4 md:grid-cols-2">
          {[
            'TSLA trade block',
            'EUR/USD route',
            'Gold buy settlement',
            'Cross-chain proof',
          ].map(item => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200">
              {item}
            </div>
          ))}
        </div>
      )}
      highlights={[
        { title: 'Block Story', value: 'Multi-asset', note: 'Blocks and explorer rows should show the variety of market actions moving through the network.' },
        { title: 'Explorer UX', value: 'Proof-first', note: 'FlowChain screens can make settlement and chain truth legible to non-expert users without flattening the data.' },
        { title: 'Narrative Role', value: 'Execution backbone', note: 'The chain exists to strengthen the universal exchange story, not distract from it.' },
      ]}
      stream={[
        { label: 'Block #1204581', value: 'TSLA trade settled', status: 'Tokenized equity activity' },
        { label: 'Block #1204584', value: 'Gold buy confirmed', status: 'Commodity route proof' },
        { label: 'Block #1204590', value: 'EUR/USD swap staged', status: 'FX market activity' },
      ]}
    />
  );
}
