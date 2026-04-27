'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/dal/app/hooks';
import { GlassPanel, SectionHeading, StatusPill } from './primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from './utils';

export function TransactionsPage() {
  const transactionsQuery = useTransactions();
  const items = transactionsQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          eyebrow="Transactions"
          title="Ledger-backed execution history"
          description="This view reads durable backend ledger records updated by simulation, tracking submissions, webhook ingestion, and transfer backfill."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Transactions" value={`${items.length}`} />
          <Metric label="Confirmed" value={`${items.filter(item => item.status === 'CONFIRMED').length}`} />
          <Metric label="Pending" value={`${items.filter(item => ['SUBMITTED', 'PENDING'].includes(item.status)).length}`} />
          <Metric label="Failed" value={`${items.filter(item => item.status === 'FAILED').length}`} />
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
          Transaction History
        </div>
        <div>
          {transactionsQuery.isError ? (
            <div className="px-6 py-5 text-sm text-rose-200">
              {transactionsQuery.error instanceof Error ? transactionsQuery.error.message : 'Could not load transactions.'}
            </div>
          ) : null}

          {transactionsQuery.isLoading ? (
            <div className="px-6 py-5 text-sm text-[var(--muted)]">Loading transactions...</div>
          ) : null}

          {!transactionsQuery.isLoading && items.length === 0 ? (
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-[var(--muted)]">
                No tracked transactions yet. Run a simulation and track a new operation from protected buy.
              </p>
              <Button variant="brand" asChild>
                <Link href="/app/buy">Go to protected buy</Link>
              </Button>
            </div>
          ) : null}

          {items.map(item => (
            <div
              key={item.id}
              className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-semibold text-[var(--text)]">{item.assetCode} on {item.network}</div>
                  <StatusPill status={item.status} />
                </div>
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">Ledger id {item.id}</div>
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_40%,transparent)]">
                  {item.txHash ? `Tx hash: ${truncateMiddle(item.txHash)}` : item.operationId ? `Operation: ${item.operationId}` : 'Awaiting tx hash'}
                </div>
                {item.failureReason ? (
                  <div className="text-sm text-rose-200">
                    Failure: {item.failureReason}
                  </div>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-4 xl:min-w-[42rem]">
                <Metric label="Amount" value={`${formatPlainNumber(item.amount, 6)} ${item.assetCode}`} />
                <Metric label="Block" value={item.blockNumber ?? 'Pending'} />
                <Metric label="Confirmed" value={formatDateTime(item.confirmedAt)} />
                <Metric label="Updated" value={formatDateTime(item.updatedAt)} />
              </div>
              <Button variant="glass" asChild>
                <Link href={`/app/transactions/${item.id}`}>View detail</Link>
              </Button>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

function Metric(props: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold tracking-[0.3em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">{props.label}</div>
      <div className="font-data text-base text-[var(--text)]">{props.value}</div>
    </div>
  );
}
