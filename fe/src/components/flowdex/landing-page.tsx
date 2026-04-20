'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Coins,
  FileCheck2,
  Globe2,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { HeroDitheringCard } from '@/components/ui/hero-dithering-card';
import { Input } from '@/components/ui/input';

type CtaLink = {
  label: string;
  href: string;
};

type HeroSlide = {
  badge: string;
  headline: {
    firstLine: string;
    secondLine: string;
    highlight: string;
  };
  description: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
};

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
};

type PresaleTier = {
  name: string;
  price: string;
  discount: string;
  cap: string;
  isLive?: boolean;
};

type TokenDistributionItem = {
  label: string;
  percentage: number;
  tokens: string;
  color: string;
};

type RoadmapPhase = {
  phase: string;
  timeline: string;
  title: string;
  items: string;
  isActive?: boolean;
};

type TeamMember = {
  alias: string;
  role: string;
  background: string;
};

type PseudonymousReason = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type TechStackItem = string;

const SLIDE_DURATION_MS = 8000;

const heroSlides: HeroSlide[] = [
  {
    badge: 'Presale Live - Tier 1 Open Now',
    headline: {
      firstLine: 'Trade Everything.',
      secondLine: 'One Exchange.',
      highlight: 'Everything',
    },
    description: 'Bitcoin, Tesla, gold, EUR/USD, and 500+ assets at full launch - non-custodial, cross-chain, settled on-chain.',
    primaryCta: { label: 'Join Presale', href: '/buy' },
    secondaryCta: { label: 'How It Works', href: '#about' },
  },
  {
    badge: 'Tier 1 - 98% Off Listing Price',
    headline: {
      firstLine: 'Get In Early at $0.001',
      secondLine: 'per $FDN',
      highlight: '$0.001',
    },
    description: 'Listing price: $0.05. Tier 1 gives you the deepest discount in the 8-tier presale. $1,000 becomes $50,000 at listing.',
    primaryCta: { label: 'View Presale Tiers', href: '#presale' },
    secondaryCta: { label: 'Read Whitepaper', href: '/whitepaper' },
  },
  {
    badge: 'ERC-20 on Ethereum',
    headline: {
      firstLine: 'Built on Ethereum.',
      secondLine: 'Scaling to FlowChain.',
      highlight: 'FlowChain',
    },
    description: 'Launches as ERC-20 for day-one security, then expands through multi-chain routing and the long-term FlowChain appchain direction.',
    primaryCta: { label: 'Read Whitepaper', href: '/whitepaper' },
    secondaryCta: { label: 'See Roadmap', href: '#roadmap' },
  },
  {
    badge: 'Staking Rewards - 12-18% APY',
    headline: {
      firstLine: 'Stake $FDN.',
      secondLine: 'Earn 40% of All Fees.',
      highlight: '40%',
    },
    description: 'Protocol fee sharing, governance voting, and routing priority. Every trade on every asset class strengthens the token utility story.',
    primaryCta: { label: 'Learn About $FDN', href: '#tokenomics' },
    secondaryCta: { label: 'View Roadmap', href: '#roadmap' },
  },
  {
    badge: '75% Community - No VC',
    headline: {
      firstLine: 'By the Community.',
      secondLine: 'For the Community.',
      highlight: 'Community',
    },
    description: 'No venture capital allocation. 75% of all tokens go to community-facing categories. Core team tokens are locked and vested.',
    primaryCta: { label: 'Tokenomics', href: '#tokenomics' },
    secondaryCta: { label: 'Meet the Team', href: '#team' },
  },
];

const keyStats = [
  { value: '500+', label: 'Assets' },
  { value: '10+', label: 'Chains' },
  { value: '$80M', label: 'Raise Target' },
  { value: '98%', label: 'Max Discount' },
  { value: '75%', label: 'Community' },
];

const trustBadges = [
  'Audits Planned with Trail of Bits',
  'OpenZeppelin Scheduled',
  'ERC-20 on Ethereum',
  'No VC',
];

