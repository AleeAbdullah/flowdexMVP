import { walletAuthService } from '@/dal/app/wallet-auth/wallet-auth.services';
import {
  TIP6963_ANNOUNCE_PROVIDER,
  TIP6963_REQUEST_PROVIDER,
  TRON_MAINNET_CHAIN_ID_DECIMAL,
  TRON_MAINNET_WALLET_CHAIN_ID,
  TRON_WALLET_NETWORK_ID,
} from '../constants/tronlink';
import type { CheckoutWalletAdapter, CheckoutWalletStatus } from './checkout-wallet-adapter';
import type { PreparedWalletAction, WalletTxResult } from '../types/checkout-wallet.types';

type TronProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  chainId?: string;
  tronWeb?: TronWebInstance;
  isTronLink?: boolean;
};

type TronWebInstance = {
  defaultAddress?: {
    base58?: string;
    hex?: string;
  };
  trx: {
    signMessageV2: (hexMessage: string) => Promise<string>;
  };
  contract: () => {
    at: (address: string) => Promise<TronContractInstance>;
  };
};

type TronContractInstance = {
  transfer: (recipient: string, amount: string | number) => {
    send: (options: { feeLimit: number }) => Promise<string>;
  };
};

declare global {
  interface Window {
    tron?: TronProvider;
    tronLink?: {
      ready?: boolean;
      tronWeb?: TronWebInstance;
      request?: TronProvider['request'];
      on?: TronProvider['on'];
      removeListener?: TronProvider['removeListener'];
      chainId?: string;
    };
  }
}

export type TronCheckoutWalletAdapterState = {
  address: string | null;
  walletChainId: string | null;
  walletNetworkId: string | null;
  isConnected: boolean;
  isVerified: boolean;
  isReady: boolean;
  error: string | null;
};

export const initialTronCheckoutWalletAdapterState: TronCheckoutWalletAdapterState = {
  address: null,
  walletChainId: null,
  walletNetworkId: null,
  isConnected: false,
  isVerified: false,
  isReady: false,
  error: null,
};

function normalizeTronWalletChainId(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!normalized || normalized === TRON_MAINNET_WALLET_CHAIN_ID) {
    return TRON_MAINNET_WALLET_CHAIN_ID;
  }

  return null;
}

function utf8ToHex(message: string) {
  const bytes = new TextEncoder().encode(message);
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
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

  return message || 'Could not complete the TronLink request.';
}

async function discoverTronProvider(): Promise<TronProvider | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.tron?.tronWeb) {
    return window.tron;
  }

  const announced = await new Promise<TronProvider | null>((resolve) => {
    let settled = false;
    const finish = (provider: TronProvider | null) => {
      if (settled) {
        return;
      }

      settled = true;
      window.removeEventListener(TIP6963_ANNOUNCE_PROVIDER, onAnnounce);
      resolve(provider);
    };

    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<{ provider?: TronProvider }>).detail;
      if (detail?.provider?.tronWeb) {
        finish(detail.provider);
      }
    };

    window.addEventListener(TIP6963_ANNOUNCE_PROVIDER, onAnnounce);
    window.dispatchEvent(new Event(TIP6963_REQUEST_PROVIDER));
    window.setTimeout(() => finish(window.tron?.tronWeb ? window.tron : null), 1_500);
  });

  if (announced?.tronWeb) {
    return announced;
  }

  if (window.tronLink?.tronWeb) {
    return {
      request: window.tronLink.request ?? (async () => []),
      tronWeb: window.tronLink.tronWeb,
      chainId: window.tronLink.chainId,
      on: window.tronLink.on,
      removeListener: window.tronLink.removeListener,
      isTronLink: true,
    };
  }

  return null;
}

async function readProviderChainId(provider: TronProvider) {
  if (provider.chainId) {
    return provider.chainId;
  }

  try {
    const chainId = await provider.request({ method: 'eth_chainId' });
    return typeof chainId === 'string' ? chainId : null;
  } catch {
    return null;
  }
}

async function readProviderAddress(provider: TronProvider) {
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  const firstAccount = Array.isArray(accounts) ? accounts[0] : null;
  if (typeof firstAccount === 'string' && firstAccount.length > 0) {
    return firstAccount;
  }

  return provider.tronWeb?.defaultAddress?.base58 ?? null;
}

