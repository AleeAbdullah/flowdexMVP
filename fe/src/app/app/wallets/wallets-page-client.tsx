'use client';

import { useState } from 'react';
import { useAccount, useUser } from '@account-kit/react';
import { WALLET_NETWORKS, WALLET_PROVIDERS, type IWalletListResponse, type WalletNetwork, type WalletProvider } from '@/dal/app/wallets/wallets.types';
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
  const isLinking = actions.linkMutation.isPending || actions.challengeMutation.isPending;
  const linkWalletBlockReason = getLinkWalletBlockReason({
    accountUser: user,
    embeddedAddress: address,
    isLoadingAccount,
    isLinking,
    isMetaMaskAvailable: metaMask.isAvailable,
    provider,
  });

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
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
          isLinking,
          linkWalletBlockReason,
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

function getLinkWalletBlockReason(input: {
  accountUser: { id?: string; userId?: string } | null;
  embeddedAddress: string | null | undefined;
  isLoadingAccount: boolean;
  isLinking: boolean;
  isMetaMaskAvailable: boolean;
  provider: WalletProvider;
}) {
  if (input.isLinking) {
    return 'Linking is already in progress. Wait for the current wallet link request to finish.';
  }

  if (input.provider === WALLET_PROVIDERS.METAMASK) {
    return input.isMetaMaskAvailable
      ? null
      : 'MetaMask is not available in this browser. Install or enable MetaMask, then try again.';
  }

  if (input.isLoadingAccount) {
    return 'Your embedded wallet address is still being prepared. Wait a moment, then try again.';
  }

  if (!input.accountUser) {
    return 'Sign in with Alchemy embedded wallet access before linking this wallet to FlowDex.';
  }

  if (!input.embeddedAddress) {
    return 'Alchemy has not returned an embedded wallet address yet. Complete the signup or sign-in step first.';
  }

  return null;
}
