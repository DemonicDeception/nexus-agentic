import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';

// Full detailed prompt sent to Nexus Brain — agents get specific, concrete tasks
const DEMO_PROMPT = `We're launching "Velocity" — a fintech API platform that lets startups embed payments, lending, and KYC into their apps.

ENGINEERING: Build the core REST API in TypeScript/Express with these endpoints:
- POST /api/payments/charge (Stripe integration, idempotency keys, webhook handling)
- POST /api/kyc/verify (ID document upload, liveness check, risk scoring)
- GET /api/ledger/:accountId/transactions (double-entry accounting, pagination, filters)
Add JWT auth middleware, rate limiting at 1000 req/min, and input validation with Zod schemas.

QA: Write integration tests for the payments endpoint covering: successful charge, declined card, duplicate idempotency key, webhook signature validation, and partial refund. Write load tests simulating 5000 concurrent payment requests.

DEVOPS: Create production infrastructure: multi-stage Dockerfile, Kubernetes manifests with HPA scaling at 70% CPU, Helm chart with staging/prod values, GitHub Actions CI/CD pipeline with test → build → deploy stages. Include Prometheus metrics endpoint and Grafana dashboard JSON.

SALES: Build a go-to-market strategy targeting Series A-C fintech startups. Create a lead scoring model, draft a 3-email outbound sequence to VP Engineering personas, build a competitive analysis against Stripe Connect and Unit, and design a pricing page with Starter ($299/mo), Growth ($999/mo), and Enterprise tiers.

SUPPORT: Write developer documentation for the payments API: quickstart guide with curl examples, Node.js SDK code samples, error code reference table, and a troubleshooting guide for common webhook issues. Draft template responses for the top 5 anticipated support tickets.

MARKETING: Write a Product Hunt launch post, a technical blog post titled "Why We Built Another Payments API", LinkedIn announcement copy, and a landing page with hero copy, feature grid, and social proof section. Design a launch-week content calendar.

ANALYTICS: Build SQL queries for a real-time executive dashboard: daily payment volume and GMV, conversion funnel from signup to first transaction, cohort retention analysis, and revenue by pricing tier. Include anomaly detection for failed payment spikes.

EXECUTIVE: Prepare a Series A board deck outline: market size ($340B embedded finance TAM), product roadmap for next 4 quarters, financial model showing path to $1M ARR in 12 months, key risks (regulatory, fraud, concentration), and hiring plan for first 15 hires across eng/sales/compliance.`;

// Short version shown in the narration bar
const DEMO_DISPLAY = 'Launch Velocity — a fintech API for payments, lending, and KYC. Build the product, test it, deploy it, sell it, and prepare for Series A.';

export function useAutoPilot() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const running = useRef(false);

  const stop = useCallback(() => {
    running.current = false;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const s = useStore.getState();
    s.setAutoPilotActive(false);
    s.setNarration('');
  }, []);

  const start = useCallback(() => {
    if (running.current) { stop(); return; }
    running.current = true;
    useStore.getState().setAutoPilotActive(true);

    const schedule = (ms: number, fn: () => void) => {
      timers.current.push(setTimeout(() => { if (running.current) fn(); }, ms));
    };
    const store = () => useStore.getState();
    const narrate = (text: string) => store().setNarration(text);

    // 0s — Fire the prompt
    narrate(DEMO_DISPLAY);
    emitCommand('nexus:prompt', DEMO_PROMPT);

    // 5s — Fleet is scaling
    schedule(5000, () => {
      const count = store().agents.size;
      narrate(`${count} agents deployed across 8 departments — from a single prompt`);
    });

    // 9s — Zoom into Atlas streaming live code
    schedule(9000, () => {
      store().selectAgent('atlas');
      narrate('Atlas — writing the payments API with Stripe integration, live');
    });

    // 15s — Pull back
    schedule(15000, () => {
      store().selectAgent(null);
      store().setCameraMode('command');
      narrate('Every agent tracked. Every dollar counted. Every line of code audited.');
    });

    // 20s — Escalation
    schedule(20000, () => {
      emitCommand('demo:force-escalation');
      narrate('Human-in-the-loop — agent needs approval to proceed');
    });

    // 25s — Approve
    schedule(25000, () => {
      const esc = store().escalations.find(e => e.status === 'pending');
      if (esc) emitCommand('escalation:approve', esc.id);
      narrate('Approved. Agent resumes. Full audit trail.');
    });

    // 29s — Fleet view
    schedule(29000, () => {
      store().setCameraMode('fleet');
      const count = store().agents.size;
      narrate(`${count} agents. 8 departments. One command center.`);
    });

    // 35s — Redirect
    schedule(35000, () => {
      store().setCameraMode('command');
      narrate('Priorities shift? One prompt redirects the entire fleet.');
      emitCommand('nexus:prompt', 'URGENT: PCI compliance audit flagged our payment tokenization. Redirect engineering to fix the encryption layer, QA to run the compliance test suite, DevOps to rotate all API keys, and legal to draft the incident disclosure.');
    });

    // 40s — Close
    schedule(40000, () => {
      narrate('Nexus — the operating system for your AI workforce.');
    });

    schedule(45000, () => stop());
  }, [stop]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.shiftKey && e.key === 'D') start();
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); stop(); };
  }, [start, stop]);
}
