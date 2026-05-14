import 'server-only';

import { randomBytes, randomUUID } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getAddress, isAddress, recoverMessageAddress } from 'viem';
import { Env } from '@/libs/Env';

const COOKIE_NAME = 'flowdex_wallet_session';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type WalletAuthChallengeRecord = {
  id: string;
  wallet_address_normalized: string;
  wallet_address_checksum: string;
  chain_id: number;
  domain: string;
  uri: string;
  nonce: string;
  statement: string;
  message: string;
  issued_at: Date;
  expires_at: Date;
  used_at: Date | null;
};

type WalletAuthSessionRecord = {
  id: string;
  wallet_address_normalized: string;
  wallet_address_checksum: string;
  last_verified_chain_id: number | null;
  invalidated_at: Date | null;
  expires_at: Date;
};

export type WalletSession = {
  sessionId: string;
  walletAddressNormalized: string;
  walletAddressChecksum: string;
  lastVerifiedChainId: number | null;
  expiresAt: string;
};

export type WalletChallengePayload = {
  challengeId: string;
  domain: string;
  uri: string;
  walletAddressNormalized: string;
  walletAddressChecksum: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  statement: string;
  message: string;
};

const globalForWalletAuth = globalThis as typeof globalThis & {
  flowdexWalletAuthPool?: Pool;
  flowdexWalletAuthEnsurePromise?: Promise<void>;
};

function createPool() {
  return new Pool({
    connectionString: Env.DATABASE_URL,
    options: '-c search_path=fe_auth',
  });
}

const pool = globalForWalletAuth.flowdexWalletAuthPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForWalletAuth.flowdexWalletAuthPool = pool;
}

