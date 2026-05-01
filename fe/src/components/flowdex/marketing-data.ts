import type { MarketingPrimaryAction } from './marketing-nav-client';

export const marketingAppAction: MarketingPrimaryAction = {
  href: '/app',
  label: 'Open App',
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
  brandBody: 'FlowDex is building a wallet-first market surface for crypto, tokenized equities, forex, commodities, and other tokenized real-world assets.',
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
      title: 'Community',
      items: [
        { label: 'Telegram', href: '#', note: 'Coming soon. Replace in `marketing-data.ts`.' },
        { label: 'X', href: '#', note: 'Coming soon. Replace in `marketing-data.ts`.' },
        { label: 'Discord', href: '#', note: 'Coming soon. Replace in `marketing-data.ts`.' },
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
  noticeBody: 'This website is informational and promotional. Participation in any presale involves risk and should not be treated as legal, tax, or financial advice.',
  legalLine: '© 2026 FlowDex Network. All rights reserved.',
  utilityLine: '$FDN is presented as a utility token within the FlowDex ecosystem.',
};

export const marketingSocialCards = [
  { label: 'Telegram', href: '#', note: 'Coming soon. Replace in `marketing-data.ts` when the destination is ready.' },
  { label: 'X', href: '#', note: 'Coming soon. Replace in `marketing-data.ts` when the destination is ready.' },
  { label: 'Discord', href: '#', note: 'Coming soon. Replace in `marketing-data.ts` when the destination is ready.' },
];

export const marketingFeatureCards = [
  {
    title: 'Universal Exchange',
    body: 'One market surface for crypto, tokenized stocks, forex, commodities, and indices.',
  },
  {
    title: 'Wallet-First Trust',
    body: 'A non-custodial flow that keeps the wallet as the primary trust boundary.',
  },
  {
    title: 'Cross-Chain Routing',
    body: 'Multi-chain execution posture without collapsing into a single-venue product.',
  },
  {
    title: 'Community Utility',
    body: 'Staking, governance, and fee participation designed into the product narrative.',
  },
];

export const marketingRoadmap = [
  {
    phase: 'Phase 1',
    title: 'Ethereum Foundation',
    body: 'Launch the presale, protected wallet flows, and first-wave exchange positioning on Ethereum.',
  },
  {
    phase: 'Phase 2',
    title: 'Multi-Chain Expansion',
    body: 'Add broader asset support, execution rails, and chain coverage for a wider market surface.',
  },
  {
    phase: 'Phase 3',
    title: 'FlowChain',
    body: 'Move toward a dedicated appchain built around execution, routing, and settlement visibility.',
  },
];

export const marketingFaqs = [
  {
    question: 'What makes FlowDex different from a crypto-only exchange?',
    answer: 'FlowDex is positioned as a universal exchange, not a crypto-only venue. The product direction spans crypto plus tokenized traditional markets such as stocks, forex, commodities, ETFs, and indices.',
  },
  {
    question: 'Does FlowDex custody user funds?',
    answer: 'No. The product direction is non-custodial. Wallet ownership stays primary while the backend handles durable ledgering and analytics.',
  },
  {
    question: 'What does the token do in the product?',
    answer: '$FDN is framed around ecosystem utility, including staking, governance, fee participation, and product-aligned community incentives.',
  },
  {
    question: 'Why split content into separate pages?',
    answer: 'The public site is moving to a route-first structure so each topic becomes a dedicated destination rather than forcing users through one long scrolling document.',
  },
  {
    question: 'Is the current buy flow already live?',
    answer: 'Yes. The public buy route reads pricing, tiers, and supported assets from backend market endpoints, while authenticated execution continues in the protected app flow.',
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
    title: 'Public presale pricing and tier data now come directly from the backend.',
    summary: 'The marketing surface no longer presents hardcoded presale numbers. Pricing, tiers, and configuration now resolve through the live backend read APIs.',
  },
  {
    category: 'Product',
    date: 'April 2026',
    title: 'The protected app now supports wallet linking, buy flow, and transaction tracking.',
    summary: 'Authenticated users can link an embedded wallet, run simulation checks, and monitor lifecycle state in the protected app shell.',
  },
  {
    category: 'Architecture',
    date: 'March 2026',
    title: 'Whitepaper v6.0 clarified the product arc from Ethereum to FlowChain.',
    summary: 'The current public whitepaper defines the universal exchange thesis, phased architecture, token utility, and market expansion strategy.',
  },
  {
    category: 'Security',
    date: 'March 2026',
    title: 'Operational caution remains part of the public product posture.',
    summary: 'The site continues to emphasize wallet-first trust, verification, and cautious product language over unsupported guarantees.',
  },
];

export const legalUpdateCards = [
  {
    title: 'Launch legal posture',
    body: 'Terms and privacy pages reflect the current launch-stage product behavior and should be replaced with jurisdiction-specific review later.',
    href: '/terms',
  },
  {
    title: 'Privacy and session model',
    body: 'The current privacy notice covers email-first auth, session-based access, wallet linking, and backend API mediation.',
    href: '/privacy',
  },
];
