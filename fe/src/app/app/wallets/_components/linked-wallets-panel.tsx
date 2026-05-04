'use client';

import type { IWallet } from '@/dal/app/wallets/wallets.types';
import { ConfirmationDialog } from '@/components/flowdex/confirmation-dialog';
import { GlassPanel } from '@/components/flowdex/primitives';
import { ShieldCheck, Wallet } from '@/icons';
import { NETWORK_LABELS } from '../constants';

export function LinkedWalletsPanel(props: {
  wallets: IWallet[];
  deleteState: {
    isPending: boolean;
    onDeleteWallet: (walletId: string) => Promise<unknown>;
  };
  errorMessage: string | null;
  isLoading: boolean;
}) {
  return (
    <GlassPanel className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] pb-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Linked wallets
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Review wallet access for this account.
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--cyan)]">
          <Wallet className="h-4 w-4" />
        </div>
      </div>

      {props.errorMessage ? (
        <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {props.errorMessage}
        </div>
      ) : null}

      {props.isLoading && props.wallets.length === 0 ? (
        <div className="mt-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--muted)]">
          Loading linked wallets...
        </div>
      ) : null}

      {props.wallets.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_42%,transparent)] px-3 py-3 text-sm text-[var(--muted)]">
          This area will show linked wallets after setup.
        </div>
      ) : (
        <div className="mt-3 max-h-[calc(100dvh-16rem)] space-y-3 overflow-y-auto pr-1">
          {props.wallets.map(wallet => (
            <div
              key={wallet.id}
              className="rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_36%,var(--card-bg))] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--cyan)]" />
                    <span>{NETWORK_LABELS[wallet.network] ?? wallet.network}</span>
                  </div>
                  <div className="mt-2 break-all text-xs leading-5 text-[color-mix(in_srgb,var(--text)_58%,transparent)]">
                    {wallet.address}
                  </div>
                </div>
                <div className="shrink-0 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-2 py-1 text-[10px] font-bold text-[var(--cyan)]">
                  {wallet.isPrimary ? 'Primary' : 'Linked'}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold text-[color-mix(in_srgb,var(--text)_52%,transparent)]">
                  {wallet.provider} / {wallet.trustLevel}
                </div>
                <ConfirmationDialog
                  title="Remove Linked Wallet"
                  description={`Remove wallet ${wallet.address} from ${NETWORK_LABELS[wallet.network] ?? wallet.network}. You can link it again later if you need it.`}
                  triggerLabel="Remove"
                  confirmLabel="Remove Wallet"
                  pendingLabel="Removing..."
                  disabled={props.deleteState.isPending}
                  isPending={props.deleteState.isPending}
                  onConfirm={() => props.deleteState.onDeleteWallet(wallet.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
