import { API_ROUTES } from '@/api-routes';
import type { ITransactionListItem } from '@/dal/app/transactions/transactions.types';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';
import { BackendApiError, backendFetchJson } from '@/lib/auth-server';
import { notFound, unstable_rethrow } from 'next/navigation';

export default async function TransactionDetailRoute(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await props.params;
  let transaction: ITransactionListItem;

  try {
    transaction = await backendFetchJson<ITransactionListItem>(API_ROUTES.backend.transactions.detail(id));
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }

    unstable_rethrow(error);
    throw error;
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          eyebrow="Transaction Detail"
          title={`${transaction.assetCode} ledger lifecycle`}
          description="Canonical receipt and status view for backend-ledger transactions sourced from simulation, tracking submissions, webhook ingestion, and transfer backfill."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_45%,transparent)] uppercase">Status</div>
            <StatusPill status={transaction.status} />
          </div>
          <DataKicker label="Amount" value={formatPlainNumber(transaction.amount, 6)} />
          <DataKicker label="Network" value={transaction.network} />
          <DataKicker label="Asset" value={transaction.assetCode} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DataKicker label="Ledger ID" value={transaction.id} />
            <DataKicker label="Wallet" value={transaction.walletAddress ? truncateMiddle(transaction.walletAddress) : 'Unavailable'} />
            <DataKicker label="Operation ID" value={transaction.operationId ?? 'Not set'} />
            <DataKicker label="Tx Hash" value={transaction.txHash ? truncateMiddle(transaction.txHash) : 'Pending'} />
            <DataKicker label="Block Number" value={transaction.blockNumber ?? 'Pending'} />
            <DataKicker label="Block Time" value={formatDateTime(transaction.blockTime)} />
            <DataKicker label="Confirmed At" value={formatDateTime(transaction.confirmedAt)} />
            <DataKicker label="Last Update" value={formatDateTime(transaction.updatedAt)} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          {transaction.failureReason ? (
            <div className="mb-5 rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              Failure reason: {transaction.failureReason}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="text-lg font-bold text-[var(--text)]">Lifecycle notes</div>
            <p className="text-sm leading-7 text-[var(--muted)]">
              Submitted and pending statuses are expected before webhook confirmations arrive. Once confirmed, the block metadata is persisted in this ledger record.
            </p>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