async function ensureWalletAuthTables() {
  if (!globalForWalletAuth.flowdexWalletAuthEnsurePromise) {
    globalForWalletAuth.flowdexWalletAuthEnsurePromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS wallet_auth_challenges (
            id uuid PRIMARY KEY,
            wallet_address_normalized varchar(64) NOT NULL,
            wallet_address_checksum varchar(64) NOT NULL,
            chain_id int NOT NULL,
            domain varchar(255) NOT NULL,
            uri text NOT NULL,
            nonce varchar(128) NOT NULL,
            statement text NOT NULL,
            message text NOT NULL,
            issued_at timestamptz NOT NULL,
            expires_at timestamptz NOT NULL,
            used_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_wallet_auth_challenges_wallet_created
          ON wallet_auth_challenges (wallet_address_normalized, created_at)
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS wallet_auth_sessions (
            id uuid PRIMARY KEY,
            wallet_address_normalized varchar(64) NOT NULL,
            wallet_address_checksum varchar(64) NOT NULL,
            last_verified_chain_id int,
            invalidated_at timestamptz,
            expires_at timestamptz NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_wallet_auth_sessions_wallet
          ON wallet_auth_sessions (wallet_address_normalized, created_at)
        `);
      } catch (error) {
        globalForWalletAuth.flowdexWalletAuthEnsurePromise = undefined;
        throw error;
      }
    })();
  }

  await globalForWalletAuth.flowdexWalletAuthEnsurePromise;
}

function normalizeWalletAddress(address: string) {
  if (!isAddress(address)) {
    throw new Error('Invalid EVM wallet address');
  }

  return {
    normalized: address.trim().toLowerCase(),
    checksum: getAddress(address),
  };
}

function resolveAllowedOrigins(baseUrl?: string) {
  const values = new Set<string>();

  if (baseUrl) {
    values.add(baseUrl);
  }

  for (const raw of (Env.NEXT_PUBLIC_AUTH_TRUSTED_ORIGINS ?? '').split(',')) {
    const origin = raw.trim();
    if (origin) {
      values.add(origin);
    }
  }

  return values;
}

function assertTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) {
    throw new Error('Missing Origin header');
  }

  const allowed = resolveAllowedOrigins(Env.NEXT_PUBLIC_APP_URL);
  if (!allowed.has(origin)) {
    throw new Error('Origin is not allowed');
  }

  return origin;
}

function buildChallengeMessage(input: {
  domain: string;
  uri: string;
  walletAddressChecksum: string;
  chainId: number;
  nonce: string;
  issuedAt: Date;
  expiresAt: Date;
  statement: string;
}) {
  return [
    `${input.domain} wants you to sign in with your wallet.`,
    '',
    input.statement,
    '',
    `URI: ${input.uri}`,
    `Domain: ${input.domain}`,
    `Wallet Address: ${input.walletAddressChecksum}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt.toISOString()}`,
    `Expires At: ${input.expiresAt.toISOString()}`,
  ].join('\n');
}

function resolveCookieOptions(expiresAt: Date) {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

export async function createWalletChallenge(input: {
  request: NextRequest;
  walletAddress: string;
  chainId: number;
}): Promise<WalletChallengePayload> {
  await ensureWalletAuthTables();
  const origin = assertTrustedOrigin(input.request);
  const wallet = normalizeWalletAddress(input.walletAddress);
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);
  const domain = new URL(origin).host;
  const uri = origin;
  const nonce = randomBytes(16).toString('hex');
  const statement = 'Sign this message to authenticate with FlowDex. No blockchain transaction or gas fee is required.';
  const message = buildChallengeMessage({
    domain,
    uri,
    walletAddressChecksum: wallet.checksum,
    chainId: input.chainId,
    nonce,
    issuedAt,
    expiresAt,
    statement,
  });
  const challengeId = randomUUID();

  await pool.query(
    `
      INSERT INTO wallet_auth_challenges (
        id,
        wallet_address_normalized,
        wallet_address_checksum,
        chain_id,
        domain,
        uri,
        nonce,
        statement,
        message,
        issued_at,
        expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `,
    [
      challengeId,
      wallet.normalized,
      wallet.checksum,
      input.chainId,
      domain,
      uri,
      nonce,
      statement,
      message,
      issuedAt.toISOString(),
      expiresAt.toISOString(),
    ],
  );

  return {
    challengeId,
    domain,
    uri,
    walletAddressNormalized: wallet.normalized,
    walletAddressChecksum: wallet.checksum,
    chainId: input.chainId,
    nonce,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    statement,
    message,
  };
}

export async function verifyWalletChallenge(input: {
  request: NextRequest;
  challengeId: string;
  walletAddress: string;
  chainId: number;
  signature: `0x${string}`;
}): Promise<WalletSession> {
  await ensureWalletAuthTables();
  assertTrustedOrigin(input.request);
  const wallet = normalizeWalletAddress(input.walletAddress);
  const challengeResult = await pool.query<WalletAuthChallengeRecord>(
    `
      SELECT *
      FROM wallet_auth_challenges
      WHERE id = $1
        AND wallet_address_normalized = $2
        AND chain_id = $3
      LIMIT 1
    `,
    [input.challengeId, wallet.normalized, input.chainId],
  );
  const challenge = challengeResult.rows[0];

  if (!challenge) {
    throw new Error('Wallet challenge not found');
  }
  if (challenge.used_at) {
    throw new Error('Wallet challenge already used');
  }
  if (challenge.expires_at.getTime() <= Date.now()) {
    throw new Error('Wallet challenge expired');
  }

  const recoveredAddress = await recoverMessageAddress({
    message: challenge.message,
    signature: input.signature,
  });

  if (recoveredAddress.toLowerCase() !== wallet.normalized) {
    throw new Error('Wallet signature does not match the requested address');
  }

  await pool.query(
    'UPDATE wallet_auth_challenges SET used_at = now() WHERE id = $1',
    [challenge.id],
  );

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await pool.query(
    `
      INSERT INTO wallet_auth_sessions (
        id,
        wallet_address_normalized,
        wallet_address_checksum,
        last_verified_chain_id,
        expires_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,now())
    `,
    [sessionId, wallet.normalized, wallet.checksum, input.chainId, expiresAt.toISOString()],
  );

  return {
    sessionId,
    walletAddressNormalized: wallet.normalized,
    walletAddressChecksum: wallet.checksum,
    lastVerifiedChainId: input.chainId,
    expiresAt: expiresAt.toISOString(),
  };
}

async function readWalletSessionById(sessionId: string | null | undefined): Promise<WalletSession | null> {
  if (!sessionId) {
    return null;
  }

  await ensureWalletAuthTables();

  const result = await pool.query<WalletAuthSessionRecord>(
    `
      SELECT *
      FROM wallet_auth_sessions
      WHERE id = $1
        AND invalidated_at IS NULL
        AND expires_at > now()
      LIMIT 1
    `,
    [sessionId],
  );
  const session = result.rows[0];
  if (!session) {
    return null;
  }

  return {
    sessionId: session.id,
    walletAddressNormalized: session.wallet_address_normalized,
    walletAddressChecksum: session.wallet_address_checksum,
    lastVerifiedChainId: session.last_verified_chain_id,
    expiresAt: session.expires_at.toISOString(),
  };
}

export async function getOptionalWalletSession() {
  const cookieStore = await cookies();
  return readWalletSessionById(cookieStore.get(COOKIE_NAME)?.value);
}

export async function getOptionalWalletSessionFromRequest(request: NextRequest) {
  return readWalletSessionById(request.cookies.get(COOKIE_NAME)?.value);
}

export async function getRequiredWalletSession() {
  const session = await getOptionalWalletSession();
  if (!session) {
    throw new Error('Wallet session required');
  }
  return session;
}

export async function clearWalletSession(sessionId: string | null | undefined) {
  if (!sessionId) {
    return;
  }

  await ensureWalletAuthTables();
  await pool.query(
    `
      UPDATE wallet_auth_sessions
      SET invalidated_at = now(), updated_at = now()
      WHERE id = $1
    `,
    [sessionId],
  );
}

export function attachWalletSessionCookie(response: NextResponse, session: WalletSession) {
  const expiresAt = new Date(session.expiresAt);
  response.cookies.set({
    ...resolveCookieOptions(expiresAt),
    value: session.sessionId,
  });
}

export function clearWalletSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...resolveCookieOptions(new Date(0)),
    value: '',
  });
}

export async function logoutWalletSessionFromRequest(request: NextRequest) {
  assertTrustedOrigin(request);
  const sessionId = request.cookies.get(COOKIE_NAME)?.value;
  await clearWalletSession(sessionId);
}

export async function getWalletSessionForServerRender() {
  const session = await getOptionalWalletSession();
  return session;
}

export async function getRequestOrigin() {
  const headersStore = await headers();
  return headersStore.get('origin') ?? Env.NEXT_PUBLIC_APP_URL ?? '';
}
