import { useStore } from '../store';

export function useAgentSelection() {
  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const selectAgent = useStore((s) => s.selectAgent);
  const agent = useStore((s) => (selectedAgentId ? s.agents.get(selectedAgentId) : undefined));

  return { selectedAgentId, selectAgent, agent };
}
