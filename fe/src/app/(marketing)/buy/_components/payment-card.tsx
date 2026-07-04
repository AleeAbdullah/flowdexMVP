'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from '@/icons';
import { getCryptoAssetIconSrc } from '@/constants/crypto-asset-icons';
import { cn } from '@/lib/utils';
import type { BuyActions, BuyOrderView, BuyPaymentView } from '../types/buy-view-model';

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
  payment: BuyPaymentView;
  actions: BuyActions;
}) {
  return (
    <section>
      <h1 className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">Payment Method</h1>
      <div className="mt-8 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_46%,transparent)] uppercase">
        Select Currency
      </div>
      <div className="mt-4 grid gap-3 grid-cols-3">
        {props.order.supportedAssets.map(asset => {
          const iconSrc = getCryptoAssetIconSrc(asset.code);
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => props.actions.selectAsset(asset.id)}
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition',
                props.order.selectedAsset?.id === asset.id
                  ? 'border-[var(--cyan)] bg-[var(--accent-bg)] text-[var(--text)]'
                  : 'border-[var(--card-border)] bg-[var(--buy-panel-soft)] text-[var(--muted)] hover:border-[var(--cyan)]',
              )}
            >
              {iconSrc ? (
                <img src={iconSrc} alt="" width={20} height={20} className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : null}
              {asset.label}
            </button>
          );
        })}
      </div>

      <label className="mt-8 block">
        <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_46%,transparent)] uppercase">
          Custom Amount
        </span>
        <div className="mt-4 flex h-20 items-center rounded-[0.75rem] border border-[var(--card-border)] bg-[var(--buy-panel-soft)] px-5">
          <Input
            value={props.order.amountDisplay}
            onChange={event => props.actions.changeAmount(event.target.value)}
            inputMode="decimal"
            className="h-auto border-0 bg-transparent p-0 font-data text-3xl font-black text-[var(--text)] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <span className="font-bold text-[var(--muted)]">{props.order.selectedAsset?.code ?? ''}</span>
        </div>
      </label>

      <div className="my-8 h-px bg-[var(--card-border)]" />
      <div className="space-y-5">
        <SummaryRow label="You Pay" value={props.order.payDisplay} />
        <SummaryRow label="You Receive" value={props.order.receiveDisplay} accent />
        <SummaryRow label="Value at Listing" value={props.order.listingValueDisplay} />
        <SummaryRow label="Potential ROI" value={props.order.roiDisplay} accent />
      </div>

      {props.order.error ? <p className="mt-5 rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100">{props.order.error}</p> : null}
      <Button variant="brand" className="mt-8 h-14 w-full text-lg font-black" onClick={props.actions.buy} disabled={!props.order.canSubmit}>
        {props.payment.isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {props.payment.isCreating ? 'Starting payment' : props.order.buyButtonLabel}
      </Button>
    </section>
  );
}
