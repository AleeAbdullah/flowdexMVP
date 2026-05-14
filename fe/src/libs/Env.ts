import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

const isStaticExportBuild = process.env.STATIC_EXPORT === 'true'
  || process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

const STATIC_DEFAULTS = {
  DATABASE_URL: 'https://example.com/static-build-db',
  BETTER_AUTH_SECRET: 'static-build-better-auth-secret',
  INTERNAL_AUTH_JWT_SECRET: 'static-jwt-secret',
  INTERNAL_AUTH_ISSUER: 'static-fe-bff',
  INTERNAL_AUTH_AUDIENCE: 'static-be-api',
} as const;

export const Env = createEnv({
  server: {
    ARCJET_KEY: z.string().startsWith('ajkey_').optional(),
    DATABASE_URL: isStaticExportBuild
      ? z.string().url().default(STATIC_DEFAULTS.DATABASE_URL)
      : z.string().url(),
    BETTER_AUTH_SECRET: isStaticExportBuild
      ? z.string().min(16).default(STATIC_DEFAULTS.BETTER_AUTH_SECRET)
      : z.string().min(16),
    INTERNAL_AUTH_JWT_SECRET: isStaticExportBuild
      ? z.string().min(8).default(STATIC_DEFAULTS.INTERNAL_AUTH_JWT_SECRET)
      : z.string().min(8),
    INTERNAL_AUTH_ISSUER: z.string().default('fe-bff'),
    INTERNAL_AUTH_AUDIENCE: z.string().default('be-api'),
    ADMIN_EMAILS: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_AUTH_TRUSTED_ORIGINS: z.string().optional(),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_TREASURY_ADDRESS_ETH_SEPOLIA: z.string().optional(),
    NEXT_PUBLIC_TREASURY_ADDRESS_BASE_SEPOLIA: z.string().optional(),
    NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().optional(),
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: z.string().optional(),
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    ARCJET_KEY: process.env.ARCJET_KEY,
    DATABASE_URL: process.env.DATABASE_URL
      ?? (isStaticExportBuild ? STATIC_DEFAULTS.DATABASE_URL : undefined),
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET
      ?? (isStaticExportBuild ? STATIC_DEFAULTS.BETTER_AUTH_SECRET : undefined),
    INTERNAL_AUTH_JWT_SECRET: process.env.INTERNAL_AUTH_JWT_SECRET
      ?? (isStaticExportBuild ? STATIC_DEFAULTS.INTERNAL_AUTH_JWT_SECRET : undefined),
    INTERNAL_AUTH_ISSUER: process.env.INTERNAL_AUTH_ISSUER
      ?? (isStaticExportBuild ? STATIC_DEFAULTS.INTERNAL_AUTH_ISSUER : undefined),
    INTERNAL_AUTH_AUDIENCE: process.env.INTERNAL_AUTH_AUDIENCE
      ?? (isStaticExportBuild ? STATIC_DEFAULTS.INTERNAL_AUTH_AUDIENCE : undefined),
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AUTH_TRUSTED_ORIGINS: process.env.NEXT_PUBLIC_AUTH_TRUSTED_ORIGINS,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_TREASURY_ADDRESS_ETH_SEPOLIA: process.env.NEXT_PUBLIC_TREASURY_ADDRESS_ETH_SEPOLIA,
    NEXT_PUBLIC_TREASURY_ADDRESS_BASE_SEPOLIA: process.env.NEXT_PUBLIC_TREASURY_ADDRESS_BASE_SEPOLIA,
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN,
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NODE_ENV: process.env.NODE_ENV,
  },
});
