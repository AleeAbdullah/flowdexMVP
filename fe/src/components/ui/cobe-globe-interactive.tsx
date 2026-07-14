'use client';

import { type CSSProperties, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';

export interface InteractiveMarker {
  id: string;
  location: [number, number];
  name: string;
  users: number;
}

export interface GlobeArc {
  from: [number, number];
  to: [number, number];
  id?: string;
}

interface GlobeInteractiveProps {
  markers?: InteractiveMarker[];
  arcs?: GlobeArc[];
  className?: string;
  speed?: number;
  accentColor?: [number, number, number];
  baseColor?: [number, number, number];
  glowColor?: [number, number, number];
  label?: string;
}

const defaultMarkers: InteractiveMarker[] = [
  { id: 'hq', location: [37.78, -122.44], name: 'HQ', users: 1420 },
  { id: 'eu', location: [52.52, 13.41], name: 'EU', users: 892 },
  { id: 'asia', location: [35.68, 139.65], name: 'Asia', users: 2103 },
  { id: 'latam', location: [-23.55, -46.63], name: 'LATAM', users: 567 },
  { id: 'mena', location: [25.2, 55.27], name: 'MENA', users: 734 },
  { id: 'oceania', location: [-33.87, 151.21], name: 'APAC', users: 445 },
];
const defaultArcs: GlobeArc[] = [];
const defaultAccentColor: [number, number, number] = [0.24, 0.78, 0.91];
const defaultBaseColor: [number, number, number] = [0.9, 0.96, 1];
const defaultGlowColor: [number, number, number] = [0.08, 0.24, 0.36];

export function GlobeInteractive({
  markers = defaultMarkers,
  arcs = defaultArcs,
  className = '',
  speed = 0.003,
  accentColor = defaultAccentColor,
  baseColor = defaultBaseColor,
  glowColor = defaultGlowColor,
  label = 'users',
}: GlobeInteractiveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const speedRef = useRef(speed);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }

    pointerInteracting.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let phi = 0;

    function init(width: number) {
      if (globe || width === 0) {
        return;
      }

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.35,
        mapSamples: 16000,
        mapBrightness: 8,
        mapBaseBrightness: 0.05,
        baseColor,
        markerColor: accentColor,
        glowColor,
        markerElevation: 0.012,
        markers: markers.map(marker => ({
          location: marker.location,
          size: 0.035,
          id: marker.id,
          color: accentColor,
        })),
        arcs: arcs.map(arc => ({
          from: arc.from,
          to: arc.to,
          id: arc.id,
          color: accentColor,
        })),
        arcColor: accentColor,
        arcWidth: 0.45,
        arcHeight: 0.28,
        opacity: 0.92,
      });

      function animate() {
        if (!isPausedRef.current) {
          phi += speedRef.current;
        }

        globe?.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = requestAnimationFrame(animate);
      }

      animate();
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (width > 0) {
        init(width);
      }
    });

    if (canvas.offsetWidth > 0) {
      init(Math.floor(canvas.offsetWidth));
    }

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      globe?.destroy();
    };
  }, [accentColor, arcs, baseColor, glowColor, markers]);

  return (
    <div className={cn('relative aspect-square select-none', className)}>
      <style>
        {`
          @keyframes flowdex-globe-label-in {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 0.78; transform: translateY(0); }
          }
        `}
      </style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          opacity: 1,
          transition: 'opacity 1.2s ease',
          borderRadius: '50%',
          touchAction: 'none',
        }}
      />
      {markers.map(marker => (
        <button
          key={marker.id}
          type="button"
          aria-label={`${marker.name}: ${marker.users.toLocaleString()} ${label}`}
          className="absolute flex flex-col items-center border border-[var(--visual-glass-border)] bg-[var(--visual-glass-surface-strong)] text-[var(--text)] shadow-[0_14px_38px_var(--visual-deep-shadow)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          onClick={() => setExpanded(expanded === marker.id ? null : marker.id)}
          style={{
            '--marker-visible': `var(--cobe-visible-${marker.id}, 0)`,
            positionAnchor: `--cobe-${marker.id}`,
            bottom: 'anchor(top)',
            left: 'anchor(center)',
            translate: '-50% 0',
            marginBottom: 8,
            padding: expanded === marker.id ? '0.48rem 0.68rem' : '0.34rem 0.54rem',
            borderRadius: 6,
            cursor: 'pointer',
            opacity: 'var(--marker-visible)',
            filter: 'blur(calc((1 - var(--marker-visible)) * 8px))',
            transform: expanded === marker.id ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 0.4s, filter 0.4s, transform 0.2s, padding 0.2s',
          } as CSSProperties}
        >
          <span className="font-data text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
            {marker.name}
          </span>
          {expanded === marker.id ? (
            <span className="mt-1 text-[0.58rem] text-[var(--muted)]" style={{ animation: 'flowdex-globe-label-in 0.2s ease-out' }}>
              {marker.users.toLocaleString()}
              {' '}
              {label}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
