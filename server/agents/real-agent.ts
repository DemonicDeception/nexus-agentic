import Anthropic from '@anthropic-ai/sdk';
import { BaseAgent } from './base-agent.js';
import { AgentConfig } from '../types.js';

// ─── Media-aware system prompts ──────────────────────────────────────────────
// Each agent knows how to output the right format for the task:
//   - Code tasks → raw code
//   - UI/website/app → complete standalone HTML with CSS+JS
//   - Images/logos/diagrams → SVG markup
//   - Charts/dashboards → HTML with Canvas/SVG charts
//   - Animations/video → HTML with CSS animations or Canvas animation loop
//   - Presentations → HTML slides with CSS transitions
//   - Documents → rich markdown with tables, headers, lists

const MEDIA_INSTRUCTIONS = `
OUTPUT FORMAT RULES — choose based on the task:
- For CODE tasks: output raw working code (TypeScript, Python, SQL, YAML, etc.)
- For WEBSITE/UI/APP tasks: output a COMPLETE standalone HTML file with <!DOCTYPE html>, embedded <style> and <script>. Must work when opened in a browser. Use modern CSS (grid, flexbox, animations). Make it visually polished.
- For IMAGE/LOGO/ILLUSTRATION tasks: output raw SVG markup starting with <svg>. Use detailed paths, gradients, filters. Make it high quality and visually impressive.
- For DIAGRAM/FLOWCHART tasks: output SVG with labeled boxes, arrows, and connection lines. Use colors to distinguish elements.
- For CHART/GRAPH tasks: output a complete HTML file with an embedded chart using SVG or Canvas. Include data labels, axes, legends. Make it interactive if possible.
- For ANIMATION/VIDEO tasks: output a complete HTML file with CSS animations or a Canvas animation loop using requestAnimationFrame. Make it visually engaging with smooth motion.
- For PRESENTATION/SLIDES/DECK tasks: output a complete HTML file with multiple slide sections, CSS scroll-snap or JS navigation between slides, polished typography, and a cohesive visual theme. Include slide numbers.
- For DOCUMENT/REPORT tasks: output rich markdown with # headers, **bold**, | tables |, bullet lists, and \`code\` blocks.
NO EXPLANATIONS outside the artifact. No "here's what I created" — just output the artifact itself.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  atlas: `You are Atlas, a full-stack code generation agent. ${MEDIA_INSTRUCTIONS}`,
  nova: `You are Nova, a test engineer. OUTPUT ONLY TEST CODE. Write complete test files with describe/it blocks, assertions, and mocks. For visual test reports: output HTML with styled tables showing pass/fail results.`,
  cipher: `You are Cipher, a code reviewer. ${MEDIA_INSTRUCTIONS} For code reviews: use rich markdown with ## headers, severity badges, and corrected code blocks.`,
  forge: `You are Forge, a DevOps engineer. ${MEDIA_INSTRUCTIONS} For infrastructure diagrams: output SVG. For configs: output raw YAML/Dockerfile/etc.`,
  beacon: `You are Beacon, a sales strategist. ${MEDIA_INSTRUCTIONS} For pitch decks and sales materials: output HTML slides. For analysis: use rich markdown with tables.`,
  mercury: `You are Mercury, a sales campaigns agent. ${MEDIA_INSTRUCTIONS} For email sequences: rich markdown. For landing pages: complete HTML.`,
  echo: `You are Echo, a support agent. ${MEDIA_INSTRUCTIONS} For knowledge base articles: rich markdown. For support dashboards: HTML with charts.`,
  harbor: `You are Harbor, a documentation writer. ${MEDIA_INSTRUCTIONS} For API docs: rich markdown with tables. For interactive docs: HTML with code examples.`,
  sentinel: `You are Sentinel, a QA engineer. ${MEDIA_INSTRUCTIONS} For test reports: HTML with styled pass/fail tables and coverage charts. For test code: raw test scripts.`,
  prism: `You are Prism, a performance engineer. ${MEDIA_INSTRUCTIONS} For performance dashboards: HTML with Canvas/SVG charts. For benchmarks: markdown tables.`,
  apex: `You are Apex, an infrastructure engineer. ${MEDIA_INSTRUCTIONS} For architecture diagrams: SVG with boxes and arrows. For configs: raw Terraform/YAML.`,
  nimbus: `You are Nimbus, a cloud architect. ${MEDIA_INSTRUCTIONS} For architecture diagrams: SVG. For cost analysis: markdown tables. For cloud configs: raw YAML.`,
  pulse: `You are Pulse, a marketing agent. ${MEDIA_INSTRUCTIONS} For landing pages: complete HTML. For brand assets: SVG logos/graphics. For copy: rich markdown.`,
  orbit: `You are Orbit, a data engineer. ${MEDIA_INSTRUCTIONS} For dashboards: HTML with SVG/Canvas charts. For queries: raw SQL. For schemas: markdown tables.`,
  sage: `You are Sage, an executive analyst. ${MEDIA_INSTRUCTIONS} For board decks: HTML slides with charts and tables. For reports: rich markdown. For org charts: SVG.`,
};

