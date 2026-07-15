'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDefaultTransport, getMultichainClient } from '@metamask/multichain-api-client';
import { registerBitcoinWalletStandard } from '@metamask/bitcoin-wallet-standard';
import { getWallets, type Wallet } from '@wallet-standard/core';
import type { BitcoinPreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

type BitcoinWalletConnectorId = 'metamask-bitcoin' | 'xverse';

const BITCOIN_CONNECTORS: Array<{
  id: BitcoinWalletConnectorId;
  name: string;
}> = [
  { id: 'metamask-bitcoin', name: 'MetaMask Bitcoin' },
  { id: 'xverse', name: 'Xverse Wallet' },
];
const XVERSE_PROVIDER_NAMES = ['Xverse Wallet', 'Xverse'] as const;
const XVERSE_PROVIDER_IDS = ['BitcoinProvider', 'xverseProviders.BitcoinProvider'] as const;
const BITCOIN_CONNECT_MESSAGE = 'Connect your Bitcoin payment address for FlowDex checkout.';
const BITCOIN_TX_ID_PATTERN = /^[a-fA-F0-9]{64}$/u;
const METAMASK_SATS_PROVIDER_WINDOW_KEY = '__flowdexMetaMaskBitcoinProvider';

type BitcoinProviderMetadata = {
  id?: string;
  name?: string;
  methods?: string[];
};

type BitcoinAddress = {
  address?: string;
  purpose?: string;
  network?: string;
};

type BitcoinRequestSuccess<T> = {
  status: 'success';
  result: T;
};

type BitcoinRequestError = {
  status: 'error';
  error?: {
    code?: number;
    message?: string;
  };
};

type BitcoinRequestResponse<T> = BitcoinRequestSuccess<T> | BitcoinRequestError;

type DirectBitcoinProvider = {
  request: <T = unknown>(method: string, params?: unknown) => Promise<BitcoinRequestResponse<T>>;
};

type BitcoinAddressesResult = {
  addresses?: BitcoinAddress[];
  addressses?: BitcoinAddress[];
} | BitcoinAddress[];

type SendTransferResult = {
  txid?: string;
};

type SatsConnectWallet = {
  providerId?: string;
  request: <T = unknown>(method: string, params?: unknown) => Promise<BitcoinRequestResponse<T>>;
  disconnect: () => Promise<void>;
};

type BitcoinConnectorRuntime =
  | {
      id: 'xverse';
      name: string;
      provider: DirectBitcoinProvider;
    }
  | {
      id: 'metamask-bitcoin';
      name: string;
      provider: unknown;
    };

type BitcoinProviderWindow = Window & {
  BitcoinProvider?: DirectBitcoinProvider;
  xverseProviders?: {
    BitcoinProvider?: DirectBitcoinProvider;
  };
  btc_providers?: BitcoinProviderMetadata[];
  webbtc_providers?: BitcoinProviderMetadata[];
  [METAMASK_SATS_PROVIDER_WINDOW_KEY]?: unknown;
};

type BitcoinCheckoutWalletConnection = {
  address: string;
  connectorId: BitcoinWalletConnectorId;
  connectorName: string;
};

type BitcoinCheckoutWalletState = {
  address: string | null;
  connectorName: string | null;
  selectedConnectorName: string | null;
  availableConnectorNames: string[];
  isConnected: boolean;
  isConnecting: boolean;
  isConfigured: boolean;
  isReady: boolean;
  selectConnector: (connectorName: string) => void;
  openSelector: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendPreparedAction: (action: BitcoinPreparedWalletAction) => Promise<WalletTxResult>;
};

let metaMaskBitcoinRegistrationStarted = false;

function beginMetaMaskBitcoinRegistration() {
  if (typeof window === 'undefined' || metaMaskBitcoinRegistrationStarted) {
    return Promise.resolve();
  }

  metaMaskBitcoinRegistrationStarted = true;
  const client = getMultichainClient({
    transport: getDefaultTransport({ defaultTimeout: 30_000 }),
  });

  return registerBitcoinWalletStandard({ client }).catch(() => undefined);
}

function getWindowProvider(path: string): DirectBitcoinProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = path.split('.').reduce<unknown>((current, key) => (
    current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : null
  ), window);

  return isDirectBitcoinProvider(value) ? value : null;
}

function getDetectedProviderMetadata(): BitcoinProviderMetadata[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const bitcoinWindow = window as BitcoinProviderWindow;
  return [
    ...(bitcoinWindow.btc_providers ?? []),
    ...(bitcoinWindow.webbtc_providers ?? []),
  ];
}

function isDirectBitcoinProvider(value: unknown): value is DirectBitcoinProvider {
  return Boolean(value && typeof value === 'object' && typeof (value as DirectBitcoinProvider).request === 'function');
}

