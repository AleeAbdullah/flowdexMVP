export const APP_API_ROUTES = {
  authMe: '/api/bff/auth/me',
  dashboardSummary: '/api/bff/dashboard/summary',
  wallets: '/api/bff/wallets',
  walletChallenge: '/api/bff/wallets/challenge',
  walletVerify: '/api/bff/wallets/verify',
  purchaseIntents: '/api/bff/purchase-intents',
  transactions: '/api/bff/transactions',
  adminStats: '/api/bff/admin/stats',
  adminTransactions: '/api/bff/admin/transactions',
  adminReconciliationUnmatched: '/api/bff/admin/reconciliation/unmatched',
  adminRefunds: '/api/bff/admin/refunds',
} as const;
