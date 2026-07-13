import 'server-only';

import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { API_ROUTES } from '@/api-routes';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth.cookie';
import { Env } from '@/libs/Env';

const SESSION_TTL_MS = 15 * 60 * 1000;

type AdminLoginResult = {
  accessToken: string;
  expiresIn: number;
  user: {
    userId: string;
    email: string;
    role: string;
    status: string;
  };
};

export class AdminLoginError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

function resolveCookieExpiry(expiresInSeconds: number) {
  const ttlMs = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? expiresInSeconds * 1000
    : SESSION_TTL_MS;

  return new Date(Date.now() + ttlMs);
}

function resolveCookieOptions(expiresAt: Date) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

function isTokenExpired(token: string): boolean {
  try {
    const claims = decodeJwt(token);
    if (typeof claims.exp !== 'number') {
      return false;
    }
    return claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function loginAdminWithBackend(input: {
  email: string;
  password: string;
}): Promise<AdminLoginResult> {
  const backendBaseUrl = Env.NEXT_PUBLIC_API_URL?.trim();
  if (!backendBaseUrl) {
    throw new AdminLoginError('NEXT_PUBLIC_API_URL is not configured', 500, 'MISCONFIGURED');
  }

  let response: Response;
  try {
    response = await fetch(`${backendBaseUrl}${API_ROUTES.backend.auth.login}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    });
  } catch {
    throw new AdminLoginError(
      'We could not reach the application backend. Try again in a moment.',
      503,
      'NETWORK_ERROR',
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const code = extractCode(payload) ?? 'INVALID_CREDENTIALS';
    const message = response.status === 401
      ? 'Invalid email or password'
      : extractMessage(payload) ?? 'We could not sign you in.';
    throw new AdminLoginError(message, response.status, code);
  }

  return payload as AdminLoginResult;
}

export function attachAdminSessionCookie(response: NextResponse, result: AdminLoginResult) {
  response.cookies.set({
    ...resolveCookieOptions(resolveCookieExpiry(result.expiresIn)),
    value: result.accessToken,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...resolveCookieOptions(new Date(0)),
    value: '',
  });
}

export async function getAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || isTokenExpired(token)) {
    return null;
  }
  return token;
}

export function getAdminSessionTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || isTokenExpired(token)) {
    return null;
  }
  return token;
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const raw = 'message' in payload ? (payload as { message?: unknown }).message : undefined;
  if (Array.isArray(raw)) {
    const joined = raw.map(item => String(item)).join(', ').trim();
    return joined || null;
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return null;
}

function extractCode(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if ('code' in payload && typeof (payload as { code?: unknown }).code === 'string') {
    return (payload as { code: string }).code;
  }
  return null;
}
