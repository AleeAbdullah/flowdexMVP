'use client';

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
  Globe2,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
} from '@/icons';
import type { BuyActionId, BuyInlineAlert, BuyUiTone, BuyViewModel, SupportedAssetOption } from '../types/buy-view-model';

type WalletTrayButton = {
  id: string;
  label: string;
  caption: string;
  mode: 'direct' | 'fallback';
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

type WalletSupportSummary = {
  directSupportCopy: string;
  walletConnectCompatibilityCopy: string;
  primarySupportCopy: string;
};

export type WalletBuyShellProps = {
  viewModel: BuyViewModel;
  walletStatusLabel: string;
  connectedWalletAddress: string | null;
  sessionWalletChecksum: string | null;
  verifiedChainLabel: string | null;
  selectedChainLabel: string;
  selectedAsset: SupportedAssetOption | null;
  supportedAssets: SupportedAssetOption[];
  selectedAssetId: string;
  onAssetChange: (value: string) => void;
  amountDisplay: string;
  onAmountChange: (value: string) => void;
  contributionEnabled: boolean;
  estimatedContributionUsdDisplay: string;
  estimatedTokensDisplay: string;
  latestExplorerUrl: string | null;
  walletSupportSummary: WalletSupportSummary;
  approvedDirectWalletDisplayNames: string[];
  walletConnectCompatibleDisplayNames: string[];
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

function alertToneClasses(tone: BuyUiTone) {
  switch (tone) {
    case 'success':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100';
    case 'warning':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-100';
    case 'danger':
      return 'border-rose-400/20 bg-rose-500/10 text-rose-100';
    case 'info':
      return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100';
    default:
      return 'border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]';
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
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-300/25 bg-orange-500/10 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <MetaMaskIcon />
      </div>
    );
  }

  if (props.id === 'coinbase-wallet') {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-500/10 text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <CoinbaseIcon />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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
      <div className={cn('mt-1 font-data text-lg font-semibold', props.accent ? 'text-[var(--cyan)]' : 'text-[var(--text)]')}>
        {props.value}
      </div>
      {props.secondary ? (
        <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{props.secondary}</div>
      ) : null}
    </div>
  );
}

function BuyInlineAlertCard(props: { alert: BuyInlineAlert }) {
  return (
    <div className={cn('rounded-[1rem] border px-4 py-3', alertToneClasses(props.alert.tone))}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <div className="text-sm font-semibold">{props.alert.title}</div>
          <p className="text-sm leading-6 opacity-90">{props.alert.description}</p>
        </div>
      </div>
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
      className={cn(
        'group flex h-full min-h-[11rem] w-full flex-col justify-between rounded-[1.15rem] border p-4 text-left transition duration-200',
        'border-[var(--card-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_88%,var(--card-bg)),color-mix(in_srgb,var(--surface)_82%,var(--card-bg)))]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        'hover:border-[color-mix(in_srgb,var(--accent-strong)_38%,var(--card-border))] hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_96%,var(--card-bg)),color-mix(in_srgb,var(--surface)_88%,var(--card-bg)))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent-strong)_32%,transparent)]',
        props.button.disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <WalletBrandIcon id={props.button.id} />
        <Badge variant={props.button.mode === 'direct' ? 'brand' : 'subtle'} className="px-3 py-1 normal-case tracking-normal">
          {props.button.mode === 'direct' ? 'Direct' : 'Fallback'}
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

