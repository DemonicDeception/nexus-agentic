import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  color: string;
  position?: [number, number, number];
  speed?: number;
}

export function PulseRing({ color, position = [0, 0, 0], speed = 1 }: Props) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed;
      const scale = 1 + Math.sin(t) * 0.1;
      ref.current.scale.set(scale, scale, 1);
      (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.3 + Math.sin(t) * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.02, 8, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.5} />
    </mesh>
  );
}
