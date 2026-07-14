'use client';

import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect,
  useWalletInfo,
} from '@reown/appkit/react';
import type { TronConnector } from '@reown/appkit-adapter-tron';
import type { ITronSignedTransaction } from '@/dal/app/payments/payments.types';
import { paymentsService } from '@/dal/app/payments/payments.services';
import { TRON_MAINNET_WALLET_CHAIN_ID } from '../constants/tron';
import type { TronPreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';
import { configuredReownProjectId } from './reown-checkout-appkit';

const TRON_TX_ID_PATTERN = /^[a-fA-F0-9]{64}$/u;
const TRON_SIGNATURE_PATTERN = /^[a-fA-F0-9]{130}$/u;

type WalletConnectTronConnector = TronConnector & {
  provider?: {
    session?: {
      sessionProperties?: Record<string, string>;
    };
  };
};

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

export function useTronAppKitCheckoutWallet() {
  const { open } = useAppKit();
  const account = useAppKitAccount({ namespace: 'tron' });
  const { walletProvider, walletProviderType } = useAppKitProvider<TronConnector>('tron');
  const { disconnect } = useDisconnect();
  const { walletInfo } = useWalletInfo('tron');
  const provider = walletProvider as TronConnector | undefined;
  const address = account.address ?? null;
  const providerType = walletProviderType ?? provider?.type;
  const isWalletConnectProvider = providerType === 'WALLET_CONNECT';
  const isSupportedProvider = providerType === 'INJECTED' || isWalletConnectProvider;
  const isProviderReady = typeof provider?.request === 'function' && isSupportedProvider;

  return {
    address,
    connectorName: walletInfo?.name ?? (address ? 'TRON wallet' : null),
    isConnected: account.isConnected && Boolean(address),
    isConnecting: account.status === 'connecting' || account.status === 'reconnecting',
    isConfigured: Boolean(configuredReownProjectId),
    isReady: account.isConnected && Boolean(address) && isProviderReady,
    walletChainId: address ? TRON_MAINNET_WALLET_CHAIN_ID : null,
    async openSelector() {
      if (!configuredReownProjectId) {
        throw new Error('TRON wallet connection is not configured.');
      }
      await open({ view: 'Connect', namespace: 'tron' });
    },
    async disconnect() {
      await disconnect({ namespace: 'tron' });
    },
    async sendPreparedAction(
      action: TronPreparedWalletAction,
      checkoutToken: string,
    ): Promise<WalletTxResult> {
      if (!address) {
        throw new Error('Connect a supported TRON wallet before continuing.');
      }
      if (!provider || !isSupportedProvider) {
        throw new Error('Choose a compatible TRON wallet through WalletConnect.');
      }
      if (!isProviderReady) {
        throw new Error('This TRON wallet cannot sign the prepared payment. Choose another wallet.');
      }
      if (action.payerAddress !== address) {
        throw new Error('The connected TRON account changed. Reconnect before continuing.');
      }

      const walletConnectUsesV1Format = isWalletConnectProvider
        && (provider as WalletConnectTronConnector).provider?.session
          ?.sessionProperties?.tron_method_version === 'v1';
      const signedTransaction = parseSignedTransaction(await provider.request(
        isWalletConnectProvider
          ? {
              method: 'tron_signTransaction',
              params: {
                address,
                transaction: walletConnectUsesV1Format
                  ? action.unsignedTransaction
                  : { transaction: action.unsignedTransaction },
              },
            }
          : {
              method: 'tron_sendTransaction',
              params: { transaction: action.unsignedTransaction },
            },
      ));
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
    },
  };
}
