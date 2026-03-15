import { useEffect, useRef } from 'react';

export function useAmbientSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      try {
        const ctx = new AudioContext();
        contextRef.current = ctx;

        // Low drone
        const drone = ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.setValueAtTime(55, ctx.currentTime);

        const droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0, ctx.currentTime);
        droneGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 3);

        // Subtle LFO modulation
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(3, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(drone.frequency);

        // Filter for warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);

        drone.connect(droneGain);
        droneGain.connect(filter);
        filter.connect(ctx.destination);

        drone.start();
        lfo.start();

        // Second harmonic
        const drone2 = ctx.createOscillator();
        drone2.type = 'sine';
        drone2.frequency.setValueAtTime(82.5, ctx.currentTime);
        const drone2Gain = ctx.createGain();
        drone2Gain.gain.setValueAtTime(0, ctx.currentTime);
        drone2Gain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 5);
        drone2.connect(drone2Gain);
        drone2Gain.connect(filter);
        drone2.start();
      } catch {
        // Audio not available
      }
    };

    // Start on first user interaction (required by browsers)
    const handler = () => {
      start();
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
      contextRef.current?.close();
    };
  }, []);
}
