import { AppFeaturePage } from '@/components/flowdex/app-feature-page';

export default function TradePage() {
  return (
    <AppFeaturePage
      eyebrow="Trade"
      title="A universal trading surface for crypto and tokenized real-world assets."
      description="The trade screen is intentionally positioned as a multi-asset execution desk rather than a single-purpose swap widget. Asset tabs, execution summaries, and market rails should feel connected."
      hero={(
        <div className="grid gap-4 md:grid-cols-2">
          {['Crypto', 'Stocks', 'Forex', 'Commodities', 'Indices', 'ETFs'].map(tab => (
            <div key={tab} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200">
              {tab}
            </div>
          ))}
        </div>
      )}
      highlights={[
        { title: 'Execution Rails', value: '6', note: 'Crypto, stocks, forex, commodities, indices, and ETFs sitting in one product vocabulary.' },
        { title: 'Routing Intent', value: 'Smart', note: 'The UI frames execution as market-aware routing rather than a blind asset conversion.' },
        { title: 'Settlement Model', value: 'Wallet-first', note: 'Non-custodial posture stays visible in the top layer of the interface.' },
      ]}
      stream={[
        { label: 'BTC -> TSLA route preview', value: 'Multi-venue quote', status: 'Cross-asset intent surface' },
        { label: 'EUR/USD trade lane', value: 'FX rails coming online', status: 'Market scope expansion' },
        { label: 'Tokenized gold rail', value: 'Commodity-backed path', status: 'RWA-focused execution' },
      ]}
    />
  );
}
