'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/glass-panel';
import { WalletConnectorIcon } from '@/components/flowdex/wallet-connector-icon';
import { StatusPill } from '@/components/flowdex/primitives';
import { truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CircleAlert, Loader2, ShieldCheck, X } from '@/icons';
import { cn } from '@/lib/utils';
import type { BuyActions, BuyOrderView, BuyPaymentView, BuyWalletView } from '../types/buy-view-model';

type WalletCheckoutIssue = { summary: string; message: string; toastTitle: string };

function resolveWalletCheckoutIssue(walletStatus: BuyWalletView['walletStatus']): WalletCheckoutIssue | null {
  if (walletStatus.connectionErrorMessage) {
    return { summary: 'Wallet connection needs attention', message: walletStatus.connectionErrorMessage, toastTitle: 'Wallet connection failed' };
  }
  if (walletStatus.unsupportedReason) {
    return {
      summary: walletStatus.unsupportedReason === 'wrong_chain' ? 'Switch to the correct network' : 'Wallet checkout needs attention',
      message: walletStatus.unsupportedReason === 'missing_provider'
        ? 'Install or unlock the supported wallet for this payment network.'
        : 'This wallet cannot complete the selected checkout.',
      toastTitle: walletStatus.unsupportedReason === 'wrong_chain' ? 'Wrong network' : 'Wallet checkout blocked',
    };
  }
  return null;
}

function getConnectorLabel(connectorName: string) {
  switch (connectorName) {
    case 'metamask': return 'MetaMask';
    case 'coinbasewallet': return 'Coinbase Wallet';
    case 'walletconnect': return 'WalletConnect';
    case 'metamask-solana': return 'MetaMask Solana';
    case 'tronlink': return 'TronLink';
    case 'xverse': return 'Xverse';
    default: return connectorName;
  }
}

function getTitle(stage: BuyWalletView['checkoutStage']) {
  switch (stage) {
    case 'connecting_wallet': return 'Connect wallet';
    case 'wallet_ready': return 'Wallet checkout';
    case 'preparing_wallet_action': return 'Preparing transaction';
    case 'waiting_for_wallet_approval': return 'Approve payment';
    case 'submitting_tx_result': return 'Submitting transaction';
    case 'tracking': return 'Payment submitted';
    case 'failed': return 'Payment needs attention';
    default: return 'Wallet checkout';
  }
}