function isXverseMetadata(metadata: BitcoinProviderMetadata) {
  const normalizedName = metadata.name?.trim().toLowerCase() ?? '';
  return Boolean(
    (metadata.id && XVERSE_PROVIDER_IDS.includes(metadata.id as typeof XVERSE_PROVIDER_IDS[number]))
    || XVERSE_PROVIDER_NAMES.some(name => normalizedName === name.toLowerCase())
    || normalizedName.includes('xverse'),
  );
}

function getXverseProvider(): DirectBitcoinProvider | null {
  const metadataProvider = getDetectedProviderMetadata()
    .filter(isXverseMetadata)
    .map(metadata => metadata.id ? getWindowProvider(metadata.id) : null)
    .find(isDirectBitcoinProvider);

  return metadataProvider
    ?? getWindowProvider('xverseProviders.BitcoinProvider')
    ?? getWindowProvider('BitcoinProvider');
}

function getXverseProviderName() {
  return getDetectedProviderMetadata().find(isXverseMetadata)?.name ?? 'Xverse Wallet';
}

function hasSatsConnectFeature(wallet: Wallet): boolean {
  return 'sats-connect:' in wallet.features;
}

function getMetaMaskBitcoinProvider(): unknown | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const wallet = getWallets().get().find(candidate => (
    hasSatsConnectFeature(candidate)
    && candidate.name.toLowerCase().includes('metamask')
  ));
  const feature = wallet?.features['sats-connect:'] as { provider?: unknown } | undefined;
  return feature?.provider ?? null;
}

function getConfiguredBitcoinConnectors(): BitcoinConnectorRuntime[] {
  const connectors: BitcoinConnectorRuntime[] = [];
  const metaMaskProvider = getMetaMaskBitcoinProvider();
  const xverseProvider = getXverseProvider();

  if (metaMaskProvider) {
    connectors.push({
      id: 'metamask-bitcoin',
      name: 'MetaMask Bitcoin',
      provider: metaMaskProvider,
    });
  }

  if (xverseProvider) {
    connectors.push({
      id: 'xverse',
      name: getXverseProviderName(),
      provider: xverseProvider,
    });
  }

  return connectors;
}

function getConnectorDefinition(connectorId: BitcoinWalletConnectorId) {
  return BITCOIN_CONNECTORS.find(connector => connector.id === connectorId) ?? BITCOIN_CONNECTORS[0];
}

function getConnectorDefinitionByName(connectorName: string): BitcoinWalletConnectorId | null {
  const normalized = connectorName.trim().toLowerCase();
  if (normalized.includes('metamask')) {
    return 'metamask-bitcoin';
  }
  if (normalized.includes('xverse')) {
    return 'xverse';
  }

  return BITCOIN_CONNECTORS.find(connector => connector.name.toLowerCase() === normalized)?.id ?? null;
}

function requireSuccess<T>(response: BitcoinRequestResponse<T>, fallbackMessage: string): T {
  if (response.status === 'success') {
    return response.result;
  }

  throw new Error(response.error?.message || fallbackMessage);
}

function parseAddressList(result: BitcoinAddressesResult): BitcoinAddress[] {
  if (Array.isArray(result)) {
    return result;
  }

  return result.addresses ?? result.addressses ?? [];
}

function parsePaymentAddress(result: BitcoinAddressesResult, walletName: string): string {
  const addresses = parseAddressList(result);
  const paymentAddress = addresses.find(item => item.purpose?.toLowerCase() === 'payment') ?? addresses[0];
  if (!paymentAddress?.address?.trim()) {
    throw new Error(`${walletName} did not return a Bitcoin payment address.`);
  }

  const network = paymentAddress.network?.toLowerCase();
  if (network && network !== 'mainnet' && network !== 'bitcoin:mainnet') {
    throw new Error(`Switch ${walletName} to Bitcoin Mainnet before continuing.`);
  }

  return paymentAddress.address.trim();
}

function parseSatoshiAmount(value: string): number {
  if (!/^[1-9]\d*$/u.test(value)) {
    throw new Error('Bitcoin payment amount is invalid.');
  }

  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) {
    throw new Error('Bitcoin payment amount is too large for this wallet request.');
  }

  return amount;
}

async function getSatsConnectWallet(provider: unknown): Promise<SatsConnectWallet> {
  const module = await import('sats-connect');
  const wallet = module.default as unknown as SatsConnectWallet;
  const bitcoinWindow = window as BitcoinProviderWindow;
  bitcoinWindow[METAMASK_SATS_PROVIDER_WINDOW_KEY] = provider;
  wallet.providerId = METAMASK_SATS_PROVIDER_WINDOW_KEY;
  return wallet;
}

async function requestWithRuntime<T>(
  runtime: BitcoinConnectorRuntime,
  method: string,
  params?: unknown,
): Promise<BitcoinRequestResponse<T>> {
  if (runtime.id === 'xverse') {
    return runtime.provider.request<T>(method, params);
  }

  const wallet = await getSatsConnectWallet(runtime.provider);
  return wallet.request<T>(method, params);
}

