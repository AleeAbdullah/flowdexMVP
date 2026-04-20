'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, BarChart3, Coins, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardSummary } from '@/dal/app/hooks';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from './primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from './utils';

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const summary = summaryQuery.data;

  if (summaryQuery.isLoading) {
    return (
      <GlassPanel className="p-6 text-sm text-[var(--muted)]">
        Loading dashboard summary, wallet readiness, and recent transaction activity...
      </GlassPanel>
    );
  }

  if (summaryQuery.isError || !summary) {
    return (
      <GlassPanel className="border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-lg font-bold text-[var(--text)]">Dashboard unavailable</div>
        <p className="mt-3 text-sm leading-7 text-rose-100">
          {summaryQuery.error instanceof Error
            ? summaryQuery.error.message
            : 'The protected dashboard could not be loaded.'}
        </p>
      </GlassPanel>
    );
  }

  const hasWallet = summary.walletSummary.linkedWalletCount > 0;

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Dashboard"
          title="Operate the FlowDex MVP from one authenticated command surface."
          description="This dashboard is backed by the Phase 2 backend summary contract. It combines identity, wallet readiness, contribution totals, token allocation, and recent transaction lifecycle state in one place."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Profile Role" value={summary.profile.role} />
          <DataKicker label="Wallets Linked" value={`${summary.walletSummary.linkedWalletCount}`} />
          <DataKicker label="Confirmed Transactions" value={`${summary.confirmedTransactionCount}`} />
          <DataKicker label="Active Intents" value={`${summary.activePurchaseIntentCount}`} />
        </div>
      </GlassPanel>

      {!hasWallet ? (
        <GlassPanel className="border border-amber-300/20 bg-amber-400/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--text)]">No wallet linked yet</div>
              <p className="text-sm leading-7 text-amber-700">
                Your account is active, but protected purchase execution still needs a verified EVM wallet. You can still browse stats and recent lifecycle data without being redirected away from the dashboard.
              </p>
              <Button variant="brand" asChild>
                <Link href="/app/wallets">Link an EVM wallet</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 text-cyan-200">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-[0.24em] uppercase">Total Contributed</span>
          </div>
          <div className="font-data mt-4 text-2xl text-[var(--text)]">
            {formatPlainNumber(summary.totalContributedAmount, 6)}
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Confirmed contribution total across finalized transactions.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 text-cyan-200">
            <Coins className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-[0.24em] uppercase">Allocated Tokens</span>
          </div>
          <div className="font-data mt-4 text-2xl text-[var(--text)]">
            {formatPlainNumber(summary.totalAllocatedTokens, 2)}
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Backend-confirmed token allocation tied to finalized purchase intents.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 text-cyan-200">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-[0.24em] uppercase">Primary Wallet</span>
          </div>
          <div className="mt-4 text-lg font-bold text-[var(--text)]">
            {summary.walletSummary.primaryWallet
              ? truncateMiddle(summary.walletSummary.primaryWallet.address)
              : 'Not linked'}
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Use the wallet screen to add, verify, or rotate the address used for presale actions.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 text-cyan-200">
            <ArrowRight className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-[0.24em] uppercase">Next Action</span>
          </div>
          <div className="mt-4 text-lg font-bold text-[var(--text)]">
            {hasWallet ? 'Create a purchase intent' : 'Complete wallet linking'}
          </div>
          <div className="mt-4">
            <Button variant="glass" asChild>
              <Link href={hasWallet ? '/app/buy' : '/app/wallets'}>
                {hasWallet ? 'Go to protected buy' : 'Go to wallets'}
              </Link>
            </Button>
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Identity</div>
          <div className="mt-4 text-xl font-bold text-[var(--text)]">{summary.profile.email}</div>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Backend role and status are projected here from the authenticated app context, not from browser-only session state.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill status={summary.profile.role} />
            <StatusPill status={summary.profile.status} />
          </div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Wallet Readiness</div>
          <div className="mt-4 text-xl font-bold text-[var(--text)]">
            {hasWallet ? 'Ready for ETH and USDT ERC20 purchases' : 'Wallet verification required'}
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Phase 2 wallet UX is intentionally EVM-only, matching the active ETH and USDT ERC20 buy rails exposed by the backend.
          </p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Quick Actions</div>
          <div className="mt-4 grid gap-3">
            <Button variant="glass" asChild className="justify-between">
              <Link href="/app/account">Review account profile</Link>
            </Button>
            <Button variant="glass" asChild className="justify-between">
              <Link href="/app/wallets">Manage wallets</Link>
            </Button>
            <Button variant="glass" asChild className="justify-between">
              <Link href="/app/transactions">Open transaction history</Link>
            </Button>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
          Recent Transactions
        </div>
        <div>
          {summary.recentTransactions.length === 0 ? (
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-[var(--muted)]">
                No transaction lifecycle exists yet. Once you create a protected purchase intent, the most recent items will surface here.
              </p>
              <Button variant="brand" asChild>
                <Link href={hasWallet ? '/app/buy' : '/app/wallets'}>
                  {hasWallet ? 'Create a purchase intent' : 'Link a wallet'}
                </Link>
              </Button>
            </div>
          ) : (
            summary.recentTransactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-semibold text-[var(--text)]">{transaction.assetCode} on {transaction.chain}</div>
                    <StatusPill status={transaction.status} />
                  </div>
                  <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                    {transaction.matchedTxHash
                      ? `Matched hash ${truncateMiddle(transaction.matchedTxHash)}`
                      : transaction.reportedTxHash
                        ? `Reported hash ${truncateMiddle(transaction.reportedTxHash)}`
                        : 'No hash reported yet'}
                  </div>
                  {transaction.verificationFailureReason ? (
                    <div className="text-sm text-rose-200">
                      Verification issue: {transaction.verificationFailureReason}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[28rem]">
                  <DataKicker label="Amount" value={`${formatPlainNumber(transaction.amountPaid, 6)} ${transaction.assetCode}`} />
                  <DataKicker label="Tokens" value={transaction.tokensAllocated ? formatPlainNumber(transaction.tokensAllocated, 2) : 'Pending'} />
                  <DataKicker label="Updated" value={formatDateTime(transaction.updatedAt)} />
                </div>
                <Button variant="glass" asChild>
                  <Link href={`/app/transactions/${transaction.id}`}>Open detail</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