export function WalletBuyShell(props: WalletBuyShellProps) {
  const {
    viewModel,
    walletStatusLabel,
    connectedWalletAddress,
    sessionWalletChecksum,
    verifiedChainLabel,
    selectedChainLabel,
    selectedAsset,
    supportedAssets,
    selectedAssetId,
    onAssetChange,
    amountDisplay,
    onAmountChange,
    contributionEnabled,
    estimatedContributionUsdDisplay,
    estimatedTokensDisplay,
    latestExplorerUrl,
    walletSupportSummary,
    approvedDirectWalletDisplayNames,
    walletConnectCompatibleDisplayNames,
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
  } = props;

  return (
    <div className="section-shell section-pad">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <GlassPanel className="p-6 lg:p-7">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" className="w-fit gap-2 px-4 py-2">
                    <Wallet className="h-3.5 w-3.5" />
                    Presale Buy
                  </Badge>
                  <StatusPill status={walletStatusLabel.toUpperCase()} />
                  {selectedAsset ? (
                    <Badge variant="subtle" className="px-3 py-1 normal-case tracking-normal">
                      {selectedAsset.code} on {selectedChainLabel}
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--text)] md:text-[3.2rem]">
                    Buy into the presale.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    {walletSupportSummary.primarySupportCopy}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-2 text-[10px] font-bold tracking-[0.26em] text-[var(--cyan)] uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure wallet checkout
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
                      Presale raised {raisedDisplay}
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

            <div className={cn('rounded-[1.2rem] border px-5 py-5', toneClasses(viewModel.tone))}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill status={viewModel.status} className="tracking-[0.18em]" />
                    {connectedWalletAddress ? (
                      <span className="text-sm text-[var(--muted)]">{truncateMiddle(connectedWalletAddress)}</span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-[var(--text)]">{viewModel.title}</div>
                    <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{viewModel.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[17rem]">
                  <CompactMetric
                    label="Session Wallet"
                    value={sessionWalletChecksum ? truncateMiddle(sessionWalletChecksum) : 'Not verified'}
                  />
                  <CompactMetric
                    label="Verified Chain"
                    value={verifiedChainLabel ?? 'Not set'}
                  />
                </div>
              </div>

              {viewModel.alerts.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {viewModel.alerts.map(alert => (
                    <BuyInlineAlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              ) : null}
            </div>

            {viewModel.showWalletTray ? (
              <div className="rounded-[1.2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      <Sparkles className="h-4 w-4 text-[var(--cyan)]" />
                      Choose wallet
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                      {walletConnectEnabled
                        ? 'Use MetaMask or Coinbase Wallet, or open WalletConnect for more options.'
                        : walletSupportSummary.directSupportCopy}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {walletButtons.map(button => (
                      <WalletTrayCard key={button.id} button={button} />
                    ))}
                  </div>

                  {viewModel.showSupportDisclosure ? (
                    <details className="group rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]">
                        Supported wallets
                        <ChevronDown className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
                      </summary>
                      <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--muted)]">
                        <div className="space-y-2">
                          <div className="font-semibold text-[var(--text)]">Available now</div>
                          <p>{walletSupportSummary.directSupportCopy}</p>
                          <div className="flex flex-wrap gap-2">
                            {approvedDirectWalletDisplayNames.map(walletName => (
                              <Badge key={walletName} variant="brand" className="px-3 py-1 normal-case tracking-normal">
                                {walletName}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="font-semibold text-[var(--text)]">Also works with WalletConnect</div>
                          <p>{walletSupportSummary.walletConnectCompatibilityCopy}</p>
                          {walletConnectEnabled && walletConnectCompatibleDisplayNames.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {walletConnectCompatibleDisplayNames.map(walletName => (
                                <Badge key={walletName} variant="subtle" className="px-3 py-1 normal-case tracking-normal">
                                  {walletName}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                      <Workflow className="h-3.5 w-3.5 text-[var(--cyan)]" />
                      Order
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                      Choose an asset, enter the amount, and complete your purchase when everything is ready.
                    </p>
                  </div>
                  {viewModel.dominantActionLabel ? (
                    <div className="rounded-full border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[var(--text)] uppercase">
                      {viewModel.dominantActionLabel}
                    </div>
                  ) : null}
                </div>

                {viewModel.showContributionForm ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                      <label className="space-y-2">
                        <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                          Asset & Network
                        </span>
                        <Select
                          value={selectedAssetId}
                          onValueChange={onAssetChange}
                          disabled={!contributionEnabled}
                        >
                          <SelectTrigger className="h-12 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]">
                            <SelectValue placeholder="Choose a supported chain" />
                          </SelectTrigger>
                          <SelectContent>
                            {supportedAssets.map(asset => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.code} on {asset.chain === 'BASE_SEPOLIA' ? 'Base Sepolia' : 'Ethereum Sepolia'}
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
                          placeholder={selectedAsset ? `Minimum ${selectedAsset.minAmount} ${selectedAsset.code}` : 'No supported asset available'}
                          className="h-12 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]"
                          disabled={!contributionEnabled}
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <CompactMetric label="Estimated USD" value={estimatedContributionUsdDisplay} />
                      <CompactMetric label="Estimated $FDN" value={estimatedTokensDisplay} accent />
                      <CompactMetric label="Confirmations" value={selectedAsset ? `${selectedAsset.minConfirmations}` : 'N/A'} />
                    </div>

                    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                      Minimum {selectedAsset ? `${selectedAsset.minAmount} ${selectedAsset.code}` : 'N/A'} on {selectedChainLabel}. Your connected wallet will be used for this purchase and its receipt.
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {viewModel.dominantActionLabel && viewModel.dominantActionId ? (
                        <Button
                          variant="brand"
                          onClick={() => onAction(viewModel.dominantActionId!)}
                          disabled={primaryActionDisabled}
                        >
                          {viewModel.isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {viewModel.dominantActionLabel}
                        </Button>
                      ) : (
                        <div className="rounded-full border border-dashed border-[var(--card-border)] px-4 py-2 text-xs font-semibold tracking-[0.16em] text-[color-mix(in_srgb,var(--text)_56%,transparent)] uppercase">
                          {viewModel.isBusy ? 'Action in progress' : 'Awaiting valid next action'}
                        </div>
                      )}

                      {viewModel.secondaryActionLabel && viewModel.secondaryActionId ? (
                        <Button
                          variant="glass"
                          onClick={() => onAction(viewModel.secondaryActionId!)}
                          disabled={secondaryActionDisabled}
                        >
                          {viewModel.secondaryActionLabel}
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-[var(--card-border)] bg-[var(--surface)] px-5 py-6">
                    <div className="flex items-start gap-3">
                      <Wallet className="mt-0.5 h-4 w-4 text-[var(--cyan)]" />
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-[var(--text)]">Connect a wallet to continue</div>
                        <p className="text-sm leading-6 text-[var(--muted)]">
                          Once you connect, you’ll be able to choose an asset, enter an amount, and complete the purchase here.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                <CompactMetric label="Selected Route" value={selectedAsset ? `${selectedAsset.code} / ${selectedChainLabel}` : 'Awaiting supported route'} />
                <CompactMetric label="Estimated Contribution" value={estimatedContributionUsdDisplay} secondary={`Listing ref ${listingReferenceDisplay}`} />
                <CompactMetric label="Estimated $FDN" value={estimatedTokensDisplay} accent />
              </div>

              {latestExplorerUrl ? (
                <Button variant="glass" asChild className="w-full">
                  <a href={latestExplorerUrl} target="_blank" rel="noreferrer">
                    View latest transaction on explorer
                  </a>
                </Button>
              ) : null}
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
                <CompactMetric label="Verified Wallet" value={sessionWalletChecksum ? truncateMiddle(sessionWalletChecksum) : 'Not verified'} />
                <CompactMetric label="Verified Network" value={verifiedChainLabel ?? 'Not set'} secondary="Use the same wallet to view receipts and activity later." />
              </div>

              <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--surface)] px-4 py-4">
                <div className="flex items-start gap-3">
                  {viewModel.isBusy
                    ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-[var(--cyan)]" />
                    : viewModel.step === 'receiptReady'
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      : <ArrowRight className="mt-0.5 h-4 w-4 text-[var(--cyan)]" />}
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-[var(--text)]">What happens next</div>
                    <div className="leading-6 text-[var(--muted)]">{viewModel.description}</div>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[var(--text)]">
                <ShieldCheck className="h-5 w-5 text-[var(--cyan)]" />
                <div className="text-lg font-bold">Need a different wallet?</div>
              </div>

              <div className="space-y-3 text-sm leading-6 text-[var(--muted)]">
                <p>{walletSupportSummary.directSupportCopy}</p>
                <p>
                  {walletConnectEnabled
                    ? `Use WalletConnect if you prefer another supported wallet, including ${walletConnectCompatibleDisplayNames.slice(0, 3).join(', ')}${walletConnectCompatibleDisplayNames.length > 3 ? ' and more' : ''}.`
                    : 'WalletConnect is not available right now, so only the direct options are shown.'}
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
