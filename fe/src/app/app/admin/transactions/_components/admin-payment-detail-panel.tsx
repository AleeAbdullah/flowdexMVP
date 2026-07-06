'use client';

import type { IAdminPaymentListItem } from '@/dal/app/admin/admin.types';
import { DataKicker } from '@/components/flowdex/primitives';
import { formatDateTime } from '@/components/flowdex/utils';
import { GlassPanel } from '@/components/glass-panel';

function DetailField(props: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div className={props.mono ? 'font-data break-all text-sm text-[var(--text)]' : 'text-sm text-[var(--text)]'}>
        {props.value}
      </div>
    </div>
  );
}

export function AdminPaymentDetailPanel(props: {
  item: IAdminPaymentListItem;
}) {
  const { item } = props;
  const rawPayload = item.rawPayload ? JSON.stringify(item.rawPayload, null, 2) : null;

  return (
    <GlassPanel className="mx-6 mb-5 mt-1 border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_88%,transparent)] p-5">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--text)]">Identity</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Intent ID" value={item.intentId} mono />
            <DetailField label="Transaction ID" value={item.transactionId ?? 'Unavailable'} mono />
            <DetailField label="Transaction Kind" value={item.transactionIdKind ?? 'Unavailable'} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--text)]">Amounts</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DataKicker label="USD" value={`$${item.usdAmount}`} />
            <DataKicker label="$FDP" value={item.tokenAmount} />
            <DetailField label="Base Units" value={item.amountBaseUnits} mono />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--text)]">Addresses</div>
          <div className="grid gap-4">
            <DetailField label="Sender" value={item.senderAddress ?? 'Unavailable'} mono />
            <DetailField label="Receiver" value={item.receiverAddress} mono />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--text)]">Chain</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Tx Hash" value={item.txHash ?? 'Unavailable'} mono />
            <DetailField label="Block" value={item.blockNumber ?? 'Pending'} />
            <DetailField label="Confirmations" value={`${item.confirmations}`} />
            <DetailField label="Created At" value={formatDateTime(item.createdAt)} />
            <DetailField label="Confirmed At" value={formatDateTime(item.confirmedAt)} />
          </div>
        </div>
      </div>

      {rawPayload ? (
        <div className="mt-6 space-y-3">
          <div className="text-sm font-semibold text-[var(--text)]">Raw Payload</div>
          <pre className="max-h-72 overflow-auto rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-xs leading-6 text-[var(--muted)]">
            {rawPayload}
          </pre>
        </div>
      ) : null}
    </GlassPanel>
  );
}
