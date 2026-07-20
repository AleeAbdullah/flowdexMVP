import type { IconName } from '@/icons';

export const marketingShellBanner = {
  status: 'Launch Access Live',
  stats: [
    { label: '$FDP Price', value: '$0.001' },
    { label: 'Listing Reference', value: '$0.05' },
    { label: 'Community Allocation', value: '75%' },
    { label: 'Current Tier', value: '1 of 8' },
  ],
};

export const marketingShellFooter = {
  brandBody: 'FlowDex brings crypto and tokenized global markets into one wallet-first experience.',
  columns: [
    {
      title: 'Research',
      items: [
        { label: 'Whitepaper', href: '/whitepaper' },
        { label: 'Tokenomics', href: '/tokenomics' },
        { label: 'Roadmap', href: '/roadmap' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Legal Notice', href: '/legal' },
      ],
    },
  ],
  noticeTitle: 'Purchase Notice',
  noticeBody: 'Token purchases involve risk. Review the available materials carefully before making a purchase.',
  legalLine: '© 2026 FlowDex Network. All rights reserved.',
  utilityLine: '$FDP is intended for access and utility across the FlowDex ecosystem.',
  socialLinks: [
    { label: 'Telegram', href: 'https://t.me/flowdexprotocolofficial', icon: 'Send' },
    { label: 'Twitter/X', href: 'https://x.com/flowdexprotocol', icon: 'Twitter' },
  ] satisfies Array<{ label: string; href: string; icon: IconName }>,
};

export const marketingFeatureCards = [
  {
    title: 'FlowDex Protocol',
    body: 'One market surface for crypto, tokenized stocks, forex, commodities, and indices.',
  },
  {
    title: 'Wallet-First Trust',
    body: 'A simple non-custodial flow that keeps you in control of the wallet you use to participate.',
  },
  {
    title: 'Cross-Chain Routing',
    body: 'Built to support participation across multiple chains without locking users into a single venue.',
  },
  {
    title: 'Community Utility',
    body: 'Staking, governance, and fee participation designed into the product narrative.',
  },
];

export const marketingRoadmap = [
  {
    phase: 'Step 1',
    title: 'Open Wallet-First Access',
    body: 'Begin with launch access, wallet-connected accounts, and a focused exchange experience built around user control instead of custodial lock-in.',
  },
  {
    phase: 'Step 2',
    title: 'Unlock More Global Markets',
    body: 'Expand from crypto into tokenized equities, forex, commodities, and other market categories while supporting more chains and liquidity paths.',
  },
  {
    phase: 'Step 3',
    title: 'Power the FlowDex Network',
    body: 'Evolve toward FlowChain as the dedicated layer for faster execution, clearer settlement, and a market experience designed specifically for FlowDex users.',
  },
];

export const marketingFaqs = [
  {
    question: 'What exactly is FlowDex Protocol?',
    answer: 'FlowDex is a non-custodial Universal Exchange. It allows you to trade crypto, tokenized real-world stocks, forex pairs, and commodities directly from your decentralized wallet.',
  },
  {
    question: 'Is FlowDex custodial? Do I need to deposit my funds?',
    answer: 'No. FlowDex is completely non-custodial. Your assets remain in your own crypto wallet until the moment a trade is executed on-chain.',
  },
  {
    question: 'What is the Blockchain Intelligence Layer?',
    answer: 'It is a built-in conversational AI terminal that uses retrieval-augmented generation, live blockchain data, and connected wallet context to provide trading analysis in plain English.',
  },
  {
    question: 'How can I participate in the presale?',
    answer: 'You can participate through the official Presale Portal by connecting an Ethereum-compatible wallet and exchanging ETH or stablecoins for $FDP.',
  },
  {
    question: 'Why does the presale have 8 different tiers?',
    answer: 'The tiered structure is designed to reward earliest supporters. Tier 1 starts at $0.001, and each new tier increases until the target listing price of $0.05.',
  },
  {
    question: 'What is the Per-Tier TGE model and how does it protect me?',
    answer: 'Each presale tier has its own independent vesting clock that begins when that tier fills and closes, staggering unlock pressure instead of concentrating it on one launch day.',
  },
  {
    question: 'Are there any venture capital investors?',
    answer: 'No. FlowDex is positioned as 100% community-funded with zero venture capital allocations.',
  },
  {
    question: 'How do I earn money by holding $FDP?',
    answer: 'By staking $FDP, holders are positioned to receive 40% of platform transaction fees collected across supported asset classes.',
  },
  {
    question: 'Is the token supply inflationary?',
    answer: 'No. $FDP has a fixed supply of 10 billion tokens. The protocol narrative also includes a 10% fee-funded buyback-and-burn mechanism.',
  },
  {
    question: 'How does staking affect my access to the AI terminal?',
    answer: 'Staking unlocks tiered access to the Blockchain Intelligence Layer, from Basic through Standard, Premium, and Institutional levels.',
  },
  {
    question: 'Has the smart contract been audited?',
    answer: 'Comprehensive audits are described as scheduled and planned with security firms including Trail of Bits, OpenZeppelin, and Zellic, plus formal verification before public transfers are finalized.',
  },
];

export const marketingTokenomics = [
  { label: 'Community & Ecosystem', share: '30%', note: '3.00B tokens distributed over 4 years through ecosystem growth initiatives, grants, and partnerships.' },
  { label: 'Public Presale', share: '22.5%', note: '2.25B tokens allocated across the transparent 8-tier early participant framework.' },
  { label: 'Staking Rewards', share: '12.5%', note: '1.25B tokens managed through a 10-year declining emission schedule.' },
  { label: 'Core Contributors', share: '12%', note: '1.20B tokens locked for 1 year, followed by strict 4-year linear vesting.' },
  { label: 'Genesis Airdrop', share: '10%', note: '1.00B tokens distributed to early users and testnet participants, fully unlocked at TGE.' },
  { label: 'Treasury / DAO', share: '8%', note: '0.80B tokens governed by on-chain community proposals.' },
  { label: 'Initial Liquidity', share: '5%', note: '0.50B tokens allocated to AMM pools and top-tier CEXs for day-one liquidity.' },
];

export const marketingBlogPosts = [
  {
    category: 'Buy',
    date: 'April 2026',
    title: 'Buy pricing and tiers now stay in sync across the public experience.',
    summary: 'Pricing, tiers, and purchase configuration are now kept aligned across the public buy flow and supporting pages.',
  },
  {
    category: 'Product',
    date: 'April 2026',
    title: 'The public purchase flow now covers checkout, receipts, and activity.',
    summary: 'Users can connect a wallet, complete a purchase, and review receipts and activity without creating a separate account.',
  },
  {
    category: 'Architecture',
    date: 'March 2026',
    title: 'Whitepaper v7.1 expands on the path from Ethereum to FlowChain.',
    summary: 'The current whitepaper outlines the broader market vision, product roadmap, token utility, and long-term network direction.',
  },
  {
    category: 'Security',
    date: 'March 2026',
    title: 'Wallet-first participation remains central to the FlowDex experience.',
    summary: 'The public product experience focuses on clear wallet verification, straightforward purchase steps, and transparent product messaging.',
  },
];

export const legalUpdateCards = [
  {
    title: 'Terms and legal information',
    body: 'Review the current terms, legal notice, and other important information before participating.',
    href: '/terms',
  },
  {
    title: 'Privacy overview',
    body: 'Read how FlowDex handles privacy, wallet-based access, and related account information.',
    href: '/privacy',
  },
];
