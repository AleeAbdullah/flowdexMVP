'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeroDitheringCard } from '@/components/ui/hero-dithering-card';
import { ArrowRight } from '@/icons';
import type { LandingHeroSlide } from './landing-page.data';

const SLIDE_DURATION_MS = 8000;

export function LandingHeroCarousel(props: {
  slides: LandingHeroSlide[];
  facts: Array<{ label: string; value: string; note: string }>;
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % props.slides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [props.slides.length]);

  const slide = props.slides[activeSlide] ?? props.slides[0];
  if (!slide) {
    return null;
  }

  return (
    <section className="section-shell relative grid gap-8 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(var(--card-border)_1px,transparent_1px),linear-gradient(90deg,var(--card-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.08]" />

      <div className="space-y-8">
        <Badge variant="brand" className="gap-2 px-5 py-2">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-strong)]" />
          {slide.badge}
        </Badge>

        <div className="space-y-5">
          <h1 className="font-heading max-w-4xl text-balance text-[clamp(2.8rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.04em] text-[var(--text)]">
            <HighlightText text={slide.title} emphasis={slide.emphasis} />
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)] md:text-xl">
            {slide.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="brand" size="lg" asChild>
            <Link href={slide.primary.href}>
              {slide.primary.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="glass" size="lg" asChild>
            <Link href={slide.secondary.href}>{slide.secondary.label}</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {props.slides.map((item, index) => (
            <button
              key={item.badge}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-pressed={activeSlide === index}
              onClick={() => setActiveSlide(index)}
              className={`h-2.5 rounded-full transition-[width,background-color] duration-200 ${activeSlide === index ? 'w-10 bg-[var(--accent-strong)]' : 'w-2.5 bg-[var(--track)] hover:bg-[var(--accent-soft)]'}`}
            />
          ))}
        </div>
      </div>

      <HeroDitheringCard className="p-6 md:p-7" contentClassName="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-[0.32em] text-[var(--muted)] uppercase">
              Market Launch Snapshot
            </div>
            <div className="font-heading mt-2 text-3xl font-bold tracking-tight text-[var(--text)]">
              Editorial Trust
            </div>
          </div>
          <Badge variant="success">Live</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {props.facts.map(fact => (
            <div key={fact.label} className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
              <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--muted)] uppercase">
                {fact.label}
              </div>
              <div className="font-data mt-2 text-xl font-semibold text-[var(--text)]">{fact.value}</div>
              <div className="mt-2 text-xs leading-6 text-[var(--muted)]">{fact.note}</div>
            </div>
          ))}
        </div>
      </HeroDitheringCard>
    </section>
  );
}

function HighlightText(props: {
  text: string;
  emphasis: string;
}) {
  if (!props.text.includes(props.emphasis)) {
    return <>{props.text}</>;
  }

  const [before, ...after] = props.text.split(props.emphasis);

  return (
    <>
      {before}
      <span className="text-[var(--accent-strong)]">{props.emphasis}</span>
      {after.join(props.emphasis)}
    </>
  );
}
