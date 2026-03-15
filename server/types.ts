export type AgentStatus = 'booting' | 'idle' | 'working' | 'paused' | 'error' | 'completed';
export type Department = 'engineering' | 'sales' | 'support' | 'qa' | 'devops' | 'marketing' | 'analytics' | 'executive';

export interface AgentConfig {
  id: string;
  name: string;
  department: Department;
  role: string;
  isReal: boolean; // true = Claude API, false = simulated
  color: string; // hex color for the department
}

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
  metadata?: Record<string, unknown>;
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
  byDepartment: Record<Department, { count: number; active: number; cost: number }>;
  uptime: number;
}
