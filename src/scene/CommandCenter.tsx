import { useMemo } from 'react';
import { Room } from './Room';
import { CentralCore } from './CentralCore';
import { DepartmentZone } from './DepartmentZone';
import { DataFlowParticles } from './DataFlowParticles';
import { ConnectionLines } from './ConnectionLines';
import { CollaborationArcs } from './CollaborationArcs';
import { CameraController } from './CameraController';
import { GlowEffect } from './effects/GlowEffect';
import { HoloStats } from './HoloStats';
import { CrossDeptArcs } from './CrossDeptArcs';
import { FloatingNotifications } from './FloatingNotifications';
import { TimeController } from './TimeController';
import { DepartmentBeams } from './DepartmentBeams';
import { AmbientDust } from './AmbientDust';
import { EnergyConduits } from './EnergyConduits';
import { AdaptiveQuality } from './AdaptiveQuality';
import { CoreHelix } from './CoreHelix';
import { useStore } from '../store';
import { getDepartmentPositions, Department } from '../types';

export function CommandCenter() {
  const agents = useStore((s) => s.agents);

  // Group agents by department
  const departments = useMemo(() => {
    const map = new Map<Department, string[]>();
    agents.forEach((agent, id) => {
      const dept = agent.department;
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(id);
    });
    return map;
  }, [agents]);

  // Dynamic positions based on fleet size
  const positions = useMemo(() => getDepartmentPositions(agents.size), [agents.size]);

  return (
    <>
      <AdaptiveQuality />
      <TimeController />
      <CameraController positions={positions} />
      <Room />
      <CentralCore />
      <CoreHelix />
      {Array.from(departments.entries()).map(([dept, agentIds]) => (
        <DepartmentZone
          key={dept}
          department={dept}
          position={positions[dept]}
          agentIds={agentIds}
        />
      ))}
      <DepartmentBeams positions={positions} />
      <ConnectionLines positions={positions} />
      <CollaborationArcs positions={positions} />
      <CrossDeptArcs positions={positions} />
      <HoloStats />
      <FloatingNotifications />
      <EnergyConduits positions={positions} />
      <DataFlowParticles />
      <AmbientDust />
      <GlowEffect />
    </>
  );
}
