'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';
import { GlassPanel, StatusPill } from '@/components/flowdex/primitives';
import { formatDateTime, truncateMiddle } from '@/components/flowdex/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  Globe2,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
  X,
} from '@/icons';
import { VESTING_LABELS } from '@/components/flowdex/buy-page-content';
import type {
  ActivePaymentView,
  BuyActionId,
  BuyUiTone,
  PaymentInstructionSummary,
  SupportedAssetOption,
} from '../types/buy-view-model';

type WalletTrayButton = {
  id: string;
  label: string;
  caption: string;
  mode: 'direct' | 'session-gated';
  busy?: boolean;
  connected?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

type WalletSupportSummary = {
  directSupportCopy: string;
  walletConnectCompatibilityCopy: string;
  primarySupportCopy: string;
};

const vestingStageColorClasses = [
  'bg-[var(--token-bar-community)]',
  'bg-[var(--token-bar-staking)]',
  'bg-[var(--token-bar-contributors)]',
  'bg-[var(--token-bar-treasury)]',
];

export type WalletBuyShellProps = {
  walletStatusLabel: string;
  connectedWalletAddress: string | null;
  sessionWalletChecksum: string | null;
  verifiedChainLabel: string | null;
  walletChainLabel: string | null;
  selectedChainLabel: string;
  selectedAsset: SupportedAssetOption | null;
  supportedAssets: SupportedAssetOption[];
  selectedAssetId: string;
  onAssetChange: (value: string) => void;
  amountDisplay: string;
  onAmountChange: (value: string) => void;
  quickBuyAmounts: number[];
  selectedQuickBuyAmount: number | null;
  onQuickBuyAmountChange: (amount: number) => void;
  contributionEnabled: boolean;
  estimatedContributionUsdDisplay: string;
  estimatedTokensDisplay: string;
  latestExplorerUrl: string | null;
  walletSupportSummary: WalletSupportSummary;
  primaryWalletSupportCopy: string;
  approvedDirectWalletDisplayNames: string[];
  walletConnectEnabled: boolean;
  walletButtons: WalletTrayButton[];
  primaryActionDisabled: boolean;
  secondaryActionDisabled: boolean;
  onAction: (actionId: BuyActionId) => void;
  currentTier: number;
  tokenPriceDisplay: string;
  raisedDisplay: string;
  raisedProgressPercent: number;
  sourceUpdatedAt: string | null;
  listingReferenceDisplay: string;
  paymentWalletAddress: string;
  onPaymentWalletAddressChange: (value: string) => void;
  paymentWalletModalOpen: boolean;
  onPaymentWalletModalOpenChange: (open: boolean) => void;
  paymentWalletError: string | null;
  activePayment: ActivePaymentView | null;
  paymentInstruction: PaymentInstructionSummary | null;
  isCreatingIntent: boolean;
  isCheckingStatus: boolean;
  statusError: string | null;
};

function toneClasses(tone: BuyUiTone) {
  switch (tone) {
    case 'success':
      return 'border-emerald-400/20 bg-emerald-400/8';
    case 'warning':
      return 'border-amber-400/20 bg-amber-400/8';
    case 'danger':
      return 'border-rose-400/20 bg-rose-500/8';
    case 'info':
      return 'border-cyan-400/20 bg-cyan-400/8';
    default:
      return 'border-[var(--card-border)] bg-[var(--card-bg)]';
  }
}

function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 62 60" aria-hidden className="h-7 w-7">
      <path d="M57.932 57.946 44.578 53.954 34.509 60l-7.026-.003-10.076-6.043L4.06 57.946 0 44.186l4.06-15.272L0 16.003 4.06 0l20.856 12.51h12.16L57.932 0l4.06 16.003-4.06 12.911 4.06 15.272-4.06 13.76Z" fill="#FF5C16" />
      <path d="m4.063 0 20.856 12.518-.83 8.591L4.063 0Zm13.347 44.192 9.177 7.017-9.177 2.745v-9.762Zm8.443-11.603-1.763-11.473-11.29 7.802-.006-.003v.006l.035 8.03 4.578-4.361h8.446Zm32.079-32.589L37.076 12.518l.826 8.591L57.932 0ZM44.585 44.192l-9.177 7.017 9.177 2.745v-9.762Zm4.613-15.272v-.006l-.003.003-11.29-7.801-1.763 11.473h8.442l4.581 4.361.033-8.03Z" fill="#FF5C16" />
      <path d="m17.407 53.954-13.347 3.991L0 44.192h17.407v9.762Zm8.443-21.368L28.4 49.173l-3.534-9.223-12.043-3 4.58-4.364 8.447-.001Zm18.734 21.368 13.347 3.991 4.06-13.754H44.584v9.763Zm-8.442-21.368-2.55 16.587 3.533-9.223 12.043-3-4.584-4.364-8.442-.001Z" fill="#E34807" />
      <path d="m0 44.186 4.06-15.272h8.731l.032 8.034 12.044 2.999 3.533 9.222-1.816 2.031-9.176-7.018H0Zm61.992 0-4.06-15.272H49.2l-.032 8.034-12.043 2.999-3.534 9.222 1.816 2.031 9.177-7.018h17.408Zm-24.916-31.676h-12.16l-.826 8.591 4.31 28.06h5.192l4.313-28.06-.829-8.591Z" fill="#FF8D5D" />
      <path d="M4.06 0 0 16.003l4.06 12.911h8.731l11.296-7.804L4.06 0Zm19.267 35.917H19.37l-2.153 2.12 7.651 1.904-1.542-4.027v.003ZM57.932 0l4.06 16.003-4.06 12.911H49.2l-11.295-7.804L57.932 0ZM38.67 35.917h3.962l2.153 2.122-7.66 1.908 1.546-4.033ZM34.506 54.524l.902-3.317-1.816-2.031h-5.196l-1.816 2.031.902 3.317Z" fill="#661800" />
      <path d="M34.506 54.523V60h-7.023v-5.477h7.023Z" fill="#C0C4CD" />
      <path d="M17.41 53.948 27.489 59.997V54.52l-.902-3.316-9.177 2.744ZM44.584 53.948l-10.079 6.049V54.52l.902-3.316 9.177 2.744Z" fill="#E7EBF6" />
    </svg>
  );
}