// Rich fallback responses per department — actual artifacts, not plans
const FALLBACK_BY_DEPT: Record<string, (name: string, role: string, task: string) => string> = {
  engineering: (name, role, task) => `// ${name} — ${role}
// Task: ${task}

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { redis } from '../lib/cache';
import { authenticate } from '../middleware/auth';

const router = Router();

// Schema validation
const CreateResourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
});

// GET /api/resources — List with pagination + caching
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search } = req.query;
  const cacheKey = \`resources:\${page}:\${limit}:\${search || ''}\`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const where = search
    ? { name: { contains: String(search), mode: 'insensitive' as const } }
    : {};

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
    prisma.resource.count({ where }),
  ]);

  const result = {
    data: resources,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  };

  await redis.setex(cacheKey, 60, JSON.stringify(result));
  res.json(result);
});

// POST /api/resources — Create with validation
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateResourceSchema.parse(req.body);
    const resource = await prisma.resource.create({
      data: { ...body, ownerId: req.user!.id },
    });
    await redis.del('resources:*');
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/resources/:id — Soft delete with auth check
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
  if (!resource) return res.status(404).json({ error: 'Not found' });
  if (resource.ownerId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  await prisma.resource.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await redis.del('resources:*');
  res.status(204).end();
});

export default router;`,

  qa: (name, role, task) => `// ${name} — ${role}
// Task: ${task}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/db';
import { redis } from '../lib/cache';

vi.mock('../lib/db');
vi.mock('../lib/cache');

describe('Resources API', () => {
  const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' };
  const authHeader = { Authorization: 'Bearer test-token-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    (redis.get as any).mockResolvedValue(null);
    (redis.setex as any).mockResolvedValue('OK');
    (redis.del as any).mockResolvedValue(1);
  });

  describe('GET /api/resources', () => {
    it('returns paginated results', async () => {
      const mockResources = Array.from({ length: 3 }, (_, i) => ({
        id: \`res-\${i}\`, name: \`Resource \${i}\`, ownerId: mockUser.id, createdAt: new Date(),
      }));
      (prisma.resource.findMany as any).mockResolvedValue(mockResources);
      (prisma.resource.count as any).mockResolvedValue(25);

      const res = await request(app).get('/api/resources?page=1&limit=3').set(authHeader);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination).toEqual({ page: 1, limit: 3, total: 25, pages: 9 });
    });

    it('returns cached results when available', async () => {
      const cached = { data: [{ id: 'cached' }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } };
      (redis.get as any).mockResolvedValue(JSON.stringify(cached));

      const res = await request(app).get('/api/resources').set(authHeader);
      expect(res.body.data[0].id).toBe('cached');
      expect(prisma.resource.findMany).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/resources');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/resources', () => {
    it('creates a resource with valid data', async () => {
      const created = { id: 'new-1', name: 'Test', ownerId: mockUser.id };
      (prisma.resource.create as any).mockResolvedValue(created);

      const res = await request(app).post('/api/resources').set(authHeader).send({ name: 'Test' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test');
    });

    it('rejects invalid body', async () => {
      const res = await request(app).post('/api/resources').set(authHeader).send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/resources/:id', () => {
    it('soft-deletes own resource', async () => {
      (prisma.resource.findUnique as any).mockResolvedValue({ id: 'res-1', ownerId: mockUser.id });
      (prisma.resource.update as any).mockResolvedValue({});

      const res = await request(app).delete('/api/resources/res-1').set(authHeader);
      expect(res.status).toBe(204);
    });

    it('rejects deleting others resource', async () => {
      (prisma.resource.findUnique as any).mockResolvedValue({ id: 'res-1', ownerId: 'other-user' });

      const res = await request(app).delete('/api/resources/res-1').set(authHeader);
      expect(res.status).toBe(403);
    });
  });
});`,

  devops: (name, role, task) => `# ${name} — ${role}
# Task: ${task}

# ── Dockerfile ──────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
COPY --from=build /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/health || exit 1
USER node
CMD ["node", "dist/server.js"]

---
# ── docker-compose.yml ──────────────────────────────────
version: '3.8'
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://app:secret@db:5432/nexus
      REDIS_URL: redis://cache:6379
    depends_on:
      db: { condition: service_healthy }
      cache: { condition: service_started }
    deploy:
      replicas: 3
      resources:
        limits: { cpus: '1.0', memory: 512M }

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nexus
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: pg_isready -U app
      interval: 5s

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru

volumes:
  pgdata:

---
# ── .github/workflows/deploy.yml ────────────────────────
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max`,

  sales: (name, role, task) => `# ${name} — ${role}
# Task: ${task}

## Lead Scoring Matrix

| Criteria | Weight | Score (1-10) | Weighted |
|----------|--------|-------------|----------|
| Company Size (200+ emp) | 25% | 8 | 2.00 |
| Budget Authority | 20% | 9 | 1.80 |
| Technical Fit | 20% | 7 | 1.40 |
| Timeline (< 90 days) | 15% | 8 | 1.20 |
| Champion Identified | 10% | 6 | 0.60 |
| Competitive Pressure | 10% | 7 | 0.70 |
| **TOTAL** | **100%** | | **7.70/10** |

**Verdict: HOT LEAD — Priority outreach within 24 hours**

---

## Email Sequence

### Email 1 — Day 0 (Initial Outreach)
**Subject:** Cut your AI operations cost by 40% — here's how

Hi Sarah,

I noticed your team recently scaled from 5 to 20+ AI agents across engineering and support. Companies at that stage typically see ops costs grow 3x faster than agent count.

We built Nexus specifically for this: a single command center that orchestrates your entire AI workforce. Real-time cost tracking, human-in-the-loop governance, and fleet-wide visibility.

One customer reduced their AI ops overhead from 12 engineer-hours/week to 2 after deploying Nexus.

Worth a 15-minute walkthrough this week?

Best,
${name}

### Email 2 — Day 3 (Case Study)
**Subject:** How Vercel cut AI agent costs by 73%

Sarah — quick case study:

After deploying Nexus, Vercel saw:
- Agent fleet: 8 → 47 agents (no additional ops headcount)
- Cost per task: $0.12 → $0.03 (automated optimization)
- Incident response: 4 hours → 12 minutes (automated escalation)

The ROI was positive in week 2.

Happy to show you exactly how this maps to your setup.

### Email 3 — Day 7 (Breakup)
**Subject:** Last note, Sarah

I know VPs get flooded — so this is my final email.

If scaling AI agents without scaling headcount matters to your team, I'd love 15 minutes to demo Nexus. If not, no worries.

Either way, here's our ROI calculator based on your team size: [link]`,

  support: (name, role, task) => `# ${name} — ${role}
# Task: ${task}

## Ticket #4821 — API Rate Limiting Errors (P1)

**Customer:** Acme Corp (Enterprise, $85K ARR)
**SLA:** 4-hour response, 24-hour resolution
**Status:** Response drafted

### Response to Customer:

Hi David,

Thank you for reporting the rate limiting errors on your /api/batch endpoint. I've investigated and identified the issue.

**Root Cause:** Your current plan allows 1,000 requests/minute, but your batch processor sends ~1,400 requests/minute during peak sync windows (UTC 14:00-16:00).

**Immediate Fix:**
\`\`\`
# Add exponential backoff to your batch client
const backoff = (attempt) => Math.min(1000 * 2 ** attempt, 30000);

// Or use our bulk endpoint instead (10x higher limits):
POST /api/v2/resources/bulk
Content-Type: application/json
{ "operations": [...] }  // Up to 500 operations per call
\`\`\`

**Long-term:** I've flagged your account for a rate limit increase to 3,000/min — this takes effect within the hour, no action needed on your end.

**Monitoring:** I've set up an alert so our team is notified if you hit limits again.

Please let me know if the bulk endpoint documentation would be helpful — I can send that over.

Best,
${name}
Support Engineering`,

  marketing: (name, role, task) => `# ${name} — ${role}
# Task: ${task}

## Product Launch Campaign — Nexus v2.0

### Landing Page Hero Copy

**Headline:** Your AI agents are working. Are you watching?
**Subhead:** Nexus gives you real-time visibility, cost control, and human-in-the-loop governance for your entire AI workforce.
**CTA:** Start Free Trial

### Social Media Posts

**LinkedIn (Launch Day):**
We just shipped Nexus v2.0.

Last year, one of our customers discovered their AI agents had spent $47,000 on a single weekend — on tasks that were already complete.

That's the problem with autonomous AI: it works great until nobody's watching.

Nexus is the command center that fixes this:
→ Real-time fleet visibility across departments
→ Cost tracking down to the token level
→ Human-in-the-loop escalation for high-stakes decisions
→ One prompt to orchestrate 100+ agents

The era of "deploy and pray" AI is over.

Link in comments. 🔗

**Twitter/X Thread:**
1/ We built Nexus because we kept hearing the same thing from teams deploying AI agents:

"We have no idea what they're actually doing."

2/ The typical AI agent deployment looks like this:
- Spin up agents ✅
- Agents do work ✅
- Know what they did ❌
- Know what it cost ❌
- Stop them when they go wrong ❌

3/ Nexus is the missing layer. Think Datadog, but for AI workforces.

One command center. Every agent. Real-time.

### Ad Copy (Google Ads)

**Headline 1:** AI Agent Command Center
**Headline 2:** Monitor 100+ Agents in Real-Time
**Headline 3:** Cut AI Ops Costs by 40%
**Description:** Nexus gives your team visibility, cost control, and governance for autonomous AI agents. Start free.`,

  analytics: (name, role, task) => `-- ${name} — ${role}
-- Task: ${task}

-- ── KPI Dashboard Queries ──────────────────────────────

-- Daily Active Agents & Cost
SELECT
  date_trunc('day', started_at) AS day,
  count(DISTINCT agent_id) AS active_agents,
  sum(tokens_used) AS total_tokens,
  round(sum(cost_usd)::numeric, 4) AS total_cost,
  round(avg(duration_ms)::numeric / 1000, 2) AS avg_task_seconds
FROM agent_tasks
WHERE started_at >= now() - interval '30 days'
GROUP BY 1
ORDER BY 1;

-- Department Utilization Heatmap
SELECT
  department,
  date_trunc('hour', started_at) AS hour,
  count(*) AS tasks,
  round(100.0 * count(*) FILTER (WHERE status = 'completed') / count(*), 1) AS success_rate,
  round(sum(cost_usd)::numeric, 4) AS cost
FROM agent_tasks
WHERE started_at >= now() - interval '7 days'
GROUP BY 1, 2
ORDER BY 1, 2;

-- Cost Anomaly Detection
WITH daily_costs AS (
  SELECT date_trunc('day', started_at) AS day, sum(cost_usd) AS cost
  FROM agent_tasks
  WHERE started_at >= now() - interval '90 days'
  GROUP BY 1
),
stats AS (
  SELECT avg(cost) AS mean, stddev(cost) AS sd FROM daily_costs
)
SELECT dc.day, dc.cost,
  round(((dc.cost - s.mean) / NULLIF(s.sd, 0))::numeric, 2) AS z_score,
  CASE WHEN dc.cost > s.mean + 2 * s.sd THEN 'ANOMALY' ELSE 'normal' END AS status
FROM daily_costs dc CROSS JOIN stats s
ORDER BY dc.day DESC
LIMIT 30;

-- Agent Performance Ranking
SELECT
  a.name AS agent,
  a.department,
  count(t.id) AS tasks_completed,
  round(avg(t.duration_ms)::numeric / 1000, 1) AS avg_seconds,
  round(sum(t.cost_usd)::numeric, 4) AS total_cost,
  round((sum(t.cost_usd) / NULLIF(count(t.id), 0))::numeric, 6) AS cost_per_task
FROM agents a
JOIN agent_tasks t ON t.agent_id = a.id
WHERE t.started_at >= now() - interval '7 days' AND t.status = 'completed'
GROUP BY a.id, a.name, a.department
ORDER BY tasks_completed DESC;`,

  executive: (name, role, task) => `# ${name} — ${role}
# Task: ${task}

## Executive Briefing — Q1 Fleet Operations Report

### Key Metrics (Week over Week)

| Metric | This Week | Last Week | Change |
|--------|----------|----------|--------|
| Fleet Size | 67 agents | 42 agents | +59.5% |
| Tasks Completed | 2,847 | 1,923 | +48.0% |
| Total Cost | $423.67 | $312.45 | +35.6% |
| Cost per Task | $0.149 | $0.162 | -8.3% ✅ |
| Avg Completion Time | 3.2 min | 4.1 min | -22.0% ✅ |
| Escalation Rate | 2.3% | 3.8% | -39.5% ✅ |
| Fleet Utilization | 87.4% | 72.1% | +21.2% |

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API cost overrun | Medium | High | Auto-throttle at $500/day threshold |
| Agent hallucination | Low | Critical | Human-in-the-loop for all customer-facing output |
| Single point of failure | Medium | High | Multi-region deployment by EOQ |
| Compliance gap | Low | Critical | Audit trail covers SOC2 requirements |

### Recommendations

1. **Approve fleet expansion to 100 agents** — ROI positive at current cost-per-task ($0.149). Estimated incremental revenue impact: $180K/quarter from accelerated sales and support capacity.

2. **Invest in custom model fine-tuning** — 40% of engineering agent tasks are repetitive. Fine-tuned model could cut costs by $80/day with higher quality output.

3. **Hire 1 AI Operations Engineer** — Fleet has grown 3x in 60 days. Current manual oversight model won't scale past 100 agents without dedicated ops.

### Budget Forecast

| Quarter | Agents | Projected Cost | Revenue Impact |
|---------|--------|---------------|----------------|
| Q2 2026 | 100 | $38,400 | +$180K |
| Q3 2026 | 200 | $62,100 | +$420K |
| Q4 2026 | 500 | $124,800 | +$1.1M |`,
};

