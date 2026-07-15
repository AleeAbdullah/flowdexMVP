'use client';

import { useAlchemyAccountContext, useConnect, useLogout } from '@account-kit/react';
import { getAccount, signMessage as wagmiSignMessage, switchChain as wagmiSwitchChain, watchAccount } from '@wagmi/core';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { extractAxiosError } from '@/lib/axios';
import {
  useCreateWalletChallenge,
  useLogoutWalletSession,
  useVerifyWalletChallenge,
  useWalletSession,
  walletAuthQueryKeys,
} from '@/dal/app/wallet-auth/wallet-auth.services';
import { readAuthorizedInjectedConnector } from './marketing-wallet-connector-hydration';
import { useMarketingWalletStore } from './use-marketing-wallet-store';
import type {
  MarketingWalletConnectionErrorCode,
  MarketingWalletConnectorKind,
} from './marketing-wallet.types';

const DISCONNECTED_PROVIDER_ACCOUNT_SNAPSHOT = {
  address: undefined,
  addresses: undefined,
  chain: undefined,
  chainId: undefined,
  connector: undefined,
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
  isReconnecting: false,
  status: 'disconnected',
} as const;

type ProviderAccountSnapshot = ReturnType<typeof getAccount>;

const providerAccountSnapshotCache = new WeakMap<object, {
  key: string;
  snapshot: ProviderAccountSnapshot;
}>();

function normalizeWalletAddress(address: string | null | undefined) {
  return address?.trim().toLowerCase() ?? null;
}

