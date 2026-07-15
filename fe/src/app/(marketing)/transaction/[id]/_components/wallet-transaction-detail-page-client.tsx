'use client';

import Link from 'next/link';
import { AuthCard } from '@account-kit/react';
import {
  buildWalletSupportRegistry,
  getDirectWalletSupportCopy,
  getPrimaryWalletSupportCopy,
} from '@/constants/wallet-support';
import { GlassPanel } from '@/components/glass-panel';
import { DataKicker, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { useTransaction } from '@/dal/app/transactions/transactions.services';
import { Loader2, ReceiptText, ShieldCheck } from '@/icons';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';
import { ROUTES } from '@/routes';

export function WalletTransactionDetailPageClient(props: {
  id: string;
}) {
  const marketingWallet = useMarketingWalletSync();
  const provider = useMarketingWalletStore((state) => state.provider);
  const verification = useMarketingWalletStore((state) => state.verification);
  const walletSupportRegistry = buildWalletSupportRegistry();
  const primaryWalletSupportCopy = getPrimaryWalletSupportCopy(walletSupportRegistry);
  const directWalletSupportCopy = getDirectWalletSupportCopy(walletSupportRegistry);
  const isWalletConnected = provider.status === 'connected';
  const isWalletVerified = verification.status === 'verified' && Boolean(verification.walletAddress);

  const transactionQuery = useTransaction(isWalletVerified ? verification.walletAddress : null, props.id);
  const transaction = transactionQuery.data;

  return (
    <div className="section-shell section-pad space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Receipt"
          title="Purchase receipt."
          description="Review the details for this purchase from the connected wallet."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Wallet Status" value={isWalletVerified ? 'Verified' : 'Verification required'} />
          <DataKicker label="Receipt ID" value={props.id} />
          <DataKicker label="Connected Wallet" value={provider.address ? truncateMiddle(provider.address) : 'Not connected'} />
          <DataKicker label="Status" value={transaction?.status ?? 'Pending lookup'} />
        </div>
      </GlassPanel>

      {!isWalletConnected ? (
        <GlassPanel className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <ShieldCheck className="h-4 w-4 text-[var(--cyan)]" />
              Connect a wallet to open this receipt
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">{primaryWalletSupportCopy}</p>
            <AuthCard className="flowdex-account-kit" />
            <div className="space-y-2 text-sm leading-6 text-[var(--muted)]">
              <p>{directWalletSupportCopy}</p>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {isWalletConnected && !isWalletVerified ? (
        <GlassPanel className="p-6">
          <p className="text-sm leading-7 text-[var(--muted)]">
            Verify this wallet before opening receipts.
          </p>
          <div className="mt-4">
            <Button variant="brand" asChild>
              <Link href={ROUTES.USER.BUY}>Verify wallet</Link>
            </Button>
          </div>
        </GlassPanel>
      ) : null}

      {isWalletVerified ? (
        <>
          {marketingWallet.walletSessionQuery.isLoading || transactionQuery.isLoading ? (
            <GlassPanel className="p-6">
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading receipt…
              </div>
            </GlassPanel>
          ) : null}

          {transactionQuery.isError ? (
            <GlassPanel className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <ReceiptText className="h-4 w-4 text-[var(--cyan)]" />
                Receipt unavailable
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                This receipt isn’t available for the connected wallet.
              </p>
              <div className="mt-4">
                <Button variant="glass" asChild>
                  <Link href={ROUTES.USER.TRANSACTIONS}>Back to transactions</Link>
                </Button>
              </div>
            </GlassPanel>
          ) : null}

          {transaction ? (
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <GlassPanel className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_45%,transparent)] uppercase">Status</div>
                    <StatusPill status={transaction.status} />
                  </div>
                  <DataKicker label="Receipt ID" value={transaction.publicId} />
                  <DataKicker label="Wallet" value={truncateMiddle(transaction.walletAddressChecksum)} />
                  <DataKicker label="Network" value={transaction.network} />
                  <DataKicker label="Asset" value={transaction.assetCode} />
                  <DataKicker label="Amount" value={`${transaction.amountDisplay} ${transaction.assetCode}`} />
                  <DataKicker label="Recipient" value={truncateMiddle(transaction.expectedRecipientAddress)} />
                  <DataKicker label="Tx Hash" value={transaction.txHash ? truncateMiddle(transaction.txHash) : 'Pending'} />
                  <DataKicker label="Block Number" value={transaction.blockNumber ?? 'Pending'} />
                  <DataKicker label="Created" value={formatDateTime(transaction.createdAt)} />
                  <DataKicker label="Confirmed" value={formatDateTime(transaction.confirmedAt)} />
                  <DataKicker label="Updated" value={formatDateTime(transaction.updatedAt)} />
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                {transaction.failureReason ? (
                  <div className="rounded-[1rem] border border-[var(--status-error-border)] bg-[var(--status-error-surface)] px-4 py-3 text-sm text-[var(--status-error-text)]">
                    Issue: {transaction.failureReason}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    Pending receipts update automatically after the transaction is confirmed on-chain.
                  </p>
                )}

                <div className="mt-5">
                  <Button variant="glass" asChild>
                    <Link href={ROUTES.USER.TRANSACTIONS}>Back to transactions</Link>
                  </Button>
                </div>
              </GlassPanel>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
