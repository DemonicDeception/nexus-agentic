import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { getDepartmentPositions, DEPARTMENT_COLORS, Department } from '../types';

const MAX_PARTICLES = 200;

export function DataFlowParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const agents = useStore((s) => s.agents);

  const { positions, colors, lifetimes } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const lifetimes = new Float32Array(MAX_PARTICLES);
    // Start all particles dead — they'll spawn only when agents work
    for (let i = 0; i < MAX_PARTICLES; i++) {
      lifetimes[i] = -1; // dead
      positions[i * 3 + 1] = -100; // hide below ground
    }
    return { positions, colors, lifetimes };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colArray = pointsRef.current.geometry.attributes.color.array as Float32Array;

    const deptPositions = getDepartmentPositions(agents.size);

    // Count working agents per department for particle density
    const deptWork: { pos: [number, number, number]; count: number; color: THREE.Color }[] = [];
    const deptCounts: Record<string, number> = {};
    agents.forEach((agent) => {
      if (agent.status === 'working') {
        deptCounts[agent.department] = (deptCounts[agent.department] || 0) + 1;
      }
    });

    let totalWorking = 0;
    for (const [dept, count] of Object.entries(deptCounts)) {
      const pos = deptPositions[dept as Department];
      if (pos) {
        deptWork.push({ pos, count, color: new THREE.Color(DEPARTMENT_COLORS[dept as Department] || '#00d4ff') });
        totalWorking += count;
      }
    }

    // Active particle count proportional to working agents (0 agents = 0 particles)
    const activeCount = Math.min(MAX_PARTICLES, totalWorking * 6);
    const corePos = new THREE.Vector3(0, 3, 0);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Particles beyond activeCount stay dead
      if (i >= activeCount) {
        if (lifetimes[i] > 0) {
          // Let existing particles finish their journey, then die
          lifetimes[i] -= delta * 0.5;
          if (lifetimes[i] <= 0) {
            posArray[i * 3 + 1] = -100;
            colArray[i * 3] = 0;
            colArray[i * 3 + 1] = 0;
            colArray[i * 3 + 2] = 0;
          }
        }
        if (lifetimes[i] <= 0) continue;
      }

      lifetimes[i] -= delta * 0.2;

      if (lifetimes[i] <= 0) {
        if (deptWork.length === 0) {
          // No agents working — kill particle
          posArray[i * 3 + 1] = -100;
          colArray[i * 3] = 0;
          colArray[i * 3 + 1] = 0;
          colArray[i * 3 + 2] = 0;
          lifetimes[i] = -1;
          continue;
        }
        // Spawn weighted by department activity
        const totalWeight = deptWork.reduce((s, d) => s + d.count, 0);
        let r = Math.random() * totalWeight;
        let chosen = deptWork[0];
        for (const d of deptWork) {
          r -= d.count;
          if (r <= 0) { chosen = d; break; }
        }

        posArray[i * 3] = chosen.pos[0] + (Math.random() - 0.5) * 4;
        posArray[i * 3 + 1] = 0.5 + Math.random() * 2;
        posArray[i * 3 + 2] = chosen.pos[2] + (Math.random() - 0.5) * 4;

        // Color from department
        colArray[i * 3] = chosen.color.r;
        colArray[i * 3 + 1] = chosen.color.g;
        colArray[i * 3 + 2] = chosen.color.b;

        lifetimes[i] = 0.5 + Math.random() * 0.8;
      }

      // Move toward core
      const px = posArray[i * 3];
      const py = posArray[i * 3 + 1];
      const pz = posArray[i * 3 + 2];
      const dx = corePos.x - px;
      const dy = corePos.y - py;
      const dz = corePos.z - pz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > 0.5) {
        const speed = (3 + dist * 0.15) * delta;
        posArray[i * 3] += (dx / dist) * speed;
        posArray[i * 3 + 1] += (dy / dist) * speed;
        posArray[i * 3 + 2] += (dz / dist) * speed;
      } else {
        lifetimes[i] = 0;
      }

      // Fade with lifetime
      const alpha = Math.max(0, lifetimes[i]);
      colArray[i * 3] *= alpha;
      colArray[i * 3 + 1] *= alpha;
      colArray[i * 3 + 2] *= alpha;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={MAX_PARTICLES} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={MAX_PARTICLES} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.18} vertexColors transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}