function normalizeMarketingWalletConnectorName(name: string | null | undefined) {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

function getWalletConnectorName(connector: unknown) {
  if (!connector) {
    return '';
  }

  if (typeof connector === 'function') {
    return '';
  }

  if (typeof connector === 'object') {
    const connectorName = 'name' in connector && typeof connector.name === 'string'
      ? connector.name
      : null;
    const connectorId = 'id' in connector && typeof connector.id === 'string'
      ? connector.id
      : null;

    return normalizeMarketingWalletConnectorName(connectorName ?? connectorId ?? null);
  }

  return '';
}

function getConnectorKind(connectorName: string | null): MarketingWalletConnectorKind | null {
  if (!connectorName) {
    return null;
  }

  return 'injected';
}

function getProviderAccountSnapshotKey(wagmiConfig: {
  state: {
    current?: unknown;
    status?: unknown;
    connections: Map<unknown, {
      accounts?: readonly string[];
      chainId?: number;
      connector?: { id?: string; name?: string };
    }>;
  };
}) {
  const current = wagmiConfig.state.current;
  const connection = wagmiConfig.state.connections.get(current);
  const addresses = connection?.accounts?.join(',') ?? '';
  const chainId = connection?.chainId ?? '';
  const connectorId = connection?.connector?.id ?? '';
  const connectorName = connection?.connector?.name ?? '';

  return [
    String(wagmiConfig.state.status ?? ''),
    String(current ?? ''),
    addresses,
    String(chainId),
    connectorId,
    connectorName,
  ].join('|');
}

function getCachedProviderAccountSnapshot(wagmiConfig: Parameters<typeof getAccount>[0]) {
  const key = getProviderAccountSnapshotKey(wagmiConfig);
  const cached = providerAccountSnapshotCache.get(wagmiConfig);
  if (cached && cached.key === key) {
    return cached.snapshot;
  }

  const snapshot = getAccount(wagmiConfig);
  providerAccountSnapshotCache.set(wagmiConfig, {
    key,
    snapshot,
  });
  return snapshot;
}

function useMarketingProviderAccountSnapshot(wagmiConfig: Parameters<typeof getAccount>[0]) {
  return useSyncExternalStore(
    (onChange) => watchAccount(wagmiConfig, { onChange: () => onChange() }),
    () => getCachedProviderAccountSnapshot(wagmiConfig),
    () => DISCONNECTED_PROVIDER_ACCOUNT_SNAPSHOT,
  );
}

function isWalletConnectionRejected(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lowered = message.toLowerCase();
  return lowered.includes('rejected')
    || lowered.includes('cancel')
    || lowered.includes('closed modal')
    || lowered.includes('denied')
    || lowered.includes('declined');
}

type MarketingWalletSwitchNetworkResult =
  | { ok: true }
  | {
      ok: false;
      code: 'user_rejected' | 'provider_disconnected' | 'unsupported_chain' | 'switch_failed';
      message: string;
    };

function mapWalletSwitchNetworkError(error: unknown): MarketingWalletSwitchNetworkResult {
  const message = error instanceof Error ? error.message : String(error ?? 'Could not switch network.');
  const lowered = message.toLowerCase();

  if (isWalletConnectionRejected(error)) {
    return {
      ok: false,
      code: 'user_rejected',
      message: 'Network switch was rejected.',
    };
  }

  if (lowered.includes('unsupported chain') || lowered.includes('unrecognized chain')) {
    return {
      ok: false,
      code: 'unsupported_chain',
      message: 'This wallet does not support the required network.',
    };
  }

  return {
    ok: false,
    code: 'switch_failed',
    message,
  };
}

function mapWalletConnectionError(input: {
  connectorName: string | null;
  error: unknown;
}): {
  code: MarketingWalletConnectionErrorCode;
  message: string;
} {
  const message = input.error instanceof Error ? input.error.message : String(input.error ?? 'Unknown wallet connection error.');
  const lowered = message.toLowerCase();

  if (lowered.includes('connector already connected')) {
    return {
      code: 'already_connected',
      message,
    };
  }

  if (isWalletConnectionRejected(input.error)) {
    return {
      code: 'user_rejected',
      message,
    };
  }

  return {
    code: 'connector_failed',
    message,
  };
}

export function useMarketingWalletSync() {
  const {
    config: {
      _internal: { wagmiConfig },
    },
  } = useAlchemyAccountContext();
  const providerAccount = useMarketingProviderAccountSnapshot(wagmiConfig);
  const connectWallet = useConnect();
  const { logout, isLoggingOut, error: logoutError } = useLogout();
  const walletSessionQuery = useWalletSession();
  const createChallenge = useCreateWalletChallenge();
  const verifyChallenge = useVerifyWalletChallenge();
  const logoutWalletSession = useLogoutWalletSession();
  const queryClient = useQueryClient();

  const setProviderState = useMarketingWalletStore((state) => state.setProviderState);
  const setProviderConnectionIssue = useMarketingWalletStore((state) => state.setProviderConnectionIssue);
  const clearProviderConnectionIssue = useMarketingWalletStore((state) => state.clearProviderConnectionIssue);
  const setProviderAutoReconnectSuppressed = useMarketingWalletStore((state) => state.setProviderAutoReconnectSuppressed);
  const setVerificationState = useMarketingWalletStore((state) => state.setVerificationState);
  const resetVerificationState = useMarketingWalletStore((state) => state.resetVerificationState);
  const clearCheckoutLifecycle = useMarketingWalletStore((state) => state.clearCheckoutLifecycle);

  const availableConnectorNames = useMemo(() => {
    return connectWallet.connectors
      .map((connector) => getWalletConnectorName(connector))
      .filter(Boolean);
  }, [connectWallet.connectors]);

  const activeConnectorName = providerAccount.isConnected
    ? getWalletConnectorName(providerAccount.connector)
    : null;
  const pendingConnectorName = getWalletConnectorName(connectWallet.variables?.connector) || null;

  useEffect(() => {
    let canceled = false;

    async function syncProviderState() {
      const status = providerAccount.isConnected
        ? 'connected'
        : connectWallet.isPending
          ? 'checking'
          : 'disconnected';
      const connectorName = providerAccount.isConnected
        ? getWalletConnectorName(providerAccount.connector)
        : null;
      const connectorKind = getConnectorKind(connectorName);
      if (canceled) {
        return;
      }

      const previousProvider = useMarketingWalletStore.getState().provider;
      const nextAddress = providerAccount.isConnected && providerAccount.address
        ? providerAccount.address as `0x${string}`
        : null;
      const nextChainId = providerAccount.isConnected ? providerAccount.chainId ?? null : null;
      const shouldInvalidateCheckout = previousProvider.address !== nextAddress
        || previousProvider.chainId !== nextChainId
        || previousProvider.connectorName !== connectorName;

      if (shouldInvalidateCheckout) {
        clearCheckoutLifecycle();
      }

      setProviderState({
        status,
        address: nextAddress,
        chainId: nextChainId,
        connectorKind,
        connectorName,
        availableConnectorNames,
        pendingConnectorName: connectWallet.isPending ? pendingConnectorName : null,
      });

      if (providerAccount.isConnected) {
        clearProviderConnectionIssue();
      }
    }

    void syncProviderState();

    return () => {
      canceled = true;
    };
  }, [
    availableConnectorNames,
    clearCheckoutLifecycle,
    clearProviderConnectionIssue,
    connectWallet.isPending,
    pendingConnectorName,
    providerAccount.address,
    providerAccount.chainId,
    providerAccount.connector,
    providerAccount.isConnected,
    setProviderState,
  ]);

  useEffect(() => {
    if (providerAccount.isConnected || connectWallet.isPending) {
      return;
    }

    const currentProviderState = useMarketingWalletStore.getState().provider;
    if (currentProviderState.autoReconnectSuppressed || currentProviderState.connectionErrorCode) {
      return;
    }

    let canceled = false;

    async function hydrateAuthorizedInjectedWallet() {
      const authorizedConnector = await readAuthorizedInjectedConnector({
        connectors: connectWallet.connectors,
      });

      if (canceled || !authorizedConnector) {
        return;
      }

      clearProviderConnectionIssue();
      setProviderState({
        status: 'checking',
        pendingConnectorName: authorizedConnector.connectorName,
        autoReconnectSuppressed: false,
      });
      connectWallet.reset();
      connectWallet.connect({
        connector: authorizedConnector.connector,
        chainId: authorizedConnector.chainId ?? undefined,
      });
    }

    void hydrateAuthorizedInjectedWallet();

    return () => {
      canceled = true;
    };
  }, [
    clearProviderConnectionIssue,
    connectWallet,
    providerAccount.isConnected,
    setProviderState,
  ]);

  useEffect(() => {
    if (!connectWallet.error) {
      return;
    }

    const issue = mapWalletConnectionError({
      connectorName: pendingConnectorName,
      error: connectWallet.error,
    });
    setProviderConnectionIssue(issue);
  }, [connectWallet.error, pendingConnectorName, setProviderConnectionIssue]);

  useEffect(() => {
    if (!logoutError) {
      return;
    }

    setProviderConnectionIssue({
      code: 'connector_failed',
      message: logoutError.message,
    });
  }, [logoutError, setProviderConnectionIssue]);

  useEffect(() => {
    const providerAddress = normalizeWalletAddress(providerAccount.address ?? null);
    const sessionWalletAddress = normalizeWalletAddress(
      walletSessionQuery.data?.walletAddressChecksum ?? walletSessionQuery.data?.walletAddressNormalized ?? null,
    );

    if (providerAddress && sessionWalletAddress && providerAddress === sessionWalletAddress) {
      setVerificationState({
        status: 'verified',
        walletAddress: walletSessionQuery.data?.walletAddressChecksum
          ? walletSessionQuery.data.walletAddressChecksum as `0x${string}`
          : null,
        chainId: walletSessionQuery.data?.lastVerifiedChainId ?? null,
        error: null,
      });
      return;
    }

    clearCheckoutLifecycle();
    resetVerificationState();
  }, [
    clearCheckoutLifecycle,
    providerAccount.address,
    resetVerificationState,
    setVerificationState,
    walletSessionQuery.data?.lastVerifiedChainId,
    walletSessionQuery.data?.walletAddressChecksum,
    walletSessionQuery.data?.walletAddressNormalized,
  ]);

  function connectByName(connectorName: string, options?: { chainId?: number }) {
    const normalizedConnectorName = normalizeMarketingWalletConnectorName(connectorName);
    if (!normalizedConnectorName) {
      setProviderConnectionIssue({
        code: 'connector_unavailable',
        message: 'This wallet is not available in the current browser.',
      });
      return;
    }

    if (!availableConnectorNames.includes(normalizedConnectorName)) {
      setProviderConnectionIssue({
        code: 'connector_unavailable',
        message: 'This wallet is not available in the current browser.',
      });
      return;
    }

    if (providerAccount.isConnected) {
      if (activeConnectorName === normalizedConnectorName) {
        clearProviderConnectionIssue();
        return;
      }

      setProviderConnectionIssue({
        code: 'reconnect_required',
        message: 'Disconnect the current wallet before connecting a different one.',
      });
      return;
    }

    if (connectWallet.isPending) {
      return;
    }

    const connector = connectWallet.connectors.find(
      (candidate) => getWalletConnectorName(candidate) === normalizedConnectorName,
    );

    if (!connector) {
      setProviderConnectionIssue({
        code: 'connector_unavailable',
        message: 'This wallet is not available in the current browser.',
      });
      return;
    }

    clearProviderConnectionIssue();
    setProviderAutoReconnectSuppressed(false);
    connectWallet.reset();
    connectWallet.connect({
      connector,
      chainId: options?.chainId,
    });
  }

  async function disconnectWallet() {
    clearProviderConnectionIssue();
    setProviderAutoReconnectSuppressed(true);
    connectWallet.reset();
    resetVerificationState();
    clearCheckoutLifecycle();
    logoutWalletSession.mutate(undefined, {
      onSettled: () => {
        queryClient.removeQueries({ queryKey: ['wallet', 'transactions'] });
        queryClient.removeQueries({ queryKey: walletAuthQueryKeys.session });
      },
    });
    logout(undefined);
  }

  async function switchToChain(chainId: number): Promise<MarketingWalletSwitchNetworkResult> {
    const currentAccount = getCachedProviderAccountSnapshot(wagmiConfig);
    if (!currentAccount.isConnected) {
      return {
        ok: false,
        code: 'provider_disconnected',
        message: 'Connect a wallet before switching networks.',
      };
    }

    if (currentAccount.chainId === chainId) {
      return { ok: true };
    }

    try {
      await wagmiSwitchChain(wagmiConfig, { chainId });
      clearCheckoutLifecycle();
      return { ok: true };
    } catch (error) {
      return mapWalletSwitchNetworkError(error);
    }
  }

  async function verifyWallet(input: { chainId: number }) {
    const currentAccount = getCachedProviderAccountSnapshot(wagmiConfig);
    const walletAddress = currentAccount.address;
    if (!walletAddress) {
      setVerificationState({
        status: 'unverified',
        walletAddress: null,
        chainId: null,
        error: 'Connect a wallet before verifying it.',
      });
      return;
    }

    setVerificationState({
      status: 'verifying',
      walletAddress: null,
      chainId: null,
      error: null,
    });

    try {
      const challenge = await createChallenge.mutateAsync({
        walletAddress,
        chainId: input.chainId,
      });
      const signature = await wagmiSignMessage(wagmiConfig, {
        message: challenge.message,
      });
      const session = await verifyChallenge.mutateAsync({
        challengeId: challenge.challengeId,
        walletAddress,
        chainId: input.chainId,
        signature,
      });

      setVerificationState({
        status: 'verified',
        walletAddress: session.walletAddressChecksum as `0x${string}`,
        chainId: session.lastVerifiedChainId ?? null,
        error: null,
      });
    } catch (error) {
      const details = extractAxiosError(error);
      setVerificationState({
        status: 'unverified',
        walletAddress: null,
        chainId: null,
        error: details.message || 'Could not verify wallet signature.',
      });
    }
  }

  return {
    providerAccount,
    walletSessionQuery,
    availableConnectorNames,
    pendingConnectorName,
    activeConnectorName,
    isDisconnecting: isLoggingOut || logoutWalletSession.isPending,
    isVerifying: createChallenge.isPending || verifyChallenge.isPending,
    connectByName,
    disconnectWallet,
    switchToChain,
    verifyWallet,
    clearConnectionIssue: clearProviderConnectionIssue,
  };
}
