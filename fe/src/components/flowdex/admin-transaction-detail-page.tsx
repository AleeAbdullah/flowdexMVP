import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { TransactionListItem } from '@/dal/app/types';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from './primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from './utils';

export function AdminTransactionDetailPage(props: {
  transaction: TransactionListItem;
}) {
  const { transaction } = props;

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Admin Transaction Detail"
          title={`${transaction.assetCode} operational lifecycle`}
          description="This detail view is the admin counterpart to the user receipt screen. It adds user, wallet, verification, and refund-operability context without changing the underlying backend transaction contract."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--flowdex-text)_45%,transparent)] uppercase">Status</div>
            <StatusPill status={transaction.status} />
          </div>
          <DataKicker label="User ID" value={transaction.userId} />
          <DataKicker label="Wallet" value={transaction.walletAddress ? truncateMiddle(transaction.walletAddress) : 'Unavailable'} />
          <DataKicker label="Refund Eligible" value={transaction.refundEligible ? 'Yes' : 'No'} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DataKicker label="Intent ID" value={transaction.id} />
            <DataKicker label="Wallet ID" value={transaction.walletId} />
            <DataKicker label="Asset" value={`${transaction.assetCode} on ${transaction.chain}`} />
            <DataKicker label="Amount" value={`${formatPlainNumber(transaction.amountPaid, 6)} ${transaction.assetCode}`} />
            <DataKicker label="Reported Hash" value={transaction.reportedTxHash ? truncateMiddle(transaction.reportedTxHash) : 'Not reported'} />
            <DataKicker label="Matched Hash" value={transaction.matchedTxHash ? truncateMiddle(transaction.matchedTxHash) : 'Not matched'} />
            <DataKicker label="Confirmations" value={`${transaction.confirmations}`} />
            <DataKicker label="Confirmed At" value={formatDateTime(transaction.confirmedAt)} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          {transaction.verificationFailureReason ? (
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--flowdex-text)]">Verification issue</div>
              <p className="text-sm leading-7 text-rose-100">
                {transaction.verificationFailureReason}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-lg font-bold text-[var(--flowdex-text)]">Verification posture</div>
              <p className="text-sm leading-7 text-[var(--flowdex-muted)]">
                No machine-readable verification failure is currently attached to this lifecycle.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <DataKicker label="Block Time" value={formatDateTime(transaction.blockTime)} />
            <DataKicker label="Last Updated" value={formatDateTime(transaction.updatedAt)} />
            <DataKicker label="Tokens Allocated" value={transaction.tokensAllocated ? formatPlainNumber(transaction.tokensAllocated, 2) : 'Pending'} />
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="p-6">
        {transaction.refund ? (
          <div className="grid gap-4 md:grid-cols-3">
            <DataKicker label="Refund Status" value={transaction.refund.status} />
            <DataKicker label="Refund Amount" value={transaction.refund.refundAmount} />
            <DataKicker label="Outbound Hash" value={transaction.refund.outboundTxHash ? truncateMiddle(transaction.refund.outboundTxHash) : 'Pending'} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-lg font-bold text-[var(--flowdex-text)]">No refund record yet</div>
            <p className="text-sm leading-7 text-[var(--flowdex-muted)]">
              If this confirmed transaction remains eligible, the refund operations screen can create one from the admin flow.
            </p>
          </div>
        )}
        <div className="mt-5">
          <Button variant="glass" asChild>
            <Link href="/app/admin/refunds">Open refunds panel</Link>
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
