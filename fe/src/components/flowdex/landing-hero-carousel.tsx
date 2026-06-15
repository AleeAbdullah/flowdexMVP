'use client';

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from '@/icons';
import type {
  LandingHeroAccent,
  LandingHeroSlide,
} from './landing-page.data';

const HeroGlobeVisual = lazy(() =>
  import('./landing-hero-visuals').then(mod => ({ default: mod.LandingHeroGlobeVisual })),
);
const HeroCardsVisual = lazy(() =>
  import('./landing-hero-visuals').then(mod => ({ default: mod.LandingHeroCardsVisual })),
);
const HeroSceneVisual = lazy(() =>
  import('./landing-hero-visuals').then(mod => ({ default: mod.LandingHeroSceneVisual })),
);

const HERO_AUTOPLAY_MS = 8000;
const HERO_TRANSITION = {
  type: 'spring',
  stiffness: 120,
  damping: 22,
  mass: 0.9,
} as const;

export function LandingHeroCarousel(props: {
  slides: LandingHeroSlide[];
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [visualIndex, setVisualIndex] = useState(() => props.slides.length > 1 ? 1 : 0);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [manualAdvanceKey, setManualAdvanceKey] = useState(0);
  const autoplayTimerRef = useRef<number | null>(null);
  const autoplayGenerationRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const activeSlideRef = useRef(0);
  const visualIndexRef = useRef(props.slides.length > 1 ? 1 : 0);
  const canRotate = props.slides.length > 1;
  const carouselSlides = useMemo(() => {
    if (!canRotate) {
      return props.slides;
    }

    return [
      props.slides[props.slides.length - 1],
      ...props.slides,
      props.slides[0],
    ];
  }, [canRotate, props.slides]);

  const clearAutoplayTimer = useCallback(() => {
    autoplayGenerationRef.current += 1;

    if (autoplayTimerRef.current === null) {
      return;
    }

    window.clearTimeout(autoplayTimerRef.current);
    autoplayTimerRef.current = null;
  }, []);

  const advanceSlide = useCallback((direction: -1 | 1) => {
    if (!canRotate || isTransitioningRef.current) {
      return false;
    }

    isTransitioningRef.current = true;
    const nextActiveSlide = (activeSlideRef.current + direction + props.slides.length) % props.slides.length;
    const nextVisualIndex = visualIndexRef.current + direction;

    activeSlideRef.current = nextActiveSlide;
    visualIndexRef.current = nextVisualIndex;
    setShouldAnimate(true);
    setActiveSlide(nextActiveSlide);
    setVisualIndex(nextVisualIndex);
    return true;
  }, [canRotate, props.slides.length]);

  function shiftSlide(direction: -1 | 1) {
    clearAutoplayTimer();

    if (advanceSlide(direction)) {
      setManualAdvanceKey(current => current + 1);
    }
  }

  function handleTrackAnimationComplete() {
    if (!canRotate) {
      isTransitioningRef.current = false;
      return;
    }

    if (visualIndexRef.current === 0) {
      visualIndexRef.current = props.slides.length;
      setShouldAnimate(false);
      setVisualIndex(props.slides.length);
      isTransitioningRef.current = false;
      return;
    }

    if (visualIndexRef.current === props.slides.length + 1) {
      visualIndexRef.current = 1;
      setShouldAnimate(false);
      setVisualIndex(1);
      isTransitioningRef.current = false;
      return;
    }

    isTransitioningRef.current = false;
  }

  useEffect(() => {
    if (!canRotate) {
      activeSlideRef.current = 0;
      visualIndexRef.current = 0;
      setActiveSlide(0);
      setVisualIndex(0);
      isTransitioningRef.current = false;
      return;
    }

    const nextActiveSlide = activeSlideRef.current % props.slides.length;
    const nextVisualIndex = visualIndexRef.current === 0
      ? props.slides.length
      : Math.min(visualIndexRef.current, props.slides.length);

    activeSlideRef.current = nextActiveSlide;
    visualIndexRef.current = nextVisualIndex;
    setActiveSlide(nextActiveSlide);
    setVisualIndex(nextVisualIndex);
    isTransitioningRef.current = false;
  }, [canRotate, props.slides.length]);

  useEffect(() => {
    if (shouldAnimate) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setShouldAnimate(true));

    return () => window.cancelAnimationFrame(frame);
  }, [shouldAnimate]);

  useEffect(() => {
    if (!canRotate) {
      return;
    }

    clearAutoplayTimer();
    const autoplayGeneration = autoplayGenerationRef.current;
    autoplayTimerRef.current = window.setTimeout(() => {
      if (autoplayGeneration !== autoplayGenerationRef.current) {
        return;
      }

      autoplayTimerRef.current = null;
      advanceSlide(1);
    }, HERO_AUTOPLAY_MS);

    return clearAutoplayTimer;
  }, [activeSlide, advanceSlide, canRotate, clearAutoplayTimer, manualAdvanceKey]);

  if (props.slides.length === 0) {
    return null;
  }

  return (
    <section
      className="-mt-40 relative isolate min-h-[92svh] overflow-hidden border-b border-[var(--card-border)] lg:min-h-[100svh] md:-mt-32"
    >
      <motion.div
        className="flex min-h-[92svh] lg:min-h-[100svh]"
        animate={{ x: `${visualIndex * -100}%` }}
        transition={shouldAnimate ? HERO_TRANSITION : { duration: 0 }}
        onAnimationComplete={handleTrackAnimationComplete}
      >
        {carouselSlides.map((slide, index) => {
          const theme = heroAccentTheme[slide.accent];
          const slideIndex = getRealSlideIndex(index, props.slides.length, canRotate);

          return (
            <article
              key={`${slide.id}-${index}`}
              className="relative min-h-[92svh] min-w-full overflow-hidden lg:min-h-[100svh]"
              style={{ background: theme.background }}
            >
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage: 'linear-gradient(var(--card-border)_1px,transparent_1px),linear-gradient(90deg,var(--card-border)_1px,transparent_1px)',
                  backgroundSize: '64px 64px',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 16% 18%, ${theme.glowColor} 0%, transparent 24%), radial-gradient(circle at 84% 24%, ${theme.secondaryGlow} 0%, transparent 28%), var(--hero-overlay)`,
                }}
              />

              <div className="relative z-10 mx-auto grid min-h-[92svh] w-full max-w-7xl items-start overflow-visible px-5 pb-10 pt-36 md:px-8 md:pb-12 md:pt-36 lg:min-h-[100svh] lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.74fr)] lg:items-center lg:gap-6 lg:px-24 xl:grid-cols-[minmax(0,1.24fr)_minmax(340px,0.76fr)] xl:gap-10">
                <div className="relative z-20 max-w-5xl space-y-4 md:space-y-5">
                  <Badge variant="brand" className="gap-2 px-5 py-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                    {slide.badge}
                  </Badge>

                  <div className="space-y-3 md:space-y-5">
                    <h1 className="font-heading max-w-5xl text-balance text-[clamp(2.2rem,9.2vw,3.25rem)] font-bold leading-[0.96] tracking-normal text-[var(--text)] md:hidden">
                      <HighlightText text={getCompactHeroTitle(slide)} emphasis={slide.emphasis} accentColor={theme.accentColor} />
                    </h1>
                    <h1 className="font-heading hidden max-w-5xl text-balance text-[4rem] font-bold leading-[0.96] tracking-normal text-[var(--text)] md:block lg:text-[4.35rem] xl:text-[4.7rem]">
                      <HighlightText text={slide.title} emphasis={slide.emphasis} accentColor={theme.accentColor} />
                    </h1>
                    <p className="max-h-16 max-w-2xl overflow-hidden text-sm leading-7 text-[color-mix(in_srgb,var(--text)_78%,transparent)] sm:text-base md:max-h-none md:text-lg md:leading-8 xl:text-xl">
                      {slide.description}
                    </p>
                  </div>

                  <div className="hidden gap-3 md:grid md:grid-cols-3">
                    {slide.stats.map(stat => (
                      <div
                        key={stat.label}
                        className="rounded-[1.2rem] border px-4 py-3 backdrop-blur-xl"
                        style={{
                          borderColor: theme.statBorder,
                          background: theme.statBackground,
                        }}
                      >
                        <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--muted)] uppercase">{stat.label}</div>
                        <div className="font-data mt-2 text-lg font-semibold text-[var(--text)] xl:text-xl">{stat.value}</div>
                        <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{stat.note}</div>
                      </div>
                    ))}
                  </div>

                  {(slide.primary || slide.secondary) ? (
                    <div className="flex flex-wrap gap-3">
                      {slide.primary ? (
                        <Button variant="brand" size="lg" asChild>
                          <Link href={slide.primary.href}>
                            {slide.primary.label}
                            <ArrowRight aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      {slide.secondary ? (
                        <Button variant="glass" size="lg" asChild>
                          <Link href={slide.secondary.href}>{slide.secondary.label}</Link>
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="relative z-0 hidden h-[27rem] w-full md:h-[32rem] lg:block lg:h-[34rem] xl:h-[38rem]">
                  <Suspense fallback={<HeroVisualFallback glowColor={theme.glowColor} />}>
                    <SlideVisual
                      slide={slide}
                      accentColor={theme.accentColor}
                      glowColor={theme.glowColor}
                      isActive={activeSlide === slideIndex}
                      isMounted={isSlideVisualMounted(slideIndex, activeSlide, props.slides.length)}
                    />
                  </Suspense>
                </div>
              </div>
            </article>
          );
        })}
      </motion.div>

      {canRotate ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 hidden items-center justify-between px-5 xl:px-8 lg:flex">
            <Button
              type="button"
              variant="glass"
              size="icon"
              onClick={() => shiftSlide(-1)}
              aria-label="Show previous hero slide"
              className="pointer-events-auto h-12 w-12 rounded-full bg-[rgba(7,18,34,0.54)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="glass"
              size="icon"
              onClick={() => shiftSlide(1)}
              aria-label="Show next hero slide"
              className="pointer-events-auto h-12 w-12 rounded-full bg-[rgba(7,18,34,0.54)]"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function SlideVisual(props: {
  slide: LandingHeroSlide;
  accentColor: string;
  glowColor: string;
  isActive: boolean;
  isMounted: boolean;
}) {
  if (!props.isMounted) {
    return <HeroVisualFallback glowColor={props.glowColor} />;
  }

  if (props.slide.visualMode === 'globe') {
    return <HeroGlobeVisual {...props} />;
  }

  if (props.slide.visualMode === 'cards') {
    return <HeroCardsVisual {...props} />;
  }

  return <HeroSceneVisual {...props} />;
}

function HeroVisualFallback(props: { glowColor: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/8 bg-[rgba(7,18,34,0.42)]">
      <div
        className="absolute inset-[8%] rounded-[2rem] blur-3xl"
        style={{ background: `radial-gradient(circle, ${props.glowColor} 0%, transparent 74%)` }}
      />
      <div className="absolute inset-[10%] rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
    </div>
  );
}

function isSlideVisualMounted(index: number, activeIndex: number, totalSlides: number) {
  const distance = (index - activeIndex + totalSlides) % totalSlides;
  return distance === 0 || distance === 1 || distance === totalSlides - 1;
}

function getRealSlideIndex(index: number, totalSlides: number, hasSentinels: boolean) {
  if (!hasSentinels) {
    return index;
  }

  if (index === 0) {
    return totalSlides - 1;
  }

  if (index === totalSlides + 1) {
    return 0;
  }

  return index - 1;
}

function getCompactHeroTitle(slide: LandingHeroSlide) {
  if (slide.id === 'universal') {
    return 'FlowDex Protocol for Tokenized Markets.';
  }

  if (slide.id === 'presale') {
    return 'Buy $FDP at $0.001.';
  }

  if (slide.id === 'flowchain') {
    return 'Start Ethereum. Expand With FlowChain.';
  }

  if (slide.id === 'staking') {
    return 'Stake $FDP. Earn Fee Exposure.';
  }

  return 'Community First. No VC Gravity.';
}

const heroAccentTheme: Record<LandingHeroAccent, {
  accentColor: string;
  background: string;
  glowColor: string;
  secondaryGlow: string;
  statBackground: string;
  statBorder: string;
}> = {
  cyan: {
    accentColor: '#3CC8E8',
    background: 'var(--hero-cyan-bg)',
    glowColor: 'var(--hero-cyan-glow)',
    secondaryGlow: 'var(--hero-cyan-secondary-glow)',
    statBackground: 'var(--hero-stat-bg)',
    statBorder: 'var(--hero-cyan-stat-border)',
  },
  gold: {
    accentColor: '#D2B46C',
    background: 'var(--hero-gold-bg)',
    glowColor: 'var(--hero-gold-glow)',
    secondaryGlow: 'var(--hero-cyan-secondary-glow)',
    statBackground: 'var(--hero-stat-bg)',
    statBorder: 'var(--hero-gold-stat-border)',
  },
  slate: {
    accentColor: '#8FA6C8',
    background: 'var(--hero-slate-bg)',
    glowColor: 'var(--hero-slate-glow)',
    secondaryGlow: 'var(--hero-cyan-secondary-glow)',
    statBackground: 'var(--hero-stat-bg)',
    statBorder: 'var(--hero-slate-stat-border)',
  },
  green: {
    accentColor: '#4DBA7D',
    background: 'var(--hero-green-bg)',
    glowColor: 'var(--hero-green-glow)',
    secondaryGlow: 'var(--hero-cyan-secondary-glow)',
    statBackground: 'var(--hero-stat-bg)',
    statBorder: 'var(--hero-green-stat-border)',
  },
  rose: {
    accentColor: '#CC7079',
    background: 'var(--hero-rose-bg)',
    glowColor: 'var(--hero-rose-glow)',
    secondaryGlow: 'var(--hero-gold-secondary-glow)',
    statBackground: 'var(--hero-stat-bg)',
    statBorder: 'var(--hero-rose-stat-border)',
  },
};

function HighlightText(props: {
  text: string;
  emphasis: string;
  accentColor: string;
}) {
  if (!props.text.includes(props.emphasis)) {
    return <>{props.text}</>;
  }

  const [before, ...after] = props.text.split(props.emphasis);

  return (
    <>
      {before}
      <span style={{ color: props.accentColor }}>{props.emphasis}</span>
      {after.join(props.emphasis)}
    </>
  );
}
