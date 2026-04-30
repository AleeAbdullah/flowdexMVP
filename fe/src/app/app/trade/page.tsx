import { GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import {
  FeatureChipGrid,
  FeatureHighlightCard,
  FeatureStreamPanel,
  type FeatureStreamItem,
} from '../_components/feature-placeholder-support';

const highlightItems = [
  { title: 'Execution Rails', value: '6', note: 'Crypto, stocks, forex, commodities, indices, and ETFs sitting in one product vocabulary.' },
  { title: 'Routing Intent', value: 'Smart', note: 'The UI frames execution as market-aware routing rather than a blind asset conversion.' },
  { title: 'Settlement Model', value: 'Wallet-first', note: 'Non-custodial posture stays visible in the top layer of the interface.' },
] as const;

const streamItems: FeatureStreamItem[] = [
  { label: 'BTC -> TSLA route preview', value: 'Multi-venue quote', status: 'Cross-asset intent surface' },
  { label: 'EUR/USD trade lane', value: 'FX rails coming online', status: 'Market scope expansion' },
  { label: 'Tokenized gold rail', value: 'Commodity-backed path', status: 'RWA-focused execution' },
];

export default function TradePage() {
  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Trade"
          title="A universal trading surface for crypto and tokenized real-world assets."
          description="The trade screen is intentionally positioned as a multi-asset execution desk rather than a single-purpose swap widget. Asset tabs, execution summaries, and market rails should feel connected."
        />
        <FeatureChipGrid items={['Crypto', 'Stocks', 'Forex', 'Commodities', 'Indices', 'ETFs']} />
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
