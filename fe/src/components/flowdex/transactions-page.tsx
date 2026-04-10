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
          title="Track purchase intents, chain progress, and refund status."
          description="This is the user-facing read model for the backend lifecycle. It now exposes reported versus matched hashes, machine-readable verification issues, refund posture, and confirmed timestamps in one place."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Transactions" value={`${items.length}`} />
          <Metric label="Confirmed" value={`${items.filter(item => item.status === 'CONFIRMED').length}`} />
          <Metric label="Pending" value={`${items.filter(item => item.status === 'PENDING').length}`} />
          <Metric label="Refunded" value={`${items.filter(item => item.status === 'REFUNDED').length}`} />
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-[var(--flowdex-card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">
          Transaction History
        </div>
        <div>
          {transactionsQuery.isError ? (
            <div className="px-6 py-5 text-sm text-rose-200">
              {transactionsQuery.error instanceof Error ? transactionsQuery.error.message : 'Could not load protected transactions.'}
            </div>
          ) : null}

          {transactionsQuery.isLoading ? (
            <div className="px-6 py-5 text-sm text-[var(--flowdex-muted)]">Loading transactions...</div>
          ) : null}

          {!transactionsQuery.isLoading && items.length === 0 ? (
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-[var(--flowdex-muted)]">
                No protected transactions yet. Create a purchase intent from the app buy flow when you are ready.
              </p>
              <Button variant="brand" asChild>
                <Link href="/app/buy">Go to protected buy</Link>
              </Button>
            </div>
          ) : null}

          {items.map(item => (
            <div
              key={item.id}
              className="flex flex-col gap-4 border-b border-[var(--flowdex-card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-semibold text-[var(--flowdex-text)]">{item.assetCode} on {item.chain}</div>
                  <StatusPill status={item.status} />
                </div>
                <div className="text-sm text-[color-mix(in_srgb,var(--flowdex-text)_45%,transparent)]">Intent {item.id}</div>
                <div className="text-sm text-[color-mix(in_srgb,var(--flowdex-text)_40%,transparent)]">
                  {item.matchedTxHash
                    ? `Matched hash: ${truncateMiddle(item.matchedTxHash)}`
                    : item.reportedTxHash
                      ? `Reported hash: ${truncateMiddle(item.reportedTxHash)}`
                      : 'Waiting for a reported or matched chain hash'}
                </div>
                {item.verificationFailureReason ? (
                  <div className="text-sm text-rose-200">
                    Verification issue: {item.verificationFailureReason}
                  </div>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-4 xl:min-w-[42rem]">
                <Metric label="Amount" value={`${formatPlainNumber(item.amountPaid, 6)} ${item.assetCode}`} />
                <Metric label="Tokens" value={item.tokensAllocated ? formatPlainNumber(item.tokensAllocated, 6) : 'Pending'} />
                <Metric label="Confirmations" value={`${item.confirmations}`} />
                <Metric label="Confirmed" value={formatDateTime(item.confirmedAt)} />
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
      <div className="text-[10px] font-semibold tracking-[0.3em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">{props.label}</div>
      <div className="font-data text-base text-[var(--flowdex-text)]">{props.value}</div>
    </div>
  );
}
