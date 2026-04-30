import { marketingFaqs, marketingRoadmap } from './marketing-data';

export type LandingHeroSlide = {
  badge: string;
  title: string;
  emphasis: string;
  description: string;
  primary: {
    label: string;
    href: string;
  };
  secondary: {
    label: string;
    href: string;
  };
};

export const landingHeroSlides: LandingHeroSlide[] = [
  {
    badge: 'Editorial Preview',
    title: 'A Universal Exchange for Crypto & Tokenized Global Markets.',
    emphasis: 'Universal Exchange',
    description: 'FlowDex is shaping a wallet-first market surface for crypto, tokenized equities, forex, commodities, and other real-world asset exposure.',
    primary: { label: 'Join Presale', href: '/buy' },
    secondary: { label: 'See the Thesis', href: '#market-thesis' },
  },
  {
    badge: 'Launch-Stage Pricing',
    title: 'Presale Access Starts at $0.001 Before the Broader Market Rollout.',
    emphasis: '$0.001',
    description: 'The public buy route reads live presale configuration while the marketing site focuses on why the exchange thesis matters.',
    primary: { label: 'View Presale', href: '/buy' },
    secondary: { label: 'Review Tokenomics', href: '#tokenomics' },
  },
  {
    badge: 'Phased Infrastructure',
    title: 'Start on Ethereum. Expand Across Chains. Earn the FlowChain Ambition.',
    emphasis: 'FlowChain',
    description: 'FlowDex is positioned as a phased product: prove the market surface first, widen routing and assets second, and only then move deeper into infrastructure.',
    primary: { label: 'Read Whitepaper', href: '/whitepaper' },
    secondary: { label: 'Open Roadmap', href: '#roadmap' },
  },
];

export const landingPresaleFacts = [
  { label: 'Current Tier', value: 'Tier 1', note: 'Presale Live' },
  { label: 'Listing Reference', value: '$0.05', note: 'Whitepaper framing' },
  { label: 'Community Allocation', value: '75%', note: 'Community-facing ownership' },
];

export const landingMarketStats = [
  { value: '500+', label: 'Target Markets' },
  { value: '10+', label: 'Chain Direction' },
  { value: '$80M', label: 'Presale Target' },
  { value: '40%', label: 'Fee Share To Stakers' },
];

export const landingTrustSignals = [
  'Wallet-first execution posture',
  'Dedicated routes for tokenomics, roadmap, FAQ, and whitepaper',
  'Protected app already supports wallet linking and transaction tracking',
];

export const landingFeatureTones = [
  { borderClass: 'border-l-[var(--feature-cyan)]', dotClass: 'bg-[var(--feature-cyan)]' },
  { borderClass: 'border-l-[var(--feature-slate)]', dotClass: 'bg-[var(--feature-slate)]' },
  { borderClass: 'border-l-[var(--feature-gold)]', dotClass: 'bg-[var(--feature-gold)]' },
  { borderClass: 'border-l-[var(--feature-green)]', dotClass: 'bg-[var(--feature-green)]' },
] as const;

export const landingTokenDistribution = [
  { label: 'Community & Ecosystem', percentage: 30, tokens: '3.00B', colorClass: 'bg-[var(--token-bar-community)]' },
  { label: 'Presale', percentage: 22.5, tokens: '2.25B', colorClass: 'bg-[var(--token-bar-presale)]' },
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

export const landingFaqHighlights = marketingFaqs.slice(0, 4);
export const landingRoadmapHighlights = marketingRoadmap;