function CoinbaseIcon() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden className="h-7 w-7">
      <path d="M30 0c16.568 0 30 13.432 30 30 0 16.568-13.432 30-30 30C13.432 60 0 46.568 0 30 0 13.432 13.432 0 30 0Z" fill="#0052FF" />
      <path d="M30.013 40.542c-5.831 0-10.542-4.724-10.542-10.542 0-5.818 4.724-10.542 10.542-10.542 5.219 0 9.553 3.8 10.386 8.785H51.02C50.121 17.414 41.063 8.902 30 8.902 18.351 8.902 8.902 18.351 8.902 30 8.902 41.649 18.351 51.098 30 51.098c11.063 0 20.121-8.512 21.019-19.341H40.386c-.833 4.985-5.154 8.785-10.373 8.785Z" fill="#fff" />
    </svg>
  );
}

function WalletConnectIcon() {
  return (
    <svg viewBox="0 0 24 15" aria-hidden className="h-6 w-8">
      <path d="M4.913 2.874c3.914-3.832 10.26-3.832 14.174 0l.471.461a.5.5 0 0 1 0 .694l-1.612 1.578a.25.25 0 0 1-.354 0l-.648-.635c-2.73-2.673-7.157-2.673-9.888 0l-.694.68a.25.25 0 0 1-.354 0L4.396 4.074a.5.5 0 0 1 0-.694l.517-.506Zm17.506 3.263 1.434 1.404a.49.49 0 0 1 0 .694l-6.466 6.331a.5.5 0 0 1-.709 0l-4.589-4.493a.125.125 0 0 0-.177 0l-4.59 4.493a.5.5 0 0 1-.709 0L.147 8.235a.49.49 0 0 1 0-.694L1.58 6.137a.5.5 0 0 1 .709 0l4.59 4.493a.125.125 0 0 0 .177 0l4.59-4.493a.5.5 0 0 1 .708 0l4.59 4.493a.125.125 0 0 0 .177 0l4.59-4.493a.5.5 0 0 1 .709 0Z" fill="#3396FF" />
    </svg>
  );
}

function WalletBrandIcon(props: { id: string }) {
  if (props.id === 'metamask') {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-300/25 bg-orange-500/10">
        <MetaMaskIcon />
      </div>
    );
  }

  if (props.id === 'coinbase-wallet') {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-500/10">
        <CoinbaseIcon />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10">
      <WalletConnectIcon />
    </div>
  );
}

