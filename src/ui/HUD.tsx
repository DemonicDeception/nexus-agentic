import { useState, useEffect } from 'react';
import { useStore } from '../store';

function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function HUD() {
  const agents = useStore((s) => s.agents);
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const fleetSummary = useStore((s) => s.fleetSummary);
  const assetsOpen = useStore((s) => s.assetsOpen);
  const setAssetsOpen = useStore((s) => s.setAssetsOpen);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, []);

  const total = agents.size;
  let working = 0, idle = 0, booting = 0, paused = 0;
  agents.forEach((a) => {
    if (a.status === 'working') working++;
    else if (a.status === 'idle' || a.status === 'completed') idle++;
    else if (a.status === 'booting') booting++;
    else if (a.status === 'paused') paused++;
  });

  return (
    <div className="hud">
      <div className="hud-left">
        <div className="hud-title">NEXUS</div>
        <div className="hud-subtitle">MISSION CONTROL</div>
      </div>
      <div className="hud-center">
        <div className="fleet-stat">
          <span className="fleet-stat-value">{total}</span>
          <span className="fleet-stat-label">FLEET</span>
        </div>
        <div className="fleet-stat">
          <span className="fleet-stat-dot working" />
          <span className="fleet-stat-value">{working}</span>
          <span className="fleet-stat-label">ACTIVE</span>
        </div>
        <div className="fleet-stat">
          <span className="fleet-stat-dot idle" />
          <span className="fleet-stat-value">{idle}</span>
          <span className="fleet-stat-label">IDLE</span>
        </div>
        {booting > 0 && (
          <div className="fleet-stat">
            <span className="fleet-stat-dot booting" />
            <span className="fleet-stat-value">{booting}</span>
            <span className="fleet-stat-label">BOOTING</span>
          </div>
        )}
        {paused > 0 && (
          <div className="fleet-stat">
            <span className="fleet-stat-dot paused" />
            <span className="fleet-stat-value">{paused}</span>
            <span className="fleet-stat-label">PAUSED</span>
          </div>
        )}
        <div className="fleet-stat">
          <span className="fleet-stat-value" style={{ fontSize: 12, letterSpacing: '1px' }}>{formatUptime(elapsed)}</span>
          <span className="fleet-stat-label">UPTIME</span>
        </div>
      </div>
      <div className="hud-right">
        <button className={`camera-btn ${cameraMode === 'command' ? 'active' : ''}`} onClick={() => setCameraMode('command')}>CMD</button>
        <button className={`camera-btn ${cameraMode === 'fleet' ? 'active' : ''}`} onClick={() => setCameraMode('fleet')}>FLEET</button>
        <button className={`camera-btn ${assetsOpen ? 'active' : ''}`} onClick={() => setAssetsOpen(!assetsOpen)}>ASSETS</button>
      </div>
    </div>
  );
}
