'use client';

import { useMemo } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import {
  buildWalletSupportRegistry,
  getApprovedDirectWalletDisplayNames,
  getBuyWalletPickerEntries,
  getWalletSupportSummary,
} from '@/constants/wallet-support';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/components/flowdex/utils';
import { QUICK_BUY_AMOUNTS } from '@/components/flowdex/buy-page-content';
import { WalletBuyShell } from './wallet-buy-shell';
import { buyStateFixtures, getBuyFixtureById } from '../utils/buy-state-fixtures';
import { buildSupportedAssetOptions } from '../utils/supported-asset-options';

const noop = () => undefined;

export function WalletBuyFixturesPageClient(props: {
  snapshot: BuySnapshot;
}) {
  const [fixtureId, setFixtureId] = useQueryState('fixture', parseAsString.withDefault(buyStateFixtures[0].id));
  const fixture = getBuyFixtureById(fixtureId);
  const market = buildBuyMarketModel(props.snapshot);
  const supportedAssets = useMemo(() => buildSupportedAssetOptions(props.snapshot), [props.snapshot]);

  const walletSupportRegistry = useMemo(() => buildWalletSupportRegistry({
    walletConnectEnabled: fixture.walletConnectEnabled,
  }), [fixture.walletConnectEnabled]);

  const walletSupportSummary = useMemo(() => getWalletSupportSummary(walletSupportRegistry), [walletSupportRegistry]);
  const approvedDirectWalletDisplayNames = useMemo(
    () => getApprovedDirectWalletDisplayNames(walletSupportRegistry),
    [walletSupportRegistry],
  );
  const fixtureWalletButtons = useMemo(() => {
    return getBuyWalletPickerEntries(walletSupportRegistry).map(entry => {
      const mode: 'direct' | 'session-gated' = entry.releaseTier === 'fallback' ? 'session-gated' : 'direct';
      const connected = Boolean(fixture.connectedWalletAddress && entry.id === 'metamask');
      const lockedByConnectedWallet = Boolean(fixture.connectedWalletAddress && !connected);

      return {
        id: entry.id,
        label: entry.displayName,
        caption: connected
          ? 'This is the active wallet for the current checkout.'
          : lockedByConnectedWallet
            ? 'Disconnect the active wallet before selecting this option.'
            : entry.releaseTier === 'fallback'
              ? 'Fixture-only WalletConnect entry with post-connect capability gating.'
              : 'Fixture-only direct connector.',
        mode,
        connected,
        disabled: Boolean(fixture.connectedWalletAddress),
        onClick: noop,
      };
    });
  }, [fixture.connectedWalletAddress, walletSupportRegistry]);

  return (
    <div className="space-y-5">
      <div className="section-shell pt-8">
        <div className="rounded-[1.1rem] border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-[var(--text)]">Development fixture harness</div>
              <p className="max-w-3xl leading-6 text-cyan-100/90">
                Render every `/buy` state deterministically without relying on live wallet behavior. Use this route for screenshot QA and regression review.
              </p>
            </div>

            <Badge variant="brand" className="px-3 py-1 normal-case tracking-normal">
              {fixture.label}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[18rem_minmax(0,1fr)] md:items-center">
            <Select value={fixture.id} onValueChange={value => setFixtureId(value)}>
              <SelectTrigger className="h-11 border-cyan-400/20 bg-[var(--surface)] text-[var(--text)]">
                <SelectValue placeholder="Choose fixture state" />
              </SelectTrigger>
              <SelectContent>
                {buyStateFixtures.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-sm leading-6 text-cyan-100/85">
              {fixture.description}
            </p>
          </div>
        </div>
      </div>

      <WalletBuyShell
        walletStatusLabel={fixture.walletStatusLabel}
        connectedWalletAddress={fixture.connectedWalletAddress}
        sessionWalletChecksum={fixture.sessionWalletChecksum}
        verifiedChainLabel={fixture.verifiedChainLabel}
        walletChainLabel={fixture.walletStatusLabel === 'Switch network' ? 'Base Sepolia' : fixture.verifiedChainLabel}
        selectedChainLabel={fixture.input.selectedChainLabel}
        selectedAsset={fixture.selectedAsset}
        supportedAssets={fixture.selectedAsset ? supportedAssets : []}
        selectedAssetId={fixture.selectedAsset?.id ?? ''}
        onAssetChange={noop}
        amountDisplay={fixture.amountDisplay}
        onAmountChange={noop}
        quickBuyAmounts={[...QUICK_BUY_AMOUNTS]}
        selectedQuickBuyAmount={null}
        onQuickBuyAmountChange={noop}
        contributionEnabled={fixture.contributionEnabled}
        estimatedContributionUsdDisplay={fixture.estimatedContributionUsdDisplay}
        estimatedTokensDisplay={fixture.estimatedTokensDisplay}
        latestExplorerUrl={fixture.latestExplorerUrl}
        walletSupportSummary={walletSupportSummary}
        primaryWalletSupportCopy={walletSupportSummary.primarySupportCopy}
        approvedDirectWalletDisplayNames={approvedDirectWalletDisplayNames}
        walletConnectEnabled={fixture.walletConnectEnabled}
        walletButtons={fixtureWalletButtons}
        primaryActionDisabled={false}
        secondaryActionDisabled={false}
        onAction={noop}
        currentTier={market.currentTier}
        tokenPriceDisplay={formatCurrency(market.tokenPriceUsd, 4)}
        raisedDisplay={formatCurrency(market.fundsRaisedUsd, 0)}
        raisedProgressPercent={market.raisedProgressPercent}
        sourceUpdatedAt={market.sourceUpdatedAt}
        listingReferenceDisplay={formatCurrency(market.listingReferenceUsd, 2)}
        paymentWalletAddress={fixture.connectedWalletAddress ?? ''}
        onPaymentWalletAddressChange={noop}
        paymentWalletModalOpen={false}
        onPaymentWalletModalOpenChange={noop}
        paymentWalletError={null}
        activePayment={null}
        paymentInstruction={null}
        isCreatingIntent={false}
        isCheckingStatus={false}
        statusError={null}
      />
    </div>
  );
}
