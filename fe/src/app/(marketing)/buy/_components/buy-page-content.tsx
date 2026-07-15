'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { GlassPanel } from '@/components/glass-panel';
import { usePaymentLeaders } from '@/dal/app/payments/payments.services';
import { UserRound } from '@/icons';
import { cn } from '@/lib/utils';
import {
  BUY_PAGE_TABS,
  buyTabParser,
  resolveBuyPageTabFromQuery,
  type BuyPageTab,
} from '../constants/buy-tab-parsers';
import { useBuyCheckoutController } from '../hooks/use-buy-checkout-controller';
import { BuyMetric } from './buy-metric';
import { BuySidebar } from './buy-sidebar';
import { LeadersPanel } from './leaders-panel';
import { MarketScenarios } from './market-scenarios';
import { PaymentCard } from './payment-card';
import { PaymentDialogs } from './payment-dialogs';
import { PortfolioPanel } from './portfolio-panel';

export function BuyPageContent() {
  const { market, order, payment, wallet, actions } = useBuyCheckoutController();
  const [activeTab, setActiveTab] = useState<BuyPageTab>('Buy $FDN');
  const [tabParam, setTabParam] = useQueryState('tab', buyTabParser);

  useEffect(() => {
    if (!tabParam) {
      return;
    }

    const nextTab = resolveBuyPageTabFromQuery(tabParam);
    if (nextTab) {
      setActiveTab(nextTab);
    }

    void setTabParam(null);
  }, [tabParam, setTabParam]);
  const leadersQuery = usePaymentLeaders(10);
  const progressPercent = Math.max(0, Math.min(100, market.raisedProgressPercent));

  return (
    <main className="section-shell section-pad">
      <PaymentDialogs wallet={wallet} payment={payment} actions={actions} />

      <GlassPanel as="section" className="rounded-[1.15rem] bg-[var(--buy-panel)] p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-3 md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-[var(--cyan)] uppercase">
              {market.isLoading
                ? 'Loading live presale data'
                : market.hasError
                  ? 'Live presale data unavailable'
                  : `Tier ${market.currentTier} - Live`}
              {!market.isLoading && !market.hasError ? (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ) : null}
            </div>
          </div>
          <BuyMetric label="Raised Amount" value={market.raisedDisplay} note={`/ ${market.targetRaisedDisplay}`} />
          <BuyMetric label="Tokens Sold" value={market.tokensSoldDisplay} accent />
        </div>

        <div className="mt-7">
          <div className="h-8 overflow-hidden rounded-full bg-[var(--track)]">
            <div
              className="h-full rounded-r-none bg-[image:var(--buy-progress-gradient)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="-mt-8 flex h-8 items-center justify-center text-[10px] font-bold tracking-[0.2em] text-[var(--text)] uppercase">
            {market.remainingTokensDisplay === '—'
              ? 'Live total unavailable'
              : `${market.remainingTokensDisplay} FDN Remaining`}
          </div>
        </div>

        <div className="mt-7 grid gap-5 text-sm md:grid-cols-3">
          <div>
            <span className="text-[var(--muted)]">Price: </span>
            <span className="font-bold text-[var(--text)]">{market.tokenPriceDisplay}</span>
            <div className="mt-2 h-1.5 w-32 rounded-full bg-[var(--track)]">
              <div className="h-full w-2/3 rounded-full bg-[var(--cyan)]" />
            </div>
          </div>
          <div className="text-center">
            <span className="text-[var(--muted)]">Discount: </span>
            <span className="font-bold text-[var(--green)]">{market.discountPercentDisplay}</span>
          </div>
          <div className="text-right">
            <span className="text-[var(--muted)]">Next Tier Price: </span>
            <span className="font-bold text-[var(--text)]">{market.nextTierPriceDisplay}</span>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_44%,transparent)] uppercase">
            {market.currentTier > 0 ? `Tier ${market.currentTier}` : 'Presale'} Vesting
          </div>
          <div className="mt-4 grid h-10 overflow-hidden rounded-sm md:grid-cols-[0.07fr_0.35fr_0.6fr]">
            <div className="flex items-center justify-center bg-[var(--cyan)] text-[13px] font-black text-[var(--primary-foreground-solid)]">5% TGE</div>
            <div className="flex items-center justify-center bg-[var(--buy-stage-muted)] text-[13px] font-bold text-[var(--muted)]">12mo Cliff</div>
            <div className="flex items-center justify-center bg-[var(--accent-deep)] text-[13px] font-bold text-[var(--primary-foreground-solid)]">24mo Vest</div>
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[color-mix(in_srgb,var(--text)_42%,transparent)]">
            <span>TGE</span>
            <span>Full unlock: 36 months</span>
          </div>
          <div className="mt-5 text-[10px] font-bold tracking-[0.24em] text-[var(--cyan)] uppercase">
            Tokens in your wallet, not our database
          </div>
          <p className="mt-2 text-[11px] tracking-[0.18em] text-[var(--muted)] uppercase">
            Each tier has its own TGE. Claim via Merkle proof. Verifiable on Etherscan.
          </p>
        </div>
      </GlassPanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_31rem] xl:items-start">
        <div className="space-y-6">
          <GlassPanel as="nav" className="grid grid-cols-3 rounded-[0.7rem] bg-[var(--buy-panel)] p-1">
            {BUY_PAGE_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                aria-pressed={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-inset',
                  activeTab === tab
                    ? 'rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--cyan)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]',
                )}
              >
                {tab}
              </button>
            ))}
          </GlassPanel>

          <GlassPanel as="section" className="rounded-[1.15rem] bg-[var(--buy-panel)] p-6 md:p-8">
            {activeTab === 'Buy $FDN' ? (
              <>
                <PaymentCard order={order} wallet={wallet} actions={actions} />
                <div className="my-8 h-px bg-[var(--card-border)]" />
                <MarketScenarios cards={order.scenarios} />
              </>
            ) : null}

            {activeTab === 'Portfolio' ? (
              <PortfolioPanel market={market} />
            ) : null}

            {activeTab === 'Referral' ? (
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-[var(--status-info-border)] bg-[var(--status-info-surface)] text-[var(--status-info-text)]">
                  <UserRound className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-2xl font-black text-(--text)">Referral Coming Soon</h2>
                <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-7 text-(--muted)">
                  Invite new FlowDex buyers and earn rewards when the referral program launches. Referral links,
                  tracking, and rewards will be available in an upcoming release.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-data text-2xl font-black text-(--cyan)">Links</div>
                    <div className="mt-2 text-xs font-bold text-(--muted)">Referral Tracking</div>
                  </div>
                  <div>
                    <div className="font-data text-2xl font-black text-(--cyan)">Rewards</div>
                    <div className="mt-2 text-xs font-bold text-(--muted)">Buyer Bonuses</div>
                  </div>
                  <div>
                    <div className="font-data text-2xl font-black text-(--cyan)">Soon</div>
                    <div className="mt-2 text-xs font-bold text-(--muted)">Feature Launch</div>
                  </div>
                </div>
              </div>
            ) : null}
          </GlassPanel>
        </div>

        <aside className="space-y-6">
          <BuySidebar />
          <GlassPanel as="section" className="rounded-[1.15rem] bg-[var(--buy-panel)] p-7">
            <LeadersPanel
              leaders={leadersQuery.data?.items ?? []}
              isLoading={leadersQuery.isLoading}
              isError={leadersQuery.isError}
            />
          </GlassPanel>
        </aside>
      </div>
    </main>
  );
}