const features: FeatureCard[] = [
  {
    icon: Globe2,
    title: 'Targeting 500+ Assets',
    description: 'Crypto, tokenized stocks, forex, commodities, indices, ETFs, options, and futures at full launch.',
    accent: '#00B4D8',
  },
  {
    icon: LockKeyhole,
    title: 'Non-Custodial',
    description: 'Your assets remain wallet-first. No broker account, no custodial platform balance, no opaque fund handling.',
    accent: '#55A868',
  },
  {
    icon: Zap,
    title: 'Smart Order Routing',
    description: 'Routing intent across DEXs, RWA providers, bridges, and asset-specific execution paths.',
    accent: '#D4A843',
  },
  {
    icon: Link2,
    title: 'Cross-Chain Native',
    description: 'Ethereum launch posture with multi-chain expansion across major ecosystems and bridge infrastructure.',
    accent: '#7B68AE',
  },
  {
    icon: Coins,
    title: 'Earn 40% of All Fees',
    description: 'Stake $FDN to participate in fee sharing across crypto, RWA, forex, commodity, and routing activity.',
    accent: '#C44E52',
  },
  {
    icon: Blocks,
    title: 'FlowChain (2027-2028)',
    description: 'Long-term infrastructure direction for faster finality, zero-gas routing, and cross-asset margin.',
    accent: '#3D5A80',
  },
];

const techStack: TechStackItem[] = [
  'Ondo Finance',
  'Backed Finance',
  'Chainlink',
  'Pyth Network',
  'LayerZero',
  'Wormhole',
  'Uniswap',
  'Dinari',
  'Celestia',
  'EigenLayer',
];

const tokenDistribution: TokenDistributionItem[] = [
  { label: 'Community & Ecosystem', percentage: 30, tokens: '3.00B', color: '#3D5A80' },
  { label: 'Presale (8 Tiers)', percentage: 22.5, tokens: '2.25B', color: '#0B1F3A' },
  { label: 'Staking Rewards', percentage: 12.5, tokens: '1.25B', color: '#D4A843' },
  { label: 'Core Contributors', percentage: 12, tokens: '1.20B', color: '#55A868' },
  { label: 'Genesis Airdrop', percentage: 10, tokens: '1.00B', color: '#00B4D8' },
  { label: 'Treasury / DAO', percentage: 8, tokens: '0.80B', color: '#C44E52' },
  { label: 'Initial Liquidity', percentage: 5, tokens: '0.50B', color: '#7B68AE' },
];

const feeDistribution = [
  { label: 'Stakers', percentage: 40, color: '#00B4D8' },
  { label: 'Insurance Fund', percentage: 30, color: '#3D5A80' },
  { label: 'Treasury', percentage: 20, color: '#D4A843' },
  { label: 'Burn', percentage: 10, color: '#C44E52' },
];

const presaleTiers: PresaleTier[] = [
  { name: 'Tier 1 - Genesis', price: '$0.001', discount: '98%', cap: '$5M', isLive: true },
  { name: 'Tier 2 - Pioneer', price: '$0.005', discount: '90%', cap: '$8M' },
  { name: 'Tier 3 - Seed', price: '$0.01', discount: '80%', cap: '$10M' },
  { name: 'Tier 4 - Early Bird', price: '$0.015', discount: '70%', cap: '$12M' },
  { name: 'Tier 5 - Builder', price: '$0.02', discount: '60%', cap: '$15M' },
  { name: 'Tier 6 - Accelerator', price: '$0.03', discount: '40%', cap: '$15M' },
  { name: 'Tier 7 - Growth', price: '$0.04', discount: '20%', cap: '$10M' },
  { name: 'Tier 8 - Launch', price: '$0.05', discount: '0%', cap: '$5M' },
];

const roadmap: RoadmapPhase[] = [
  {
    phase: 'Phase 0',
    timeline: 'Q1 2026',
    title: 'Foundation',
    items: 'Whitepaper v6.0, website, whitelist, security audits, RWA partnerships, and community building.',
    isActive: true,
  },
  {
    phase: 'Phase 1',
    timeline: 'Q2 2026',
    title: 'Presale & Launch',
    items: '8-tier presale, $FDN ERC-20 deploy, tokenized stocks, forex, gold, and staking portal.',
  },
  {
    phase: 'Phase 2',
    timeline: 'Q3-Q4 2026',
    title: '500 Assets',
    items: 'BSC, Solana, Arbitrum, targeted 500+ assets, options, futures, mobile app, and DAO.',
  },
  {
    phase: 'Phase 3',
    timeline: '2027-2028',
    title: 'FlowChain',
    items: 'Own appchain, 50K TPS target, zero-gas routing, cross-asset margin, and token migration.',
  },
  {
    phase: 'Phase 4',
    timeline: '2028+',
    title: 'Global Exchange',
    items: 'Validators, DAO handoff, structured products, institutional brokerage, and advanced analytics.',
  },
];

