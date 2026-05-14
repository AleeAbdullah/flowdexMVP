import { MarketingContentShell, MarketingCtaBand, MarketingPageHero, UpdateCard } from './marketing-content';

const updates = [
  {
    category: 'Buy',
    date: 'April 2026',
    title: 'Public buy surface is live with backend-fed pricing and tier reads.',
    summary: 'The public FlowDex buy page now reads supported assets, live token pricing, launch stats, tiers, and configuration directly from the backend instead of rendering static placeholder numbers.',
  },
  {
    category: 'Product',
    date: 'April 2026',
    title: 'Protected app shell now runs on embedded Alchemy wallet onboarding and ledger tracking.',
    summary: 'Authenticated users can sign in with email, link embedded smart wallets, run simulation checks, and track transaction lifecycle state through the backend ledger.',
  },
  {
    category: 'Ecosystem',
    date: 'March 2026',
    title: 'Whitepaper v6.0 defines the FlowDex Protocol direction and phased architecture.',
    summary: 'The updated whitepaper frames FlowDex as a non-custodial protocol spanning crypto, tokenized equities, forex, commodities, ETFs, and the eventual FlowChain migration path.',
  },
  {
    category: 'Security',
    date: 'March 2026',
    title: 'Security posture remains a visible part of the public product narrative.',
    summary: 'The current product story continues to center audit readiness, wallet-first settlement, treasury transparency, and operational caution rather than overpromising on unsupported guarantees.',
  },
];

export function UpdatesPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Updates"
        title="A public changelog for launch momentum, product proof, and buy readiness."
        description="Phase 1 does not need a CMS yet, but it does need a credible updates surface. This page turns recent product and buy-flow progress into a first-class marketing asset."
        meta={[
          { label: 'Format', value: 'Static Launch Updates' },
          { label: 'Focus', value: 'Product • Buy Flow • Ecosystem • Security' },
          { label: 'Publishing Model', value: 'Curated Local Content' },
          { label: 'Audience', value: 'Prospective Buyers and Community' },
        ]}
      />

      <MarketingContentShell>
        <div className="section-shell grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          {updates.map(update => (
            <UpdateCard key={update.title} {...update} />
          ))}
        </div>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Follow the public narrative, then move into the actual buy flow.',
          body: 'The updates page gives the marketing layer a living pulse without needing a publishing system yet. The buy route remains the main public conversion path.',
          primary: { href: '/buy', label: 'Buy Now' },
          secondary: { href: '/whitepaper', label: 'Read Whitepaper' },
        }}
      />
    </div>
  );
}
