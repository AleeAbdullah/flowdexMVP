'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { authClient } from '@/lib/auth-client';
import {
  BUY_TABS,
  BUY_TAB_VALUES,
  QUICK_BUY_AMOUNTS,
  REFERRAL_LINK,
} from './buy-page-content';
import { useBuyPageActions } from './buy-page-actions';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import {
  BuyFooterSection,
  BuyFormSection,
  BuyHeroSection,
  BuyHighlightsSection,
  BuyTopInfoSection,
  LeadersTabContent,
  PortfolioTabContent,
  ReferralsTabContent,
  StakingTabContent,
} from './buy-page-parts';
import type { BuyMarketModel, BuySnapshot } from './buy-page-types';
import { buildBuyMarketModel } from './buy-page-market';
import { parseDecimal } from './utils';

export function BuyPageClient(props: {
  snapshot: BuySnapshot;
}) {
  const market = buildBuyMarketModel(props.snapshot);
  const { data: session } = authClient.useSession();
  const [activeTab = 'buy', setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(BUY_TAB_VALUES).withDefault('buy').withOptions({ history: 'push' }),
  );
  const [walletConnected, setWalletConnected] = useState(false);
  const [orderMode, setOrderMode] = useState<string>('buy');
  const [paymentRail, setPaymentRail] = useState<string>('crypto');
  const [selectedAssetCode, setSelectedAssetCode] = useState<string>(market.assetOptions[0]?.code ?? 'USDT');
  const [customAmount, setCustomAmount] = useState(`${QUICK_BUY_AMOUNTS[0]}`);

  useEffect(() => {
    if (!market.assetOptions.find(asset => asset.code === selectedAssetCode)) {
      setSelectedAssetCode(market.assetOptions[0]?.code ?? 'USDT');
    }
  }, [market.assetOptions, selectedAssetCode]);

  const isAuthenticated = Boolean(session);
  const sessionUserDisplay = session?.user.name || session?.user.email || 'Unknown';
  const actions = useBuyPageActions({
    isAuthenticated,
    walletConnected,
    setWalletConnected,
    userDisplay: sessionUserDisplay,
  });

  const selectedAsset = market.assetOptions.find(asset => asset.code === selectedAssetCode) ?? market.assetOptions[0];
  const amountUsd = parseDecimal(customAmount);
  const estimatedTokens = amountUsd > 0 && market.tokenPriceUsd > 0 ? amountUsd / market.tokenPriceUsd : 0;
  const assetUnits = selectedAsset && selectedAsset.usdPrice > 0 ? amountUsd / selectedAsset.usdPrice : 0;
  const stakeBoostTokens = orderMode === 'stake' ? estimatedTokens * 0.15 : 0;
  const listingValue = estimatedTokens * market.listingReferenceUsd;
  const activeQuickAmount = QUICK_BUY_AMOUNTS.find(value => value === amountUsd)?.toString() ?? '';

  return (
    <TooltipProvider delayDuration={120}>
      <div className="section-shell section-pad space-y-6 md:space-y-8">
        <BuyHeroSection
          market={market}
          walletConnected={walletConnected}
          onWalletClick={walletConnected ? actions.handleDisconnectWallet : actions.handleConnectWallet}
        />

        <BuyTopInfoSection market={market} />

        <Tabs
          value={activeTab}
          onValueChange={(value) => { void setActiveTab(value as typeof activeTab); }}
          className="space-y-5"
        >
          <div className="overflow-x-auto rounded-[1.25rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_65%,transparent)]">
            <TabsList className="h-auto min-w-full justify-start gap-2 rounded-[1.25rem] bg-transparent p-2">
              {BUY_TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-w-[132px] rounded-[1rem] border border-transparent px-4 py-3 text-sm font-semibold text-[var(--muted)] data-[state=active]:border-[var(--accent-strong)] data-[state=active]:bg-[color-mix(in_srgb,var(--accent-strong)_12%,transparent)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-strong)_40%,transparent)]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="buy" className="space-y-5">
            <BuyHighlightsSection market={market} />
            <BuyFormSection
              market={market}
              orderMode={orderMode}
              paymentRail={paymentRail}
              selectedAssetCode={selectedAssetCode}
              customAmount={customAmount}
              activeQuickAmount={activeQuickAmount}
              estimatedTokens={estimatedTokens}
              stakeBoostTokens={stakeBoostTokens}
              listingValue={listingValue}
              assetUnits={assetUnits}
              selectedAsset={selectedAsset}
              onOrderModeChange={setOrderMode}
              onPaymentRailChange={setPaymentRail}
              onAssetCodeChange={setSelectedAssetCode}
              onQuickAmountChange={setCustomAmount}
              onCustomAmountChange={setCustomAmount}
              onPrimaryAction={actions.handlePrimaryAction}
              walletConnected={walletConnected}
            />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-5">
            <PortfolioTabContent
              walletConnected={walletConnected}
              onConnectWallet={actions.handleConnectWallet}
            />
          </TabsContent>

          <TabsContent value="leaders">
            <LeadersTabContent />
          </TabsContent>

          <TabsContent value="staking">
            <StakingTabContent stakingApyText={market.stakingApyText} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralsTabContent
              referralLink={REFERRAL_LINK}
              onCopyReferral={() => actions.handleCopyReferral(REFERRAL_LINK)}
            />
          </TabsContent>
        </Tabs>

        <BuyFooterSection />
      </div>
    </TooltipProvider>
  );
}
