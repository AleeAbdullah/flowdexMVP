import { marketingRoadmap } from './marketing-data';

export type LandingHeroVisualMode = 'globe' | 'cards' | 'scene';
export type LandingHeroAccent = 'cyan' | 'gold' | 'slate' | 'green' | 'rose';

export type LandingHeroCta = {
  label: string;
  href: string;
};

export type LandingHeroStat = {
  label: string;
  value: string;
  note: string;
};

export type LandingHeroVisualLayout = 'stack' | 'phase' | 'signal';

export type LandingHeroVisualItem = {
  label: string;
  value: string;
  note?: string;
};

export type LandingHeroVisualPanel = {
  eyebrow: string;
  title: string;
  body: string;
  badge?: string;
  layout: LandingHeroVisualLayout;
  items: LandingHeroVisualItem[];
};

export type LandingHeroSlide = {
  id: 'universal' | 'presale' | 'flowchain' | 'staking' | 'community';
  badge: string;
  title: string;
  emphasis: string;
  description: string;
  visualMode: LandingHeroVisualMode;
  accent: LandingHeroAccent;
  primary?: LandingHeroCta;
  secondary?: LandingHeroCta;
  stats: LandingHeroStat[];
  visualPanel: LandingHeroVisualPanel;
};

export const landingHeroSlides: LandingHeroSlide[] = [
  {
    id: 'universal',
    badge: 'Market Thesis',
    title: 'One wallet interface. Endless global markets.',
    emphasis: 'One wallet interface.',
    description: 'FlowDex delivers a unified, non-custodial market surface bringing decentralized crypto liquidity and institutional real-world asset tokenization under a single architecture. No custodial silos, no fragmented capital allocation.',
    visualMode: 'globe',
    accent: 'cyan',
    stats: [
      { label: 'Market Coverage', value: '500+', note: 'Crypto to tokenized real-world assets' },
      { label: 'Execution Posture', value: 'Wallet-First', note: 'User trust starts at the wallet layer' },
      { label: 'Chain Direction', value: '10+', note: 'Multi-chain ambition beyond launch' },
    ],
    visualPanel: {
      eyebrow: 'Global Market Surface',
      title: 'Market Reach',
      body: 'A wallet-first front door for crypto-native users who want broader market access without custodial silos or fragmented capital allocation.',
      badge: 'Live Thesis',
      layout: 'stack',
      items: [
        { label: 'Market Coverage', value: '500+', note: 'Crypto plus tokenized real-world assets' },
        { label: 'Execution Posture', value: 'Wallet-First', note: 'Trust anchored at the wallet layer' },
        { label: 'Chain Direction', value: '10+', note: 'Multi-chain ambition beyond launch' },
      ],
    },
  },
];

export const landingMarketStats = [
  { value: '500+', label: 'Market Coverage' },
  { value: '10+', label: 'Chain Direction' },
  { value: '40%', label: 'Fee Share To Stakers' },
  { value: '75%', label: 'Community Allocation' },
];

export const landingTrustSignals = [
  'Wallet-first execution posture',
  'Direct avenues for fee participation',
  'Multi-chain routing framework with deep liquidity pools',
];

export const landingFeatureTones = [
  { borderClass: 'border-l-[var(--feature-cyan)]', dotClass: 'bg-[var(--feature-cyan)]' },
  { borderClass: 'border-l-[var(--feature-slate)]', dotClass: 'bg-[var(--feature-slate)]' },
  { borderClass: 'border-l-[var(--feature-gold)]', dotClass: 'bg-[var(--feature-gold)]' },
  { borderClass: 'border-l-[var(--feature-green)]', dotClass: 'bg-[var(--feature-green)]' },
] as const;

export const landingTokenDistribution = [
  { label: 'Community & Ecosystem', percentage: 30, tokens: '3.00B', colorClass: 'bg-[var(--token-bar-community)]' },
  { label: 'Public Buy', percentage: 22.5, tokens: '2.25B', colorClass: 'bg-[var(--token-bar-presale)]' },
  { label: 'Staking Rewards', percentage: 12.5, tokens: '1.25B', colorClass: 'bg-[var(--token-bar-staking)]' },
  { label: 'Core Contributors', percentage: 12, tokens: '1.20B', colorClass: 'bg-[var(--token-bar-contributors)]' },
  { label: 'Genesis Airdrop', percentage: 10, tokens: '1.00B', colorClass: 'bg-[var(--token-bar-airdrop)]' },
  { label: 'Treasury / DAO', percentage: 8, tokens: '0.80B', colorClass: 'bg-[var(--token-bar-treasury)]' },
  { label: 'Initial Liquidity', percentage: 5, tokens: '0.50B', colorClass: 'bg-[var(--token-bar-liquidity)]' },
];

export const landingFeeDistribution = [
  { label: 'Stakers', percentage: 40, colorClass: 'bg-[var(--token-bar-community)]' },
  { label: 'Insurance Fund', percentage: 30, colorClass: 'bg-[var(--token-bar-presale)]' },
  { label: 'Treasury', percentage: 20, colorClass: 'bg-[var(--token-bar-staking)]' },
  { label: 'Burn', percentage: 10, colorClass: 'bg-[var(--token-bar-treasury)]' },
];

export const landingTeamHighlights = [
  {
    title: 'Product-Led Operators',
    body: 'The team posture stays focused on shipping the wallet-first market surface, not personality-led promotion.',
  },
  {
    title: 'Security Before Scale',
    body: 'Milestones prioritize cautious execution, treasury discipline, and reviewable product proof before broader expansion.',
  },
  {
    title: 'Progressive Transparency',
    body: 'The public narrative should earn trust through updates, roadmap delivery, and clear operating boundaries over time.',
  },
];

export const landingFaqHighlights = [
  {
    question: 'What makes FlowDex different from a crypto-only exchange?',
    answer: 'FlowDex is positioned as a protocol for broader market access, not a crypto-only venue. The product direction spans crypto plus tokenized traditional markets such as stocks, forex, commodities, ETFs, and indices.',
  },
  {
    question: 'Does FlowDex custody user funds?',
    answer: 'No. FlowDex is designed around a non-custodial flow, so you connect and confirm actions from your own wallet.',
  },
  {
    question: 'What does the token do in the product?',
    answer: '$FDP is framed around ecosystem utility, including staking, governance, fee participation, and product-aligned community incentives.',
  },
  {
    question: 'Why split content into separate pages?',
    answer: 'Each topic has its own page so it is easier to explore pricing, tokenomics, product details, and support information at your own pace.',
  },
];
export const landingRoadmapHighlights = marketingRoadmap;
