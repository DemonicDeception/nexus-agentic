import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

// A single floating stat card that orbits the core
function HoloCard({ label, value, color, orbitRadius, orbitSpeed, orbitOffset, yOffset }: {
  label: string;
  value: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
  yOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime * orbitSpeed + orbitOffset;
    groupRef.current.position.x = Math.cos(t) * orbitRadius;
    groupRef.current.position.z = Math.sin(t) * orbitRadius;
    groupRef.current.position.y = yOffset + Math.sin(t * 1.5) * 0.15;
    // Always face outward from center
    groupRef.current.lookAt(
      groupRef.current.position.x * 2,
      groupRef.current.position.y,
      groupRef.current.position.z * 2
    );
  });

  return (
    <group ref={groupRef}>
      {/* Value */}
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.32}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {value}
      </Text>
      {/* Label */}
      <Text
        position={[0, -0.12, 0]}
        fontSize={0.1}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        {label}
      </Text>
    </group>
  );
}

export function HoloStats() {
  const agents = useStore((s) => s.agents);
  const totalCost = useStore((s) => s.totalCost);
  const totalTokens = useStore((s) => s.totalTokens);

  let working = 0;
  agents.forEach((a) => { if (a.status === 'working') working++; });
  const utilization = agents.size > 0 ? Math.round((working / agents.size) * 100) : 0;

  return (
    <group position={[0, 3, 0]}>
      <HoloCard
        label="FLEET SIZE"
        value={String(agents.size)}
        color="#00d4ff"
        orbitRadius={3.5}
        orbitSpeed={0.15}
        orbitOffset={0}
        yOffset={-0.5}
      />
      <HoloCard
        label="ACTIVE"
        value={String(working)}
        color="#10b981"
        orbitRadius={3.5}
        orbitSpeed={0.15}
        orbitOffset={Math.PI * 0.5}
        yOffset={-0.5}
      />
      <HoloCard
        label="UTILIZATION"
        value={`${utilization}%`}
        color="#7c3aed"
        orbitRadius={3.5}
        orbitSpeed={0.15}
        orbitOffset={Math.PI}
        yOffset={-0.5}
      />
      <HoloCard
        label="COST"
        value={`$${totalCost.toFixed(2)}`}
        color="#f59e0b"
        orbitRadius={3.5}
        orbitSpeed={0.15}
        orbitOffset={Math.PI * 1.5}
        yOffset={-0.5}
      />
    </group>
  );
}
