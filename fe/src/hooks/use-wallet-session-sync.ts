'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLogoutWalletSession } from '@/dal/app/wallet-auth/wallet-auth.services';

function normalizeWalletAddress(address: string | null | undefined) {
  return address?.trim().toLowerCase() ?? null;
}

export function useWalletSessionSync(input: {
  connectedWalletAddress: string | null;
  connectedSignerReference?: object | null;
  sessionWalletAddress: string | null | undefined;
  isWalletConnected: boolean;
}) {
  const queryClient = useQueryClient();
  const logoutWalletSession = useLogoutWalletSession();
  const previousConnectionRef = useRef<{
    signerReference: object | null;
    walletAddress: string | null;
  }>({
    signerReference: null,
    walletAddress: null,
  });
  const lastHandledMismatchRef = useRef<string | null>(null);

  const invalidateWalletSession = useEffectEvent(() => {
    logoutWalletSession.mutate(undefined, {
      onSettled: () => {
        queryClient.removeQueries({ queryKey: ['wallet', 'transactions'] });
      },
    });
  });

  useEffect(() => {
    const connected = normalizeWalletAddress(input.connectedWalletAddress);
    const session = normalizeWalletAddress(input.sessionWalletAddress);
    const previousConnection = previousConnectionRef.current;
    const signerChangedWithSameAddress = Boolean(
      input.isWalletConnected
      && connected
      && session
      && connected === session
      && previousConnection.walletAddress === connected
      && previousConnection.signerReference
      && input.connectedSignerReference
      && previousConnection.signerReference !== input.connectedSignerReference,
    );

    previousConnectionRef.current = {
      signerReference: input.isWalletConnected ? input.connectedSignerReference ?? null : null,
      walletAddress: input.isWalletConnected ? connected : null,
    };

    if (!session) {
      lastHandledMismatchRef.current = null;
      return;
    }

    if ((input.isWalletConnected && connected && connected === session && !signerChangedWithSameAddress)) {
      lastHandledMismatchRef.current = null;
      return;
    }

    if (logoutWalletSession.isPending) {
      return;
    }

    const mismatchKey = [session, connected ?? 'disconnected', signerChangedWithSameAddress ? 'signer' : 'mismatch'].join(':');
    if (lastHandledMismatchRef.current === mismatchKey) {
      return;
    }

    lastHandledMismatchRef.current = mismatchKey;
    invalidateWalletSession();
  }, [
    input.connectedWalletAddress,
    input.connectedSignerReference,
    input.isWalletConnected,
    input.sessionWalletAddress,
    logoutWalletSession.isPending,
    invalidateWalletSession,
  ]);
}
