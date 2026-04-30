'use client';

import { Button } from '@/components/ui/button';
import type { IWallet } from '@/dal/app/wallets/wallets.types';
import { GlassPanel } from '@/components/flowdex/primitives';
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
    <GlassPanel className="overflow-hidden">
      <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        Linked Wallets
      </div>

      {props.errorMessage ? (
        <div className="px-6 py-5 text-sm text-rose-200">
          {props.errorMessage}
        </div>
      ) : null}

      {props.isLoading && props.wallets.length === 0 ? (
        <div className="px-6 py-5 text-sm text-[var(--muted)]">
          Loading linked wallets…
        </div>
      ) : null}

      {props.wallets.length === 0 ? (
        <div className="px-6 py-5 text-sm text-[var(--muted)]">
          No linked wallets yet.
        </div>
      ) : props.wallets.map(wallet => (
        <div
          key={wallet.id}
          className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="font-semibold text-[var(--text)]">
              {NETWORK_LABELS[wallet.network] ?? wallet.network}
            </div>
            <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
              {wallet.address}
            </div>
            <div className="mt-1 text-xs text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
              {wallet.provider} • {wallet.trustLevel}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-cyan-200">{wallet.isPrimary ? 'Primary' : 'Linked'}</div>
            <Button
              variant="glass"
              size="sm"
              disabled={props.deleteState.isPending}
              onClick={() => {
                void props.deleteState.onDeleteWallet(wallet.id);
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </GlassPanel>
  );
}
