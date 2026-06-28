import { createSolanaClient, type SolanaClient } from '@metamask/connect-solana';
import bs58 from 'bs58';
import { walletAuthService } from '@/dal/app/wallet-auth/wallet-auth.services';
import type { CheckoutWalletAdapter, CheckoutWalletStatus } from './checkout-wallet-adapter';
import type { PreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

const SOLANA_MAINNET_WALLET_CHAIN_ID = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
const SOLANA_MAINNET_WALLET_CHAIN_ALIASES = new Set([
  SOLANA_MAINNET_WALLET_CHAIN_ID,
  'solana:mainnet',
  'solana:mainnet-beta',
  'mainnet',
  'mainnet-beta',
]);

type WalletAccount = {
  address: string;
  chains?: readonly string[];
};

type SolanaWalletFeatureMap = {
  'standard:connect'?: {
    connect: () => Promise<{ accounts: readonly WalletAccount[] }>;
  };
  'standard:disconnect'?: {
    disconnect: () => Promise<void>;
  };
  'solana:signMessage'?: {
    signMessage: (input: {
      account: WalletAccount;
      message: Uint8Array;
    }) => Promise<readonly [{ signature: Uint8Array }]>;
  };
  'solana:signAndSendTransaction'?: {
    signAndSendTransaction: (input: {
      account: WalletAccount;
      transaction: Uint8Array;
      chain: string;
    }) => Promise<readonly [{ signature: Uint8Array }]>;
  };
};

type SolanaWallet = {
  features: SolanaWalletFeatureMap;
};

export type SolanaCheckoutWalletAdapterState = {
  address: string | null;
  walletChainId: string | null;
  isConnected: boolean;
  isVerified: boolean;
  isReady: boolean;
  error: string | null;
};

export const initialSolanaCheckoutWalletAdapterState: SolanaCheckoutWalletAdapterState = {
  address: null,
  walletChainId: null,
  isConnected: false,
  isVerified: false,
  isReady: false,
  error: null,
};

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function normalizeSolanaMainnetWalletChainId(value?: string | null) {
  const normalized = value?.trim() ?? '';
  if (!normalized || SOLANA_MAINNET_WALLET_CHAIN_ALIASES.has(normalized)) {
    return SOLANA_MAINNET_WALLET_CHAIN_ID;
  }

  return null;
}

function getWalletChainId(account: WalletAccount) {
  const walletChainId = account.chains?.find(chain => chain.startsWith('solana:'));
  return normalizeSolanaMainnetWalletChainId(walletChainId) ?? walletChainId ?? SOLANA_MAINNET_WALLET_CHAIN_ID;
}

function assertSolanaMainnetWalletChainId(value: string) {
  const chain = normalizeSolanaMainnetWalletChainId(value);
  if (!chain) {
    throw new Error('Unsupported Solana wallet chain.');
  }

  return chain;
}

function normalizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lowered = message.toLowerCase();
  if (
    lowered.includes('reject')
    || lowered.includes('cancel')
    || lowered.includes('decline')
    || lowered.includes('denied')
  ) {
    return 'Transaction was rejected in your wallet.';
  }
  return message || 'Could not complete the Solana wallet request.';
}

