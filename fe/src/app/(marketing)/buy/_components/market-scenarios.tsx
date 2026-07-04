import { GlassPanel } from '@/components/glass-panel';
import type { MarketScenario } from '../types/buy-view-model';

export function MarketScenarios(props: {
  cards: MarketScenario[];
}) {
  return (
    <section>
      <div className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
        <span className="bg-[var(--cyan)] px-1.5 py-1 text-[var(--primary-foreground-solid)]">Market</span>
        <span className="ml-2">Cap Scenarios</span>
      </div>
      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
        What your $FDN could be worth at different market caps (based on your investment above)
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {props.cards.map(card => (
          <GlassPanel key={card.label} className="rounded-[0.75rem] bg-[var(--buy-panel-soft)] px-5 py-7 text-center">
            <div className="text-xl font-black text-[var(--cyan)]">{card.label}</div>
            <div className="mt-5 space-y-1 text-[10px] text-[var(--muted)]">
              <div>{card.price}</div>
              <div>{card.cap}</div>
            </div>
            <div className="mt-7 text-2xl font-black text-[var(--green)]">{card.value}</div>
            <div className="mt-2 text-xs font-bold text-[var(--green)]">{card.roi}</div>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
