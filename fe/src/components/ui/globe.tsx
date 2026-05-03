'use client';

import { useEffect, useMemo } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import ThreeGlobe from 'three-globe';
import { Color, Fog, PerspectiveCamera, Scene, Vector3 } from 'three';
import countries from '@/data/globe.json';

const RING_PROPAGATION_SPEED = 3;
const CAMERA_Z = 360;

export type GlobeArcDatum = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

type WorldProps = {
  globeConfig: GlobeConfig;
  data: GlobeArcDatum[];
};

type GlobeMaterial = {
  color: Color;
  emissive: Color;
  emissiveIntensity: number;
  shininess: number;
};

const COUNTRY_FEATURES = (countries as { features: object[] }).features;

export function Globe({ globeConfig, data }: WorldProps) {
  const globe = useMemo(() => new ThreeGlobe(), []);

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: '#FFFFFF',
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: 'rgba(255,255,255,0.7)',
    globeColor: '#062056',
    emissive: '#062056',
    emissiveIntensity: 0.1,
    shininess: 0.9,
    ambientLight: '#38bdf8',
    directionalLeftLight: '#ffffff',
    directionalTopLight: '#ffffff',
    pointLight: '#ffffff',
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    const globeMaterial = globe.globeMaterial() as unknown as GlobeMaterial;
    globeMaterial.color = new Color(defaultProps.globeColor);
    globeMaterial.emissive = new Color(defaultProps.emissive);
    globeMaterial.emissiveIntensity = defaultProps.emissiveIntensity;
    globeMaterial.shininess = defaultProps.shininess;
  }, [
    defaultProps.emissive,
    defaultProps.emissiveIntensity,
    defaultProps.globeColor,
    defaultProps.shininess,
    globe,
  ]);

  useEffect(() => {
    const points = data.flatMap((arc) => [
      {
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.startLat,
        lng: arc.startLng,
      },
      {
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.endLat,
        lng: arc.endLng,
      },
    ]);

    const filteredPoints = points.filter((point, index, array) =>
      array.findIndex(candidate => candidate.lat === point.lat && candidate.lng === point.lng) === index,
    );

    globe
      .hexPolygonsData(COUNTRY_FEATURES)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude)
      .hexPolygonColor(() => defaultProps.polygonColor);

    globe
      .arcsData(data)
      .arcStartLat(d => (d as GlobeArcDatum).startLat)
      .arcStartLng(d => (d as GlobeArcDatum).startLng)
      .arcEndLat(d => (d as GlobeArcDatum).endLat)
      .arcEndLng(d => (d as GlobeArcDatum).endLng)
      .arcColor((d: unknown) => (d as GlobeArcDatum).color)
      .arcAltitude(d => (d as GlobeArcDatum).arcAlt)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.floor(Math.random() * 3)])
      .arcDashLength(defaultProps.arcLength)
      .arcDashInitialGap(d => (d as GlobeArcDatum).order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => defaultProps.arcTime);

    globe
      .pointsData(filteredPoints)
      .pointColor(d => (d as { color: string }).color)
      .pointsMerge(true)
      .pointAltitude(0)
      .pointRadius(2);

    globe
      .ringsData([])
      .ringColor(() => defaultProps.polygonColor)
      .ringMaxRadius(defaultProps.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod((defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings);
  }, [
    data,
    defaultProps.arcLength,
    defaultProps.arcTime,
    defaultProps.atmosphereAltitude,
    defaultProps.atmosphereColor,
    defaultProps.maxRings,
    defaultProps.pointSize,
    defaultProps.polygonColor,
    defaultProps.rings,
    defaultProps.showAtmosphere,
    globe,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const activeIndexes = genRandomNumbers(0, data.length, Math.max(1, Math.floor((data.length * 4) / 5)));

      globe.ringsData(
        data
          .filter((_, index) => activeIndexes.includes(index))
          .map(arc => ({
            lat: arc.startLat,
            lng: arc.startLng,
            color: arc.color,
          })),
      );
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [data, globe]);

  return <primitive object={globe} />;
}

function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0x000000, 0);
  }, [gl, size]);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;
  const scene = useMemo(() => {
    const nextScene = new Scene();
    nextScene.fog = new Fog(0xFFFFFF, 400, 2000);
    return nextScene;
  }, []);

  return (
    <Canvas
      scene={scene}
      camera={new PerspectiveCamera(50, 1.2, 180, 1800)}
    >
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new Vector3(-400, 100, 400)}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new Vector3(-200, 500, 200)}
      />
      <pointLight
        color={globeConfig.pointLight}
        intensity={0.8}
        position={new Vector3(-200, 500, 200)}
      />
      <Globe {...props} />
      <OrbitControls
        autoRotate={globeConfig.autoRotate ?? true}
        autoRotateSpeed={globeConfig.autoRotateSpeed ?? 1}
        enablePan={false}
        enableZoom={false}
        maxDistance={CAMERA_Z}
        maxPolarAngle={Math.PI - Math.PI / 3}
        minDistance={CAMERA_Z}
        minPolarAngle={Math.PI / 3.5}
      />
    </Canvas>
  );
}

function genRandomNumbers(min: number, max: number, count: number) {
  const values: number[] = [];

  while (values.length < count) {
    const value = Math.floor(Math.random() * (max - min)) + min;
    if (!values.includes(value)) {
      values.push(value);
    }
  }

  return values;
}