async function disconnectRuntime(runtime: BitcoinConnectorRuntime) {
  if (runtime.id === 'xverse') {
    await runtime.provider.request('wallet_disconnect', null).catch(() => undefined);
    return;
  }

  const wallet = await getSatsConnectWallet(runtime.provider);
  await wallet.disconnect().catch(() => undefined);
  delete (window as BitcoinProviderWindow)[METAMASK_SATS_PROVIDER_WINDOW_KEY];
  wallet.providerId = undefined;
}

async function requestPaymentAddress(runtime: BitcoinConnectorRuntime): Promise<string> {
  const result = requireSuccess(
    await requestWithRuntime<BitcoinAddressesResult>(runtime, 'getAddresses', {
      purposes: ['payment'],
      message: BITCOIN_CONNECT_MESSAGE,
      network: 'Mainnet',
    }),
    `${runtime.name} could not connect this Bitcoin account.`,
  );

  return parsePaymentAddress(result, runtime.name);
}

function resolveRuntime(input: {
  configuredConnectors: BitcoinConnectorRuntime[];
  selectedConnectorId: BitcoinWalletConnectorId;
  connection: BitcoinCheckoutWalletConnection | null;
}): BitcoinConnectorRuntime | null {
  const preferredId = input.connection?.connectorId ?? input.selectedConnectorId;
  return input.configuredConnectors.find(connector => connector.id === preferredId)
    ?? input.configuredConnectors[0]
    ?? null;
}

export function useBitcoinCheckoutWallet(): BitcoinCheckoutWalletState {
  const [connection, setConnection] = useState<BitcoinCheckoutWalletConnection | null>(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState<BitcoinWalletConnectorId>('metamask-bitcoin');
  const [isConnecting, setIsConnecting] = useState(false);
  const [detectionVersion, setDetectionVersion] = useState(0);

  useEffect(() => {
    let canceled = false;
    const refreshDetection = () => {
      if (!canceled) {
        setDetectionVersion(version => version + 1);
      }
    };

    void beginMetaMaskBitcoinRegistration().then(refreshDetection);
    const timer = window.setTimeout(refreshDetection, 750);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const configuredConnectors = useMemo(
    () => getConfiguredBitcoinConnectors(),
    [detectionVersion],
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
    const runtime = resolveRuntime({
      configuredConnectors: getConfiguredBitcoinConnectors(),
      selectedConnectorId,
      connection: null,
    });
    if (!runtime) {
      throw new Error('Install or enable MetaMask Bitcoin or Xverse Wallet to pay with BTC.');
    }

    setIsConnecting(true);
    try {
      const address = await requestPaymentAddress(runtime);
      setConnection({
        address,
        connectorId: runtime.id,
        connectorName: runtime.name,
      });
      setSelectedConnectorId(runtime.id);
    } finally {
      setIsConnecting(false);
      setDetectionVersion(version => version + 1);
    }
  }, [selectedConnectorId]);

  const disconnect = useCallback(async () => {
    const runtime = resolveRuntime({
      configuredConnectors: getConfiguredBitcoinConnectors(),
      selectedConnectorId,
      connection,
    });
    if (runtime) {
      await disconnectRuntime(runtime);
    }
    setConnection(null);
    setDetectionVersion(version => version + 1);
  }, [connection, selectedConnectorId]);

  const sendPreparedAction = useCallback(async (action: BitcoinPreparedWalletAction): Promise<WalletTxResult> => {
    if (!connection) {
      throw new Error('Connect a Bitcoin wallet before continuing.');
    }

    const runtime = resolveRuntime({
      configuredConnectors: getConfiguredBitcoinConnectors(),
      selectedConnectorId,
      connection,
    });
    if (!runtime) {
      throw new Error('Install or enable MetaMask Bitcoin or Xverse Wallet to pay with BTC.');
    }

    const activeAddress = await requestPaymentAddress(runtime);
    if (activeAddress !== connection.address) {
      throw new Error('The connected Bitcoin account changed. Reconnect before continuing.');
    }

    const result = requireSuccess(await requestWithRuntime<SendTransferResult>(runtime, 'sendTransfer', {
      recipients: [{
        address: action.recipientAddress,
        amount: parseSatoshiAmount(action.amountSats),
      }],
    }), `${runtime.name} could not send this Bitcoin payment.`);

    if (!result.txid || !BITCOIN_TX_ID_PATTERN.test(result.txid)) {
      throw new Error(`${runtime.name} did not return a valid Bitcoin transaction id.`);
    }

    return {
      paymentIntentId: action.paymentIntentId,
      preparedActionId: action.preparedActionId,
      chain: 'BITCOIN',
      txIdKind: 'btc_tx_hash',
      txId: result.txid,
    };
  }, [connection, selectedConnectorId]);

  return {
    address: connection?.address ?? null,
    connectorName: connection?.connectorName ?? null,
    selectedConnectorName,
    availableConnectorNames,
    isConnected: Boolean(connection),
    isConnecting,
    isConfigured: configuredConnectors.length > 0,
    isReady: Boolean(connection && effectiveRuntime),
    selectConnector,
    openSelector,
    disconnect,
    sendPreparedAction,
  };
}
