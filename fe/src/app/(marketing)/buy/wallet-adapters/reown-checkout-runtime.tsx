'use client';

import { useEffect, useRef } from 'react';
import { useBitcoinAppKitCheckoutWallet } from './bitcoin-appkit-checkout-wallet';
import { useReownCheckoutTheme } from './reown-checkout-appkit';
import { useReownCheckoutStore } from './reown-checkout-store';
import { useTronAppKitCheckoutWallet } from './tron-appkit-checkout-wallet';

export function ReownCheckoutRuntime() {
  useReownCheckoutTheme();
  const bitcoinWallet = useBitcoinAppKitCheckoutWallet();
  const tronWallet = useTronAppKitCheckoutWallet();
  const bitcoinRef = useRef(bitcoinWallet);
  const tronRef = useRef(tronWallet);
  const setBitcoin = useReownCheckoutStore(state => state.setBitcoin);
  const setTron = useReownCheckoutStore(state => state.setTron);
  const setRuntimeLoaded = useReownCheckoutStore(state => state.setRuntimeLoaded);

  bitcoinRef.current = bitcoinWallet;
  tronRef.current = tronWallet;

  useEffect(() => {
    setRuntimeLoaded(true);
    return () => setRuntimeLoaded(false);
  }, [setRuntimeLoaded]);

  useEffect(() => {
    setBitcoin({
      address: bitcoinWallet.address,
      connectorName: bitcoinWallet.connectorName,
      isConnected: bitcoinWallet.isConnected,
      isConnecting: bitcoinWallet.isConnecting,
      isConfigured: bitcoinWallet.isConfigured,
      isReady: bitcoinWallet.isReady,
      openSelector: () => bitcoinRef.current.openSelector(),
      disconnect: () => bitcoinRef.current.disconnect(),
      sendPreparedAction: action => bitcoinRef.current.sendPreparedAction(action),
    });
  }, [
    bitcoinWallet.address,
    bitcoinWallet.connectorName,
    bitcoinWallet.isConfigured,
    bitcoinWallet.isConnected,
    bitcoinWallet.isConnecting,
    bitcoinWallet.isReady,
    setBitcoin,
  ]);

  useEffect(() => {
    setTron({
      address: tronWallet.address,
      connectorName: tronWallet.connectorName,
      isConnected: tronWallet.isConnected,
      isConnecting: tronWallet.isConnecting,
      isConfigured: tronWallet.isConfigured,
      isReady: tronWallet.isReady,
      walletChainId: tronWallet.walletChainId,
      openSelector: () => tronRef.current.openSelector(),
      disconnect: () => tronRef.current.disconnect(),
      sendPreparedAction: (action, checkoutToken) => (
        tronRef.current.sendPreparedAction(action, checkoutToken)
      ),
    });
  }, [
    setTron,
    tronWallet.address,
    tronWallet.connectorName,
    tronWallet.isConfigured,
    tronWallet.isConnected,
    tronWallet.isConnecting,
    tronWallet.isReady,
    tronWallet.walletChainId,
  ]);

  return null;
}
