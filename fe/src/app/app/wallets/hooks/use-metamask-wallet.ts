'use client';

import { useEffect, useState } from 'react';
import {
  type EthereumProvider,
  getMetaMaskProvider,
  registerEip6963ProviderEvent,
  requestEip6963Providers,
} from '../../_utils/ethereum-provider';

export function useMetaMaskWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let isActive = true;
    let activeProvider: EthereumProvider | null = null;
    let detachProviderListeners: (() => void) | null = null;

    const refreshState = async (ethereum: EthereumProvider) => {
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        const chainHex = await ethereum.request({ method: 'eth_chainId' }) as string;
        if (!isActive) {
          return;
        }

        setAccount(accounts[0]?.toLowerCase() ?? null);
        setChainId(Number.parseInt(chainHex, 16));
      } catch {
        if (!isActive) {
          return;
        }

        setAccount(null);
        setChainId(null);
      }
    };

    const attachProvider = (ethereum: EthereumProvider) => {
      setIsAvailable(true);

      if (activeProvider === ethereum) {
        void refreshState(ethereum);
        return;
      }

      detachProviderListeners?.();
      activeProvider = ethereum;

      const handleAccountsChanged = (accounts: unknown) => {
        const next = Array.isArray(accounts) ? String(accounts[0] ?? '').toLowerCase() : '';
        setAccount(next || null);
      };
      const handleChainChanged = (chain: unknown) => {
        const raw = typeof chain === 'string' ? chain : '';
        setChainId(raw ? Number.parseInt(raw, 16) : null);
      };
      const handleDisconnect = () => {
        setAccount(null);
        setChainId(null);
      };

      ethereum.on?.('accountsChanged', handleAccountsChanged);
      ethereum.on?.('chainChanged', handleChainChanged);
      ethereum.on?.('disconnect', handleDisconnect);

      detachProviderListeners = () => {
        ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        ethereum.removeListener?.('chainChanged', handleChainChanged);
        ethereum.removeListener?.('disconnect', handleDisconnect);
      };

      void refreshState(ethereum);
    };

    const detectProvider = () => {
      const ethereum = getMetaMaskProvider();
      if (!isActive) {
        return;
      }

      if (ethereum) {
        attachProvider(ethereum);
        return;
      }

      detachProviderListeners?.();
      detachProviderListeners = null;
      activeProvider = null;
      setIsAvailable(false);
      setAccount(null);
      setChainId(null);
    };

    const handleProviderAnnounce = (event: Event) => {
      registerEip6963ProviderEvent(event);
      detectProvider();
    };

    window.addEventListener('eip6963:announceProvider', handleProviderAnnounce);
    window.addEventListener('ethereum#initialized', detectProvider);

    requestEip6963Providers();
    detectProvider();
    const injectionCheckTimers = [
      window.setTimeout(detectProvider, 300),
      window.setTimeout(detectProvider, 1000),
    ];

    return () => {
      isActive = false;
      window.removeEventListener('eip6963:announceProvider', handleProviderAnnounce);
      window.removeEventListener('ethereum#initialized', detectProvider);
      injectionCheckTimers.forEach(timer => window.clearTimeout(timer));
      detachProviderListeners?.();
    };
  }, []);

  return {
    account,
    chainId,
    isAvailable,
  };
}
