import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';

// Slows all useFrame animations to 0.3x during a pending escalation
export function TimeController() {
  const escalations = useStore((s) => s.escalations);
  const hasPending = useMemo(
    () => escalations.some((e) => e.status === 'pending'),
    [escalations]
  );
  const currentScale = useRef(1);

  useFrame((state, delta) => {
    const target = hasPending ? 0.3 : 1;
    currentScale.current += (target - currentScale.current) * Math.min(1, delta * 3);

    // Adjust the Three.js clock so all subsequent useFrame calls this frame
    // see a slowed delta. We do this by scaling the clock's running time.
    // The cleanest way: override the elapsedTime rate.
    // Since we can't easily modify delta for other components,
    // we scale the clock itself.
    const clockScale = currentScale.current;
    if (clockScale < 0.99) {
      // Slow down the clock by rewinding elapsed time proportionally
      const overshoot = delta * (1 - clockScale);
      state.clock.elapsedTime -= overshoot;
    }
  });

  return null;
}
