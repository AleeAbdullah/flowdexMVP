'use client';

import { useMemo, useState } from 'react';
import { AuthCard, useAccount, useUser } from '@account-kit/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeleteWallet, useLinkWallet, useWallets } from '@/dal/app/hooks';
import type { WalletNetwork } from '@/dal/app/types';
import { GlassPanel, SectionHeading } from './primitives';

const NETWORK_LABELS: Record<WalletNetwork, string> = {
  ETH_SEPOLIA: 'Ethereum Sepolia',
  BASE_SEPOLIA: 'Base Sepolia',
};

export function WalletsPage() {
  const walletsQuery = useWallets();
  const linkMutation = useLinkWallet();
  const deleteMutation = useDeleteWallet();
  const { user } = useUser();
  const { address, isLoadingAccount } = useAccount({
    type: 'ModularAccountV2',
  });
  const [network, setNetwork] = useState<WalletNetwork>('BASE_SEPOLIA');
  const accountUser = (user as { id?: string; userId?: string } | null) ?? null;

  const wallets = walletsQuery.data?.items ?? [];
  const canLink = Boolean(address && user && !isLoadingAccount);
  const providerLabel = useMemo(() => 'ALCHEMY_EMBEDDED', []);

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
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
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassPanel className="p-6 space-y-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Embedded Onboarding
          </div>

          <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
            <AuthCard />
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
              Target Network
            </div>
            <Select value={network} onValueChange={(value: WalletNetwork) => setNetwork(value)}>
              <SelectTrigger className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]">
                <SelectValue placeholder="Choose network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASE_SEPOLIA">Base Sepolia</SelectItem>
                <SelectItem value="ETH_SEPOLIA">Ethereum Sepolia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text)]">
            <div className="font-semibold">Connected Address</div>
            <div className="mt-2 break-all text-[color-mix(in_srgb,var(--text)_65%,transparent)]">
              {address ?? 'Authenticate to provision a smart wallet address'}
            </div>
          </div>

          <Button
            variant="brand"
            className="w-full"
            disabled={!canLink || linkMutation.isPending}
            onClick={async () => {
              if (!address || !user) {
                return;
              }

              try {
                await linkMutation.mutateAsync({
                  network,
                  address,
                  alchemyAccountId: accountUser?.userId ?? accountUser?.id ?? address,
                  alchemyWalletId: `${network}:${address.toLowerCase()}`,
                  provider: providerLabel,
                });

                toast.success('Wallet linked');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Could not link wallet');
              }
            }}
          >
            {linkMutation.isPending ? 'Linking...' : 'Link connected smart wallet'}
          </Button>
        </GlassPanel>

        <GlassPanel className="overflow-hidden">
          <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Linked Wallets
          </div>

          {walletsQuery.isError ? (
            <div className="px-6 py-5 text-sm text-rose-200">
              {walletsQuery.error instanceof Error ? walletsQuery.error.message : 'Could not load linked wallets.'}
            </div>
          ) : null}

          {wallets.length === 0 ? (
            <div className="px-6 py-5 text-sm text-[var(--muted)]">
              No linked wallets yet.
            </div>
          ) : wallets.map(wallet => (
            <div
              key={wallet.id}
              className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-semibold text-[var(--text)]">
                  {NETWORK_LABELS[wallet.network] ?? wallet.network}
                </div>
                <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                  {wallet.address}
                </div>
                <div className="mt-1 text-xs text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                  {wallet.provider} • {wallet.alchemyAccountId}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-cyan-200">{wallet.isPrimary ? 'Primary' : 'Linked'}</div>
                <Button
                  variant="glass"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync(wallet.id);
                      toast.success('Wallet removed');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Could not remove wallet');
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </GlassPanel>
      </div>
    </div>
  );
}
