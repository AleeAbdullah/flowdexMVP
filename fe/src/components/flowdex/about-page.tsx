import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe2, Layers3, Wallet } from '@/icons';
import { ROUTES } from '@/routes';
import {
  aboutPageCtaContent,
  aboutPageMeta,
  aboutPageOpportunityCards,
  aboutPageOpportunityStats,
  aboutPagePhases,
  aboutPagePrinciples,
  aboutPageToc,
  aboutPageUtilityItems,
} from './about-page.data';
import {
  MarketingBody,
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
        eyebrow="About FlowDex Protocol"
        title="The Intelligence Layer of Global Markets."
        description="Bridging Blockchain and Traditional Finance."
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
          id="vision"
          eyebrow="Our Vision"
          title="The financial world is fundamentally fractured."
        >
          <MarketingBody>
            <p>
              To trade Bitcoin, Apple stock, the Euro, and Gold, a modern investor is forced to navigate four separate accounts, deal with four different custodians, split their capital, and manage fragmented portfolios across isolated platforms.
            </p>
            <p>
              FlowDex Protocol completely eliminates these boundaries. We are building the world&apos;s first non-custodial Universal Exchange, a single decentralized platform where you can trade crypto, tokenized stocks, forex, commodities, ETFs, and indices instantly from your wallet. By merging advanced multi-chain liquidity aggregation with traditional asset tokenization rails, FlowDex delivers a frictionless, borderless, 24/7 trading ecosystem with absolute security and no custodial risk.
            </p>
            <p>
              Our Philosophy: You shouldn&apos;t have to choose between the asset coverage of a Wall Street prime brokerage and the sovereign ownership of decentralized finance. With FlowDex, you get both.
            </p>
          </MarketingBody>
        </MarketingSection>

        <MarketingSection
          id="fueling"
          eyebrow="Fueling the Universal Exchange"
          title="The entire platform is powered by $FDP."
          description="$FDP is a fixed-supply utility token designed to align the incentives of traders, stakers, and developers."
        >
          <MarketingBody className="mb-6">
            <p>
              To fund core development, tier-1 security audits, and institutional liquidity partnerships, FlowDex is launching an 8-Tier Public Presale to raise $80,000,000. Built with a strict community-first ethos, there is 0% venture capital involvement, giving early adopters the ultimate advantage.
            </p>
          </MarketingBody>
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
          id="pillars"
          eyebrow="The Core Pillars"
          title="What sets us apart."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {aboutPagePrinciples.map(item => (
              <div key={item.title} className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3">
                <div className="text-sm font-bold text-[var(--text)]">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </MarketingSection>

        <MarketingSection
          id="utility"
          eyebrow="How $FDP Empowers the Ecosystem"
          title="$FDP is the fundamental economic engine of the FlowDex network."
          description="$FDP isn't just a governance token; it is the fundamental economic engine of the FlowDex network."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {aboutPageUtilityItems.map(item => (
              <div key={item.title} className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3">
                <div className="text-sm font-bold text-[var(--text)]">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </MarketingSection>

        <MarketingSection
          id="evolution"
          eyebrow="The Network Evolution"
          title="FlowDex scales systematically through a proven, phased rollout."
          description="FlowDex doesn't just promise an ambitious future; we scale systematically through a proven, phased rollout."
        >
          <MarketingStatsGrid items={aboutPagePhases} />
        </MarketingSection>

        <MarketingSection
          id="community"
          eyebrow="Community-First & Sovereign"
          title="FlowDex is entirely community-owned."
          description="75% of the total 10 billion $FDP token supply is dedicated to the community, ecosystem, and public presale, with absolutely zero venture capital involvement."
        >
          <MarketingBody>
            <p>
              FlowDex is entirely community-owned. 75% of the total 10 billion $FDP token supply is dedicated to the community, ecosystem, and public presale, with absolutely zero venture capital involvement.
            </p>
            <p>
              When you stake $FDP, you don&apos;t just secure the network or tier-up your access to the Blockchain Intelligence Layer; you claim a direct stake in the platform&apos;s success. 40% of all platform transaction fees across crypto, stocks, forex, and commodities flow back natively to the community of stakers.
            </p>
          </MarketingBody>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand content={aboutPageCtaContent} />
    </div>
  );
}
