'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Globe2,
  Layers3,
  Mail,
  Rocket,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { usePresaleConfig, usePresaleStats, usePresaleTiers, usePricing } from '@/dal/market/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';
import { formatCompact, formatCurrency, formatPlainNumber, parseDecimal } from './utils';

const socialCards = [
  { label: 'Telegram', href: 'https://t.me', note: 'Live launch room and tier alerts' },
  { label: 'X', href: 'https://x.com', note: 'Announcements, market context, and release drops' },
  { label: 'Discord', href: 'https://discord.com', note: 'Builders, traders, and community ops' },
  { label: 'Medium', href: 'https://medium.com', note: 'Deep dives, roadmap, and token updates' },
  { label: 'GitHub', href: 'https://github.com', note: 'Protocol-facing engineering and repos' },
];

const partners = ['Ondo Finance', 'Backed Finance', 'Chainlink', 'Pyth', 'LayerZero', 'Wormhole', 'Dinari'];

const featureCards = [
  { title: '500+ Assets', body: 'A universal trading surface for crypto, tokenized equities, forex, gold, ETFs, and indices.', icon: Globe2 },
  { title: 'Non-Custodial', body: 'Wallet-first flows with on-chain settlement and clear proof surfaces around every transaction.', icon: Wallet },
  { title: 'Smart Routing', body: 'Execution intent designed for multi-venue liquidity and asset-specific settlement paths.', icon: BarChart3 },
  { title: 'Cross-Chain', body: 'ETH, FlowChain, and multi-chain asset mobility without reducing the interface to one ecosystem.', icon: Layers3 },
  { title: 'Fee Sharing', body: 'Protocol fee participation designed to push utility back to the community-owned token base.', icon: Coins },
  { title: 'FlowChain', body: 'Purpose-built chain direction for multi-asset trading, settlement, and data visibility.', icon: Rocket },
];

const roadmap = [
  { phase: '01', title: 'Foundation', body: 'Core exchange surface, non-custodial wallet flows, and institutional-style market presentation.' },
  { phase: '02', title: 'Presale', body: 'Community-owned token launch, live tier engine, and distribution visibility across every milestone.' },
  { phase: '03', title: 'Multi-Chain + 500 Assets', body: 'Tokenized stocks, forex pairs, commodities, and broader liquidity routing across chains.' },
  { phase: '04', title: 'FlowChain', body: 'Chain layer optimized around cross-asset execution, proof, and settlement discovery.' },
  { phase: '05', title: 'Global', body: 'Broader market access, more provider integrations, and community-governed growth paths.' },
];

const team = [
  { name: 'Atlas', role: 'Protocol Strategy', note: 'Cross-asset market design and token architecture.' },
  { name: 'Nyx', role: 'Core Engineering', note: 'Smart contract and execution pipeline lead.' },
  { name: 'Mira', role: 'Product Systems', note: 'App surfaces, market UX, and conversion design.' },
  { name: 'Orion', role: 'Chain Infrastructure', note: 'Cross-chain routing, observability, and ops.' },
  { name: 'Sable', role: 'Community Ops', note: 'Growth loops, contributor programs, and launch cadence.' },
  { name: 'Kite', role: 'Research', note: 'RWA integrations, macro surfaces, and market structure.' },
];

const faqs = [
  {
    question: 'What makes FlowDex different from a typical crypto-only exchange?',
    answer: 'FlowDex is framed around a universal exchange surface, so the product direction spans crypto, tokenized stocks, forex, gold, indices, and ETFs instead of stopping at one asset class.',
  },
  {
    question: 'Does FlowDex custody user funds?',
    answer: 'No. The product direction is explicitly non-custodial. The wallet remains the primary trust surface while the backend provides pricing, reconciliation, and presale orchestration.',
  },
  {
    question: 'What is the current presale token price?',
    answer: 'The page reads the current tier price directly from the backend presale stats so the number here stays aligned with the backend source of truth.',
  },
  {
    question: 'How many assets will the exchange support?',
    answer: 'The positioning goal is 500+ assets across multiple market classes, with launch phases expanding the coverage over time.',
  },
  {
    question: 'Will staking and governance matter in the product?',
    answer: 'Yes. The product vision includes fee sharing, staking, and community-led governance so utility extends beyond simple token ownership.',
  },
  {
    question: 'Is the team public?',
    answer: 'The current launch direction uses pseudonymous operator profiles while preserving trust through process, visible delivery, and future verification artifacts.',
  },
];

