'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminStats } from '@/dal/app/hooks';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';
import { formatDateTime, formatPlainNumber } from './utils';

export function AdminDashboardPage() {
  const statsQuery = useAdminStats();
  const stats = statsQuery.data;

  if (statsQuery.isLoading) {
    return (
      <GlassPanel className="p-6 text-sm text-[var(--muted)]">
        Loading admin operational summary...
      </GlassPanel>
    );
  }

  if (statsQuery.isError || !stats) {
    return (
      <GlassPanel className="border border-rose-400/20 bg-rose-500/10 p-6">
        <div className="text-lg font-bold text-[var(--text)]">Admin summary unavailable</div>
        <p className="mt-3 text-sm leading-7 text-rose-100">
          {statsQuery.error instanceof Error
            ? statsQuery.error.message
            : 'The admin summary could not be loaded.'}
        </p>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Admin"
          title="Operate ledger-backed transaction state from a single surface."
          description="This panel is focused on ledger throughput, status health, and lifecycle visibility across tracked transactions."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Total Tracked" value={`${stats.totalTransactionCount}`} />
          <DataKicker label="Active" value={`${stats.activeTransactionCount}`} />
          <DataKicker label="Confirmed" value={`${stats.confirmedTransactionCount}`} />
          <DataKicker label="Statuses" value={`${Object.keys(stats.transactionCountsByStatus).length}`} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="p-5">
          <DataKicker label="Confirmed Volume" value={formatPlainNumber(stats.totalConfirmedVolume, 2)} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Finalized ledger volume from confirmed transactions.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <DataKicker label="Failed or Dropped" value={`${stats.failedTransactionCount}`} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Transactions that failed execution or were dropped before confirmation.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <DataKicker label="Last Update" value={formatDateTime(stats.lastTransactionAt)} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Most recent ledger update time across all tracked transactions.</p>
        </GlassPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ActionCard
          href="/app/admin/transactions"
          title="Transactions"
          description="Filter operational transaction history by status, network, asset, user, or date window."
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <ActionCard
          href="/app/transactions"
          title="User Surface"
          description="Open the user-facing ledger view to compare admin and end-user transaction visibility."
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      <GlassPanel className="p-6">
        <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Lifecycle Status Mix</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Object.entries(stats.transactionCountsByStatus).map(([status, count]) => (
            <div key={status} className="rounded-[1.2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
              <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">{status}</div>
              <div className="font-data mt-3 text-2xl text-[var(--text)]">{count}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

function ActionCard(props: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-3 text-[var(--cyan)]">
        {props.icon}
        <div className="text-lg font-bold text-[var(--text)]">{props.title}</div>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{props.description}</p>
      <div className="mt-4">
        <Button variant="glass" asChild>
          <Link href={props.href}>Open {props.title.toLowerCase()}</Link>
        </Button>
      </div>
    </GlassPanel>
  );
}