export function PaymentDialogs(props: {
  order: BuyOrderView;
  wallet: BuyWalletView;
  payment: BuyPaymentView;
  actions: BuyActions;
}) {
  const stage = props.wallet.checkoutStage;
  const isOpen = stage !== 'closed';
  const walletStatus = props.wallet.walletStatus;
  const isTracking = stage === 'tracking';
  const isBusy = props.payment.isCreating
    || stage === 'connecting_wallet'
    || stage === 'preparing_wallet_action'
    || stage === 'waiting_for_wallet_approval'
    || stage === 'submitting_tx_result';
  const walletIssue = resolveWalletCheckoutIssue(walletStatus);
  useWalletIssueToast(walletIssue);
  usePaymentAttentionToast(stage === 'failed' ? props.wallet.paymentWalletError : null);

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
                  ? 'Your wallet broadcast was recorded. We will only mark payment complete after on-chain confirmation.'
                  : 'Approve the exact server-prepared transaction in your wallet.'}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-full border border-[var(--card-border)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)]">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <OrderSummary pay={props.order.payDisplay} receive={props.order.receiveDisplay} assetLabel={props.order.selectedAsset?.label ?? 'Asset'} />

          {!isTracking && stage !== 'failed' ? (
            <div className="mt-5 space-y-4">
              {!walletStatus.address ? (
                <WalletConnectorPicker
                  connectorNames={walletStatus.availableConnectorNames}
                  pendingConnectorName={walletStatus.pendingConnectorName}
                  isConnecting={stage === 'connecting_wallet'}
                  disabled={isBusy}
                  onConnect={props.actions.connectWallet}
                />
              ) : <ConnectedWalletPanel wallet={props.wallet} walletIssue={walletIssue} />}

              <WalletCheckoutStageMessage stage={stage} />

              {walletStatus.address ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="brand"
                    onClick={props.wallet.isWrongNetwork ? props.actions.switchNetwork : props.actions.startWalletPayment}
                    disabled={isBusy || props.wallet.isSwitchingNetwork}
                  >
                    {isBusy || props.wallet.isSwitchingNetwork ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {props.wallet.isWrongNetwork ? 'Switch Network' : 'Continue with wallet'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {isTracking ? (
            <PaymentTracking
              payment={props.payment}
              onStartNewPayment={props.actions.startNewPayment}
            />
          ) : null}

          {stage === 'failed' ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-100">
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

function useWalletIssueToast(issue: WalletCheckoutIssue | null) {
  const lastIssueRef = useRef<string | null>(null);
  useEffect(() => {
    if (!issue) {
      lastIssueRef.current = null;
      return;
    }
    const key = `${issue.toastTitle}:${issue.message}`;
    if (lastIssueRef.current === key) {
      return;
    }
    lastIssueRef.current = key;
    toast.error(issue.toastTitle, { description: issue.message, id: 'buy-wallet-checkout-issue' });
  }, [issue]);
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

function OrderSummary(props: { pay: string; receive: string; assetLabel: string }) {
  return (
    <div className="mt-5 grid gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--buy-panel-soft)] p-4 text-sm sm:grid-cols-3">
      <div><div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">You Pay</div><div className="mt-1 font-bold">{props.pay}</div></div>
      <div><div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">You Receive</div><div className="mt-1 font-bold text-[var(--green)]">{props.receive}</div></div>
      <div><div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">Asset</div><div className="mt-1 font-bold">{props.assetLabel}</div></div>
    </div>
  );
}

function WalletConnectorPicker(props: { connectorNames: string[]; pendingConnectorName: string | null; isConnecting: boolean; disabled: boolean; onConnect: (connectorName: string) => void }) {
  if (!props.connectorNames.length) {
    return <div className="rounded-md bg-amber-300/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">No supported wallet connector is available in this browser.</div>;
  }
  return (
    <div className="flex items-start justify-center gap-7">
      {props.connectorNames.map(connectorName => {
        const pending = props.isConnecting && props.pendingConnectorName === connectorName;
        return (
          <button key={connectorName} type="button" disabled={props.disabled} onClick={() => props.onConnect(connectorName)} className="group flex h-24 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-(--card-border) bg-(--buy-panel-soft) px-2 text-center text-(--muted) transition-colors hover:border-(--cyan) hover:text-(--text) disabled:pointer-events-none disabled:opacity-60" aria-label={`Connect ${getConnectorLabel(connectorName)}`}>
            <span className="relative flex h-10 w-10 items-center justify-center"><WalletConnectorIcon connectorName={connectorName} className="h-8 w-8" size={32} />{pending ? <Loader2 className="absolute -right-2 -top-2 h-4 w-4 animate-spin text-(--cyan)" /> : null}</span>
            <span className="text-xs font-semibold">{getConnectorLabel(connectorName)}</span>
          </button>
        );
      })}
    </div>
  );
}

function ConnectedWalletPanel(props: { wallet: BuyWalletView; walletIssue: WalletCheckoutIssue | null }) {
  const status = props.wallet.walletStatus;
  return (
    <GlassPanel className="rounded-lg bg-[var(--buy-panel-soft)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">Connected Wallet</div><div className="mt-1 font-data text-sm font-bold">{status.address ? truncateMiddle(status.address, 12, 8) : 'Not connected'}</div></div><div className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs font-bold text-[var(--cyan)]">{status.connectorName ? getConnectorLabel(status.connectorName) : status.providerStatus}</div></div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3"><StatusCell label="Chain" value={status.walletChainId ?? (status.chainId ? String(status.chainId) : 'Unknown')} /><StatusCell label="Readiness" value={status.executionReadiness} /><StatusCell label="Wallet" value={status.verificationStatus} issue={props.walletIssue} /></div>
    </GlassPanel>
  );
}

function StatusCell(props: { label: string; value: string; issue?: WalletCheckoutIssue | null }) {
  return <div><div className="flex items-center justify-between gap-2"><div className="text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">{props.label}</div>{props.issue ? <IssueTooltipIcon summary={props.issue.summary} message={props.issue.message} /> : null}</div><div className="mt-1 font-bold">{props.value}</div></div>;
}

function PaymentTracking(props: { payment: BuyPaymentView; onStartNewPayment: () => void }) {
  const transaction = props.payment.walletTxResult;
  const instruction = props.payment.instruction;
  return (
    <div className="mt-5 space-y-4">
      <GlassPanel className="rounded-lg bg-[var(--buy-panel-soft)] p-4">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-4 w-4 text-[var(--green)]" /><div><div className="text-sm font-bold">Transaction submitted</div><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Waiting for blockchain confirmation. Credit is not finalized until the required confirmation threshold is reached.</p></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2"><InfoBox label="Transaction ID" value={transaction ? truncateMiddle(transaction.txId, 14, 10) : 'Recorded'} /><InfoBox label="Payment Intent" value={instruction ? truncateMiddle(instruction.intentId, 14, 8) : 'Tracking'} /></div>
        {instruction ? <div className="mt-4 flex items-center gap-2"><StatusPill status={instruction.status} />{props.payment.isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" /> : null}</div> : null}
        {props.payment.statusError ? <p className="mt-3 text-xs text-amber-700 dark:text-amber-100">{props.payment.statusError}</p> : null}
      </GlassPanel>
      <Button type="button" variant="glass" onClick={props.onStartNewPayment}>Buy again</Button>
    </div>
  );
}

function InfoBox(props: { label: string; value: string }) {
  return <GlassPanel className="rounded-[0.75rem] bg-[var(--buy-panel-soft)] px-4 py-3"><div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.label}</div><div className="mt-1 break-words font-data text-sm font-bold">{props.value}</div></GlassPanel>;
}

function IssueTooltipIcon(props: { summary: string; message: string }) {
  return <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild><button type="button" className="rounded-full p-0.5 text-rose-500/65" aria-label={`${props.summary}: ${props.message}`}><CircleAlert className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent className="max-w-72 border-(--card-border) bg-(--surface-elevated) text-sm leading-5 text-(--text)">{props.message}</TooltipContent></Tooltip></TooltipProvider>;
}

function InlineProgress(props: { message: string }) {
  return <div className="flex items-center gap-2 rounded-md border border-[var(--card-border)] bg-[var(--buy-panel-soft)] px-4 py-3 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" /><span>{props.message}</span></div>;
}
