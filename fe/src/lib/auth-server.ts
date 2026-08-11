import 'server-only';

import type { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { redirect } from 'next/navigation';
import { API_ROUTES } from '@/api-routes';
import { APP_USER_ROLES, type IAuthMe } from '@/dal/app/auth/auth.types';
import {
  getAdminSessionToken,
  getAdminSessionTokenFromRequest,
} from '@/lib/admin-auth.server';
import { AUTH_PAGE_ERROR_CODES } from '@/lib/auth-page';
import { Env } from '@/libs/Env';
import { getOptionalWalletSessionFromRequest, type WalletSession } from '@/lib/wallet-auth.server';
import { ROUTES } from '@/routes';

class BackendApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
  }
}

export async function getOptionalAdminToken() {
  return getAdminSessionToken();
}

async function requireAdminToken() {
  const token = await getAdminSessionToken();

  if (!token) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  return token;
}

async function mintWalletBackendAccessToken(session: WalletSession) {
  const secret = new TextEncoder().encode(Env.INTERNAL_AUTH_JWT_SECRET);

  return new SignJWT({
    authType: 'wallet',
    sessionId: session.sessionId,
    walletChain: session.walletChain,
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
    token?: string;
  } = {},
): Promise<T> {
  const token = init.token ?? await requireAdminToken();
  const response = await fetchWithAdminToken(path, init, token);
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (response.status === 401) {
      redirect(ROUTES.AUTH.LOGIN);
    }

    const message = extractErrorMessage(payload) ?? `Backend request failed with status ${response.status}`;
    throw new BackendApiError(message, response.status, payload);
  }

  return payload as T;
}

async function getAuthenticatedAppContext() {
  const token = await requireAdminToken();

  try {
    const profile = await backendFetchJson<IAuthMe>(API_ROUTES.backend.auth.me, { token });

    return {
      token,
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

  if (topLevel === 'transactions' || topLevel === 'payments') {
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

  const adminToken = getAdminSessionTokenFromRequest(request);
  if (!adminToken) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return proxyBackendRequestWithAccessToken(request, pathSegments, adminToken, backendBaseUrl);
}

export async function proxyPublicBackendRequest(
  request: NextRequest,
  pathSegments: string[],
) {
  const backendBaseUrl = Env.NEXT_PUBLIC_API_URL?.trim();
  if (!backendBaseUrl) {
    return Response.json({ message: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });
  }

  try {
    const upstreamUrl = `${backendBaseUrl}/${pathSegments.join('/')}${request.nextUrl.search}`;
    const body = request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      cache: 'no-store',
      headers: {
        'Content-Type': request.headers.get('content-type') ?? 'application/json',
        ...(request.headers.has('x-payment-checkout-token')
          ? { 'x-payment-checkout-token': request.headers.get('x-payment-checkout-token') ?? '' }
          : {}),
      },
      body: body?.byteLength ? body : undefined,
    });
    const responseText = await upstreamResponse.text();

    return new Response(responseText, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    if (isBackendNetworkError(error)) {
      return Response.json({ message: 'Backend service is unavailable. Please try again shortly.' }, { status: 503 });
    }

    throw error;
  }
}

async function fetchWithAdminToken(
  path: string,
  init: Omit<RequestInit, 'headers' | 'body'> & {
    body?: unknown;
  },
  token: string,
) {
  const backendBaseUrl = Env.NEXT_PUBLIC_API_URL?.trim();
  if (!backendBaseUrl) {
    throw new BackendApiError('NEXT_PUBLIC_API_URL is not configured', 500, null);
  }

  return fetch(`${backendBaseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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
  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    cache: 'no-store',
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body?.byteLength ? body : undefined,
  });

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
