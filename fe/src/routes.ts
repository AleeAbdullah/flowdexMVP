export const AUTH_TOASTS = {
  BACKEND_UNREACHABLE: 'backend_unreachable',
} as const;

export const ROUTES = {
  MARKETING: {
    HOME: '/',
    ABOUT: '/about',
    BUY: '/buy',
    FAQ: '/faq',
    LEGAL: '/legal',
    PRIVACY: '/privacy',
    ROADMAP: '/roadmap',
    TERMS: '/terms',
    TOKENOMICS: '/tokenomics',
    UPDATES: '/updates',
    WHITEPAPER: '/whitepaper',
    BLOGS: '/blogs',
  },
  AUTH: {
    LOGIN: '/login',
  },
  USER: {
    BUY: '/buy',
    TRANSACTIONS: '/transactions',
    transactionDetail: (id: string) => `/transaction/${id}`,
  },
  ADMIN: {
    HOME: '/app/admin',
    TRANSACTIONS: '/app/admin/transactions',
    transactionDetail: (id: string) => `/app/admin/transactions/${id}`,
  },
  ASSETS: {
    WHITEPAPER_DOC: '/assets/whitepaper/FlowDex_Whitepaper.docx',
  },
} as const;
