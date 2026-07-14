'use client';

import { useEffect, useRef } from 'react';
import { useReownCheckoutTheme } from './reown-checkout-appkit';
import { useReownCheckoutStore } from './reown-checkout-store';
import { useTronAppKitCheckoutWallet } from './tron-appkit-checkout-wallet';

export function TronReownCheckoutRuntime() {
  useReownCheckoutTheme();
  const tronWallet = useTronAppKitCheckoutWallet();
  const tronRef = useRef(tronWallet);
  const setTron = useReownCheckoutStore(state => state.setTron);
  const setTronRuntimeLoaded = useReownCheckoutStore(state => state.setTronRuntimeLoaded);

  tronRef.current = tronWallet;

  useEffect(() => {
    setTronRuntimeLoaded(true);
    return () => setTronRuntimeLoaded(false);
  }, [setTronRuntimeLoaded]);

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
