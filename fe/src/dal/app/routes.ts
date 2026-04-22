export const APP_API_ROUTES = {
  authMe: '/api/bff/auth/me',
  dashboardSummary: '/api/bff/dashboard/summary',
  wallets: '/api/bff/wallets',
  walletLink: '/api/bff/wallets/link',
  transactions: '/api/bff/transactions',
  transactionSimulate: '/api/bff/transactions/simulate',
  transactionTrack: '/api/bff/transactions/track',
  adminStats: '/api/bff/admin/stats',
  adminTransactions: '/api/bff/admin/transactions',
} as const;
