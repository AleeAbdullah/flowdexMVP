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

export const auth = betterAuth({
  secret: Env.BETTER_AUTH_SECRET,
  baseURL: Env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: Env.NEXT_PUBLIC_APP_URL ? [Env.NEXT_PUBLIC_APP_URL] : [],
  database: pool,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
});
