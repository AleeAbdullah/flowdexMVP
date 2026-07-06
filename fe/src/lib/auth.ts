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
let authDatabaseReady: Promise<void> | null = null;

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

export function ensureAuthDatabase() {
  authDatabaseReady ??= (async () => {
    await pool.query('CREATE SCHEMA IF NOT EXISTS fe_auth');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fe_auth."user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        image TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fe_auth.session (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES fe_auth."user"(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fe_auth_session_user_id
      ON fe_auth.session ("userId")
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fe_auth.account (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES fe_auth."user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMPTZ,
        "refreshTokenExpiresAt" TIMESTAMPTZ,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fe_auth_account_provider_account_unique UNIQUE ("providerId", "accountId")
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fe_auth_account_user_id
      ON fe_auth.account ("userId")
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fe_auth.verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fe_auth_verification_identifier
      ON fe_auth.verification (identifier)
    `);
  })();

  return authDatabaseReady;
}
