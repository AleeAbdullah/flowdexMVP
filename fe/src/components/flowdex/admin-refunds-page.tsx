'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminRefunds, useAdminTransactions, useCreateAdminRefund } from '@/dal/app/hooks';
import { GlassPanel, SectionHeading, StatusPill } from './primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from './utils';

export function AdminRefundsPage() {
  const refundsQuery = useAdminRefunds();
  const confirmedTransactionsQuery = useAdminTransactions({ status: 'CONFIRMED' });
  const createRefundMutation = useCreateAdminRefund();

  const eligibleTransactions = useMemo(
    () => (confirmedTransactionsQuery.data?.items ?? []).filter(item => item.refundEligible),
    [confirmedTransactionsQuery.data],
  );

  const [purchaseIntentId, setPurchaseIntentId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [reason, setReason] = useState('manual review');

  useEffect(() => {
    if (!purchaseIntentId && eligibleTransactions[0]) {
      const transaction = eligibleTransactions[0];
      setPurchaseIntentId(transaction.id);
      setRefundAmount(transaction.amountPaid);
      setDestinationAddress(transaction.walletAddress ?? '');
    }
  }, [eligibleTransactions, purchaseIntentId]);

  function hydrateFromSelection(id: string) {
    setPurchaseIntentId(id);
    const transaction = eligibleTransactions.find(item => item.id === id);
    if (!transaction) {
      return;
    }

    setRefundAmount(transaction.amountPaid);
    setDestinationAddress(transaction.walletAddress ?? '');
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Refunds"
          title="Create and track refund records from the operational surface."
          description="Phase 2 admin refunds stay intentionally narrow: pick an eligible confirmed transaction, submit the refund request, and review the resulting backend refund record."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Eligible" value={`${eligibleTransactions.length}`} />
          <Metric label="Recorded Refunds" value={`${refundsQuery.data?.items.length ?? 0}`} />
          <Metric label="Pending Outbound Hash" value={`${(refundsQuery.data?.items ?? []).filter(item => !item.outboundTxHash).length}`} />
          <Metric label="Confirmed Records" value={`${(refundsQuery.data?.items ?? []).filter(item => item.status === 'CONFIRMED').length}`} />
        </div>
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="p-6">
          <div className="space-y-4">
            <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Create Refund</div>

            <label className="block space-y-2">
              <span className="text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase">Eligible Transaction</span>
              <select
                value={purchaseIntentId}
                onChange={event => hydrateFromSelection(event.target.value)}
                className="h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 text-white"
              >
                <option value="">Select a confirmed transaction</option>
                {eligibleTransactions.map(transaction => (
                  <option key={transaction.id} value={transaction.id}>
                    {transaction.assetCode} • {transaction.userId} • {truncateMiddle(transaction.id)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase">Refund Amount</span>
              <Input
                value={refundAmount}
                onChange={event => setRefundAmount(event.target.value)}
                className="h-12 border-white/10 bg-white/5 text-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase">Destination Address</span>
              <Input
                value={destinationAddress}
                onChange={event => setDestinationAddress(event.target.value)}
                className="h-12 border-white/10 bg-white/5 text-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase">Reason</span>
              <Input
                value={reason}
                onChange={event => setReason(event.target.value)}
                className="h-12 border-white/10 bg-white/5 text-white"
              />
            </label>

            <Button
              variant="brand"
              className="w-full"
              disabled={createRefundMutation.isPending || !purchaseIntentId || !refundAmount || !destinationAddress || !reason}
              onClick={async () => {
                try {
                  await createRefundMutation.mutateAsync({
                    purchaseIntentId,
                    refundAmount,
                    destinationAddress,
                    reason,
                  });
                  toast.success('Refund record created');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Could not create refund');
                }
              }}
            >
              {createRefundMutation.isPending ? 'Creating refund...' : 'Create refund record'}
            </Button>
          </div>
        </GlassPanel>

        <GlassPanel className="overflow-hidden">
          <div className="border-b border-white/8 px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
            Refund Records
          </div>
          <div>
            {refundsQuery.isLoading ? (
              <div className="px-6 py-5 text-sm text-slate-300">Loading refund records...</div>
            ) : null}
            {refundsQuery.isError ? (
              <div className="px-6 py-5 text-sm text-rose-200">
                {refundsQuery.error instanceof Error ? refundsQuery.error.message : 'Could not load refund records.'}
              </div>
            ) : null}
            {!refundsQuery.isLoading && (refundsQuery.data?.items.length ?? 0) === 0 ? (
              <div className="px-6 py-5 text-sm text-slate-300">
                No refund records exist yet.
              </div>
            ) : null}
            {(refundsQuery.data?.items ?? []).map(refund => (
              <div
                key={refund.id}
                className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 last:border-b-0 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-white">{truncateMiddle(refund.purchaseIntentId)}</div>
                    <StatusPill status={refund.status} />
                  </div>
                  <div className="text-sm text-slate-400">Destination {truncateMiddle(refund.destinationAddress)}</div>
                  <div className="text-sm text-slate-500">{refund.reason}</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[30rem]">
                  <Metric label="Amount" value={formatPlainNumber(refund.refundAmount, 6)} />
                  <Metric label="Outbound Tx" value={refund.outboundTxHash ? truncateMiddle(refund.outboundTxHash) : 'Pending'} />
                  <Metric label="Created" value={formatDateTime(refund.createdAt)} />
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
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
      <div className="text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase">{props.label}</div>
      <div className="font-data text-base text-white">{props.value}</div>
    </div>
  );
}
