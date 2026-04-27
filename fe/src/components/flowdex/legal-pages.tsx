import { MarketingContentShell, MarketingCtaBand, MarketingPageHero, LegalDocumentSection } from './marketing-content';

const termsSections = [
  {
    title: 'Informational Use Only',
    paragraphs: [
      'The FlowDex website, whitepaper, updates, and presale-facing materials are provided for informational purposes only. Nothing on this site should be interpreted as legal, financial, tax, accounting, or investment advice.',
      'References to pricing targets, roadmap phases, projected utility, token value, or market opportunity are directional statements about product intent and are not guarantees of future performance.',
    ],
  },
  {
    title: 'Eligibility and Access',
    paragraphs: [
      'By accessing the site or participating in any presale or token-related flow, you represent that doing so is lawful in your jurisdiction and that you are solely responsible for understanding any restrictions that may apply to you.',
      'Access to certain product features, token activities, or asset classes may be restricted, delayed, or unavailable in some jurisdictions based on legal, regulatory, operational, or risk considerations.',
    ],
  },
  {
    title: 'Presale and Token Participation',
    paragraphs: [
      '$FDN is described by the project as a utility token intended for use within the FlowDex ecosystem. Participation in any presale, token sale, or future token-related activity involves risk and may result in the loss of value or the inability to access expected functionality on the timeline described in public materials.',
      'Any listing price references, roadmap references, discount framing, or return examples are part of the public narrative and do not create a promise, warranty, or contractual obligation.',
    ],
  },
  {
    title: 'Acceptable Use and Intellectual Property',
    paragraphs: [
      'You agree not to misuse the site, interfere with platform operations, attempt unauthorized access, submit fraudulent data, or use the FlowDex brand and materials in a misleading way.',
      'Unless otherwise stated, the site design, branding, copy, documentation, and related materials are owned by or licensed to FlowDex Network and may not be reproduced in a misleading or unauthorized manner.',
    ],
  },
  {
    title: 'Limitations, Changes, and Contact',
    paragraphs: [
      'The site and its materials are provided on an “as is” and “as available” basis without warranties of accuracy, completeness, availability, or fitness for any particular purpose. FlowDex may update, suspend, or remove site content, routes, or functionality at any time without prior notice.',
      'For launch-phase inquiries, the project contact placeholder remains team@flowdex.network. This page is a launch-ready public legal page and should be replaced with jurisdiction-specific legal review when formal counsel-approved documents are available.',
    ],
  },
];

const privacySections = [
  {
    title: 'What Data We Collect',
    paragraphs: [
      'FlowDex may collect email addresses, session identifiers, account metadata, wallet addresses you choose to link, transaction-related interaction data, support contact details, and standard technical usage data such as browser, device, and request metadata.',
      'If analytics are enabled, the site may also collect page-view and product interaction signals through analytics tooling such as PostHog. Wallet and transaction telemetry may include linkage metadata and webhook event snapshots for security and auditability.',
    ],
  },
  {
    title: 'How Data Is Used',
    paragraphs: [
      'Collected data is used to operate the site, create and maintain authentication sessions, protect the app from abuse, support wallet linking, power protected presale flows, improve product experience, and understand how the public and authenticated surfaces are used.',
      'We may also use this information to investigate fraud, respond to security incidents, comply with legal obligations, or communicate important updates about the presale or product.',
    ],
  },
  {
    title: 'Cookies, Sessions, and Analytics',
    paragraphs: [
      'The frontend uses browser session and authentication mechanisms to keep signed-in users authenticated. These session artifacts are necessary for login, protected route access, and BFF-mediated backend access.',
      'Analytics and diagnostic tooling may use cookies or similar technologies to understand navigation, performance, and usage patterns. Where such tooling is enabled, it is used to improve the product and launch readiness rather than to sell user data.',
    ],
  },
  {
    title: 'Sharing, Retention, and Security',
    paragraphs: [
      'FlowDex may rely on infrastructure and service providers for hosting, analytics, authentication, and backend operations. Information may be processed by those providers strictly to support the product experience and operational security.',
      'Data is retained for as long as reasonably necessary to operate the service, investigate issues, comply with obligations, and preserve security-relevant records. While reasonable safeguards are applied, no system can guarantee absolute security.',
    ],
  },
  {
    title: 'User Requests and Contact',
    paragraphs: [
      'If you need to request deletion, correction, or clarification about the information associated with your use of the site, contact the project through the public launch contact channel at team@flowdex.network.',
      'This privacy notice is intended to match the current Phase 1 product behavior and should be updated as the authentication, analytics, wallet, and presale systems evolve.',
    ],
  },
];

export function TermsPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Terms"
        title="Public terms for the FlowDex marketing and presale surface."
        description="This page establishes the launch-phase public terms for using the site, reading the whitepaper, and interacting with presale-facing content and app entry points."
        meta={[
          { label: 'Last Updated', value: 'April 2026' },
          { label: 'Applies To', value: 'Site, Whitepaper, Presale Surface' },
          { label: 'Nature', value: 'Informational Launch Terms' },
          { label: 'Contact', value: 'team@flowdex.network' },
        ]}
      />

      <MarketingContentShell>
        <div className="section-shell space-y-5">
          {termsSections.map(section => (
            <LegalDocumentSection
              key={section.title}
              title={section.title}
              paragraphs={section.paragraphs}
            />
          ))}
        </div>
      </MarketingContentShell>

      <MarketingCtaBand
        title="Move from the legal frame into the public product experience."
        body="The legal pages are part of launch readiness, but the live product proof still sits on the home, whitepaper, and buy routes."
        primaryHref="/buy"
        primaryLabel="Go to Buy"
        secondaryHref="/whitepaper"
        secondaryLabel="Read Whitepaper"
      />
    </div>
  );
}

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
        <div className="section-shell space-y-5">
          {privacySections.map(section => (
            <LegalDocumentSection
              key={section.title}
              title={section.title}
              paragraphs={section.paragraphs}
            />
          ))}
        </div>
      </MarketingContentShell>

      <MarketingCtaBand
        title="See how the product actually uses the public and protected surfaces."
        body="The privacy notice describes the current launch behavior, while the home, buy, and app routes show the actual user experience that behavior supports."
        primaryHref="/"
        primaryLabel="Back to Home"
        secondaryHref="/buy"
        secondaryLabel="Open Buy"
      />
    </div>
  );
}
