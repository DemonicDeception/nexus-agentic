import Anthropic from '@anthropic-ai/sdk';
import { AgentConfig, Department } from './types.js';

const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

export interface TaskAssignment {
  agentId: string;
  department: Department;
  role: string;
  task: string;
  isNew?: boolean; // true if this agent needs to be spawned
}

export interface DecomposeResult {
  assignments: TaskAssignment[];
  plan: string;
  tokens: number;
  cost: number;
}

const DEPARTMENTS: Department[] = ['engineering', 'sales', 'support', 'qa', 'devops', 'marketing', 'analytics', 'executive'];

export class NexusBrain {
  private client: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'your-key-here') {
      this.client = new Anthropic({ apiKey });
    }
  }

  async decompose(userPrompt: string, existingRoster: AgentConfig[]): Promise<DecomposeResult> {
    const existingList = existingRoster.map((a) => `- ${a.id} (${a.name}): ${a.department} — ${a.role}`).join('\n');

    const systemPrompt = `You are NEXUS, an AI fleet orchestrator. Given a user request, decompose it into SPECIFIC, NON-OVERLAPPING tasks and assign each to the right agent.

CRITICAL RULES:
- Each agent gets a UNIQUE, CONCRETE task — NO duplicates, NO overlap
- Tasks must be DIRECTLY relevant to what the user asked for
- If the user asks for "a landing page", assign ONE engineering agent to build it — don't assign sales/support/marketing unless the user specifically asked for those
- Only assign agents whose skills MATCH the task. Don't assign a sales agent to build a website.
- Keep it focused: 2-5 agents for simple requests, more only if the user explicitly asks for multi-department work
- Task descriptions must be specific enough that the agent can produce the EXACT deliverable without guessing

Available agents:
${existingList}

You can CREATE NEW agents (isNew: true) if needed for specialized roles.

Respond in this exact JSON format (no markdown, no code fences):
{
  "plan": "Brief strategy summary",
  "assignments": [
    {
      "agentId": "existing-id-or-new-unique-id",
      "department": "engineering|sales|support|qa|devops|marketing|analytics|executive",
      "role": "Short role description",
      "task": "Specific, unique task — what EXACTLY to produce",
      "isNew": false
    }
  ]
}

Rules:
- Use existing agents when their role matches
- Create new agents (isNew: true) when you need more capacity or specialized roles
- For large-scale tasks, don't hesitate to assign 20, 50, or 100+ agents
- Each agent should have a concrete, independent sub-task
- Give new agents a unique camelCase id and a creative name in the role field
- Think about parallelism — what can run concurrently vs what has dependencies
- Be ambitious with agent count for enterprise-scale tasks`;

    if (!this.client) {
      return this.fallbackDecompose(userPrompt, existingRoster);
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const totalTokens = response.usage.input_tokens + response.usage.output_tokens;
      const cost = response.usage.input_tokens * INPUT_COST_PER_TOKEN + response.usage.output_tokens * OUTPUT_COST_PER_TOKEN;

      try {
        const parsed = JSON.parse(text);
        const assignments: TaskAssignment[] = (parsed.assignments || []).map((a: any) => ({
          agentId: a.agentId,
          department: DEPARTMENTS.includes(a.department) ? a.department : 'engineering',
          role: a.role || 'General',
          task: a.task,
          isNew: a.isNew === true || !existingRoster.find((r) => r.id === a.agentId),
        }));
        return { assignments, plan: parsed.plan || '', tokens: totalTokens, cost };
      } catch {
        console.error('[NexusBrain] Failed to parse:', text.substring(0, 200));
        return this.fallbackDecompose(userPrompt, existingRoster);
      }
    } catch (err) {
      console.error('[NexusBrain] API error:', err);
      return this.fallbackDecompose(userPrompt, existingRoster);
    }
  }

  private fallbackDecompose(userPrompt: string, roster: AgentConfig[]): DecomposeResult {
    // Generate a large-scale fallback that creates many agents
    const prompt = userPrompt.toLowerCase();
    const assignments: TaskAssignment[] = [];
    let agentCounter = 0;

    const addExisting = (id: string, task: string) => {
      const agent = roster.find((a) => a.id === id);
      if (agent) assignments.push({ agentId: id, department: agent.department, role: agent.role, task, isNew: false });
    };

    const addNew = (dept: Department, role: string, task: string) => {
      const id = `agent${++agentCounter}x${Date.now().toString(36).slice(-4)}`;
      assignments.push({ agentId: id, department: dept, role, task, isNew: true });
    };

    // Smart assignment based on what's actually asked
    addExisting('atlas', userPrompt);

    // Only scale up for explicitly large requests
    const wordCount = userPrompt.split(/\s+/).length;
    const isLargeRequest = wordCount > 50 || prompt.includes('full-scale') || prompt.includes('enterprise platform') || prompt.includes('launch a company') || prompt.includes('100 agents') || prompt.includes('all departments');

    if (isLargeRequest) {
      addExisting('nova', `Test strategy: ${userPrompt}`);
      addExisting('cipher', `Code review: ${userPrompt}`);
      addExisting('sage', `Executive oversight: ${userPrompt}`);
      addExisting('forge', `Deployment: ${userPrompt}`);
      // Spawn many agents across all departments
      const tasks: [Department, string, string][] = [
        ['engineering', 'API Design', 'Design REST API schema and endpoints'],
        ['engineering', 'Database Schema', 'Design database models and migrations'],
        ['engineering', 'Auth Module', 'Implement authentication and authorization'],
        ['engineering', 'Frontend Components', 'Build UI component library'],
        ['engineering', 'WebSocket Layer', 'Implement real-time communication'],
        ['engineering', 'Search Engine', 'Build full-text search indexing'],
        ['engineering', 'File Processing', 'Implement file upload and processing pipeline'],
        ['engineering', 'Notification Service', 'Build multi-channel notification system'],
        ['engineering', 'Cache Layer', 'Design caching strategy and implementation'],
        ['engineering', 'Rate Limiting', 'Implement API rate limiting and throttling'],
        ['qa', 'Integration Tests', 'Write integration test suite for API'],
        ['qa', 'Load Testing', 'Design load test scenarios for 10K concurrent users'],
        ['qa', 'Security Audit', 'Perform OWASP security audit'],
        ['qa', 'E2E Tests', 'Build end-to-end test automation'],
        ['qa', 'Accessibility Audit', 'Ensure WCAG 2.1 AA compliance'],
        ['devops', 'Kubernetes Setup', 'Configure K8s cluster and deployments'],
        ['devops', 'Monitoring Stack', 'Set up Prometheus, Grafana, alerting'],
        ['devops', 'CI Pipeline', 'Build multi-stage CI with caching'],
        ['devops', 'CDN Setup', 'Configure edge caching and CDN'],
        ['devops', 'Secrets Management', 'Set up Vault for secrets rotation'],
        ['devops', 'Auto-scaling', 'Configure HPA and cluster autoscaling'],
        ['devops', 'Disaster Recovery', 'Design backup and DR procedures'],
        ['sales', 'Market Analysis', 'Analyze TAM/SAM/SOM for target market'],
        ['sales', 'Pricing Strategy', 'Design tiered pricing model'],
        ['sales', 'Competitor Analysis', 'Deep-dive competitive landscape'],
        ['sales', 'Sales Playbook', 'Build enterprise sales methodology'],
        ['sales', 'Demo Script', 'Create product demo flow'],
        ['sales', 'ROI Calculator', 'Build customer ROI projection model'],
        ['support', 'Knowledge Base', 'Create comprehensive documentation'],
        ['support', 'Onboarding Flow', 'Design customer onboarding experience'],
        ['support', 'SLA Framework', 'Define support tiers and SLAs'],
        ['support', 'Chatbot Flows', 'Design automated support chatbot'],
        ['support', 'Escalation Process', 'Define escalation matrix and procedures'],
        ['marketing', 'Brand Guidelines', 'Create brand voice and visual identity'],
        ['marketing', 'Launch Campaign', 'Plan multi-channel product launch'],
        ['marketing', 'Content Calendar', 'Build 90-day content strategy'],
        ['marketing', 'SEO Strategy', 'Technical and content SEO plan'],
        ['marketing', 'Social Media', 'Design social media presence strategy'],
        ['marketing', 'PR Outreach', 'Draft press release and media list'],
        ['analytics', 'Data Pipeline', 'Design event tracking and ETL'],
        ['analytics', 'KPI Dashboard', 'Build executive metrics dashboard'],
        ['analytics', 'User Analytics', 'Implement product analytics framework'],
        ['analytics', 'Revenue Modeling', 'Build financial projections model'],
        ['analytics', 'A/B Framework', 'Design experimentation platform'],
        ['executive', 'Business Plan', 'Draft investor-ready business plan'],
        ['executive', 'Risk Assessment', 'Comprehensive risk analysis and mitigation'],
        ['executive', 'OKR Framework', 'Define company-wide OKRs for next quarter'],
        ['executive', 'Board Report', 'Prepare board meeting presentation'],
        ['executive', 'Hiring Plan', 'Design org chart and hiring roadmap'],
      ];

      for (const [dept, role, task] of tasks) {
        addNew(dept, role, `${task}: ${userPrompt}`);
      }
    } else {
      // Simple request — just Atlas (already added above) + maybe 1-2 related agents
      if (prompt.includes('test') || prompt.includes('qa')) addExisting('nova', `Write tests: ${userPrompt}`);
      if (prompt.includes('deploy') || prompt.includes('infra')) addExisting('forge', `Deploy: ${userPrompt}`);
      if (prompt.includes('design') || prompt.includes('logo') || prompt.includes('brand')) addExisting('pulse', `Design: ${userPrompt}`);
      if (prompt.includes('document') || prompt.includes('docs')) addExisting('harbor', `Document: ${userPrompt}`);
      if (prompt.includes('report') || prompt.includes('deck') || prompt.includes('pitch')) addExisting('sage', `Report: ${userPrompt}`);
      if (prompt.includes('dashboard') || prompt.includes('analytics')) addExisting('orbit', `Analytics: ${userPrompt}`);
    }

    return {
      assignments,
      plan: `Deploying ${assignments.length} agents across ${new Set(assignments.map((a) => a.department)).size} departments for: "${userPrompt}"`,
      tokens: 0,
      cost: 0,
    };
  }
}
