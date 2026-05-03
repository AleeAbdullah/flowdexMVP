import { GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import {
  FeatureChipList,
  FeatureHighlightCard,
  FeatureStreamPanel,
  type FeatureStreamItem,
} from '../_components/feature-placeholder-support';

const highlightItems = [
  { title: 'Governance Mode', value: 'Quadratic DAO', note: 'The brand direction already hints at quadratic governance rather than flat one-token-one-vote messaging.' },
  { title: 'Proposal Types', value: 'Execution-led', note: 'The most compelling proposals should directly shape product expansion and routing coverage.' },
  { title: 'Voter Story', value: 'Operator mindset', note: 'Governance copy should sound like platform design, not vague community theater.' },
] as const;

const streamItems: FeatureStreamItem[] = [
  { label: 'Proposal 014', value: 'Add global ETFs', status: 'Asset class expansion' },
  { label: 'Proposal 021', value: 'Open forex alpha', status: 'New execution rail' },
  { label: 'Proposal 028', value: 'Activate RWA provider lane', status: 'Partner integration' },
];

export default function GovernPage() {
  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Govern"
          title="Governance should look like market-building, not checkbox voting."
          description="The governance direction is strongest when proposals feel close to the business of the exchange itself: new asset classes, new execution rails, and new market primitives."
        />
        <FeatureChipList
          items={[
            'Add tokenized stocks to the default trade desk',
            'Launch first forex pair bundle',
            'Enable cross-asset margin pathways',
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
