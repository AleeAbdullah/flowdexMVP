import type { IAdminPaymentListItem } from '@/dal/app/admin/admin.types';
import { StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, truncateMiddle } from '@/components/flowdex/utils';

export function AdminTransactionRow(props: {
  item: IAdminPaymentListItem;
}) {
  const { item } = props;

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-semibold text-[var(--text)]">{item.asset} on {item.chain}</div>
          <StatusPill status={item.status} />
        </div>
        <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
          Sender {item.senderAddress ? truncateMiddle(item.senderAddress) : 'Unavailable'}
        </div>
        <div className="text-sm text-[color-mix(in_srgb,var(--text)_40%,transparent)]">
          {item.txHash
            ? `Tx ${truncateMiddle(item.txHash)}`
            : 'No on-chain identifier attached yet'}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 xl:min-w-[42rem]">
        <Metric label="USD" value={`$${item.usdAmount}`} />
        <Metric label="$FDN" value={item.tokenAmount} />
        <Metric label="Block" value={item.blockNumber ?? 'Pending'} />
        <Metric label="Confirmed At" value={formatDateTime(item.confirmedAt)} />
      </div>
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
