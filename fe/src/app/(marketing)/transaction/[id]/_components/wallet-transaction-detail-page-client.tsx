'use client';

import Link from 'next/link';
import { AuthCard, useSigner, useSignerStatus, useUser } from '@account-kit/react';
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
import { useTransaction } from '@/dal/app/transactions/transactions.services';
import { useWalletSession } from '@/dal/app/wallet-auth/wallet-auth.services';
import { Loader2, ReceiptText, ShieldCheck } from '@/icons';
import { useWalletSessionSync } from '@/hooks/use-wallet-session-sync';
import { ROUTES } from '@/routes';

function normalizeWalletAddress(address: string | null | undefined) {
  return address?.trim().toLowerCase() ?? null;
}

export function WalletTransactionDetailPageClient(props: {
  id: string;
}) {
  const signerStatus = useSignerStatus();
  const signer = useSigner();
  const user = useUser();
  const walletSessionQuery = useWalletSession();

  const connectedWalletAddress = user?.address ?? null;
  const walletSession = walletSessionQuery.data;
  const sessionWalletAddress = walletSession?.walletAddressNormalized ?? null;
  const walletSupportRegistry = buildWalletSupportRegistry({
    walletConnectEnabled: getWalletSupportRuntime().walletConnectEnabled,
  });
  const primaryWalletSupportCopy = getPrimaryWalletSupportCopy(walletSupportRegistry);
  const directWalletSupportCopy = getDirectWalletSupportCopy(walletSupportRegistry);
  const walletConnectCompatibilityCopy = getWalletConnectCompatibilityCopy(walletSupportRegistry);
  const normalizedConnected = normalizeWalletAddress(connectedWalletAddress);
  const normalizedSession = normalizeWalletAddress(sessionWalletAddress);
  const isWalletVerified = Boolean(normalizedConnected && normalizedSession && normalizedConnected === normalizedSession);

  useWalletSessionSync({
    connectedWalletAddress,
    connectedSignerReference: signer,
    sessionWalletAddress,
    isWalletConnected: Boolean(signerStatus.isConnected && connectedWalletAddress),
  });

  const transactionQuery = useTransaction(walletSession?.walletAddressNormalized, props.id);
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
          <DataKicker label="Connected Wallet" value={connectedWalletAddress ? truncateMiddle(connectedWalletAddress) : 'Not connected'} />
          <DataKicker label="Status" value={transaction?.status ?? 'Pending lookup'} />
        </div>
      </GlassPanel>

      {!signerStatus.isConnected ? (
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
              <p>{walletConnectCompatibilityCopy}</p>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {signerStatus.isConnected && !isWalletVerified ? (
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
          {walletSessionQuery.isLoading || transactionQuery.isLoading ? (
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
                  <div className="rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
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
