import { AppFeaturePage } from '@/components/flowdex/app-feature-page';

export default function StakePage() {
  return (
    <AppFeaturePage
      eyebrow="Stake"
      title="Position staking as participation in the exchange economy, not passive parking."
      description="The staking route should show why protocol fees and market activity matter. It becomes more compelling when users can see the fee sources that span crypto, equities, forex, and commodities."
      hero={(
        <div className="grid gap-4 md:grid-cols-2">
          {[
            'Crypto fees',
            'Tokenized stocks',
            'Forex pairs',
            'Gold routes',
          ].map(item => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200">
              {item}
            </div>
          ))}
        </div>
      )}
      highlights={[
        { title: 'Fee Sharing', value: '40%', note: 'Brand direction already points to protocol fee sharing for token holders and stakers.' },
        { title: 'Validator Design', value: 'Delegation-ready', note: 'The UX can evolve toward validator selection and chain-aligned participation flows.' },
        { title: 'Utility Narrative', value: 'Protocol aligned', note: 'Stake screens should explain why ownership matters inside the exchange economy.' },
      ]}
      stream={[
        { label: 'Delegation lane', value: 'Validator preview', status: 'Future chain operations' },
        { label: 'Rewards source', value: 'Cross-asset fee stack', status: 'Utility explanation layer' },
        { label: 'Staker queue', value: 'Community-owned growth', status: 'Governance adjacent' },
      ]}
    />
  );
}
