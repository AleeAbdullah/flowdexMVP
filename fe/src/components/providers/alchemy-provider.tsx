'use client';

import { useMemo, type ReactNode } from 'react';
import { alchemy, baseSepolia } from '@account-kit/infra';
import { AlchemyAccountProvider, configForExternalWallets, createConfig } from '@account-kit/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  buildWalletSupportRegistry,
  getAccountKitWalletOrder,
  getFeaturedWalletCount,
  getWalletSupportRuntime,
} from '@/constants/wallet-support';
import { Env } from '@/libs/Env';

export function AlchemyProvider(props: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const apiKey = Env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  const config = useMemo(() => {
    if (!apiKey) {
      return null;
    }

    const walletSupportRuntime = getWalletSupportRuntime({
      alchemyApiKey: apiKey,
    });

    const walletSupportRegistry = buildWalletSupportRegistry({
      walletConnectEnabled: walletSupportRuntime.walletConnectEnabled,
    });
    const accountKitWalletOrder = getAccountKitWalletOrder(walletSupportRegistry);
    const featuredWalletCount = getFeaturedWalletCount(walletSupportRegistry);
    const hideMoreButton = accountKitWalletOrder.length <= featuredWalletCount;
    const externalWalletConfig = configForExternalWallets({
      wallets: accountKitWalletOrder,
      chainType: ['evm'],
      walletConnectProjectId: walletSupportRuntime.walletConnectProjectId ?? undefined,
      hideMoreButton,
      numFeaturedWallets: featuredWalletCount,
    });

      return createConfig(
        {
          transport: alchemy({ apiKey }),
          chain: baseSepolia,
          ssr: true,
        connectors: externalWalletConfig.connectors,
      },
      {
        auth: {
          sections: [[{
            type: 'external_wallets',
            ...externalWalletConfig.uiConfig,
            walletConnectProjectId: walletSupportRuntime.walletConnectProjectId ?? undefined,
          }]],
        },
      },
    );
  }, [apiKey]);

  if (!config) {
    return <>{props.children}</>;
  }

  return (
    <AlchemyAccountProvider config={config} queryClient={queryClient}>
      {props.children}
    </AlchemyAccountProvider>
  );
}
