'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassPanel } from '@/components/flowdex/primitives';
import { truncateMiddle } from '@/components/flowdex/utils';
import { FormField } from '../../_components/form-field';
import { useProtectedBuyPage } from '../buy-page-context';

export function BuySetupPanel() {
  const buyPage = useProtectedBuyPage();

  return (
    <GlassPanel className="min-h-0 space-y-3 p-4 lg:overflow-y-auto">
      <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        Payment details
      </div>

      <FormField id="buy-wallet" label="Wallet">
        <Select
          value={buyPage.selectedWalletId}
          onValueChange={buyPage.setSelectedWalletId}
        >
          <SelectTrigger id="buy-wallet" className="h-11 rounded-xl border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]">
            <SelectValue placeholder="Choose wallet" />
          </SelectTrigger>
          <SelectContent>
            {buyPage.wallets.map(wallet => (
              <SelectItem key={wallet.id} value={wallet.id}>
                {wallet.network} / {truncateMiddle(wallet.address)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        id="buy-recipient"
        label="Recipient (Treasury)"
        description="Treasury destination is derived from the selected wallet network."
      >
        <Input
          id="buy-recipient"
          name="buyRecipient"
          autoComplete="off"
          spellCheck={false}
          value={buyPage.treasuryRecipient}
          readOnly
          className="h-11 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
        />
      </FormField>

      <div className="grid gap-3 xl:grid-cols-2">
        <FormField
          id="buy-value"
          label="Payment"
          description="Amount sent with this transaction."
        >
          <Input
            id="buy-value"
            name="buyValue"
            autoComplete="off"
            inputMode="decimal"
            value={buyPage.value}
            onChange={event => buyPage.setValue(event.target.value)}
            placeholder="e.g. 0.01"
            className="h-11 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
          />
        </FormField>

        <FormField
          id="buy-calldata"
          label="Advanced data"
          description="Optional contract call data."
        >
          <Input
            id="buy-calldata"
            name="buyCalldata"
            autoComplete="off"
            spellCheck={false}
            value={buyPage.data}
            onChange={event => buyPage.setData(event.target.value)}
            placeholder="e.g. 0x"
            className="h-11 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
          />
        </FormField>
      </div>

      <Button
        variant="brand"
        className="h-11 w-full"
        disabled={!buyPage.canSimulate || buyPage.isSimulating || !buyPage.selectedWallet}
        onClick={() => { void buyPage.runSimulation(); }}
      >
        {buyPage.isSimulating ? 'Checking...' : 'Run check'}
      </Button>
    </GlassPanel>
  );
}