export function createTronLinkCheckoutWalletAdapter(input: {
  getState: () => TronCheckoutWalletAdapterState;
  setState: (state: TronCheckoutWalletAdapterState) => void;
}): CheckoutWalletAdapter {
  let provider: TronProvider | null = null;

  function updateState(patch: Partial<TronCheckoutWalletAdapterState>) {
    input.setState({
      ...input.getState(),
      ...patch,
    });
  }

  async function ensureProvider() {
    if (!provider) {
      provider = await discoverTronProvider();
    }

    if (!provider?.tronWeb) {
      throw new Error('TronLink is not available in this browser.');
    }

    return provider;
  }

  return {
    chain: 'TRON',
    getStatus(): CheckoutWalletStatus | null {
      const state = input.getState();
      if (!state.address) {
        return null;
      }

      return {
        chain: 'TRON',
        address: state.address,
        walletChainId: state.walletChainId ?? TRON_MAINNET_WALLET_CHAIN_ID,
        walletNetworkId: state.walletNetworkId ?? TRON_WALLET_NETWORK_ID,
        connectorName: 'tronlink',
        isConnected: state.isConnected,
        isVerified: state.isVerified,
        isReady: state.isReady,
      };
    },
    async connect() {
      try {
        const nextProvider = await ensureProvider();
        const address = await readProviderAddress(nextProvider);
        const walletChainId = normalizeTronWalletChainId(await readProviderChainId(nextProvider));

        if (!address) {
          throw new Error('TronLink did not return a wallet address.');
        }

        if (!walletChainId) {
          throw new Error('Switch TronLink to Tron Mainnet before continuing.');
        }

        updateState({
          address,
          walletChainId,
          walletNetworkId: TRON_WALLET_NETWORK_ID,
          isConnected: true,
          isVerified: false,
          isReady: walletChainId === TRON_MAINNET_WALLET_CHAIN_ID,
          error: null,
        });
      } catch (error) {
        const message = normalizeError(error);
        updateState({
          address: null,
          walletChainId: null,
          walletNetworkId: null,
          isConnected: false,
          isVerified: false,
          isReady: false,
          error: message,
        });
        throw new Error(message);
      }
    },
    async disconnect() {
      provider = null;
      updateState(initialTronCheckoutWalletAdapterState);
    },
    async verify() {
      const state = input.getState();
      if (!state.address || !state.walletChainId) {
        throw new Error('Connect TronLink before verifying your wallet.');
      }

      const nextProvider = await ensureProvider();
      const challenge = await walletAuthService.createChallenge({
        walletAddress: state.address,
        walletChain: 'TRON',
        chainId: TRON_MAINNET_CHAIN_ID_DECIMAL,
      });
      const hexMessage = utf8ToHex(challenge.message);
      const signature = await nextProvider.tronWeb!.trx.signMessageV2(hexMessage);
      await walletAuthService.verify({
        challengeId: challenge.challengeId,
        walletAddress: state.address,
        walletChain: 'TRON',
        chainId: TRON_MAINNET_CHAIN_ID_DECIMAL,
        signature,
      });

      updateState({
        isVerified: true,
        isReady: true,
        error: null,
      });
    },
    async switchNetwork() {
      const nextProvider = await ensureProvider();
      await nextProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TRON_MAINNET_WALLET_CHAIN_ID }],
      });
      const walletChainId = normalizeTronWalletChainId(await readProviderChainId(nextProvider));
      if (!walletChainId) {
        throw new Error('Switch TronLink to Tron Mainnet before continuing.');
      }

      updateState({
        walletChainId,
        walletNetworkId: TRON_WALLET_NETWORK_ID,
        isReady: true,
        error: null,
      });
    },
    async sendPreparedAction(action: PreparedWalletAction): Promise<WalletTxResult> {
      if (action.kind !== 'tron_transaction') {
        throw new Error('Unsupported wallet action for TronLink adapter.');
      }

      const state = input.getState();
      if (!state.address || !state.isVerified) {
        throw new Error('Connect and verify TronLink before continuing.');
      }

      const nextProvider = await ensureProvider();
      const tronWeb = nextProvider.tronWeb!;
      const contract = await tronWeb.contract().at(action.contractAddress);
      const txId = await contract.transfer(
        action.recipientAddress,
        action.amountBaseUnits,
      ).send({
        feeLimit: Number(action.feeLimitSun),
      });

      if (!txId) {
        throw new Error('TronLink did not return a transaction id.');
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

export function isTronLinkAvailable() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.tron?.tronWeb || window.tronLink?.tronWeb);
}
