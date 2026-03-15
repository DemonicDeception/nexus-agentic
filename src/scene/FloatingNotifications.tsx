import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { getDepartmentPositions } from '../types';

interface Notification {
  id: number;
  agentName: string;
  task: string;
  color: string;
  position: [number, number, number];
  createdAt: number;
}

let notifCounter = 0;

function FloatingCard({ notif, onDone }: { notif: Notification; onDone: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    elapsed.current += delta;

    // Float upward
    groupRef.current.position.y += delta * 0.8;

    // Fade: appear quickly, hold, then fade out
    const t = elapsed.current;
    let opacity = 1;
    if (t < 0.3) opacity = t / 0.3; // fade in
    else if (t > 2.5) opacity = Math.max(0, 1 - (t - 2.5) / 0.5); // fade out

    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity = opacity * 0.7;
      }
    });

    // Billboard — always face camera
    groupRef.current.quaternion.copy(groupRef.current.parent!.worldToLocal(
      new THREE.Vector3()
    ).normalize().length() > 0 ? groupRef.current.quaternion : groupRef.current.quaternion);

    if (t > 3) onDone();
  });

  // Truncate task to ~30 chars
  const taskText = notif.task.length > 32 ? notif.task.slice(0, 30) + '..' : notif.task;

  return (
    <group ref={groupRef} position={notif.position}>
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.15}
        color={notif.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#000000"
      >
        {notif.agentName}
      </Text>
      <Text
        position={[0, -0.05, 0]}
        fontSize={0.09}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#000000"
      >
        {taskText}
      </Text>
    </group>
  );
}

export function FloatingNotifications() {
  const agents = useStore((s) => s.agents);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevStatuses = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const positions = getDepartmentPositions(agents.size);

    agents.forEach((agent, id) => {
      const prev = prevStatuses.current.get(id);
      if (prev === 'working' && agent.status === 'completed') {
        const deptPos = positions[agent.department];
        if (deptPos) {
          const notif: Notification = {
            id: ++notifCounter,
            agentName: agent.name,
            task: agent.currentTask || 'Task complete',
            color: agent.color,
            position: [
              deptPos[0] + (Math.random() - 0.5) * 2,
              3 + Math.random(),
              deptPos[2] + (Math.random() - 0.5) * 2,
            ],
            createdAt: Date.now(),
          };
          setNotifications((prev) => [...prev.slice(-8), notif]);
        }
      }
      prevStatuses.current.set(id, agent.status);
    });
  }, [agents]);

  const remove = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <group>
      {notifications.map((notif) => (
        <FloatingCard key={notif.id} notif={notif} onDone={() => remove(notif.id)} />
      ))}
    </group>
  );
}
