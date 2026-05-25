import type { IAdminPaymentListItem } from '@/dal/app/admin/admin.types';
import { PAYMENT_STATUSES } from '@/dal/app/payments/payments.types';

const liveStatuses = new Set<string>([
  PAYMENT_STATUSES.DETECTED,
  PAYMENT_STATUSES.CONFIRMING,
]);

export function AdminTransactionMetrics(props: {
  items: IAdminPaymentListItem[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Metric label="Loaded" value={`${props.items.length}`} />
      <Metric
        label="Confirmed"
        value={`${props.items.filter(item => item.status === PAYMENT_STATUSES.CONFIRMED).length}`}
      />
      <Metric
        label="Failed"
        value={`${props.items.filter(item => item.status === PAYMENT_STATUSES.FAILED).length}`}
      />
      <Metric
        label="Pending"
        value={`${props.items.filter(item => liveStatuses.has(item.status)).length}`}
      />
    </div>
  );
}

function Metric(props: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div className="font-data text-base text-[var(--text)]">{props.value}</div>
    </div>
  );
}
