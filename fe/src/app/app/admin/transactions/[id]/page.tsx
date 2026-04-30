import { API_ROUTES } from '@/api-routes';
import type { ITransactionListItem } from '@/dal/app/transactions/transactions.types';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';
import { BackendApiError, backendFetchJson } from '@/lib/auth-server';
import { notFound, unstable_rethrow } from 'next/navigation';
import { AdminReconcileButton } from './reconcile-button';

export default async function AdminTransactionDetailRoute(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await props.params;
  let transaction: ITransactionListItem;

  try {
    transaction = await backendFetchJson<ITransactionListItem>(API_ROUTES.backend.admin.transactions.detail(id));
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }

    unstable_rethrow(error);
    throw error;
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Admin Transaction Detail"
          title={`${transaction.assetCode} operational lifecycle`}
          description="This detail view is the admin counterpart to the user receipt screen with user, wallet, and lifecycle context."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_45%,transparent)] uppercase">Status</div>
            <StatusPill status={transaction.status} />
          </div>
          <DataKicker label="User ID" value={transaction.userId} />
          <DataKicker label="Wallet" value={transaction.walletAddress ? truncateMiddle(transaction.walletAddress) : 'Unavailable'} />
          <DataKicker label="Network" value={transaction.network} />
        </div>
        <div>
          <AdminReconcileButton transactionId={transaction.id} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DataKicker label="Transaction ID" value={transaction.id} />
            <DataKicker label="Wallet ID" value={transaction.walletId} />
            <DataKicker label="Asset" value={`${transaction.assetCode} on ${transaction.network}`} />
            <DataKicker label="Amount" value={`${formatPlainNumber(transaction.amount, 6)} ${transaction.assetCode}`} />
            <DataKicker label="Operation" value={transaction.operationId ?? 'Not set'} />
            <DataKicker label="Tx Hash" value={transaction.txHash ? truncateMiddle(transaction.txHash) : 'Pending'} />
            <DataKicker label="Block Number" value={transaction.blockNumber ?? 'Pending'} />
            <DataKicker label="Confirmed At" value={formatDateTime(transaction.confirmedAt)} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          {transaction.failureReason ? (
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--text)]">Failure reason</div>
              <p className="text-sm leading-7 text-rose-100">
                {transaction.failureReason}
              </p>
            </div>
          ) : transaction.settlementDiagnostic ? (
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--text)]">Settlement diagnostic</div>
              <p className="text-sm leading-7 text-amber-100">
                {transaction.settlementDiagnostic}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--text)]">Lifecycle posture</div>
              <p className="text-sm leading-7 text-[var(--muted)]">
                No machine-readable failure reason is currently attached to this ledger transaction.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <DataKicker label="Block Time" value={formatDateTime(transaction.blockTime)} />
            <DataKicker label="Last Updated" value={formatDateTime(transaction.updatedAt)} />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
