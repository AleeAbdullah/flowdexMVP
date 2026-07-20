import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';
import {
  MarketingBody,
  MarketingContentShell,
  MarketingCtaBand,
  MarketingPageHero,
  MarketingSection,
} from './marketing-content';

const roadmapPhases = [
  {
    phase: 'Phase 1',
    timeframe: 'Q2 2026',
    title: 'Presale & Market Entry',
    items: [
      'Capital & Token Launch: Initiation of the 8-tier community presale ($80M target) and deployment of the $FDP ERC-20 smart contract.',
      'Universal Interface v1: Launch of the multi-asset aggregator on Ethereum mainnet, integrating 20+ top-tier DEXs.',
      'Initial Asset Suite: Live trading for 100+ tokenized stocks, 20+ forex pairs, and physical commodity exposure (Gold/Silver).',
      'Ecosystem Kickoff: Activation of the $FDP staking engine, native fee-sharing distribution, and primary DEX/CEX market listings.',
    ],
  },
  {
    phase: 'Phase 2',
    timeframe: 'Q3-Q4 2026',
    title: 'Multi-Chain Expansion',
    items: [
      'Cross-Chain Dominance: Native protocol deployment across Solana, BSC, Arbitrum, Polygon, and Avalanche.',
      'Target Asset Volume: Scaling coverage to target 500+ assets at full launch across all traditional and decentralized markets.',
      'Advanced Derivatives: Launch of decentralized options, futures, and contract-for-difference (CFD) instruments with up to 100x leverage.',
      'Retail & Pro Access: Release of the native FlowDex iOS & Android mobile trading app alongside an institutional high-frequency trading API.',
    ],
  },
  {
    phase: 'Phase 3',
    timeframe: '2027-2028',
    title: 'FlowChain Appchain Migration',
    items: [
      'Dedicated Infrastructure: Launch of the FlowChain Testnet and steady onboarding of 500+ independent, community-run validators.',
      'Sovereign Engine: Full mainnet migration to our custom appchain, unlocking 50,000+ TPS and sub-500ms finality.',
      'Structural Paradigm Shifts: Introduction of zero-gas order routing for stakers and true cross-asset margin capabilities (e.g., using stock tokens as collateral for crypto trades).',
    ],
  },
  {
    phase: 'Phase 4',
    timeframe: '2028+',
    title: 'Network Maturity',
    items: [
      'The Sovereign DAO: Absolute handoff of all core protocol parameters, fees, and smart contracts to community governance.',
      'Ecosystem Expansion: Deployment of advanced conditional prediction markets and decentralized structured financial products.',
      'Global Prime Brokerage: Full integration of institutional prime brokerage interfaces backed by airtight, global regulatory compliance framework integrations.',
    ],
  },
];

export function RoadmapPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Roadmap"
        title="The Evolution of Global Liquidity."
        description="Our Systematic Phase-by-Phase Rollout."
        meta={[
          { label: 'Phase 1', value: 'Q2 2026' },
          { label: 'Phase 2', value: 'Q3-Q4 2026' },
          { label: 'Phase 3', value: '2027-2028' },
          { label: 'Phase 4', value: '2028+' },
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
              <Link href={ROUTES.MARKETING.ABOUT}>Read About</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell
        toc={[
          { id: 'phases', label: 'Phases' },
          { id: 'delivery', label: 'Delivery Logic' },
        ]}
      >
        <MarketingSection
          id="phases"
          eyebrow="Phases"
          title="Our Systematic Phase-by-Phase Rollout."
          description="FlowDex moves from presale and market entry to multi-chain expansion, FlowChain Appchain migration, and network maturity."
        >
          <div className="grid gap-4">
            {roadmapPhases.map((item, index) => (
              <Card key={item.phase}>
                <CardHeader className="md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">
                      {item.phase}: {item.timeframe}
                    </div>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                  </div>
                  <div className="font-data text-4xl text-[color-mix(in_srgb,var(--text)_28%,transparent)]">0{index + 1}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm leading-7 text-[var(--muted)]">
                    {item.items.map(phaseItem => (
                      <li key={phaseItem} className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3">
                        {phaseItem}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </MarketingSection>

        <MarketingSection
          id="delivery"
          eyebrow="Delivery Logic"
          title="Follow the data. Secure the future of global trading."
          description="The sequence starts with capital formation and product access, expands market coverage, then shifts toward dedicated infrastructure and network maturity."
        >
          <MarketingBody>
            <p>
              Phase 1 focuses on Capital & Token Launch, Universal Interface v1, the Initial Asset Suite, and Ecosystem Kickoff. Phase 2 extends the protocol through Cross-Chain Dominance, Target Asset Volume, Advanced Derivatives, and Retail & Pro Access.
            </p>
            <p>
              Phase 3 moves toward Dedicated Infrastructure, a Sovereign Engine, and Structural Paradigm Shifts. Phase 4 describes The Sovereign DAO, Ecosystem Expansion, and Global Prime Brokerage.
            </p>
          </MarketingBody>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Follow the roadmap from launch access to network maturity.',
          body: 'Follow the data. Secure the future of global trading.',
          primary: { href: ROUTES.MARKETING.BUY, label: 'Join the Presale Portal' },
          secondary: { href: ROUTES.MARKETING.ROADMAP, label: 'View the Interactive Roadmap' },
        }}
      />
    </div>
  );
}
