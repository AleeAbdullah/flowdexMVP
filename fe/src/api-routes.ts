export const API_ROUTES = {
  proxy: {
    publicBackend: '/api/public',
  },
  bff: {
    auth: {
      me: '/api/bff/auth/me',
    },
    dashboard: {
      summary: '/api/bff/dashboard/summary',
    },
    wallets: {
      root: '/api/bff/wallets',
      detail: (id: string) => `/api/bff/wallets/${id}`,
      challenge: '/api/bff/wallets/challenge',
      link: '/api/bff/wallets/link',
    },
    transactions: {
      root: '/api/bff/transactions',
      detail: (id: string) => `/api/bff/transactions/${id}`,
      simulate: '/api/bff/transactions/simulate',
      track: '/api/bff/transactions/track',
    },
    admin: {
      stats: '/api/bff/admin/stats',
      transactions: {
        root: '/api/bff/admin/transactions',
        detail: (id: string) => `/api/bff/admin/transactions/${id}`,
        reconcile: (id: string) => `/api/bff/admin/transactions/${id}/reconcile`,
      },
    },
  },
  public: {
    pricing: '/pricing',
    markets: {
      crypto: (params: { quote: string; limit: number }) => {
        const searchParams = new URLSearchParams({
          quote: params.quote,
          limit: String(params.limit),
        });
        return `/markets/crypto?${searchParams.toString()}`;
      },
      cryptoQuoteCurrencies: '/markets/crypto/quote-currencies',
    },
    presale: {
      stats: '/presale/stats',
      tiers: '/presale/tiers',
      config: '/presale/config',
    },
  },
  backend: {
    auth: {
      me: '/auth/me',
    },
    dashboard: {
      summary: '/dashboard/summary',
    },
    wallets: {
      root: '/wallets',
    },
    transactions: {
      root: '/transactions',
      detail: (id: string) => `/transactions/${id}`,
    },
    admin: {
      stats: '/admin/stats',
      transactions: {
        root: '/admin/transactions',
        detail: (id: string) => `/admin/transactions/${id}`,
      },
    },
  },
} as const;
