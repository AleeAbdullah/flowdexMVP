import Link from 'next/link';
import { API_ROUTES } from '@/api-routes';
import type { IDashboardSummary } from '@/dal/app/dashboard/dashboard.types';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, BarChart3, Wallet } from '@/icons';
import { backendFetchJson } from '@/lib/auth-server';
import { ROUTES } from '@/routes';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';

export default async function AppIndex() {
  const summary = await backendFetchJson<IDashboardSummary>(API_ROUTES.backend.dashboard.summary);
  const hasWallet = summary.walletSummary.linkedWalletCount > 0;

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Dashboard"
          title="Manage your wallet activity."
          description="Review linked wallets, transaction volume, current activity, and the next action for your account."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Profile Role" value={summary.profile.role} />
          <DataKicker label="Wallets Linked" value={`${summary.walletSummary.linkedWalletCount}`} />
          <DataKicker label="Confirmed" value={`${summary.confirmedTransactionCount}`} />
          <DataKicker label="Active" value={`${summary.activeTransactionCount}`} />
        </div>
      </GlassPanel>

      {!hasWallet ? (
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[var(--text)]">No wallet linked yet</div>
                <p className="mt-1 text-sm leading-6 text-amber-700">
                  Link a wallet to run transaction checks and track your activity.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:pl-4">
              <Button variant="brand" size="sm" asChild>
                <Link href={ROUTES.WORKSPACE.WALLETS}>Link wallet</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 text-cyan-200">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-[0.24em] uppercase">Confirmed Volume</span>
          </div>
          <div className="font-data mt-4 text-2xl text-[var(--text)]">
            {formatPlainNumber(summary.totalTrackedVolume, 6)}
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Confirmed volume across tracked transactions.</p>
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
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Network: {summary.walletSummary.primaryWallet?.network ?? 'N/A'}</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 text-cyan-200">
            <ArrowRight className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-[0.24em] uppercase">Next Action</span>
          </div>
          <div className="mt-4 text-lg font-bold text-[var(--text)]">
            {hasWallet ? 'Run a transaction check' : 'Connect a wallet'}
          </div>
          <div className="mt-4">
            <Button variant="glass" asChild>
              <Link href={hasWallet ? ROUTES.WORKSPACE.BUY : ROUTES.WORKSPACE.WALLETS}>
                {hasWallet ? 'Go to buy' : 'Go to wallets'}
              </Link>
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
                No tracked transactions yet. Run a transaction check and track your first receipt.
              </p>
              <Button variant="brand" asChild>
                <Link href={hasWallet ? ROUTES.WORKSPACE.BUY : ROUTES.WORKSPACE.WALLETS}>
                  {hasWallet ? 'Open buy' : 'Link wallet'}
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
                    <div className="font-semibold text-[var(--text)]">{transaction.assetCode} on {transaction.network}</div>
                    <StatusPill status={transaction.status} />
                  </div>
                  <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                    {transaction.txHash
                      ? `Tx hash ${truncateMiddle(transaction.txHash)}`
                      : transaction.operationId
                          ? `Operation ${transaction.operationId}`
                          : 'Awaiting identifiers'}
                  </div>
                  {transaction.failureReason ? (
                    <div className="text-sm text-rose-200">
                      Failure: {transaction.failureReason}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[28rem]">
                  <DataKicker label="Amount" value={`${formatPlainNumber(transaction.amount, 6)} ${transaction.assetCode}`} />
                  <DataKicker label="Status" value={transaction.status} />
                  <DataKicker label="Updated" value={formatDateTime(transaction.updatedAt)} />
                </div>
                <Button variant="glass" asChild>
                  <Link href={ROUTES.WORKSPACE.transactionDetail(transaction.id)}>Open detail</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
