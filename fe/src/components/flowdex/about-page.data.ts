type AboutOpportunityIcon = 'globe' | 'wallet' | 'layers';

export const aboutPageMeta = [
  { label: 'Section', value: 'About FlowDex Protocol' },
  { label: 'Market Surface', value: 'Universal Exchange' },
  { label: 'Custody Model', value: 'Non-Custodial' },
  { label: 'Public Presale', value: '8 Tiers, $80M Target' },
];

export const aboutPageToc = [
  { id: 'vision', label: 'Our Vision' },
  { id: 'fueling', label: 'Fueling the Universal Exchange' },
  { id: 'pillars', label: 'Core Pillars' },
  { id: 'utility', label: '$FDP Utility' },
  { id: 'evolution', label: 'Network Evolution' },
  { id: 'community', label: 'Community-First' },
];

export const aboutPagePrinciples = [
  {
    title: 'Universal, Non-Custodial Trading',
    body: 'Trade across crypto-native tokens and real-world assets (RWAs) like equities, forex, and commodities. Your keys, your crypto, your assets. Funds never leave your wallet until the exact millisecond of on-chain execution.',
  },
  {
    title: 'The Blockchain Intelligence Layer',
    body: 'Access a conversational AI terminal powered by Retrieval-Augmented Generation (RAG). FlowDex reads live blockchain data, monitors sentiment, and assesses your specific portfolio risk to give you analyst-grade advice in plain English, and lets you execute recommended trades in a single step.',
  },
  {
    title: 'Next-Generation Execution',
    body: 'Our smart order routing engine scans thousands of liquidity paths across 10+ blockchains, 50+ DEXs, and top-tier regulated RWA providers to execute your trades at the absolute lowest cost and slippage.',
  },
  {
    title: 'Quantum-Ready & Private Architecture',
    body: 'Defend and optimize with cutting-edge tech. We utilize zero-knowledge proofs (zkSNARKs) to eliminate front-running and MEV bots, secure our ecosystem with post-quantum cryptography (PQC), and harness quantum computing protocols (QAOA) for unprecedented routing optimization.',
  },
];

export const aboutPageUtilityItems = [
  {
    title: 'Real Revenue Sharing',
    body: 'Alignment is rewarded. 40% of all platform transaction fees collected across crypto, stocks, forex, and commodities are distributed directly back to $FDP stakers.',
  },
  {
    title: 'Gated AI Intelligence',
    body: 'Staking $FDP unlocks access to the Blockchain Intelligence Layer, our real-time, conversational AI terminal that lets you analyze markets and execute trades in plain English.',
  },
  {
    title: 'Programmatic Deflation',
    body: 'A native buyback-and-burn protocol uses 10% of all platform transaction fees to permanently destroy $FDP, creating constant deflationary pressure as trading volume scales.',
  },
  {
    title: 'Network Sovereignty',
    body: '$FDP drives a Quadratic Voting DAO, ensuring that long-term community members, not just deep-pocketed whales, shape the future of global asset routing.',
  },
];

export const aboutPageOpportunityStats = [
  { label: 'Public Presale', value: '$80,000,000', note: 'An 8-Tier Public Presale to fund core development, tier-1 security audits, and institutional liquidity partnerships.' },
  { label: 'VC Involvement', value: '0%', note: 'Built with a strict community-first ethos and zero venture capital involvement.' },
  { label: 'Genesis Incentive', value: '$0.001 to $0.05', note: 'The presale scales from Tier 1 up to the listing price of Tier 8.' },
];

export const aboutPageOpportunityCards = [
  { icon: 'globe' as AboutOpportunityIcon, title: 'The Genesis Incentive', body: 'The presale scales from Tier 1 ($0.001) up to the listing price of Tier 8 ($0.05), heavily rewarding early participants.' },
  { icon: 'wallet' as AboutOpportunityIcon, title: 'Anti-Dump Architecture', body: 'Each tier features a unique, smart-contract-enforced vesting schedule that begins the moment that specific tier closes, natively staggering sell pressure over a 12+ month horizon.' },
  { icon: 'layers' as AboutOpportunityIcon, title: 'Fixed-Supply Utility', body: 'The entire platform is powered by $FDP, a fixed-supply utility token designed to align the incentives of traders, stakers, and developers.' },
];

export const aboutPagePhases = [
  {
    label: 'Phase 1',
    value: 'Ethereum Foundation',
    note: 'Core routing across 20+ Ethereum DEXs, initial stock/forex RWA pools, and $FDP staking activation.',
  },
  {
    label: 'Phase 2',
    value: 'Multi-Chain Expansion',
    note: 'Native deployment across Solana, BSC, Arbitrum, Polygon, and Avalanche, scaling target selection to 500+ assets.',
  },
  {
    label: 'Phase 3',
    value: 'FlowChain Ecosystem',
    note: 'Migration to our dedicated, custom appchain built for 50,000+ TPS, sub-500ms finality, and cross-asset margin support.',
  },
];

export const aboutPageCtaContent = {
  title: 'Ready to trade without boundaries?',
  body: 'FlowDex is entirely community-owned. 75% of the total 10 billion $FDP token supply is dedicated to the community, ecosystem, and public presale, with absolutely zero venture capital involvement.',
  primary: { href: '/whitepaper', label: 'Read the Whitepaper' },
  secondary: { href: '/buy', label: 'Enter Presale Portal' },
};
