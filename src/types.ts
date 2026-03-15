export type AgentStatus = 'booting' | 'idle' | 'working' | 'paused' | 'error' | 'completed';
export type Department = 'engineering' | 'sales' | 'support' | 'qa' | 'devops' | 'marketing' | 'analytics' | 'executive';

export interface AgentState {
  id: string;
  name: string;
  department: Department;
  role: string;
  status: AgentStatus;
  isReal: boolean;
  color: string;
  currentTask: string;
  output: string;
  tokensUsed: number;
  costUsd: number;
  startedAt: number | null;
  lastActivity: number;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  type: 'status_change' | 'task_start' | 'task_complete' | 'output' | 'escalation' | 'error' | 'cost';
  message: string;
}

export interface Escalation {
  id: string;
  agentId: string;
  agentName: string;
  department: Department;
  reason: string;
  context: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied';
}

export interface FleetSummary {
  totalAgents: number;
  activeAgents: number;
  totalCost: number;
  totalTokens: number;
  byDepartment: Record<string, { count: number; active: number; cost: number }>;
  uptime: number;
}

export type CameraMode = 'command' | 'fleet' | 'inspection';

// Base layout angles — departments arranged in octagon around center
const DEPT_ORDER: Department[] = ['engineering', 'sales', 'support', 'qa', 'devops', 'marketing', 'analytics', 'executive'];

// Dynamic positions: call with fleet size to get spread-adjusted layout
export function getDepartmentPositions(fleetSize: number): Record<Department, [number, number, number]> {
  // Scale radius based on fleet size: 12 for 15 agents, grows with sqrt
  const radius = 12 + Math.sqrt(Math.max(0, fleetSize - 15)) * 2.0;
  const positions: Record<string, [number, number, number]> = {};
  DEPT_ORDER.forEach((dept, i) => {
    const angle = (i / DEPT_ORDER.length) * Math.PI * 2 - Math.PI / 2;
    positions[dept] = [
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
    ];
  });
  return positions as Record<Department, [number, number, number]>;
}

// Static fallback for small components that don't know fleet size
export const DEPARTMENT_POSITIONS = getDepartmentPositions(15);

export const DEPARTMENT_COLORS: Record<Department, string> = {
  engineering: '#00d4ff',
  sales: '#ff6b35',
  support: '#7c3aed',
  qa: '#10b981',
  devops: '#f59e0b',
  marketing: '#ec4899',
  analytics: '#6366f1',
  executive: '#f97316',
};
