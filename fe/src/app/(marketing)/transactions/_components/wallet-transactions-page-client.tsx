'use client';

import Link from 'next/link';
import { AuthCard } from '@account-kit/react';
import {
  buildWalletSupportRegistry,
  getDirectWalletSupportCopy,
  getPrimaryWalletSupportCopy,
  getWalletConnectCompatibilityCopy,
  getWalletSupportRuntime,
} from '@/constants/wallet-support';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/dal/app/transactions/transactions.services';
import { Loader2, ReceiptText, ShieldCheck } from '@/icons';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';
import { ROUTES } from '@/routes';

export function WalletTransactionsPageClient() {
  const marketingWallet = useMarketingWalletSync();
  const provider = useMarketingWalletStore((state) => state.provider);
  const verification = useMarketingWalletStore((state) => state.verification);
  const walletSupportRegistry = buildWalletSupportRegistry({
    walletConnectEnabled: getWalletSupportRuntime().walletConnectEnabled,
  });
  const primaryWalletSupportCopy = getPrimaryWalletSupportCopy(walletSupportRegistry);
  const directWalletSupportCopy = getDirectWalletSupportCopy(walletSupportRegistry);
  const walletConnectCompatibilityCopy = getWalletConnectCompatibilityCopy(walletSupportRegistry);
  const isWalletConnected = provider.status === 'connected';
  const isWalletVerified = verification.status === 'verified' && Boolean(verification.walletAddress);

  const transactionsQuery = useTransactions(isWalletVerified ? verification.walletAddress : null);
  const items = transactionsQuery.data?.items ?? [];
  const confirmedCount = items.filter(item => item.status === 'CONFIRMED').length;
  const pendingCount = items.filter(item => item.status === 'PENDING').length;

  return (
    <div className="section-shell section-pad space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Transactions"
          title="Your purchases."
          description="View recent purchase activity and open each receipt from the connected wallet."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Connected Wallet" value={provider.address ? truncateMiddle(provider.address) : 'Not connected'} />
          <DataKicker label="Wallet Status" value={isWalletVerified ? 'Verified' : 'Verification required'} />
          <DataKicker label="Receipts Loaded" value={`${items.length}`} />
          <DataKicker label="Pending" value={`${pendingCount}`} />
        </div>
      </GlassPanel>

      {!isWalletConnected ? (
        <GlassPanel className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <ShieldCheck className="h-4 w-4 text-[var(--cyan)]" />
              Connect a wallet to view receipts
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">{primaryWalletSupportCopy}</p>
            <AuthCard className="flowdex-account-kit" />
            <div className="space-y-2 text-sm leading-6 text-[var(--muted)]">
              <p>{directWalletSupportCopy}</p>
              <p>{walletConnectCompatibilityCopy}</p>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {isWalletConnected && !isWalletVerified ? (
        <GlassPanel className="p-6">
          <p className="text-sm leading-7 text-[var(--muted)]">
            Verify this wallet before viewing your purchase history.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="brand" asChild>
              <Link href={ROUTES.USER.BUY}>Verify wallet</Link>
            </Button>
            <Button
              variant="glass"
              onClick={() => {
                void marketingWallet.disconnectWallet();
              }}
              disabled={marketingWallet.isDisconnecting}
            >
              Disconnect wallet
            </Button>
          </div>
        </GlassPanel>
      ) : null}

      {isWalletVerified ? (
        <GlassPanel className="overflow-hidden">
          <div className="border-b border-[var(--card-border)] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <ReceiptText className="h-4 w-4 text-[var(--cyan)]" />
                Recent receipts
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                <span>Confirmed {confirmedCount}</span>
                <span>Pending {pendingCount}</span>
              </div>
            </div>
          </div>

          {marketingWallet.walletSessionQuery.isLoading || transactionsQuery.isLoading ? (
            <div className="flex items-center gap-2 px-6 py-5 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading wallet receipts…
            </div>
          ) : null}

          {transactionsQuery.isError ? (
            <div className="px-6 py-5 text-sm text-rose-200">
              {transactionsQuery.error instanceof Error ? transactionsQuery.error.message : 'Could not load wallet receipts.'}
            </div>
          ) : null}

          {!marketingWallet.walletSessionQuery.isLoading && !transactionsQuery.isLoading && !transactionsQuery.isError && items.length === 0 ? (
            <div className="px-6 py-6 text-sm text-[var(--muted)]">
              No purchases yet.
            </div>
          ) : null}

          {items.map(item => (
            <div
              key={item.publicId}
              className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-semibold text-[var(--text)]">{item.assetCode} on {item.network}</div>
                  <StatusPill status={item.status} />
                </div>
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_48%,transparent)]">
                  Receipt {item.publicId}
                </div>
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                  {item.txHash ? `Tx ${truncateMiddle(item.txHash)}` : 'Waiting for chain hash'}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[28rem]">
                <DataKicker label="Amount" value={`${item.amountDisplay} ${item.assetCode}`} />
                <DataKicker label="Created" value={formatDateTime(item.createdAt)} />
                <DataKicker label="Confirmed" value={formatDateTime(item.confirmedAt)} />
              </div>

              <Button variant="glass" asChild>
                <Link href={ROUTES.USER.transactionDetail(item.publicId)}>Open receipt</Link>
              </Button>
            </div>
          ))}
        </GlassPanel>
      ) : null}
    </div>
  );
}
