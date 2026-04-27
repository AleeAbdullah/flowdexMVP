'use client';

import type { ReactNode } from 'react';
import type { AuthMe } from '@/dal/app/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import LayoutKBar from '@/components/layout/kbar';
import { useTransactions, useWallets } from '@/dal/app/hooks';
import { SignOutButton } from './sign-out-button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export function AppShell({
  children,
  profile,
}: {
  children: ReactNode;
  profile: AuthMe;
}) {
  const walletsQuery = useWallets();
  const transactionsQuery = useTransactions();
  const linkedWallets = walletsQuery.data?.items ?? profile.wallets;
  const activeTxCount = (transactionsQuery.data?.items ?? []).filter(
    item => ['SUBMITTED', 'PENDING'].includes(item.status),
  ).length;
  const primaryWallet = linkedWallets.find(wallet => wallet.isPrimary) ?? linkedWallets[0] ?? null;

  return (
    <LayoutKBar mode="protected">
      <SidebarProvider
        defaultOpen
        className="h-dvh overflow-hidden bg-[linear-gradient(180deg,var(--bg)_0%,color-mix(in_srgb,var(--bg)_70%,var(--bg-2))_45%,var(--bg)_100%)]"
      >
        <AppSidebar profile={profile} />
        <SidebarInset className="min-w-0 h-full min-h-0 overflow-hidden bg-transparent">
          <header className="shrink-0 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-xl">
            <div className="section-shell py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <SidebarTrigger className="border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
                      Authenticated Surface
                    </div>
                    <div className="truncate text-sm text-[color-mix(in_srgb,var(--text)_65%,transparent)]">
                      Alchemy wallet linking, simulation gating, and ledger tracking.
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--text)]">{profile.email}</div>
                    <div className="text-[11px] font-semibold tracking-[0.22em] text-[var(--cyan)] uppercase">
                      {profile.role} • {linkedWallets.length} wallets • {activeTxCount} active tx
                    </div>
                    <div className="truncate text-[11px] text-[color-mix(in_srgb,var(--text)_55%,transparent)]">
                      {primaryWallet ? `${primaryWallet.network} • ${primaryWallet.address}` : 'No wallet linked'}
                    </div>
                  </div>
                  <SignOutButton />
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="section-shell py-6 md:py-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </LayoutKBar>
  );
}
