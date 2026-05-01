import Link from 'next/link';
import { Scale } from '@/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/routes';
import { MarketingContentShell, MarketingCtaBand, MarketingPageHero, MarketingSection } from './marketing-content';
import { legalUpdateCards } from './marketing-data';

export function LegalHubPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Legal"
        title="A dedicated legal hub for terms, privacy, and launch-stage notices."
        description="Legal content should be routed and discoverable like everything else. This hub gives the public site a clean entry point into the legal material instead of burying it in the footer."
        meta={[
          { label: 'Documents', value: 'Terms • Privacy' },
          { label: 'Use', value: 'Launch-stage public legal surface' },
          { label: 'Audience', value: 'Visitors, buyers, and users' },
          { label: 'Updated', value: 'April 2026' },
        ]}
        actions={(
          <>
            <Button variant="glass" size="lg" asChild>
              <Link href={ROUTES.MARKETING.TERMS}>Terms</Link>
            </Button>
            <Button variant="brand" size="lg" asChild>
              <Link href={ROUTES.MARKETING.PRIVACY}>Privacy</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell>
        <MarketingSection
          eyebrow="Legal Surface"
          title="Treat launch-stage legal material as first-class public content."
          description="The legal hub provides one route that explains what legal information currently exists and where it lives."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {legalUpdateCards.map(card => (
              <Card key={card.href}>
                <CardHeader>
                  <Badge variant="brand" className="w-fit gap-2">
                    <Scale aria-hidden="true" className="h-3.5 w-3.5" />
                    Legal
                  </Badge>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.body}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="glass" size="sm" asChild className="w-full justify-center">
                    <Link href={card.href}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </MarketingSection>
      </MarketingContentShell>

      {/* TODO(flowdex): Revisit MarketingCtaBand API once the shared marketing content refactor is scheduled. */}
      <MarketingCtaBand
        content={{
          title: 'The legal frame is separate. The product routes are still the main experience.',
          body: 'Use this hub when you need the legal posture or privacy context. Use the public home, whitepaper, and buy routes for the product-facing experience.',
          primary: { href: ROUTES.MARKETING.HOME, label: 'Back to Home' },
          secondary: { href: ROUTES.MARKETING.BUY, label: 'Open Buy' },
        }}
      />
    </div>
  );
}
