'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { GlassPanel } from '@/components/glass-panel';
import { StatusPill } from '@/components/flowdex/primitives';
import { truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Copy, Loader2, ShieldCheck, Wallet, X } from '@/icons';
import { cn } from '@/lib/utils';
import { describeUnsupportedWalletReason } from '../utils/get-buy-execution-readiness';
import type { BuyActions, BuyOrderView, BuyPaymentView, BuyWalletView, PaymentInstructionSummary } from '../types/buy-view-model';

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
    default:
      return connectorName;
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

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && props.actions.closeCheckout()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-6 text-[var(--text)] shadow-[0_24px_90px_rgba(0,0,0,0.36)] outline-none',
            isWide && 'w-[min(calc(100vw-2rem),46rem)]',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold">{getTitle(stage)}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {props.wallet.canUseWalletCheckout
                  ? 'Connect a wallet for direct checkout, or use manual instructions if you want to send funds yourself.'
                  : 'This asset uses direct-send instructions. Enter the wallet address you will pay from to continue.'}
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
                  <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                    Connect wallet
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {walletStatus.availableConnectorNames.map(connectorName => (
                      <Button
                        key={connectorName}
                        type="button"
                        variant="glass"
                        className="h-12 justify-start"
                        onClick={() => props.actions.connectWallet(connectorName)}
                        disabled={isBusy}
                      >
                        <Wallet className="h-4 w-4" />
                        {getConnectorLabel(connectorName)}
                      </Button>
                    ))}
                  </div>
                  {walletStatus.availableConnectorNames.length === 0 ? (
                    <div className="rounded-md border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                      No supported wallet connectors are available in this browser.
                    </div>
                  ) : null}
                </>
              ) : (
                <ConnectedWalletPanel wallet={props.wallet} />
              )}

              {walletStatus.connectionErrorMessage ? (
                <InlineIssue message={walletStatus.connectionErrorMessage} />
              ) : null}

              <WalletCheckoutStageMessage stage={stage} />

              {walletStatus.unsupportedReason ? (
                <InlineIssue message={describeUnsupportedWalletReason(walletStatus.unsupportedReason)} />
              ) : null}

              <div className="flex flex-wrap justify-between gap-3">
                <Button type="button" variant="glass" onClick={props.actions.useDirectSend} disabled={isBusy}>
                  Send directly
                </Button>
                {walletStatus.address ? (
                  <Button type="button" variant="brand" onClick={props.actions.startWalletPayment} disabled={isBusy}>
                    {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Continue with wallet
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {showDirectAddress ? (
            <div className="mt-5 space-y-4">
              <label className="block space-y-2" htmlFor="payment-wallet-address">
                <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                  Payment wallet address
                </span>
                <Input
                  id="payment-wallet-address"
                  value={props.wallet.paymentWalletAddress}
                  onChange={event => props.actions.setPaymentWalletAddress(event.target.value)}
                  placeholder="Wallet address"
                  className="h-12 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]"
                />
              </label>
              {props.wallet.paymentWalletError ? <InlineIssue message={props.wallet.paymentWalletError} /> : null}
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
              {props.wallet.paymentWalletError ? <InlineIssue message={props.wallet.paymentWalletError} /> : null}
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="glass" onClick={props.actions.useDirectSend}>
                  Send directly
                </Button>
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
    <div className="mt-5 grid gap-3 rounded-lg border border-[var(--card-border)] bg-[#050c16] p-4 text-sm sm:grid-cols-3">
      <div>
        <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">You Pay</div>
        <div className="mt-1 font-bold text-[var(--text)]">{props.pay}</div>
      </div>
      <div>
        <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">You Receive</div>
        <div className="mt-1 font-bold text-emerald-300">{props.receive}</div>
      </div>
      <div>
        <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">Asset</div>
        <div className="mt-1 font-bold text-[var(--text)]">{props.assetLabel}</div>
      </div>
    </div>
  );
}

function ConnectedWalletPanel(props: { wallet: BuyWalletView }) {
  const walletStatus = props.wallet.walletStatus;
  return (
    <GlassPanel className="rounded-lg bg-[#050c16] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">Connected Wallet</div>
          <div className="mt-1 font-data text-sm font-bold text-[var(--text)]">
            {walletStatus.address ? truncateMiddle(walletStatus.address, 12, 8) : 'Not connected'}
          </div>
        </div>
        <div className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs font-bold text-[var(--cyan)]">
          {walletStatus.connectorName ? getConnectorLabel(walletStatus.connectorName) : walletStatus.providerStatus}
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <StatusCell label="Chain" value={walletStatus.walletChainId ?? (walletStatus.chainId ? String(walletStatus.chainId) : 'Unknown')} />
        <StatusCell label="Verified" value={walletStatus.verificationStatus} />
        <StatusCell label="Readiness" value={walletStatus.executionReadiness} />
      </div>
      {walletStatus.verificationError ? <p className="mt-3 text-sm text-rose-200">{walletStatus.verificationError}</p> : null}
    </GlassPanel>
  );
}

function StatusCell(props: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">{props.label}</div>
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
    <div className="mt-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Send the exact amount shown below. This page updates automatically.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusPill status={instruction.status} />
            {props.isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" /> : null}
          </div>
          <div className="mt-4 text-sm font-semibold text-[var(--text)]">{instruction.statusTitle}</div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{instruction.statusDescription}</p>
          {props.statusError ? <p className="mt-3 text-sm text-amber-200">{props.statusError}</p> : null}
        </div>
        <div className="rounded-[0.9rem] border border-[var(--card-border)] bg-white p-3">
          <QRCodeSVG value={instruction.qrValue} size={190} level="M" aria-label="Payment QR code" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <CopyBox
          label="Exact Amount"
          value={instruction.exactAmountDisplay}
          clipboardValue={instruction.exactAmountDisplay.split(' ')[0] ?? instruction.exactAmountDisplay}
        />
        <CopyBox label="Receiving Address" value={instruction.receiverAddress} clipboardValue={instruction.receiverAddress} />
        <InfoBox label="Network" value={instruction.networkLabel} />
        <InfoBox label="Expires" value={instruction.expiresAtDisplay} />
      </div>

      {instruction.paymentUri ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="glass" onClick={() => copyText(instruction.paymentUri!)}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button type="button" variant="brand" asChild>
            <a href={instruction.paymentUri}>Open wallet</a>
          </Button>
        </div>
      ) : null}

      <Button type="button" variant="glass" className="mt-4" onClick={props.onStartNewPayment}>
        Buy again
      </Button>
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
      <GlassPanel className="rounded-lg bg-[#050c16] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-4 w-4 text-emerald-300" />
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
    <GlassPanel className="rounded-[0.75rem] bg-[#050c16] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.label}</div>
      <div className="mt-1 break-words font-data text-sm font-bold text-[var(--text)]">{props.value}</div>
    </GlassPanel>
  );
}

function CopyBox(props: { label: string; value: string; clipboardValue: string }) {
  return (
    <GlassPanel className="rounded-[0.75rem] bg-[#050c16] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.label}</div>
      <div className="mt-1 break-words font-data text-sm font-bold text-[var(--text)]">{props.value}</div>
      <Button type="button" variant="link" className="mt-2 h-auto p-0 text-[var(--cyan)]" onClick={() => copyText(props.clipboardValue)}>
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    </GlassPanel>
  );
}

function InlineIssue(props: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{props.message}</span>
    </div>
  );
}

function InlineProgress(props: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--card-border)] bg-[#050c16] px-4 py-3 text-sm text-[var(--muted)]">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" />
      <span>{props.message}</span>
    </div>
  );
}
