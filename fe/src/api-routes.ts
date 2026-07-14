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
  adminAuth: {
    login: '/api/admin-auth/login',
    logout: '/api/admin-auth/logout',
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
      checkoutCapabilities: '/payments/checkout-capabilities',
      intents: '/payments/intents',
      intentStatus: (intentId: string) => `/payments/intents/${intentId}/status`,
      intentWalletAction: (intentId: string) => `/payments/intents/${intentId}/wallet-action`,
      intentTronBroadcast: (intentId: string, preparedActionId: string) => (
        `/payments/intents/${intentId}/wallet-actions/${preparedActionId}/tron-broadcast`
      ),
      intentTxResult: (intentId: string) => `/payments/intents/${intentId}/tx-result`,
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
      login: '/auth/login',
    },
    transactions: {
      root: '/transactions',
      simulate: '/transactions/simulate',
      track: '/transactions/track',
      detail: (id: string) => `/transactions/${id}`,
    },
    admin: {
      stats: '/admin/stats',
      payments: {
        root: '/admin/payments',
      },
    },
  },
} as const;
