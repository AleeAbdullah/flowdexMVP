'use client';

import { useEffect } from 'react';
import { createAppKit, useAppKitTheme } from '@reown/appkit/react';
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin';
import { TronAdapter } from '@reown/appkit-adapter-tron';
import { bitcoin, tronMainnet } from '@reown/appkit/networks';
import { OkxWalletAdapter } from '@tronweb3/tronwallet-adapter-okxwallet';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink';
import { TrustAdapter } from '@tronweb3/tronwallet-adapter-trust';
import { useTheme } from 'next-themes';
import { Env } from '@/libs/Env';

export const configuredReownProjectId = Env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || null;

const projectId = configuredReownProjectId ?? 'walletconnect-project-id-not-configured';
const appUrl = (Env.NEXT_PUBLIC_APP_URL?.trim() || 'https://flowdexprotocol.com').replace(/\/$/u, '');
const supportedBitcoinWalletIds = [
  '2a87d74ae02e10bdd1f51f7ce6c4e1cc53cd5f2c0b6b5ad0d7b3007d2b13de7b', // Xverse
  '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX
  '483afe1df1df63daf313109971ff3ef8356ddf1cc4e45877d205eee0b7893a13', // Leather
  'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
];
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
  const bitcoinAdapter = new BitcoinAdapter({ projectId });
  const tronAdapter = new TronAdapter({
    walletAdapters: [
      new TronLinkAdapter({
        checkTimeout: 2_000,
      }),
      new OkxWalletAdapter({
        checkTimeout: 2_000,
      }),
      new TrustAdapter({
        checkTimeout: 2_000,
      }),
    ],
  });

  createAppKit({
    adapters: [bitcoinAdapter, tronAdapter],
    networks: [bitcoin, tronMainnet],
    defaultNetwork: bitcoin,
    defaultAccountTypes: { bip122: 'payment' },
    projectId,
    themeMode: 'dark',
    themeVariables: reownThemeVariables,
    metadata: {
      name: 'FlowDex',
      description: 'FlowDex Protocol',
      url: appUrl,
      icons: [`${appUrl}/favicon.ico`],
    },
    allWallets: 'HIDE',
    featuredWalletIds: supportedBitcoinWalletIds,
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
