import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { attachWalletSessionCookie, clearWalletSessionCookie, clearWalletSession, verifyWalletChallenge } from '@/lib/wallet-auth.server';

const schema = z.object({
  challengeId: z.string().uuid(),
  walletAddress: z.string().min(1),
  chainId: z.number().int().positive().optional(),
  walletChain: z.enum(['ETHEREUM', 'SOLANA']).optional(),
  signature: z.string().min(1),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const previousSessionId = request.cookies.get('flowdex_wallet_session')?.value;
    if (previousSessionId) {
      await clearWalletSession(previousSessionId);
    }

    const body = schema.parse(await request.json());
    const session = await verifyWalletChallenge({
      request,
      challengeId: body.challengeId,
      walletAddress: body.walletAddress,
      chainId: body.chainId,
      walletChain: body.walletChain,
      signature: body.signature,
    });

    const response = NextResponse.json(session);
    attachWalletSessionCookie(response, session);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not verify wallet challenge' },
      { status: 400 },
    );
    clearWalletSessionCookie(response);
    return response;
  }
}
