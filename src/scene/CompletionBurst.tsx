import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 24;

interface Props {
  color: string;
  onDone: () => void;
}

export function CompletionBurst({ color, onDone }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const time = useRef(0);
  const velocities = useRef<Float32Array | null>(null);

  // Initialize particle velocities on first render
  if (!velocities.current) {
    const v = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3;
      const upward = 1.5 + Math.random() * 2;
      const outward = 1 + Math.random() * 1.5;
      v[i * 3] = Math.cos(angle) * outward;
      v[i * 3 + 1] = upward;
      v[i * 3 + 2] = Math.sin(angle) * outward;
    }
    velocities.current = v;
  }

  useFrame((_, delta) => {
    if (!pointsRef.current || !velocities.current) return;
    time.current += delta;

    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocities.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      posArr[i * 3] += vel[i * 3] * delta;
      posArr[i * 3 + 1] += vel[i * 3 + 1] * delta;
      posArr[i * 3 + 2] += vel[i * 3 + 2] * delta;
      // Gravity
      vel[i * 3 + 1] -= delta * 3;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Fade out
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - time.current * 1.2);

    if (time.current > 1) onDone();
  });

  // Start all particles at origin
  const positions = new Float32Array(PARTICLE_COUNT * 3);

  return (
    <points ref={pointsRef} position={[0, 0.8, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.12}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
