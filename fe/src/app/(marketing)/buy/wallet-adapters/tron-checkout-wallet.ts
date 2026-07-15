'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetaMaskAdapter } from '@metamask/connect-tron';
import type { ITronSignedTransaction, ITronUnsignedTransaction } from '@/dal/app/payments/payments.types';
import { paymentsService } from '@/dal/app/payments/payments.services';
import { TRON_MAINNET_WALLET_CHAIN_ID } from '../constants/tron';
import type { TronPreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

type TronWalletConnectorId = 'metamask-tron' | 'tronlink';
type TronReadyState = 'Loading' | 'Found' | 'NotFound';

const TRON_CONNECTORS: Array<{
  id: TronWalletConnectorId;
  name: string;
}> = [
  { id: 'metamask-tron', name: 'MetaMask TRON' },
  { id: 'tronlink', name: 'TronLink' },
];
const TRON_TX_ID_PATTERN = /^[a-fA-F0-9]{64}$/u;
const TRON_SIGNATURE_PATTERN = /^[a-fA-F0-9]{130}$/u;

type TronRequestResponse = {
  code?: number;
  message?: string;
};

type TronWebLike = {
  defaultAddress?: {
    base58?: string;
  };
  trx?: {
    sign?: (transaction: unknown) => Promise<unknown>;
  };
};

type TronProviderLike = {
  request?: (input: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  tronWeb?: TronWebLike;
};

type TronWindow = Window & {
  tron?: TronProviderLike;
  tronLink?: TronProviderLike;
  tronWeb?: TronWebLike;
};

type MetaMaskTronRuntime = {
  id: 'metamask-tron';
  name: string;
  adapter: MetaMaskAdapter;
};

type TronLinkRuntime = {
  id: 'tronlink';
  name: string;
  provider: TronProviderLike;
  tronWeb: TronWebLike;
  requestMethod: 'eth_requestAccounts' | 'tron_requestAccounts';
};

type TronConnectorRuntime = MetaMaskTronRuntime | TronLinkRuntime;

type TronCheckoutWalletConnection = {
  address: string;
  connectorId: TronWalletConnectorId;
  connectorName: string;
};

type MetaMaskTronSnapshot = {
  adapter: MetaMaskAdapter | null;
  readyState: TronReadyState;
  address: string | null;
};

let metaMaskTronAdapterPromise: Promise<MetaMaskAdapter> | null = null;

function getTronWindow(): TronWindow | null {
  return typeof window === 'undefined' ? null : window as TronWindow;
}

function normalizeConnectorName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/gu, '');
}

function getConnectorDefinition(connectorId: TronWalletConnectorId) {
  return TRON_CONNECTORS.find(connector => connector.id === connectorId) ?? TRON_CONNECTORS[0];
}

function getConnectorDefinitionByName(connectorName: string): TronWalletConnectorId | null {
  const normalized = normalizeConnectorName(connectorName);
  if (normalized.includes('metamask')) {
    return 'metamask-tron';
  }
  if (normalized.includes('tronlink')) {
    return 'tronlink';
  }

  return TRON_CONNECTORS.find(connector => normalizeConnectorName(connector.name) === normalized)?.id ?? null;
}

async function getMetaMaskTronAdapter() {
  if (typeof window === 'undefined') {
    return null;
  }

  metaMaskTronAdapterPromise ??= import('@metamask/connect-tron').then(({ MetaMaskAdapter }) => (
    new MetaMaskAdapter()
  ));
  return metaMaskTronAdapterPromise;
}

function waitForMetaMaskReadyState(adapter: MetaMaskAdapter, timeoutMs = 2_000): Promise<TronReadyState> {
  const current = toMetaMaskSnapshot(adapter).readyState;
  if (current !== 'Loading') {
    return Promise.resolve(current);
  }

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      adapter.off('readyStateChanged', handleReadyStateChanged);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    const handleReadyStateChanged = () => {
      const next = toMetaMaskSnapshot(adapter).readyState;
      if (next === 'Loading') {
        return;
      }

      cleanup();
      resolve(next);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve(toMetaMaskSnapshot(adapter).readyState);
    }, timeoutMs);
    adapter.on('readyStateChanged', handleReadyStateChanged);
  });
}

function toMetaMaskSnapshot(adapter: MetaMaskAdapter | null): MetaMaskTronSnapshot {
  const readyState = adapter?.readyState;
  return {
    adapter,
    readyState: readyState === 'Found' || readyState === 'NotFound' ? readyState : 'Loading',
    address: adapter?.address?.trim() || null,
  };
}

