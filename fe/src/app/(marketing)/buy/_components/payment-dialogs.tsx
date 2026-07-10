'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/glass-panel';
import { WalletConnectorIcon } from '@/components/flowdex/wallet-connector-icon';
import { StatusPill } from '@/components/flowdex/primitives';
import { truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CircleAlert, Copy, Loader2, ShieldCheck, Wallet, X } from '@/icons';
import { cn } from '@/lib/utils';
import { describeUnsupportedWalletReason } from '../utils/get-buy-execution-readiness';
import type { BuyActions, BuyOrderView, BuyPaymentView, BuyWalletView, PaymentInstructionSummary } from '../types/buy-view-model';
import type { MarketingWalletUnsupportedReason } from '@/hooks/marketing-wallet.types';

type WalletCheckoutIssue = {
  summary: string;
  message: string;
  toastTitle: string;
};

function resolveWalletCheckoutIssue(walletStatus: BuyWalletView['walletStatus']): WalletCheckoutIssue | null {
  if (walletStatus.connectionErrorMessage) {
    return {
      summary: 'Wallet connection needs attention',
      message: walletStatus.connectionErrorMessage,
      toastTitle: 'Wallet connection failed',
    };
  }

  if (walletStatus.unsupportedReason) {
    return {
      summary: getWalletIssueSummary(walletStatus.unsupportedReason),
      message: describeUnsupportedWalletReason(walletStatus.unsupportedReason),
      toastTitle: getWalletIssueToastTitle(walletStatus.unsupportedReason),
    };
  }

  return null;
}

function getWalletIssueSummary(reason: MarketingWalletUnsupportedReason) {
  switch (reason) {
    case 'wrong_chain':
      return 'Switch to the correct network';
    default:
      return 'Wallet checkout needs attention';
  }
}

function getWalletIssueToastTitle(reason: MarketingWalletUnsupportedReason) {
  switch (reason) {
    case 'wrong_chain':
      return 'Wrong network';
    default:
      return 'Wallet checkout blocked';
  }
}

function copyText(value: string) {
  if (navigator.clipboard) {
    void navigator.clipboard.writeText(value);
  }
}

function getConnectorLabel(connectorName: string) {
  switch (connectorName) {
    case 'metamask':
      return 'MetaMask';
    case 'coinbasewallet':
      return 'Coinbase Wallet';
    case 'walletconnect':
      return 'WalletConnect';
    case 'metamask-solana':
      return 'MetaMask Solana';
    case 'tronlink':
      return 'TronLink';
    default:
      return connectorName;
  }
}

function getDescription(stage: BuyWalletView['checkoutStage'], canUseWalletCheckout: boolean) {
  switch (stage) {
    case 'direct_instructions':
      return 'Send the exact amount shown below. We will detect your payment automatically.';
    case 'tracking':
      return 'Your transaction has been submitted and is being tracked on chain.';
    case 'direct_address':
      return 'Enter the wallet address you will pay from to receive manual send instructions.';
    case 'failed':
      return 'Review the issue below and choose how you would like to continue.';
    default:
      return canUseWalletCheckout
        ? 'Connect a wallet to continue with checkout.'
        : 'This asset uses direct-send instructions. Enter the wallet address you will pay from to continue.';
  }
}

