'use client';

import { useMemo, useRef } from 'react';
import DottedMap from 'dotted-map';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
};

type MapProps = {
  backgroundColor?: string;
  className?: string;
  dots?: Array<{
    start: MapPoint;
    end: MapPoint;
  }>;
  lineColor?: string;
  mapColor?: string;
};

export default function WorldMap({
  backgroundColor = 'transparent',
  className,
  dots = [],
  lineColor = '#8FA6C8',
  mapColor = 'rgba(143, 166, 200, 0.5)',
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const svgMap = useMemo(() => {
    const map = new DottedMap({ height: 100, grid: 'diagonal' });

    return map.getSVG({
      radius: 0.22,
      color: mapColor,
      shape: 'circle',
      backgroundColor,
    });
  }, [backgroundColor, mapColor]);

  return (
    <div className={cn('relative w-full bg-transparent font-sans', className)}>
      <img
        alt="world map"
        className="pointer-events-none h-full w-full select-none opacity-90 mix-blend-screen [mask-image:linear-gradient(to_bottom,rgba(255,255,255,0.78),white_14%,white_90%,rgba(255,255,255,0.64))]"
        draggable={false}
        height="495"
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        width="1056"
      />

      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        viewBox="0 0 800 400"
      >
        <defs>
          <linearGradient id="world-map-path-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, index) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);

          return (
            <g key={`path-group-${index}`}>
              <motion.path
                animate={{ pathLength: 1 }}
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                initial={{ pathLength: 0 }}
                stroke="url(#world-map-path-gradient)"
                strokeWidth="1.5"
                transition={{
                  delay: index * 0.45,
                  duration: 1,
                  ease: 'easeOut',
                }}
              />
            </g>
          );
        })}

        {dots.map((dot, index) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);

          return (
            <g key={`points-group-${index}`}>
              <PulsePoint x={startPoint.x} y={startPoint.y} color={lineColor} />
              <PulsePoint x={endPoint.x} y={endPoint.y} color={lineColor} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PulsePoint({ color, x, y }: { color: string; x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} fill={color} r="3" />
      <circle cx={x} cy={y} fill={color} opacity="0.45" r="3">
        <animate
          attributeName="r"
          begin="0s"
          dur="1.5s"
          from="3"
          repeatCount="indefinite"
          to="12"
        />
        <animate
          attributeName="opacity"
          begin="0s"
          dur="1.5s"
          from="0.5"
          repeatCount="indefinite"
          to="0"
        />
      </circle>
    </g>
  );
}

function projectPoint(lat: number, lng: number) {
  return {
    x: (lng + 180) * (800 / 360),
    y: (90 - lat) * (400 / 180),
  };
}

function createCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - 50;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}
