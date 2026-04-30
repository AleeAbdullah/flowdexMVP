'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassPanel } from '@/components/flowdex/primitives';
import { FormField } from '../../_components/form-field';
import { useProtectedBuyPage } from '../buy-page-context';

export function BuySetupPanel() {
  const buyPage = useProtectedBuyPage();

  return (
    <GlassPanel className="space-y-4 p-6">
      <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        Buy Setup
      </div>

      <FormField id="buy-wallet" label="Wallet">
        <select
          id="buy-wallet"
          value={buyPage.selectedWalletId}
          onChange={event => buyPage.setSelectedWalletId(event.target.value)}
          className="h-12 w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 text-[var(--text)]"
        >
          {buyPage.wallets.map(wallet => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.network} • {wallet.address}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id="buy-recipient"
        label="Recipient (Treasury)"
        description="Treasury destination is derived from the selected wallet network."
      >
        <Input
          id="buy-recipient"
          value={buyPage.treasuryRecipient}
          readOnly
          className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <FormField
        id="buy-value"
        label="Value"
        description="Enter a decimal string or hex wei amount for the simulated transaction."
      >
        <Input
          id="buy-value"
          value={buyPage.value}
          onChange={event => buyPage.setValue(event.target.value)}
          placeholder="0.01 or 0x2386f26fc10000"
          className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <FormField
        id="buy-calldata"
        label="Calldata"
        description="Optional calldata for contract calls. Leave blank for a simple value transfer."
      >
        <Input
          id="buy-calldata"
          value={buyPage.data}
          onChange={event => buyPage.setData(event.target.value)}
          placeholder="0x"
          className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <Button
        variant="brand"
        className="w-full"
        disabled={!buyPage.canSimulate || buyPage.isSimulating || !buyPage.selectedWallet}
        onClick={() => { void buyPage.runSimulation(); }}
      >
        {buyPage.isSimulating ? 'Running simulation…' : 'Run simulation'}
      </Button>
    </GlassPanel>
  );
}
