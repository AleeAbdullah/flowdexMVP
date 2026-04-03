import type { TransactionListItem } from '@/dal/app/types';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';

export function TransactionDetailPage(props: {
  transaction: TransactionListItem;
}) {
  const { transaction } = props;

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          eyebrow="Transaction Detail"
          title={`${transaction.assetCode} purchase lifecycle`}
          description="The detail view mirrors the backend transaction read model, so users can see the current status, reported chain hash, confirmations, and refund posture in one place."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Status" value={transaction.status} />
          <DataKicker label="Confirmations" value={`${transaction.confirmations}`} />
          <DataKicker label="Amount Paid" value={transaction.amountPaid} />
          <DataKicker label="Tokens Allocated" value={transaction.tokensAllocated ?? 'Pending'} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassPanel className="p-6">
          <div className="space-y-4">
            <DataKicker label="Intent ID" value={transaction.id} />
            <DataKicker label="Chain" value={transaction.chain} />
            <DataKicker label="Asset" value={transaction.assetCode} />
            <DataKicker label="Tx Hash" value={transaction.txHash ?? 'Not reported yet'} />
            <DataKicker label="Block Time" value={transaction.blockTime ?? 'Pending'} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          {transaction.refund ? (
            <div className="space-y-4">
              <DataKicker label="Refund Status" value={transaction.refund.status} />
              <DataKicker label="Refund Amount" value={transaction.refund.refundAmount} />
              <DataKicker label="Refund Tx" value={transaction.refund.outboundTxHash ?? 'Pending'} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-lg font-bold text-white">No refund on record</div>
              <p className="text-sm leading-7 text-slate-300">
                If this transaction ever enters the refund workflow, the backend will project that state here through the same transaction detail contract.
              </p>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
