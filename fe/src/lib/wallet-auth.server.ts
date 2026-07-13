import 'server-only';

import { randomBytes, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { getAddress, isAddress, recoverMessageAddress } from 'viem';
import { Env } from '@/libs/Env';

const COOKIE_NAME = 'flowdex_wallet_session';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type WalletAuthChallengeRecord = {
  id: string;
  wallet_chain: WalletChain;
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
  wallet_chain: WalletChain;
  wallet_address_normalized: string;
  wallet_address_checksum: string;
  last_verified_chain_id: number | null;
  invalidated_at: Date | null;
  expires_at: Date;
};

export type WalletSession = {
  sessionId: string;
  walletChain: WalletChain;
  walletAddressNormalized: string;
  walletAddressChecksum: string;
  lastVerifiedChainId: number | null;
  expiresAt: string;
};

type WalletChallengePayload = {
  challengeId: string;
  walletChain: WalletChain;
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

export type WalletChain = 'ETHEREUM' | 'SOLANA' | 'TRON';

const TRON_MAINNET_CHAIN_ID_DECIMAL = Number.parseInt('0x2b6653dc', 16);

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
        await pool.query('CREATE SCHEMA IF NOT EXISTS fe_auth');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS wallet_auth_challenges (
            id uuid PRIMARY KEY,
            wallet_chain varchar(16) NOT NULL DEFAULT 'ETHEREUM',
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
            wallet_chain varchar(16) NOT NULL DEFAULT 'ETHEREUM',
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
        await pool.query('ALTER TABLE wallet_auth_challenges ADD COLUMN IF NOT EXISTS wallet_chain varchar(16) NOT NULL DEFAULT \'ETHEREUM\'');
        await pool.query('ALTER TABLE wallet_auth_sessions ADD COLUMN IF NOT EXISTS wallet_chain varchar(16) NOT NULL DEFAULT \'ETHEREUM\'');
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

function normalizeSolanaAddress(address: string) {
  const trimmed = address.trim();
  try {
    const decoded = bs58.decode(trimmed);
    if (decoded.length !== 32) {
      throw new Error('Invalid Solana public key length');
    }
    return {
      normalized: trimmed,
      checksum: trimmed,
    };
  } catch {
    throw new Error('Invalid Solana wallet address');
  }
}

async function getTronWeb() {
  const { TronWeb } = await import('tronweb');
  return new TronWeb({ fullHost: 'https://api.trongrid.io' });
}

async function normalizeTronAddress(address: string) {
  const TronWeb = (await import('tronweb')).TronWeb;
  const trimmed = address.trim();
  if (!trimmed || !TronWeb.isAddress(trimmed)) {
    throw new Error('Invalid TRON wallet address');
  }

  const normalized = TronWeb.address.fromHex(TronWeb.address.toHex(trimmed));
  return {
    normalized,
    checksum: normalized,
  };
}

function normalizeWalletForChain(chain: WalletChain, address: string) {
  if (chain === 'SOLANA') {
    return normalizeSolanaAddress(address);
  }

  if (chain === 'TRON') {
    return normalizeTronAddress(address);
  }

  return normalizeWalletAddress(address);
}

function resolveChallengeChainId(walletChain: WalletChain, chainId?: number) {
  if (walletChain === 'SOLANA') {
    return 0;
  }

  if (walletChain === 'TRON') {
    return chainId ?? TRON_MAINNET_CHAIN_ID_DECIMAL;
  }

  if (typeof chainId !== 'number') {
    throw new Error('chainId is required for EVM wallet verification');
  }

  return chainId;
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
  walletChain: WalletChain;
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
    `Wallet Chain: ${input.walletChain}`,
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
  chainId?: number;
  walletChain?: WalletChain;
}): Promise<WalletChallengePayload> {
  await ensureWalletAuthTables();
  const origin = assertTrustedOrigin(input.request);
  const walletChain = input.walletChain ?? 'ETHEREUM';
  const chainId = resolveChallengeChainId(walletChain, input.chainId);
  const wallet = await normalizeWalletForChain(walletChain, input.walletAddress);
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
    walletChain,
    chainId,
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
        wallet_chain,
        chain_id,
        domain,
        uri,
        nonce,
        statement,
        message,
        issued_at,
        expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `,
    [
      challengeId,
      wallet.normalized,
      wallet.checksum,
      walletChain,
      chainId,
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
    walletChain,
    domain,
    uri,
    walletAddressNormalized: wallet.normalized,
    walletAddressChecksum: wallet.checksum,
    chainId,
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
  chainId?: number;
  walletChain?: WalletChain;
  signature: string;
}): Promise<WalletSession> {
  await ensureWalletAuthTables();
  assertTrustedOrigin(input.request);
  const walletChain = input.walletChain ?? 'ETHEREUM';
  const chainId = resolveChallengeChainId(walletChain, input.chainId);
  const wallet = await normalizeWalletForChain(walletChain, input.walletAddress);
  const challengeResult = await pool.query<WalletAuthChallengeRecord>(
    `
      SELECT *
      FROM wallet_auth_challenges
      WHERE id = $1
        AND wallet_address_normalized = $2
        AND wallet_chain = $3
        AND chain_id = $4
      LIMIT 1
    `,
    [input.challengeId, wallet.normalized, walletChain, chainId],
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

  if (walletChain === 'SOLANA') {
    const signature = bs58.decode(input.signature);
    const publicKey = bs58.decode(wallet.normalized);
    const message = new TextEncoder().encode(challenge.message);
    if (!nacl.sign.detached.verify(message, signature, publicKey)) {
      throw new Error('Wallet signature does not match the requested address');
    }
  } else if (walletChain === 'TRON') {
    const tronWeb = await getTronWeb();
    const hexMessage = Buffer.from(challenge.message, 'utf8').toString('hex');
    const recoveredAddress = await tronWeb.trx.verifyMessageV2(hexMessage, input.signature);
    if (recoveredAddress !== wallet.checksum) {
      throw new Error('Wallet signature does not match the requested address');
    }
  } else {
    const recoveredAddress = await recoverMessageAddress({
      message: challenge.message,
      signature: input.signature as `0x${string}`,
    });

    if (recoveredAddress.toLowerCase() !== wallet.normalized) {
      throw new Error('Wallet signature does not match the requested address');
    }
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
        wallet_chain,
        last_verified_chain_id,
        expires_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,now())
    `,
    [sessionId, wallet.normalized, wallet.checksum, walletChain, walletChain === 'SOLANA' ? null : chainId, expiresAt.toISOString()],
  );

  return {
    sessionId,
    walletChain,
    walletAddressNormalized: wallet.normalized,
    walletAddressChecksum: wallet.checksum,
    lastVerifiedChainId: walletChain === 'SOLANA' ? null : chainId,
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
    walletChain: session.wallet_chain,
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
