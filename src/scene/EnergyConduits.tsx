import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { Department, DEPARTMENT_COLORS } from '../types';

interface Props {
  positions: Record<Department, [number, number, number]>;
}

const DEPT_ORDER: Department[] = ['engineering', 'sales', 'qa', 'devops', 'executive', 'analytics', 'marketing', 'support'];

const lineGeoCache = new Map<string, THREE.BufferGeometry>();

function getLineGeo(from: [number, number, number], to: [number, number, number], key: string) {
  if (lineGeoCache.has(key)) return lineGeoCache.get(key)!;
  const pts = [];
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    pts.push(new THREE.Vector3(
      from[0] + (to[0] - from[0]) * t,
      0.06 + Math.sin(t * Math.PI) * 0.3, // slight arc off floor
      from[2] + (to[2] - from[2]) * t,
    ));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  lineGeoCache.set(key, geo);
  return geo;
}

export function EnergyConduits({ positions }: Props) {
  const agents = useStore((s) => s.agents);
  const groupRef = useRef<THREE.Group>(null);

  const activeDepts = useMemo(() => {
    const set = new Set<Department>();
    agents.forEach((a) => { if (a.status === 'working') set.add(a.department); });
    return set;
  }, [agents]);

  // Build edges: each dept connects to its neighbors in the octagon
  const edges = useMemo(() => {
    const result: { from: Department; to: Department; key: string }[] = [];
    for (let i = 0; i < DEPT_ORDER.length; i++) {
      const a = DEPT_ORDER[i];
      const b = DEPT_ORDER[(i + 1) % DEPT_ORDER.length];
      if (positions[a] && positions[b]) {
        result.push({ from: a, to: b, key: `${a}-${b}` });
      }
    }
    return result;
  }, [positions]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
      const edge = edges[i];
      if (!edge) return;

      const eitherActive = activeDepts.has(edge.from) || activeDepts.has(edge.to);
      const bothActive = activeDepts.has(edge.from) && activeDepts.has(edge.to);

      if (bothActive) {
        mat.opacity = 0.2 + Math.sin(t * 3 + i * 0.8) * 0.1;
      } else if (eitherActive) {
        mat.opacity = 0.08 + Math.sin(t * 2 + i) * 0.04;
      } else {
        mat.opacity = 0.03;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {edges.map(({ from, to, key }) => {
        const posA = positions[from];
        const posB = positions[to];
        const geo = getLineGeo(posA, posB, key);
        const colorA = new THREE.Color(DEPARTMENT_COLORS[from]);
        const colorB = new THREE.Color(DEPARTMENT_COLORS[to]);
        const blended = colorA.lerp(colorB, 0.5);

        return (
          <primitive
            key={key}
            object={new THREE.Line(
              geo,
              new THREE.LineBasicMaterial({
                color: blended,
                transparent: true,
                opacity: 0.05,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )}
          />
        );
      })}
    </group>
  );
}
