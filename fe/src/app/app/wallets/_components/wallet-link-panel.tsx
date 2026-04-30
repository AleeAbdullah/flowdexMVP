'use client';

import { AuthCard } from '@account-kit/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WALLET_NETWORKS, WALLET_PROVIDERS, type WalletNetwork, type WalletProvider } from '@/dal/app/wallets/wallets.types';
import { GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import type { useMetaMaskWallet } from '../hooks/use-metamask-wallet';
import { NETWORK_LABELS } from '../constants';

type MetaMaskState = ReturnType<typeof useMetaMaskWallet>;

export function WalletLinkPanel(props: {
  state: {
    embeddedAddress: string | null | undefined;
    isLoadingAccount: boolean;
    network: WalletNetwork;
    provider: WalletProvider;
    setNetwork: (value: WalletNetwork) => void;
    setProvider: (value: WalletProvider) => void;
  };
  metaMask: MetaMaskState;
  actions: {
    isLinking: boolean;
    onLinkWallet: () => Promise<void>;
  };
}) {
  const connectedAddress = props.state.provider === WALLET_PROVIDERS.ALCHEMY_EMBEDDED
    ? (props.state.embeddedAddress ?? 'Authenticate to provision a smart wallet address')
    : (props.metaMask.account ?? 'Connect MetaMask to select an account');

  return (
    <GlassPanel className="p-6 space-y-5">
      <SectionHeading
        eyebrow="Wallets"
        title="Use embedded Alchemy wallets as the primary account path."
        description="Manual challenge-signature verification is removed. Authenticate with embedded email login, then persist wallet linkage in the backend ledger system."
      />

      <div className="space-y-4 rounded-[1.5rem] border border-cyan-400/12 bg-cyan-400/6 p-5">
        <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">V1 Flow</div>
        <ol className="space-y-3 text-sm leading-7 text-[var(--text)]">
          <li>1. Sign in using embedded email auth.</li>
          <li>2. Derive your smart wallet address.</li>
          <li>3. Link that wallet to your app identity.</li>
          <li>4. Use it for simulation, execution tracking, and analytics.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
          Wallet Provider
        </div>
        <Select value={props.state.provider} onValueChange={(value: WalletProvider) => props.state.setProvider(value)}>
          <SelectTrigger className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={WALLET_PROVIDERS.ALCHEMY_EMBEDDED}>Alchemy Embedded</SelectItem>
            <SelectItem value={WALLET_PROVIDERS.METAMASK}>MetaMask</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {props.state.provider === WALLET_PROVIDERS.ALCHEMY_EMBEDDED ? (
        <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <AuthCard />
        </div>
      ) : (
        <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text)]">
          {props.metaMask.isAvailable
            ? `MetaMask detected${props.metaMask.account ? ` • ${props.metaMask.account}` : ''}`
            : 'MetaMask not detected. Install extension to continue.'}
        </div>
      )}

      <div className="space-y-3">
        <div className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
          Target Network
        </div>
        <Select value={props.state.network} onValueChange={(value: WalletNetwork) => props.state.setNetwork(value)}>
          <SelectTrigger className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]">
            <SelectValue placeholder="Choose network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={WALLET_NETWORKS.BASE_SEPOLIA}>Base Sepolia</SelectItem>
            <SelectItem value={WALLET_NETWORKS.ETH_SEPOLIA}>Ethereum Sepolia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text)]">
        <div className="font-semibold">Connected Address</div>
        <div className="mt-2 break-all text-[color-mix(in_srgb,var(--text)_65%,transparent)]">
          {connectedAddress}
        </div>
        {props.state.provider === WALLET_PROVIDERS.ALCHEMY_EMBEDDED && props.state.isLoadingAccount ? (
          <div className="mt-2 text-xs text-[var(--muted)]">Provisioning embedded wallet…</div>
        ) : null}
        {props.state.provider === WALLET_PROVIDERS.METAMASK && props.metaMask.chainId ? (
          <div className="mt-2 text-xs text-[var(--muted)]">
            Current chain: {NETWORK_LABELS[props.state.network]}
          </div>
        ) : null}
      </div>

      <Button
        variant="brand"
        className="w-full"
        disabled={props.actions.isLinking}
        onClick={() => {
          void props.actions.onLinkWallet();
        }}
      >
        {props.actions.isLinking ? 'Linking…' : 'Link wallet'}
      </Button>
    </GlassPanel>
  );
}
