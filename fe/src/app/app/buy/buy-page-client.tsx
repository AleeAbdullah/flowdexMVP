'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Wallet } from '@/icons';
import type { IWalletListResponse } from '@/dal/app/wallets/wallets.types';
import { Button } from '@/components/ui/button';
import { DataKicker, GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import { ROUTES } from '@/routes';
import { BuySetupPanel } from './_components/buy-setup-panel';
import { BuyTrackingPanel } from './_components/buy-tracking-panel';
import { ProtectedBuyPageProvider, useProtectedBuyPage } from './buy-page-context';

export function BuyPageClient(props: {
  initialWallets: IWalletListResponse;
}) {
  return (
    <ProtectedBuyPageProvider initialWallets={props.initialWallets}>
      <BuyPageContent />
    </ProtectedBuyPageProvider>
  );
}

function BuyPageContent() {
  const buyPage = useProtectedBuyPage();

  return (
    <div className="grid min-h-0 gap-4 lg:h-[calc(100dvh-8.25rem)] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <GlassPanel className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-5">
        <SectionHeading
          as="h1"
          eyebrow="Execution"
          title="Run a transaction check"
          description="Choose a linked wallet, review the destination, and track the transaction details from one focused workspace."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <DataKicker label="Linked Wallets" value={`${buyPage.wallets.length}`} />
          <DataKicker label="Network" value={buyPage.selectedWallet?.network ?? 'Select wallet'} />
          <DataKicker label="Check" value={buyPage.simulationStateLabel} />
          <DataKicker label="Receipt" value={buyPage.lastTrackStatus ?? 'Not tracked'} />
        </div>
      </GlassPanel>

      {buyPage.wallets.length === 0 ? (
        <GlassPanel className="grid content-start gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:p-5">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--cyan)]">
              <Wallet className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-[var(--text)]">Connect a wallet to continue</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Add an embedded wallet or MetaMask account, then return here to run checks and track transaction details.
              </p>
              <Button className="mt-4 h-10" variant="brand" asChild>
                <Link href={ROUTES.WORKSPACE.WALLETS}>Open wallets</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_42%,transparent)] p-3 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--cyan)]" aria-hidden />
              Wallet required
            </div>
            <p className="mt-2 text-xs leading-5">
              Linked wallets appear here once setup is complete.
            </p>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid min-h-0 gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:overflow-hidden">
          <BuySetupPanel />
          <div className="grid min-h-0 gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
            <GlassPanel className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                  Next step
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-[var(--text)]">
                  Run a check, then track the transaction receipt.
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-[var(--cyan)]" aria-hidden />
            </GlassPanel>
            <BuyTrackingPanel />
          </div>
        </div>
      )}
    </div>
  );
}
