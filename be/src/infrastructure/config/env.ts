export const env = {
  port: Number(process.env.PORT ?? 3002),
  apiPrefix: process.env.API_PREFIX ?? "api",
  swaggerPath: process.env.SWAGGER_PATH ?? "docs",
  databaseUrl: process.env.DATABASE_URL ?? "",
  internalAuthJwtSecret: process.env.INTERNAL_AUTH_JWT_SECRET ?? "",
  internalAuthIssuer: process.env.INTERNAL_AUTH_ISSUER ?? "fe-bff",
  internalAuthAudience: process.env.INTERNAL_AUTH_AUDIENCE ?? "be-api",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
  authAccessTokenTtlSeconds: Number(process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS ?? 900),
  ethTreasuryAddress: process.env.ETH_TREASURY_ADDRESS ?? "",
  solTreasuryAddress: process.env.SOL_TREASURY_ADDRESS ?? "",
  solanaPreparedActionTtlSeconds: Number(process.env.SOLANA_PREPARED_ACTION_TTL_SECONDS ?? 75),
  solanaConfirmations: Number(process.env.SOLANA_CONFIRMATIONS ?? 1),
  btcTreasuryAddress: process.env.BTC_TREASURY_ADDRESS ?? "",
  btcTreasuryExtendedPublicKey: process.env.BTC_TREASURY_EXTENDED_PUBLIC_KEY ?? "",
  btcPaymentsEnabled: process.env.BTC_PAYMENTS_ENABLED === "true",
  tronTreasuryAddress: process.env.TRON_TREASURY_ADDRESS ?? "",
  tronUsdtContractAddress: process.env.TRON_USDT_CONTRACT_ADDRESS?.trim() || "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj",
  ethConfirmations: Number(process.env.ETH_CONFIRMATIONS ?? 12),
  btcConfirmations: Number(process.env.BTC_CONFIRMATIONS ?? 2),
  tronConfirmations: Number(process.env.TRON_CONFIRMATIONS ?? 20),
  paymentIntentTtlMinutes: Number(process.env.PAYMENT_INTENT_TTL_MINUTES ?? 30),
  paymentLateSubmissionGraceMinutes: Number(process.env.PAYMENT_LATE_SUBMISSION_GRACE_MINUTES ?? 30),
  paymentStatusCacheSeconds: Number(process.env.PAYMENT_STATUS_CACHE_SECONDS ?? 20),
  paymentScannerCron: process.env.PAYMENT_SCANNER_CRON ?? "*/30 * * * * *",
  paymentScannerBatchSize: Number(process.env.PAYMENT_SCANNER_BATCH_SIZE ?? 20),
  treasuryAddressEthSepolia: process.env.TREASURY_ADDRESS_ETH_SEPOLIA ?? "",
  treasuryAddressBaseSepolia: process.env.TREASURY_ADDRESS_BASE_SEPOLIA ?? "",
  alchemyApiKey: process.env.ALCHEMY_API_KEY ?? "",
  alchemyNotifyAuthToken: process.env.ALCHEMY_NOTIFY_AUTH_TOKEN ?? "",
  alchemyWebhookSigningKey: process.env.ALCHEMY_WEBHOOK_SIGNING_KEY ?? "",
  coinGeckoApiKey: process.env.COINGECKO_API_KEY ?? "",
  coinGeckoApiBaseUrl: process.env.COINGECKO_API_BASE_URL ?? "",
  appName: process.env.APP_NAME ?? "FlowDex",
  appDomain: process.env.APP_DOMAIN ?? "flowdex.app",
};

export function assertRequiredEnv(): void {
  const required = [
    "DATABASE_URL",
    "INTERNAL_AUTH_JWT_SECRET",
    "ETH_TREASURY_ADDRESS",
    "SOL_TREASURY_ADDRESS",
    ...(process.env.BTC_PAYMENTS_ENABLED === "true" ? ["BTC_TREASURY_EXTENDED_PUBLIC_KEY"] : []),
    "ALCHEMY_API_KEY",
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (!process.env.ADMIN_EMAILS && !process.env.ADMIN_EMAIL) {
    throw new Error("Missing required environment variable: ADMIN_EMAILS");
  }
}
