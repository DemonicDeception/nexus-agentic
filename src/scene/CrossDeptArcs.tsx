import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { Department, DEPARTMENT_COLORS } from '../types';

interface Props {
  positions: Record<Department, [number, number, number]>;
}

// Which department pairs have logical data flow between them
const DEPT_LINKS: [Department, Department][] = [
  ['engineering', 'qa'],        // code → tests
  ['engineering', 'devops'],    // code → deploy
  ['sales', 'marketing'],      // leads ↔ campaigns
  ['sales', 'support'],        // deals → onboarding
  ['support', 'engineering'],   // bugs → fixes
  ['analytics', 'executive'],   // data → decisions
  ['devops', 'qa'],            // infra → testing
  ['marketing', 'analytics'],   // campaigns → metrics
];

const tubeGeoCache = new Map<string, THREE.TubeGeometry>();

function getArcGeo(from: [number, number, number], to: [number, number, number], key: string): THREE.TubeGeometry {
  if (tubeGeoCache.has(key)) return tubeGeoCache.get(key)!;
  const start = new THREE.Vector3(from[0], 1.5, from[2]);
  const end = new THREE.Vector3(to[0], 1.5, to[2]);
  const mid = new THREE.Vector3(
    (from[0] + to[0]) / 2,
    4 + start.distanceTo(end) * 0.15,
    (from[2] + to[2]) / 2,
  );
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const geo = new THREE.TubeGeometry(curve, 24, 0.025, 4, false);
  tubeGeoCache.set(key, geo);
  return geo;
}

export function CrossDeptArcs({ positions }: Props) {
  const agents = useStore((s) => s.agents);
  const groupRef = useRef<THREE.Group>(null);

  // Find which departments have at least one working agent
  const activeDepts = useMemo(() => {
    const set = new Set<Department>();
    agents.forEach((a) => {
      if (a.status === 'working') set.add(a.department);
    });
    return set;
  }, [agents]);

  // Only show arcs where both departments are active
  const activeLinks = useMemo(() => {
    return DEPT_LINKS.filter(([a, b]) => activeDepts.has(a) && activeDepts.has(b));
  }, [activeDepts]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        // Staggered pulse so arcs don't all blink together
        mat.opacity = 0.08 + Math.sin(t * 1.5 + i * 1.2) * 0.08;
      }
    });
  });

  if (activeLinks.length === 0) return null;

  return (
    <group ref={groupRef}>
      {activeLinks.map(([deptA, deptB]) => {
        const posA = positions[deptA];
        const posB = positions[deptB];
        if (!posA || !posB) return null;
        const key = `${deptA}-${deptB}`;
        const geo = getArcGeo(posA, posB, key);
        // Blend the two department colors
        const colorA = new THREE.Color(DEPARTMENT_COLORS[deptA]);
        const colorB = new THREE.Color(DEPARTMENT_COLORS[deptB]);
        const blended = colorA.lerp(colorB, 0.5);

        return (
          <mesh key={key} geometry={geo}>
            <meshBasicMaterial
              color={blended}
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
