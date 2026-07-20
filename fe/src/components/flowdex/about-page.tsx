import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Globe2, Layers3, Wallet } from '@/icons';
import { ROUTES } from '@/routes';
import {
  aboutPageAssetClasses,
  aboutPageComparisonRows,
  aboutPageCtaContent,
  aboutPageMeta,
  aboutPageOpportunityCards,
  aboutPageOpportunityStats,
  aboutPagePhases,
  aboutPagePrinciples,
  aboutPageToc,
} from './about-page.data';
import {
  MarketingBody,
  MarketingBulletList,
  MarketingComparisonTable,
  MarketingContentShell,
  MarketingCtaBand,
  MarketingPageHero,
  MarketingSection,
  MarketingStatsGrid,
} from './marketing-content';

const iconMap = {
  globe: Globe2,
  wallet: Wallet,
  layers: Layers3,
} as const;

export function AboutPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="About FlowDex"
        title="The Intelligence Layer of Global Markets."
        description="FlowDex Protocol bridges blockchain and traditional finance through a non-custodial Universal Exchange where crypto, tokenized stocks, forex, commodities, ETFs, and indices can be traded from one wallet-first market surface."
        meta={aboutPageMeta}
        actions={(
          <>
            <Button variant="brand" size="lg" asChild>
              <Link href={ROUTES.MARKETING.BUY}>
                Buy $FDP
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link href={ROUTES.MARKETING.WHITEPAPER}>Read the Whitepaper</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell toc={aboutPageToc}>
        <MarketingSection
          id="mission"
          eyebrow="Our Vision"
          title="The financial world is fractured. FlowDex is built to eliminate those boundaries."
          description="A modern investor should not need separate accounts, custodians, funding rails, and portfolio views just to trade Bitcoin, Apple stock, the Euro, and gold."
        >
          <MarketingBody>
            <p>
              FlowDex is building a non-custodial Universal Exchange: a single decentralized platform where crypto, tokenized stocks, forex, commodities, ETFs, and indices can be traded directly from a connected wallet.
            </p>
            <p>
              The philosophy is simple: users should not have to choose between the asset coverage of a Wall Street prime brokerage and the sovereign ownership of decentralized finance. FlowDex is designed to combine both without reintroducing custodial risk.
            </p>
          </MarketingBody>
        </MarketingSection>

        <MarketingSection
          id="opportunity"
          eyebrow="Fueling the Universal Exchange"
          title="$FDP aligns traders, stakers, and developers around the product surface."
          description="The fixed-supply utility token is tied to a public presale, staking utility, fee participation, and long-term community ownership."
        >
          <MarketingStatsGrid items={aboutPageOpportunityStats} />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {aboutPageOpportunityCards.map(item => {
              const Icon = iconMap[item.icon];
              return (
                <div key={item.title} className="rounded-[1.15rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="inline-flex rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--accent-strong)]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-lg font-bold text-[var(--text)]">{item.title}</div>
                  <p className="mt-3 text-sm leading-8 text-[var(--muted)]">{item.body}</p>
                </div>
              );
            })}
          </div>
        </MarketingSection>

        <MarketingSection
          id="assets"
          eyebrow="What Users Can Trade"
          title="A multi-asset product direction, not a crypto-only exchange surface."
          description="The FlowDex product direction spans crypto-native markets and tokenized real-world assets under one wallet-first interface."
        >
          <MarketingBulletList items={aboutPageAssetClasses} columns={2} />
          <MarketingComparisonTable
            columns={['FlowDex', 'Typical Crypto Exchange']}
            rows={aboutPageComparisonRows}
          />
        </MarketingSection>

        <MarketingSection
          id="principles"
          eyebrow="Core Pillars"
          title="What sets FlowDex apart."
          description="The public product story is built around universal non-custodial trading, AI-assisted market intelligence, routing depth, and security-first architecture."
        >
          <MarketingBulletList items={aboutPagePrinciples} columns={2} />
        </MarketingSection>

        <MarketingSection
          id="whitepaper"
          eyebrow="Whitepaper"
          title="The concise product story is here. The full operating thesis lives in the whitepaper."
          description="Use the whitepaper for the longer treatment of the problem, architecture, token model, presale structure, roadmap, and risk framing."
        >
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <MarketingBody>
              <p>
                The About page explains what FlowDex is and why it exists. The whitepaper goes deeper into how the platform is expected to evolve from Ethereum launch posture into a broader multi-chain exchange and, later, the FlowChain infrastructure direction.
              </p>
              <p>
                It also consolidates tokenomics, presale structure, governance, market opportunity, and risk framing into one route so serious buyers do not need to reconstruct the product narrative from scattered sections.
              </p>
            </MarketingBody>

            <div className="rounded-[1.15rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
              <div className="inline-flex rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--accent-strong)]">
                <FileText aria-hidden="true" className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-bold text-[var(--text)]">Whitepaper v7.1</div>
              <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Public release covering architecture, token utility, roadmap, market thesis, and launch framing.
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="brand" size="sm" asChild>
                  <Link href={ROUTES.MARKETING.WHITEPAPER}>
                    Open Whitepaper
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </MarketingSection>

        <MarketingSection
          id="phases"
          eyebrow="The Network Evolution"
          title="FlowDex scales systematically through a phased rollout."
          description="The network path starts with an Ethereum foundation, expands into more chains and markets, then moves toward dedicated FlowChain infrastructure."
        >
          <MarketingStatsGrid items={aboutPagePhases} />
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand content={aboutPageCtaContent} />
    </div>
  );
}
