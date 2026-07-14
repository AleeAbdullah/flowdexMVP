'use client';

import { useEffect, useState } from 'react';
import { GlassPanel } from '@/components/glass-panel';
import { DataKicker, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePaymentHistory } from '@/dal/app/payments/payments.services';
import { Loader2, ReceiptText, Search, ShieldCheck } from '@/icons';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';

export function WalletTransactionsPageClient() {
  useMarketingWalletSync();
  const provider = useMarketingWalletStore(state => state.provider);
  const verification = useMarketingWalletStore(state => state.verification);
  const connectedLookupAddress = verification.walletAddress ?? provider.address;
  const [walletAddressInput, setWalletAddressInput] = useState(connectedLookupAddress ?? '');
  const [lookupAddress, setLookupAddress] = useState(connectedLookupAddress ?? '');

  useEffect(() => {
    if (!connectedLookupAddress || walletAddressInput) {
      return;
    }

    setWalletAddressInput(connectedLookupAddress);
    setLookupAddress(connectedLookupAddress);
  }, [connectedLookupAddress, walletAddressInput]);

  const paymentsQuery = usePaymentHistory(lookupAddress.trim() || null);
  const items = paymentsQuery.data?.items ?? [];
  const confirmedCount = items.filter(item => item.status === 'CONFIRMED').length;
  const pendingCount = items.filter(item => ['DETECTED', 'CONFIRMING'].includes(item.status)).length;

  return (
    <div className="section-shell section-pad space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Payments"
          title="Your payment history."
          description="Look up presale payments by the wallet address used to pay."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Connected Wallet" value={provider.address ? truncateMiddle(provider.address) : 'Not connected'} />
          <DataKicker label="Lookup Wallet" value={lookupAddress ? truncateMiddle(lookupAddress) : 'Not set'} />
          <DataKicker label="Payments Loaded" value={`${items.length}`} />
          <DataKicker label="Pending" value={`${pendingCount}`} />
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-4 w-4 text-[var(--cyan)]" />
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Search by payment wallet</div>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Wallet connection is optional. Enter the wallet address you used for payment to load matching records.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={walletAddressInput}
                onChange={event => setWalletAddressInput(event.target.value)}
                placeholder="0x... or Solana address"
                className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
              />
              <Button
                variant="brand"
                onClick={() => setLookupAddress(walletAddressInput.trim())}
                disabled={!walletAddressInput.trim()}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-[var(--card-border)] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <ReceiptText className="h-4 w-4 text-[var(--cyan)]" />
              Recent payments
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <span>Confirmed {confirmedCount}</span>
              <span>Pending {pendingCount}</span>
            </div>
          </div>
        </div>

        {paymentsQuery.isLoading ? (
          <div className="flex items-center gap-2 px-6 py-5 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading wallet payments...
          </div>
        ) : null}

        {paymentsQuery.isError ? (
          <div className="border-y border-[var(--status-error-border)] bg-[var(--status-error-surface)] px-6 py-5 text-sm text-[var(--status-error-text)]">
            {paymentsQuery.error instanceof Error ? paymentsQuery.error.message : 'Could not load wallet payments.'}
          </div>
        ) : null}

        {!paymentsQuery.isLoading && !paymentsQuery.isError && lookupAddress && items.length === 0 ? (
          <div className="px-6 py-6 text-sm text-[var(--muted)]">
            No payments found for this wallet.
          </div>
        ) : null}

        {!lookupAddress ? (
          <div className="px-6 py-6 text-sm text-[var(--muted)]">
            Enter a wallet address to load payment history.
          </div>
        ) : null}

        {items.map(item => (
          <div
            key={`${item.intentId}:${item.txHash ?? item.createdAt}`}
            className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="font-semibold text-[var(--text)]">{item.asset} on {item.chain}</div>
                <StatusPill status={item.status} />
              </div>
              <div className="text-sm text-[color-mix(in_srgb,var(--text)_48%,transparent)]">
                Intent {truncateMiddle(item.intentId)}
              </div>
              <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                {item.txHash ? `Tx ${truncateMiddle(item.txHash)}` : 'Waiting for chain hash'}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[28rem]">
              <DataKicker label="Amount" value={`${item.amountBaseUnits} base units`} />
              <DataKicker label="Created" value={formatDateTime(item.createdAt)} />
              <DataKicker label="Confirmed" value={formatDateTime(item.confirmedAt)} />
            </div>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}
