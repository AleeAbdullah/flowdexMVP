'use client';

import { create } from 'zustand';
import type {
  BitcoinPreparedWalletAction,
  TronPreparedWalletAction,
  WalletTxResult,
} from '../types/checkout-wallet.types';

type BitcoinWalletState = {
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

const initialBitcoinWallet: BitcoinWalletState = {
  address: null,
  connectorName: null,
  isConnected: false,
  isConnecting: false,
  isConfigured: false,
  isReady: false,
  openSelector: runtimeUnavailable,
  disconnect: runtimeUnavailable,
  sendPreparedAction: runtimeUnavailable,
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
  isRuntimeLoaded: boolean;
  bitcoin: BitcoinWalletState;
  tron: TronWalletState;
  setRuntimeLoaded: (isRuntimeLoaded: boolean) => void;
  setBitcoin: (wallet: BitcoinWalletState) => void;
  setTron: (wallet: TronWalletState) => void;
};

export const useReownCheckoutStore = create<ReownCheckoutStore>(set => ({
  isRuntimeLoaded: false,
  bitcoin: initialBitcoinWallet,
  tron: initialTronWallet,
  setRuntimeLoaded: isRuntimeLoaded => set({ isRuntimeLoaded }),
  setBitcoin: bitcoin => set({ bitcoin }),
  setTron: tron => set({ tron }),
}));
