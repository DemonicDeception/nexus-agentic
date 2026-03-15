import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A rotating radar sweep on the ground plane — thin wedge of light
const SWEEP_ANGLE = 0.15; // radians wide (~8 degrees)
const RADIUS = 40;

export function ScanLine() {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = t * 0.3; // one full rotation every ~21 seconds

    if (meshRef.current) {
      meshRef.current.rotation.y = -angle;
    }
    if (trailRef.current) {
      trailRef.current.rotation.y = -angle;
      const mat = trailRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.03 + Math.sin(t * 0.8) * 0.01;
    }
  });

  // Create a thin wedge shape for the scan line
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(0, 0);
  wedgeShape.lineTo(
    Math.cos(-SWEEP_ANGLE / 2) * RADIUS,
    Math.sin(-SWEEP_ANGLE / 2) * RADIUS
  );
  wedgeShape.lineTo(
    Math.cos(SWEEP_ANGLE / 2) * RADIUS,
    Math.sin(SWEEP_ANGLE / 2) * RADIUS
  );
  wedgeShape.closePath();

  // Wider trailing fade
  const trailShape = new THREE.Shape();
  const trailAngle = 0.5;
  trailShape.moveTo(0, 0);
  trailShape.lineTo(
    Math.cos(-trailAngle) * RADIUS,
    Math.sin(-trailAngle) * RADIUS
  );
  trailShape.lineTo(
    Math.cos(0) * RADIUS,
    Math.sin(0) * RADIUS
  );
  trailShape.closePath();

  return (
    <group position={[0, 0.05, 0]}>
      {/* Bright leading edge */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[wedgeShape]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Fading trail behind it */}
      <mesh ref={trailRef} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[trailShape]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