function getTronAddress(runtime: TronLinkRuntime): string | null {
  return runtime.tronWeb.defaultAddress?.base58?.trim() || null;
}

function getTronLinkRuntime(): TronLinkRuntime | null {
  const tronWindow = getTronWindow();
  const currentProvider = tronWindow?.tron;
  if (currentProvider?.request && currentProvider.tronWeb?.trx?.sign) {
    return {
      id: 'tronlink',
      name: 'TronLink',
      provider: currentProvider,
      tronWeb: currentProvider.tronWeb,
      requestMethod: 'eth_requestAccounts',
    };
  }

  const legacyProvider = tronWindow?.tronLink;
  const legacyTronWeb = legacyProvider?.tronWeb ?? tronWindow?.tronWeb;
  if (legacyProvider?.request && legacyTronWeb?.trx?.sign) {
    return {
      id: 'tronlink',
      name: 'TronLink',
      provider: legacyProvider,
      tronWeb: legacyTronWeb,
      requestMethod: 'tron_requestAccounts',
    };
  }

  return null;
}

function getConfiguredTronConnectors(input: {
  metaMaskAdapter: MetaMaskAdapter | null;
  metaMaskReadyState: TronReadyState;
}): TronConnectorRuntime[] {
  const connectors: TronConnectorRuntime[] = [];
  const tronLinkRuntime = getTronLinkRuntime();

  if (input.metaMaskAdapter && input.metaMaskReadyState !== 'NotFound') {
    connectors.push({
      id: 'metamask-tron',
      name: 'MetaMask TRON',
      adapter: input.metaMaskAdapter,
    });
  }

  if (tronLinkRuntime) {
    connectors.push(tronLinkRuntime);
  }

  return connectors;
}

async function getCurrentTronConnectors(input: {
  metaMaskSnapshot: MetaMaskTronSnapshot;
}): Promise<TronConnectorRuntime[]> {
  const adapter = input.metaMaskSnapshot.adapter ?? await getMetaMaskTronAdapter().catch(() => null);
  const snapshot = toMetaMaskSnapshot(adapter);
  return getConfiguredTronConnectors({
    metaMaskAdapter: snapshot.adapter,
    metaMaskReadyState: snapshot.readyState,
  });
}

function resolveRuntime(input: {
  configuredConnectors: TronConnectorRuntime[];
  selectedConnectorId: TronWalletConnectorId;
  connection: TronCheckoutWalletConnection | null;
}): TronConnectorRuntime | null {
  const preferredId = input.connection?.connectorId ?? input.selectedConnectorId;
  return input.configuredConnectors.find(connector => connector.id === preferredId)
    ?? input.configuredConnectors[0]
    ?? null;
}

function parseRequestResponse(value: unknown): TronRequestResponse {
  return value && typeof value === 'object' ? value as TronRequestResponse : {};
}

async function connectRuntime(runtime: TronConnectorRuntime): Promise<string> {
  if (runtime.id === 'metamask-tron') {
    const readyState = await waitForMetaMaskReadyState(runtime.adapter);
    if (readyState !== 'Found') {
      throw new Error('Install or enable MetaMask with TRON support to pay with USDT TRC20.');
    }

    await runtime.adapter.connect();
    await runtime.adapter.switchChain(TRON_MAINNET_WALLET_CHAIN_ID);
    const address = runtime.adapter.address?.trim();
    if (!address) {
      throw new Error('MetaMask did not return a TRON account.');
    }
    return address;
  }

  const response = parseRequestResponse(await runtime.provider.request?.({ method: runtime.requestMethod }));
  if (response.code && response.code !== 200) {
    throw new Error(response.message || 'TronLink rejected the connection request.');
  }

  const address = getTronAddress(runtime);
  if (!address) {
    throw new Error('TronLink did not return a TRON account.');
  }
  return address;
}

async function disconnectRuntime(runtime: TronConnectorRuntime) {
  if (runtime.id === 'metamask-tron') {
    await runtime.adapter.disconnect().catch(() => undefined);
  }
}