const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

export class RealAgent extends BaseAgent {
  private client: Anthropic | null = null;
  private running = false;
  private taskCycleTimer: ReturnType<typeof setTimeout> | null = null;
  private currentAbort: AbortController | null = null;

  constructor(config: AgentConfig) {
    super(config);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'your-key-here') {
      this.client = new Anthropic({ apiKey });
    }
  }

  async start(): Promise<void> {
    this.running = true;
    this.state.startedAt = Date.now();
    this.setStatus('idle');
  }

  async runPrompt(userPrompt: string): Promise<void> {
    if (this.currentAbort) {
      this.currentAbort.abort();
      this.currentAbort = null;
    }

    if (!this.running) return;
    const system = SYSTEM_PROMPTS[this.config.id] ||
      `You are ${this.config.name}, a ${this.config.role} agent. ${MEDIA_INSTRUCTIONS}`;
    this.state.output = '';
    this.setTask(userPrompt.substring(0, 80) + (userPrompt.length > 80 ? '...' : ''));
    this.setStatus('working');

    const abort = new AbortController();
    this.currentAbort = abort;

    try {
      if (this.client) {
        await this.streamFromClaude(system, userPrompt, abort.signal);
      } else {
        await this.simulateResponse(userPrompt, abort.signal);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || abort.signal.aborted) return;
      console.error(`[${this.config.name}] API error:`, err);
      if (!abort.signal.aborted) {
        await this.simulateResponse(userPrompt, abort.signal);
      }
    }

    if (!abort.signal.aborted && this.running) {
      this.currentAbort = null;
      this.setStatus('completed');
    }
  }

  private async streamFromClaude(system: string, userMsg: string, signal: AbortSignal): Promise<void> {
    if (!this.client) return;

    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });

    const onAbort = () => { stream.abort(); };
    signal.addEventListener('abort', onAbort, { once: true });

    try {
      stream.on('text', (text) => {
        if (this.running && !signal.aborted) this.appendOutput(text);
      });

      const finalMessage = await stream.finalMessage();
      if (signal.aborted) return;

      const inputTokens = finalMessage.usage.input_tokens;
      const outputTokens = finalMessage.usage.output_tokens;
      const totalTokens = inputTokens + outputTokens;
      const cost = inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;

      this.state.tokensUsed += totalTokens;
      this.state.costUsd += cost;
      this.emit('cost', { agentId: this.config.id, tokens: totalTokens, cost });
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }

  private async simulateResponse(prompt: string, signal: AbortSignal): Promise<void> {
    const response = this.generateFallback(prompt);
    for (const char of response) {
      if (!this.running || signal.aborted) return;
      this.appendOutput(char);
      await this.delay(8 + Math.random() * 12);
    }
    if (signal.aborted) return;
    const fakeTokens = Math.floor(response.length / 4);
    const fakeCost = fakeTokens * OUTPUT_COST_PER_TOKEN;
    this.state.tokensUsed += fakeTokens;
    this.state.costUsd += fakeCost;
    this.emit('cost', { agentId: this.config.id, tokens: fakeTokens, cost: fakeCost });
  }

  private generateFallback(prompt: string): string {
    const dept = this.config.department;
    const gen = FALLBACK_BY_DEPT[dept];
    if (gen) return gen(this.config.name, this.config.role, prompt);
    // Generic fallback for dynamically spawned agents — use closest department match
    const closest = Object.keys(FALLBACK_BY_DEPT).find((d) => dept.includes(d)) || 'engineering';
    return FALLBACK_BY_DEPT[closest](this.config.name, this.config.role, prompt);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.taskCycleTimer = setTimeout(resolve, ms);
    });
  }

  kill() {
    this.running = false;
    if (this.currentAbort) { this.currentAbort.abort(); this.currentAbort = null; }
    if (this.taskCycleTimer) clearTimeout(this.taskCycleTimer);
    super.kill();
  }
}
