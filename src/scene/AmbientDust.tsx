import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 200;
const BOUNDS = 50;

export function AmbientDust() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOUNDS * 2;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS * 2;
      // Very slow drift
      speeds[i * 3] = (Math.random() - 0.5) * 0.3;
      speeds[i * 3 + 1] = (Math.random() - 0.3) * 0.1; // slight upward bias
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return { positions, speeds };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      // Drift with slight sine wobble
      arr[i * 3] += speeds[i * 3] * delta + Math.sin(t * 0.3 + i) * 0.002;
      arr[i * 3 + 1] += speeds[i * 3 + 1] * delta;
      arr[i * 3 + 2] += speeds[i * 3 + 2] * delta + Math.cos(t * 0.2 + i * 0.5) * 0.002;

      // Wrap around bounds
      if (arr[i * 3] > BOUNDS) arr[i * 3] = -BOUNDS;
      if (arr[i * 3] < -BOUNDS) arr[i * 3] = BOUNDS;
      if (arr[i * 3 + 1] > 20) arr[i * 3 + 1] = 0.5;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 19;
      if (arr[i * 3 + 2] > BOUNDS) arr[i * 3 + 2] = -BOUNDS;
      if (arr[i * 3 + 2] < -BOUNDS) arr[i * 3 + 2] = BOUNDS;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#4a6fa5"
        size={0.04}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
