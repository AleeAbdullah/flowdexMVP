export const APP_API_ROUTES = {
  authMe: '/api/bff/auth/me',
  wallets: '/api/bff/wallets',
  walletChallenge: '/api/bff/wallets/challenge',
  walletVerify: '/api/bff/wallets/verify',
  purchaseIntents: '/api/bff/purchase-intents',
  transactions: '/api/bff/transactions',
} as const;
