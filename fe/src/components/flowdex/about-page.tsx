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
        title="The FlowDex Protocol for crypto-native and tokenized real-world markets."
        description="FlowDex is positioned as a non-custodial protocol where crypto, tokenized stocks, forex, commodities, indices, and ETFs can live in one coherent market experience instead of being split across disconnected brokers and exchanges."
        meta={aboutPageMeta}
        actions={(
          <>
            <Button variant="brand" size="lg" asChild>
              <Link href={ROUTES.MARKETING.BUY}>
                Buy $FDN
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
          eyebrow="Mission"
          title="Bridge blockchain infrastructure and traditional finance without falling back to custodial UX."
          description="The core FlowDex thesis is that users should not need separate broker accounts, separate funding rails, and separate interfaces just to access multiple asset classes."
        >
          <MarketingBody>
            <p>
              Today, a trader who wants crypto, Tesla stock, EUR/USD, gold, and equity indices usually needs multiple platforms and multiple custodians. FlowDex aims to collapse that fragmentation into one deliberate interface that stays wallet-first and settlement-aware.
            </p>
            <p>
              The product is designed around the idea that the convergence of DeFi and tokenized traditional assets should not recreate the trust assumptions of centralized exchanges. Instead, the interface, routing, and execution model should keep the user’s assets under their control until execution.
            </p>
          </MarketingBody>
        </MarketingSection>

        <MarketingSection
          id="opportunity"
          eyebrow="Opportunity"
          title="FlowDex sits at the intersection of crypto, forex, tokenized equities, commodities, and RWAs."
          description="The whitepaper frames this as a protocol opportunity rather than a crypto-only venue expansion."
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
          description="The whitepaper’s vision spans several asset classes and liquidity models."
        >
          <MarketingBulletList items={aboutPageAssetClasses} columns={2} />
          <MarketingComparisonTable
            columns={['FlowDex', 'Typical Crypto Exchange']}
            rows={aboutPageComparisonRows}
          />
        </MarketingSection>

        <MarketingSection
          id="principles"
          eyebrow="Core Principles"
          title="The product story is intentionally shaped around trust, composability, and community ownership."
          description="These principles should remain visible across both the marketing site and the product shell."
        >
          <MarketingBulletList items={aboutPagePrinciples} columns={2} />
        </MarketingSection>

        <MarketingSection
          id="whitepaper"
          eyebrow="Whitepaper"
          title="The concise product story is here. The full operating thesis lives in the whitepaper."
          description="Use the whitepaper when you want the longer-form treatment of the problem, architecture, token model, buy structure, roadmap, and risk framing."
        >
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <MarketingBody>
              <p>
                The About page explains what FlowDex is and why it exists. The whitepaper goes deeper into how the platform is expected to evolve from Ethereum launch posture into a broader multi-chain exchange and, later, the FlowChain infrastructure direction.
              </p>
              <p>
                It also consolidates tokenomics, buy structure, governance, market opportunity, and the legal and risk framing into one route so serious buyers do not need to reconstruct the product narrative from scattered sections.
              </p>
            </MarketingBody>

            <div className="rounded-[1.15rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
              <div className="inline-flex rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--accent-strong)]">
                <FileText aria-hidden="true" className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-bold text-[var(--text)]">Whitepaper v6.0</div>
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
          eyebrow="Development Phases"
          title="Ship product first, expand chain coverage second, earn infrastructure ambition third."
          description="The architecture and roadmap are phased to balance current delivery with the longer-term FlowChain direction."
        >
          <MarketingStatsGrid items={aboutPagePhases} />
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand content={aboutPageCtaContent} />
    </div>
  );
}
