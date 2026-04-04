export const env = {
  port: Number(process.env.PORT ?? 3001),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  ethRpcUrl: process.env.ETH_RPC_URL ?? 'https://cloudflare-eth.com',
  tronFullHost: process.env.TRON_FULL_HOST ?? 'https://api.trongrid.io',
  assetPriceMaxAgeSeconds: Number(process.env.ASSET_PRICE_MAX_AGE_SECONDS ?? 300),
  internalAuthJwtSecret: process.env.INTERNAL_AUTH_JWT_SECRET ?? '',
  internalAuthIssuer: process.env.INTERNAL_AUTH_ISSUER ?? 'fe-bff',
  internalAuthAudience: process.env.INTERNAL_AUTH_AUDIENCE ?? 'be-api',
  presaleDisplayMultiplier: Number(process.env.PRESALE_DISPLAY_MULTIPLIER ?? 10),
};

export function assertRequiredEnv(): void {
  const required = ['DATABASE_URL', 'REDIS_URL', 'INTERNAL_AUTH_JWT_SECRET'] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
