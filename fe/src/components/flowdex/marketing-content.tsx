import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GlassPanel, SectionHeading } from './primitives';

export function MarketingPageHero(props: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: Array<{ label: string; value: string }>;
  actions?: ReactNode;
}) {
  return (
    <section className="section-shell section-pad grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <div className="space-y-6">
        <SectionHeading
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.description}
        />
        {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
      </div>

      {props.meta?.length ? (
        <GlassPanel className="grid gap-4 p-6 md:grid-cols-2">
          {props.meta.map(item => (
            <div key={item.label} className="space-y-2">
              <div className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">
                {item.label}
              </div>
              <div className="font-data text-lg text-white">{item.value}</div>
            </div>
          ))}
        </GlassPanel>
      ) : null}
    </section>
  );
}

export function MarketingContentShell(props: {
  toc?: Array<{ id: string; label: string }>;
  children: ReactNode;
}) {
  if (!props.toc?.length) {
    return <div className="section-shell space-y-8 pb-14 md:pb-20">{props.children}</div>;
  }

  return (
    <div className="section-shell grid gap-8 pb-14 md:pb-20 lg:grid-cols-[0.76fr_0.24fr]">
      <div className="space-y-8">{props.children}</div>
      <div className="lg:block">
        <GlassPanel className="sticky top-24 hidden p-5 lg:block">
          <div className="text-[10px] font-bold tracking-[0.32em] text-slate-500 uppercase">
            On This Page
          </div>
          <div className="mt-4 space-y-3">
            {props.toc.map(item => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className="block text-sm font-medium text-slate-300 hover:text-cyan-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export function MarketingSection(props: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={props.id} className="space-y-5 scroll-mt-28">
      <SectionHeading
        eyebrow={props.eyebrow}
        title={props.title}
        description={props.description ?? ''}
      />
      <GlassPanel className="p-6 md:p-8">{props.children}</GlassPanel>
    </section>
  );
}

export function MarketingBody(props: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4 text-sm leading-8 text-slate-300 md:text-[15px]', props.className)}>
      {props.children}
    </div>
  );
}

export function MarketingBulletList(props: {
  items: string[];
  columns?: 1 | 2;
}) {
  return (
    <div className={cn('grid gap-3', props.columns === 2 && 'md:grid-cols-2')}>
      {props.items.map(item => (
        <div
          key={item}
          className="rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm leading-7 text-slate-200"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export function MarketingStatsGrid(props: {
  items: Array<{ label: string; value: string; note?: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {props.items.map(item => (
        <div
          key={item.label}
          className="rounded-[1.15rem] border border-white/8 bg-white/4 p-5"
        >
          <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
            {item.label}
          </div>
          <div className="font-data mt-3 text-2xl text-white">{item.value}</div>
          {item.note ? <p className="mt-3 text-sm leading-7 text-slate-300">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function MarketingComparisonTable(props: {
  columns: string[];
  rows: Array<{ label: string; values: string[] }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[1.15rem] border border-white/8 bg-white/4">
        <thead>
          <tr className="bg-white/5">
            <th className="px-4 py-4 text-left text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
              Dimension
            </th>
            {props.columns.map(column => (
              <th
                key={column}
                className="px-4 py-4 text-left text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map(row => (
            <tr key={row.label} className="border-t border-white/6">
              <td className="px-4 py-4 text-sm font-semibold text-white">{row.label}</td>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${props.columns[index]}`} className="px-4 py-4 text-sm leading-7 text-slate-300">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarketingCtaBand(props: {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <GlassPanel className="section-shell mt-8 p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-[10px] font-bold tracking-[0.28em] text-cyan-300 uppercase">Next Step</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white md:text-4xl">
            {props.title}
          </div>
          <p className="mt-4 text-sm leading-8 text-slate-300 md:text-base">
            {props.body}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="brand" size="lg" asChild>
            <Link href={props.primaryHref}>
              {props.primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {props.secondaryHref && props.secondaryLabel ? (
            <Button variant="glass" size="lg" asChild>
              <Link href={props.secondaryHref}>{props.secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  );
}

export function LegalDocumentSection(props: {
  id?: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <section id={props.id} className="scroll-mt-28 rounded-[1.15rem] border border-white/8 bg-white/4 p-6 md:p-8">
      <h2 className="text-xl font-bold text-white md:text-2xl">{props.title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-8 text-slate-300">
        {props.paragraphs.map(paragraph => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export function UpdateCard(props: {
  category: string;
  date: string;
  title: string;
  summary: string;
}) {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-cyan-200 uppercase">
          {props.category}
        </span>
        <span className="text-xs text-slate-400">{props.date}</span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{props.title}</h3>
      <p className="mt-4 text-sm leading-8 text-slate-300">{props.summary}</p>
    </GlassPanel>
  );
}
