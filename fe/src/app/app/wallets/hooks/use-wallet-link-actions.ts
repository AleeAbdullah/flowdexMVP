'use client';

import { WALLET_PROVIDERS, type WalletNetwork, type WalletProvider } from '@/dal/app/wallets/wallets.types';
import { useCreateWalletChallenge, useDeleteWallet, useLinkWallet } from '@/dal/app/wallets/wallets.services';
import { formatMetaMaskNetworkSwitchMessage, getMetaMaskProvider } from '../../_utils/ethereum-provider';
import { NETWORK_CHAIN_IDS, NETWORK_LABELS } from '../constants';

type AccountUser = {
  id?: string;
  userId?: string;
} | null;

export function useWalletLinkActions(input: {
  provider: WalletProvider;
  network: WalletNetwork;
  embeddedAddress: string | null | undefined;
  canLinkAlchemy: boolean;
  accountUser: AccountUser;
}) {
  const challengeMutation = useCreateWalletChallenge();
  const linkMutation = useLinkWallet();
  const deleteMutation = useDeleteWallet();

  const handleLinkWallet = async () => {
    const chainId = NETWORK_CHAIN_IDS[input.network];

    if (input.provider === WALLET_PROVIDERS.ALCHEMY_EMBEDDED) {
      if (!input.embeddedAddress || !input.accountUser || !input.canLinkAlchemy) {
        return;
      }

      await linkMutation.mutateAsync({
        provider: input.provider,
        network: input.network,
        chainId,
        address: input.embeddedAddress,
        alchemyAccountId: input.accountUser.userId ?? input.accountUser.id ?? input.embeddedAddress,
        alchemyWalletId: `${input.network}:${input.embeddedAddress.toLowerCase()}`,
      });
      return;
    }

    const ethereum = getMetaMaskProvider();
    if (!ethereum) {
      throw new Error('MetaMask not available');
    }

    const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
    const account = String(accounts[0] ?? '').toLowerCase();
    if (!account) {
      throw new Error('No MetaMask account selected');
    }

    const chainHex = await ethereum.request({ method: 'eth_chainId' }) as string;
    const detectedChainId = Number.parseInt(chainHex, 16);
    if (detectedChainId !== chainId) {
      throw new Error(formatMetaMaskNetworkSwitchMessage(NETWORK_LABELS[input.network]));
    }

    const challenge = await challengeMutation.mutateAsync({
      provider: WALLET_PROVIDERS.METAMASK,
      network: input.network,
      chainId,
      address: account,
      origin: window.location.origin,
    });
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [challenge.message, account],
    }) as string;

    await linkMutation.mutateAsync({
      provider: WALLET_PROVIDERS.METAMASK,
      network: input.network,
      chainId,
      address: account,
      challengeId: challenge.challengeId,
      signature,
    });
  };

  return {
    challengeMutation,
    deleteMutation,
    handleDeleteWallet: deleteMutation.mutateAsync,
    handleLinkWallet,
    linkMutation,
  };
}
