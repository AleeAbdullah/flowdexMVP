import { NextRequest, NextResponse } from 'next/server';
import { clearWalletSessionCookie, logoutWalletSessionFromRequest } from '@/lib/wallet-auth.server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ cleared: true });

  try {
    await logoutWalletSessionFromRequest(request);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not clear wallet session' },
      { status: 400 },
    );
  }

  clearWalletSessionCookie(response);
  return response;
}
