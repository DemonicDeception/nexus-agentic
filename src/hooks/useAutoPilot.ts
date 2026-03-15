import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';

// Each agent gets a UNIQUE, SPECIFIC task — not the raw user prompt
const DEMO_PROMPT = `We're launching "Velocity" — a fintech API platform. Execute these tasks NOW:

ENGINEERING (Atlas): Build a complete, polished landing page for Velocity as a standalone HTML file with hero section, feature cards for Payments/KYC/Ledger, pricing table, and animated CTA button. Modern dark theme with gradients.

MARKETING (Pulse): Design the Velocity logo as raw SVG — a modern fintech brand mark using the letter V with a lightning bolt motif, gradient from cyan to purple, clean geometric style.

SALES (Beacon): Write a competitive analysis document comparing Velocity vs Stripe Connect vs Unit vs Moov. Include a feature comparison table, pricing comparison, and strategic positioning recommendations.

EXECUTIVE (Sage): Write a Series A board memo: $340B embedded finance TAM, product roadmap for 4 quarters, financial model showing path to $1M ARR, key risks, and hiring plan for first 15 hires.

ANALYTICS (Orbit): Write SQL queries for a real-time executive dashboard: daily payment volume, success rate by provider, conversion funnel from signup to first transaction, and revenue by pricing tier.

DEVOPS (Forge): Write a production Dockerfile, docker-compose.yml with PostgreSQL and Redis, and a GitHub Actions CI/CD pipeline with test, build, and deploy stages.`;

const DEMO_DISPLAY = 'Launch Velocity — landing page, logo, board memo, analytics, and infrastructure. Each agent gets a unique task.';

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
    s.setAssetsOpen(false);
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

    // 4s — Fleet scaling
    schedule(4000, () => {
      const count = store().agents.size;
      narrate(`${count} agents deployed — each with a unique task, zero overlap`);
    });

    // 8s — Zoom Atlas (landing page)
    schedule(8000, () => {
      store().selectAgent('atlas');
      narrate('Atlas — building the Velocity landing page live');
    });

    // 14s — Pull back
    schedule(14000, () => {
      store().selectAgent(null);
      store().setCameraMode('command');
      narrate('6 agents, 6 unique deliverables — code, SVG, SQL, YAML, markdown');
    });

    // 18s — Fleet view
    schedule(18000, () => {
      store().setCameraMode('fleet');
      narrate('Fleet view — every agent tracked, every dollar counted');
    });

    // 22s — Escalation
    schedule(22000, () => {
      store().setCameraMode('command');
      emitCommand('demo:force-escalation');
      narrate('Human-in-the-loop — agent needs approval before proceeding');
    });

    // 26s — Approve
    schedule(26000, () => {
      const esc = store().escalations.find(e => e.status === 'pending');
      if (esc) emitCommand('escalation:approve', esc.id);
      narrate('Approved. Full audit trail. Agent resumes.');
    });

    // 30s — Redirect
    schedule(30000, () => {
      narrate('Priorities change? One prompt redirects the fleet.');
      emitCommand('nexus:prompt', 'URGENT: PCI compliance audit flagged our payment tokenization. Atlas — write a fix for the encryption layer. Sentinel — write a PCI compliance test suite. Forge — write a script to rotate all API keys. Sage — write an incident disclosure memo for the board.');
    });

    // 36s — Open assets (agents have had 36s to generate)
    schedule(36000, () => {
      store().setAssetsOpen(true);
      const count = store().assets.length;
      narrate(`${count} production artifacts — landing pages, documents, configs, all browsable`);
    });

    // 42s — Close
    schedule(42000, () => {
      store().setAssetsOpen(false);
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
