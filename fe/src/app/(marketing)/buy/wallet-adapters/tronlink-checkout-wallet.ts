'use client';

import { useCallback, useState } from 'react';
import type { ITronSignedTransaction } from '@/dal/app/payments/payments.types';
import { paymentsService } from '@/dal/app/payments/payments.services';
import { TRON_MAINNET_WALLET_CHAIN_ID } from '../constants/tron';
import type { TronPreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

const TRON_TX_ID_PATTERN = /^[a-fA-F0-9]{64}$/u;
const TRON_SIGNATURE_PATTERN = /^[a-fA-F0-9]{130}$/u;

type TronLinkResponse = {
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

type TronLinkLike = {
  request?: (input: { method: string; params?: unknown }) => Promise<TronLinkResponse>;
};

type TronWindow = Window & {
  tronLink?: TronLinkLike;
  tronWeb?: TronWebLike;
};

function getTronWindow(): TronWindow | null {
  return typeof window === 'undefined' ? null : window as TronWindow;
}

function getTronAddress(): string | null {
  return getTronWindow()?.tronWeb?.defaultAddress?.base58?.trim() || null;
}

function getTronLink() {
  const tronWindow = getTronWindow();
  const tronLink = tronWindow?.tronLink;
  const tronWeb = tronWindow?.tronWeb;
  if (!tronLink?.request || !tronWeb?.trx?.sign) {
    return null;
  }

  return { tronLink, tronWeb };
}

function parseSignedTransaction(value: unknown): ITronSignedTransaction {
  if (!value || typeof value !== 'object') {
    throw new Error('TronLink did not return a signed transaction.');
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
    throw new Error('TronLink returned an invalid signed transaction.');
  }

  return {
    visible: true,
    txID: transaction.txID,
    raw_data: rawData as Record<string, unknown>,
    raw_data_hex: transaction.raw_data_hex,
    signature,
  };
}

export function useTronLinkCheckoutWallet() {
  const [address, setAddress] = useState<string | null>(() => getTronAddress());
  const [isConnecting, setIsConnecting] = useState(false);
  const tronLink = getTronLink();
  const isConfigured = Boolean(tronLink);

  const openSelector = useCallback(async () => {
    const current = getTronLink();
    if (!current) {
      throw new Error('Install or enable TronLink to pay with USDT TRC20.');
    }

    setIsConnecting(true);
    try {
      const response = await current.tronLink.request?.({ method: 'tron_requestAccounts' });
      if (response?.code && response.code !== 200) {
        throw new Error(response.message || 'TronLink rejected the connection request.');
      }

      const nextAddress = getTronAddress();
      if (!nextAddress) {
        throw new Error('TronLink did not return a TRON account.');
      }
      setAddress(nextAddress);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setAddress(null);
  }, []);

  const sendPreparedAction = useCallback(async (
    action: TronPreparedWalletAction,
    checkoutToken: string,
  ): Promise<WalletTxResult> => {
    const current = getTronLink();
    if (!current) {
      throw new Error('Install or enable TronLink to pay with USDT TRC20.');
    }

    const currentAddress = getTronAddress();
    if (!currentAddress) {
      throw new Error('Connect TronLink before continuing.');
    }
    if (action.payerAddress !== currentAddress) {
      throw new Error('The connected TRON account changed. Reconnect before continuing.');
    }

    const signedTransaction = parseSignedTransaction(await current.tronWeb.trx?.sign?.(action.unsignedTransaction));
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
  }, []);

  return {
    address,
    connectorName: address || isConfigured ? 'TronLink' : null,
    isConnected: Boolean(address),
    isConnecting,
    isConfigured,
    isReady: Boolean(address && tronLink),
    walletChainId: address ? TRON_MAINNET_WALLET_CHAIN_ID : null,
    openSelector,
    disconnect,
    sendPreparedAction,
  };
}
