'use client';

import Link from 'next/link';
import { Wallet } from '@/icons';
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
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Execution"
          title="Buy and track execution in the ledger."
          description="Recipient is fixed to your configured treasury address. Risk checks run before a transaction is tracked or broadcast."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Linked Wallets" value={`${buyPage.wallets.length}`} />
          <DataKicker label="Network" value={buyPage.selectedWallet?.network ?? 'Select wallet'} />
          <DataKicker label="Simulation" value={buyPage.simulationStateLabel} />
          <DataKicker label="Tracked Status" value={buyPage.lastTrackStatus ?? 'None'} />
        </div>
      </GlassPanel>

      {buyPage.wallets.length === 0 ? (
        <GlassPanel className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--cyan)]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text)]">No linked wallet yet</div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Link an embedded Alchemy wallet or MetaMask wallet before using the protected buy flow.
              </p>
              <Button className="mt-4" variant="brand" asChild>
                <Link href={ROUTES.WORKSPACE.WALLETS}>Open wallets</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <BuySetupPanel />
          <BuyTrackingPanel />
        </div>
      )}
    </div>
  );
}
