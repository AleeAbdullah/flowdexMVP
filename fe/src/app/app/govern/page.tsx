import { AppFeaturePage } from '@/components/flowdex/app-feature-page';

export default function GovernPage() {
  return (
    <AppFeaturePage
      eyebrow="Govern"
      title="Governance should look like market-building, not checkbox voting."
      description="The governance direction is strongest when proposals feel close to the business of the exchange itself: new asset classes, new execution rails, and new market primitives."
      hero={(
        <div className="space-y-3">
          {[
            'Add tokenized stocks to the default trade desk',
            'Launch first forex pair bundle',
            'Enable cross-asset margin pathways',
          ].map(item => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200">
              {item}
            </div>
          ))}
        </div>
      )}
      highlights={[
        { title: 'Governance Mode', value: 'Quadratic DAO', note: 'The brand direction already hints at quadratic governance rather than flat one-token-one-vote messaging.' },
        { title: 'Proposal Types', value: 'Execution-led', note: 'The most compelling proposals should directly shape product expansion and routing coverage.' },
        { title: 'Voter Story', value: 'Operator mindset', note: 'Governance copy should sound like platform design, not vague community theater.' },
      ]}
      stream={[
        { label: 'Proposal 014', value: 'Add global ETFs', status: 'Asset class expansion' },
        { label: 'Proposal 021', value: 'Open forex alpha', status: 'New execution rail' },
        { label: 'Proposal 028', value: 'Activate RWA provider lane', status: 'Partner integration' },
      ]}
    />
  );
}