function getTitle(stage: BuyWalletView['checkoutStage']) {
  switch (stage) {
    case 'direct_address':
      return 'Send directly';
    case 'direct_instructions':
      return 'Complete your payment';
    case 'connecting_wallet':
      return 'Connect wallet';
    case 'verifying_wallet':
      return 'Verify wallet';
    case 'wallet_ready':
      return 'Wallet checkout';
    case 'preparing_wallet_action':
      return 'Preparing transaction';
    case 'waiting_for_wallet_approval':
      return 'Approve payment';
    case 'submitting_tx_result':
      return 'Submitting transaction';
    case 'tracking':
      return 'Payment submitted';
    case 'failed':
      return 'Payment needs attention';
    case 'choose_method':
    case 'closed':
    default:
      return 'Choose checkout method';
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
  const isWide = stage === 'direct_instructions' || stage === 'tracking';
  const walletStatus = props.wallet.walletStatus;
  const selectedAsset = props.order.selectedAsset;
  const showWalletChoice = props.wallet.canUseWalletCheckout
    && [
      'choose_method',
      'connecting_wallet',
      'wallet_ready',
      'verifying_wallet',
      'preparing_wallet_action',
      'waiting_for_wallet_approval',
      'submitting_tx_result',
    ].includes(stage);
  const showDirectAddress = stage === 'direct_address';
  const showDirectInstructions = stage === 'direct_instructions' && props.payment.instruction;
  const showWalletTracking = stage === 'tracking' && props.payment.walletTxResult;
  const isBusy = props.payment.isCreating
    || stage === 'connecting_wallet'
    || stage === 'verifying_wallet'
    || stage === 'preparing_wallet_action'
    || stage === 'waiting_for_wallet_approval'
    || stage === 'submitting_tx_result';

  const walletIssue = resolveWalletCheckoutIssue(walletStatus);
  useWalletIssueToast(walletIssue);
  usePaymentAttentionToast(stage === 'failed' ? props.wallet.paymentWalletError : null);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && props.actions.closeCheckout()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-6 text-[var(--text)] shadow-[0_24px_90px_rgba(0,0,0,0.36)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:duration-200',
            isWide && 'w-[min(calc(100vw-2rem),46rem)]',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold">{getTitle(stage)}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {getDescription(stage, props.wallet.canUseWalletCheckout)}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-full border border-[var(--card-border)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)]">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <OrderSummary pay={props.order.payDisplay} receive={props.order.receiveDisplay} assetLabel={selectedAsset?.label ?? 'Asset'} />

          {showWalletChoice ? (
            <div className="mt-5 space-y-4">
              {!walletStatus.address ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                      Connect wallet
                    </div>
                    {walletIssue ? (
                      <IssueTooltipIcon summary={walletIssue.summary} message={walletIssue.message} />
                    ) : null}
                  </div>
                  <WalletConnectorPicker
                    connectorNames={walletStatus.availableConnectorNames}
                    pendingConnectorName={walletStatus.pendingConnectorName}
                    isConnecting={stage === 'connecting_wallet'}
                    disabled={isBusy}
                    onConnect={props.actions.connectWallet}
                  />
                </>
              ) : (
                <ConnectedWalletPanel wallet={props.wallet} walletIssue={walletIssue} />
              )}

              <WalletCheckoutStageMessage stage={stage} />

              <div className="flex flex-wrap items-center justify-end gap-3">
                {walletStatus.address ? (
                  <Button
                    type="button"
                    variant="brand"
                    onClick={props.wallet.isWrongNetwork ? props.actions.switchNetwork : props.actions.startWalletPayment}
                    disabled={isBusy || props.wallet.isSwitchingNetwork}
                  >
                    {isBusy || props.wallet.isSwitchingNetwork ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {props.wallet.isWrongNetwork
                      ? props.wallet.isSwitchingNetwork
                        ? 'Switching network'
                        : 'Switch Network'
                      : 'Continue with wallet'}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {showDirectAddress ? (
            <div className="mt-5 space-y-4">
              <label className="block space-y-2" htmlFor="payment-wallet-address">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                    Payment wallet address
                  </span>
                  {props.wallet.paymentWalletError ? (
                    <IssueTooltipIcon
                      summary="Payment wallet address needs attention"
                      message={props.wallet.paymentWalletError}
                    />
                  ) : null}
                </div>
                <Input
                  id="payment-wallet-address"
                  value={props.wallet.paymentWalletAddress}
                  onChange={event => props.actions.setPaymentWalletAddress(event.target.value)}
                  placeholder="Wallet address"
                  className="h-12 border-[var(--card-border)] bg-[var(--buy-panel-soft)] text-[var(--text)]"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-3">
                {props.wallet.canUseWalletCheckout ? (
                  <Button type="button" variant="glass" onClick={props.actions.buy} disabled={isBusy}>
                    Back to wallet
                  </Button>
                ) : null}
                <Button type="button" variant="brand" onClick={props.actions.createDirectPayment} disabled={props.payment.isCreating}>
                  {props.payment.isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue to payment
                </Button>
              </div>
            </div>
          ) : null}

          {showDirectInstructions ? (
            <DirectInstructions
              instruction={props.payment.instruction!}
              isCheckingStatus={props.payment.isCheckingStatus}
              statusError={props.payment.statusError}
              onStartNewPayment={props.actions.startNewPayment}
            />
          ) : null}

          {showWalletTracking ? (
            <WalletTracking
              transactionId={props.payment.walletTxResult!.txId}
              transactionIdKind={props.payment.walletTxResult!.txIdKind}
              intentId={props.payment.instruction?.intentId ?? null}
              onStartNewPayment={props.actions.startNewPayment}
            />
          ) : null}

          {stage === 'failed' ? (
            <div className="mt-5 space-y-4">
              {props.wallet.paymentWalletError ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-rose-700 dark:text-rose-100">
                    Payment needs attention
                  </div>
                  <IssueTooltipIcon
                    summary="Payment needs attention"
                    message={props.wallet.paymentWalletError}
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap justify-end gap-3">
                {props.wallet.canUseWalletCheckout ? (
                  <Button type="button" variant="brand" onClick={props.actions.buy}>
                    Try wallet again
                  </Button>
                ) : null}
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

    const issueKey = `${issue.toastTitle}:${issue.message}`;
    if (lastIssueRef.current === issueKey) {
      return;
    }

    lastIssueRef.current = issueKey;
    toast.error(issue.toastTitle, {
      description: issue.message,
      id: 'buy-wallet-checkout-issue',
    });
  }, [issue]);
}

function usePaymentAttentionToast(message: string | null) {
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      lastMessageRef.current = null;
      return;
    }

    if (lastMessageRef.current === message) {
      return;
    }

    lastMessageRef.current = message;
    toast.error('Payment needs attention', {
      description: message,
      id: 'buy-payment-attention-error',
    });
  }, [message]);
}

function WalletCheckoutStageMessage(props: { stage: BuyWalletView['checkoutStage'] }) {
  switch (props.stage) {
    case 'preparing_wallet_action':
      return <InlineProgress message="Preparing your transaction..." />;
    case 'waiting_for_wallet_approval':
      return <InlineProgress message="Confirm the transaction in your wallet." />;
    case 'submitting_tx_result':
      return <InlineProgress message="Submitting your transaction for verification..." />;
    case 'tracking':
      return <InlineProgress message="Waiting for blockchain confirmation..." />;
    default:
      return null;
  }
}

function OrderSummary(props: { pay: string; receive: string; assetLabel: string }) {
  return (
    <div className="mt-5 grid gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--buy-panel-soft)] p-4 text-sm sm:grid-cols-3">
      <div>
        <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">You Pay</div>
        <div className="mt-1 font-bold text-[var(--text)]">{props.pay}</div>
      </div>
      <div>
        <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">You Receive</div>
        <div className="mt-1 font-bold text-[var(--green)]">{props.receive}</div>
      </div>
      <div>
        <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">Asset</div>
        <div className="mt-1 font-bold text-[var(--text)]">{props.assetLabel}</div>
      </div>
    </div>
  );
}

function WalletConnectorPicker(props: {
  connectorNames: string[];
  pendingConnectorName: string | null;
  isConnecting: boolean;
  disabled: boolean;
  onConnect: (connectorName: string) => void;
}) {
  if (props.connectorNames.length === 0) {
    return (
      <div className="rounded-md bg-amber-300/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
        No supported wallet connectors are available in this browser.
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center gap-7">
      {props.connectorNames.map(connectorName => {
        const isPending = props.isConnecting && props.pendingConnectorName === connectorName;
        return (
          <button
            key={connectorName}
            type="button"
            disabled={props.disabled}
            onClick={() => props.onConnect(connectorName)}
            className={cn(
              'group flex h-24 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 text-center transition-colors',
              'border-(--card-border) bg-(--buy-panel-soft) text-(--muted)',
              'hover:border-(--cyan) hover:bg-(--surface-elevated) hover:text-(--text)',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--cyan)/35',
              'disabled:pointer-events-none disabled:opacity-60',
              isPending && 'border-(--cyan)/40 bg-(--surface-elevated) text-(--text)',
            )}
            aria-label={`Connect ${getConnectorLabel(connectorName)}`}
          >
            <span className="relative flex h-10 w-10 items-center justify-center">
              <WalletConnectorIcon connectorName={connectorName} className="h-8 w-8" size={32} />
              {isPending ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-(--surface-elevated) p-0.5">
                  <Loader2 className="h-4 w-4 animate-spin text-(--cyan)" />
                </span>
              ) : null}
            </span>
            <span className="line-clamp-2 text-xs font-semibold leading-4">{getConnectorLabel(connectorName)}</span>
          </button>
        );
      })}
    </div>
  );
}

type IssueTooltipTone = 'error' | 'warning';

function IssueTooltipIcon(props: {
  summary: string;
  message: string;
  tone?: IssueTooltipTone;
  align?: 'start' | 'center' | 'end';
}) {
  const tone = props.tone ?? 'error';
  const triggerClassName = tone === 'warning'
    ? 'rounded-full p-0.5 text-amber-500/65 transition-colors hover:text-amber-500/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40 dark:text-amber-300/65 dark:hover:text-amber-200/90'
    : 'rounded-full p-0.5 text-rose-500/55 transition-colors hover:text-rose-500/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400/40 dark:text-rose-300/55 dark:hover:text-rose-200/80';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={triggerClassName}
            aria-label={`${props.summary}: ${props.message}`}
          >
            <CircleAlert className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          align={props.align ?? 'end'}
          className="max-w-72 border-(--card-border) bg-(--surface-elevated) text-sm leading-5 text-(--text) shadow-md"
        >
          {props.message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ConnectedWalletPanel(props: { wallet: BuyWalletView; walletIssue: WalletCheckoutIssue | null }) {
  const walletStatus = props.wallet.walletStatus;
  return (
    <GlassPanel className="rounded-lg bg-[var(--buy-panel-soft)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">Connected Wallet</div>
          <div className="mt-1 font-data text-sm font-bold text-[var(--text)]">
            {walletStatus.address ? truncateMiddle(walletStatus.address, 12, 8) : 'Not connected'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs font-bold text-[var(--cyan)]">
            {walletStatus.connectorName ? getConnectorLabel(walletStatus.connectorName) : walletStatus.providerStatus}
          </div>
          {props.walletIssue ? (
            <IssueTooltipIcon summary={props.walletIssue.summary} message={props.walletIssue.message} />
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <StatusCell label="Chain" value={walletStatus.walletChainId ?? (walletStatus.chainId ? String(walletStatus.chainId) : 'Unknown')} />
        <StatusCell
          label="Verified"
          value={walletStatus.verificationStatus}
          issue={walletStatus.verificationError
            ? {
                summary: 'Wallet verification failed',
                message: walletStatus.verificationError,
              }
            : null}
        />
        <StatusCell label="Readiness" value={walletStatus.executionReadiness} />
      </div>
    </GlassPanel>
  );
}

function StatusCell(props: {
  label: string;
  value: string;
  issue?: { summary: string; message: string } | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">{props.label}</div>
        {props.issue ? (
          <IssueTooltipIcon summary={props.issue.summary} message={props.issue.message} align="end" />
        ) : null}
      </div>
      <div className="mt-1 font-bold text-[var(--text)]">{props.value}</div>
    </div>
  );
}

function DirectInstructions(props: {
  instruction: PaymentInstructionSummary;
  isCheckingStatus: boolean;
  statusError: string | null;
  onStartNewPayment: () => void;
}) {
  const instruction = props.instruction;
  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={instruction.status} />
            {props.isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" /> : null}
            {props.statusError ? (
              <IssueTooltipIcon
                summary="Payment status update delayed"
                message={props.statusError}
                tone="warning"
              />
            ) : null}
          </div>
          <div className="mt-4 text-sm font-semibold text-[var(--text)]">{instruction.statusTitle}</div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{instruction.statusDescription}</p>
        </div>
        <div className="mx-auto shrink-0 rounded-xl border border-[var(--card-border)] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] lg:mx-0">
          <QRCodeSVG value={instruction.qrValue} size={190} level="M" aria-label="Payment QR code" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <CopyBox
          label="Exact Amount"
          value={instruction.exactAmountDisplay}
          clipboardValue={instruction.exactAmountDisplay.split(' ')[0] ?? instruction.exactAmountDisplay}
        />
        <CopyBox label="Receiving Address" value={instruction.receiverAddress} clipboardValue={instruction.receiverAddress} />
        <InfoBox label="Network" value={instruction.networkLabel} />
        <InfoBox label="Expires" value={instruction.expiresAtDisplay} />
      </div>

      <DirectPaymentFooter paymentUri={instruction.paymentUri} onStartNewPayment={props.onStartNewPayment} />
    </div>
  );
}

function DirectPaymentFooter(props: {
  paymentUri: string | null;
  onStartNewPayment: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--buy-panel-soft)] p-4">
      {props.paymentUri ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="brand" className="h-11 flex-1" asChild>
            <a href={props.paymentUri}>
              <Wallet className="h-4 w-4" />
              Open in wallet
            </a>
          </Button>
          <Button
            type="button"
            variant="glass"
            className="h-11 flex-1"
            onClick={() => copyText(props.paymentUri!)}
          >
            <Copy className="h-4 w-4" />
            Copy payment link
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          props.paymentUri && 'mt-4 border-t border-[var(--card-border)] pt-4',
        )}
      >
        <p className="text-xs leading-5 text-[var(--muted)]">
          Keep this window open while your transfer confirms.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="h-9 shrink-0 self-start px-3 text-[var(--muted)] hover:text-[var(--text)] sm:self-auto"
          onClick={props.onStartNewPayment}
        >
          Start new purchase
        </Button>
      </div>
    </div>
  );
}

function WalletTracking(props: {
  transactionId: string;
  transactionIdKind: string;
  intentId: string | null;
  onStartNewPayment: () => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      <GlassPanel className="rounded-lg bg-[var(--buy-panel-soft)] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-4 w-4 text-[var(--green)]" />
          <div>
            <div className="text-sm font-bold text-[var(--text)]">Transaction submitted</div>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Waiting for blockchain confirmation while the payment intent is tracked.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CopyBox label="Transaction ID" value={truncateMiddle(props.transactionId, 14, 10)} clipboardValue={props.transactionId} />
          <InfoBox label="Payment Intent" value={props.intentId ? truncateMiddle(props.intentId, 14, 8) : 'Tracking'} />
        </div>
        <div className="mt-3 text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
          {props.transactionIdKind}
        </div>
      </GlassPanel>
      <Button type="button" variant="glass" onClick={props.onStartNewPayment}>
        Buy again
      </Button>
    </div>
  );
}

function InfoBox(props: { label: string; value: string }) {
  return (
    <GlassPanel className="rounded-[0.75rem] bg-[var(--buy-panel-soft)] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.label}</div>
      <div className="mt-1 break-words font-data text-sm font-bold text-[var(--text)]">{props.value}</div>
    </GlassPanel>
  );
}

function CopyBox(props: { label: string; value: string; clipboardValue: string }) {
  return (
    <GlassPanel className="rounded-[0.75rem] bg-[var(--buy-panel-soft)] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.label}</div>
      <div className="mt-1 break-words font-data text-sm font-bold text-[var(--text)]">{props.value}</div>
      <Button type="button" variant="link" className="mt-2 h-auto p-0 text-[var(--cyan)]" onClick={() => copyText(props.clipboardValue)}>
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    </GlassPanel>
  );
}

function InlineProgress(props: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--card-border)] bg-[var(--buy-panel-soft)] px-4 py-3 text-sm text-[var(--muted)]">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" />
      <span>{props.message}</span>
    </div>
  );
}
