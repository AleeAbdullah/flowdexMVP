'use client';

import { useCallback } from 'react';
import { useCreateWalletChallenge, useVerifyWalletChallenge } from '@/dal/app/wallet-auth/wallet-auth.services';

type WalletSigner = {
  getAddress: () => Promise<`0x${string}`>;
  signMessage: (message: string) => Promise<`0x${string}`>;
};

export function useWalletVerification() {
  const createChallenge = useCreateWalletChallenge();
  const verifyChallenge = useVerifyWalletChallenge();

  const verifyWallet = useCallback(async (input: {
    signer: WalletSigner;
    chainId: number;
  }) => {
    const walletAddress = await input.signer.getAddress();
    const challenge = await createChallenge.mutateAsync({
      walletAddress,
      chainId: input.chainId,
    });
    const signature = await input.signer.signMessage(challenge.message);

    return verifyChallenge.mutateAsync({
      challengeId: challenge.challengeId,
      walletAddress,
      chainId: input.chainId,
      signature,
    });
  }, [createChallenge, verifyChallenge]);

  const reset = useCallback(() => {
    createChallenge.reset();
    verifyChallenge.reset();
  }, [createChallenge, verifyChallenge]);

  return {
    verifyWallet,
    isPending: createChallenge.isPending || verifyChallenge.isPending,
    error: createChallenge.error ?? verifyChallenge.error ?? null,
    reset,
  };
}
