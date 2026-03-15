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

  async decompose(userPrompt: string, existingRoster: AgentConfig[], projectContext?: { agentId: string; agentName: string; task: string; outputPreview: string }[]): Promise<DecomposeResult> {
    const existingList = existingRoster.map((a) => `- ${a.id} (${a.name}): ${a.department} — ${a.role}`).join('\n');

    const contextBlock = projectContext && projectContext.length > 0
      ? `\n\nPROJECT CONTEXT — these agents have already completed work:\n${projectContext.map((c) => `- ${c.agentName} completed: "${c.task}" (${c.outputPreview})`).join('\n')}\n\nIf the user is asking to EDIT or ITERATE on existing work, assign the SAME agent that produced the original and tell them to modify their previous output. Include "EDIT:" at the start of the task so the agent knows to revise, not start from scratch.`
      : '';

    const systemPrompt = `You are NEXUS, an AI fleet orchestrator. Given a user request, decompose it into SPECIFIC, NON-OVERLAPPING tasks and assign each to the right agent.

CRITICAL RULES:
- Each agent gets a UNIQUE, CONCRETE task — NO duplicates, NO overlap
- Tasks must be DIRECTLY relevant to what the user asked for
- If the user asks for "a landing page", assign ONE engineering agent to build it — don't assign sales/support/marketing unless the user specifically asked for those
- Only assign agents whose skills MATCH the task. Don't assign a sales agent to build a website.
- Keep it focused: 2-5 agents for simple requests, more only if the user explicitly asks for multi-department work
- Task descriptions must be specific enough that the agent can produce the EXACT deliverable without guessing
- If the user is asking to modify/edit/update/change existing work, RE-ASSIGN the same agent and prefix the task with "EDIT:"
${contextBlock}

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
- Each agent's task must be a SPECIFIC, SELF-CONTAINED instruction that tells the agent EXACTLY what to produce — do NOT pass the user's original prompt to agents
- NO TWO AGENTS should have the same or overlapping tasks
- Task format: "Write a [specific deliverable] about/for [specific topic]" — not "handle the engineering part"
- Use existing agents when their role matches
- Create new agents (isNew: true) when you need more capacity
- For large-scale tasks, assign many agents — each with a UNIQUE deliverable
- Example good tasks: "Write the user authentication middleware with JWT tokens", "Create a competitive pricing table comparing us vs 3 competitors", "Write SQL queries for daily revenue dashboard"
- Example BAD tasks: "Handle engineering", "Work on the landing page project", "Support the team"`;

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
    const prompt = userPrompt.toLowerCase();
    const assignments: TaskAssignment[] = [];
    let agentCounter = 0;
    // Extract a short topic from the user prompt
    const topic = userPrompt.length > 80 ? userPrompt.substring(0, 80) + '...' : userPrompt;

    const addExisting = (id: string, task: string) => {
      const agent = roster.find((a) => a.id === id);
      if (agent) assignments.push({ agentId: id, department: agent.department, role: agent.role, task, isNew: false });
    };

    const addNew = (dept: Department, role: string, task: string) => {
      const id = `agent${++agentCounter}x${Date.now().toString(36).slice(-4)}`;
      assignments.push({ agentId: id, department: dept, role, task, isNew: true });
    };

    const wordCount = userPrompt.split(/\s+/).length;
    const isLargeRequest = wordCount > 50 || prompt.includes('full-scale') || prompt.includes('enterprise platform') || prompt.includes('launch a company') || prompt.includes('100 agents') || prompt.includes('all departments');

    if (isLargeRequest) {
      // Each agent gets a UNIQUE, STANDALONE task — never the raw user prompt
      addExisting('atlas', `Build a complete, polished landing page website for: ${topic}`);
      addExisting('nova', `Write a comprehensive integration test suite covering authentication, API endpoints, and error handling`);
      addExisting('cipher', `Write a code review checklist and security audit report covering OWASP top 10 vulnerabilities`);
      addExisting('forge', `Write a production Dockerfile, docker-compose.yml, and GitHub Actions CI/CD pipeline configuration`);
      addExisting('sage', `Write a Series A board deck document: market size, product roadmap, financial projections, and key risks`);
      addExisting('beacon', `Write a competitive analysis document comparing 4 competitors with a feature/pricing comparison table`);
      addExisting('mercury', `Write a 3-email outbound sales sequence targeting VP Engineering personas with specific subject lines and CTAs`);
      addExisting('echo', `Write template responses for the top 5 most common customer support tickets with troubleshooting steps`);
      addExisting('harbor', `Write a developer quickstart guide with API reference, code examples, and error code table`);
      addExisting('sentinel', `Write a QA test plan document with test cases, expected results, and pass/fail criteria for all major features`);
      addExisting('prism', `Write a performance benchmark report with load test results, latency measurements, and optimization recommendations`);
      addExisting('apex', `Write a Kubernetes deployment manifest with HPA auto-scaling, resource limits, and health checks`);
      addExisting('nimbus', `Write a cloud architecture document with cost estimates per service, instance sizing, and scaling strategy`);
      addExisting('pulse', `Write a product launch marketing plan: Product Hunt post, LinkedIn announcement, and press release draft`);
      addExisting('orbit', `Write SQL queries for an executive dashboard: daily revenue, conversion funnel, cohort retention, and anomaly detection`);

      // Spawn additional specialists with unique tasks
      const extraTasks: [Department, string, string][] = [
        ['engineering', 'Auth Engineer', 'Write JWT authentication middleware with token refresh, role-based access control, and session management'],
        ['engineering', 'Database Architect', 'Write database schema migrations for users, transactions, and audit logs with indexes and constraints'],
        ['engineering', 'Search Engineer', 'Write a full-text search implementation with indexing, ranking, and autocomplete functionality'],
        ['qa', 'Load Tester', 'Write load test scripts simulating 5,000 concurrent users with metrics collection and bottleneck analysis'],
        ['qa', 'Security Tester', 'Write a penetration testing report covering SQL injection, XSS, CSRF, and authentication bypass attempts'],
        ['devops', 'Monitoring Engineer', 'Write Prometheus alerting rules and Grafana dashboard JSON for API latency, error rates, and resource usage'],
        ['sales', 'Pricing Analyst', 'Write a tiered pricing model document with Starter/Growth/Enterprise plans, feature matrices, and margin analysis'],
        ['support', 'Onboarding Designer', 'Write a customer onboarding flow document with step-by-step activation guide and success milestones'],
        ['marketing', 'Content Strategist', 'Write a 90-day content calendar with blog topics, social media schedule, and SEO keyword targets'],
        ['analytics', 'Data Modeler', 'Write a financial projections model with revenue forecasts, unit economics, and scenario analysis'],
        ['executive', 'Risk Analyst', 'Write a comprehensive risk assessment document with probability/impact matrix and mitigation strategies'],
        ['executive', 'HR Planner', 'Write a hiring plan for the first 15 employees with role descriptions, salary ranges, and timeline'],
      ];

      for (const [dept, role, task] of extraTasks) {
        addNew(dept, role, task);
      }
    } else {
      // Simple request — Atlas gets the main task, others get related but DIFFERENT tasks
      addExisting('atlas', userPrompt);
      if (prompt.includes('test') || prompt.includes('qa')) addExisting('nova', `Write unit and integration tests for the implementation described above`);
      if (prompt.includes('deploy') || prompt.includes('infra')) addExisting('forge', `Write deployment configuration files (Dockerfile + CI pipeline) for production`);
      if (prompt.includes('design') || prompt.includes('logo') || prompt.includes('brand')) addExisting('pulse', `Design a brand logo as SVG with modern geometric style`);
      if (prompt.includes('document') || prompt.includes('docs')) addExisting('harbor', `Write developer documentation with setup guide, API reference, and code examples`);
      if (prompt.includes('report') || prompt.includes('deck') || prompt.includes('pitch')) addExisting('sage', `Write an executive summary document with key metrics, risks, and recommendations`);
      if (prompt.includes('dashboard') || prompt.includes('analytics')) addExisting('orbit', `Write SQL queries for a metrics dashboard with charts and KPI tracking`);
    }

    return {
      assignments,
      plan: `Deploying ${assignments.length} agents across ${new Set(assignments.map((a) => a.department)).size} departments`,
      tokens: 0,
      cost: 0,
    };
  }
}
