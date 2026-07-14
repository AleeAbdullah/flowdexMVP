'use client';

import { create } from 'zustand';
import type {
  TronPreparedWalletAction,
  WalletTxResult,
} from '../types/checkout-wallet.types';

type TronWalletState = {
  address: string | null;
  connectorName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isConfigured: boolean;
  isReady: boolean;
  walletChainId: string | null;
  openSelector: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendPreparedAction: (
    action: TronPreparedWalletAction,
    checkoutToken: string,
  ) => Promise<WalletTxResult>;
};

const runtimeUnavailable = async (): Promise<never> => {
  throw new Error('Wallet connection is still loading. Please try again.');
};

const initialTronWallet: TronWalletState = {
  address: null,
  connectorName: null,
  isConnected: false,
  isConnecting: false,
  isConfigured: false,
  isReady: false,
  walletChainId: null,
  openSelector: runtimeUnavailable,
  disconnect: runtimeUnavailable,
  sendPreparedAction: runtimeUnavailable,
};

type ReownCheckoutStore = {
  isTronRuntimeLoaded: boolean;
  tron: TronWalletState;
  setTronRuntimeLoaded: (isTronRuntimeLoaded: boolean) => void;
  setTron: (wallet: TronWalletState) => void;
};

export const useReownCheckoutStore = create<ReownCheckoutStore>(set => ({
  isTronRuntimeLoaded: false,
  tron: initialTronWallet,
  setTronRuntimeLoaded: isTronRuntimeLoaded => set({ isTronRuntimeLoaded }),
  setTron: tron => set({ tron }),
}));