function parseSignedTransaction(value: unknown): ITronSignedTransaction {
  if (!value || typeof value !== 'object') {
    throw new Error('The TRON wallet did not return a signed transaction.');
  }

  const transaction = value as Record<string, unknown>;
  const rawData = transaction.raw_data;
  const signature = transaction.signature;
  if (
    transaction.visible !== true
    || typeof transaction.txID !== 'string'
    || !TRON_TX_ID_PATTERN.test(transaction.txID)
    || typeof transaction.raw_data_hex !== 'string'
    || !/^[a-fA-F0-9]+$/u.test(transaction.raw_data_hex)
    || !rawData
    || typeof rawData !== 'object'
    || !Array.isArray(signature)
    || signature.length === 0
    || !signature.every(item => typeof item === 'string' && TRON_SIGNATURE_PATTERN.test(item))
  ) {
    throw new Error('The TRON wallet returned an invalid signed transaction.');
  }

  return {
    visible: true,
    txID: transaction.txID,
    raw_data: rawData as Record<string, unknown>,
    raw_data_hex: transaction.raw_data_hex,
    signature,
  };
}

async function signPreparedTransaction(
  runtime: TronConnectorRuntime,
  unsignedTransaction: ITronUnsignedTransaction,
): Promise<ITronSignedTransaction> {
  if (runtime.id === 'metamask-tron') {
    await runtime.adapter.switchChain(TRON_MAINNET_WALLET_CHAIN_ID);
    const signed = await runtime.adapter.signTransaction(
      unsignedTransaction as Parameters<MetaMaskAdapter['signTransaction']>[0],
    );
    return parseSignedTransaction(signed);
  }

  return parseSignedTransaction(await runtime.tronWeb.trx?.sign?.(unsignedTransaction));
}

