'use client';

import type { IAdminPaymentListItem } from '@/dal/app/admin/admin.types';
import { StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from '@/icons';
import { AdminPaymentDetailPanel } from './admin-payment-detail-panel';

export function AdminTransactionRow(props: {
  item: IAdminPaymentListItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { item } = props;

  return (
    <div className="border-b border-[var(--card-border)] last:border-b-0">
      <div className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
        <button
          type="button"
          onClick={props.onToggle}
          className="min-w-0 flex-1 space-y-2 text-left"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-semibold text-[var(--text)]">{item.asset} on {item.chain}</div>
            <StatusPill status={item.status} />
          </div>
          <div className="text-sm text-[color-mix(in_srgb,var(--text)_48%,transparent)]">
            Intent {truncateMiddle(item.intentId)}
          </div>
          <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
            Sender {item.senderAddress ? truncateMiddle(item.senderAddress) : 'Unavailable'}
          </div>
          <div className="text-sm text-[color-mix(in_srgb,var(--text)_40%,transparent)]">
            {item.txHash
              ? `Tx ${truncateMiddle(item.txHash)}`
              : 'No on-chain identifier attached yet'}
          </div>
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center xl:min-w-[42rem]">
          <div className="grid flex-1 gap-4 sm:grid-cols-4">
            <Metric label="USD" value={`$${item.usdAmount}`} />
            <Metric label="$FDP" value={item.tokenAmount} />
            <Metric label="Block" value={item.blockNumber ?? 'Pending'} />
            <Metric label="Confirmed At" value={formatDateTime(item.confirmedAt)} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={props.onToggle}
            aria-expanded={props.expanded}
            aria-label={props.expanded ? 'Collapse payment details' : 'Expand payment details'}
          >
            {props.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {props.expanded ? <AdminPaymentDetailPanel item={item} /> : null}
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
