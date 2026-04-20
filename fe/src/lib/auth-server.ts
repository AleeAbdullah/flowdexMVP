import 'server-only';

import type { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Env } from '@/libs/Env';
import type { AuthMe } from '@/dal/app/types';

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

export function resolveUserRole(email: string): 'USER' | 'ADMIN' {
  const adminEmails = (Env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase()) ? 'ADMIN' : 'USER';
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
    redirect('/login');
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
    const profile = await fetchBackendJsonWithRetry<AuthMe>('/auth/me', { session });

    return {
      session,
      profile,
    };
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      redirect('/login');
    }

    throw error;
  }
}

export async function requireAdminAppContext() {
  const context = await getAuthenticatedAppContext();

  if (context.profile.role !== 'ADMIN') {
    redirect('/app');
  }

  return context;
}

export async function proxyBackendRequest(
  request: NextRequest,
  pathSegments: string[],
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return proxyBackendRequestWithRetry(request, pathSegments, session);
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
      redirect('/login');
    }

    return fetchBackendJsonWithRetry<T>(path, {
      ...init,
      session: refreshedSession,
    }, true);
  }

  if (!response.ok) {
    if (response.status === 401) {
      redirect('/login');
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
  const accessToken = await mintBackendAccessToken(session);

  return fetch(`${Env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

async function proxyBackendRequestWithRetry(
  request: NextRequest,
  pathSegments: string[],
  session: BetterAuthSession,
  retried = false,
) {
  const upstreamUrl = `${Env.NEXT_PUBLIC_API_URL}/${pathSegments.join('/')}${request.nextUrl.search}`;
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

    return proxyBackendRequestWithRetry(request, pathSegments, refreshedSession, true);
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
