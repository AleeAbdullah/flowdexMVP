'use client';

import { formatCurrency, formatDateTime, truncateMiddle } from '@/components/flowdex/utils';
import { Loader2, Trophy } from '@/icons';
import type { IPaymentLeader } from '@/dal/app/payments/payments.types';

export function LeadersPanel(props: {
  leaders: IPaymentLeader[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">Leaders</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Top confirmed FlowDex presale purchasers.</p>
        </div>
        {props.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-[var(--cyan)]" /> : null}
      </div>

      {props.isError ? (
        <div className="mt-7 rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Could not load leaders right now.
        </div>
      ) : null}

      {!props.isLoading && !props.isError && props.leaders.length === 0 ? (
        <div className="mt-7 rounded-md border border-[var(--card-border)] bg-[#050c16] px-4 py-8 text-center text-sm text-[var(--muted)]">
          No confirmed purchases yet.
        </div>
      ) : null}

      {props.leaders.length > 0 ? (
        <div className="mt-7 overflow-hidden rounded-[0.8rem] border border-[var(--card-border)]">
          <div className="grid grid-cols-[4rem_minmax(0,1fr)_auto] gap-3 bg-[#07111d] px-4 py-3 text-[10px] font-bold tracking-[0.22em] text-[var(--muted)] uppercase md:grid-cols-[4rem_minmax(0,1fr)_9rem_10rem_auto]">
            <span>Rank</span>
            <span>Wallet</span>
            <span className="hidden md:block">Purchases</span>
            <span className="hidden md:block">Latest</span>
            <span className="text-right">Total</span>
          </div>
          <div className="divide-y divide-[var(--card-border)]">
            {props.leaders.map(leader => (
              <div
                key={`${leader.rank}-${leader.walletAddress}`}
                className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-sm md:grid-cols-[4rem_minmax(0,1fr)_9rem_10rem_auto]"
              >
                <div className="flex items-center gap-2 font-data font-bold text-[var(--cyan)]">
                  {leader.rank <= 3 ? <Trophy className="h-4 w-4" /> : null}
                  #{leader.rank}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-data font-bold text-[var(--text)]">
                    {truncateMiddle(leader.walletAddress, 12, 8)}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)] md:hidden">
                    {leader.paymentCount} purchase{leader.paymentCount === 1 ? '' : 's'} - {formatDateTime(leader.latestPaymentAt)}
                  </div>
                </div>
                <div className="hidden text-[var(--muted)] md:block">
                  {leader.paymentCount} purchase{leader.paymentCount === 1 ? '' : 's'}
                </div>
                <div className="hidden text-xs text-[var(--muted)] md:block">{formatDateTime(leader.latestPaymentAt)}</div>
                <div className="text-right font-data font-black text-emerald-300">{formatCurrency(leader.totalUsd, 0)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
