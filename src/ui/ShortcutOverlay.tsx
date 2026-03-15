import { useState, useEffect } from 'react';

const SHORTCUTS = [
  ['1', 'Command view'],
  ['2', 'Fleet view'],
  ['Esc', 'Deselect agent'],
  ['Hold V', 'Push-to-talk voice'],
  ['Shift+D', 'Auto-pilot demo (45s)'],
  ['Shift+E', 'Force escalation'],
  ['Shift+S', 'Speed up agents (3x)'],
  ['Shift+N', 'Normal speed'],
  ['Shift+O', 'Live output feed'],
  ['Shift+F', 'FPS counter'],
  ['Tab', 'This overlay'],
];

const VOICE_COMMANDS = [
  'Show fleet',
  'Go back',
  'Approve / Deny',
  'Show assets',
  'Start demo',
  'Or say anything — it becomes a Nexus prompt',
];

const NEXUS_EXAMPLES = [
  'Build a landing page for a drone company',
  'Design a logo and pitch deck for Velocity',
  'Write an API with tests and deploy configs',
  'Make the header bigger and change colors to blue',
];

export function ShortcutOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Tab') { e.preventDefault(); setVisible((v) => !v); }
      if (e.key === 'Escape' && visible) setVisible(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="shortcut-overlay" onClick={() => setVisible(false)}>
      <div className="shortcut-panel" onClick={(e) => e.stopPropagation()}>
        <div className="shortcut-columns">
          <div className="shortcut-col">
            <div className="shortcut-title">KEYBOARD</div>
            <div className="shortcut-list">
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="shortcut-row">
                  <kbd className="shortcut-key">{key}</kbd>
                  <span className="shortcut-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="shortcut-col">
            <div className="shortcut-title">VOICE COMMANDS</div>
            <div className="shortcut-list">
              {VOICE_COMMANDS.map((cmd) => (
                <div key={cmd} className="shortcut-row">
                  <span className="shortcut-desc shortcut-voice">{cmd}</span>
                </div>
              ))}
            </div>
            <div className="shortcut-title" style={{ marginTop: 16 }}>NEXUS PROMPT EXAMPLES</div>
            <div className="shortcut-list">
              {NEXUS_EXAMPLES.map((ex) => (
                <div key={ex} className="shortcut-row">
                  <span className="shortcut-desc shortcut-example">"{ex}"</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shortcut-dismiss">Press Tab or click outside to close</div>
      </div>
    </div>
  );
}
