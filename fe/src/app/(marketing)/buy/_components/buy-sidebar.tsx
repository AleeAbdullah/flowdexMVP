import { GlassPanel } from '@/components/glass-panel';
import { Lock } from '@/icons';

export function BuySidebar() {
  return (
    <GlassPanel as="section" className="rounded-[1.15rem] bg-[var(--buy-panel)] px-7 py-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-yellow-200/25 bg-yellow-300/10 text-yellow-200">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="mt-6 text-2xl font-black text-[var(--text)]">Staking Coming Soon</h2>
      <p className="mx-auto mt-4 max-w-[28rem] text-sm font-semibold leading-7 text-[var(--muted)]">
        Stake $FDN to earn 40% of protocol fees from every trade - crypto, stocks, forex, commodities, and more.
        Governance voting and routing priority included. In Phase 3, stakers become FlowChain validators.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div>
          <div className="font-data text-2xl font-black text-[var(--cyan)]">12-18%</div>
          <div className="mt-2 text-xs font-bold text-[var(--muted)]">Est. APY (Y1)</div>
        </div>
        <div>
          <div className="font-data text-2xl font-black text-[var(--cyan)]">40%</div>
          <div className="mt-2 text-xs font-bold text-[var(--muted)]">Fee Share</div>
        </div>
        <div>
          <div className="font-data text-2xl font-black text-[var(--cyan)]">Weekly</div>
          <div className="mt-2 text-xs font-bold text-[var(--muted)]">Rewards</div>
        </div>
      </div>
    </GlassPanel>
  );
}
