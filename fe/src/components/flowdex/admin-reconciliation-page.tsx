'use client';

import { useAdminUnmatchedTransactions } from '@/dal/app/hooks';
import { GlassPanel, SectionHeading } from './primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from './utils';

export function AdminReconciliationPage() {
  const unmatchedQuery = useAdminUnmatchedTransactions();
  const items = unmatchedQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Reconciliation"
          title="Review unmatched chain events before they become support escalations."
          description="The backend now projects machine-readable reconciliation reasons, so this screen can focus on operator action instead of guesswork."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label="Unmatched Events" value={`${items.length}`} />
          <Stat label="Distinct Reasons" value={`${new Set(items.map(item => item.reconciliationReason ?? 'UNKNOWN')).size}`} />
          <Stat label="ETH Events" value={`${items.filter(item => item.chain === 'ETH').length}`} />
          <Stat label="ERC20 Events" value={`${items.filter(item => item.chain === 'ERC20').length}`} />
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-white/8 px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
          Unmatched Blockchain Activity
        </div>
        <div>
          {unmatchedQuery.isLoading ? (
            <div className="px-6 py-5 text-sm text-slate-300">Loading unmatched events...</div>
          ) : null}
          {unmatchedQuery.isError ? (
            <div className="px-6 py-5 text-sm text-rose-200">
              {unmatchedQuery.error instanceof Error ? unmatchedQuery.error.message : 'Could not load reconciliation data.'}
            </div>
          ) : null}
          {!unmatchedQuery.isLoading && items.length === 0 ? (
            <div className="px-6 py-5 text-sm text-slate-300">
              No unmatched blockchain events are currently projected by the backend.
            </div>
          ) : null}
          {items.map(item => (
            <div
              key={item.id}
              className="grid gap-4 border-b border-white/6 px-6 py-5 last:border-b-0 xl:grid-cols-[1.2fr_1fr_1fr]"
            >
              <div className="space-y-2">
                <div className="font-semibold text-white">{item.assetCode} on {item.chain}</div>
                <div className="text-sm text-slate-400">Tx {truncateMiddle(item.txHash)}</div>
                <div className="text-sm text-rose-200">{item.reconciliationReason ?? 'No reason attached'}</div>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div>From: {truncateMiddle(item.fromAddress)}</div>
                <div>To: {truncateMiddle(item.toAddress)}</div>
                <div>Amount: {formatPlainNumber(item.amount, 6)}</div>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div>Confirmations: {item.confirmations}</div>
                <div>Created: {formatDateTime(item.createdAt)}</div>
                <div>Updated: {formatDateTime(item.updatedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

function Stat(props: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase">{props.label}</div>
      <div className="font-data text-base text-white">{props.value}</div>
    </div>
  );
}
