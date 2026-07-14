'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  Boxes,
  Coins,
  Globe2,
  Landmark,
  ShieldCheck,
  Sparkles,
  Workflow,
} from '@/icons';
import { Badge } from '@/components/ui/badge';
import { GlobeInteractive, type GlobeArc, type InteractiveMarker } from '@/components/ui/cobe-globe-interactive';
import { HeroDitheringCard } from '@/components/ui/hero-dithering-card';
import WorldMap from '@/components/ui/world-map';
import { cn } from '@/lib/utils';
import type { LandingHeroVisualItem, LandingHeroVisualPanel, LandingHeroSlide } from './landing-page.data';

type VisualProps = {
  slide: LandingHeroSlide;
  accentColor: string;
  glowColor: string;
  isActive: boolean;
};

const sceneMetricGlowClassName = 'absolute z-0 left-[-10%] top-[4%] h-[78%] w-[78%] rounded-full blur-3xl';
const sceneMetricOrbClassName = 'absolute z-0 left-[-10%] top-[6%] flex h-[76%] w-[76%] items-center justify-center';
const communityMetricGlowClassName = 'absolute z-0 left-[-16%] top-[5%] h-[80%] w-[80%] rounded-full blur-3xl';
const communityMetricOrbClassName = 'absolute z-0 left-[-14%] top-[8%] flex h-[78%] w-[78%] items-center justify-center';
const flowchainMapRoutes = [
  {
    start: { lat: 40.7128, lng: -74.006, label: 'New York' },
    end: { lat: 51.5072, lng: -0.1276, label: 'London' },
  },
  {
    start: { lat: 51.5072, lng: -0.1276, label: 'London' },
    end: { lat: 25.2048, lng: 55.2708, label: 'Dubai' },
  },
  {
    start: { lat: 25.2048, lng: 55.2708, label: 'Dubai' },
    end: { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
  },
  {
    start: { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
    end: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
  },
  {
    start: { lat: -23.5505, lng: -46.6333, label: 'Sao Paulo' },
    end: { lat: 40.7128, lng: -74.006, label: 'New York' },
  },
];
const heroGlobeMarkers: InteractiveMarker[] = [
  { id: 'nyc', location: [40.7128, -74.006], name: 'Crypto', users: 240 },
  { id: 'london', location: [51.5072, -0.1276], name: 'Forex', users: 72 },
  { id: 'dubai', location: [25.2048, 55.2708], name: 'Commods', users: 58 },
  { id: 'singapore', location: [1.3521, 103.8198], name: 'RWA', users: 86 },
  { id: 'tokyo', location: [35.6762, 139.6503], name: 'Equities', users: 130 },
  { id: 'sao-paulo', location: [-23.5505, -46.6333], name: 'LATAM', users: 44 },
];
const heroGlobeArcs: GlobeArc[] = [
  { id: 'nyc-london', from: [40.7128, -74.006], to: [51.5072, -0.1276] },
  { id: 'london-dubai', from: [51.5072, -0.1276], to: [25.2048, 55.2708] },
  { id: 'dubai-singapore', from: [25.2048, 55.2708], to: [1.3521, 103.8198] },
  { id: 'singapore-tokyo', from: [1.3521, 103.8198], to: [35.6762, 139.6503] },
  { id: 'sao-paulo-nyc', from: [-23.5505, -46.6333], to: [40.7128, -74.006] },
];
const heroGlobeBaseColor: [number, number, number] = [0.08, 0.19, 0.32];
const heroGlobeGlowColor: [number, number, number] = [0.24, 0.78, 0.91];
const heroGlobeLightBaseColor: [number, number, number] = [0.72, 0.86, 0.92];
const heroGlobeLightGlowColor: [number, number, number] = [0.06, 0.45, 0.6];

export function LandingHeroGlobeVisual(props: VisualProps) {
  const { resolvedTheme } = useTheme();
  const isLightTheme = resolvedTheme === 'light';
  const globeAccentColor = useMemo(() => hexToCobeColor(props.accentColor), [props.accentColor]);

  return (
    <div className="relative h-full w-full overflow-visible">
      <div
        className="absolute z-0 inset-x-[4%] top-[4%] h-[86%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${props.glowColor} 0%, transparent 72%)` }}
      />

      <div className="absolute z-0 left-[-15%] top-[-10%] flex h-[126%] w-[126%] items-center justify-center overflow-visible xl:left-[-18%]">
        <GlobeInteractive
          markers={heroGlobeMarkers}
          arcs={heroGlobeArcs}
          accentColor={globeAccentColor}
          baseColor={isLightTheme ? heroGlobeLightBaseColor : heroGlobeBaseColor}
          glowColor={isLightTheme ? heroGlobeLightGlowColor : heroGlobeGlowColor}
          label="markets"
          speed={props.isActive ? 0.0028 : 0}
          className="w-full max-w-[31.5rem] opacity-95 drop-shadow-[0_28px_90px_rgba(60,200,232,0.16)] xl:max-w-[34rem]"
        />
      </div>

      <div className="absolute z-20 bottom-[3%] left-[200px] w-[82%] max-w-[25.5rem] xl:w-[84%] xl:max-w-[26rem]">
        <HeroVisualPanelCard
          panel={props.slide.visualPanel}
          accentColor={props.accentColor}
          badgeIcon={<Globe2 className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  );
}

function hexToCobeColor(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;

  return [red, green, blue];
}

export function LandingHeroCardsVisual(props: VisualProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardVariants = [
    {
      title: 'Tier 1',
      value: '$0.001',
      note: 'Genesis access',
      className: 'left-[6%] top-[22%] -rotate-[10deg]',
      hoverOffsetX: -28,
      hoverOffsetY: -8,
      hoverScale: 1.04,
    },
    {
      title: 'Listing Ref',
      value: '$0.05',
      note: 'Whitepaper framing',
      className: 'left-[18%] top-[52%] rotate-[4deg]',
      hoverOffsetX: -20,
      hoverOffsetY: -12,
      hoverScale: 1.06,
    },
  ];

  return (
    <motion.div
      className="relative h-full w-full overflow-visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div
        className="absolute z-0 inset-[10%] rounded-[2rem] blur-3xl"
        style={{ background: `radial-gradient(circle, ${props.glowColor} 0%, transparent 78%)` }}
      />

      <div className="absolute z-0 left-[32%] top-[14%] h-[10rem] w-[15rem] rotate-[11deg] rounded-[1.9rem] border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface)] opacity-38 shadow-[0_24px_80px_var(--visual-deep-shadow)] backdrop-blur-2xl" />


      {cardVariants.map((card, index) => (
        <motion.div
          key={card.title}
          className={cn(
            'absolute z-10 h-[9.75rem] w-[13.5rem] rounded-[1.7rem] border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface)] p-4 shadow-[0_24px_80px_var(--visual-deep-shadow)] backdrop-blur-2xl',
            card.className,
          )}
          initial={{ opacity: 0, x: 30, y: 30 }}
          animate={{
            opacity: 1,
            x: isHovered ? card.hoverOffsetX : 0,
            y: props.isActive
              ? [isHovered ? card.hoverOffsetY : 0, (isHovered ? card.hoverOffsetY : 0) - 12, isHovered ? card.hoverOffsetY : 0]
              : (isHovered ? card.hoverOffsetY : 0),
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.22,
            x: { duration: 0.35, ease: 'easeOut' },
            y: { duration: 5 + index, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
          }}
        >
          <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">{card.title}</div>
          <div className="font-heading mt-4 text-[2.2rem] font-bold tracking-tight text-[var(--text)]">{card.value}</div>
          <div className="mt-2 text-xs leading-6 text-[var(--muted)]">{card.note}</div>
        </motion.div>
      ))}

      <div className="absolute z-20 bottom-[3%] left-[200px] w-[82%] max-w-[25.5rem] xl:w-[84%] xl:max-w-[26rem]">
        <HeroVisualPanelCard panel={props.slide.visualPanel} accentColor={props.accentColor} />
      </div>
    </motion.div>
  );
}

export function LandingHeroSceneVisual(props: VisualProps) {
  switch (props.slide.id) {
    case 'flowchain':
      return <FlowchainScene {...props} />;
    case 'staking':
      return <StakingScene {...props} />;
    case 'community':
      return <CommunityScene {...props} />;
    default:
      return null;
  }
}

function FlowchainScene(props: VisualProps) {
  const { resolvedTheme } = useTheme();
  const isLightTheme = resolvedTheme === 'light';

  return (
    <div className="relative h-full w-full overflow-visible">
      <div
        className="absolute z-0 inset-[6%] rounded-[2rem] blur-3xl"
        style={{ background: `radial-gradient(circle, ${props.glowColor} 0%, transparent 74%)` }}
      />
      <div className="absolute z-0 left-[-14%] top-[-6%] h-[86%] w-[132%] opacity-88">
        <WorldMap
          backgroundColor="transparent"
          className="h-full bg-transparent dark:bg-transparent"
          dots={flowchainMapRoutes}
          lineColor={props.accentColor}
          mapColor={isLightTheme ? 'rgba(95, 119, 146, 0.42)' : 'rgba(143, 166, 200, 0.5)'}
          blendMode={isLightTheme ? 'multiply' : 'screen'}
        />
      </div>

      <div className="absolute z-20 bottom-[4%] left-[200px] h-[78%] w-[78%] max-w-[25rem]">
        <HeroVisualPanelCard
          panel={props.slide.visualPanel}
          accentColor={props.accentColor}
          badgeIcon={<Boxes className="h-3.5 w-3.5" />}
          className="h-full"
          contentClassName="flex h-full flex-col gap-3 space-y-0"
          compact
          itemsWrapperClassName="mt-auto"
        />
      </div>
    </div>
  );
}

function StakingScene(props: VisualProps) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <div
        className={sceneMetricGlowClassName}
        style={{ background: `radial-gradient(circle, ${props.glowColor} 0%, transparent 76%)` }}
      />
      <div className={sceneMetricOrbClassName}>
        <motion.div
          className="absolute h-[86%] w-[86%] rounded-full border border-[var(--visual-orbit-border)]"
          animate={props.isActive ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 26, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute h-[66%] w-[66%] rounded-full border border-[var(--visual-orbit-border)]"
          animate={props.isActive ? { rotate: -360 } : { rotate: 0 }}
          transition={{ duration: 20, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
        />
        <div className="absolute h-[50%] w-[50%] rounded-full border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface)]" />
        <div className="relative z-10 mx-auto max-w-[22rem] px-8 text-center">
          <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">Staker Share</div>
          <div className="font-heading mt-3 text-7xl font-bold text-[var(--text)]">40%</div>
          <div className="mt-2 text-sm text-[var(--muted)]">Illustrative fee participation</div>
        </div>
      </div>

      <div className="absolute z-20 bottom-[3%] left-[200px] w-[78%] max-w-[25rem]">
        <HeroVisualPanelCard
          panel={props.slide.visualPanel}
          accentColor={props.accentColor}
          badgeIcon={<Coins className="h-3.5 w-3.5" />}
          badgeVariant="success"
        />
      </div>
    </div>
  );
}

function CommunityScene(props: VisualProps) {
  const badges = [
    { icon: Landmark, label: 'No VC', className: 'left-[20%] top-[27%]' },
    { icon: ShieldCheck, label: 'Locked Team', className: 'left-[8%] top-[21%]' },
    { icon: Workflow, label: 'DAO Path', className: 'left-[6%] bottom-[22%]' },
    { icon: Sparkles, label: 'Genesis', className: 'left-[18%] bottom-[13%]' },
  ];

  return (
    <div className="relative h-full w-full overflow-visible">
      <div
        className={communityMetricGlowClassName}
        style={{ background: `radial-gradient(circle, ${props.glowColor} 0%, transparent 76%)` }}
      />
      <div
        className={cn(
          communityMetricOrbClassName,
          'rounded-full border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface)] shadow-[0_28px_80px_var(--visual-deep-shadow)]',
        )}
      >
        <div className="absolute inset-[11%] rounded-full border border-dashed border-[var(--visual-orbit-border)]" />
        <div className="absolute inset-[24%] rounded-full border border-[var(--visual-glass-border)]" />
        <div className="relative z-10 text-center">
          <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">Community Facing</div>
          <div className="font-heading mt-3 text-6xl font-bold text-[var(--text)]">75%</div>
          <div className="mt-2 text-sm text-[var(--muted)]">Dominant public ownership signal</div>
        </div>
      </div>

      {badges.map((badge, index) => {
        const Icon = badge.icon;

        return (
          <motion.div
            key={badge.label}
            className={cn('absolute z-10 rounded-full border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface-strong)] px-4 py-3 shadow-[0_18px_50px_var(--visual-deep-shadow)] backdrop-blur-xl', badge.className)}
            animate={props.isActive ? { y: [0, -10, 0] } : undefined}
            transition={{ duration: 4 + index * 0.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <div className="flex items-center gap-2 text-sm text-[var(--text)]">
              <Icon className="h-4 w-4 text-[var(--accent-strong)]" />
              <span>{badge.label}</span>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute z-20 bottom-[3%] left-[200px] w-[78%] max-w-[25rem]">
        <HeroVisualPanelCard
          panel={props.slide.visualPanel}
          accentColor={props.accentColor}
          badgeIcon={<ArrowRight className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  );
}

function HeroVisualPanelCard(props: {
  panel: LandingHeroVisualPanel;
  accentColor: string;
  badgeIcon?: ReactNode;
  badgeVariant?: 'brand' | 'success';
  className?: string;
  contentClassName?: string;
  compact?: boolean;
  itemsWrapperClassName?: string;
}) {
  const isDenseStack = props.panel.layout === 'stack';

  return (
    <HeroDitheringCard
      className={cn(props.compact ? 'p-3.5' : isDenseStack ? 'p-4' : 'p-5', props.className)}
      colorFront={props.accentColor}
      contentClassName={cn((props.compact || isDenseStack) ? 'space-y-3' : 'space-y-4', props.contentClassName)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">{props.panel.eyebrow}</div>
          <div className={cn(
            'font-heading font-bold leading-[1.04] tracking-tight text-[var(--text)]',
            props.compact
              ? 'max-w-[14rem] text-[1.7rem]'
              : isDenseStack
                ? 'max-w-[16rem] text-[1.85rem]'
                : 'max-w-[14rem] text-[2rem]',
          )}>
            {props.panel.title}
          </div>
        </div>
        <Badge variant={props.badgeVariant ?? 'brand'} className="mt-1 shrink-0 gap-2 px-3 py-1">
          {props.badgeIcon}
          <span className="max-w-[7rem] truncate">{props.panel.badge}</span>
        </Badge>
      </div>

      <p className={cn('text-[var(--muted)]', (props.compact || isDenseStack) ? 'text-[13px] leading-[1.55]' : 'text-sm leading-7')}>{props.panel.body}</p>
      <div className={props.itemsWrapperClassName}>
        <HeroVisualPanelItems layout={props.panel.layout} items={props.panel.items} compact={props.compact || isDenseStack} />
      </div>
    </HeroDitheringCard>
  );
}

function HeroVisualPanelItems(props: {
  layout: LandingHeroVisualPanel['layout'];
  items: LandingHeroVisualItem[];
  compact?: boolean;
}) {
  if (props.layout === 'phase') {
    return (
      <div className={cn('grid', props.compact ? 'gap-2' : 'gap-3')}>
        {props.items.map(item => (
          <div key={item.label} className={cn(
            'rounded-[1.2rem] border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface)]',
            props.compact ? 'px-3 py-2' : 'px-4 py-3',
          )}>
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--muted)] uppercase">{item.label}</div>
              <div className={cn(
                'font-data text-right font-semibold leading-none text-[var(--text)]',
                props.compact ? 'text-[1.55rem]' : 'text-[1.85rem]',
              )}>{item.value}</div>
            </div>
            {item.note ? (
              <div className={cn('text-xs text-[var(--muted)]', props.compact ? 'mt-1 leading-[1.35]' : 'mt-2 leading-6')}>{item.note}</div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (props.layout === 'signal') {
    return (
      <div className="divide-y divide-[var(--visual-glass-border)] rounded-[1.25rem] border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface)]">
        {props.items.map(item => (
          <div key={item.label} className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)] uppercase">{item.label}</span>
              <span className="font-data shrink-0 whitespace-nowrap text-right text-[1.55rem] font-semibold leading-none text-[var(--text)]">{item.value}</span>
            </div>
            {item.note ? (
              <div className="text-xs leading-6 text-[var(--muted)]">{item.note}</div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid', props.compact ? 'gap-2' : 'gap-3')}>
      {props.items.map(item => (
        <div
          key={item.label}
          className={cn(
            'border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface)]',
            props.compact ? 'rounded-[1rem] px-3.5 py-2.5' : 'rounded-[1.2rem] px-4 py-3',
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className={cn('text-[10px] font-semibold text-[var(--muted)] uppercase', props.compact ? 'tracking-[0.22em]' : 'tracking-[0.28em]')}>{item.label}</div>
            <div className={cn('font-data text-right font-semibold leading-none text-[var(--text)]', props.compact ? 'text-[1.3rem]' : 'text-[1.45rem]')}>{item.value}</div>
          </div>
          {item.note ? (
            <div className={cn('text-xs text-[var(--muted)]', props.compact ? 'mt-1.5 leading-5' : 'mt-2 leading-6')}>{item.note}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
