import { useStore } from '../store';

export function NarrationBar() {
  const narration = useStore((s) => s.narration);
  const autoPilot = useStore((s) => s.autoPilotActive);

  if (!autoPilot || !narration) return null;

  return (
    <div className="narration-bar">
      <div className="narration-text">{narration}</div>
    </div>
  );
}
