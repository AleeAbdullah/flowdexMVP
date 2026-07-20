import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Coins, ShieldCheck, Vote } from '@/icons';
import { ROUTES } from '@/routes';
import {
  MarketingBody,
  MarketingBulletList,
  MarketingContentShell,
  MarketingCtaBand,
  MarketingPageHero,
  MarketingSection,
  MarketingStatsGrid,
} from './marketing-content';
import { marketingTokenomics } from './marketing-data';

const utilityCards = [
  {
    title: '40% Protocol Fee Sharing',
    body: 'Stakers receive 40% of platform transaction fees generated across crypto, tokenized stocks, forex, commodities, ETFs, and futures.',
    icon: Coins,
  },
  {
    title: 'Gated AI Terminal Access',
    body: 'Staking balance unlocks access tiers for the Blockchain Intelligence Layer, from Basic through Institutional.',
    icon: Vote,
  },
  {
    title: '10% Programmatic Burn',
    body: 'A native buyback-and-burn loop uses 10% of protocol fees to permanently remove $FDP from circulation.',
    icon: ShieldCheck,
  },
  {
    title: 'Quadratic Governance',
    body: 'The DAO narrative uses quadratic voting so community influence scales with long-term commitment instead of raw wallet size.',
    icon: Vote,
  },
  {
    title: 'Priority Routing & Chain Security',
    body: 'Stakers receive priority on high-frequency routes, with $FDP positioned to become the native gas and validation token for FlowChain.',
    icon: ShieldCheck,
  },
];

const tokenMetrics = [
  { label: 'Token Name', value: 'FlowDex Protocol', note: 'Fixed-supply utility token powering ecosystem participation.' },
  { label: 'Ticker', value: '$FDP', note: 'Used for staking, governance, fee participation, and access tiers.' },
  { label: 'Token Standard', value: 'ERC-20', note: 'Ethereum Mainnet at launch.' },
  { label: 'Total Fixed Supply', value: '10B', note: 'Immutable total supply of 10,000,000,000 tokens.' },
  { label: 'Target Listing Price', value: '$0.05', note: 'Public narrative listing reference.' },
  { label: 'Target Listing FDV', value: '$500M', note: 'Implied by the fixed supply and target listing price.' },
];

const designIntentItems = [
  '40% of protocol fees are directed to stakers.',
  '30% of protocol fees support the insurance fund.',
  '20% of protocol fees flow to the treasury.',
  '10% of protocol fees support buyback-and-burn mechanics.',
  'Each presale tier has its own independent vesting clock once that tier fills.',
];

export function TokenomicsPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Tokenomics"
        title="Designed for sustained value."
        description="$FDP is engineered around a hard-capped supply, ecosystem utility, fee participation, and deflationary mechanics that tie token value back to Universal Exchange activity."
        meta={[
          { label: 'Ticker', value: '$FDP' },
          { label: 'Fixed Supply', value: '10B' },
          { label: 'Target Listing', value: '$0.05' },
          { label: 'Target FDV', value: '$500M' },
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
          { id: 'metrics', label: 'Metrics' },
          { id: 'allocation', label: 'Allocation' },
          { id: 'utility', label: 'Utility' },
          { id: 'vesting', label: 'Vesting' },
        ]}
      >
        <MarketingSection
          id="metrics"
          eyebrow="Key Token Metrics"
          title="A fixed-supply, revenue-generating economic engine."
          description="The token model starts from a hard cap and maps utility to staking, governance, access, routing, and fee participation."
        >
          <MarketingStatsGrid items={tokenMetrics} />
        </MarketingSection>

        <MarketingSection
          id="allocation"
          eyebrow="Allocation"
          title="Built by the community, for the community."
          description="With 75% of all tokens allocated to community-facing categories and 0% venture capital involvement, the public narrative centers a fair launch."
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
          title="One asset. Five distinct functions."
          description="Holding and staking $FDP unlocks ecosystem interactions designed to create product-linked demand."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          id="vesting"
          eyebrow="Staggered Locks"
          title="The Per-Tier TGE model is designed to avoid day-one unlock pressure."
          description="Each presale tier has its own independent vesting clock, starting when that specific tier fills its hard cap."
        >
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <MarketingBulletList items={designIntentItems} />
            <MarketingBody>
              <p>
                Instead of unlocking everyone&apos;s liquidity at the same moment, FlowDex staggers cliffs and linear distribution schedules across a 12+ month horizon.
              </p>
              <p>
                The goal is to distribute token sell pressure over time, preserve healthier listing dynamics, and align early buyers with the longer-term network path.
              </p>
            </MarketingBody>
          </div>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Claim your stake in the global intelligence layer.',
          body: 'Review the full model in the whitepaper or continue to the buy page to secure launch-stage allocation.',
          primary: { href: ROUTES.MARKETING.BUY, label: 'Secure Tier 1 Allocation' },
          secondary: { href: ROUTES.MARKETING.WHITEPAPER, label: 'Read Whitepaper' },
        }}
      />
    </div>
  );
}
