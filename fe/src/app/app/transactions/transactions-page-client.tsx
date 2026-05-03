'use client';

import Link from 'next/link';
import { TRANSACTION_STATUSES, isLiveTransactionStatus, type ITransactionsResponse } from '@/dal/app/transactions/transactions.types';
import { useTransactions } from '@/dal/app/transactions/transactions.services';
import { Button } from '@/components/ui/button';
import { GlassPanel, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';
import { ROUTES } from '@/routes';

export function TransactionsPageClient(props: {
  initialData: ITransactionsResponse;
}) {
  const transactionsQuery = useTransactions(props.initialData);
  const items = transactionsQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Transactions"
          title="Transaction history"
          description="Review tracked transactions, current statuses, confirmations, and the details connected to your wallet activity."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Transactions" value={`${items.length}`} />
          <Metric label="Confirmed" value={`${items.filter(item => item.status === TRANSACTION_STATUSES.CONFIRMED).length}`} />
          <Metric label="Pending" value={`${items.filter(item => isLiveTransactionStatus(item.status)).length}`} />
          <Metric label="Failed" value={`${items.filter(item => item.status === TRANSACTION_STATUSES.FAILED).length}`} />
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
                No tracked transactions yet. Run a transaction check and track a new receipt from the buy workspace.
              </p>
              <Button variant="brand" asChild>
                <Link href={ROUTES.WORKSPACE.BUY}>Open buy</Link>
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
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">Transaction ID {item.id}</div>
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
                <Link href={ROUTES.WORKSPACE.transactionDetail(item.id)}>View detail</Link>
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
