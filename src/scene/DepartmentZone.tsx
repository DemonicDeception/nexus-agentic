import { Text } from '@react-three/drei';
import { AgentWorkstation } from './AgentWorkstation';
import { StatusRing } from './StatusRing';
import { Department, DEPARTMENT_COLORS } from '../types';

interface Props {
  department: Department;
  position: [number, number, number];
  agentIds: string[];
}

// Stable hex grid — uses total count for consistent column width
function hexGrid(index: number, total: number, spacing: number): [number, number] {
  const cols = Math.max(3, Math.ceil(Math.sqrt(total) * 1.2));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const totalRows = Math.ceil(total / cols);
  const offsetX = (row % 2) * spacing * 0.5;
  const x = (col - (cols - 1) / 2) * spacing + offsetX;
  const z = (row - (totalRows - 1) / 2) * spacing * 0.866;
  return [x, z];
}

export function DepartmentZone({ department, position, agentIds }: Props) {
  const color = DEPARTMENT_COLORS[department];
  const count = agentIds.length;
  const spacing = count <= 5 ? 2.0 : count <= 15 ? 1.7 : count <= 30 ? 1.5 : 1.3;

  let maxDist = 0;
  const positions = agentIds.map((_, i) => {
    const [x, z] = hexGrid(i, count, spacing);
    const dist = Math.sqrt(x * x + z * z);
    if (dist > maxDist) maxDist = dist;
    return [x, z] as [number, number];
  });
  const zoneRadius = Math.max(2.5, maxDist + 1.2);

  return (
    <group position={position}>
      {/* Department label */}
      <Text
        position={[0, 5.5, 0]}
        fontSize={0.6}
        color={color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.2}
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {department.toUpperCase()}
      </Text>

      {/* Agent count badge */}
      <Text
        position={[0, 4.8, 0]}
        fontSize={0.22}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
        {`${count} agents`}
      </Text>

      {/* Zone floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[zoneRadius, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Status ring — orbiting segmented halo */}
      <StatusRing agentIds={agentIds} color={color} />

      {/* Agent workstations in hex grid */}
      {agentIds.map((id, i) => (
        <AgentWorkstation
          key={id}
          agentId={id}
          position={[positions[i][0], 0, positions[i][1]]}
          compact={count > 10}
        />
      ))}
    </group>
  );
}
