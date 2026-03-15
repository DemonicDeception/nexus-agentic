import { useEffect } from 'react';
import { emitCommand } from '../socket';
import { useStore } from '../store';

export function useDemoControls() {
  const setCameraMode = useStore((s) => s.setCameraMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Shift+A = Activate all agents (start working)
      if (e.shiftKey && e.key === 'A') {
        emitCommand('demo:activate');
      }
      // Shift+E = Force escalation
      if (e.shiftKey && e.key === 'E') {
        emitCommand('demo:force-escalation');
      }
      // Shift+S = Speed up simulations (2x)
      if (e.shiftKey && e.key === 'S') {
        emitCommand('demo:speed', 3);
      }
      // Shift+N = Normal speed
      if (e.shiftKey && e.key === 'N') {
        emitCommand('demo:speed', 1);
      }
      // 1 = Command view
      if (e.key === '1') {
        setCameraMode('command');
      }
      // 2 = Fleet view
      if (e.key === '2') {
        setCameraMode('fleet');
      }
      // Escape = Deselect
      if (e.key === 'Escape') {
        useStore.getState().selectAgent(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCameraMode]);
}
