import { API_ROUTES } from '@/api-routes';
import type { IAdminTransactionListItem } from '@/dal/app/admin/admin.types';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, truncateMiddle } from '@/components/flowdex/utils';
import { BackendApiError, backendFetchJson } from '@/lib/auth-server';
import { notFound, unstable_rethrow } from 'next/navigation';
import { AdminReconcileButton } from './reconcile-button';

export default async function AdminTransactionDetailRoute(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await props.params;
  let transaction: IAdminTransactionListItem;

  try {
    transaction = await backendFetchJson<IAdminTransactionListItem>(API_ROUTES.backend.admin.transactions.detail(id));
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }

    unstable_rethrow(error);
    throw error;
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Admin Transaction Detail"
          title={`${transaction.assetCode} operational lifecycle`}
          description="This detail view is the admin counterpart to the user receipt screen with user, wallet, and lifecycle context."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_45%,transparent)] uppercase">Status</div>
            <StatusPill status={transaction.status} />
          </div>
          <DataKicker label="Wallet" value={transaction.walletAddress ? truncateMiddle(transaction.walletAddress) : 'Unavailable'} />
          <DataKicker label="Public ID" value={transaction.publicId} />
          <DataKicker label="Network" value={transaction.network} />
        </div>
        <div>
          <AdminReconcileButton transactionId={transaction.id} status={transaction.status} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DataKicker label="Transaction ID" value={transaction.id} />
            <DataKicker label="Asset" value={`${transaction.assetCode} on ${transaction.network}`} />
            <DataKicker label="Amount" value={`${transaction.amountDisplay} ${transaction.assetCode}`} />
            <DataKicker label="Tx Hash" value={transaction.txHash ? truncateMiddle(transaction.txHash) : 'Pending'} />
            <DataKicker label="Block Number" value={transaction.blockNumber ?? 'Pending'} />
            <DataKicker label="Confirmed At" value={formatDateTime(transaction.confirmedAt)} />
            <DataKicker label="Simulation ID" value={transaction.simulationId ?? 'Not set'} />
            <DataKicker label="Recipient" value={truncateMiddle(transaction.expectedRecipientAddress)} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          {transaction.failureReason ? (
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--text)]">Failure reason</div>
              <p className="text-sm leading-7 text-rose-100">
                {transaction.failureReason}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--text)]">Lifecycle posture</div>
              <p className="text-sm leading-7 text-[var(--muted)]">
                No failure reason is currently attached to this transaction.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <DataKicker label="Created" value={formatDateTime(transaction.createdAt)} />
            <DataKicker label="Last Updated" value={formatDateTime(transaction.updatedAt)} />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
