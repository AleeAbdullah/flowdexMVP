import { GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import {
  FeatureChipGrid,
  FeatureHighlightCard,
  FeatureStreamPanel,
  type FeatureStreamItem,
} from '../_components/feature-placeholder-support';

const highlightItems = [
  { title: 'Asset Classes', value: '6+', note: 'Portfolio cards preserve type labels so users always know whether they are looking at crypto, equity, forex, or commodity exposure.' },
  { title: 'Risk Lens', value: 'Cross-market', note: 'The future portfolio surface can expose concentration, volatility, and correlation beyond crypto-native heuristics.' },
  { title: 'Ownership View', value: 'Non-custodial', note: 'Wallet ownership stays central even when the assets diversify far beyond tokens.' },
] as const;

const streamItems: FeatureStreamItem[] = [
  { label: 'Portfolio allocation', value: 'Crypto 42% / RWAs 58%', status: 'Illustrative mix card' },
  { label: 'Best performer', value: 'NVDA +12.4%', status: 'Equity sleeve' },
  { label: 'Yield position', value: '$FDN staking pending', status: 'Utility layer ready for auth bridge' },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Portfolio"
          title="A holdings view that understands asset class context, not just ticker symbols."
          description="The portfolio direction is built around cross-asset clarity. Every line item should explain what it is, where it settles, and why it belongs in the broader FlowDex picture."
        />
        <FeatureChipGrid
          items={[
            '$FDN / Governance utility',
            'TSLA / Tokenized equity',
            'ETH / Core settlement asset',
            'Gold / Commodity exposure',
            'EUR/USD / FX pair',
            'SPY / ETF exposure',
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