export function createSolanaMetaMaskCheckoutWalletAdapter(input: {
  getState: () => SolanaCheckoutWalletAdapterState;
  setState: (state: SolanaCheckoutWalletAdapterState) => void;
}): CheckoutWalletAdapter {
  let client: SolanaClient | null = null;
  let wallet: SolanaWallet | null = null;
  let account: WalletAccount | null = null;

  async function getWallet() {
    if (!client) {
      client = await createSolanaClient({
        dapp: {
          name: 'FlowDex',
          url: typeof window === 'undefined' ? 'https://flowdex.app' : window.location.origin,
        },
        analytics: { enabled: false },
      });
    }

    wallet = client.getWallet() as SolanaWallet;
    return wallet;
  }

  function setConnected(nextAccount: WalletAccount, verified: boolean) {
    const walletChainId = getWalletChainId(nextAccount);
    const supportsSignAndSend = Boolean(wallet?.features['solana:signAndSendTransaction']);
    const isSupportedChain = walletChainId === SOLANA_MAINNET_WALLET_CHAIN_ID;
    account = nextAccount;
    input.setState({
      address: nextAccount.address,
      walletChainId,
      isConnected: true,
      isVerified: verified,
      isReady: supportsSignAndSend && isSupportedChain,
      error: !supportsSignAndSend
        ? 'This Solana wallet does not support sign-and-send transactions.'
        : isSupportedChain
          ? null
          : 'MetaMask Solana is not connected to Solana mainnet.',
    });
  }

  return {
    chain: 'SOLANA',
    getStatus(): CheckoutWalletStatus | null {
      const state = input.getState();
      if (!state.address || !state.walletChainId) {
        return null;
      }

      return {
        chain: 'SOLANA',
        address: state.address,
        walletChainId: state.walletChainId,
        connectorName: 'MetaMask Solana',
        isConnected: state.isConnected,
        isVerified: state.isVerified,
        isReady: state.isReady,
      };
    },
    async connect() {
      try {
        const nextWallet = await getWallet();
        const connect = nextWallet.features['standard:connect']?.connect;
        if (!connect) {
          throw new Error('MetaMask Solana is not available in this browser.');
        }

        const { accounts } = await connect();
        const nextAccount = accounts[0];
        if (!nextAccount?.address) {
          throw new Error('MetaMask did not return a Solana account.');
        }

        setConnected(nextAccount, false);
      } catch (error) {
        input.setState({
          ...input.getState(),
          error: normalizeError(error),
        });
        throw error;
      }
    },
    async disconnect() {
      await wallet?.features['standard:disconnect']?.disconnect?.();
      account = null;
      input.setState(initialSolanaCheckoutWalletAdapterState);
    },
    async verify() {
      if (!wallet || !account) {
        await this.connect();
      }
      const currentWallet = wallet;
      const currentAccount = account;
      if (!currentWallet || !currentAccount) {
        throw new Error('Connect MetaMask Solana before verifying it.');
      }

      const signMessage = currentWallet.features['solana:signMessage']?.signMessage;
      if (!signMessage) {
        throw new Error('This Solana wallet does not support message signing.');
      }

      const challenge = await walletAuthService.createChallenge({
        walletAddress: currentAccount.address,
        walletChain: 'SOLANA',
      });
      const [{ signature }] = await signMessage({
        account: currentAccount,
        message: new TextEncoder().encode(challenge.message),
      });
      await walletAuthService.verify({
        challengeId: challenge.challengeId,
        walletAddress: currentAccount.address,
        walletChain: 'SOLANA',
        signature: bs58.encode(signature),
      });
      setConnected(currentAccount, true);
    },
    async sendPreparedAction(action: PreparedWalletAction): Promise<WalletTxResult> {
      if (action.kind !== 'solana_transaction') {
        throw new Error('Unsupported wallet action for Solana adapter.');
      }
      if (new Date(action.expiresAt).getTime() <= Date.now()) {
        throw new Error('Prepared Solana transaction expired');
      }
      if (action.transactionEncoding !== 'base64') {
        throw new Error('Unsupported Solana transaction encoding.');
      }
      if (!wallet || !account) {
        throw new Error('Connect MetaMask Solana before continuing.');
      }

      const signAndSendTransaction = wallet.features['solana:signAndSendTransaction']?.signAndSendTransaction;
      if (!signAndSendTransaction) {
        throw new Error('This Solana wallet does not support sign-and-send transactions.');
      }

      const chain = assertSolanaMainnetWalletChainId(action.walletChainId);
      let result: readonly [{ signature: Uint8Array }];
      try {
        result = await signAndSendTransaction({
          account,
          transaction: decodeBase64(action.transaction),
          chain,
        });
      } catch (error) {
        throw new Error(normalizeError(error));
      }
      const [{ signature }] = result;

      return {
        paymentIntentId: action.paymentIntentId,
        preparedActionId: action.preparedActionId,
        chain: 'SOLANA',
        txIdKind: 'solana_signature',
        txId: bs58.encode(signature),
      };
    },
  };
}
