import { ChevronRight } from '@/icons';
import { GlassPanel } from '@/components/flowdex/primitives';

export type FeatureStreamItem = {
  label: string;
  value: string;
  status: string;
};

export function FeatureChipGrid(props: {
  items: string[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {props.items.map(item => (
        <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200">
          {item}
        </div>
      ))}
    </div>
  );
}

export function FeatureChipList(props: {
  items: string[];
}) {
  return (
    <div className="space-y-3">
      {props.items.map(item => (
        <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200">
          {item}
        </div>
      ))}
    </div>
  );
}

export function FeatureHighlightCard(props: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.title}
      </div>
      <div className="font-data mt-4 text-2xl text-[var(--text)]">{props.value}</div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{props.note}</p>
    </GlassPanel>
  );
}

export function FeatureStreamPanel(props: {
  items: FeatureStreamItem[];
}) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        Live Product Stream
      </div>
      <div>
        {props.items.map(item => (
          <div
            key={`${item.label}-${item.value}`}
            className="flex flex-col gap-3 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-3">
              <ChevronRight className="h-4 w-4 text-cyan-300" />
              <div>
                <div className="font-semibold text-[var(--text)]">{item.label}</div>
                <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">{item.status}</div>
              </div>
            </div>
            <div className="font-data text-sm text-cyan-200">{item.value}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
