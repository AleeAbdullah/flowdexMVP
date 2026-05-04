import { ROUTES } from '@/routes';
import { marketingFaqs, marketingRoadmap } from './marketing-data';
import { isTopLevelMarketingNavHref } from './marketing-nav.utils';

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

function createNavCta(label: string, href: string): LandingHeroCta | undefined {
  return isTopLevelMarketingNavHref(href)
    ? { label, href }
    : undefined;
}

export const landingHeroSlides: LandingHeroSlide[] = [
  {
    id: 'universal',
    badge: 'Editorial Preview',
    title: 'A Universal Exchange for Crypto & Tokenized Global Markets.',
    emphasis: 'Universal Exchange',
    description: 'FlowDex is shaping a wallet-first market surface for crypto, tokenized equities, forex, commodities, and other real-world asset exposure.',
    visualMode: 'globe',
    accent: 'cyan',
    primary: createNavCta('Join Presale', ROUTES.MARKETING.BUY),
    secondary: createNavCta('About FlowDex', ROUTES.MARKETING.ABOUT),
    stats: [
      { label: 'Target Markets', value: '500+', note: 'Crypto to tokenized real-world assets' },
      { label: 'Execution Posture', value: 'Wallet-First', note: 'User trust starts at the wallet layer' },
      { label: 'Chain Direction', value: '10+', note: 'Multi-chain ambition beyond launch' },
    ],
    visualPanel: {
      eyebrow: 'Global Market Surface',
      title: 'Market Reach',
      body: 'A wallet-first front door for crypto-native users who want broader market access without falling back to custodial exchange assumptions.',
      badge: 'Live Thesis',
      layout: 'stack',
      items: [
        { label: 'Target Markets', value: '500+', note: 'Crypto plus tokenized real-world assets' },
        { label: 'Execution Posture', value: 'Wallet-First', note: 'Trust anchored at the wallet layer' },
        { label: 'Chain Direction', value: '10+', note: 'Multi-chain ambition beyond launch' },
      ],
    },
  },
  {
    id: 'presale',
    badge: 'Launch-Stage Pricing',
    title: 'Presale Access Starts at $0.001 Before the Broader Market Rollout.',
    emphasis: '$0.001',
    description: 'The public buy route reads live presale configuration while the marketing site focuses on why the exchange thesis matters.',
    visualMode: 'cards',
    accent: 'gold',
    primary: createNavCta('View Presale', ROUTES.MARKETING.BUY),
    secondary: createNavCta('Review Tokenomics', ROUTES.MARKETING.TOKENOMICS),
    stats: [
      { label: 'Current Tier', value: 'Tier 1', note: 'Presale live now' },
      { label: 'Listing Reference', value: '$0.05', note: 'Whitepaper framing' },
      { label: 'Community Allocation', value: '75%', note: 'Community-facing ownership' },
    ],
    visualPanel: {
      eyebrow: 'Product Surface',
      title: 'Presale Ladder',
      body: 'The live buy route owns pricing and tier reads while the hero frames the tiered entry story cleanly.',
      badge: '8 Tiers',
      layout: 'stack',
      items: [
        { label: 'Current Tier', value: 'Tier 1', note: 'Genesis access is live now' },
        { label: 'Listing Reference', value: '$0.05', note: 'Public whitepaper framing' },
        { label: 'Community Allocation', value: '75%', note: 'Community-facing ownership narrative' },
      ],
    },
  },
  {
    id: 'flowchain',
    badge: 'Phased Infrastructure',
    title: 'Start on Ethereum. Expand Across Chains. Earn the FlowChain Ambition.',
    emphasis: 'FlowChain',
    description: 'FlowDex is positioned as a phased product: prove the market surface first, widen routing and assets second, and only then move deeper into infrastructure.',
    visualMode: 'scene',
    accent: 'slate',
    primary: createNavCta('Read Whitepaper', ROUTES.MARKETING.WHITEPAPER),
    secondary: createNavCta('Open Roadmap', ROUTES.MARKETING.ROADMAP),
    stats: [
      { label: 'Phase 1', value: 'Ethereum', note: 'Launch foundation' },
      { label: 'Phase 2', value: 'Routing Rails', note: 'Broader execution coverage' },
      { label: 'Phase 3', value: 'FlowChain', note: 'Dedicated execution layer' },
    ],
    visualPanel: {
      eyebrow: 'Routing Logic',
      title: 'Infrastructure Arc',
      body: 'The exchange story comes first. Infrastructure depth is earned through execution, asset coverage, and settlement visibility over time.',
      badge: '3 Phases',
      layout: 'phase',
      items: [
        { label: 'Phase 1', value: 'Ethereum', note: 'Launch foundation' },
        { label: 'Phase 2', value: 'Routing', note: 'Broader execution coverage' },
        { label: 'Phase 3', value: 'FlowChain', note: 'Dedicated execution layer' },
      ],
    },
  },
  {
    id: 'staking',
    badge: 'Fee Participation',
    title: 'Stake $FDN. Earn Fee Exposure. Strengthen The Utility Story.',
    emphasis: 'Stake $FDN.',
    description: 'Staking, governance, and routing-aligned incentives turn exchange activity into token utility instead of leaving the asset as a passive presale instrument.',
    visualMode: 'scene',
    accent: 'green',
    primary: createNavCta('Open Tokenomics', ROUTES.MARKETING.TOKENOMICS),
    stats: [
      { label: 'Stakers', value: '40%', note: 'Illustrative fee share' },
      { label: 'Rewards Pool', value: '12.5%', note: 'Supply reserved for staking rewards' },
      { label: 'Insurance Fund', value: '30%', note: 'Protocol resilience allocation' },
    ],
    visualPanel: {
      eyebrow: 'Token Utility',
      title: 'Participation Layer',
      body: 'Routing activity feeds into staking relevance, fee exposure, and governance credibility.',
      badge: 'Utility',
      layout: 'signal',
      items: [
        { label: 'Stakers', value: '40%', note: 'Illustrative fee share' },
        { label: 'Rewards Pool', value: '12.5%', note: 'Reserved for staking rewards' },
        { label: 'Insurance Fund', value: '30%', note: 'Protocol resilience allocation' },
      ],
    },
  },
  {
    id: 'community',
    badge: 'Community Priority',
    title: 'By The Community. For The Community. No VC Gravity.',
    emphasis: 'Community',
    description: 'The ownership story stays legible: community-facing allocation dominates the public token narrative while venture capital dependency stays out of the core positioning.',
    visualMode: 'scene',
    accent: 'rose',
    primary: createNavCta('About the Thesis', ROUTES.MARKETING.ABOUT),
    stats: [
      { label: 'Community Share', value: '75%', note: 'Community-facing ownership categories' },
      { label: 'VC Allocation', value: '0%', note: 'No venture allocation in the narrative' },
      { label: 'Treasury / DAO', value: '8%', note: 'Long-horizon protocol control' },
    ],
    visualPanel: {
      eyebrow: 'Ownership Narrative',
      title: 'No VC Gravity',
      body: 'The ownership story stays explicit without turning the first screen into a tokenomics document.',
      badge: 'Community',
      layout: 'signal',
      items: [
        { label: 'Community Share', value: '75%', note: 'Community-facing ownership categories' },
        { label: 'VC Allocation', value: '0%', note: 'No venture allocation in the narrative' },
        { label: 'Treasury / DAO', value: '8%', note: 'Long-horizon protocol control' },
      ],
    },
  },
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
