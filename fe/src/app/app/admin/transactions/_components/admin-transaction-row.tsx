import Link from 'next/link';
import type { ITransactionListItem } from '@/dal/app/transactions/transactions.types';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';
import { ROUTES } from '@/routes';

export function AdminTransactionRow(props: {
  item: ITransactionListItem;
}) {
  const { item } = props;

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-semibold text-[var(--text)]">{item.assetCode} on {item.network}</div>
          <StatusPill status={item.status} />
        </div>
        <div className="text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
          User {item.userId} • Wallet {item.walletAddress ? truncateMiddle(item.walletAddress) : 'Unavailable'}
        </div>
        <div className="text-sm text-[color-mix(in_srgb,var(--text)_40%,transparent)]">
          {item.txHash
            ? `Tx ${truncateMiddle(item.txHash)}`
            : item.operationId
              ? `Operation ${item.operationId}`
              : 'No on-chain identifier attached yet'}
        </div>
        {item.failureReason ? (
          <div className="text-sm text-rose-200">
            Failure reason: {item.failureReason}
          </div>
        ) : null}
        {item.settlementDiagnostic ? (
          <div className="text-sm text-amber-200">
            Settlement diagnostic: {item.settlementDiagnostic}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 xl:min-w-[42rem]">
        <Metric label="Amount" value={`${formatPlainNumber(item.amount, 6)} ${item.assetCode}`} />
        <Metric label="Block" value={item.blockNumber ?? 'Pending'} />
        <Metric label="Confirmed At" value={formatDateTime(item.confirmedAt)} />
        <Metric label="Updated" value={formatDateTime(item.updatedAt)} />
      </div>

      <Button variant="glass" asChild>
        <Link href={ROUTES.ADMIN.transactionDetail(item.id)}>Open detail</Link>
      </Button>
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
