import { useMemo, useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { emitCommand, subscribeToAgent, unsubscribeFromAgent } from '../socket';

export function AgentInspector() {
  const selectedId = useStore((s) => s.selectedAgentId);
  const agent = useStore((s) => (selectedId ? s.agents.get(selectedId) : undefined));
  const selectAgent = useStore((s) => s.selectAgent);
  const allAuditEvents = useStore((s) => s.auditEvents);
  const auditEvents = useMemo(() => allAuditEvents.filter((e) => e.agentId === selectedId).slice(-10), [allAuditEvents, selectedId]);
  const [promptText, setPromptText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedId) {
      subscribeToAgent(selectedId);
      return () => unsubscribeFromAgent();
    }
  }, [selectedId]);

  if (!agent) return null;

  const sendPrompt = () => {
    const text = promptText.trim();
    if (!text || !agent.isReal) return;
    emitCommand('agent:prompt', { agentId: agent.id, prompt: text });
    setPromptText('');
  };

  return (
    <div className="inspector">
      <div className="inspector-header">
        <div>
          <div className="inspector-agent-name">{agent.name}</div>
          <div className="inspector-agent-role">{agent.role}</div>
        </div>
        <button className="inspector-close" onClick={() => selectAgent(null)}>x</button>
      </div>

      <div className="inspector-section">
        <div className="inspector-meta">
          <div className="inspector-badge" style={{ borderColor: agent.color, color: agent.color }}>{agent.department.toUpperCase()}</div>
          <div className={`inspector-badge ${agent.status}`}>
            <span className={`inspector-badge-dot status-dot ${agent.status}`} />
            {agent.status.toUpperCase()}
          </div>
          {agent.isReal && <div className="inspector-badge" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>LIVE AI</div>}
        </div>
      </div>

      {/* Prompt input — only for real (Claude API) agents */}
      {agent.isReal && (
        <div className="inspector-section">
          <div className="inspector-section-title">Send Prompt</div>
          <div className="inspector-prompt-row">
            <input
              ref={inputRef}
              className="inspector-prompt-input"
              type="text"
              placeholder="Type a prompt for this agent..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendPrompt(); }}
              disabled={agent.status === 'working'}
            />
            <button
              className="btn btn-primary"
              onClick={sendPrompt}
              disabled={agent.status === 'working' || !promptText.trim()}
            >
              Run
            </button>
          </div>
        </div>
      )}

      <div className="inspector-section">
        <div className="inspector-section-title">Current Task</div>
        <div className="inspector-task">{agent.currentTask || 'Idle — send a prompt above'}</div>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">Output</div>
        <div className="inspector-output">
          <pre>{agent.output || 'Waiting for output...'}</pre>
        </div>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">Metrics</div>
        <div className="inspector-metrics">
          <div className="inspector-metric">
            <span className="inspector-metric-value">{agent.tokensUsed.toLocaleString()}</span>
            <span className="inspector-metric-label">Tokens</span>
          </div>
          <div className="inspector-metric">
            <span className="inspector-metric-value">${agent.costUsd.toFixed(4)}</span>
            <span className="inspector-metric-label">Cost</span>
          </div>
        </div>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">Activity Log</div>
        <div className="inspector-log">
          {auditEvents.map((evt) => (
            <div key={evt.id} className="inspector-log-entry">
              <span className="inspector-log-time">{new Date(evt.timestamp).toLocaleTimeString()}</span>
              <span className="inspector-log-text">{evt.message}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="inspector-actions">
        {agent.status === 'working' && (
          <button className="btn btn-warn" onClick={() => emitCommand('agent:pause', agent.id)}>Pause</button>
        )}
        {agent.status === 'paused' && (
          <button className="btn btn-primary" onClick={() => emitCommand('agent:resume', agent.id)}>Resume</button>
        )}
        <button className="btn btn-danger" onClick={() => emitCommand('agent:kill', agent.id)}>Kill</button>
      </div>
    </div>
  );
}
