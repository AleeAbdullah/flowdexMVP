'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES, getLoginRoute } from '@/routes';

export function useBuyPageActions(props: {
  isAuthenticated: boolean;
  walletConnected: boolean;
  setWalletConnected: (connected: boolean) => void;
  userDisplay: string;
}) {
  const router = useRouter();

  const handleConnectWallet = () => {
    if (!props.isAuthenticated) {
      router.push(getLoginRoute(ROUTES.MARKETING.BUY));
      return;
    }

    props.setWalletConnected(true);
    toast.success(`Wallet connected for ${props.userDisplay}`);
  };

  const handleDisconnectWallet = () => {
    props.setWalletConnected(false);
  };

  const handlePrimaryAction = () => {
    if (!props.isAuthenticated) {
      router.push(getLoginRoute(ROUTES.MARKETING.BUY));
      return;
    }

    if (!props.walletConnected) {
      handleConnectWallet();
      return;
    }

    router.push(ROUTES.WORKSPACE.BUY);
  };

  const handleCopyReferral = async (referralLink: string) => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied');
    } catch {
      toast.info(referralLink);
    }
  };

  return {
    handleConnectWallet,
    handleDisconnectWallet,
    handlePrimaryAction,
    handleCopyReferral,
  };
}
