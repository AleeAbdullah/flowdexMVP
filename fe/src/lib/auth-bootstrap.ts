'use client';

import { API_ROUTES } from '@/api-routes';

type AuthBootstrapErrorCode =
  | 'USER_ACCOUNT_INACTIVE'
  | 'USER_PROFILE_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class AuthBootstrapError extends Error {
  constructor(
    message: string,
    public readonly code: AuthBootstrapErrorCode,
    public readonly status: number,
  ) {
    super(message);
  }
}

type AuthMePayload = {
  userId: string;
  email: string;
  role: string;
  status: string;
};

function resolveBootstrapErrorCode(payload: unknown, status: number): AuthBootstrapErrorCode {
  if (status === 401) {
    return 'UNAUTHORIZED';
  }

  if (!payload || typeof payload !== 'object') {
    return 'UNKNOWN';
  }

  const code = 'code' in payload ? String((payload as { code?: unknown }).code ?? '') : '';
  if (code === 'USER_ACCOUNT_INACTIVE' || code === 'USER_PROFILE_NOT_FOUND') {
    return code;
  }

  return 'UNKNOWN';
}

function resolveBootstrapErrorMessage(payload: unknown, status: number): string {
  const fallback = status === 401
    ? 'Your session is no longer valid. Sign in again.'
    : 'We could not finish preparing your account.';

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const raw = 'message' in payload ? (payload as { message?: unknown }).message : undefined;
  if (Array.isArray(raw)) {
    const joined = raw.map(item => String(item)).join(', ').trim();
    return joined || fallback;
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }

  return fallback;
}

export async function bootstrapAppSession() {
  let response: Response;

  try {
    response = await fetch(API_ROUTES.bff.auth.me, {
      // Keep bootstrap close to the auth endpoint without a DAL wrapper.
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new AuthBootstrapError(
      'We could not reach the application backend. Try again in a moment.',
      'NETWORK_ERROR',
      0,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new AuthBootstrapError(
      resolveBootstrapErrorMessage(payload, response.status),
      resolveBootstrapErrorCode(payload, response.status),
      response.status,
    );
  }

  return payload as AuthMePayload;
}
