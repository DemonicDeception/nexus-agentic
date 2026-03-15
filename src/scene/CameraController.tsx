import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { Department } from '../types';

interface Props {
  positions: Record<Department, [number, number, number]>;
}

// Cinematic intro keyframes: [time(0-1), position, lookAt]
const INTRO_PATH = [
  { t: 0.0, pos: [0, 60, 50], look: [0, 0, 0] },      // Start high and far
  { t: 0.25, pos: [20, 35, 30], look: [0, 3, 0] },     // Sweep right, descending
  { t: 0.5, pos: [5, 10, 8], look: [0, 3, 0] },        // Close pass near the core
  { t: 0.75, pos: [-8, 14, 18], look: [0, 2, 0] },     // Arc left, pulling back
  { t: 1.0, pos: [0, 12, 20], look: [0, 2, 0] },       // Settle into command view
];

function lerpIntroPath(progress: number): { pos: THREE.Vector3; look: THREE.Vector3 } {
  let a = INTRO_PATH[0];
  let b = INTRO_PATH[INTRO_PATH.length - 1];

  for (let i = 0; i < INTRO_PATH.length - 1; i++) {
    if (progress >= INTRO_PATH[i].t && progress <= INTRO_PATH[i + 1].t) {
      a = INTRO_PATH[i];
      b = INTRO_PATH[i + 1];
      break;
    }
  }

  const segLen = b.t - a.t;
  const localT = segLen > 0 ? (progress - a.t) / segLen : 0;
  // Smooth ease in-out
  const eased = localT * localT * (3 - 2 * localT);

  return {
    pos: new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), eased),
    look: new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), eased),
  };
}

const INTRO_DURATION = 4; // seconds

export function CameraController({ positions }: Props) {
  const { camera } = useThree();
  const cameraMode = useStore((s) => s.cameraMode);
  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const agents = useStore((s) => s.agents);
  const controlsRef = useRef<any>(null);

  const animating = useRef(false);
  const targetPos = useRef(new THREE.Vector3(0, 12, 20));
  const targetLook = useRef(new THREE.Vector3(0, 2, 0));
  const prevMode = useRef(cameraMode);
  const prevSelected = useRef(selectedAgentId);

  // Intro state
  const introActive = useRef(true);
  const introTime = useRef(0);

  // Start camera at the intro starting position
  useEffect(() => {
    camera.position.set(0, 60, 50);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
  }, [camera]);

  let maxDist = 10;
  for (const pos of Object.values(positions)) {
    const d = Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]);
    if (d > maxDist) maxDist = d;
  }

  useEffect(() => {
    if (cameraMode !== prevMode.current || selectedAgentId !== prevSelected.current) {
      animating.current = true;
      introActive.current = false; // Cancel intro if user interacts
      prevMode.current = cameraMode;
      prevSelected.current = selectedAgentId;
    }
  }, [cameraMode, selectedAgentId]);

  useFrame((_, delta) => {
    // Cinematic intro fly-through
    if (introActive.current) {
      introTime.current += delta;
      const progress = Math.min(1, introTime.current / INTRO_DURATION);
      const { pos, look } = lerpIntroPath(progress);

      camera.position.copy(pos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(look);
      }
      camera.lookAt(look);

      if (progress >= 1) {
        introActive.current = false;
      }
      return; // Skip normal camera logic during intro
    }

    // Normal camera logic
    if (cameraMode === 'inspection' && selectedAgentId) {
      const agent = agents.get(selectedAgentId);
      if (agent) {
        const deptPos = positions[agent.department];
        targetPos.current.set(deptPos[0] + 4, 6, deptPos[2] + 6);
        targetLook.current.set(deptPos[0], 1, deptPos[2]);
      }
    } else if (cameraMode === 'fleet') {
      const h = maxDist * 1.8;
      targetPos.current.set(0, h, maxDist * 0.6);
      targetLook.current.set(0, 0, 0);
    } else {
      const h = Math.max(12, maxDist * 0.7);
      const z = Math.max(20, maxDist * 1.2);
      targetPos.current.set(0, h, z);
      targetLook.current.set(0, 2, 0);
    }

    if (animating.current) {
      camera.position.lerp(targetPos.current, 0.05);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.05);
      }
      if (camera.position.distanceTo(targetPos.current) < 0.1) {
        animating.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={3}
      maxDistance={maxDist * 4}
      maxPolarAngle={Math.PI * 0.45}
      minPolarAngle={0.1}
      enableDamping
      dampingFactor={0.08}
      screenSpacePanning={false}
      onStart={() => { animating.current = false; introActive.current = false; }}
    />
  );
}
