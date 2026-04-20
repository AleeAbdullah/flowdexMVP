import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { sanitizeAppRedirectPath } from '@/lib/auth-redirect';

function isAdminPath(pathname: string) {
  return pathname === '/app/admin' || pathname.startsWith('/app/admin/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/app')) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const redirectUrl = new URL('/login', request.url);
    const safeNext = sanitizeAppRedirectPath(`${pathname}${request.nextUrl.search}`);

    if (safeNext !== '/app') {
      redirectUrl.searchParams.set('next', safeNext);
    }

    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminPath(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