export function useTronCheckoutWallet() {
  const [connection, setConnection] = useState<TronCheckoutWalletConnection | null>(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState<TronWalletConnectorId>('metamask-tron');
  const [isConnecting, setIsConnecting] = useState(false);
  const [metaMaskSnapshot, setMetaMaskSnapshot] = useState<MetaMaskTronSnapshot>(() => toMetaMaskSnapshot(null));
  const [detectionVersion, setDetectionVersion] = useState(0);

  useEffect(() => {
    let canceled = false;
    let adapter: MetaMaskAdapter | null = null;
    let timer: number | null = null;

    const syncSnapshot = () => {
      if (canceled || !adapter) {
        return;
      }

      setMetaMaskSnapshot(toMetaMaskSnapshot(adapter));
      setDetectionVersion(version => version + 1);
    };

    void getMetaMaskTronAdapter().then((nextAdapter) => {
      if (canceled || !nextAdapter) {
        return;
      }

      adapter = nextAdapter;
      adapter.on('readyStateChanged', syncSnapshot);
      adapter.on('stateChanged', syncSnapshot);
      adapter.on('connect', syncSnapshot);
      adapter.on('disconnect', syncSnapshot);
      adapter.on('accountsChanged', syncSnapshot);
      adapter.on('chainChanged', syncSnapshot);
      syncSnapshot();
      timer = window.setTimeout(syncSnapshot, 750);
    }).catch(() => {
      if (!canceled) {
        setMetaMaskSnapshot({ adapter: null, readyState: 'NotFound', address: null });
      }
    });

    return () => {
      canceled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
      if (adapter) {
        adapter.off('readyStateChanged', syncSnapshot);
        adapter.off('stateChanged', syncSnapshot);
        adapter.off('connect', syncSnapshot);
        adapter.off('disconnect', syncSnapshot);
        adapter.off('accountsChanged', syncSnapshot);
        adapter.off('chainChanged', syncSnapshot);
      }
    };
  }, []);

  useEffect(() => {
    const refreshDetection = () => setDetectionVersion(version => version + 1);
    const timer = window.setTimeout(refreshDetection, 750);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setConnection(previous => {
      if (previous && previous.connectorId !== 'metamask-tron') {
        return previous;
      }
      if (!metaMaskSnapshot.address) {
        return previous?.connectorId === 'metamask-tron' ? null : previous;
      }

      return {
        address: metaMaskSnapshot.address,
        connectorId: 'metamask-tron',
        connectorName: 'MetaMask TRON',
      };
    });
  }, [metaMaskSnapshot.address]);

  const configuredConnectors = useMemo(
    () => getConfiguredTronConnectors({
      metaMaskAdapter: metaMaskSnapshot.adapter,
      metaMaskReadyState: metaMaskSnapshot.readyState,
    }),
    [detectionVersion, metaMaskSnapshot.adapter, metaMaskSnapshot.readyState],
  );
  const configuredConnectorKey = configuredConnectors.map(connector => connector.id).join('|');

  useEffect(() => {
    if (
      configuredConnectors.length > 0
      && !configuredConnectors.some(connector => connector.id === selectedConnectorId)
    ) {
      setSelectedConnectorId(configuredConnectors[0].id);
    }
  }, [configuredConnectorKey, configuredConnectors, selectedConnectorId]);

  const effectiveRuntime = resolveRuntime({
    configuredConnectors,
    selectedConnectorId,
    connection,
  });
  const selectedConnectorName = effectiveRuntime?.name ?? getConnectorDefinition(selectedConnectorId).name;
  const availableConnectorNames = configuredConnectors.map(connector => connector.name);

  const selectConnector = useCallback((connectorName: string) => {
    const connectorId = getConnectorDefinitionByName(connectorName);
    if (connectorId) {
      setSelectedConnectorId(connectorId);
    }
  }, []);

  const openSelector = useCallback(async () => {
    const currentConnectors = await getCurrentTronConnectors({ metaMaskSnapshot });
    const runtime = resolveRuntime({
      configuredConnectors: currentConnectors,
      selectedConnectorId,
      connection: null,
    });
    if (!runtime) {
      throw new Error('Install or enable MetaMask with TRON support or TronLink to pay with USDT TRC20.');
    }

    setIsConnecting(true);
    try {
      const address = await connectRuntime(runtime);
      setConnection({
        address,
        connectorId: runtime.id,
        connectorName: runtime.name,
      });
      setSelectedConnectorId(runtime.id);
      setMetaMaskSnapshot(previous => runtime.id === 'metamask-tron' ? toMetaMaskSnapshot(runtime.adapter) : previous);
    } finally {
      setIsConnecting(false);
      setDetectionVersion(version => version + 1);
    }
  }, [metaMaskSnapshot, selectedConnectorId]);

  const disconnect = useCallback(async () => {
    const currentConnectors = await getCurrentTronConnectors({ metaMaskSnapshot });
    const runtime = resolveRuntime({
      configuredConnectors: currentConnectors,
      selectedConnectorId,
      connection,
    });
    if (runtime) {
      await disconnectRuntime(runtime);
    }
    setConnection(null);
    setDetectionVersion(version => version + 1);
  }, [connection, metaMaskSnapshot, selectedConnectorId]);

  const sendPreparedAction = useCallback(async (
    action: TronPreparedWalletAction,
    checkoutToken: string,
  ): Promise<WalletTxResult> => {
    if (!connection) {
      throw new Error('Connect a supported TRON wallet before continuing.');
    }

    const currentConnectors = await getCurrentTronConnectors({ metaMaskSnapshot });
    const runtime = resolveRuntime({
      configuredConnectors: currentConnectors,
      selectedConnectorId,
      connection,
    });
    if (!runtime) {
      throw new Error('Install or enable MetaMask with TRON support or TronLink to pay with USDT TRC20.');
    }

    const activeAddress = runtime.id === 'metamask-tron'
      ? runtime.adapter.address?.trim() || null
      : getTronAddress(runtime);
    if (!activeAddress) {
      throw new Error('Connect a supported TRON wallet before continuing.');
    }
    if (action.payerAddress !== activeAddress || connection.address !== activeAddress) {
      throw new Error('The connected TRON account changed. Reconnect before continuing.');
    }

    const signedTransaction = await signPreparedTransaction(runtime, action.unsignedTransaction);
    const { txId } = await paymentsService.broadcastPreparedTronTransaction(
      action.paymentIntentId,
      action.preparedActionId,
      checkoutToken,
      { signedTransaction },
    );
    if (!TRON_TX_ID_PATTERN.test(txId)) {
      throw new Error('The TRON broadcast did not return a valid transaction id.');
    }

    return {
      paymentIntentId: action.paymentIntentId,
      preparedActionId: action.preparedActionId,
      chain: 'TRON',
      txIdKind: 'tron_tx_hash',
      txId,
    };
  }, [connection, metaMaskSnapshot, selectedConnectorId]);

  return {
    address: connection?.address ?? null,
    connectorName: connection?.connectorName ?? (configuredConnectors.length > 0 ? selectedConnectorName : null),
    selectedConnectorName,
    availableConnectorNames,
    isConnected: Boolean(connection),
    isConnecting,
    isConfigured: configuredConnectors.length > 0,
    isReady: Boolean(connection && effectiveRuntime),
    walletChainId: connection ? TRON_MAINNET_WALLET_CHAIN_ID : null,
    selectConnector,
    openSelector,
    disconnect,
    sendPreparedAction,
  };
}
