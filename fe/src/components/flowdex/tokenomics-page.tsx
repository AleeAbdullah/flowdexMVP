import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Coins, ShieldCheck, Vote } from '@/icons';
import { ROUTES } from '@/routes';
import {
  MarketingBody,
  MarketingContentShell,
  MarketingCtaBand,
  MarketingPageHero,
  MarketingSection,
  MarketingStatsGrid,
} from './marketing-content';
import { marketingTokenomics } from './marketing-data';

const utilityCards = [
  {
    title: 'Staking Utility',
    body: 'The token is framed as a productive asset inside the FlowDex ecosystem rather than a passive badge.',
    icon: Coins,
  },
  {
    title: 'Governance Surface',
    body: 'The public narrative positions $FDP as part of the long-term governance and product direction of the protocol.',
    icon: Vote,
  },
  {
    title: 'Protocol Alignment',
    body: 'Treasury, liquidity, and growth allocations are meant to support the actual exchange surface and its expansion path.',
    icon: ShieldCheck,
  },
];

export function TokenomicsPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Tokenomics"
        title="A route-level tokenomics page for allocation, utility, and protocol alignment."
        description="Tokenomics now has its own dedicated route instead of being buried inside the home page. This page should answer how $FDP is allocated, what it is meant to do, and how the token ties back to the product direction."
        meta={[
          { label: 'Ticker', value: '$FDP' },
          { label: 'Utility', value: 'Staking • Governance • Fee Participation' },
          { label: 'Community Allocation', value: '75%' },
          { label: 'Buy Context', value: 'Public launch-stage distribution' },
        ]}
        actions={(
          <>
            <Button variant="brand" size="lg" asChild>
              <Link href={ROUTES.MARKETING.BUY}>
                Buy Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link href={ROUTES.MARKETING.WHITEPAPER}>Whitepaper</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell
        toc={[
          { id: 'allocation', label: 'Allocation' },
          { id: 'utility', label: 'Utility' },
          { id: 'design', label: 'Design Intent' },
        ]}
      >
        <MarketingSection
          id="allocation"
          eyebrow="Allocation"
          title="The supply model is organized around community ownership first."
          description="This route replaces the old tokenomics section on the home page with a clearer allocation view."
        >
          <MarketingStatsGrid
            items={marketingTokenomics.map(item => ({
              label: item.label,
              value: item.share,
              note: item.note,
            }))}
          />
        </MarketingSection>

        <MarketingSection
          id="utility"
          eyebrow="Utility"
          title="The token should map to real product surfaces, not abstract slogans."
          description="The token story needs to stay connected to how the exchange, governance, and fee mechanics are described publicly."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {utilityCards.map(card => {
              const Icon = card.icon;

              return (
                <Card key={card.title}>
                  <CardHeader>
                    <Badge variant="brand" className="w-fit gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      Utility
                    </Badge>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.body}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </MarketingSection>

        <MarketingSection
          id="design"
          eyebrow="Design Intent"
          title="Tokenomics should support the product roadmap rather than float above it."
          description="The allocation and utility narrative needs to remain grounded in actual delivery."
        >
          <MarketingBody>
            <p>
              The community-heavy allocation structure is meant to reinforce the public positioning of FlowDex as a protocol-facing exchange surface, not a closed platform with purely operator-owned upside.
            </p>
            <p>
              Treasury, liquidity, and growth allocations should be interpreted in the context of building the exchange surface, supporting trading depth, and funding expansion into additional assets and chains.
            </p>
          </MarketingBody>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Tokenomics is one layer of the story. The product path is the next one.',
          body: 'If you want the delivery sequence behind the token model, move into the roadmap. If you want the long-form framing, continue into the whitepaper.',
          primary: { href: ROUTES.MARKETING.ROADMAP, label: 'View Roadmap' },
          secondary: { href: ROUTES.MARKETING.WHITEPAPER, label: 'Read Whitepaper' },
        }}
      />
    </div>
  );
}
