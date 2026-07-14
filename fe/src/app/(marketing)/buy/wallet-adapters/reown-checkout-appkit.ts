'use client';

import { useEffect } from 'react';
import { createAppKit, useAppKitTheme } from '@reown/appkit/react';
import { TronAdapter } from '@reown/appkit-adapter-tron';
import { tronMainnet } from '@reown/appkit/networks';
import { useTheme } from 'next-themes';
import { Env } from '@/libs/Env';

export const configuredReownProjectId = Env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || null;

const projectId = configuredReownProjectId ?? 'walletconnect-project-id-not-configured';
const appUrl = (Env.NEXT_PUBLIC_APP_URL?.trim() || 'https://flowdexprotocol.com').replace(/\/$/u, '');
const reownThemeVariables = {
  '--apkt-font-family': 'var(--font-dm-sans), "DM Sans", sans-serif',
  '--apkt-accent': 'var(--accent-strong)',
  '--apkt-color-mix': 'var(--bg)',
  '--apkt-color-mix-strength': 20,
  '--apkt-font-size-master': '9px',
  '--apkt-border-radius-master': '3px',
  '--apkt-qr-color': 'var(--accent-strong)',
};

if (typeof window !== 'undefined') {
  const tronAdapter = new TronAdapter();

  createAppKit({
    adapters: [tronAdapter],
    networks: [tronMainnet],
    defaultNetwork: tronMainnet,
    projectId,
    themeMode: 'dark',
    themeVariables: reownThemeVariables,
    metadata: {
      name: 'FlowDex',
      description: 'FlowDex Protocol',
      url: appUrl,
      icons: [`${appUrl}/favicon.ico`],
    },
    allWallets: 'SHOW',
    enableWallets: true,
    enableInjected: true,
    enableWalletConnect: true,
    enableCoinbase: false,
    enableBaseAccount: false,
    enableWalletGuide: false,
    features: {
      analytics: false,
      email: false,
      socials: false,
      onramp: false,
      swaps: false,
      receive: false,
      send: false,
      history: false,
      connectorTypeOrder: ['injected', 'walletConnect', 'featured', 'recommended'],
    },
  });
}

export function useReownCheckoutTheme() {
  const { resolvedTheme } = useTheme();
  const { setThemeMode, setThemeVariables } = useAppKitTheme();

  useEffect(() => {
    setThemeMode(resolvedTheme === 'light' ? 'light' : 'dark');
    setThemeVariables(reownThemeVariables);
  }, [resolvedTheme, setThemeMode, setThemeVariables]);
}
