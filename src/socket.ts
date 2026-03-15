import { io, Socket } from 'socket.io-client';
import { useStore } from './store';
import { AgentState } from './types';

let socket: Socket | null = null;
let toastCounter = 0;

export function initSocket(): Socket {
  if (socket) return socket;

  socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
    useStore.getState().setConnected(true);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
    useStore.getState().setConnected(false);
  });

  socket.on('reconnect', (attempt) => {
    console.log('[Socket] Reconnected after', attempt, 'attempts');
    useStore.getState().setConnected(true);
  });

  socket.on('fleet:sync', (agents: AgentState[]) => {
    useStore.getState().setAgents(agents);
  });

  socket.on('agent:update', (agent: AgentState) => {
    useStore.getState().updateAgent(agent);
  });

  socket.on('agent:update:batch', (agents: AgentState[]) => {
    const store = useStore.getState();
    // Fire toasts for agents that just completed a task
    for (const agent of agents) {
      const prev = store.agents.get(agent.id);
      if (prev && prev.status === 'working' && agent.status === 'completed') {
        store.addToast({
          id: `toast-${++toastCounter}`,
          agentName: agent.name,
          message: `Completed: ${agent.currentTask || 'task'}`,
          color: agent.color,
          timestamp: Date.now(),
        });
        // Assets captured via agent:asset event (full output from server)
      }
    }
    store.updateAgentBatch(agents);
  });

  socket.on('agent:output', (data: { agentId: string; fullOutput: string }) => {
    useStore.getState().updateAgentOutput(data.agentId, data.fullOutput);
  });

  socket.on('audit:event', (event) => {
    useStore.getState().addAuditEvent(event);
  });

  // Nexus plan — shows which agents got assigned
  socket.on('nexus:plan', (data: { plan: string; agentCount?: number; newAgents?: number; assignments: { agentId: string; agentName: string; task: string }[] }) => {
    const store = useStore.getState();
    const countMsg = data.newAgents ? ` [${data.agentCount} agents, ${data.newAgents} newly spawned]` : ` [${data.agentCount || data.assignments.length} agents]`;
    store.setNarration(data.plan + countMsg);
    // Toast for first 10 assignments (avoid flooding)
    data.assignments.slice(0, 10).forEach((a, i) => {
      setTimeout(() => {
        const agent = useStore.getState().agents.get(a.agentId);
        useStore.getState().addToast({
          id: `nexus-${Date.now()}-${i}`,
          agentName: a.agentName,
          message: a.task.substring(0, 60),
          color: agent?.color || '#00d4ff',
          timestamp: Date.now(),
        });
      }, i * 300);
    });
    if (data.assignments.length > 10) {
      setTimeout(() => {
        useStore.getState().addToast({
          id: `nexus-more-${Date.now()}`,
          agentName: 'NEXUS',
          message: `...and ${data.assignments.length - 10} more agents deployed`,
          color: '#00d4ff',
          timestamp: Date.now(),
        });
      }, 3200);
    }
    setTimeout(() => { useStore.getState().setNarration(''); }, 8000);
  });

  // Full output asset from server when agent completes
  socket.on('agent:asset', (data: { agentId: string; agentName: string; color: string; department: string; task: string; output: string }) => {
    useStore.getState().addAsset({
      id: `asset-${Date.now()}-${data.agentId}`,
      agentId: data.agentId,
      agentName: data.agentName,
      color: data.color,
      department: data.department,
      task: data.task,
      output: data.output,
      timestamp: Date.now(),
    });
  });

  socket.on('output:feed', (feed) => {
    useStore.getState().setOutputFeed(feed);
  });

  socket.on('cost:update', (data) => {
    useStore.getState().setCost(data.totalCost, data.totalTokens);
  });

  socket.on('escalation:raised', (escalation) => {
    useStore.getState().addEscalation(escalation);
  });

  socket.on('escalation:resolved', (data) => {
    useStore.getState().resolveEscalation(data.id, data.status);
  });

  socket.on('fleet:summary', (summary) => {
    useStore.getState().setFleetSummary(summary);
  });

  socket.on('camera:mode', (mode) => {
    useStore.getState().setCameraMode(mode);
  });

  return socket;
}

export function getSocket(): Socket {
  if (!socket) return initSocket();
  return socket;
}

export function emitCommand(event: string, data?: unknown) {
  getSocket().emit(event, data);
}

export function subscribeToAgent(agentId: string) {
  getSocket().emit('inspect:subscribe', agentId);
}

export function unsubscribeFromAgent() {
  getSocket().emit('inspect:unsubscribe');
}
