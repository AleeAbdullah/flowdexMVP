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
    BLOGS: '/blogs',
    blogPost: (slug: string) => `/blogs/${encodeURIComponent(slug)}`,
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
    BLOGS: '/app/admin/blogs',
    transactionDetail: (id: string) => `/app/admin/transactions/${id}`,
  },
  ASSETS: {
    WHITEPAPER_PDF: '/assets/whitepaper/FlowDex_Whitepaper_v7-1_newlogo.pdf',
  },
} as const;
