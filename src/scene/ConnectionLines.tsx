import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { DEPARTMENT_COLORS, Department } from '../types';

interface Props {
  positions: Record<Department, [number, number, number]>;
}

function ConnectionLine({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const lineRef = useRef<THREE.Line>(null);

  const { geometry, material } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = new THREE.Vector3(
      (from[0] + to[0]) * 0.5,
      Math.max(from[1], to[1]) + 2,
      (from[2] + to[2]) * 0.5,
    );
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15 });
    return { geometry: geo, material: mat };
  }, [from, to, color]);

  useFrame((state) => {
    if (lineRef.current) {
      material.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  useEffect(() => {
    return () => { geometry.dispose(); material.dispose(); };
  }, [geometry, material]);

  return <primitive ref={lineRef} object={new THREE.Line(geometry, material)} />;
}

export function ConnectionLines({ positions }: Props) {
  const agents = useStore((s) => s.agents);

  const activeDepts = useMemo(() => {
    const depts = new Set<Department>();
    agents.forEach((agent) => {
      if (agent.status !== 'booting') depts.add(agent.department);
    });
    return Array.from(depts);
  }, [agents]);

  return (
    <group>
      {activeDepts.map((dept) => {
        const pos = positions[dept];
        if (!pos) return null;
        const color = DEPARTMENT_COLORS[dept];
        return (
          <ConnectionLine
            key={dept}
            from={[pos[0], 0.5, pos[2]]}
            to={[0, 3, 0]}
            color={color}
          />
        );
      })}
    </group>
  );
}
