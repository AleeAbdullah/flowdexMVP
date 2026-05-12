'use client';

import { useCreateWalletChallenge, useVerifyWalletChallenge } from '@/dal/app/wallet-auth/wallet-auth.services';

type WalletSigner = {
  getAddress: () => Promise<`0x${string}`>;
  signMessage: (message: string) => Promise<`0x${string}`>;
};

export function useWalletVerification() {
  const createChallenge = useCreateWalletChallenge();
  const verifyChallenge = useVerifyWalletChallenge();

  async function verifyWallet(input: {
    signer: WalletSigner;
    chainId: number;
  }) {
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
  }

  return {
    verifyWallet,
    isPending: createChallenge.isPending || verifyChallenge.isPending,
    error: createChallenge.error ?? verifyChallenge.error ?? null,
    reset: () => {
      createChallenge.reset();
      verifyChallenge.reset();
    },
  };
}
