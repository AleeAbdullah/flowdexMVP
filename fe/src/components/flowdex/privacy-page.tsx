import { LegalDocumentSection, MarketingContentShell, MarketingCtaBand, MarketingPageHero } from './marketing-content';
import { privacySections } from './legal-page-data';

export function PrivacyPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Privacy"
        title="A privacy notice that reflects the current Phase 1 app and marketing behavior."
        description="This notice is aligned to the current frontend and backend reality: email-first auth, session-based access, wallet linking flows, backend API mediation, and optional analytics instrumentation."
        meta={[
          { label: 'Last Updated', value: 'April 2026' },
          { label: 'Auth Model', value: 'Email Session + BFF' },
          { label: 'Wallet Data', value: 'Linked by User Action' },
          { label: 'Analytics', value: 'Conditional / Config-Driven' },
        ]}
      />

      <MarketingContentShell>
        {privacySections.map(section => (
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
          title: 'See how the product actually uses the public and protected surfaces.',
          body: 'The privacy notice describes the current launch behavior, while the home, buy, and app routes show the actual user experience that behavior supports.',
          primary: { href: '/', label: 'Back to Home' },
          secondary: { href: '/buy', label: 'Open Buy' },
        }}
      />
    </div>
  );
}

