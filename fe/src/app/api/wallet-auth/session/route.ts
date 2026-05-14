import { NextResponse } from 'next/server';
import { getOptionalWalletSession } from '@/lib/wallet-auth.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getOptionalWalletSession();

  return NextResponse.json(session);
}
