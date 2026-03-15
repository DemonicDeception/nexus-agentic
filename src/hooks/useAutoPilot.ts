import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';

// Focused prompt — 6 agents, visual-heavy tasks that finish in ~15s
const DEMO_PROMPT = `We're launching "Velocity" — a fintech API platform. Execute these tasks NOW:

ENGINEERING (Atlas): Build a complete, beautiful landing page for Velocity as a standalone HTML file. Include: hero section with gradient background, animated headline, 3 feature cards with icons (Payments, KYC, Ledger), pricing table with 3 tiers ($299/$999/Enterprise), and a glowing CTA button. Use modern CSS with animations. Make it visually stunning.

MARKETING (Pulse): Design the Velocity logo as an SVG — a modern fintech brand mark using the letter V with a lightning bolt motif, gradient from cyan to purple, clean geometric style. Output only the raw <svg> markup.

SALES (Beacon): Create a one-page competitive analysis document comparing Velocity vs Stripe Connect vs Unit vs Moov. Use a markdown table with features, pricing, and ratings. Include a deal scorecard for our first enterprise prospect.

EXECUTIVE (Sage): Create an HTML pitch deck for Velocity's Series A. 5 slides: Title, Problem ($340B TAM), Product (3 features), Traction (metrics table), and Ask ($8M raise). Use HTML with CSS scroll-snap slides, dark theme, large typography, and data visualizations using SVG charts.

ANALYTICS (Orbit): Build an interactive HTML dashboard showing Velocity's real-time metrics: payment volume chart (SVG bar chart), success rate gauge, revenue counter, and transaction feed. Use HTML+CSS+JS with animated counters and a live-updating feel.

DEVOPS (Forge): Create an architecture diagram as SVG showing Velocity's infrastructure: API Gateway → Load Balancer → 3 App Servers → PostgreSQL + Redis, with Stripe and KYC provider as external services. Use colored boxes and connection arrows.`;

const DEMO_DISPLAY = 'Launch Velocity — build the landing page, logo, pitch deck, dashboard, and architecture. All at once.';

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

    // 0s — Fire the prompt, agents start generating
    narrate(DEMO_DISPLAY);
    emitCommand('nexus:prompt', DEMO_PROMPT);

    // 4s — Show fleet scaling
    schedule(4000, () => {
      const count = store().agents.size;
      narrate(`${count} agents deployed — building landing page, logo, pitch deck, dashboard simultaneously`);
    });

    // 8s — Zoom into Atlas building the landing page
    schedule(8000, () => {
      store().selectAgent('atlas');
      narrate('Atlas — building a complete landing page with live code streaming');
    });

    // 14s — Pull back, show all departments working
    schedule(14000, () => {
      store().selectAgent(null);
      store().setCameraMode('command');
      narrate('6 agents. 6 departments. Real code, real designs, real documents — all from one prompt.');
    });

    // 18s — Fleet view
    schedule(18000, () => {
      store().setCameraMode('fleet');
      narrate('Fleet view — every agent tracked, every dollar counted');
    });

    // 22s — Open assets, show what was built
    schedule(22000, () => {
      store().setCameraMode('command');
      store().setAssetsOpen(true);
      narrate('Assets panel — browse everything the fleet produced');
      // Auto-select first previewable asset
      const assets = store().assets;
      if (assets.length > 0) {
        // Find an HTML/SVG asset to showcase
        const visual = assets.find(a => {
          const t = a.output.trim();
          return t.startsWith('<!DOCTYPE') || t.startsWith('<html') || t.startsWith('<svg');
        }) || assets[0];
        // Simulate clicking it by dispatching — we'll just show the panel
      }
    });

    // 26s — Narrate the assets
    schedule(26000, () => {
      const count = store().assets.length;
      narrate(`${count} production-ready artifacts — landing pages, logos, dashboards, all live-previewable`);
    });

    // 30s — Close assets, trigger escalation for drama
    schedule(30000, () => {
      store().setAssetsOpen(false);
      emitCommand('demo:force-escalation');
      narrate('Human-in-the-loop — agent needs approval before proceeding');
    });

    // 34s — Approve
    schedule(34000, () => {
      const esc = store().escalations.find(e => e.status === 'pending');
      if (esc) emitCommand('escalation:approve', esc.id);
      narrate('One click. Full audit trail. Agent resumes.');
    });

    // 38s — Redirect the fleet
    schedule(38000, () => {
      narrate('Priorities change? One prompt redirects everything.');
      emitCommand('nexus:prompt', 'PIVOT: Investor meeting moved to tomorrow. Sage — update the pitch deck with Q1 actuals. Pulse — redesign the logo in dark mode. Atlas — add a demo video section to the landing page.');
    });

    // 42s — Close
    schedule(42000, () => {
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
