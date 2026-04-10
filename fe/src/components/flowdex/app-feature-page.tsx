import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { GlassPanel, SectionHeading } from './primitives';

type FeatureItem = {
  title: string;
  value: string;
  note: string;
};

type StreamItem = {
  label: string;
  value: string;
  status: string;
};

export function AppFeaturePage(props: {
  eyebrow: string;
  title: string;
  description: string;
  hero: ReactNode;
  highlights: FeatureItem[];
  stream: StreamItem[];
}) {
  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
        />
        <div>{props.hero}</div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        {props.highlights.map(item => (
          <GlassPanel key={item.title} className="p-5">
            <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">{item.title}</div>
            <div className="font-data mt-4 text-2xl text-[var(--flowdex-text)]">{item.value}</div>
            <p className="mt-3 text-sm leading-7 text-[var(--flowdex-muted)]">{item.note}</p>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-[var(--flowdex-card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">
          Live Product Stream
        </div>
        <div>
          {props.stream.map(item => (
            <div
              key={`${item.label}-${item.value}`}
              className="flex flex-col gap-3 border-b border-[var(--flowdex-card-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <ChevronRight className="h-4 w-4 text-cyan-300" />
                <div>
                  <div className="font-semibold text-[var(--flowdex-text)]">{item.label}</div>
                  <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--flowdex-text)_45%,transparent)]">{item.status}</div>
                </div>
              </div>
              <div className="font-data text-sm text-cyan-200">{item.value}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
