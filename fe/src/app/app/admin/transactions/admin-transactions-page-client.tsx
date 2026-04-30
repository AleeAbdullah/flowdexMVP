'use client';

import { parseAsString, useQueryStates } from 'nuqs';
import { useAdminTransactions } from '@/dal/app/admin/admin.services';
import type { IAdminTransactionsResponse } from '@/dal/app/admin/admin.types';
import { GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import { AdminTransactionMetrics } from './_components/admin-transaction-metrics';
import { AdminTransactionsFilters } from './_components/admin-transactions-filters';
import { AdminTransactionsList } from './_components/admin-transactions-list';
import { defaultAdminTransactionFilters } from './filters';

export function AdminTransactionsPageClient(props: {
  initialData: IAdminTransactionsResponse;
}) {
  const [filters, setFilters] = useQueryStates({
    status: parseAsString.withDefault(defaultAdminTransactionFilters.status),
    network: parseAsString.withDefault(defaultAdminTransactionFilters.network),
    assetCode: parseAsString.withDefault(defaultAdminTransactionFilters.assetCode),
    userId: parseAsString.withDefault(defaultAdminTransactionFilters.userId),
    from: parseAsString.withDefault(defaultAdminTransactionFilters.from),
    to: parseAsString.withDefault(defaultAdminTransactionFilters.to),
  });
  const query = useAdminTransactions(filters, props.initialData);
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Admin Transactions"
          title="Monitor the operational lifecycle behind user-visible transaction state."
          description="This panel stays close to the backend filter contract for status review, user lookup, and lifecycle inspection."
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
            : 'Could not load admin transactions.'
          : null}
      />
    </div>
  );
}
