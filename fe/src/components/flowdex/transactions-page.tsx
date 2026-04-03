'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/dal/app/hooks';
import { GlassPanel, SectionHeading } from './primitives';

export function TransactionsPage() {
  const transactionsQuery = useTransactions();
  const items = transactionsQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          eyebrow="Transactions"
          title="Track purchase intents, chain progress, and refund status."
          description="This is the user-facing read model for the backend purchase lifecycle. It joins intents, reported chain hashes, token allocations, and refunds into one surface."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Transactions" value={`${items.length}`} />
          <Metric label="Confirmed" value={`${items.filter(item => item.status === 'CONFIRMED').length}`} />
          <Metric label="Pending" value={`${items.filter(item => item.status === 'PENDING').length}`} />
          <Metric label="Refunded" value={`${items.filter(item => item.status === 'REFUNDED').length}`} />
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-white/8 px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
          Transaction History
        </div>
        <div>
          {transactionsQuery.isLoading ? (
            <div className="px-6 py-5 text-sm text-slate-300">Loading transactions...</div>
          ) : null}

          {!transactionsQuery.isLoading && items.length === 0 ? (
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-slate-300">
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
              className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="space-y-1">
                <div className="font-semibold text-white">{item.assetCode} on {item.chain}</div>
                <div className="text-sm text-slate-400">Intent {item.id}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-4 xl:min-w-[42rem]">
                <Metric label="Status" value={item.status} />
                <Metric label="Amount" value={`${item.amountPaid} ${item.assetCode}`} />
                <Metric label="Tokens" value={item.tokensAllocated ?? 'Pending'} />
                <Metric label="Confirmations" value={`${item.confirmations}`} />
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
      <div className="text-[10px] font-semibold tracking-[0.3em] text-slate-500 uppercase">{props.label}</div>
      <div className="font-data text-base text-white">{props.value}</div>
    </div>
  );
}
