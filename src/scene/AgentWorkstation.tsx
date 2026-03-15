import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { CompletionBurst } from './CompletionBurst';

interface Props {
  agentId: string;
  position: [number, number, number];
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  booting: '#f59e0b',
  idle: '#64748b',
  working: '#00d4ff',
  paused: '#f59e0b',
  error: '#ef4444',
  completed: '#10b981',
};

// Shared geometries
const sharedHexGeo = (() => {
  const shape = new THREE.Shape();
  const size = 0.8;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
})();

const sharedRingGeo = new THREE.TorusGeometry(0.85, 0.03, 8, 6);
const sharedOrbGeo = new THREE.SphereGeometry(0.12, 8, 8);

export function AgentWorkstation({ agentId, position, compact = false }: Props) {
  const agent = useStore((s) => s.agents.get(agentId));
  const selectAgent = useStore((s) => s.selectAgent);
  const selectedId = useStore((s) => s.selectedAgentId);
  const glowRef = useRef<THREE.Mesh>(null);
  const platformRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const spawnProgress = useRef(0);
  const wasBooting = useRef(true);
  const prevStatus = useRef<string>('booting');
  const trailFade = useRef(0); // 1 = fully visible, fades to 0
  const trailColor = useRef('#64748b');

  // Detect status transitions
  const currentStatus = agent?.status || 'booting';
  if (prevStatus.current !== currentStatus) {
    // Celebration burst on working → completed
    if (prevStatus.current === 'working' && currentStatus === 'completed') {
      if (!showBurst) setShowBurst(true);
    }
    // Afterglow trail: snapshot the old color, start fade
    if (prevStatus.current !== 'booting') {
      trailColor.current = STATUS_COLORS[prevStatus.current as keyof typeof STATUS_COLORS] || '#64748b';
      trailFade.current = 1;
    }
    prevStatus.current = currentStatus;
  }

  const isSelected = selectedId === agentId;
  const statusColor = agent ? STATUS_COLORS[agent.status] || '#64748b' : '#64748b';
  const agentColor = agent?.color || '#64748b';
  const isEscalated = agent?.status === 'paused';
  const showLabels = !compact || hovered || isSelected;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Spawn animation — scale from 0 to 1 when agent transitions from booting
    if (agent && agent.status === 'booting') {
      wasBooting.current = true;
      spawnProgress.current = 0;
    } else if (wasBooting.current && spawnProgress.current < 1) {
      wasBooting.current = false;
      spawnProgress.current = Math.min(1, spawnProgress.current + delta * 3);
    } else {
      spawnProgress.current = Math.min(1, spawnProgress.current + delta * 5);
    }

    if (groupRef.current) {
      const s = spawnProgress.current;
      // Elastic ease-out
      const eased = s < 1 ? 1 - Math.pow(1 - s, 3) : 1;
      groupRef.current.scale.setScalar(eased);
    }

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      if (isEscalated) {
        mat.emissive.set('#ef4444');
        mat.emissiveIntensity = 0.5 + Math.sin(t * 5) * 0.5;
      } else {
        mat.emissive.set(statusColor);
        mat.emissiveIntensity = agent?.status === 'working' ? 0.5 + Math.sin(t * 3) * 0.3 : 0.2;
      }
    }

    if (platformRef.current) {
      const targetY = agent?.status === 'working' ? 0.15 : 0;
      platformRef.current.position.y = THREE.MathUtils.lerp(platformRef.current.position.y, targetY, 0.05);
    }

    // Afterglow trail — fading ghost orb
    if (trailRef.current && trailFade.current > 0) {
      trailFade.current = Math.max(0, trailFade.current - delta * 1.5);
      const mat = trailRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = trailFade.current * 0.6;
      mat.emissiveIntensity = trailFade.current * 2;
      const s = 1 + (1 - trailFade.current) * 1.5; // expand as it fades
      trailRef.current.scale.setScalar(s);
      trailRef.current.visible = true;
    } else if (trailRef.current) {
      trailRef.current.visible = false;
    }
  });

  if (!agent) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        selectAgent(isSelected ? null : agentId);
      }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Hex platform */}
      <mesh ref={platformRef} geometry={sharedHexGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <meshStandardMaterial
          color={isSelected || hovered ? agentColor : '#0f172a'}
          emissive={agentColor}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.2 : 0.05}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef} geometry={sharedRingGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Status orb */}
      <mesh geometry={sharedOrbGeo} position={[0, 0.8, 0]}>
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Afterglow trail orb — fades and expands on status change */}
      <mesh ref={trailRef} geometry={sharedOrbGeo} position={[0, 0.8, 0]} visible={false}>
        <meshStandardMaterial
          color={trailColor.current}
          emissive={trailColor.current}
          emissiveIntensity={2}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Labels — LOD */}
      {showLabels && (
        <>
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.2}
            color={agentColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {agent.name}
          </Text>
          <Text
            position={[0, 0.95, 0]}
            fontSize={0.1}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            {agent.role}
          </Text>
          {agent.isReal && (
            <Text position={[0.7, 1.2, 0]} fontSize={0.09} color="#f59e0b" anchorX="center">
              LIVE
            </Text>
          )}
        </>
      )}

      {/* Completion celebration burst */}
      {showBurst && (
        <CompletionBurst color={agentColor} onDone={() => setShowBurst(false)} />
      )}
    </group>
  );
}