function CompactMetric(props: {
  label: string;
  value: string;
  accent?: boolean;
  secondary?: ReactNode;
}) {
  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div className={cn('mt-1 break-words font-data text-lg font-semibold', props.accent ? 'text-[var(--cyan)]' : 'text-[var(--text)]')}>
        {props.value}
      </div>
      {props.secondary ? (
        <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{props.secondary}</div>
      ) : null}
    </div>
  );
}

function WalletTrayCard(props: {
  button: WalletTrayButton;
}) {
  return (
    <button
      type="button"
      onClick={props.button.onClick}
      disabled={props.button.disabled}
      aria-current={props.button.connected ? 'true' : undefined}
      className={cn(
        'group flex h-full min-h-[10rem] w-full flex-col justify-between rounded-[1.15rem] border p-4 text-left transition duration-200',
        'border-[var(--card-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_88%,var(--card-bg)),color-mix(in_srgb,var(--surface)_82%,var(--card-bg)))]',
        'hover:border-[color-mix(in_srgb,var(--accent-strong)_38%,var(--card-border))]',
        props.button.connected && 'border-emerald-300/40 bg-emerald-400/10',
        props.button.disabled && !props.button.connected && 'cursor-not-allowed opacity-45',
        props.button.connected && 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <WalletBrandIcon id={props.button.id} />
        <Badge variant={props.button.connected || props.button.mode === 'direct' ? 'brand' : 'subtle'} className="px-3 py-1 normal-case tracking-normal">
          {props.button.connected ? 'Connected' : props.button.mode === 'direct' ? 'Direct' : 'WalletConnect'}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold text-[var(--text)]">{props.button.label}</div>
          {props.button.busy ? <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" /> : null}
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">{props.button.caption}</p>
      </div>
    </button>
  );
}

function ConnectedWalletPanel(props: {
  button: WalletTrayButton | null;
  address: string;
  disconnectDisabled: boolean;
  onDisconnect: () => void;
}) {
  return (
    <div className="rounded-[1rem] border border-emerald-300/24 bg-emerald-400/10 px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {props.button ? <WalletBrandIcon id={props.button.id} /> : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface)]">
              <Wallet className="h-5 w-5 text-[var(--cyan)]" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-[var(--text)]">
                {props.button?.label ?? 'Wallet'} connected
              </div>
              <Badge variant="brand" className="px-2.5 py-1 normal-case tracking-normal">Active</Badge>
            </div>
            <div className="mt-1 font-data text-sm text-[var(--muted)]">{truncateMiddle(props.address)}</div>
          </div>
        </div>

        <Button
          variant="glass"
          onClick={props.onDisconnect}
          disabled={props.disconnectDisabled}
          className="w-full sm:w-auto"
        >
          Disconnect wallet
        </Button>
      </div>
    </div>
  );
}

function copyText(value: string) {
  if (!navigator.clipboard) {
    return;
  }

  void navigator.clipboard.writeText(value);
}

function QrCode(props: { value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-white p-3">
      <QRCodeSVG value={props.value} size={220} level="M" aria-label="Payment QR code" />
    </div>
  );
}

function PaymentInstructionPanel(props: {
  instruction: PaymentInstructionSummary;
  activePayment: ActivePaymentView;
  isCheckingStatus: boolean;
  statusError: string | null;
  latestExplorerUrl: string | null;
  onStartNewPayment: () => void;
}) {
  const { instruction } = props;

  return (
    <div className={cn('rounded-[1.2rem] border px-5 py-5', toneClasses(instruction.statusTone))}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-xl font-semibold text-[var(--text)]">Complete your payment</div>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Send the exact amount shown below. This page updates automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={instruction.status} />
            {props.isCheckingStatus ? (
              <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-[var(--text)]">{instruction.statusTitle}</div>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{instruction.statusDescription}</p>
          </div>
          {props.statusError ? (
            <div className="rounded-[1rem] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
              {props.statusError}
            </div>
          ) : null}
        </div>

        <QrCode value={instruction.qrValue} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CopyMetric label="Exact Amount" value={instruction.exactAmountDisplay} copyValue={instruction.exactAmountDisplay.split(' ')[0] ?? instruction.exactAmountDisplay} />
        <CopyMetric label="Receiving Address" value={truncateMiddle(instruction.receiverAddress)} copyValue={instruction.receiverAddress} />
        <CompactMetric label="Network" value={instruction.networkLabel} />
        <CompactMetric label="Expires" value={instruction.expiresAtDisplay} />
      </div>

      {instruction.paymentUri ? (
        <div className="mt-4 rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                Payment Link
              </div>
              <div className="mt-1 truncate text-sm text-[var(--muted)]">{instruction.paymentUri}</div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="glass" onClick={() => copyText(instruction.paymentUri!)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="brand" asChild>
                <a href={instruction.paymentUri}>Open wallet</a>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {props.latestExplorerUrl ? (
          <Button variant="glass" asChild>
            <a href={props.latestExplorerUrl} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          </Button>
        ) : null}
        <Button variant="glass" onClick={props.onStartNewPayment}>
          Buy again
        </Button>
      </div>
    </div>
  );
}

function CopyMetric(props: {
  label: string;
  value: string;
  copyValue: string;
}) {
  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div className="mt-1 break-words font-data text-lg font-semibold text-[var(--text)]">{props.value}</div>
      <Button variant="link" className="mt-2 h-auto p-0 text-[var(--cyan)]" onClick={() => copyText(props.copyValue)}>
        <Copy className="mr-2 h-3.5 w-3.5" />
        Copy
      </Button>
    </div>
  );
}

function PaymentWalletDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),30rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-6 text-[var(--text)] shadow-[0_24px_90px_rgba(0,0,0,0.36)] outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold">
                Add payment wallet
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Enter the wallet address you will pay from so we can track your payment when available.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-full border border-[var(--card-border)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)]">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-5 space-y-2">
            <label className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase" htmlFor="payment-wallet-address">
              Payment wallet address
            </label>
            <Input
              id="payment-wallet-address"
              value={props.value}
              onChange={event => props.onChange(event.target.value)}
              placeholder="Wallet address"
              className="h-12 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]"
            />
            {props.error ? <p className="text-sm leading-6 text-rose-200">{props.error}</p> : null}
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <Button variant="glass">Cancel</Button>
            </DialogPrimitive.Close>
            <Button
              variant="brand"
              onClick={props.onSubmit}
              disabled={props.isSubmitting}
            >
              {props.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue to payment
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function WalletBuyShell(props: WalletBuyShellProps) {
  const {
    walletStatusLabel,
    connectedWalletAddress,
    sessionWalletChecksum,
    verifiedChainLabel,
    walletChainLabel,
    selectedChainLabel,
    selectedAsset,
    supportedAssets,
    selectedAssetId,
    onAssetChange,
    amountDisplay,
    onAmountChange,
    quickBuyAmounts,
    selectedQuickBuyAmount,
    onQuickBuyAmountChange,
    contributionEnabled,
    estimatedContributionUsdDisplay,
    estimatedTokensDisplay,
    latestExplorerUrl,
    walletSupportSummary,
    approvedDirectWalletDisplayNames,
    walletConnectEnabled,
    walletButtons,
    primaryActionDisabled,
    secondaryActionDisabled,
    onAction,
    currentTier,
    tokenPriceDisplay,
    raisedDisplay,
    raisedProgressPercent,
    sourceUpdatedAt,
    listingReferenceDisplay,
    paymentWalletAddress,
    onPaymentWalletAddressChange,
    paymentWalletModalOpen,
    onPaymentWalletModalOpenChange,
    paymentWalletError,
    activePayment,
    paymentInstruction,
    isCreatingIntent,
    isCheckingStatus,
    statusError,
  } = props;
  const connectedWalletButton = connectedWalletAddress
    ? walletButtons.find(button => button.connected) ?? null
    : null;

  return (
    <div className="section-shell section-pad">
      <PaymentWalletDialog
        open={paymentWalletModalOpen}
        onOpenChange={onPaymentWalletModalOpenChange}
        value={paymentWalletAddress}
        onChange={onPaymentWalletAddressChange}
        error={paymentWalletError}
        onSubmit={() => onAction('submitContribution')}
        isSubmitting={isCreatingIntent}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <GlassPanel className="p-6 lg:p-7">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" className="w-fit gap-2 px-4 py-2">
                    <Wallet className="h-3.5 w-3.5" />
                    Buy $FDN
                  </Badge>
                  <StatusPill status={walletStatusLabel.toUpperCase()} />
                  {selectedAsset ? (
                    <Badge variant="subtle" className="px-3 py-1 normal-case tracking-normal">
                      {selectedAsset.label}
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--text)] md:text-[3.2rem]">
                    Buy $FDN
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    Choose an amount and pay with ETH, SOL, or BTC.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-2 text-[10px] font-bold tracking-[0.26em] text-[var(--cyan)] uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure payment
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[0.85fr_0.85fr_1.15fr]">
              <CompactMetric label="Current Tier" value={`Tier ${currentTier}`} secondary={`Listing ref ${listingReferenceDisplay}`} />
              <CompactMetric label="$FDN Price" value={tokenPriceDisplay} accent secondary={`Raised ${raisedDisplay}`} />
              <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                      Progress
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                      Raised {raisedDisplay}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[var(--cyan)]">{Math.round(raisedProgressPercent)}%</div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/6">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--cyan))]" style={{ width: `${Math.max(6, Math.min(100, raisedProgressPercent))}%` }} />
                </div>
                <div className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {sourceUpdatedAt ? `Synced ${formatDateTime(sourceUpdatedAt)}` : 'Using the latest available public market snapshot.'}
                </div>
              </div>
            </div>

            {paymentInstruction && activePayment ? (
              <PaymentInstructionPanel
                instruction={paymentInstruction}
                activePayment={activePayment}
                isCheckingStatus={isCheckingStatus}
                statusError={statusError}
                latestExplorerUrl={latestExplorerUrl}
                onStartNewPayment={() => onAction('startNewPayment')}
              />
            ) : (
              <div className="rounded-[1.2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                        <Workflow className="h-3.5 w-3.5 text-[var(--cyan)]" />
                        Order
                      </div>
                      <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                        Choose an amount and how you want to pay. Estimated $FDN is shown for review before you pay.
                      </p>
                    </div>
                    <div className="rounded-full border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[var(--text)] uppercase">
                      Ready to pay
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    {quickBuyAmounts.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => onQuickBuyAmountChange(amount)}
                        disabled={!contributionEnabled}
                        className={cn(
                          'rounded-[1rem] border px-4 py-3 text-left transition',
                          selectedQuickBuyAmount === amount
                            ? 'border-[var(--cyan)] bg-[var(--accent-bg)] text-[var(--text)]'
                            : 'border-[var(--card-border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent-border)] hover:text-[var(--text)]',
                          !contributionEnabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <span className="font-data text-xl font-semibold">${amount.toLocaleString('en-US')}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                    <label className="space-y-2">
                      <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                        Pay with
                      </span>
                      <Select
                        value={selectedAssetId}
                        onValueChange={onAssetChange}
                        disabled={!contributionEnabled}
                      >
                        <SelectTrigger className="h-12 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]">
                          <SelectValue placeholder="Choose a chain" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedAssets.map(asset => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                        Amount
                      </span>
                      <Input
                        value={amountDisplay}
                        onChange={event => onAmountChange(event.target.value)}
                        inputMode="decimal"
                        placeholder="500"
                        className="h-12 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]"
                        disabled={!contributionEnabled}
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <CompactMetric label="Purchase Amount" value={estimatedContributionUsdDisplay} />
                    <CompactMetric label="Estimated $FDN" value={estimatedTokensDisplay} accent />
                    <CompactMetric label="Chain" value={selectedChainLabel} />
                  </div>

                  {paymentWalletError ? (
                    <div className="rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
                      {paymentWalletError}
                    </div>
                  ) : null}

                  {walletChainLabel && walletChainLabel !== selectedChainLabel ? (
                    <div className="grid gap-3 rounded-[1rem] border border-amber-300/30 bg-amber-300/10 px-4 py-4 text-sm md:grid-cols-2">
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                          Connected wallet network
                        </div>
                        <div className="mt-1 font-semibold text-[var(--text)]">{walletChainLabel}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                          Payment network
                        </div>
                        <div className="mt-1 font-semibold text-[var(--text)]">{selectedChainLabel}</div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="brand"
                      onClick={() => onAction('submitContribution')}
                      disabled={primaryActionDisabled}
                    >
                      {isCreatingIntent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Pay now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <details className="group rounded-[1.2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <Sparkles className="h-4 w-4 shrink-0 text-[var(--cyan)]" />
                    Connect wallet
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                    {connectedWalletAddress
                      ? 'Disconnect the active wallet before selecting another one.'
                      : 'Connect wallet to prefill your payment address.'}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
              </summary>

              <div className="mt-4 space-y-4">
                {connectedWalletAddress ? (
                  <ConnectedWalletPanel
                    button={connectedWalletButton}
                    address={connectedWalletAddress}
                    disconnectDisabled={secondaryActionDisabled}
                    onDisconnect={() => onAction('disconnectWallet')}
                  />
                ) : null}

                <div className="grid gap-3 md:grid-cols-3">
                  {walletButtons.map(button => (
                    <WalletTrayCard key={button.id} button={button} />
                  ))}
                </div>

                <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-4">
                  <div className="space-y-4 text-sm leading-6 text-[var(--muted)]">
                    <p>{walletSupportSummary.directSupportCopy}</p>
                    <div className="flex flex-wrap gap-2">
                      {approvedDirectWalletDisplayNames.map(walletName => (
                        <Badge key={walletName} variant="brand" className="px-3 py-1 normal-case tracking-normal">
                          {walletName}
                        </Badge>
                      ))}
                    </div>
                    <p>
                      {walletConnectEnabled
                        ? walletSupportSummary.walletConnectCompatibilityCopy
                        : 'WalletConnect is not available right now, so only direct options are shown.'}
                    </p>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="p-5">
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-[var(--cyan)]">
                <ReceiptText className="h-5 w-5" />
                <div className="text-lg font-bold text-[var(--text)]">Purchase details</div>
              </div>

              <div className="space-y-4">
                <CompactMetric label="Pay with" value={selectedAsset ? selectedAsset.label : 'Choose a chain'} />
                <CompactMetric label="Purchase Amount" value={estimatedContributionUsdDisplay} secondary={`Listing ref ${listingReferenceDisplay}`} />
                <CompactMetric label="Estimated $FDN" value={estimatedTokensDisplay} accent />
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-[var(--text)]">
                <Workflow className="h-5 w-5 text-[var(--cyan)]" />
                <div className="text-lg font-bold">Vesting Preview</div>
              </div>

              <div className="overflow-hidden rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)]">
                {VESTING_LABELS.map((label, index) => (
                  <div
                    key={label}
                    className="flex min-h-12 items-center gap-3 border-b border-[var(--card-border)] px-4 py-3 text-sm font-semibold text-[var(--text)] last:border-b-0"
                  >
                    <span className={cn('h-3 w-3 rounded-sm', vestingStageColorClasses[index % vestingStageColorClasses.length])} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-[var(--text)]">
                <Globe2 className="h-5 w-5 text-[var(--cyan)]" />
                <div className="text-lg font-bold">Wallet</div>
              </div>

              <div className="space-y-4">
                <CompactMetric label="Connected Wallet" value={connectedWalletAddress ? truncateMiddle(connectedWalletAddress) : 'Not connected'} />
                <CompactMetric label="Paying Wallet" value={paymentWalletAddress ? truncateMiddle(paymentWalletAddress) : 'Not set'} />
                <CompactMetric label="Session Wallet" value={sessionWalletChecksum ? truncateMiddle(sessionWalletChecksum) : 'Not verified'} />
                <CompactMetric label="Verified Network" value={verifiedChainLabel ?? 'Not required'} secondary="Payment history can be searched by wallet address later." />
              </div>

              <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-4">
                <div className="flex items-start gap-3">
                  {paymentInstruction?.statusTone === 'success'
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    : paymentInstruction?.statusTone === 'warning' || paymentInstruction?.statusTone === 'danger'
                      ? <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                      : <ArrowRight className="mt-0.5 h-4 w-4 text-[var(--cyan)]" />}
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-[var(--text)]">What happens next</div>
                    <div className="leading-6 text-[var(--muted)]">
                      {paymentInstruction
                        ? paymentInstruction.statusDescription
                        : 'Choose an amount, tap Pay now, then send the exact amount shown on the next screen.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