const team: TeamMember[] = [
  { alias: 'Atlas', role: 'Founder & CEO', background: 'Former quant trader at a top-5 global bank. 8+ years in DeFi.' },
  { alias: 'Helix', role: 'CTO', background: 'PhD Distributed Systems, ETH Zurich. Former L1 core engineer.' },
  { alias: 'Vector', role: 'Head of Risk', background: 'Former risk manager at Tier-1 exchange. Ex-Goldman Sachs.' },
  { alias: 'Cipher', role: 'Lead Smart Contracts', background: 'Core contributor to 2 audited protocols with >$1B TVL.' },
  { alias: 'Nova', role: 'Head of Research', background: 'PhD Cryptography. 15+ peer-reviewed publications.' },
  { alias: 'Orbit', role: 'Head of Growth', background: 'Led growth at two top-50 crypto projects.' },
];

const pseudonymousReasons: PseudonymousReason[] = [
  {
    icon: Target,
    title: 'Product Over Personality',
    description: 'The protocol should stand on fundamentals, code, and execution rather than personal brands.',
  },
  {
    icon: ShieldCheck,
    title: 'Security First',
    description: 'Teams managing high-value treasury systems face real physical and social-engineering threats.',
  },
  {
    icon: FileCheck2,
    title: 'KYC-Verified',
    description: 'Core members are represented as verified through an independent third-party legal entity.',
  },
  {
    icon: TrendingUp,
    title: 'Progressive Doxxing',
    description: 'Team reveal is framed as milestone-based, with identity earned through results.',
  },
];

const faqs: FaqItem[] = [
  {
    question: 'What is FlowDex Network?',
    answer: 'FlowDex Network is a non-custodial Universal Exchange bridging blockchain and traditional finance, with a target of 500+ tradeable assets from one decentralized interface at full launch.',
  },
  {
    question: 'What can I trade?',
    answer: 'The product direction spans crypto, tokenized stocks, forex, commodities, indices, ETFs, options, and futures through phased rollout.',
  },
  {
    question: 'How is this different from Bitget TradFi?',
    answer: 'FlowDex is positioned as non-custodial and cross-chain, while centralized TradFi products require platform custody and account-based access.',
  },
  {
    question: 'How do tokenized stocks work?',
    answer: 'Tokenized stocks are issued by regulated providers and backed by the underlying assets. FlowDex routes access; it does not become the issuer.',
  },
  {
    question: 'What about BlockchainFX?',
    answer: 'The public FlowDex position is decentralized, non-custodial, and cross-chain, avoiding the custodial and offshore-account assumptions of centralized alternatives.',
  },
  {
    question: 'What are the token details?',
    answer: '$FDN has a fixed 10B supply, Tier 1 pricing at $0.001, target listing at $0.05, and 75% community-facing allocation.',
  },
  {
    question: 'Is this safe?',
    answer: 'The product posture emphasizes non-custodial wallets, planned audits, formal verification direction, a bug bounty plan, and multisig treasury controls. It still carries smart-contract, market, and execution risk.',
  },
];

