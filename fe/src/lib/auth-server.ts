import 'server-only';

import type { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_ROUTES } from '@/api-routes';
import { APP_USER_ROLES, type AppUserRole, type IAuthMe } from '@/dal/app/auth/auth.types';
import { auth } from '@/lib/auth';
import { AUTH_PAGE_ERROR_CODES } from '@/lib/auth-page';
import { Env } from '@/libs/Env';
import { getOptionalWalletSessionFromRequest, type WalletSession } from '@/lib/wallet-auth.server';
import { ROUTES, AUTH_TOASTS, getPublicAuthToastRoute } from '@/routes';

export type BetterAuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export class BackendApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
  }
}

export function resolveUserRole(email: string): AppUserRole {
  const adminEmails = (Env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase())
    ? APP_USER_ROLES.ADMIN
    : APP_USER_ROLES.USER;
}

export async function getOptionalSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getSessionFromRequest(request: NextRequest) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export async function requireSession() {
  const session = await getOptionalSession();

  if (!session) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  return session;
}

export async function getBackendAccessToken(session: BetterAuthSession) {
  return mintBackendAccessToken(session);
}

async function mintBackendAccessToken(session: BetterAuthSession) {
  const secret = new TextEncoder().encode(Env.INTERNAL_AUTH_JWT_SECRET);
  const role = resolveUserRole(session.user.email);

  return new SignJWT({
    authType: 'admin',
    email: session.user.email,
    role,
    sessionId: session.session.id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(Env.INTERNAL_AUTH_ISSUER)
    .setAudience(Env.INTERNAL_AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setSubject(session.user.id)
    .sign(secret);
}

async function mintWalletBackendAccessToken(session: WalletSession) {
  const secret = new TextEncoder().encode(Env.INTERNAL_AUTH_JWT_SECRET);

  return new SignJWT({
    authType: 'wallet',
    sessionId: session.sessionId,
    walletAddressNormalized: session.walletAddressNormalized,
    walletAddressChecksum: session.walletAddressChecksum,
    lastVerifiedChainId: session.lastVerifiedChainId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(Env.INTERNAL_AUTH_ISSUER)
    .setAudience(Env.INTERNAL_AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setSubject(session.walletAddressNormalized)
    .sign(secret);
}

export async function backendFetchJson<T>(
  path: string,
  init: Omit<RequestInit, 'headers' | 'body'> & {
    body?: unknown;
    session?: BetterAuthSession;
  } = {},
): Promise<T> {
  return fetchBackendJsonWithRetry<T>(path, init);
}

export async function getAuthenticatedAppContext() {
  const session = await requireSession();

  try {
    const profile = await fetchBackendJsonWithRetry<IAuthMe>(API_ROUTES.backend.auth.me, { session });

    return {
      session,
      profile,
    };
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      redirect(ROUTES.AUTH.LOGIN);
    }
    if (error instanceof BackendApiError && error.status === 403) {
      const errorCode = extractErrorCode(error.payload);

      if (errorCode === 'USER_ACCOUNT_INACTIVE') {
        redirect(`${ROUTES.AUTH.LOGIN}?auth_error=${AUTH_PAGE_ERROR_CODES.ACCOUNT_INACTIVE}`);
      }

      if (errorCode === 'USER_PROFILE_NOT_FOUND') {
        redirect(`${ROUTES.AUTH.LOGIN}?auth_error=${AUTH_PAGE_ERROR_CODES.ACCOUNT_SETUP_FAILED}`);
      }
    }
    if (isBackendNetworkError(error)) {
      redirectToPublicWithToast(session);
    }

    throw error;
  }
}

export async function requireAdminAppContext() {
  const context = await getAuthenticatedAppContext();

  if (context.profile.role !== APP_USER_ROLES.ADMIN) {
    redirect(ROUTES.USER.BUY);
  }

  return context;
}

export async function proxyBackendRequest(
  request: NextRequest,
  pathSegments: string[],
) {
  const backendBaseUrl = Env.NEXT_PUBLIC_API_URL?.trim();
  if (!backendBaseUrl) {
    return Response.json({ message: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });
  }

  const topLevel = pathSegments[0];

  if (topLevel === 'transactions') {
    const walletSession = await getOptionalWalletSessionFromRequest(request);

    if (!walletSession) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await mintWalletBackendAccessToken(walletSession);
    return proxyBackendRequestWithAccessToken(request, pathSegments, accessToken, backendBaseUrl);
  }

  if (topLevel !== 'admin' && topLevel !== 'auth') {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return proxyBackendRequestWithRetry(request, pathSegments, session, false, backendBaseUrl);
}

export async function proxyPublicBackendRequest(
  request: NextRequest,
  pathSegments: string[],
) {
  const backendBaseUrl = Env.NEXT_PUBLIC_API_URL?.trim();
  if (!backendBaseUrl) {
    return Response.json({ message: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });
  }

  const upstreamUrl = `${backendBaseUrl}/${pathSegments.join('/')}${request.nextUrl.search}`;
  const bodyText = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.text();
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    cache: 'no-store',
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
    },
    body: bodyText && bodyText.length > 0 ? bodyText : undefined,
  });
  const responseText = await upstreamResponse.text();

  return new Response(responseText, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
    },
  });
}

async function fetchBackendJsonWithRetry<T>(
  path: string,
  init: Omit<RequestInit, 'headers' | 'body'> & {
    body?: unknown;
    session?: BetterAuthSession;
  } = {},
  retried = false,
): Promise<T> {
  const session = init.session ?? await requireSession();
  const response = await fetchWithBackendToken(path, init, session);
  const payload = await parseResponsePayload(response);

  if (response.status === 401 && !retried) {
    const refreshedSession = await getOptionalSession();

    if (!refreshedSession) {
      redirect(ROUTES.AUTH.LOGIN);
    }

    return fetchBackendJsonWithRetry<T>(path, {
      ...init,
      session: refreshedSession,
    }, true);
  }

  if (!response.ok) {
    if (response.status === 401) {
      redirect(ROUTES.AUTH.LOGIN);
    }

    const message = extractErrorMessage(payload) ?? `Backend request failed with status ${response.status}`;
    throw new BackendApiError(message, response.status, payload);
  }

  return payload as T;
}

async function fetchWithBackendToken(
  path: string,
  init: Omit<RequestInit, 'headers' | 'body'> & {
    body?: unknown;
  },
  session: BetterAuthSession,
) {
  const backendBaseUrl = Env.NEXT_PUBLIC_API_URL?.trim();
  if (!backendBaseUrl) {
    throw new BackendApiError('NEXT_PUBLIC_API_URL is not configured', 500, null);
  }

  const accessToken = await mintBackendAccessToken(session);

  return fetch(`${backendBaseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

async function proxyBackendRequestWithAccessToken(
  request: NextRequest,
  pathSegments: string[],
  accessToken: string,
  backendBaseUrl?: string,
) {
  const baseUrl = backendBaseUrl ?? Env.NEXT_PUBLIC_API_URL?.trim();
  if (!baseUrl) {
    return Response.json({ message: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });
  }

  const upstreamUrl = `${baseUrl}/${pathSegments.join('/')}${request.nextUrl.search}`;
  const bodyText = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.text();

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    cache: 'no-store',
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: bodyText && bodyText.length > 0 ? bodyText : undefined,
  });

  const responseText = await upstreamResponse.text();

  return new Response(responseText, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
    },
  });
}

async function proxyBackendRequestWithRetry(
  request: NextRequest,
  pathSegments: string[],
  session: BetterAuthSession,
  retried = false,
  backendBaseUrl?: string,
) {
  const baseUrl = backendBaseUrl ?? Env.NEXT_PUBLIC_API_URL?.trim();
  if (!baseUrl) {
    return Response.json({ message: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });
  }

  const upstreamUrl = `${baseUrl}/${pathSegments.join('/')}${request.nextUrl.search}`;
  const bodyText = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.text();
  const accessToken = await mintBackendAccessToken(session);

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    cache: 'no-store',
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: bodyText && bodyText.length > 0 ? bodyText : undefined,
  });

  if (upstreamResponse.status === 401 && !retried) {
    const refreshedSession = await getSessionFromRequest(request);

    if (!refreshedSession) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return proxyBackendRequestWithRetry(request, pathSegments, refreshedSession, true, baseUrl);
  }

  const responseText = await upstreamResponse.text();

  return new Response(responseText, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
    },
  });
}

async function parseResponsePayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return null;
}

function extractErrorCode(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('code' in payload && typeof payload.code === 'string') {
    return payload.code;
  }

  return null;
}

function isBackendNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error instanceof BackendApiError) {
    return false;
  }

  if (error.message.toLowerCase().includes('fetch failed')) {
    return true;
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause && typeof cause === 'object') {
    const code = 'code' in cause ? String((cause as { code?: unknown }).code) : '';
    return code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT';
  }

  return false;
}

function redirectToPublicWithToast(session: BetterAuthSession): never {
  redirect(getPublicAuthToastRoute({
    toast: AUTH_TOASTS.BACKEND_UNREACHABLE,
    userEmail: session.user.email,
    userName: session.user.name,
    userRole: resolveUserRole(session.user.email),
  }));
}
