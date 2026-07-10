import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth.cookie';
import { sanitizeAppRedirectPath } from '@/lib/auth-redirect';

function isAdminPath(pathname: string) {
  return pathname === '/app/admin' || pathname.startsWith('/app/admin/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    const redirectUrl = new URL('/login', request.url);
    const safeNext = sanitizeAppRedirectPath(`${pathname}${request.nextUrl.search}`);

    if (safeNext !== '/app') {
      redirectUrl.searchParams.set('next', safeNext);
    }

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/admin/:path*'],
};
