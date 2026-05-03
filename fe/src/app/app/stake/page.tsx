import { GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import {
  FeatureChipGrid,
  FeatureHighlightCard,
  FeatureStreamPanel,
  type FeatureStreamItem,
} from '../_components/feature-placeholder-support';

const highlightItems = [
  { title: 'Fee Sharing', value: '40%', note: 'Brand direction already points to protocol fee sharing for token holders and stakers.' },
  { title: 'Validator Design', value: 'Delegation-ready', note: 'The UX can evolve toward validator selection and chain-aligned participation flows.' },
  { title: 'Utility Narrative', value: 'Protocol aligned', note: 'Stake screens should explain why ownership matters inside the exchange economy.' },
] as const;

const streamItems: FeatureStreamItem[] = [
  { label: 'Delegation lane', value: 'Validator preview', status: 'Future chain operations' },
  { label: 'Rewards source', value: 'Cross-asset fee stack', status: 'Utility explanation layer' },
  { label: 'Staker queue', value: 'Community-owned growth', status: 'Governance adjacent' },
];

export default function StakePage() {
  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Stake"
          title="Position staking as participation in the exchange economy, not passive parking."
          description="The staking route should show why protocol fees and market activity matter. It becomes more compelling when users can see the fee sources that span crypto, equities, forex, and commodities."
        />
        <FeatureChipGrid items={['Crypto fees', 'Tokenized stocks', 'Forex pairs', 'Gold routes']} />
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
