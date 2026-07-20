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
      'Initiate the 8-tier community presale with an $80M target and deploy the $FDP ERC-20 smart contract.',
      'Launch Universal Interface v1 on Ethereum mainnet with 20+ top-tier DEX integrations.',
      'Open initial asset coverage across tokenized stocks, forex pairs, and gold/silver commodity exposure.',
      'Activate the $FDP staking engine, native fee-sharing distribution, and primary DEX/CEX market listings.',
    ],
  },
  {
    phase: 'Phase 2',
    timeframe: 'Q3-Q4 2026',
    title: 'Multi-Chain Expansion',
    items: [
      'Deploy natively across Solana, BSC, Arbitrum, Polygon, and Avalanche.',
      'Scale market coverage toward 500+ assets across decentralized and traditional market categories.',
      'Launch decentralized options, futures, and CFD instruments with up to 100x leverage.',
      'Release FlowDex mobile apps for iOS and Android alongside an institutional high-frequency trading API.',
    ],
  },
  {
    phase: 'Phase 3',
    timeframe: '2027-2028',
    title: 'FlowChain Appchain Migration',
    items: [
      'Launch the FlowChain Testnet and onboard 500+ independent, community-run validators.',
      'Migrate to a custom appchain designed for 50,000+ TPS and sub-500ms finality.',
      'Introduce zero-gas order routing for stakers and true cross-asset margin capabilities.',
    ],
  },
  {
    phase: 'Phase 4',
    timeframe: '2028+',
    title: 'Network Maturity',
    items: [
      'Hand off core protocol parameters, fees, and smart contracts to community governance.',
      'Deploy conditional prediction markets and decentralized structured financial products.',
      'Integrate institutional prime brokerage interfaces backed by global compliance framework integrations.',
    ],
  },
];

export function RoadmapPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Roadmap"
        title="The evolution of global liquidity."
        description="FlowDex follows a systematic phase-by-phase rollout from presale and market entry to multi-chain expansion, FlowChain infrastructure, and long-term network maturity."
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
          title="Our systematic phase-by-phase rollout."
          description="Each phase builds on the one before it, moving from launch access to broader markets and dedicated network infrastructure."
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
          description="The sequence starts with capital formation and product access, then expands market coverage before shifting toward dedicated infrastructure."
        >
          <MarketingBody>
            <p>
              Phase 1 focuses on the public presale, smart contract launch, Universal Interface v1, and first-wave asset coverage. Phase 2 extends the protocol across more chains and market categories while adding retail, pro, and institutional access surfaces.
            </p>
            <p>
              Phase 3 moves toward FlowChain as a dedicated execution layer, while Phase 4 describes the longer-term DAO and institutional market maturity path.
            </p>
          </MarketingBody>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Follow the roadmap from launch access to network maturity.',
          body: 'Move into the presale portal when you are ready to participate, or review the whitepaper for the broader architecture behind the rollout.',
          primary: { href: ROUTES.MARKETING.BUY, label: 'Join the Presale Portal' },
          secondary: { href: ROUTES.MARKETING.WHITEPAPER, label: 'Read Whitepaper' },
        }}
      />
    </div>
  );
}
