import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { Department } from '../types';

const PIPELINE = ['atlas', 'nova', 'cipher'];

interface Props {
  positions: Record<Department, [number, number, number]>;
}

export function CollaborationArcs({ positions }: Props) {
  const agents = useStore((s) => s.agents);
  const groupRef = useRef<THREE.Group>(null);

  const activeArcs = useMemo(() => {
    const arcs: { from: string; to: string }[] = [];
    for (let i = 0; i < PIPELINE.length - 1; i++) {
      const a = agents.get(PIPELINE[i]);
      const b = agents.get(PIPELINE[i + 1]);
      if (a && b && a.status !== 'booting' && b.status !== 'booting') {
        arcs.push({ from: PIPELINE[i], to: PIPELINE[i + 1] });
      }
    }
    return arcs;
  }, [agents]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 2 + i) * 0.15;
      }
    });
  });

  if (activeArcs.length === 0) return null;

  const engPos = positions.engineering;
  if (!engPos) return null;

  // Match hex grid positions from DepartmentZone
  const getAgentWorldPos = (agentId: string): THREE.Vector3 => {
    const idx = PIPELINE.indexOf(agentId);
    const spacing = 2.0;
    const cols = 3;
    const col = idx % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    return new THREE.Vector3(engPos[0] + x, 1.5, engPos[2]);
  };

  return (
    <group ref={groupRef}>
      {activeArcs.map(({ from, to }) => {
        const start = getAgentWorldPos(from);
        const end = getAgentWorldPos(to);
        const mid = new THREE.Vector3((start.x + end.x) / 2, start.y + 1.5, (start.z + end.z) / 2);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.02, 4, false);
        return (
          <mesh key={`${from}-${to}`} geometry={tubeGeo}>
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}
