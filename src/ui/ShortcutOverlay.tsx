import { useState, useEffect } from 'react';

const SHORTCUTS = [
  ['1', 'Command view'],
  ['2', 'Fleet view'],
  ['Esc', 'Deselect agent'],
  ['V', 'Voice command'],
  ['Shift+D', 'Auto-pilot demo'],
  ['Shift+E', 'Force escalation'],
  ['Shift+S', 'Speed up (3x)'],
  ['Shift+N', 'Normal speed'],
  ['Shift+F', 'FPS counter'],
  ['Shift+?', 'This overlay'],
];

export function ShortcutOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.shiftKey && e.key === '?') setVisible((v) => !v);
      if (e.key === 'Escape' && visible) setVisible(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="shortcut-overlay" onClick={() => setVisible(false)}>
      <div className="shortcut-panel">
        <div className="shortcut-title">KEYBOARD SHORTCUTS</div>
        <div className="shortcut-list">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="shortcut-row">
              <kbd className="shortcut-key">{key}</kbd>
              <span className="shortcut-desc">{desc}</span>
            </div>
          ))}
        </div>
        <div className="shortcut-dismiss">Press Shift+? or click to close</div>
      </div>
    </div>
  );
}
