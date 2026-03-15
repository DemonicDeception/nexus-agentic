import { useState, useRef } from 'react';
import { emitCommand } from '../socket';
import { useStore } from '../store';

export function NexusPrompt() {
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const agents = useStore((s) => s.agents);

  // Check if any agent is working
  let anyWorking = false;
  agents.forEach((a) => { if (a.status === 'working') anyWorking = true; });

  const submit = () => {
    const text = prompt.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    emitCommand('nexus:prompt', text);
    setPrompt('');
    // Re-enable after a short delay
    setTimeout(() => setSubmitting(false), 2000);
  };

  return (
    <div className="nexus-prompt">
      <div className="nexus-prompt-label">NEXUS</div>
      <input
        ref={inputRef}
        className="nexus-prompt-input"
        type="text"
        placeholder="Tell Nexus what to do..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        disabled={submitting}
      />
      <button className="nexus-prompt-btn" onClick={submit} disabled={submitting || !prompt.trim()}>
        {submitting ? 'DELEGATING...' : 'DEPLOY'}
      </button>
    </div>
  );
}
