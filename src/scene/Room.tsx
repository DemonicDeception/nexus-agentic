import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

// Color stops: 0% util → deep blue, 50% → purple, 100% → red-violet
const COLOR_IDLE = new THREE.Color('#030712');
const COLOR_MID = new THREE.Color('#0a0520');
const COLOR_HOT = new THREE.Color('#120318');
const FOG_IDLE = new THREE.Color('#030712');
const FOG_HOT = new THREE.Color('#0d0316');

export function Room() {
  const agents = useStore((s) => s.agents);
  const skyRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const currentUtil = useRef(0);

  useFrame(() => {
    let working = 0;
    let total = 0;
    agents.forEach((a) => {
      total++;
      if (a.status === 'working') working++;
    });
    const targetUtil = total > 0 ? working / total : 0;
    // Smooth lerp so the color shift feels alive
    currentUtil.current += (targetUtil - currentUtil.current) * 0.02;
    const u = currentUtil.current;

    if (skyRef.current) {
      const mat = skyRef.current.material as THREE.MeshBasicMaterial;
      // Blend idle→mid→hot
      if (u < 0.5) {
        mat.color.copy(COLOR_IDLE).lerp(COLOR_MID, u * 2);
      } else {
        mat.color.copy(COLOR_MID).lerp(COLOR_HOT, (u - 0.5) * 2);
      }
    }

    if (fogRef.current) {
      fogRef.current.color.copy(FOG_IDLE).lerp(FOG_HOT, u);
    }

    if (ambientRef.current) {
      // Ambient shifts from cool blue to warm purple as utilization climbs
      ambientRef.current.color.setHSL(0.6 - u * 0.15, 0.8, 0.4 + u * 0.1);
      ambientRef.current.intensity = 0.15 + u * 0.08;
    }
  });

  return (
    <>
      {/* Dynamic sky sphere */}
      <mesh ref={skyRef} scale={[-300, 300, 300]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#030712" side={THREE.BackSide} />
      </mesh>

      {/* Lighting */}
      <ambientLight ref={ambientRef} intensity={0.15} color="#4a9eff" />
      <pointLight position={[0, 15, 0]} intensity={0.8} color="#00d4ff" distance={80} />
      <pointLight position={[20, 8, -20]} intensity={0.3} color="#7c3aed" distance={50} />
      <pointLight position={[-20, 8, 20]} intensity={0.3} color="#ff6b35" distance={50} />

      {/* Fog */}
      <fog ref={fogRef} attach="fog" args={['#030712', 40, 150]} />

      {/* Grid floor */}
      <Grid
        args={[200, 200]}
        cellSize={2}
        cellThickness={0.3}
        cellColor="#1a2744"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#0f4c81"
        fadeDistance={120}
        fadeStrength={1.5}
        position={[0, -0.01, 0]}
        infiniteGrid
      />

      {/* Stars */}
      <Stars radius={200} depth={80} count={3000} factor={4} saturation={0.5} fade speed={0.5} />
    </>
  );
}
