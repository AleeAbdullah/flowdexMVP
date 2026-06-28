import type { Connector } from '@wagmi/core';
import { sendBuyTransaction } from '../utils/send-buy-transaction';
import type { CheckoutChain, PreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

export type CheckoutWalletStatus =
  | {
      chain: 'ETHEREUM';
      address: `0x${string}`;
      chainId: number;
      connectorName: string;
      isConnected: boolean;
      isVerified: boolean;
      isReady: boolean;
    }
  | {
      chain: 'SOLANA';
      address: string;
      walletChainId: string;
      connectorName: string;
      isConnected: boolean;
      isVerified: boolean;
      isReady: boolean;
    };

export type CheckoutWalletAdapter = {
  chain: CheckoutChain;
  getStatus(): CheckoutWalletStatus | null;
  connect(): Promise<void>;
  disconnect?(): Promise<void>;
  verify?(): Promise<void>;
  sendPreparedAction(action: PreparedWalletAction): Promise<WalletTxResult>;
};

export function createEvmCheckoutWalletAdapter(input: {
  status: Extract<CheckoutWalletStatus, { chain: 'ETHEREUM' }> | null;
  connector: Connector | null;
  connectedAddress: `0x${string}` | null;
  verifiedWalletAddress: string | null;
  connect: () => void | Promise<void>;
  disconnect?: () => void | Promise<void>;
  verify?: () => void | Promise<void>;
}): CheckoutWalletAdapter {
  return {
    chain: 'ETHEREUM',
    getStatus() {
      return input.status;
    },
    async connect() {
      await input.connect();
    },
    async disconnect() {
      await input.disconnect?.();
    },
    async verify() {
      await input.verify?.();
    },
    async sendPreparedAction(action) {
      if (action.kind !== 'evm_transaction') {
        throw new Error('Unsupported wallet action for EVM adapter.');
      }

      if (!input.connector || !input.connectedAddress || !input.verifiedWalletAddress) {
        throw new Error('Connect and verify an Ethereum wallet before continuing.');
      }

      const sendResult = await sendBuyTransaction({
        connector: input.connector,
        connectedAddress: input.connectedAddress,
        verifiedWalletAddress: input.verifiedWalletAddress,
        request: action.request,
      });

      if ('error' in sendResult) {
        throw new Error(sendResult.error.message);
      }

      return {
        paymentIntentId: action.paymentIntentId,
        preparedActionId: action.preparedActionId,
        chain: 'ETHEREUM',
        txIdKind: 'evm_tx_hash',
        txId: sendResult.txHash,
      };
    },
  };
}
