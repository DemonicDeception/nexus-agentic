import { create } from 'zustand';
import { AgentState, AuditEvent, Escalation, FleetSummary, CameraMode } from './types';

export interface Toast {
  id: string;
  agentName: string;
  message: string;
  color: string;
  timestamp: number;
}

interface NexusStore {
  // Agents
  agents: Map<string, AgentState>;
  setAgents: (agents: AgentState[]) => void;
  updateAgent: (agent: AgentState) => void;
  updateAgentBatch: (agents: AgentState[]) => void;
  updateAgentOutput: (agentId: string, output: string) => void;

  // Selection
  selectedAgentId: string | null;
  selectAgent: (id: string | null) => void;

  // Camera
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  // Audit
  auditEvents: AuditEvent[];
  addAuditEvent: (event: AuditEvent) => void;

  // Escalations
  escalations: Escalation[];
  addEscalation: (escalation: Escalation) => void;
  resolveEscalation: (id: string, status: 'approved' | 'denied') => void;

  // Fleet
  fleetSummary: FleetSummary | null;
  setFleetSummary: (summary: FleetSummary) => void;

  // Cost
  totalCost: number;
  totalTokens: number;
  setCost: (cost: number, tokens: number) => void;

  // Voice
  isListening: boolean;
  setListening: (v: boolean) => void;
  lastVoiceCommand: string;
  setLastVoiceCommand: (cmd: string) => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;

  // AutoPilot
  autoPilotActive: boolean;
  setAutoPilotActive: (v: boolean) => void;

  // Narration
  narration: string;
  setNarration: (text: string) => void;

  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Output feed
  outputFeed: { agentId: string; name: string; color: string; task: string; output: string }[];
  setOutputFeed: (feed: { agentId: string; name: string; color: string; task: string; output: string }[]) => void;

  // Assets
  assetsOpen: boolean;
  setAssetsOpen: (v: boolean) => void;
  assets: { id: string; agentId: string; agentName: string; color: string; department: string; task: string; output: string; timestamp: number }[];
  addAsset: (asset: { id: string; agentId: string; agentName: string; color: string; department: string; task: string; output: string; timestamp: number }) => void;
}

export const useStore = create<NexusStore>((set) => ({
  agents: new Map(),
  setAgents: (agents) =>
    set(() => {
      const map = new Map<string, AgentState>();
      agents.forEach((a) => map.set(a.id, a));
      return { agents: map };
    }),
  updateAgent: (agent) =>
    set((state) => {
      const newMap = new Map(state.agents);
      newMap.set(agent.id, agent);
      return { agents: newMap };
    }),
  // Batched update: apply many agent state changes in a single Map copy
  updateAgentBatch: (agents) =>
    set((state) => {
      const newMap = new Map(state.agents);
      for (const agent of agents) {
        // Preserve output from existing state (output comes via separate channel)
        const existing = newMap.get(agent.id);
        newMap.set(agent.id, { ...agent, output: existing?.output ?? agent.output });
      }
      return { agents: newMap };
    }),
  updateAgentOutput: (agentId, output) =>
    set((state) => {
      const existing = state.agents.get(agentId);
      if (!existing) return {};
      const newMap = new Map(state.agents);
      newMap.set(agentId, { ...existing, output });
      return { agents: newMap };
    }),

  selectedAgentId: null,
  selectAgent: (id) =>
    set((state) => ({
      selectedAgentId: id,
      cameraMode: id ? 'inspection' : state.cameraMode === 'inspection' ? 'command' : state.cameraMode,
    })),

  cameraMode: 'command',
  setCameraMode: (mode) => set((state) => ({
    cameraMode: mode,
    ...(mode !== 'inspection' ? { selectedAgentId: null } : {}),
  })),

  auditEvents: [],
  addAuditEvent: (event) =>
    set((state) => ({
      auditEvents: [...state.auditEvents.slice(-99), event],
    })),

  escalations: [],
  addEscalation: (escalation) =>
    set((state) => ({
      escalations: [...state.escalations, escalation],
    })),
  resolveEscalation: (id, status) =>
    set((state) => ({
      escalations: state.escalations.map((e) => (e.id === id ? { ...e, status } : e)),
    })),

  fleetSummary: null,
  setFleetSummary: (summary) => set({ fleetSummary: summary }),

  totalCost: 0,
  totalTokens: 0,
  setCost: (cost, tokens) => set({ totalCost: cost, totalTokens: tokens }),

  isListening: false,
  setListening: (v) => set({ isListening: v }),
  lastVoiceCommand: '',
  setLastVoiceCommand: (cmd) => set({ lastVoiceCommand: cmd }),

  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts.slice(-9), toast],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  autoPilotActive: false,
  setAutoPilotActive: (v) => set({ autoPilotActive: v }),

  narration: '',
  setNarration: (text) => set({ narration: text }),

  connected: false,
  setConnected: (v) => set({ connected: v }),

  outputFeed: [],
  setOutputFeed: (feed) => set({ outputFeed: feed }),

  assetsOpen: false,
  setAssetsOpen: (v) => set({ assetsOpen: v }),
  assets: [],
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
}));
