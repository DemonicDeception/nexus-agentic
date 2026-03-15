import { useEffect } from 'react';
import { initSocket } from '../socket';
import { AgentInspector } from './AgentInspector';
import { useStore } from '../store';

export function InspectorScene() {
  useEffect(() => {
    initSocket();
  }, []);

  const agents = useStore((s) => s.agents);
  const selectedId = useStore((s) => s.selectedAgentId);

  if (!selectedId || !agents.get(selectedId)) {
    return (
      <div className="inspector-scene-empty">
        <p>Select an agent from the main view</p>
      </div>
    );
  }

  return <AgentInspector />;
}
