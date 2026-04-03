import { AppFeaturePage } from '@/components/flowdex/app-feature-page';

export default function PortfolioPage() {
  return (
    <AppFeaturePage
      eyebrow="Portfolio"
      title="A holdings view that understands asset class context, not just ticker symbols."
      description="The portfolio direction is built around cross-asset clarity. Every line item should explain what it is, where it settles, and why it belongs in the broader FlowDex picture."
      hero={(
        <div className="grid gap-4 md:grid-cols-2">
          {[
            '$FDN / Governance utility',
            'TSLA / Tokenized equity',
            'ETH / Core settlement asset',
            'Gold / Commodity exposure',
            'EUR/USD / FX pair',
            'SPY / ETF exposure',
          ].map(item => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200">
              {item}
            </div>
          ))}
        </div>
      )}
      highlights={[
        { title: 'Asset Classes', value: '6+', note: 'Portfolio cards preserve type labels so users always know whether they are looking at crypto, equity, forex, or commodity exposure.' },
        { title: 'Risk Lens', value: 'Cross-market', note: 'The future portfolio surface can expose concentration, volatility, and correlation beyond crypto-native heuristics.' },
        { title: 'Ownership View', value: 'Non-custodial', note: 'Wallet ownership stays central even when the assets diversify far beyond tokens.' },
      ]}
      stream={[
        { label: 'Portfolio allocation', value: 'Crypto 42% / RWAs 58%', status: 'Illustrative mix card' },
        { label: 'Best performer', value: 'NVDA +12.4%', status: 'Equity sleeve' },
        { label: 'Yield position', value: '$FDN staking pending', status: 'Utility layer ready for auth bridge' },
      ]}
    />
  );
}
