import { useStore } from '../store';

export function ConnectionStatus() {
  const connected = useStore((s) => s.connected);

  if (connected) return null;

  return (
    <div className="connection-lost">
      <div className="connection-lost-dot" />
      <span>RECONNECTING...</span>
    </div>
  );
}
