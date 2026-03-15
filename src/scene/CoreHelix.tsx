import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const POINTS_PER_STRAND = 60;
const HELIX_RADIUS = 0.5;
const HELIX_HEIGHT = 5; // extends from ground (y=0) up past the core (y=3)
const TURNS = 3;

export function CoreHelix() {
  const strand1Ref = useRef<THREE.Points>(null);
  const strand2Ref = useRef<THREE.Points>(null);

  const { positions1, positions2, colors } = useMemo(() => {
    const p1 = new Float32Array(POINTS_PER_STRAND * 3);
    const p2 = new Float32Array(POINTS_PER_STRAND * 3);
    const c = new Float32Array(POINTS_PER_STRAND * 3);

    for (let i = 0; i < POINTS_PER_STRAND; i++) {
      const t = i / POINTS_PER_STRAND;
      const y = t * HELIX_HEIGHT;
      const angle = t * Math.PI * 2 * TURNS;

      p1[i * 3] = Math.cos(angle) * HELIX_RADIUS;
      p1[i * 3 + 1] = y;
      p1[i * 3 + 2] = Math.sin(angle) * HELIX_RADIUS;

      // Second strand offset by PI
      p2[i * 3] = Math.cos(angle + Math.PI) * HELIX_RADIUS;
      p2[i * 3 + 1] = y;
      p2[i * 3 + 2] = Math.sin(angle + Math.PI) * HELIX_RADIUS;

      // Brighter near the core (y=3), dimmer at extremes
      const coreDist = Math.abs(y - 3) / 3;
      const brightness = Math.max(0.3, 1 - coreDist * 0.7);
      c[i * 3] = 0 * brightness;
      c[i * 3 + 1] = 0.83 * brightness;
      c[i * 3 + 2] = 1 * brightness;
    }

    return { positions1: p1, positions2: p2, colors: c };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate both strands together
    if (strand1Ref.current) {
      strand1Ref.current.rotation.y = t * 0.5;
    }
    if (strand2Ref.current) {
      strand2Ref.current.rotation.y = t * 0.5;
    }
  });

  const material = (
    <pointsMaterial
      size={0.06}
      vertexColors
      transparent
      opacity={0.6}
      sizeAttenuation
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );

  return (
    <group position={[0, 0.5, 0]}>
      <points ref={strand1Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={POINTS_PER_STRAND} array={positions1} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={POINTS_PER_STRAND} array={colors} itemSize={3} />
        </bufferGeometry>
        {material}
      </points>
      <points ref={strand2Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={POINTS_PER_STRAND} array={positions2} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={POINTS_PER_STRAND} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
