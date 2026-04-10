import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroDitheringCard } from '@/components/ui/hero-dithering-card';
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
        <HeroDitheringCard className="grid gap-4 p-6 md:grid-cols-2" contentClassName="grid gap-4 md:grid-cols-2">
          {props.meta.map(item => (
            <div key={item.label} className="space-y-2">
              <div className="text-[10px] font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">
                {item.label}
              </div>
              <div className="font-data text-lg text-[var(--flowdex-text)]">{item.value}</div>
            </div>
          ))}
        </HeroDitheringCard>
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
          <div className="text-[10px] font-bold tracking-[0.32em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">
            On This Page
          </div>
          <div className="mt-4 space-y-3">
            {props.toc.map(item => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className="block text-sm font-medium text-[var(--flowdex-muted)] hover:text-[var(--flowdex-cyan)]"
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
    <div className={cn('space-y-4 text-sm leading-8 text-[var(--flowdex-muted)] md:text-[15px]', props.className)}>
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
          className="rounded-[1rem] border border-[var(--flowdex-card-border)] bg-[var(--flowdex-card-bg)] px-4 py-3 text-sm leading-7 text-[var(--flowdex-text)]"
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
          className="rounded-[1.15rem] border border-[var(--flowdex-card-border)] bg-[var(--flowdex-card-bg)] p-5"
        >
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">
            {item.label}
          </div>
          <div className="font-data mt-3 text-2xl text-[var(--flowdex-text)]">{item.value}</div>
          {item.note ? <p className="mt-3 text-sm leading-7 text-[var(--flowdex-muted)]">{item.note}</p> : null}
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
      <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[1.15rem] border border-[var(--flowdex-card-border)] bg-[var(--flowdex-card-bg)]">
        <thead>
          <tr className="bg-[var(--flowdex-accent-bg)]">
            <th className="px-4 py-4 text-left text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase">
              Dimension
            </th>
            {props.columns.map(column => (
              <th
                key={column}
                className="px-4 py-4 text-left text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)] uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map(row => (
            <tr key={row.label} className="border-t border-[var(--flowdex-card-border)]">
              <td className="px-4 py-4 text-sm font-semibold text-[var(--flowdex-text)]">{row.label}</td>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${props.columns[index]}`} className="px-4 py-4 text-sm leading-7 text-[var(--flowdex-muted)]">
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
          <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--flowdex-cyan)] uppercase">Next Step</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-[var(--flowdex-text)] md:text-4xl">
            {props.title}
          </div>
          <p className="mt-4 text-sm leading-8 text-[var(--flowdex-muted)] md:text-base">
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
    <section id={props.id} className="scroll-mt-28 rounded-[1.15rem] border border-[var(--flowdex-card-border)] bg-[var(--flowdex-card-bg)] p-6 md:p-8">
      <h2 className="text-xl font-bold text-[var(--flowdex-text)] md:text-2xl">{props.title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-8 text-[var(--flowdex-muted)]">
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
        <span className="rounded-full border border-[var(--flowdex-accent-border)] bg-[var(--flowdex-accent-bg)] px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-[var(--flowdex-cyan)] uppercase">
          {props.category}
        </span>
        <span className="text-xs text-[color-mix(in_srgb,var(--flowdex-text)_52%,transparent)]">{props.date}</span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-[var(--flowdex-text)]">{props.title}</h3>
      <p className="mt-4 text-sm leading-8 text-[var(--flowdex-muted)]">{props.summary}</p>
    </GlassPanel>
  );
}
