import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';

const DEMO_PROMPT = `We're launching "Velocity" — a fintech API platform. Execute these tasks NOW:

ENGINEERING (Atlas): Build a complete, polished landing page for Velocity as a standalone HTML file with hero section, feature cards for Payments/KYC/Ledger, pricing table, and animated CTA button. Modern dark theme with gradients.

MARKETING (Pulse): Design the Velocity logo as raw SVG — a modern fintech brand mark using the letter V with a lightning bolt motif, gradient from cyan to purple, clean geometric style.

SALES (Beacon): Write a competitive analysis document comparing Velocity vs Stripe Connect vs Unit vs Moov. Include a feature comparison table, pricing comparison, and strategic positioning recommendations.

EXECUTIVE (Sage): Write a Series A board memo: $340B embedded finance TAM, product roadmap for 4 quarters, financial model showing path to $1M ARR, key risks, and hiring plan for first 15 hires.

ANALYTICS (Orbit): Write SQL queries for a real-time executive dashboard: daily payment volume, success rate by provider, conversion funnel from signup to first transaction, and revenue by pricing tier.

DEVOPS (Forge): Write a production Dockerfile, docker-compose.yml with PostgreSQL and Redis, and a GitHub Actions CI/CD pipeline with test, build, and deploy stages.`;

const DEMO_DISPLAY = 'Launch Velocity — landing page, logo, board memo, analytics, and infrastructure. One prompt.';

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

    // 0s — Fire prompt, let agents work uninterrupted
    narrate(DEMO_DISPLAY);
    emitCommand('nexus:prompt', DEMO_PROMPT);

    // 5s — Fleet count
    schedule(5000, () => {
      const count = store().agents.size;
      narrate(`${count} agents deployed — each with a unique deliverable`);
    });

    // 10s — Zoom Atlas
    schedule(10000, () => {
      store().selectAgent('atlas');
      narrate('Atlas — building the Velocity landing page live with Claude');
    });

    // 17s — Pull back, show fleet working
    schedule(17000, () => {
      store().selectAgent(null);
      store().setCameraMode('command');
      narrate('6 agents, 6 deliverables — code, SVG, SQL, YAML, markdown. Zero overlap.');
    });

    // 22s — Fleet view
    schedule(22000, () => {
      store().setCameraMode('fleet');
      narrate('Fleet view — real-time cost tracking across every department');
    });

    // 27s — Back to command
    schedule(27000, () => {
      store().setCameraMode('command');
      narrate('Every action audited. Every dollar counted. Every agent governed.');
    });

    // 33s — Open assets (agents have had 33s to finish)
    schedule(33000, () => {
      store().setAssetsOpen(true);
      const count = store().assets.length;
      narrate(`${count} production artifacts — click any to preview live`);
    });

    // 40s — Close
    schedule(40000, () => {
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
