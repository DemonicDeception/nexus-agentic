import { useMemo } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';
import { playApprove, playDeny } from '../hooks/useSound';

export function EscalationBanner() {
  const allEscalations = useStore((s) => s.escalations);
  const esc = useMemo(() => allEscalations.find((e) => e.status === 'pending'), [allEscalations]);

  if (!esc) return null;

  const handleApprove = () => {
    playApprove();
    emitCommand('escalation:approve', esc.id);
  };

  const handleDeny = () => {
    playDeny();
    emitCommand('escalation:deny', esc.id);
  };

  return (
    <>
      <div className="overlay" />
      <div className="escalation-banner">
        <div className="escalation-banner-header">
          <span className="escalation-banner-icon">!</span>
          <span className="escalation-banner-label">ESCALATION REQUIRED</span>
        </div>
        <div className="escalation-banner-body">
          <div className="escalation-agent">{esc.agentName} — {esc.department.toUpperCase()}</div>
          <div className="escalation-reason">{esc.reason}</div>
          <div className="escalation-context">{esc.context}</div>
        </div>
        <div className="escalation-actions">
          <button className="btn btn-approve" onClick={handleApprove}>APPROVE</button>
          <button className="btn btn-deny" onClick={handleDeny}>DENY</button>
        </div>
      </div>
    </>
  );
}
