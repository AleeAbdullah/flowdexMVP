import Link from 'next/link';
import { ArrowRight, FileText, Globe2, Layers3, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const principles = [
  'A single market surface for crypto, tokenized equities, forex, commodities, indices, and ETFs.',
  'Non-custodial execution so users keep asset control until the moment of on-chain settlement.',
  'Cross-chain routing designed to aggregate fragmented liquidity rather than force users into one venue.',
  'Community-owned token design with governance, fee sharing, and staking utility built into the product story.',
];

const assetClasses = [
  'Crypto across 10+ blockchains',
  'Tokenized stocks and ETFs',
  'Major and exotic forex pairs',
  'Commodities including gold and oil',
  'Indices, options, futures, and synthetic exposure',
  '500+ aggregate tradeable assets at maturity',
];

const phases = [
  {
    label: 'Phase 1',
    value: 'Ethereum Foundation',
    note: 'Launch crypto trading, first-wave tokenized assets, staking, governance, and cross-chain routing primitives.',
  },
  {
    label: 'Phase 2',
    value: 'Multi-Chain Expansion',
    note: 'Expand to BSC, Solana, Arbitrum, Polygon, and a broader 500+ asset set.',
  },
  {
    label: 'Phase 3',
    value: 'FlowChain',
    note: 'Migrate to a purpose-built appchain with faster finality and native multi-asset routing features.',
  },
];

export function AboutPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="About FlowDex"
        title="The Universal Crypto Exchange for crypto-native and tokenized real-world markets."
        description="FlowDex is positioned as a non-custodial universal exchange where crypto, tokenized stocks, forex, commodities, indices, and ETFs can live in one coherent market experience instead of being split across disconnected brokers and exchanges."
        meta={[
          { label: 'Asset Goal', value: '500+ Tradeable Markets' },
          { label: 'Custody Model', value: 'Non-Custodial' },
          { label: 'Chain Strategy', value: 'Ethereum → Multi-Chain → FlowChain' },
          { label: 'Ownership', value: 'Community-Facing Token Model' },
        ]}
        actions={(
          <>
            <Button variant="brand" size="lg" asChild>
              <Link href="/buy">
                Buy $FDN
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link href="/whitepaper">Read the Whitepaper</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell
        toc={[
          { id: 'mission', label: 'Mission' },
          { id: 'opportunity', label: 'Opportunity' },
          { id: 'assets', label: 'What Users Can Trade' },
          { id: 'principles', label: 'Product Principles' },
          { id: 'whitepaper', label: 'Whitepaper' },
          { id: 'phases', label: 'Development Phases' },
        ]}
      >
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
          description="The whitepaper frames this as a universal exchange opportunity rather than a crypto-only venue expansion."
        >
          <MarketingStatsGrid
            items={[
              { label: 'Crypto Volume', value: '$100B+', note: 'Spot and derivatives volume across centralized and decentralized venues.' },
              { label: 'Global Forex', value: '$9.6T / day', note: 'The largest financial market in the world and still largely inaccessible to crypto-native users.' },
              { label: 'Tokenized RWAs', value: '$50B+', note: 'Projected 2026 market cap direction in the whitepaper narrative.' },
            ]}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: Globe2, title: 'Borderless Access', body: 'A wallet-based experience that reduces geographic gating and platform fragmentation.' },
              { icon: Wallet, title: 'Wallet-First Trust', body: 'Users keep control of their assets instead of transferring risk to centralized intermediaries.' },
              { icon: Layers3, title: 'Aggregated Liquidity', body: 'Routing across DEXs, bridges, and tokenization providers to reduce slippage and venue lock-in.' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.15rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <div className="inline-flex rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--cyan)]">
                    <Icon className="h-5 w-5" />
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
          <MarketingBulletList items={assetClasses} columns={2} />
          <MarketingComparisonTable
            columns={['FlowDex', 'Typical Crypto Exchange']}
            rows={[
              { label: 'Asset Breadth', values: ['Crypto + tokenized real-world markets', 'Mostly crypto spot and derivatives'] },
              { label: 'Custody Model', values: ['Non-custodial and wallet-driven', 'Usually custodial'] },
              { label: 'Cross-Chain', values: ['Designed across 10+ chains', 'Often single-platform or limited bridging'] },
              { label: 'Fee Utility', values: ['Protocol fee sharing and staking utility', 'Platform discounts or centralized loyalty tokens'] },
            ]}
          />
        </MarketingSection>

        <MarketingSection
          id="principles"
          eyebrow="Core Principles"
          title="The product story is intentionally shaped around trust, composability, and community ownership."
          description="These principles should remain visible across both the marketing site and the product shell."
        >
          <MarketingBulletList items={principles} columns={2} />
        </MarketingSection>

        <MarketingSection
          id="whitepaper"
          eyebrow="Whitepaper"
          title="The concise product story is here. The full operating thesis lives in the whitepaper."
          description="Use the whitepaper when you want the longer-form treatment of the problem, architecture, token model, presale design, roadmap, and risk framing."
        >
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <MarketingBody>
              <p>
                The About page explains what FlowDex is and why it exists. The whitepaper goes deeper into how the platform is expected to evolve from Ethereum launch posture into a broader multi-chain exchange and, later, the FlowChain infrastructure direction.
              </p>
              <p>
                It also consolidates tokenomics, presale structure, governance, market opportunity, and the legal and risk framing into one route so serious buyers do not need to reconstruct the product narrative from scattered sections.
              </p>
            </MarketingBody>

            <div className="rounded-[1.15rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
              <div className="inline-flex rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--cyan)]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-bold text-[var(--text)]">Whitepaper v6.0</div>
              <div className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Public release covering architecture, token utility, roadmap, market thesis, and launch framing.
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="brand" size="sm" asChild>
                  <Link href="/whitepaper">
                    Open Whitepaper
                    <ArrowRight className="h-4 w-4" />
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
          <MarketingStatsGrid items={phases} />
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        title="Move from the product story to the actual presale surface."
        body="The public buy route already reads pricing, tiers, and presale configuration from the live backend. The whitepaper page gives the full long-form narrative if you want the deeper context first."
        primaryHref="/buy"
        primaryLabel="Go to Buy"
        secondaryHref="/whitepaper"
        secondaryLabel="Open Whitepaper"
      />
    </div>
  );
}