export function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % heroSlides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [activeSlide]);

  function goToSlide(index: number) {
    setActiveSlide(index);
  }

  function shiftSlide(direction: -1 | 1) {
    setActiveSlide(current => (current + direction + heroSlides.length) % heroSlides.length);
  }

  function handleSubscribe() {
    if (email.includes('@')) {
      setIsSubscribed(true);
    }
  }

  const slide = heroSlides[activeSlide] ?? heroSlides[0]!;

  return (
    <div className="pb-12">
      <section className="mx-auto w-full max-w-[88rem] px-3 py-12 md:px-5 md:py-16 lg:px-6 lg:py-20 relative grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(var(--card-border)_1px,transparent_1px),linear-gradient(90deg,var(--card-border)_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.08]" />

        <div className="space-y-8">
          <Badge variant="brand" className="gap-2 px-[22px] py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--green)]" />
            {slide.badge}
          </Badge>

          <div className="min-h-[300px] space-y-6 md:min-h-[330px]">
            <h1 className="font-heading max-w-4xl text-[clamp(2.35rem,6.2vw,4.35rem)] font-bold leading-[1.02] tracking-tight text-[var(--text)]">
              <span className="block">
                <HighlightText text={slide.headline.firstLine} highlight={slide.headline.highlight} />
              </span>
              <span className="block">
                <HighlightText text={slide.headline.secondLine} highlight={slide.headline.highlight} />
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--muted)] md:text-xl">
              {slide.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button variant="brand" size="lg" asChild>
                <Link href={slide.primaryCta.href}>
                  {slide.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link href={slide.secondaryCta.href}>{slide.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="glass"
              size="icon"
              aria-label="Previous slide"
              onClick={() => shiftSlide(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {heroSlides.map((item, index) => (
                <button
                  key={item.badge}
                  type="button"
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${activeSlide === index ? 'w-7 bg-[var(--cyan)]' : 'w-2.5 bg-[var(--track)]'}`}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="glass"
              size="icon"
              aria-label="Next slide"
              onClick={() => shiftSlide(1)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {/* <div className="h-1.5 max-w-xs overflow-hidden rounded-full bg-[var(--track)]">
            <div
              className="h-full rounded-full bg-[var(--cyan)] transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div> */}
        </div>

        <HeroDitheringCard className="p-5 md:p-6" contentClassName="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold tracking-[0.32em] text-[var(--muted)] uppercase">
                Live Presale Pulse
              </div>
              <div className="font-heading mt-2 text-2xl font-bold text-[var(--text)]">Tier 1</div>
            </div>
            <Badge variant="success">Live</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DataStat label="Token Price" value="$0.001" />
            <DataStat label="Listing Target" value="$0.05" />
            <DataStat label="Max Discount" value="-98%" tone="success" />
            <DataStat label="Community Allocation" value="75%" />
          </div>
        </HeroDitheringCard>
      </section>

      <section id="about" className="section-shell section-pad text-center">
        <Badge variant="brand" className="gap-2 px-[22px] py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--green)]" />
          Token Presale Now Live
        </Badge>
        <h2 className="font-heading mx-auto mt-6 max-w-3xl text-3xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
          What is <span className="text-[var(--cyan)]">FlowDex Network</span>?
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[var(--muted)] md:text-lg">
          FlowDex Network is a non-custodial Universal Exchange bridging blockchain and traditional finance. It is designed for crypto, tokenized stocks, forex, commodities, ETFs, and indices from one decentralized interface.
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-[var(--muted)] md:text-base">
          $FDN launches as an ERC-20 token on Ethereum. Tier 1 is live at $0.001 per token, with the long-term architecture moving from Ethereum launch to multi-chain expansion and the FlowChain appchain direction.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {keyStats.map(stat => (
            <Card key={stat.label} className="p-5 text-center">
              <div className="font-data text-3xl font-bold text-[var(--cyan)]">{stat.value}</div>
              <div className="mt-2 text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)] uppercase">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {trustBadges.map(badge => (
            <Badge key={badge} variant="subtle" className="gap-2 normal-case tracking-normal">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--green)]" />
              {badge}
            </Badge>
          ))}
        </div>
      </section>

      <section className="section-shell grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">
                Tier 1 - Live
              </div>
              <div className="font-data mt-3 text-3xl font-bold text-[var(--text)]">$1.85M / $5.00M</div>
            </div>
            <Badge variant="success" className="gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--green)]" />
              Live
            </Badge>
          </div>
          <div className="mt-6 h-2.5 overflow-hidden rounded-[5px] bg-[var(--track)]">
            <div className="h-full w-[36.9%] rounded-[5px] bg-[var(--cyan)]" />
          </div>
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
            <DataStat label="Price" value="$0.001" />
            <DataStat label="Discount" value="-98%" tone="success" />
            <DataStat label="Listing" value="$0.05" />
            <DataStat label="Filled" value="36.9%" />
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-6 md:p-8">
            <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">
              Presale Schedule
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3">
                <span className="text-[var(--muted)]">Tier 1</span>
                <span className="font-data text-[var(--text)]">$0.001</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3">
                <span className="text-[var(--muted)]">Tier 2</span>
                <span className="font-data text-[var(--text)]">$0.005</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3">
                <span className="text-[var(--muted)]">Tier 8</span>
                <span className="font-data text-[var(--text)]">$0.050</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">
              Vesting Schedule
            </div>
            <div className="mt-6 flex h-9 overflow-hidden rounded-lg bg-[var(--track)] text-[10px] font-bold">
              <div className="flex w-[14%] min-w-16 items-center justify-center bg-[var(--cyan)] text-white">5% TGE</div>
              <div className="flex w-[33%] items-center justify-center border-l border-white/10 text-[var(--muted)]">12mo cliff</div>
              <div className="flex flex-1 items-center justify-center border-l border-white/10 bg-[linear-gradient(90deg,var(--cyan-deep),var(--cyan))] text-white">24mo linear vest</div>
            </div>
            <div className="font-data mt-4 text-sm text-[var(--text)]">
              Full unlock: 36 months
            </div>
          </Card>
        </div>
      </section>

      <section className="section-shell section-pad">
        <SectionHeader eyebrow="How It Works" title="Crypto. Stocks. Forex. Gold. One platform." description="Six pillars define the Universal Exchange direction without forcing the full whitepaper into the home page." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <Card
              key={feature.title}
              className="p-6"
              style={{
                borderLeftColor: feature.accent,
                borderLeftWidth: 4,
                backgroundColor: `${feature.accent}10`,
              }}
            >
              <feature.icon className="h-8 w-8" style={{ color: feature.accent }} />
              <h3 className="font-heading mt-5 text-lg font-bold text-[var(--text)]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--card-border)] bg-[var(--bg)] py-10">
        <div className="section-shell">
          <div className="text-center text-[11px] font-bold tracking-[0.28em] text-[var(--muted)] uppercase">
            Planned Technology Stack
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {techStack.map(item => (
              <Badge key={item} variant="subtle" className="px-5 py-3 normal-case tracking-normal">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section id="tokenomics" className="section-shell section-pad">
        <SectionHeader eyebrow="Tokenomics" title="$FDN Token" description="Fixed supply, community-heavy allocation, and fee sharing summarized for the landing page." />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Card className="p-6">
            <CardTitle>Token Distribution</CardTitle>
            <div className="mt-6 space-y-4">
              {tokenDistribution.map(item => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between gap-4 text-sm">
                    <span className="font-medium text-[var(--text)]">{item.label}</span>
                    <span className="font-data text-[var(--muted)]">{item.percentage}% · {item.tokens}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--track)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percentage * 3.33}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5">
            <Card className="p-6">
              <CardTitle>Fee Revenue Distribution</CardTitle>
              <div className="font-data mt-2 text-sm text-[var(--muted)]">Taker fee: 0.035%</div>
              <div className="mt-6 space-y-4">
                {feeDistribution.map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 text-sm text-[var(--text)]">{item.label}</span>
                    <span className="font-data text-sm font-bold" style={{ color: item.color }}>{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="border-[var(--accent-border)] bg-[var(--accent-bg)] p-6">
              <div className="text-sm font-semibold text-[var(--text)]">Projected Year 1 Staking APY</div>
              <div className="font-data mt-3 text-4xl font-bold text-[var(--cyan)]">12-18%</div>
              <p className="mt-2 text-sm text-[var(--muted)]">At modeled protocol volume and stake participation.</p>
              <Button variant="glass" size="sm" asChild className="mt-5">
                <Link href="/tokenomics">Open tokenomics details</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section id="presale" className="section-shell section-pad">
        <SectionHeader eyebrow="Token Sale" title="Eight-tier presale" description="$80M target across eight tiers. Tier 1 is highlighted here; the buy route owns the transaction flow." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {presaleTiers.map((tier, index) => (
            <Card
              key={tier.name}
              className={`p-6 ${tier.isLive ? 'border-[var(--cyan)] bg-[var(--accent-bg)]' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-[11px] font-bold tracking-[0.22em] text-[var(--muted)] uppercase">
                  Tier {index + 1}
                </div>
                {tier.isLive ? <Badge variant="brand">Live</Badge> : null}
              </div>
              <div className="font-heading mt-4 text-lg font-bold text-[var(--text)]">{tier.name.split(' - ')[1]}</div>
              <div className="font-data mt-3 text-3xl font-bold text-[var(--cyan)]">{tier.price}</div>
              <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                <div>Raise cap: <span className="font-data text-[var(--text)]">{tier.cap}</span></div>
                <div>Discount: <span className="font-data text-[var(--green)]">{tier.discount}</span></div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button variant="brand" size="lg" asChild>
            <Link href="/buy">Connect Wallet & Join Presale</Link>
          </Button>
        </div>
      </section>

      <section id="roadmap" className="section-shell section-pad">
        <SectionHeader eyebrow="Roadmap" title="Building in public" description="The home page keeps the phase summary concise; the roadmap page carries deeper sequencing." />
        <div className="mt-10 grid gap-4 lg:grid-cols-5">
          {roadmap.map(item => (
            <Card key={item.phase} className={`p-5 ${item.isActive ? 'border-[var(--cyan)] bg-[var(--accent-bg)]' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--cyan)] uppercase">{item.phase}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{item.timeline}</div>
                </div>
                {item.isActive ? <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--cyan)]" /> : null}
              </div>
              <h3 className="font-heading mt-5 text-lg font-bold text-[var(--text)]">{item.title}</h3>
              <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{item.items}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Button variant="glass" asChild>
            <Link href="/roadmap">Open full roadmap</Link>
          </Button>
        </div>
      </section>

      <section id="team" className="section-shell section-pad">
        <SectionHeader eyebrow="Team" title="Built by DeFi and TradFi veterans" description="The home page shows the pseudonymous team posture without duplicating the full trust narrative from About." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {team.map(member => (
            <Card key={member.alias} className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#00B4D8,#0090B0)] font-heading text-lg font-bold text-white">
                {member.alias[0]}
              </div>
              <h3 className="font-heading mt-5 text-xl font-bold text-[var(--text)]">{member.alias}</h3>
              <div className="mt-1 text-sm font-semibold text-[var(--cyan)]">{member.role}</div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{member.background}</p>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <div className="text-center">
            <div className="text-[11px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">Why Pseudonymous?</div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Pseudonymity is framed as product-first trust and operational security, not an evasion of accountability.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {pseudonymousReasons.map(reason => (
              <Card key={reason.title} className="p-6">
                <reason.icon className="h-8 w-8 text-[var(--cyan)]" />
                <h3 className="font-heading mt-4 text-lg font-bold text-[var(--text)]">{reason.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{reason.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Badge variant="success" className="gap-2 px-[22px] py-2 normal-case tracking-normal">
              <CheckCircle2 className="h-4 w-4" />
              All team members KYC-verified through an independent third-party legal entity
            </Badge>
          </div>
        </div>
      </section>

      <section id="faq" className="section-shell section-pad max-w-4xl">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions" description="Concise answers here; the FAQ route can carry the deeper set." />
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map(item => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="section-shell section-pad text-center">
        <Card className="mx-auto max-w-3xl border-[var(--accent-border)] bg-[var(--accent-bg)] p-8 md:p-10">
          <h2 className="font-heading text-3xl font-bold text-[var(--text)] md:text-5xl">
            Trade Everything. Own the Exchange.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">
            $0.001 today. $0.05 target listing. Join the Genesis presale or read the full public whitepaper first.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="brand" size="lg" asChild>
              <Link href="/buy">Join Presale</Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link href="/whitepaper">Read Whitepaper</Link>
            </Button>
          </div>
          {isSubscribed ? (
            <Card className="mx-auto mt-8 max-w-md p-5">
              <div className="font-heading text-lg font-bold text-[var(--cyan)]">Subscribed.</div>
              <p className="mt-2 text-sm text-[var(--muted)]">Updates will go to {email}.</p>
            </Card>
          ) : (
            <div className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
              <Button type="button" variant="brand" onClick={handleSubscribe}>
                Subscribe
              </Button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function SectionHeader(props: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-bold tracking-[0.3em] text-[var(--cyan)] uppercase">{props.eyebrow}</div>
      <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
        {props.title}
      </h2>
      <p className="mt-4 text-base leading-8 text-[var(--muted)]">{props.description}</p>
    </div>
  );
}

function HighlightText(props: {
  text: string;
  highlight: string;
}) {
  if (!props.text.includes(props.highlight)) {
    return <>{props.text}</>;
  }

  const [before, ...after] = props.text.split(props.highlight);

  return (
    <>
      {before}
      <span className="text-[var(--cyan)]">{props.highlight}</span>
      {after.join(props.highlight)}
    </>
  );
}

function DataStat(props: {
  label: string;
  value: string;
  tone?: 'success';
}) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.label}</div>
      <div className={`font-data mt-2 text-xl font-bold ${props.tone === 'success' ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
        {props.value}
      </div>
    </div>
  );
}
