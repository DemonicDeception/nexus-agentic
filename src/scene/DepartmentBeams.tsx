import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { Department, DEPARTMENT_COLORS } from '../types';

interface Props {
  positions: Record<Department, [number, number, number]>;
}

const beamGeo = new THREE.CylinderGeometry(0.08, 0.3, 1, 8, 1, true);

export function DepartmentBeams({ positions }: Props) {
  const agents = useStore((s) => s.agents);
  const beamRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  // Compute activity per department (0-1)
  const deptActivity = useMemo(() => {
    const activity: Record<string, { working: number; total: number }> = {};
    agents.forEach((a) => {
      if (!activity[a.department]) activity[a.department] = { working: 0, total: 0 };
      activity[a.department].total++;
      if (a.status === 'working') activity[a.department].working++;
    });
    return activity;
  }, [agents]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    for (const [dept, mesh] of beamRefs.current) {
      const info = deptActivity[dept];
      const ratio = info ? info.working / Math.max(1, info.total) : 0;

      if (ratio === 0) {
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      // Height scales with activity
      const targetHeight = 3 + ratio * 12;
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetHeight, 0.05);
      mesh.position.y = mesh.scale.y * 0.5;

      // Opacity pulses
      mat.opacity = (0.06 + ratio * 0.12) + Math.sin(t * 2 + dept.length) * 0.03;
      mat.emissiveIntensity = 0.5 + ratio * 1.5 + Math.sin(t * 3 + dept.length * 0.7) * 0.3;
    }
  });

  const depts = Object.keys(positions) as Department[];

  return (
    <group>
      {depts.map((dept) => {
        const pos = positions[dept];
        const color = DEPARTMENT_COLORS[dept];
        return (
          <mesh
            key={dept}
            ref={(el) => { if (el) beamRefs.current.set(dept, el); }}
            geometry={beamGeo}
            position={[pos[0], 0, pos[2]]}
            visible={false}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1}
              transparent
              opacity={0.1}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
