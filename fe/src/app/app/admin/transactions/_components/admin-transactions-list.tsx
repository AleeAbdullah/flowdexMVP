'use client';

import type { IAdminPaymentListItem } from '@/dal/app/admin/admin.types';
import { PAYMENT_INTENT_STATUSES } from '@/dal/app/payments/payments.types';
import { GlassPanel } from '@/components/glass-panel';
import { Loader2, ReceiptText } from '@/icons';
import { ADMIN_FAILED_STATUSES, ADMIN_PENDING_STATUSES } from '../constants';
import { AdminTransactionRow } from './admin-transaction-row';

export function AdminTransactionsList(props: {
  items: IAdminPaymentListItem[];
  isLoading: boolean;
  errorMessage: string | null;
  expandedIntentId: string | null;
  onToggleExpanded: (intentId: string) => void;
}) {
  const confirmedCount = props.items.filter(item => item.status === PAYMENT_INTENT_STATUSES.CONFIRMED).length;
  const pendingCount = props.items.filter(item => ADMIN_PENDING_STATUSES.has(item.status)).length;
  const failedCount = props.items.filter(item => ADMIN_FAILED_STATUSES.has(item.status)).length;

  return (
    <GlassPanel className="overflow-hidden">
      <div className="border-b border-[var(--card-border)] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <ReceiptText className="h-4 w-4 text-[var(--cyan)]" />
            Operational payment list
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span>Confirmed {confirmedCount}</span>
            <span>Pending {pendingCount}</span>
            <span>Failed {failedCount}</span>
          </div>
        </div>
      </div>

      <div>
        {props.isLoading ? (
          <div className="flex items-center gap-2 px-6 py-5 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading admin payments...
          </div>
        ) : null}
        {props.errorMessage ? (
          <div className="border-y border-[var(--status-error-border)] bg-[var(--status-error-surface)] px-6 py-5 text-sm text-[var(--status-error-text)]">{props.errorMessage}</div>
        ) : null}
        {!props.isLoading && !props.errorMessage && props.items.length === 0 ? (
          <div className="px-6 py-6 text-sm text-[var(--muted)]">
            No payments matched the current filter set.
          </div>
        ) : null}
        {props.items.map(item => (
          <AdminTransactionRow
            key={item.intentId}
            item={item}
            expanded={props.expandedIntentId === item.intentId}
            onToggle={() => props.onToggleExpanded(item.intentId)}
          />
        ))}
      </div>
    </GlassPanel>
  );
}
