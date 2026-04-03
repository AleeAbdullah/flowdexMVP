import process from 'node:process';
import nextEnv from '@next/env';
import pg from 'pg';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = new pg.Client({ connectionString });

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS fe_auth."user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

await client.query(`
  CREATE TABLE IF NOT EXISTS fe_auth.session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES fe_auth."user"(id) ON DELETE CASCADE
  );
`);

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_fe_auth_session_user_id
  ON fe_auth.session ("userId");
`);

await client.query(`
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
  );
`);

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_fe_auth_account_user_id
  ON fe_auth.account ("userId");
`);

await client.query(`
  CREATE TABLE IF NOT EXISTS fe_auth.verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_fe_auth_verification_identifier
  ON fe_auth.verification (identifier);
`);

await client.end();
