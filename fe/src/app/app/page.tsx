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
          eyebrow="Dashboard"
          title="Operate the Alchemy-managed wallet and ledger surface."
          description="All core metrics are now driven by backend ledger records and rollup snapshots, not direct chain reads from the frontend."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Profile Role" value={summary.profile.role} />
          <DataKicker label="Wallets Linked" value={`${summary.walletSummary.linkedWalletCount}`} />
          <DataKicker label="Confirmed" value={`${summary.confirmedTransactionCount}`} />
          <DataKicker label="Active" value={`${summary.activeTransactionCount}`} />
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
                Authenticate and link an embedded wallet to enable simulation and transaction tracking.
              </p>
              <Button variant="brand" asChild>
                <Link href={ROUTES.WORKSPACE.WALLETS}>Link wallet</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>
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
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Confirmed ledger volume across tracked transactions.</p>
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
            {hasWallet ? 'Run simulation and track transaction' : 'Complete wallet linking'}
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
                No ledger transactions yet. Run simulation and track your first transaction.
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
