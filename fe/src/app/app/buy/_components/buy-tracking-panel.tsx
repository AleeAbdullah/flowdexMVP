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
    <GlassPanel className="min-h-0 space-y-3 p-4 lg:overflow-y-auto">
      <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        Purchase record
      </div>

      <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-sm leading-6 text-[var(--text)]">
        {buyPage.simulationSummary}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <FormField id="tracking-asset-code" label="Asset">
          <Input
            id="tracking-asset-code"
            name="trackingAssetCode"
            autoComplete="off"
            spellCheck={false}
            value={buyPage.assetCode}
            onChange={event => buyPage.setAssetCode(event.target.value)}
            placeholder="e.g. ETH"
            className="h-11 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
          />
        </FormField>

        <FormField
          id="tracking-amount"
          label="Purchase amount"
          description="Amount to save in the purchase record."
        >
          <Input
            id="tracking-amount"
            name="trackingAmount"
            autoComplete="off"
            inputMode="decimal"
            value={buyPage.amount}
            onChange={event => buyPage.setAmount(event.target.value)}
            placeholder="e.g. 0.01"
            className="h-11 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
          />
        </FormField>

        <FormField
          id="tracking-operation-id"
          label="Reference ID"
          description="Optional internal or external reference."
        >
          <Input
            id="tracking-operation-id"
            name="trackingOperationId"
            autoComplete="off"
            spellCheck={false}
            value={buyPage.operationId}
            onChange={event => buyPage.setOperationId(event.target.value)}
            placeholder="e.g. op_123"
            className="h-11 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
          />
        </FormField>

        <FormField
          id="tracking-tx-hash"
          label="Transaction hash"
          description="Filled after MetaMask submits, or paste one manually."
        >
          <Input
            id="tracking-tx-hash"
            name="trackingTxHash"
            autoComplete="off"
            spellCheck={false}
            value={buyPage.txHash}
            onChange={event => buyPage.setTxHash(event.target.value)}
            placeholder="e.g. 0x"
            className="h-11 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
          />
        </FormField>
      </div>

      <Button
        variant="brand"
        className="h-11 w-full"
        disabled={!buyPage.canTrack || buyPage.isTracking}
        onClick={() => { void buyPage.runTracking(); }}
      >
        {buyPage.isTracking ? 'Tracking...' : 'Track transaction'}
      </Button>

      {buyPage.selectedWallet?.provider === WALLET_PROVIDERS.METAMASK ? (
        <Button
          variant="glass"
          className="h-11 w-full"
          disabled={
            !buyPage.selectedWallet
            || !buyPage.treasuryRecipient.trim()
            || buyPage.isTracking
            || buyPage.isSimulating
            || buyPage.isBroadcastingMetaMask
          }
          onClick={() => { void buyPage.buyWithMetaMask(); }}
        >
          {buyPage.isBroadcastingMetaMask ? 'Submitting...' : 'Buy with MetaMask'}
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
