'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/glass-panel';
import { StatusPill } from '@/components/flowdex/primitives';
import { truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, X } from '@/icons';
import { cn } from '@/lib/utils';
import type { BuyActions, BuyPaymentView, BuyWalletView } from '../types/buy-view-model';

function getTitle(stage: BuyWalletView['checkoutStage']) {
  switch (stage) {
    case 'preparing_wallet_action': return 'Preparing transaction';
    case 'waiting_for_wallet_approval': return 'Approve payment';
    case 'submitting_tx_result': return 'Recording transaction';
    case 'tracking': return 'Payment submitted';
    case 'failed': return 'Payment needs attention';
    default: return 'Wallet checkout';
  }
}

function isTransactionProgressStage(stage: BuyWalletView['checkoutStage']) {
  return stage === 'preparing_wallet_action'
    || stage === 'waiting_for_wallet_approval'
    || stage === 'submitting_tx_result';
}

export function PaymentDialogs(props: {
  wallet: BuyWalletView;
  payment: BuyPaymentView;
  actions: BuyActions;
}) {
  const stage = props.wallet.checkoutStage;
  const isTracking = stage === 'tracking';
  const hasRecoveryContext = Boolean(props.payment.walletTxResult);
  const isRecoverableFailure = stage === 'failed' && hasRecoveryContext;
  const isOpen = isTransactionProgressStage(stage) || isTracking || isRecoverableFailure;
  usePaymentAttentionToast(isRecoverableFailure ? props.wallet.paymentWalletError : null);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && props.actions.closeCheckout()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65" />
        <DialogPrimitive.Content className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-6 text-[var(--text)] shadow-[0_24px_90px_rgba(0,0,0,0.36)] outline-none',
          isTracking && 'w-[min(calc(100vw-2rem),46rem)]',
        )}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold">{getTitle(stage)}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {isTracking
                  ? 'Your wallet broadcast was recorded. Payment completes after the required on-chain confirmations.'
                  : 'Approve the exact server-prepared transaction in your wallet.'}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-full border border-[var(--card-border)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)]">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {isTransactionProgressStage(stage) ? <WalletCheckoutStageMessage stage={stage} /> : null}

          {isTracking ? (
            <PaymentTracking payment={props.payment} onStartNewPayment={props.actions.startNewPayment} />
          ) : null}

          {isRecoverableFailure ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-surface)] p-4 text-sm text-[var(--status-error-text)]">
                {props.wallet.paymentWalletError ?? 'The wallet checkout could not be completed.'}
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="brand" onClick={props.actions.buy}>Try again</Button>
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function usePaymentAttentionToast(message: string | null) {
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!message || previous.current === message) {
      return;
    }
    previous.current = message;
    toast.error('Payment needs attention', { description: message, id: 'buy-payment-attention-error' });
  }, [message]);
}

function WalletCheckoutStageMessage(props: { stage: BuyWalletView['checkoutStage'] }) {
  const message = props.stage === 'preparing_wallet_action'
    ? 'Preparing your transaction...'
    : props.stage === 'waiting_for_wallet_approval'
      ? 'Confirm the transaction in your wallet.'
      : props.stage === 'submitting_tx_result'
        ? 'Recording the wallet transaction for verification...'
        : null;
  return message ? <InlineProgress message={message} /> : null;
}

function PaymentTracking(props: { payment: BuyPaymentView; onStartNewPayment: () => void }) {
  const transaction = props.payment.walletTxResult;
  const instruction = props.payment.instruction;
  return (
    <div className="mt-5 space-y-4">
      <GlassPanel className="rounded-lg bg-[var(--buy-panel-soft)] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-4 w-4 text-[var(--green)]" />
          <div>
            <div className="text-sm font-bold">Transaction submitted</div>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Waiting for blockchain confirmation. Credit is not finalized until the required confirmation threshold is reached.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoBox label="Transaction ID" value={transaction ? truncateMiddle(transaction.txId, 14, 10) : 'Recorded'} />
          <InfoBox label="Payment Intent" value={instruction ? truncateMiddle(instruction.intentId, 14, 8) : 'Tracking'} />
        </div>
        {instruction ? (
          <div className="mt-4 flex items-center gap-2">
            <StatusPill status={instruction.status} />
            {props.payment.isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" /> : null}
          </div>
        ) : null}
        {props.payment.statusError ? <p className="mt-3 text-xs text-[var(--status-warning-text)]">{props.payment.statusError}</p> : null}
      </GlassPanel>
      <Button type="button" variant="glass" onClick={props.onStartNewPayment}>Buy again</Button>
    </div>
  );
}

function InfoBox(props: { label: string; value: string }) {
  return (
    <GlassPanel className="rounded-[0.75rem] bg-[var(--buy-panel-soft)] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.label}</div>
      <div className="mt-1 break-words font-data text-sm font-bold">{props.value}</div>
    </GlassPanel>
  );
}

function InlineProgress(props: { message: string }) {
  return (
    <div className="mt-5 flex items-center gap-2 rounded-md border border-[var(--card-border)] bg-[var(--buy-panel-soft)] px-4 py-3 text-sm text-[var(--muted)]">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" />
      <span>{props.message}</span>
    </div>
  );
}
