'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminTransactions } from '@/dal/app/hooks';
import type { AdminTransactionFilters } from '@/dal/app/types';
import { GlassPanel, SectionHeading, StatusPill } from './primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from './utils';

const defaultFilters: AdminTransactionFilters = {
  status: '',
  network: '',
  assetCode: '',
  userId: '',
  from: '',
  to: '',
};

export function AdminTransactionsPage() {
  const [filters, setFilters] = useState<AdminTransactionFilters>(defaultFilters);
  const query = useAdminTransactions(filters);
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Admin Transactions"
          title="Monitor the operational lifecycle behind user-visible transaction state."
          description="This panel stays close to the backend filter contract for status review, user lookup, and lifecycle inspection."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FilterMetric label="Loaded" value={`${items.length}`} />
          <FilterMetric label="Confirmed" value={`${items.filter(item => item.status === 'CONFIRMED').length}`} />
          <FilterMetric label="Failed" value={`${items.filter(item => item.status === 'FAILED').length}`} />
          <FilterMetric label="Pending" value={`${items.filter(item => ['SUBMITTED', 'PENDING'].includes(item.status)).length}`} />
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InputField
            label="Status"
            value={filters.status ?? ''}
            onChange={value => setFilters(current => ({ ...current, status: value }))}
            placeholder="CONFIRMED"
          />
          <InputField
            label="Network"
            value={filters.network ?? ''}
            onChange={value => setFilters(current => ({ ...current, network: value }))}
            placeholder="BASE_SEPOLIA"
          />
          <InputField
            label="Asset Code"
            value={filters.assetCode ?? ''}
            onChange={value => setFilters(current => ({ ...current, assetCode: value }))}
            placeholder="USDT_ERC20"
          />
          <InputField
            label="User ID"
            value={filters.userId ?? ''}
            onChange={value => setFilters(current => ({ ...current, userId: value }))}
            placeholder="phase2-user"
          />
          <InputField
            label="From"
            type="datetime-local"
            value={filters.from ?? ''}
            onChange={value => setFilters(current => ({ ...current, from: value }))}
          />
          <InputField
            label="To"
            type="datetime-local"
            value={filters.to ?? ''}
            onChange={value => setFilters(current => ({ ...current, to: value }))}
          />
        </div>
        <div className="mt-4">
          <Button variant="glass" onClick={() => setFilters(defaultFilters)}>
            Reset filters
          </Button>
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
          Operational Transaction List
        </div>
        <div>
          {query.isLoading ? (
            <div className="px-6 py-5 text-sm text-[var(--muted)]">Loading admin transactions...</div>
          ) : null}
          {query.isError ? (
            <div className="px-6 py-5 text-sm text-rose-200">
              {query.error instanceof Error ? query.error.message : 'Could not load admin transactions.'}
            </div>
          ) : null}
          {!query.isLoading && items.length === 0 ? (
            <div className="px-6 py-5 text-sm text-[var(--muted)]">
              No transactions matched the current filter set.
            </div>
          ) : null}
          {items.map(item => (
            <div
              key={item.id}
              className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-semibold text-[var(--text)]">{item.assetCode} on {item.network}</div>
                  <StatusPill status={item.status} />
                </div>
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                  User {item.userId} • Wallet {item.walletAddress ? truncateMiddle(item.walletAddress) : 'Unavailable'}
                </div>
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_40%,transparent)]">
                  {item.txHash
                    ? `Tx ${truncateMiddle(item.txHash)}`
                    : item.operationId
                      ? `Operation ${item.operationId}`
                      : 'No on-chain identifier attached yet'}
                </div>
                {item.failureReason ? (
                  <div className="text-sm text-rose-200">
                    Failure reason: {item.failureReason}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-4 xl:min-w-[42rem]">
                <FilterMetric label="Amount" value={`${formatPlainNumber(item.amount, 6)} ${item.assetCode}`} />
                <FilterMetric label="Block" value={item.blockNumber ?? 'Pending'} />
                <FilterMetric label="Confirmed At" value={formatDateTime(item.confirmedAt)} />
                <FilterMetric label="Updated" value={formatDateTime(item.updatedAt)} />
              </div>

              <Button variant="glass" asChild>
                <Link href={`/app/admin/transactions/${item.id}`}>Open detail</Link>
              </Button>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

function InputField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">{props.label}</span>
      <Input
        type={props.type}
        value={props.value}
        onChange={event => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
      />
    </label>
  );
}

function FilterMetric(props: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">{props.label}</div>
      <div className="font-data text-base text-[var(--text)]">{props.value}</div>
    </div>
  );
}
