'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/glass-panel';
import { usePaymentLeaders } from '@/dal/app/payments/payments.services';
import { cn } from '@/lib/utils';
import { BuyMetric } from './_components/buy-metric';
import { BuySidebar } from './_components/buy-sidebar';
import { LeadersPanel } from './_components/leaders-panel';
import { MarketScenarios } from './_components/market-scenarios';
import { PaymentCard } from './_components/payment-card';
import { PaymentDialogs } from './_components/payment-dialogs';
import { useBuyCheckoutController } from './hooks/use-buy-checkout-controller';

const tabs = ['Buy $FDN', 'Portfolio'] as const;
type BuyTab = (typeof tabs)[number];

export default function BuyRoute() {
  const { market, order, payment, wallet, actions } = useBuyCheckoutController();
  const [activeTab, setActiveTab] = useState<BuyTab>('Buy $FDN');
  const leadersQuery = usePaymentLeaders(10);
  const progressPercent = Math.max(0, Math.min(100, market.raisedProgressPercent));

  return (
    <main className="section-shell section-pad">
      <PaymentDialogs wallet={wallet} payment={payment} actions={actions} />

      <GlassPanel as="section" className="rounded-[1.15rem] bg-[var(--buy-panel)] p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-3 md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-[var(--cyan)] uppercase">
              Tier {market.currentTier} - Live
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          </div>
          <BuyMetric label="Raised Amount" value={market.raisedDisplay} note={`/ ${market.targetRaisedDisplay}`} />
          <BuyMetric label="Tokens Sold" value={market.tokensSoldDisplay} accent />
        </div>

        <div className="mt-7">
          <div className="h-8 overflow-hidden rounded-full bg-[#121a2b]">
            <div
              className="h-full rounded-r-none bg-[linear-gradient(90deg,#19d7e8,#118cf2)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="-mt-8 flex h-8 items-center justify-center text-[10px] font-bold tracking-[0.2em] text-[var(--text)] uppercase">
            {market.remainingTokensDisplay} FDN Remaining
          </div>
        </div>

        <div className="mt-7 grid gap-5 text-sm md:grid-cols-3">
          <div>
            <span className="text-[var(--muted)]">Price: </span>
            <span className="font-bold text-[var(--text)]">{market.tokenPriceDisplay}</span>
            <div className="mt-2 h-1.5 w-32 rounded-full bg-[#101827]">
              <div className="h-full w-2/3 rounded-full bg-[var(--cyan)]" />
            </div>
          </div>
          <div className="text-center">
            <span className="text-[var(--muted)]">Discount: </span>
            <span className="font-bold text-emerald-300">{market.discountPercentDisplay}</span>
          </div>
          <div className="text-right">
            <span className="text-[var(--muted)]">Next Tier Price: </span>
            <span className="font-bold text-[var(--text)]">{market.nextTierPriceDisplay}</span>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_44%,transparent)] uppercase">
            Tier {market.currentTier} Vesting
          </div>
          <div className="mt-4 grid h-10 overflow-hidden rounded-sm md:grid-cols-[0.05fr_0.35fr_0.6fr]">
            <div className="flex items-center justify-center bg-[var(--cyan)] text-[10px] font-black text-[#02111c]">5% TGE</div>
            <div className="flex items-center justify-center bg-[#112337] text-[10px] font-bold text-[var(--muted)]">12mo Cliff</div>
            <div className="flex items-center justify-center bg-[#0d9cb4] text-[10px] font-bold text-[var(--text)]">24mo Vest</div>
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
          <GlassPanel as="nav" className="grid max-w-[35rem] grid-cols-3 rounded-[0.7rem] bg-[var(--buy-panel)] p-1">
            {tabs.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-3 text-sm font-bold transition',
                  activeTab === tab
                    ? 'rounded-md bg-[#102238] text-[var(--cyan)]'
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
                <PaymentCard order={order} payment={payment} actions={actions} />
                <div className="my-8 h-px bg-[var(--card-border)]" />
                <MarketScenarios cards={order.scenarios} />
              </>
            ) : null}

            {activeTab !== 'Buy $FDN' ? (
              <div className="rounded-md border border-[var(--card-border)] bg-[#050c16] px-4 py-8 text-center text-sm text-[var(--muted)]">
                {activeTab} is coming soon.
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
