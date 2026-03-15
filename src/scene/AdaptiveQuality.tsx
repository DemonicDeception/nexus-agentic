import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Monitors FPS and lowers pixel ratio if framerate drops below threshold.
 * Ensures smooth demo regardless of GPU capability.
 * - 45+ FPS → full quality (devicePixelRatio)
 * - 30-45 FPS → reduce to 1.5
 * - <30 FPS → reduce to 1.0
 */
export function AdaptiveQuality() {
  const { gl } = useThree();
  const frames = useRef(0);
  const lastCheck = useRef(performance.now());
  const currentLevel = useRef(2); // 2=full, 1=medium, 0=low
  const maxDpr = Math.min(window.devicePixelRatio, 2);

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    const elapsed = now - lastCheck.current;

    // Check every 2 seconds
    if (elapsed < 2000) return;

    const fps = (frames.current / elapsed) * 1000;
    frames.current = 0;
    lastCheck.current = now;

    let targetLevel = 2;
    if (fps < 30) targetLevel = 0;
    else if (fps < 45) targetLevel = 1;

    if (targetLevel !== currentLevel.current) {
      currentLevel.current = targetLevel;
      const dpr = targetLevel === 2 ? maxDpr : targetLevel === 1 ? Math.min(1.5, maxDpr) : 1;
      gl.setPixelRatio(dpr);
      console.log(`[Quality] FPS: ${Math.round(fps)} → pixel ratio: ${dpr}`);
    }
  });

  return null;
}
