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
    answer: 'FlowDex is a non-custodial Universal Exchange. It allows you to trade crypto, tokenized real-world stocks like Tesla and Nvidia, forex pairs, and commodities directly from your decentralized wallet. Think of it as combining a Wall Street prime brokerage with the absolute ownership of DeFi.',
  },
  {
    question: 'Is FlowDex custodial? Do I need to deposit my funds?',
    answer: 'No. FlowDex is completely non-custodial. Your assets always remain safely in your own crypto wallet until the exact millisecond a trade is executed on-chain. There are no broker accounts, no deposit wait times, and zero counterparty risk.',
  },
  {
    question: 'What is the Blockchain Intelligence Layer?',
    answer: 'It is a built-in, conversational AI terminal that functions like a crypto Bloomberg Terminal. Because it uses Retrieval-Augmented Generation (RAG), it reads live blockchain data and your connected wallet to give you tailored trading advice in plain English. You can even go from an AI recommendation to an executed trade in a single step.',
  },
  {
    question: 'How can I participate in the presale?',
    answer: 'You can participate directly through our official Presale Portal by connecting an Ethereum-compatible wallet like MetaMask or Trust Wallet and exchanging ETH or stablecoins (USDT/USDC) for $FDP.',
  },
  {
    question: 'Why does the presale have 8 different tiers?',
    answer: 'The tiered structure is designed to reward our earliest supporters. Tier 1 starts at a 98% discount ($0.001) relative to the final exchange listing price ($0.05). As each tier hits its funding cap, the price automatically increases to the next tier.',
  },
  {
    question: 'What is the Per-Tier TGE model and how does it protect me?',
    answer: 'Instead of unlocking everyone\'s tokens at the same exact time on launch day (which causes massive price crashes), each tier has its own independent vesting clock. Your specific tier\'s cliff and vesting schedule begin the moment your tier fills and closes. Tokens are delivered directly to your wallet via secure Merkle claims but remain non-transferable until the public listing, ensuring a highly stable and healthy market launch.',
  },
  {
    question: 'Are there any venture capital investors?',
    answer: 'No. FlowDex is 100% community-funded. There are zero venture capital allocations. This ensures that predatory institutional dumps cannot happen at launch, keeping the ecosystem entirely aligned with retail participants.',
  },
  {
    question: 'How do I earn money by holding $FDP?',
    answer: 'FlowDex features a real revenue-sharing model. By staking your $FDP tokens, you natively receive 40% of all transaction fees collected by the exchange across all asset classes (crypto, stocks, forex, etc.).',
  },
  {
    question: 'Is the token supply inflationary?',
    answer: 'No. $FDP has a strictly fixed supply of 10 billion tokens that can never be increased. Furthermore, the protocol is actively deflationary: 10% of all platform transaction fees are systematically used to buy back and permanently burn $FDP tokens, removing them from circulation forever.',
  },
  {
    question: 'How does staking affect my access to the AI terminal?',
    answer: 'Staking unlocks tiered access to the Blockchain Intelligence Layer. Holding any $FDP gets you Basic access, while scaling up your staked tokens unlocks Standard, Premium, and ultimately Institutional tiers, which grant access to predictive signals, whale-tracking data, and advanced algorithmic APIs.',
  },
  {
    question: 'Has the smart contract been audited?',
    answer: 'Yes. Comprehensive audits are actively scheduled and planned with premier security firms including Trail of Bits, OpenZeppelin, and Zellic, alongside mathematical formal verification by Certora before any public token transfers are finalized.',
  },
];

export const marketingTokenomics = [
  { label: 'Community & Ecosystem', share: '30%', note: '3.00B tokens distributed over 4 years through ecosystem growth initiatives, grants, and partnerships.' },
  { label: 'Public Presale', share: '22.5%', note: '2.25B tokens allocated across the transparent 8-tier early participant framework.' },
  { label: 'Staking Rewards', share: '12.5%', note: '1.25B tokens managed through a 10-year declining emission schedule.' },
  { label: 'Genesis Airdrop', share: '10%', note: '1.00B tokens distributed to early users and testnet participants, fully unlocked at TGE.' },
  { label: 'Core Contributors', share: '12%', note: '1.20B tokens locked entirely for 1 year, followed by a strict 4-year linear vesting schedule.' },
  { label: 'Treasury / DAO', share: '8%', note: '0.80B tokens governed by on-chain community proposals.' },
  { label: 'Initial Liquidity', share: '5%', note: '0.50B tokens allocated directly to AMM pools and top-tier CEXs to guarantee deep day-one liquidity.' },
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
