'use client';

import { GlassPanel } from '@/components/glass-panel';
import { truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Wallet } from '@/icons';
import type { BuyActions, BuyWalletView } from '../types/buy-view-model';
import { shouldRenderWalletConnectionStatus } from '../utils/buy-checkout-flow';

function getConnectorLabel(connectorName: string | null) {
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
      return connectorName ?? 'Wallet';
  }
}

export function WalletConnectionStatus(props: {
  wallet: BuyWalletView;
  actions: BuyActions;
}) {
  const status = props.wallet.walletStatus;
  const address = status.address;

  if (!address || !shouldRenderWalletConnectionStatus(address)) {
    return null;
  }

  return (
    <GlassPanel as="section" className="rounded-[1.15rem] bg-[var(--buy-panel)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">
            <Wallet className="h-4 w-4" />
            Wallet
          </div>
          <div className="mt-3 font-data text-sm font-bold text-[var(--text)]">
            {truncateMiddle(address, 12, 8)}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">{getConnectorLabel(status.connectorName)}</div>
        </div>
        <Button type="button" variant="glass" size="icon" onClick={props.actions.disconnectWallet} disabled={status.isDisconnecting}>
          {status.isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <StatusItem label="Chain" value={status.walletChainId ?? (status.chainId ? String(status.chainId) : 'Unknown')} />
        <StatusItem label="Verify" value={status.verificationStatus} />
        <StatusItem label="Ready" value={status.executionReadiness} />
      </div>

      {status.connectionErrorMessage ? (
        <p className="mt-4 rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-700 dark:text-rose-100">
          {status.connectionErrorMessage}
        </p>
      ) : null}
    </GlassPanel>
  );
}

function StatusItem(props: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.18em] text-[var(--muted)] uppercase">{props.label}</div>
      <div className="mt-1 truncate font-bold text-[var(--text)]">{props.value}</div>
    </div>
  );
}
