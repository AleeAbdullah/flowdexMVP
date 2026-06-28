import type { IAdminPaymentListItem } from '@/dal/app/admin/admin.types';
import { GlassPanel } from '@/components/glass-panel';
import { AdminTransactionRow } from './admin-transaction-row';

export function AdminTransactionsList(props: {
  items: IAdminPaymentListItem[];
  isLoading: boolean;
  errorMessage: string | null;
}) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        Operational Payment List
      </div>
      <div>
        {props.isLoading ? (
          <div className="px-6 py-5 text-sm text-[var(--muted)]">Loading admin payments...</div>
        ) : null}
        {props.errorMessage ? (
          <div className="px-6 py-5 text-sm text-rose-200">{props.errorMessage}</div>
        ) : null}
        {!props.isLoading && !props.errorMessage && props.items.length === 0 ? (
          <div className="px-6 py-5 text-sm text-[var(--muted)]">
            No payments matched the current filter set.
          </div>
        ) : null}
        {props.items.map(item => (
          <AdminTransactionRow key={item.intentId} item={item} />
        ))}
      </div>
    </GlassPanel>
  );
}