const tokenomics = [
  { label: 'Community', share: 75, color: '#00B4D8' },
  { label: 'Protocol Treasury', share: 10, color: '#0891B2' },
  { label: 'Liquidity', share: 8, color: '#22D3EE' },
  { label: 'Growth + Airdrops', share: 7, color: '#67E8F9' },
];

export function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const pricingQuery = usePricing();
  const presaleStatsQuery = usePresaleStats();
  const presaleTiersQuery = usePresaleTiers();
  const presaleConfigQuery = usePresaleConfig();

  const stats = presaleStatsQuery.data;
  const tiers = presaleTiersQuery.data?.items ?? [];
  const pricing = pricingQuery.data?.items ?? [];
  const supportedAssets = presaleConfigQuery.data?.supportedAssets ?? [];

  const heroCards = [
    {
      label: 'Universal Exchange',
      title: 'One market surface for crypto, tokenized stocks, forex, gold, and ETFs.',
    },
    {
      label: 'Pricing',
      title: `Live presale at ${stats ? formatCurrency(stats.currentTokenPriceUsd, 3) : '$0.001'} with backend-fed tier stats.`,
    },
    {
      label: 'TradFi Bridge',
      title: 'Bring institutional market language and data density into a wallet-first experience.',
    },
    {
      label: 'Non-Custodial Trust',
      title: 'Clear backend and chain truth layers designed around user-owned wallets, not custodial balances.',
    },
    {
      label: 'Staking',
      title: 'Utility extends into governance, fee sharing, and protocol-aligned participation.',
    },
  ];

  const pricingSpotlight = pricing.slice(0, 3);
  const listingPrice = 0.05;
  const hasError = pricingQuery.isError || presaleStatsQuery.isError || presaleTiersQuery.isError || presaleConfigQuery.isError;

  let tokenomicsProgress = 0;
  const pieStyle = {
    background: `conic-gradient(${tokenomics
      .map((item) => {
        const start = tokenomicsProgress;
        tokenomicsProgress += item.share;
        return `${item.color} ${start}% ${tokenomicsProgress}%`;
      })
      .join(', ')})`,
  };

  return (
    <div className="pb-10">
      <section className="section-shell section-pad grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-xs font-semibold tracking-[0.24em] text-cyan-200 uppercase">
            <ShieldCheck className="h-4 w-4" />
            Non-custodial universal exchange
          </div>

          <div className="space-y-5">
            <h1 className="text-balance max-w-4xl text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
              Bridging blockchain and traditional finance through one deliberate market interface.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              FlowDex is building a finance-grade exchange experience for crypto, tokenized equities,
              forex, gold, ETFs, and indices. The presale surface already reads from the live backend,
              so the numbers here stay aligned with the product system we are building.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="brand" size="lg" asChild>
              <Link href="/buy">
                Participate in Presale
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link href="/app/trade">Explore Product Vision</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {heroCards.map(card => (
              <GlassPanel key={card.label} className="p-5">
                <div className="text-[10px] font-bold tracking-[0.28em] text-cyan-300 uppercase">
                  {card.label}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">{card.title}</p>
              </GlassPanel>
            ))}
          </div>
        </div>

        <GlassPanel className="overflow-hidden p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold tracking-[0.32em] text-slate-400 uppercase">
                Live Presale Pulse
              </div>
              <div className="mt-2 text-2xl font-black text-white md:text-3xl">Tier {stats?.currentTier ?? 1}</div>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Live
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            <DataKicker label="Token Price" value={stats ? formatCurrency(stats.currentTokenPriceUsd, 3) : '$0.001'} />
            <DataKicker label="Funds Raised (Display)" value={stats ? formatCurrency(stats.fundsRaisedDisplayUsd, 0) : '$0'} />
            <DataKicker label="Tokens Sold (Display)" value={stats ? formatCompact(stats.tokensSoldDisplay, 1) : '0'} />
            <DataKicker label="Live Assets" value={`${supportedAssets.length || 3}+`} />
          </div>

          <div className="hairline my-8" />

          <div className="grid gap-4 md:grid-cols-3">
            {pricingSpotlight.map(item => (
              <div key={item.assetCode} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <div className="text-[10px] font-semibold tracking-[0.28em] text-slate-400 uppercase">
                  {item.chain}
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{item.assetCode}</div>
                <div className="font-data mt-3 text-lg text-cyan-200">{formatCurrency(item.priceUsd, 2)}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>

      <section id="overview" className="section-shell section-pad grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionHeading
          eyebrow="Project Intro"
          title="Institutional precision without custodial compromise."
          description="The product direction is not a generic swap page. FlowDex is intended to feel closer to a cross-asset market terminal while still keeping wallet ownership, chain settlement, and community ownership visible."
        />

        <GlassPanel className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
          <DataKicker label="Community Owned" value="75%" />
          <DataKicker label="Target Asset Coverage" value="500+" />
          <DataKicker label="Supported Chains" value="10+" />
          <DataKicker label="Listing Target" value="$0.05" />
          <div className="md:col-span-2 flex flex-wrap gap-3 text-xs text-slate-300">
            {['Audit posture', 'Trail of Bits', 'OpenZeppelin', 'Zellic', 'Wallet-first settlement'].map(item => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
        </GlassPanel>
      </section>

      {hasError ? (
        <section className="section-shell">
          <GlassPanel className="border-amber-400/20 bg-amber-500/8 p-4 text-sm text-amber-100">
            Live backend data could not be loaded for one or more sections. The UI stays usable, but we should check the frontend API URL or backend runtime before moving to protected flows.
          </GlassPanel>
        </section>
      ) : null}

      <section className="section-shell section-pad">
        <SectionHeading
          eyebrow="Community"
          title="Social surfaces built as first-class trust signals."
          description="Instead of hiding community channels in the footer, the landing flow puts them near the live stats and positioning copy to support legitimacy and discovery."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {socialCards.map(card => (
            <a key={card.label} href={card.href} target="_blank" rel="noreferrer">
              <GlassPanel className="h-full p-5 hover:border-cyan-400/40">
                <div className="text-sm font-bold text-white">{card.label}</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{card.note}</p>
              </GlassPanel>
            </a>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/8 bg-white/4 px-6 py-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Liquidity and data stack</div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-200">
            {partners.map(partner => (
              <span key={partner}>{partner}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell section-pad">
        <SectionHeading
          eyebrow="Core Features"
          title="Card-first, data-first, and intentionally multi-asset."
          description="Every major product promise is surfaced as a deliberate system card rather than generic landing-page filler. The layout leans into finance-density without losing clarity."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <GlassPanel key={feature.title} className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-lg font-bold text-white">{feature.title}</div>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-300">{feature.body}</p>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <section id="tokenomics" className="section-shell section-pad grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="Tokenomics"
            title="Community ownership is the anchor, not an afterthought."
            description="The launch story keeps the majority of the token base community-owned and treats staking, liquidity, treasury capacity, and growth as visible operating systems instead of hidden line items."
          />
        </div>
        <GlassPanel className="grid gap-8 p-6 md:grid-cols-[0.8fr_1.2fr] md:p-8">
          <div className="space-y-4">
            <div className="mx-auto h-52 w-52 rounded-full border border-white/8 p-4">
              <div className="h-full w-full rounded-full" style={pieStyle} />
            </div>
            <div className="text-center text-xs text-slate-400">
              Planning view for the initial launch mix. Final schedule should track the official token docs.
            </div>
          </div>
          <div className="space-y-4">
            {tokenomics.map(item => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-white">{item.label}</span>
                  </div>
                  <span className="font-data text-cyan-200">{item.share}%</span>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-cyan-400/12 bg-cyan-400/6 p-5">
              <div className="text-[10px] font-bold tracking-[0.3em] text-cyan-300 uppercase">Token Details</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <DataKicker label="Ticker" value="$FDN" />
                <DataKicker label="Standard" value="ERC-20" />
                <DataKicker label="Total Supply" value={formatPlainNumber(10_000_000_000)} />
                <DataKicker label="Listing Target" value="$0.05" />
              </div>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section id="tiers" className="section-shell section-pad">
        <SectionHeading
          eyebrow="Presale Tiers"
          title="Backend-fed tier pricing with visible upside framing."
          description="These rows read from the presale service, so the pricing surface stays tied to the same backend contract the eventual buy flow will use."
        />
        <GlassPanel className="mt-10 overflow-hidden">
          <div className="grid grid-cols-[0.8fr_0.8fr_1fr_1fr_0.8fr] gap-4 border-b border-white/8 px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
            <div>Tier</div>
            <div>Price</div>
            <div>Token Cap</div>
            <div>Listing ROI</div>
            <div>Status</div>
          </div>
          <div>
            {tiers.map(tier => {
              const tierPrice = parseDecimal(tier.tokenPriceUsd);
              const roi = tierPrice > 0 ? ((listingPrice - tierPrice) / tierPrice) * 100 : 0;

              return (
                <div
                  key={tier.id}
                  className="grid grid-cols-[0.8fr_0.8fr_1fr_1fr_0.8fr] gap-4 border-b border-white/6 px-6 py-5 text-sm text-slate-200 last:border-b-0"
                >
                  <div className="font-semibold text-white">Tier {tier.order}</div>
                  <div className="font-data text-cyan-200">{formatCurrency(tier.tokenPriceUsd, 3)}</div>
                  <div className="font-data">{formatCompact(tier.tokenCapReal, 1)}</div>
                  <div className="font-data text-emerald-300">{formatPlainNumber(roi, 0)}%</div>
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tier.isActive ? 'bg-emerald-400/12 text-emerald-300' : 'bg-white/6 text-slate-300'}`}>
                      {tier.isActive ? 'Active' : 'Queued'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </section>

      <section id="roadmap" className="section-shell section-pad">
        <SectionHeading
          eyebrow="Roadmap"
          title="Launch in phases, but keep the product story coherent from day one."
          description="The roadmap stays visible because this is not a single-feature token launch. The market story, chain story, and governance story all need room to breathe."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {roadmap.map(item => (
            <GlassPanel key={item.phase} className="p-6">
              <div className="font-data text-cyan-300">{item.phase}</div>
              <div className="mt-4 text-lg font-bold text-white">{item.title}</div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{item.body}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="section-shell section-pad">
        <SectionHeading
          eyebrow="Team"
          title="Pseudonymous by design, operator-focused by execution."
          description="The current launch presentation keeps identities product-centric while emphasizing delivery, systems thinking, and visible coordination. KYC and future trust artifacts can sit beside this layer rather than replacing it."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {team.map(member => (
            <GlassPanel key={member.name} className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-bold text-white">{member.name}</div>
                  <div className="mt-1 text-sm text-cyan-200">{member.role}</div>
                </div>
                <div className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-cyan-200 uppercase">
                  KYC Ready
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{member.note}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section id="faq" className="section-shell section-pad">
        <SectionHeading
          eyebrow="FAQ"
          title="Answer the serious questions before asking for conversion."
          description="The FAQ section is intentionally positioned after the product proof and tier sections so skeptical users can validate the story before deciding to participate."
        />
        <div className="mt-10 space-y-4">
          {faqs.map(item => (
            <GlassPanel key={item.question} className="p-5">
              <details className="group">
                <summary className="cursor-pointer list-none text-lg font-semibold text-white group-open:text-cyan-200">
                  {item.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-300">{item.answer}</p>
              </details>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="section-shell pb-16">
        <GlassPanel className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/18 bg-cyan-400/8 px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-cyan-300 uppercase">
              <Mail className="h-3.5 w-3.5" />
              Email Subscribe
            </div>
            <h3 className="mt-5 text-3xl font-black text-white md:text-4xl">Stay close to the launch cadence.</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              Get presale tier updates, product milestones, and protocol notes without relying on fragmented social feeds.
            </p>
          </div>

          <form
            className="flex flex-col gap-3 md:justify-center"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              setEmail('');
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@marketdesk.com"
              className="h-12 rounded-2xl border-white/10 bg-[#071423] text-white placeholder:text-slate-500"
            />
            <Button variant="brand" size="lg" type="submit" disabled={!email}>
              Subscribe
            </Button>
            {submitted ? (
              <div className="text-sm text-emerald-300">
                Thanks. The subscription UI is in place; connect your real mailing provider when we wire the production flow.
              </div>
            ) : null}
          </form>
        </GlassPanel>
      </section>
    </div>
  );
}
