import { LegalDocumentSection, MarketingContentShell, MarketingCtaBand, MarketingPageHero } from './marketing-content';
import { termsSections } from './legal-page-data';

export function TermsPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Terms"
        title="Public terms for the FlowDex marketing and buy surface."
        description="This page establishes the launch-phase public terms for using the site, reading the whitepaper, and interacting with buy-facing content and app entry points."
        meta={[
          { label: 'Last Updated', value: 'April 2026' },
          { label: 'Applies To', value: 'Site, Whitepaper, Buy Surface' },
          { label: 'Nature', value: 'Informational Launch Terms' },
          { label: 'Contact', value: 'team@flowdex.network' },
        ]}
      />

      <MarketingContentShell>
        {termsSections.map(section => (
          <LegalDocumentSection
            key={section.title}
            title={section.title}
            paragraphs={section.paragraphs}
          />
        ))}
      </MarketingContentShell>

      {/* TODO(flowdex): Revisit MarketingCtaBand API once the shared marketing content refactor is scheduled. */}
      <MarketingCtaBand
        content={{
          title: 'Move from the legal frame into the public product experience.',
          body: 'The legal pages are part of launch readiness, but the live product proof still sits on the home, whitepaper, and buy routes.',
          primary: { href: '/buy', label: 'Buy Now' },
          secondary: { href: '/whitepaper', label: 'Read Whitepaper' },
        }}
      />
    </div>
  );
}
