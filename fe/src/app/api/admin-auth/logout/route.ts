import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/admin-auth.server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ cleared: true });
  clearAdminSessionCookie(response);
  return response;
}
