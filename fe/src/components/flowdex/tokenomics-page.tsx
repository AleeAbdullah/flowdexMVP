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
    body: 'Stakers directly receive 40% of all platform transaction fees generated across crypto, tokenized stocks, forex, commodities, ETFs, and futures.',
    icon: Coins,
  },
  {
    title: 'Gated AI Terminal Access',
    body: 'Your staking balance dictates your tier on the Blockchain Intelligence Layer (Basic to Standard to Premium to Institutional), providing access to real-time predictive analytics and natural language trading.',
    icon: Vote,
  },
  {
    title: '10% Programmatic Burn',
    body: 'To introduce constant deflationary pressure, 10% of all protocol fees are automatically used to buy back and permanently destroy $FDP tokens from circulation.',
    icon: ShieldCheck,
  },
  {
    title: 'Quadratic Governance',
    body: 'Shape the platform via the FlowDex DAO. Utilizing a quadratic voting model (Voting Power = sqrt(staked $FDP)), community influence scales with long-term commitment, protecting the network from whale manipulation.',
    icon: Vote,
  },
  {
    title: 'Priority Routing & Chain Security',
    body: 'Stakers get optical priority on high-frequency routes. In Phase 3, $FDP transitions into the native gas and validation token securing the custom FlowChain appchain.',
    icon: ShieldCheck,
  },
];

const tokenMetrics = [
  { label: 'Token Name', value: 'FlowDex Protocol', note: 'Fixed-supply utility token powering ecosystem participation.' },
  { label: 'Ticker', value: '$FDP', note: 'Used for staking, governance, fee participation, and access tiers.' },
  { label: 'Token Standard', value: 'ERC-20', note: 'Ethereum Mainnet at launch.' },
  { label: 'Total Fixed Supply', value: '10,000,000,000', note: '10 Billion, immutable.' },
  { label: 'Target Listing Price', value: '$0.05', note: 'Public narrative listing reference.' },
  { label: 'Target Listing FDV', value: '$500,000,000', note: 'Implied by the fixed supply and target listing price.' },
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
        title="Designed for Sustained Value."
        description="Unlike inflationary rewards tokens, $FDP is engineered around genuine, non-speculative utility. With a hard-capped supply and a multi-channel revenue sharing loop, the value of $FDP scales directly with the trading volume of the Universal Exchange."
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
              <Link href={ROUTES.ASSETS.WHITEPAPER_PDF} target="_blank" rel="noreferrer">Whitepaper</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell
        toc={[
          { id: 'metrics', label: 'Metrics' },
          { id: 'utility', label: 'Utility' },
          { id: 'allocation', label: 'Allocation' },
          { id: 'vesting', label: 'Vesting' },
        ]}
      >
        <MarketingSection
          id="metrics"
          eyebrow="Key Token Metrics"
          title="A Fixed-Supply, Revenue-Generating Economic Engine."
          description="Key Token Metrics - Grid / Counter Layout"
        >
          <MarketingStatsGrid items={tokenMetrics} />
        </MarketingSection>

        <MarketingSection
          id="utility"
          eyebrow="Utility"
          title="One Asset. Five Distinct Functions."
          description="Holding and staking $FDP unlocks native ecosystem interactions that create constant market demand."
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
          id="allocation"
          eyebrow="Token Allocation Breakdown"
          title="Built by the Community, For the Community."
          description="With 75% of all tokens allocated to community-facing categories and absolutely 0% venture capital involvement, FlowDex guarantees a fair launch insulated from predatory institutional sell-off."
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
          id="vesting"
          eyebrow="Staggered Locks vs. Day-One Dumps"
          title="The Staggered Vesting Advantage."
          description="FlowDex utilizes a unique Per-Tier TGE Model. Instead of unlocking everyone's liquidity simultaneously at launch, each presale tier features its own independent vesting clock that starts ticking the moment that specific tier fills its hard cap."
        >
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <MarketingBulletList items={designIntentItems} />
            <MarketingBody>
              <p>
                Instead of unlocking everyone&apos;s liquidity at the same moment, FlowDex staggers cliffs and linear distribution schedules across a 12+ month horizon.
              </p>
              <p>
                By staggering cliffs and linear distribution scales across a 12+ month horizon, the protocol distributes token sell pressure evenly over time, preserving a healthy and robust price floor at exchange listing.
              </p>
            </MarketingBody>
          </div>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Claim your stake in the global intelligence layer.',
          body: 'Secure Tier 1 allocation at the launch-stage price or review the token smart contract before participating.',
          primary: { href: ROUTES.MARKETING.BUY, label: 'Secure Tier 1 Allocation ($0.001)' },
          secondary: { href: ROUTES.ASSETS.WHITEPAPER_PDF, label: 'Read Whitepaper', newTab: true },
        }}
      />
    </div>
  );
}
