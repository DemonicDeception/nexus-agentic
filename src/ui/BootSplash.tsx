import { useState, useEffect } from 'react';
import { useStore } from '../store';

const BOOT_LINES = [
  'NEXUS MISSION CONTROL v2.1.0',
  'Initializing quantum mesh network...',
  'Loading agent neural cores...',
  'Establishing WebSocket telemetry link...',
  'Calibrating fleet orchestration engine...',
  'Mounting spatial command interface...',
  'System ready.',
];

export function BootSplash() {
  const [visible, setVisible] = useState(true);
  const [lines, setLines] = useState<string[]>([]);
  const [fading, setFading] = useState(false);
  const agentCount = useStore((s) => s.agents.size);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fade out once agents start appearing
    if (agentCount > 0) {
      const timer = setTimeout(() => setFading(true), 800);
      const hide = setTimeout(() => setVisible(false), 2000);
      return () => { clearTimeout(timer); clearTimeout(hide); };
    }
  }, [agentCount]);

  if (!visible) return null;

  return (
    <div className={`boot-splash ${fading ? 'fading' : ''}`}>
      <div className="boot-logo">NEXUS</div>
      <div className="boot-tagline">AGENTIC MISSION CONTROL</div>
      <div className="boot-terminal">
        {lines.map((line, i) => (
          <div key={i} className="boot-line">
            <span className="boot-prefix">&gt;</span> {line}
          </div>
        ))}
        {lines.length < BOOT_LINES.length && <span className="boot-cursor">_</span>}
      </div>
    </div>
  );
}
