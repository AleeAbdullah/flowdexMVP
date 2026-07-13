'use client';

import {
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect,
  useWalletInfo,
} from '@reown/appkit/react';
import { BitcoinAdapter, type BitcoinConnector } from '@reown/appkit-adapter-bitcoin';
import { bitcoin } from '@reown/appkit/networks';
import { Env } from '@/libs/Env';
import type { BitcoinPreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

const configuredProjectId = Env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || null;
const projectId = configuredProjectId ?? 'walletconnect-project-id-not-configured';
const appUrl = (Env.NEXT_PUBLIC_APP_URL?.trim() || 'https://flowdexprotocol.com').replace(/\/$/u, '');

if (typeof window !== 'undefined') {
  const bitcoinAdapter = new BitcoinAdapter({ projectId });

  createAppKit({
    adapters: [bitcoinAdapter],
    networks: [bitcoin],
    defaultNetwork: bitcoin,
    defaultAccountTypes: { bip122: 'payment' },
    projectId,
    metadata: {
      name: 'FlowDex',
      description: 'FlowDex Protocol',
      url: appUrl,
      icons: [`${appUrl}/favicon.ico`],
    },
    allWallets: 'SHOW',
    enableWallets: true,
    enableInjected: true,
    enableWalletConnect: true,
    enableCoinbase: false,
    enableBaseAccount: false,
    enableWalletGuide: false,
    features: {
      analytics: false,
      email: false,
      socials: false,
      onramp: false,
      swaps: false,
      receive: false,
      send: false,
      history: false,
    },
  });
}

function isPositiveSatoshiAmount(value: string): boolean {
  return /^[1-9]\d*$/u.test(value);
}

export function useBitcoinAppKitCheckoutWallet() {
  const { open } = useAppKit();
  const account = useAppKitAccount({ namespace: 'bip122' });
  const { walletProvider } = useAppKitProvider<BitcoinConnector>('bip122');
  const { disconnect } = useDisconnect();
  const { walletInfo } = useWalletInfo('bip122');
  const provider = walletProvider as BitcoinConnector | undefined;
  const address = account.address ?? null;
  const isProviderReady = typeof provider?.sendTransfer === 'function';

  return {
    address,
    connectorName: walletInfo?.name ?? (address ? 'Bitcoin wallet' : null),
    isConnected: account.isConnected && Boolean(address),
    isConnecting: account.status === 'connecting' || account.status === 'reconnecting',
    isConfigured: Boolean(configuredProjectId),
    isReady: account.isConnected && Boolean(address) && isProviderReady,
    async openSelector() {
      if (!configuredProjectId) {
        throw new Error('Bitcoin wallet connection is not configured.');
      }
      await open({ view: 'Connect', namespace: 'bip122' });
    },
    async disconnect() {
      await disconnect({ namespace: 'bip122' });
    },
    async sendPreparedAction(action: BitcoinPreparedWalletAction): Promise<WalletTxResult> {
      if (!address) {
        throw new Error('Connect a Bitcoin wallet before continuing.');
      }
      if (!isProviderReady || !provider) {
        throw new Error('This Bitcoin wallet cannot send the prepared payment. Choose another wallet.');
      }
      if (!isPositiveSatoshiAmount(action.amountSats)) {
        throw new Error('Bitcoin payment amount is invalid.');
      }

      const txId = await provider.sendTransfer({
        recipient: action.recipientAddress,
        amount: action.amountSats,
      });
      if (!txId?.trim()) {
        throw new Error('The Bitcoin wallet did not return a transaction id.');
      }

      return {
        paymentIntentId: action.paymentIntentId,
        preparedActionId: action.preparedActionId,
        chain: 'BITCOIN',
        txIdKind: 'btc_tx_hash',
        txId,
      };
    },
  };
}
