'use client';

import { useCallback, useState } from 'react';
import type { BitcoinPreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

const XVERSE_PROVIDER_NAMES = ['Xverse Wallet', 'Xverse'] as const;
const XVERSE_PROVIDER_IDS = ['BitcoinProvider', 'xverseProviders.BitcoinProvider'] as const;
const XVERSE_CONNECT_MESSAGE = 'Connect your Bitcoin payment address for FlowDex checkout.';
const BITCOIN_TX_ID_PATTERN = /^[a-fA-F0-9]{64}$/u;

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

type BitcoinProvider = {
  request: <T = unknown>(method: string, params?: unknown) => Promise<BitcoinRequestResponse<T>>;
};

type WalletConnectResult = {
  addresses?: BitcoinAddress[];
  addressses?: BitcoinAddress[];
};

type SendTransferResult = {
  txid?: string;
};

type XverseBitcoinWalletState = {
  address: string | null;
  connectorName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isConfigured: boolean;
  isReady: boolean;
  openSelector: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendPreparedAction: (action: BitcoinPreparedWalletAction) => Promise<WalletTxResult>;
};

type BitcoinProviderWindow = Window & {
  BitcoinProvider?: BitcoinProvider;
  xverseProviders?: {
    BitcoinProvider?: BitcoinProvider;
  };
  btc_providers?: BitcoinProviderMetadata[];
  webbtc_providers?: BitcoinProviderMetadata[];
};

function getWindowProvider(path: string): BitcoinProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = path.split('.').reduce<unknown>((current, key) => (
    current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : null
  ), window);

  return isBitcoinProvider(value) ? value : null;
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

function isBitcoinProvider(value: unknown): value is BitcoinProvider {
  return Boolean(value && typeof value === 'object' && typeof (value as BitcoinProvider).request === 'function');
}

function isXverseMetadata(metadata: BitcoinProviderMetadata) {
  return Boolean(
    (metadata.id && XVERSE_PROVIDER_IDS.includes(metadata.id as typeof XVERSE_PROVIDER_IDS[number]))
    || (metadata.name && XVERSE_PROVIDER_NAMES.includes(metadata.name as typeof XVERSE_PROVIDER_NAMES[number])),
  );
}

function getXverseProvider(): BitcoinProvider | null {
  const metadataProvider = getDetectedProviderMetadata()
    .filter(isXverseMetadata)
    .map(metadata => metadata.id ? getWindowProvider(metadata.id) : null)
    .find(isBitcoinProvider);

  return metadataProvider
    ?? getWindowProvider('xverseProviders.BitcoinProvider')
    ?? getWindowProvider('BitcoinProvider');
}

function getProviderName() {
  return getDetectedProviderMetadata().find(isXverseMetadata)?.name ?? 'Xverse Wallet';
}

function requireSuccess<T>(response: BitcoinRequestResponse<T>, fallbackMessage: string): T {
  if (response.status === 'success') {
    return response.result;
  }

  throw new Error(response.error?.message || fallbackMessage);
}

function parsePaymentAddress(result: WalletConnectResult): string {
  const addresses = result.addresses ?? result.addressses ?? [];
  const paymentAddress = addresses.find(item => item.purpose?.toLowerCase() === 'payment');
  if (!paymentAddress?.address?.trim()) {
    throw new Error('Xverse did not return a Bitcoin payment address.');
  }
  if (paymentAddress.network && paymentAddress.network.toLowerCase() !== 'mainnet') {
    throw new Error('Switch Xverse to Bitcoin Mainnet before continuing.');
  }
  return paymentAddress.address;
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

export function useXverseBitcoinCheckoutWallet(): XverseBitcoinWalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const provider = getXverseProvider();
  const connectorName = address || provider ? getProviderName() : null;
  const isConfigured = Boolean(provider);

  const openSelector = useCallback(async () => {
    const currentProvider = getXverseProvider();
    if (!currentProvider) {
      throw new Error('Install or enable Xverse Wallet to pay with BTC.');
    }

    setIsConnecting(true);
    try {
      const result = requireSuccess(await currentProvider.request<WalletConnectResult>('wallet_connect', {
        addresses: ['payment'],
        message: XVERSE_CONNECT_MESSAGE,
        network: 'Mainnet',
      }), 'Xverse could not connect this Bitcoin account.');
      setAddress(parsePaymentAddress(result));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const currentProvider = getXverseProvider();
    if (currentProvider) {
      await currentProvider.request('wallet_disconnect', null).catch(() => undefined);
    }
    setAddress(null);
  }, []);

  const sendPreparedAction = useCallback(async (action: BitcoinPreparedWalletAction): Promise<WalletTxResult> => {
    const currentProvider = getXverseProvider();
    if (!currentProvider) {
      throw new Error('Install or enable Xverse Wallet to pay with BTC.');
    }
    if (!address) {
      throw new Error('Connect Xverse before continuing.');
    }

    const result = requireSuccess(await currentProvider.request<SendTransferResult>('sendTransfer', {
      recipients: [{
        address: action.recipientAddress,
        amount: parseSatoshiAmount(action.amountSats),
      }],
    }), 'Xverse could not send this Bitcoin payment.');

    if (!result.txid || !BITCOIN_TX_ID_PATTERN.test(result.txid)) {
      throw new Error('Xverse did not return a valid Bitcoin transaction id.');
    }

    return {
      paymentIntentId: action.paymentIntentId,
      preparedActionId: action.preparedActionId,
      chain: 'BITCOIN',
      txIdKind: 'btc_tx_hash',
      txId: result.txid,
    };
  }, [address]);

  return {
    address,
    connectorName,
    isConnected: Boolean(address),
    isConnecting,
    isConfigured,
    isReady: Boolean(address && provider),
    openSelector,
    disconnect,
    sendPreparedAction,
  };
}
