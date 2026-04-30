'use client';

import { CheckCircle2 } from '@/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassPanel, StatusPill } from '@/components/flowdex/primitives';
import { WALLET_PROVIDERS } from '@/dal/app/wallets/wallets.types';
import { FormField } from '../../_components/form-field';
import { useProtectedBuyPage } from '../buy-page-context';

export function BuyTrackingPanel() {
  const buyPage = useProtectedBuyPage();

  return (
    <GlassPanel className="space-y-4 p-6">
      <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        Ledger Tracking
      </div>

      <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text)]">
        {buyPage.simulationSummary}
      </div>

      <FormField id="tracking-asset-code" label="Asset Code">
        <Input
          id="tracking-asset-code"
          value={buyPage.assetCode}
          onChange={event => buyPage.setAssetCode(event.target.value)}
          placeholder="ETH"
          className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <FormField id="tracking-amount" label="Amount">
        <Input
          id="tracking-amount"
          value={buyPage.amount}
          onChange={event => buyPage.setAmount(event.target.value)}
          placeholder="0.01"
          className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <FormField
        id="tracking-operation-id"
        label="Alchemy Operation ID"
        description="Optional. Only provide this when you already have an Alchemy operation identifier."
      >
        <Input
          id="tracking-operation-id"
          value={buyPage.operationId}
          onChange={event => buyPage.setOperationId(event.target.value)}
          placeholder="op_123"
          className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <FormField
        id="tracking-tx-hash"
        label="Transaction Hash"
        description="Optional. MetaMask buys will fill this automatically after broadcast."
      >
        <Input
          id="tracking-tx-hash"
          value={buyPage.txHash}
          onChange={event => buyPage.setTxHash(event.target.value)}
          placeholder="0x"
          className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <Button
        variant="brand"
        className="w-full"
        disabled={!buyPage.canTrack || buyPage.isTracking}
        onClick={() => { void buyPage.runTracking(); }}
      >
        {buyPage.isTracking ? 'Tracking…' : 'Track transaction'}
      </Button>

      {buyPage.selectedWallet?.provider === WALLET_PROVIDERS.METAMASK ? (
        <Button
          variant="glass"
          className="w-full"
          disabled={
            !buyPage.selectedWallet
            || !buyPage.treasuryRecipient.trim()
            || buyPage.isTracking
            || buyPage.isSimulating
            || buyPage.isBroadcastingMetaMask
          }
          onClick={() => { void buyPage.buyWithMetaMask(); }}
        >
          {buyPage.isBroadcastingMetaMask ? 'Submitting…' : 'Buy with MetaMask'}
        </Button>
      ) : null}

      {buyPage.lastTrackStatus ? (
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <StatusPill status={buyPage.lastTrackStatus} />
        </div>
      ) : null}
    </GlassPanel>
  );
}
