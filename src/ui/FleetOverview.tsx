import { useMemo } from 'react';
import { useStore } from '../store';
import { DEPARTMENT_COLORS, Department } from '../types';

const DEPT_LABELS: Record<string, string> = {
  engineering: 'ENG',
  sales: 'SALES',
  support: 'SUPPORT',
  qa: 'QA',
  devops: 'DEVOPS',
  marketing: 'MKT',
  analytics: 'DATA',
  executive: 'EXEC',
};

export function FleetOverview() {
  const cameraMode = useStore((s) => s.cameraMode);
  const agents = useStore((s) => s.agents);
  const totalCost = useStore((s) => s.totalCost);
  const totalTokens = useStore((s) => s.totalTokens);

  const deptStats = useMemo(() => {
    const stats: Record<string, { total: number; working: number; cost: number; tokens: number }> = {};
    agents.forEach((agent) => {
      if (!stats[agent.department]) {
        stats[agent.department] = { total: 0, working: 0, cost: 0, tokens: 0 };
      }
      stats[agent.department].total++;
      if (agent.status === 'working') stats[agent.department].working++;
      stats[agent.department].cost += agent.costUsd;
      stats[agent.department].tokens += agent.tokensUsed;
    });
    return stats;
  }, [agents]);

  if (cameraMode !== 'fleet') return null;

  const totalAgents = agents.size;
  let workingCount = 0;
  agents.forEach((a) => { if (a.status === 'working') workingCount++; });
  const utilization = totalAgents > 0 ? Math.round((workingCount / totalAgents) * 100) : 0;

  return (
    <div className="fleet-overview">
      <div className="fleet-overview-header">
        <div className="fleet-overview-title">FLEET OVERVIEW</div>
        <div className="fleet-overview-stats">
          <div className="fleet-overview-big-stat">
            <span className="fleet-overview-big-value">{utilization}%</span>
            <span className="fleet-overview-big-label">UTILIZATION</span>
          </div>
          <div className="fleet-overview-big-stat">
            <span className="fleet-overview-big-value">${totalCost.toFixed(2)}</span>
            <span className="fleet-overview-big-label">TOTAL COST</span>
          </div>
          <div className="fleet-overview-big-stat">
            <span className="fleet-overview-big-value">{totalTokens.toLocaleString()}</span>
            <span className="fleet-overview-big-label">TOKENS</span>
          </div>
        </div>
      </div>
      <div className="fleet-overview-grid">
        {Object.entries(deptStats).map(([dept, stats]) => {
          const color = DEPARTMENT_COLORS[dept as Department] || '#64748b';
          const activity = stats.total > 0 ? stats.working / stats.total : 0;
          return (
            <div key={dept} className="fleet-dept-card" style={{ borderColor: color }}>
              <div className="fleet-dept-bar" style={{ background: color, width: `${activity * 100}%` }} />
              <div className="fleet-dept-name" style={{ color }}>{DEPT_LABELS[dept] || dept.toUpperCase()}</div>
              <div className="fleet-dept-count">
                <span className="fleet-dept-active">{stats.working}</span>
                <span className="fleet-dept-sep">/</span>
                <span className="fleet-dept-total">{stats.total}</span>
              </div>
              <div className="fleet-dept-cost">${stats.cost.toFixed(4)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
