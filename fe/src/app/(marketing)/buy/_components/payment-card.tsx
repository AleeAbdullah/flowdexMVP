'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { truncateMiddle } from '@/components/flowdex/utils';
import { Loader2 } from '@/icons';
import { getCryptoAssetIconSrc } from '@/constants/crypto-asset-icons';
import { cn } from '@/lib/utils';
import type { BuyActions, BuyOrderView, BuyWalletView } from '../types/buy-view-model';

function SummaryRow(props: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--muted)]">{props.label}</span>
      <span className={cn('text-right font-bold text-[var(--text)]', props.accent && 'text-[var(--green)]')}>
        {props.value}
        {props.note ? <span className="ml-1 text-xs font-medium text-[var(--muted)]">{props.note}</span> : null}
      </span>
    </div>
  );
}

export function PaymentCard(props: {
  order: BuyOrderView;
  wallet: BuyWalletView;
  actions: BuyActions;
}) {
  const selectedAsset = props.order.selectedAsset;
  const selectedAssetIcon = getCryptoAssetIconSrc(selectedAsset?.code);
  const walletStatus = props.wallet.walletStatus;
  const canChooseWalletConnector = (
    selectedAsset?.chain === 'BITCOIN'
    || selectedAsset?.chain === 'TRON'
  ) && !walletStatus.address && walletStatus.availableConnectorNames.length > 1;

  return (
    <section>
      <h1 className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">Payment Method</h1>
      <label htmlFor="buy-payment-amount" className="mt-8 block">
        <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_46%,transparent)] uppercase">
          You pay
        </span>
        <div className="mt-3 flex min-h-20 items-center gap-3 rounded-[0.85rem] border border-[var(--card-border)] bg-[var(--buy-panel-soft)] px-5 transition focus-within:border-[var(--cyan)]">
          <Input
            id="buy-payment-amount"
            value={props.order.amountDisplay}
            onChange={event => props.actions.changeAmount(event.target.value)}
            inputMode="decimal"
            aria-label="Payment amount"
            className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 font-data text-3xl font-black text-[var(--text)] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Select value={selectedAsset?.id ?? ''} onValueChange={props.actions.selectAsset}>
            <SelectTrigger
              aria-label="Payment asset"
              className="h-11 w-auto min-w-28 shrink-0 gap-2 border-[var(--card-border)] bg-[var(--surface-elevated)] px-3 font-bold text-[var(--text)] focus:ring-[var(--cyan)]"
            >
              <span className="!flex flex-nowrap items-center gap-2 whitespace-nowrap">
                {selectedAssetIcon ? (
                  <Image src={selectedAssetIcon} alt="" width={22} height={22} className="h-5.5 w-5.5" aria-hidden="true" unoptimized />
                ) : null}
                <SelectValue placeholder="Asset">
                  {selectedAsset?.code}
                </SelectValue>
              </span>
            </SelectTrigger>
            <SelectContent>
              {props.order.supportedAssets.map(asset => {
                const iconSrc = getCryptoAssetIconSrc(asset.code);
                return (
                  <SelectItem key={asset.id} value={asset.id}>
                    <span className="flex items-center gap-2 pr-2 font-bold">
                      {iconSrc ? (
                        <Image src={iconSrc} alt="" width={20} height={20} className="h-5 w-5" aria-hidden="true" unoptimized />
                      ) : null}
                      <span>{asset.code}</span>
                      <span className="font-medium text-[var(--muted)]">{asset.label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </label>

      <div className="mt-4 rounded-[0.85rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--buy-panel-soft)_76%,transparent)] px-5 py-4">
        <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">You receive</div>
        <div className="mt-2 font-data text-2xl font-black text-[var(--green)]">{props.order.receiveDisplay}</div>
      </div>

      <div className="mt-6 space-y-4 border-t border-[var(--card-border)] pt-6">
        <SummaryRow label="Value at Listing" value={props.order.listingValueDisplay} />
        <SummaryRow label="Potential ROI" value={props.order.roiDisplay} accent />
      </div>

      {canChooseWalletConnector ? (
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-[0.75rem] border border-[var(--card-border)] bg-[var(--buy-panel-soft)] p-1">
          {walletStatus.availableConnectorNames.map(connectorName => {
            const isSelected = walletStatus.selectedConnectorName === connectorName;
            return (
              <button
                key={connectorName}
                type="button"
                aria-pressed={isSelected}
                onClick={() => props.actions.selectWalletConnector(connectorName)}
                className={cn(
                  'min-h-10 rounded-sm px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]',
                  isSelected
                    ? 'bg-[var(--accent-bg)] text-[var(--cyan)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]',
                )}
              >
                {connectorName}
              </button>
            );
          })}
        </div>
      ) : null}

      {walletStatus.address ? (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-[0.75rem] border border-[var(--card-border)] bg-[var(--buy-panel-soft)] px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
              {walletStatus.connectorName ?? 'Connected wallet'}
            </div>
            <div className="mt-1 truncate font-data text-sm font-bold text-[var(--text)]">
              {truncateMiddle(walletStatus.address, 10, 8)}
            </div>
          </div>
          <button
            type="button"
            onClick={props.actions.disconnectWallet}
            disabled={walletStatus.isDisconnecting}
            className="shrink-0 rounded-sm text-xs font-bold text-[var(--cyan)] transition hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50"
          >
            {walletStatus.isDisconnecting ? 'Disconnecting' : 'Change'}
          </button>
        </div>
      ) : null}

      {props.order.error ? <p className="mt-5 rounded-md border border-[var(--status-error-border)] bg-[var(--status-error-surface)] px-4 py-3 text-sm text-[var(--status-error-text)]">{props.order.error}</p> : null}
      {!props.order.error && walletStatus.connectionErrorMessage ? (
        <p className="mt-5 rounded-md border border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] px-4 py-3 text-sm text-[var(--status-warning-text)]">
          {walletStatus.connectionErrorMessage}
        </p>
      ) : null}
      <Button
        variant="brand"
        className="mt-8 h-14 w-full text-lg font-black"
        onClick={props.actions.buy}
        disabled={!props.order.canSubmit || props.order.isPrimaryActionBusy}
      >
        {props.order.isPrimaryActionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {props.order.primaryActionLabel}
      </Button>
    </section>
  );
}
