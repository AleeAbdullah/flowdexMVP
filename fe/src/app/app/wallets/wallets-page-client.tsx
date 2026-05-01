'use client';

import { useState } from 'react';
import { useAccount, useUser } from '@account-kit/react';
import type { IWalletListResponse } from '@/dal/app/wallets/wallets.types';
import { WALLET_NETWORKS, WALLET_PROVIDERS, type WalletNetwork, type WalletProvider } from '@/dal/app/wallets/wallets.types';
import { useWallets } from '@/dal/app/wallets/wallets.services';
import { LinkedWalletsPanel } from './_components/linked-wallets-panel';
import { WalletLinkPanel } from './_components/wallet-link-panel';
import { useMetaMaskWallet } from './hooks/use-metamask-wallet';
import { useWalletLinkActions } from './hooks/use-wallet-link-actions';

export function WalletsPageClient(props: {
  initialData: IWalletListResponse;
}) {
  const walletsQuery = useWallets(props.initialData);
  const user = (useUser() as { id?: string; userId?: string } | null) ?? null;
  const { address, isLoadingAccount } = useAccount({
    type: 'ModularAccountV2',
  });
  const metaMask = useMetaMaskWallet();
  const [network, setNetwork] = useState<WalletNetwork>(WALLET_NETWORKS.BASE_SEPOLIA);
  const [provider, setProvider] = useState<WalletProvider>(WALLET_PROVIDERS.ALCHEMY_EMBEDDED);
  const wallets = walletsQuery.data?.items ?? [];
  const canLinkAlchemy = Boolean(address && user && !isLoadingAccount);
  const actions = useWalletLinkActions({
    provider,
    network,
    embeddedAddress: address,
    canLinkAlchemy,
    accountUser: user,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <WalletLinkPanel
        state={{
          embeddedAddress: address,
          isLoadingAccount,
          network,
          provider,
          setNetwork,
          setProvider,
        }}
        metaMask={metaMask}
        actions={{
          isLinking: actions.linkMutation.isPending || actions.challengeMutation.isPending,
          onLinkWallet: actions.handleLinkWallet,
        }}
      />

      <LinkedWalletsPanel
        wallets={wallets}
        deleteState={{
          isPending: actions.deleteMutation.isPending,
          onDeleteWallet: actions.handleDeleteWallet,
        }}
        errorMessage={walletsQuery.isError
          ? walletsQuery.error instanceof Error
            ? walletsQuery.error.message
            : 'Could not load linked wallets.'
          : null}
        isLoading={walletsQuery.isLoading}
      />
    </div>
  );
}
