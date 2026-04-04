import type { TransactionListItem } from '@/dal/app/types';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from './primitives';
import { formatDateTime, formatPlainNumber, truncateMiddle } from './utils';

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
          description="This view is the canonical receipt/status page for a protected purchase lifecycle. It now separates reported and matched hashes, verification outcomes, confirmation timing, and refund state."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold tracking-[0.32em] text-slate-400 uppercase">Status</div>
            <StatusPill status={transaction.status} />
          </div>
          <DataKicker label="Confirmations" value={`${transaction.confirmations}`} />
          <DataKicker label="Amount Paid" value={formatPlainNumber(transaction.amountPaid, 6)} />
          <DataKicker label="Tokens Allocated" value={transaction.tokensAllocated ? formatPlainNumber(transaction.tokensAllocated, 6) : 'Pending'} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DataKicker label="Intent ID" value={transaction.id} />
            <DataKicker label="Chain" value={transaction.chain} />
            <DataKicker label="Asset" value={transaction.assetCode} />
            <DataKicker label="Wallet" value={transaction.walletAddress ? truncateMiddle(transaction.walletAddress) : 'Unavailable'} />
            <DataKicker label="Reported Hash" value={transaction.reportedTxHash ? truncateMiddle(transaction.reportedTxHash) : 'Not reported yet'} />
            <DataKicker label="Matched Hash" value={transaction.matchedTxHash ? truncateMiddle(transaction.matchedTxHash) : 'Pending reconciliation'} />
            <DataKicker label="Block Time" value={formatDateTime(transaction.blockTime)} />
            <DataKicker label="Confirmed At" value={formatDateTime(transaction.confirmedAt)} />
            <DataKicker label="Last Update" value={formatDateTime(transaction.updatedAt)} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          {transaction.verificationFailureReason ? (
            <div className="mb-5 rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              Verification issue: {transaction.verificationFailureReason}
            </div>
          ) : null}
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

      <GlassPanel className="p-6">
        <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Lifecycle Timeline</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <LifecycleStep
            title="Intent created"
            description={`This purchase intent was created on ${new Date(transaction.createdAt).toLocaleString()}.`}
            active
          />
          <LifecycleStep
            title="Hash reported or matched"
            description={transaction.matchedTxHash
              ? `The backend matched the lifecycle to ${truncateMiddle(transaction.matchedTxHash)}.`
              : transaction.reportedTxHash
                ? `The user reported ${truncateMiddle(transaction.reportedTxHash)} and the backend is still evaluating it.`
                : 'No reported or matched blockchain hash is attached yet.'}
            active={Boolean(transaction.reportedTxHash || transaction.matchedTxHash)}
          />
          <LifecycleStep
            title="Verification posture"
            description={transaction.verificationFailureReason
              ? `Backend validation flagged ${transaction.verificationFailureReason}.`
              : transaction.status === 'CONFIRMED'
                ? 'No verification issue is attached and the lifecycle reached confirmed status.'
                : 'No machine-readable verification issue is attached right now.'}
            active={Boolean(transaction.verificationFailureReason || transaction.matchedTxHash)}
          />
          <LifecycleStep
            title="Chain confirmation"
            description={transaction.status === 'CONFIRMED'
              ? `Required confirmations were reached and the purchase finalized at ${formatDateTime(transaction.confirmedAt)}.`
              : transaction.status === 'FAILED'
                ? 'The reported lifecycle failed validation and needs correction or a fresh report.'
                : transaction.status === 'EXPIRED'
                  ? 'The intent expired before a valid on-chain match was confirmed.'
                  : transaction.status === 'REFUNDED'
                    ? 'A refund record now exists for this lifecycle.'
                    : `Current confirmation count: ${transaction.confirmations}.`}
            active={transaction.status !== 'PENDING'}
          />
          <LifecycleStep
            title="Refund posture"
            description={transaction.refund
              ? `Refund status is ${transaction.refund.status}.`
              : transaction.refundEligible
                ? 'This confirmed transaction is eligible for a refund if operations choose to create one.'
                : 'No refund record is attached to this transaction right now.'}
            active={Boolean(transaction.refund || transaction.refundEligible)}
          />
        </div>
      </GlassPanel>
    </div>
  );
}

function LifecycleStep(props: {
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <div className={`rounded-[1.2rem] border p-4 ${props.active ? 'border-cyan-400/20 bg-cyan-400/8' : 'border-white/8 bg-white/4'}`}>
      <div className="text-sm font-semibold text-white">{props.title}</div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{props.description}</p>
    </div>
  );
}
