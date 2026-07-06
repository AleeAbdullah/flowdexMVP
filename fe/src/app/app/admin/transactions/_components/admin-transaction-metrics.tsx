import type { IAdminPaymentListItem } from '@/dal/app/admin/admin.types';
import { DataKicker } from '@/components/flowdex/primitives';
import { PAYMENT_INTENT_STATUSES } from '@/dal/app/payments/payments.types';
import { ADMIN_FAILED_STATUSES, ADMIN_PENDING_STATUSES } from '../constants';

export function AdminTransactionMetrics(props: {
  items: IAdminPaymentListItem[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DataKicker label="Loaded" value={`${props.items.length}`} />
      <DataKicker
        label="Confirmed"
        value={`${props.items.filter(item => item.status === PAYMENT_INTENT_STATUSES.CONFIRMED).length}`}
      />
      <DataKicker
        label="Failed"
        value={`${props.items.filter(item => ADMIN_FAILED_STATUSES.has(item.status)).length}`}
      />
      <DataKicker
        label="Pending"
        value={`${props.items.filter(item => ADMIN_PENDING_STATUSES.has(item.status)).length}`}
      />
    </div>
  );
}
