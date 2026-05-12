import type { MarketingPrimaryAction } from './marketing-nav-client';

export const marketingAppAction: MarketingPrimaryAction = {
  href: '/buy',
  label: 'Join Presale',
};

export const marketingShellBanner = {
  status: 'Presale Live',
  stats: [
    { label: '$FDN Price', value: '$0.001' },
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
  noticeTitle: 'Presale Notice',
  noticeBody: 'Participation in the presale involves risk. Review the available materials carefully before making a purchase.',
  legalLine: '© 2026 FlowDex Network. All rights reserved.',
  utilityLine: '$FDN is intended for access and utility across the FlowDex ecosystem.',
};

export const marketingSocialCards = [];

export const marketingFeatureCards = [
  {
    title: 'Universal Exchange',
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
    body: 'Begin with presale access, wallet-connected accounts, and a focused exchange experience built around user control instead of custodial lock-in.',
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
    question: 'What makes FlowDex different from a crypto-only exchange?',
    answer: 'FlowDex is positioned as a universal exchange, not a crypto-only venue. The product direction spans crypto plus tokenized traditional markets such as stocks, forex, commodities, ETFs, and indices.',
  },
  {
    question: 'Does FlowDex custody user funds?',
    answer: 'No. FlowDex is designed around a non-custodial flow, so you connect and confirm actions from your own wallet.',
  },
  {
    question: 'What does the token do in the product?',
    answer: '$FDN is framed around ecosystem utility, including staking, governance, fee participation, and product-aligned community incentives.',
  },
  {
    question: 'Why split content into separate pages?',
    answer: 'Each topic has its own page so it is easier to explore pricing, tokenomics, product details, and support information at your own pace.',
  },
  {
    question: 'Is the current buy flow already live?',
    answer: 'Yes. You can connect a wallet, verify it, complete a purchase, and view your receipts from the public buy flow.',
  },
];

export const marketingTokenomics = [
  { label: 'Community Allocation', share: '75%', note: 'The dominant share is reserved for community-facing ownership and participation.' },
  { label: 'Protocol Treasury', share: '10%', note: 'Reserved for protocol operations, resilience, and long-term ecosystem support.' },
  { label: 'Liquidity', share: '8%', note: 'Supports trading depth and launch-stage market operations.' },
  { label: 'Growth + Airdrops', share: '7%', note: 'Covers market expansion, activation loops, and contributor incentives.' },
];

export const marketingBlogPosts = [
  {
    category: 'Presale',
    date: 'April 2026',
    title: 'Presale pricing and tiers now stay in sync across the public experience.',
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
    title: 'Whitepaper v6.0 expands on the path from Ethereum to FlowChain.',
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
