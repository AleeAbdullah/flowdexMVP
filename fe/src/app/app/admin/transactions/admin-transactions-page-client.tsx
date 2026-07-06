'use client';

import { useState } from 'react';
import { useQueryStates } from 'nuqs';
import { useAdminPayments } from '@/dal/app/admin/admin.services';
import type { IAdminPaymentsResponse } from '@/dal/app/admin/admin.types';
import { GlassPanel } from '@/components/glass-panel';
import { SectionHeading } from '@/components/flowdex/primitives';
import { AdminTransactionMetrics } from './_components/admin-transaction-metrics';
import { AdminTransactionsFilters } from './_components/admin-transactions-filters';
import { AdminTransactionsList } from './_components/admin-transactions-list';
import { adminTransactionFilterParsers } from './filter-parsers';
import { defaultAdminTransactionFilters } from './filters';

export function AdminTransactionsPageClient(props: {
  initialData: IAdminPaymentsResponse;
}) {
  const [filters, setFilters] = useQueryStates(adminTransactionFilterParsers);
  const [expandedIntentId, setExpandedIntentId] = useState<string | null>(null);
  const query = useAdminPayments(filters, props.initialData);
  const items = query.data?.items ?? [];

  const handleToggleExpanded = (intentId: string) => {
    setExpandedIntentId(current => current === intentId ? null : intentId);
  };

  return (
    <>
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Admin Payments"
          title="Monitor the operational lifecycle behind user-visible payment state."
          description="Filter payments by status, wallet, network, asset, or date window for manual allocation review."
        />
        <AdminTransactionMetrics items={items} />
      </GlassPanel>

      <AdminTransactionsFilters
        filters={filters}
        onUpdateFilters={setFilters}
        onResetFilters={() => setFilters(defaultAdminTransactionFilters)}
      />

      <AdminTransactionsList
        items={items}
        isLoading={query.isLoading}
        errorMessage={query.isError
          ? query.error instanceof Error
            ? query.error.message
            : 'Could not load admin payments.'
          : null}
        expandedIntentId={expandedIntentId}
        onToggleExpanded={handleToggleExpanded}
      />
    </>
  );
}
