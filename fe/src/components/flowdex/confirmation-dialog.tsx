'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function ConfirmationDialog(props: {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  disabled?: boolean;
  isPending?: boolean;
  onConfirm: () => Promise<unknown>;
  pendingLabel?: string;
  title: string;
  triggerLabel: string;
  triggerVariant?: 'brand' | 'destructive' | 'glass' | 'outline' | 'secondary' | 'ghost' | 'link';
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          type="button"
          variant={props.triggerVariant ?? 'glass'}
          size="sm"
          disabled={props.disabled}
        >
          {props.triggerLabel}
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-6 text-[var(--text)] shadow-[0_24px_90px_rgba(0,0,0,0.36)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="text-lg font-bold">
            {props.title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {props.description}
          </DialogPrimitive.Description>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="glass" disabled={props.isPending}>
                {props.cancelLabel ?? 'Cancel'}
              </Button>
            </DialogPrimitive.Close>
            <Button
              type="button"
              variant="destructive"
              disabled={props.isPending}
              onClick={async () => {
                try {
                  await props.onConfirm();
                  setOpen(false);
                } catch {
                  // Mutation hooks own user-visible failure feedback.
                }
              }}
            >
              {props.isPending ? (props.pendingLabel ?? 'Working…') : props.confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
