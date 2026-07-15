'use client';

import { useMemo, type ReactNode } from 'react';
import { alchemy, baseSepolia, mainnet, sepolia } from '@account-kit/infra';
import { AlchemyAccountProvider, configForExternalWallets, createConfig } from '@account-kit/react';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateConnectorFn } from 'wagmi';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import {
  buildWalletSupportRegistry,
  getAccountKitWalletOrder,
  getFeaturedWalletCount,
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

    const walletSupportRegistry = buildWalletSupportRegistry();
    const accountKitWalletOrder = getAccountKitWalletOrder(walletSupportRegistry);
    const featuredWalletCount = getFeaturedWalletCount(walletSupportRegistry);
    const hideMoreButton = accountKitWalletOrder.length <= featuredWalletCount;
    const externalWalletConfig = configForExternalWallets({
      wallets: accountKitWalletOrder,
      chainType: ['evm'],
      hideMoreButton,
      numFeaturedWallets: featuredWalletCount,
    });
    const connectors: CreateConnectorFn[] = [];

    accountKitWalletOrder.forEach((walletName) => {
      switch (walletName) {
        case 'metamask':
          connectors.push(
            metaMask({
              enableAnalytics: false,
            }) as CreateConnectorFn,
          );
          break;
        case 'coinbase wallet':
          connectors.push(coinbaseWallet() as CreateConnectorFn);
          break;
        default:
          break;
      }
    });

    return createConfig(
      {
        transport: alchemy({ apiKey }),
        chain: mainnet,
        chains: [
          { chain: mainnet },
          { chain: baseSepolia },
          { chain: sepolia },
        ],
        ssr: true,
        connectors,
      },
      {
        auth: {
          sections: [[{
            type: 'external_wallets',
            ...externalWalletConfig.uiConfig,
          }]],
        },
        modalBaseClassName: 'flowdex-account-kit-modal',
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
