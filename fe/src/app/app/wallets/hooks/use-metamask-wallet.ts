'use client';

import { useEffect, useMemo, useState } from 'react';
import { getEthereumProvider } from '../../_utils/ethereum-provider';

export function useMetaMaskWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const isAvailable = useMemo(() => Boolean(getEthereumProvider()), []);

  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      return;
    }

    const refreshState = async () => {
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        const chainHex = await ethereum.request({ method: 'eth_chainId' }) as string;
        setAccount(accounts[0]?.toLowerCase() ?? null);
        setChainId(Number.parseInt(chainHex, 16));
      } catch {
        setAccount(null);
        setChainId(null);
      }
    };

    void refreshState();

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

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      ethereum.removeListener?.('chainChanged', handleChainChanged);
      ethereum.removeListener?.('disconnect', handleDisconnect);
    };
  }, []);

  return {
    account,
    chainId,
    isAvailable,
  };
}
