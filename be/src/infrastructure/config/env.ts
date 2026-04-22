export const env = {
  port: Number(process.env.PORT ?? 3001),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  databaseUrl: process.env.DATABASE_URL ?? '',
  internalAuthJwtSecret: process.env.INTERNAL_AUTH_JWT_SECRET ?? '',
  internalAuthIssuer: process.env.INTERNAL_AUTH_ISSUER ?? 'fe-bff',
  internalAuthAudience: process.env.INTERNAL_AUTH_AUDIENCE ?? 'be-api',
  treasuryAddressEthSepolia: process.env.TREASURY_ADDRESS_ETH_SEPOLIA ?? '',
  treasuryAddressBaseSepolia: process.env.TREASURY_ADDRESS_BASE_SEPOLIA ?? '',
  alchemyApiKey: process.env.ALCHEMY_API_KEY ?? '',
  alchemyNotifyAuthToken: process.env.ALCHEMY_NOTIFY_AUTH_TOKEN ?? '',
  alchemyWebhookSigningKey: process.env.ALCHEMY_WEBHOOK_SIGNING_KEY ?? '',
};

export function assertRequiredEnv(): void {
  const required = [
    'DATABASE_URL',
    'INTERNAL_AUTH_JWT_SECRET',
    'TREASURY_ADDRESS_ETH_SEPOLIA',
    'TREASURY_ADDRESS_BASE_SEPOLIA',
    'ALCHEMY_API_KEY',
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
