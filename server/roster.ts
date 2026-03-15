import { AgentConfig, Department } from './types.js';

const DEPT_COLORS: Record<string, string> = {
  engineering: '#00d4ff',
  sales: '#ff6b35',
  support: '#7c3aed',
  qa: '#10b981',
  devops: '#f59e0b',
  marketing: '#ec4899',
  analytics: '#6366f1',
  executive: '#f97316',
};

// ─── Core 15 agents (always present) ─────────────────────────────────────────
const CORE_ROSTER: AgentConfig[] = [
  // Real agents (Claude API)
  { id: 'atlas', name: 'Atlas', department: 'engineering', role: 'Code Generation', isReal: true, color: DEPT_COLORS.engineering },
  { id: 'nova', name: 'Nova', department: 'engineering', role: 'Test Writing', isReal: true, color: DEPT_COLORS.engineering },
  { id: 'cipher', name: 'Cipher', department: 'engineering', role: 'Code Review', isReal: true, color: DEPT_COLORS.engineering },
  // Simulated agents
  { id: 'forge', name: 'Forge', department: 'devops', role: 'CI/CD Pipeline', isReal: true, color: DEPT_COLORS.devops },
  { id: 'beacon', name: 'Beacon', department: 'sales', role: 'Lead Qualification', isReal: true, color: DEPT_COLORS.sales },
  { id: 'mercury', name: 'Mercury', department: 'sales', role: 'Outbound Campaigns', isReal: true, color: DEPT_COLORS.sales },
  { id: 'echo', name: 'Echo', department: 'support', role: 'Ticket Triage', isReal: true, color: DEPT_COLORS.support },
  { id: 'harbor', name: 'Harbor', department: 'support', role: 'Knowledge Base', isReal: true, color: DEPT_COLORS.support },
  { id: 'sentinel', name: 'Sentinel', department: 'qa', role: 'Regression Testing', isReal: true, color: DEPT_COLORS.qa },
  { id: 'prism', name: 'Prism', department: 'qa', role: 'Performance Audit', isReal: true, color: DEPT_COLORS.qa },
  { id: 'apex', name: 'Apex', department: 'devops', role: 'Infrastructure Monitor', isReal: true, color: DEPT_COLORS.devops },
  { id: 'nimbus', name: 'Nimbus', department: 'devops', role: 'Cloud Orchestration', isReal: true, color: DEPT_COLORS.devops },
  { id: 'pulse', name: 'Pulse', department: 'marketing', role: 'Campaign Analytics', isReal: true, color: DEPT_COLORS.marketing },
  { id: 'orbit', name: 'Orbit', department: 'analytics', role: 'Data Pipeline', isReal: true, color: DEPT_COLORS.analytics },
  { id: 'sage', name: 'Sage', department: 'executive', role: 'Executive Summary', isReal: true, color: DEPT_COLORS.executive },
];

// ─── Agent name generator for scaling ────────────────────────────────────────
const PREFIXES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
  'Vega', 'Rigel', 'Sirius', 'Altair', 'Deneb', 'Polaris', 'Castor',
  'Lyra', 'Draco', 'Orion', 'Cetus', 'Corvus', 'Hydra', 'Phoenix',
  'Astra', 'Cosmo', 'Nebula', 'Quasar', 'Pulsar', 'Zenith', 'Nadir',
  'Helix', 'Flux', 'Vertex', 'Matrix', 'Vector', 'Tensor', 'Nexus',
];

const DEPT_ROLES: Record<Department, string[]> = {
  engineering: ['Code Generation', 'Test Writing', 'Code Review', 'Refactoring', 'API Design', 'Debugging', 'Architecture'],
  sales: ['Lead Qualification', 'Outbound Campaigns', 'Deal Analysis', 'Pricing Strategy', 'Account Research', 'Proposal Draft'],
  support: ['Ticket Triage', 'Knowledge Base', 'Escalation Handler', 'SLA Monitor', 'Response Draft', 'CSAT Analysis'],
  qa: ['Regression Testing', 'Performance Audit', 'Security Scan', 'Load Testing', 'Smoke Tests', 'Coverage Analysis'],
  devops: ['CI/CD Pipeline', 'Infrastructure Monitor', 'Cloud Orchestration', 'Container Mgmt', 'Log Analysis', 'Scaling Ops'],
  marketing: ['Campaign Analytics', 'Content Pipeline', 'SEO Optimizer', 'Social Monitor', 'Ad Spend Optimizer', 'Brand Watch'],
  analytics: ['Data Pipeline', 'Anomaly Detection', 'Dashboard Gen', 'ETL Processor', 'Forecast Model', 'Report Builder'],
  executive: ['Executive Summary', 'Risk Assessment', 'OKR Tracker', 'Board Report', 'Strategy Analysis'],
};

const DEPARTMENTS: Department[] = ['engineering', 'sales', 'support', 'qa', 'devops', 'marketing', 'analytics', 'executive'];

/**
 * Generate a roster of agents. First 15 are the core named agents,
 * additional agents are procedurally generated across departments.
 */
export function generateRoster(totalAgents: number): AgentConfig[] {
  if (totalAgents <= CORE_ROSTER.length) {
    return CORE_ROSTER.slice(0, totalAgents);
  }

  const roster = [...CORE_ROSTER];
  const extraCount = totalAgents - CORE_ROSTER.length;

  for (let i = 0; i < extraCount; i++) {
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const roles = DEPT_ROLES[dept];
    const role = roles[i % roles.length];
    const nameIndex = i % PREFIXES.length;
    const suffix = i >= PREFIXES.length ? `-${Math.floor(i / PREFIXES.length) + 1}` : '';
    const name = `${PREFIXES[nameIndex]}${suffix}`;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    roster.push({
      id,
      name,
      department: dept,
      role,
      isReal: true,
      color: DEPT_COLORS[dept],
    });
  }

  return roster;
}

// Default: read NEXUS_AGENT_COUNT env var, fallback to 15
const AGENT_COUNT = parseInt(process.env.NEXUS_AGENT_COUNT || '15', 10);
export const AGENT_ROSTER = generateRoster(AGENT_COUNT);

console.log(`[Roster] Generated ${AGENT_ROSTER.length} agents across ${DEPARTMENTS.length} departments`);
