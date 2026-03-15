import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

const shockwaveGeo = new THREE.TorusGeometry(1, 0.06, 8, 64);

// Ground data rings — concentric torus rings beneath the core
const DATA_RINGS = [
  { radius: 3.5, thickness: 0.015, speed: 0.4, color: '#00d4ff' },
  { radius: 5.0, thickness: 0.01, speed: -0.25, color: '#7c3aed' },
  { radius: 6.5, thickness: 0.012, speed: 0.15, color: '#00d4ff' },
  { radius: 8.0, thickness: 0.008, speed: -0.1, color: '#6366f1' },
];

function Shockwave({ onDone }: { onDone: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    progress.current += delta * 0.8;
    const p = progress.current;

    // Expand from 1 to 20, fade out
    const scale = 1 + p * 25;
    ref.current.scale.set(scale, scale, scale);
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.opacity = Math.max(0, 0.8 - p * 0.8);
    mat.emissiveIntensity = Math.max(0, 2 - p * 2);

    if (p >= 1) onDone();
  });

  return (
    <mesh ref={ref} geometry={shockwaveGeo} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        color="#ef4444"
        emissive="#ef4444"
        emissiveIntensity={2}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function CentralCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const globeRef = useRef<THREE.Mesh>(null);
  const activeAgents = useStore((s) => {
    let count = 0;
    s.agents.forEach((a) => { if (a.status === 'working') count++; });
    return count;
  });

  // Shockwave on escalation
  const escalations = useStore((s) => s.escalations);
  const [shockwaves, setShockwaves] = useState<number[]>([]);
  const prevEscCount = useRef(0);

  useEffect(() => {
    const pendingCount = escalations.filter((e) => e.status === 'pending').length;
    if (pendingCount > prevEscCount.current) {
      setShockwaves((prev) => [...prev, Date.now()]);
    }
    prevEscCount.current = pendingCount;
  }, [escalations]);

  const removeShockwave = (id: number) => {
    setShockwaves((prev) => prev.filter((s) => s !== id));
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
      const scale = 1 + Math.sin(t * 2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.3;
      ring2Ref.current.rotation.y = Math.cos(t * 0.4) * 0.3;
    }
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.08;
      globeRef.current.rotation.x = 0.3;
    }
  });

  return (
    <group position={[0, 3, 0]}>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Holographic wireframe globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.4, 24, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.3}
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Rotating rings */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.8, 0.02, 8, 64]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1} transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.2, 0.015, 8, 64]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1} transparent opacity={0.4} />
      </mesh>

      {/* Labels */}
      <Text position={[0, 2.5, 0]} fontSize={0.35} color="#00d4ff" anchorX="center" anchorY="middle">
        NEXUS CORE
      </Text>
      <CoreStatusLabel />

      {/* Escalation shockwaves */}
      {shockwaves.map((id) => (
        <Shockwave key={id} onDone={() => removeShockwave(id)} />
      ))}

      <pointLight color="#00d4ff" intensity={2} distance={15} />

      {/* Ground data rings — concentric rings on the floor beneath the core */}
      <DataRings activeRatio={activeAgents / Math.max(1, useStore.getState().agents.size)} />
    </group>
  );
}

function CoreStatusLabel() {
  const agents = useStore((s) => s.agents);
  const total = agents.size;
  let online = 0;
  let working = 0;
  agents.forEach((a) => {
    if (a.status !== 'booting') online++;
    if (a.status === 'working') working++;
  });

  const booting = online < total;
  const label = booting
    ? `${online}/${total} AGENTS ONLINE`
    : `${working} ACTIVE — ${total} FLEET`;
  const color = booting ? '#f59e0b' : '#64748b';

  return (
    <Text position={[0, 2.1, 0]} fontSize={0.18} color={color} anchorX="center" anchorY="middle">
      {label}
    </Text>
  );
}

function DataRings({ activeRatio }: { activeRatio: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    DATA_RINGS.forEach((ring, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      mesh.rotation.z = t * ring.speed;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      // Pulse opacity based on activity level + per-ring phase offset
      mat.opacity = (0.1 + activeRatio * 0.25) + Math.sin(t * 1.5 + i * 1.8) * 0.08;
      mat.emissiveIntensity = 0.3 + activeRatio * 0.7 + Math.sin(t * 2 + i) * 0.2;
    });
  });

  return (
    <group position={[0, -3.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {DATA_RINGS.map((ring, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
        >
          <torusGeometry args={[ring.radius, ring.thickness, 8, 128]} />
          <meshStandardMaterial
            color={ring.color}
            emissive={ring.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}
