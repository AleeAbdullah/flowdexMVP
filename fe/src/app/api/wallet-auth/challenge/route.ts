import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createWalletChallenge } from '@/lib/wallet-auth.server';

const schema = z.object({
  walletAddress: z.string().min(1),
  chainId: z.number().int().positive(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const challenge = await createWalletChallenge({
      request,
      walletAddress: body.walletAddress,
      chainId: body.chainId,
    });

    return NextResponse.json(challenge);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not create wallet challenge' },
      { status: 400 },
    );
  }
}
