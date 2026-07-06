import Link from 'next/link';
import { API_ROUTES } from '@/api-routes';
import type { IAdminStats } from '@/dal/app/admin/admin.types';
import { Button } from '@/components/ui/button';
import { BarChart3, ShieldCheck } from '@/icons';
import { backendFetchJson } from '@/lib/auth-server';
import { ROUTES } from '@/routes';
import { GlassPanel } from '@/components/glass-panel';
import { DataKicker, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, formatPlainNumber } from '@/components/flowdex/utils';
import type { ReactNode } from 'react';

export default async function AdminIndexRoute() {
  const stats = await backendFetchJson<IAdminStats>(API_ROUTES.backend.admin.stats);
  const statusEntries = Object.entries(stats.countsByStatus);
  const volumeByChainEntries = Object.entries(stats.volumeByChain);

  return (
    <>
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Admin"
          title="Monitor payment operations."
          description="Review tracked presale volume, status health, and lifecycle visibility across user payments."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Total Tracked" value={`${stats.totalPaymentCount}`} />
          <DataKicker label="Pending" value={`${stats.pendingPaymentCount}`} />
          <DataKicker label="Confirmed" value={`${stats.confirmedPaymentCount}`} />
          <DataKicker label="Statuses" value={`${statusEntries.length}`} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="p-5">
          <DataKicker label="Confirmed Volume" value={`$${formatPlainNumber(stats.totalConfirmedUsd, 2)}`} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Finalized USD volume from confirmed payments.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <DataKicker label="Failed" value={`${stats.failedPaymentCount}`} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Payments that failed or need a new purchase intent.</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <DataKicker label="Last Update" value={formatDateTime(stats.latestPaymentAt)} />
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Most recent update time across all tracked payments.</p>
        </GlassPanel>
      </div>

      {volumeByChainEntries.length > 0 ? (
        <GlassPanel className="p-6">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Confirmed Volume by Chain
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {volumeByChainEntries.map(([chain, volume]) => (
              <div key={chain} className="rounded-[1.2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                  {chain}
                </div>
                <div className="font-data mt-3 text-2xl text-[var(--text)]">
                  ${formatPlainNumber(volume, 2)}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ActionCard
          href={ROUTES.ADMIN.TRANSACTIONS}
          title="Payments"
          description="Filter operational payment history by status, network, asset, wallet, or date window."
          icon={<ShieldCheck className="h-5 w-5" />}
          primary
        />
        <ActionCard
          href={ROUTES.USER.TRANSACTIONS}
          title="User Surface"
          description="Open the user-facing payment history view to compare admin and end-user visibility."
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      <GlassPanel className="p-6">
        <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
          Lifecycle Status Mix
        </div>
        {statusEntries.length === 0 ? (
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            No payment intents tracked yet. Status breakdown will appear once payments are recorded.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {statusEntries.map(([status, count]) => (
              <div key={status} className="rounded-[1.2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <StatusPill status={status} />
                <div className="font-data mt-4 text-2xl text-[var(--text)]">{count}</div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </>
  );
}

function ActionCard(props: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  primary?: boolean;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-3 text-[var(--cyan)]">
        {props.icon}
        <div className="text-lg font-bold text-[var(--text)]">{props.title}</div>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{props.description}</p>
      <div className="mt-4">
        <Button variant={props.primary ? 'brand' : 'glass'} asChild>
          <Link href={props.href}>Open {props.title.toLowerCase()}</Link>
        </Button>
      </div>
    </GlassPanel>
  );
}
