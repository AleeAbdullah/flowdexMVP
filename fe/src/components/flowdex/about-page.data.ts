type AboutOpportunityIcon = 'globe' | 'wallet' | 'layers';

export const aboutPageMeta = [
  { label: 'Market Surface', value: 'Universal Exchange' },
  { label: 'Custody Model', value: 'Non-Custodial' },
  { label: 'Asset Coverage', value: 'Crypto, Stocks, Forex, Commodities' },
  { label: 'Public Presale', value: '8 Tiers, $80M Target' },
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
  'Universal, non-custodial trading across crypto-native tokens and real-world assets.',
  'A Blockchain Intelligence Layer that uses conversational AI and retrieval-augmented analysis.',
  'Next-generation routing across liquidity paths on multiple chains and regulated RWA providers.',
  'Private, security-forward architecture using zero-knowledge proofs, post-quantum cryptography, and routing optimization research.',
];

export const aboutPageAssetClasses = [
  'Crypto across 10+ blockchains',
  'Tokenized stocks such as Apple, Tesla, and Nvidia',
  'Forex pairs including major global currency markets',
  'Commodities including gold and silver',
  'ETFs and indices through tokenized traditional asset rails',
  '500+ aggregate tradeable assets as the network matures',
];

export const aboutPageOpportunityStats = [
  { label: 'Asset Accounts', value: '1 Wallet', note: 'A single interface for markets that usually require separate accounts and custodians.' },
  { label: 'Public Presale', value: '$80M', note: 'An 8-tier public presale designed to fund development, audits, and liquidity partnerships.' },
  { label: 'Community Supply', value: '75%', note: 'Community, ecosystem, and public presale categories dominate the token model.' },
];

export const aboutPageOpportunityCards = [
  { icon: 'globe' as AboutOpportunityIcon, title: 'Universal Exchange', body: 'Crypto, tokenized stocks, forex, commodities, ETFs, and indices are framed as one borderless trading surface.' },
  { icon: 'wallet' as AboutOpportunityIcon, title: 'Wallet-First Trust', body: 'Funds remain in the user wallet until the moment of execution instead of sitting inside a broker silo.' },
  { icon: 'layers' as AboutOpportunityIcon, title: 'Liquidity Intelligence', body: 'The routing engine is positioned around liquidity aggregation, lower slippage, and multi-chain execution paths.' },
];

export const aboutPageComparisonRows = [
  { label: 'Asset Breadth', values: ['Crypto plus tokenized stocks, forex, commodities, ETFs, and indices', 'Mostly crypto spot and derivatives'] },
  { label: 'Custody Model', values: ['Non-custodial and wallet-driven', 'Usually custodial'] },
  { label: 'Intelligence Layer', values: ['Conversational AI terminal tied to live chain and wallet context', 'Separate analytics tools or generic dashboards'] },
  { label: 'Token Utility', values: ['Fee sharing, AI access, burn mechanics, and quadratic governance', 'Platform discounts or centralized loyalty tokens'] },
];

export const aboutPagePhases = [
  {
    label: 'Phase 1',
    value: 'Ethereum Foundation',
    note: 'Core routing across Ethereum DEXs, initial RWA pools, and $FDP staking activation.',
  },
  {
    label: 'Phase 2',
    value: 'Multi-Chain Expansion',
    note: 'Native deployment across Solana, BSC, Arbitrum, Polygon, and Avalanche while scaling toward 500+ assets.',
  },
  {
    label: 'Phase 3',
    value: 'FlowChain',
    note: 'A custom appchain direction for faster execution, clearer settlement, and cross-asset margin support.',
  },
];

export const aboutPageCtaContent = {
  title: 'Ready to trade without boundaries?',
  body: 'Read the whitepaper for the long-form protocol thesis, join the community, or continue into the presale portal when you are ready to participate.',
  primary: { href: '/whitepaper', label: 'Read the Whitepaper' },
  secondary: { href: '/buy', label: 'Enter Presale Portal' },
};
