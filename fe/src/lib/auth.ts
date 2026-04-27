import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { Env } from '@/libs/Env';

const globalForAuth = globalThis as typeof globalThis & {
  flowdexAuthPool?: Pool;
};

function createPool() {
  return new Pool({
    connectionString: Env.DATABASE_URL,
    options: '-c search_path=fe_auth',
  });
}

const pool = globalForAuth.flowdexAuthPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForAuth.flowdexAuthPool = pool;
}

function buildTrustedOrigins(baseUrl?: string) {
  if (!baseUrl) {
    return [];
  }

  const origins = new Set<string>([baseUrl]);

  try {
    const parsed = new URL(baseUrl);

    if (process.env.NODE_ENV !== 'production') {
      if (parsed.hostname === '127.0.0.1') {
        origins.add(`${parsed.protocol}//localhost${parsed.port ? `:${parsed.port}` : ''}`);
      }

      if (parsed.hostname === 'localhost') {
        origins.add(`${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ''}`);
      }
    }
  } catch {
    return [baseUrl];
  }

  return Array.from(origins);
}

function parseTrustedOrigins(input?: string) {
  if (!input) {
    return [];
  }

  return input
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

export const auth = betterAuth({
  secret: Env.BETTER_AUTH_SECRET,
  baseURL: Env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [
    ...buildTrustedOrigins(Env.NEXT_PUBLIC_APP_URL),
    ...parseTrustedOrigins(Env.NEXT_PUBLIC_AUTH_TRUSTED_ORIGINS),
  ],
  database: pool,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
});
