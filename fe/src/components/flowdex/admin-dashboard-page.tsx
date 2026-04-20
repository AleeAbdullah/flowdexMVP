'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminStats } from '@/dal/app/hooks';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';
import { formatCurrency, formatPlainNumber } from './utils';

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
          title="Operate the presale through an operational control surface."
          description="This panel stays intentionally narrow in Phase 2: transaction monitoring, reconciliation visibility, refund management, and top-level stats. It is not a full back-office suite."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Current Tier" value={`Tier ${stats.currentTier}`} />
          <DataKicker label="Refund Count" value={`${stats.refundCount}`} />
          <DataKicker label="Unmatched" value={`${stats.unmatchedCount}`} />
          <DataKicker label="Statuses" value={`${Object.keys(stats.transactionCountsByStatus).length}`} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-4">
        <GlassPanel className="p-5">
          <DataKicker label="Confirmed Volume (Real)" value={formatPlainNumber(stats.totalConfirmedVolumeReal, 2)} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Confirmed presale volume from finalized on-chain lifecycle state.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <DataKicker label="Confirmed Volume (Display)" value={formatCurrency(stats.totalConfirmedVolumeDisplay, 0)} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Display-layer marketing multiplier applied on the backend response.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <DataKicker label="Unmatched Events" value={`${stats.unmatchedCount}`} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Chain events that still need operational review or reconciliation context.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <DataKicker label="Refund Queue" value={`${stats.refundCount}`} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Refund records currently tracked by the backend admin lifecycle.</p>
        </GlassPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ActionCard
          href="/app/admin/transactions"
          title="Transactions"
          description="Filter operational transaction history by status, chain, asset, user, or date window."
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <ActionCard
          href="/app/admin/reconciliation"
          title="Reconciliation"
          description="Inspect unmatched blockchain activity and the machine-readable reason the backend attached."
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <ActionCard
          href="/app/admin/refunds"
          title="Refunds"
          description="Review refund records and create a refund for eligible confirmed transactions."
          icon={<ArrowRightLeft className="h-5 w-5" />}
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
