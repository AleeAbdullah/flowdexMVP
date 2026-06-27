'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from '@/icons';
import type { BuyActions, BuyPaymentView, BuyWalletView } from '../types/buy-view-model';

export function PaymentDialogs(props: {
  wallet: BuyWalletView;
  payment: BuyPaymentView;
  actions: BuyActions;
}) {
  return (
    <DialogPrimitive.Root open={props.wallet.paymentWalletModalOpen} onOpenChange={props.actions.setPaymentWalletModalOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),30rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-6 text-[var(--text)] shadow-[0_24px_90px_rgba(0,0,0,0.36)] outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold">Add payment wallet</DialogPrimitive.Title>
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
              value={props.wallet.paymentWalletAddress}
              onChange={event => props.actions.setPaymentWalletAddress(event.target.value)}
              placeholder="Wallet address"
              className="h-12 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)]"
            />
            {props.wallet.paymentWalletError ? <p className="text-sm leading-6 text-rose-200">{props.wallet.paymentWalletError}</p> : null}
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <Button variant="glass">Cancel</Button>
            </DialogPrimitive.Close>
            <Button variant="brand" onClick={props.actions.buy} disabled={props.payment.isCreating}>
              {props.payment.isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {props.payment.isCreating ? 'Starting payment' : 'Continue to payment'}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
