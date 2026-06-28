export const API_ROUTES = {
  proxy: {
    publicBackend: '/api/public',
  },
  walletAuth: {
    challenge: '/api/wallet-auth/challenge',
    verify: '/api/wallet-auth/verify',
    logout: '/api/wallet-auth/logout',
    session: '/api/wallet-auth/session',
  },
  bff: {
    auth: {
      me: '/api/bff/auth/me',
    },
    transactions: {
      root: '/api/bff/transactions',
      detail: (id: string) => `/api/bff/transactions/${id}`,
      simulate: '/api/bff/transactions/simulate',
      track: '/api/bff/transactions/track',
    },
    payments: {
      intentWalletAction: (intentId: string) => `/api/bff/payments/intents/${intentId}/wallet-action`,
      intentTxResult: (intentId: string) => `/api/bff/payments/intents/${intentId}/tx-result`,
    },
    admin: {
      stats: '/api/bff/admin/stats',
      payments: {
        root: '/api/bff/admin/payments',
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
    },
    payments: {
      root: '/payments',
      intents: '/payments/intents',
      intentStatus: (intentId: string) => `/payments/intents/${intentId}/status`,
      portfolio: (params: { walletAddress: string }) => {
        const searchParams = new URLSearchParams({
          walletAddress: params.walletAddress,
        });
        return `/payments/portfolio?${searchParams.toString()}`;
      },
      leaders: (params: { limit: number }) => {
        const searchParams = new URLSearchParams({
          limit: String(params.limit),
        });
        return `/payments/leaders?${searchParams.toString()}`;
      },
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
    transactions: {
      root: '/transactions',
      simulate: '/transactions/simulate',
      track: '/transactions/track',
      detail: (id: string) => `/transactions/${id}`,
    },
    payments: {
      intentWalletAction: (intentId: string) => `/payments/intents/${intentId}/wallet-action`,
      intentTxResult: (intentId: string) => `/payments/intents/${intentId}/tx-result`,
    },
    admin: {
      stats: '/admin/stats',
      payments: {
        root: '/admin/payments',
      },
    },
  },
} as const;
