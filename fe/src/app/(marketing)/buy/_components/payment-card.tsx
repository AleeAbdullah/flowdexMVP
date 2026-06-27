'use client';

import { QRCodeSVG } from 'qrcode.react';
import { GlassPanel } from '@/components/glass-panel';
import { StatusPill } from '@/components/flowdex/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Loader2 } from '@/icons';
import { cn } from '@/lib/utils';
import type { BuyActions, BuyOrderView, BuyPaymentView } from '../types/buy-view-model';

function copyText(value: string) {
  if (navigator.clipboard) {
    void navigator.clipboard.writeText(value);
  }
}

function SummaryRow(props: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--muted)]">{props.label}</span>
      <span className={cn('text-right font-bold text-[var(--text)]', props.accent && 'text-emerald-300')}>
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
  if (props.payment.instruction) {
    const instruction = props.payment.instruction;
    return (
      <GlassPanel as="section" className="rounded-[0.9rem] bg-[#07111d] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Complete your payment</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Send the exact amount shown below. This page updates automatically.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusPill status={instruction.status} />
              {props.payment.isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" /> : null}
            </div>
            <div className="mt-4 text-sm font-semibold text-[var(--text)]">{instruction.statusTitle}</div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{instruction.statusDescription}</p>
            {props.payment.statusError ? <p className="mt-3 text-sm text-amber-200">{props.payment.statusError}</p> : null}
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
            <Button variant="glass" onClick={() => copyText(instruction.paymentUri!)}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="brand" asChild>
              <a href={instruction.paymentUri}>Open wallet</a>
            </Button>
          </div>
        ) : null}

        <Button variant="glass" className="mt-4" onClick={props.actions.startNewPayment}>
          Buy again
        </Button>
      </GlassPanel>
    );
  }

  return (
    <section>
      <h1 className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">Payment Method</h1>
      <div className="mt-8 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_46%,transparent)] uppercase">
        Select Currency
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {props.order.supportedAssets.map(asset => (
          <button
            key={asset.id}
            type="button"
            onClick={() => props.actions.selectAsset(asset.id)}
            className={cn(
              'h-10 rounded-md border px-4 text-sm font-bold transition',
              props.order.selectedAsset?.id === asset.id
                ? 'border-[var(--cyan)] bg-[var(--accent-bg)] text-[var(--text)]'
                : 'border-[var(--card-border)] bg-[#060d17] text-[var(--muted)] hover:border-[var(--cyan)]',
            )}
          >
            {asset.label}
          </button>
        ))}
      </div>

      <label className="mt-8 block">
        <span className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_46%,transparent)] uppercase">
          Custom Amount
        </span>
        <div className="mt-4 flex h-20 items-center rounded-[0.75rem] border border-[var(--card-border)] bg-[#050c16] px-5">
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

      {props.order.error ? <p className="mt-5 rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{props.order.error}</p> : null}
      <Button variant="brand" className="mt-8 h-14 w-full text-lg font-black text-[#02111c]" onClick={props.actions.buy} disabled={!props.order.canSubmit}>
        {props.payment.isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {props.payment.isCreating ? 'Starting payment' : props.order.buyButtonLabel}
      </Button>
    </section>
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
      <Button variant="link" className="mt-2 h-auto p-0 text-[var(--cyan)]" onClick={() => copyText(props.clipboardValue)}>
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    </GlassPanel>
  );
}
