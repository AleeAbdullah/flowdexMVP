import { MarketingContentShell, MarketingCtaBand, MarketingPageHero, UpdateCard } from './marketing-content';

const updates = [
  {
    category: 'Presale',
    date: 'April 2026',
    title: 'Public presale surface is live with backend-fed pricing and tier reads.',
    summary: 'The public FlowDex buy page now reads supported assets, live token pricing, presale stats, tiers, and configuration directly from the backend instead of rendering static placeholder numbers.',
  },
  {
    category: 'Product',
    date: 'April 2026',
    title: 'Protected wallet and purchase-intent flows are active inside the app shell.',
    summary: 'Authenticated users can now create wallet challenges, verify ownership, generate purchase intents, report transaction hashes, and track lifecycle state from the protected transaction views.',
  },
  {
    category: 'Ecosystem',
    date: 'March 2026',
    title: 'Whitepaper v6.0 defines the universal exchange direction and phased architecture.',
    summary: 'The updated whitepaper frames FlowDex as a non-custodial universal exchange spanning crypto, tokenized equities, forex, commodities, ETFs, and the eventual FlowChain migration path.',
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
        title="A public changelog for launch momentum, product proof, and presale readiness."
        description="Phase 1 does not need a CMS yet, but it does need a credible updates surface. This page turns recent product and presale progress into a first-class marketing asset."
        meta={[
          { label: 'Format', value: 'Static Launch Updates' },
          { label: 'Focus', value: 'Product • Presale • Ecosystem • Security' },
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
        title="Follow the public narrative, then move into the actual presale flow."
        body="The updates page gives the marketing layer a living pulse without needing a publishing system yet. The buy route remains the main public conversion path."
        primaryHref="/buy"
        primaryLabel="Open Buy Page"
        secondaryHref="/whitepaper"
        secondaryLabel="Read Whitepaper"
      />
    </div>
  );
}
