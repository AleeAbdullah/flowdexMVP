'use client';

import { AddressPurpose, isProviderInstalled, request } from 'sats-connect';
import type { BitcoinPreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

const XVERSE_BITCOIN_PROVIDER_ID = 'XverseProviders.BitcoinProvider';

type XverseCheckoutWalletState = {
  address: string | null;
  isConnected: boolean;
  error: string | null;
};

export const initialXverseCheckoutWalletState: XverseCheckoutWalletState = {
  address: null,
  isConnected: false,
  error: null,
};

function responseResult<T>(response: { status: 'success'; result: T } | { status: 'error'; error: { message: string } }): T {
  if (response.status === 'error') {
    throw new Error(response.error.message || 'Xverse declined the request.');
  }

  return response.result;
}

export function isXverseAvailable(): boolean {
  return typeof window !== 'undefined' && isProviderInstalled(XVERSE_BITCOIN_PROVIDER_ID);
}

export function createXverseCheckoutWalletAdapter(input: {
  getState: () => XverseCheckoutWalletState;
  setState: (state: XverseCheckoutWalletState) => void;
}) {
  function updateState(patch: Partial<XverseCheckoutWalletState>) {
    input.setState({ ...input.getState(), ...patch });
  }

  async function connect(): Promise<string> {
    if (!isXverseAvailable()) {
      throw new Error('Install or unlock Xverse to pay with Bitcoin.');
    }

    const accounts = responseResult(await request('getAccounts', {
      purposes: [AddressPurpose.Payment],
      message: 'FlowDex needs your Bitcoin payment address to prepare checkout.',
    }, XVERSE_BITCOIN_PROVIDER_ID));
    const account = accounts.find(item => item.purpose === AddressPurpose.Payment);
    if (!account?.address) {
      throw new Error('Xverse did not return a Bitcoin payment address.');
    }

    updateState({ address: account.address, isConnected: true, error: null });
    return account.address;
  }

  return {
    connect,
    disconnect() {
      input.setState(initialXverseCheckoutWalletState);
    },
    async sendPreparedAction(action: BitcoinPreparedWalletAction): Promise<WalletTxResult> {
      const state = input.getState();
      if (!state.address) {
        throw new Error('Connect Xverse before continuing.');
      }
      const amount = Number(action.amountSats);
      if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('Bitcoin payment amount is invalid.');
      }

      const result = responseResult(await request('sendTransfer', {
        recipients: [{ address: action.recipientAddress, amount }],
      }, XVERSE_BITCOIN_PROVIDER_ID));
      if (!result.txid) {
        throw new Error('Xverse did not return a Bitcoin transaction id.');
      }

      return {
        paymentIntentId: action.paymentIntentId,
        preparedActionId: action.preparedActionId,
        chain: 'BITCOIN',
        txIdKind: 'btc_tx_hash',
        txId: result.txid,
      };
    },
  };
}
