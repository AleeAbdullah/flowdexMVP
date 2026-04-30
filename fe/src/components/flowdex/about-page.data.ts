export type AboutOpportunityIcon = 'globe' | 'wallet' | 'layers';

export const aboutPageMeta = [
  { label: 'Asset Goal', value: '500+ Tradeable Markets' },
  { label: 'Custody Model', value: 'Non-Custodial' },
  { label: 'Chain Strategy', value: 'Ethereum → Multi-Chain → FlowChain' },
  { label: 'Ownership', value: 'Community-Facing Token Model' },
];

export const aboutPageToc = [
  { id: 'mission', label: 'Mission' },
  { id: 'opportunity', label: 'Opportunity' },
  { id: 'assets', label: 'What Users Can Trade' },
  { id: 'principles', label: 'Product Principles' },
  { id: 'whitepaper', label: 'Whitepaper' },
  { id: 'phases', label: 'Development Phases' },
];

export const aboutPagePrinciples = [
  'A single market surface for crypto, tokenized equities, forex, commodities, indices, and ETFs.',
  'Non-custodial execution so users keep asset control until the moment of on-chain settlement.',
  'Cross-chain routing designed to aggregate fragmented liquidity rather than force users into one venue.',
  'Community-owned token design with governance, fee sharing, and staking utility built into the product story.',
];

export const aboutPageAssetClasses = [
  'Crypto across 10+ blockchains',
  'Tokenized stocks and ETFs',
  'Major and exotic forex pairs',
  'Commodities including gold and oil',
  'Indices, options, futures, and synthetic exposure',
  '500+ aggregate tradeable assets at maturity',
];

export const aboutPageOpportunityStats = [
  { label: 'Crypto Volume', value: '$100B+', note: 'Spot and derivatives volume across centralized and decentralized venues.' },
  { label: 'Global Forex', value: '$9.6T / day', note: 'The largest financial market in the world and still largely inaccessible to crypto-native users.' },
  { label: 'Tokenized RWAs', value: '$50B+', note: 'Projected 2026 market cap direction in the whitepaper narrative.' },
];

export const aboutPageOpportunityCards = [
  { icon: 'globe' as AboutOpportunityIcon, title: 'Borderless Access', body: 'A wallet-based experience that reduces geographic gating and platform fragmentation.' },
  { icon: 'wallet' as AboutOpportunityIcon, title: 'Wallet-First Trust', body: 'Users keep control of their assets instead of transferring risk to centralized intermediaries.' },
  { icon: 'layers' as AboutOpportunityIcon, title: 'Aggregated Liquidity', body: 'Routing across DEXs, bridges, and tokenization providers to reduce slippage and venue lock-in.' },
];

export const aboutPageComparisonRows = [
  { label: 'Asset Breadth', values: ['Crypto + tokenized real-world markets', 'Mostly crypto spot and derivatives'] },
  { label: 'Custody Model', values: ['Non-custodial and wallet-driven', 'Usually custodial'] },
  { label: 'Cross-Chain', values: ['Designed across 10+ chains', 'Often single-platform or limited bridging'] },
  { label: 'Fee Utility', values: ['Protocol fee sharing and staking utility', 'Platform discounts or centralized loyalty tokens'] },
];

export const aboutPagePhases = [
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

export const aboutPageCtaContent = {
  title: 'Move from the product story to the actual presale surface.',
  body: 'The public buy route already reads pricing, tiers, and presale configuration from the live backend. The whitepaper route carries the full long-form narrative if you want the deeper context first.',
  primary: { href: '/buy', label: 'Go to Buy' },
  secondary: { href: '/whitepaper', label: 'Open Whitepaper' },
};
