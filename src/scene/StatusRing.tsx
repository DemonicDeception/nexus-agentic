import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { AgentStatus } from '../types';

interface Props {
  agentIds: string[];
  color: string;
}

const STATUS_RING_COLORS: Record<AgentStatus, string> = {
  booting: '#f59e0b',
  idle: '#334155',
  working: '#00d4ff',
  paused: '#f59e0b',
  error: '#ef4444',
  completed: '#10b981',
};

export function StatusRing({ agentIds, color }: Props) {
  const agents = useStore((s) => s.agents);
  const groupRef = useRef<THREE.Group>(null);

  // Build segments — one arc per agent, colored by status
  const segments = useMemo(() => {
    if (agentIds.length === 0) return [];
    const count = agentIds.length;
    const gap = 0.03; // small gap between segments
    const segAngle = (Math.PI * 2) / count - gap;

    return agentIds.map((id, i) => {
      const startAngle = (i / count) * Math.PI * 2;
      const shape = new THREE.Shape();
      const innerR = 1.6;
      const outerR = 1.8;
      const steps = 12;

      // Outer arc
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (s / steps) * segAngle;
        const x = Math.cos(a) * outerR;
        const y = Math.sin(a) * outerR;
        if (s === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      // Inner arc (reverse)
      for (let s = steps; s >= 0; s--) {
        const a = startAngle + (s / steps) * segAngle;
        shape.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
      }
      shape.closePath();

      const geo = new THREE.ShapeGeometry(shape);
      return { id, geo };
    });
  }, [agentIds]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  if (agentIds.length === 0) return null;

  return (
    <group ref={groupRef} position={[0, 4.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {segments.map(({ id, geo }) => {
        const agent = agents.get(id);
        const segColor = agent ? STATUS_RING_COLORS[agent.status] : '#1e293b';
        return (
          <mesh key={id} geometry={geo}>
            <meshBasicMaterial
              color={segColor}
              transparent
              opacity={agent?.status === 'working' ? 0.9 : 0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
