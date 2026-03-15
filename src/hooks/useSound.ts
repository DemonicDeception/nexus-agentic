import { useEffect, useRef } from 'react';
import { useStore } from '../store';

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playEscalationAlert() {
  playTone(880, 0.15, 'square', 0.06);
  setTimeout(() => playTone(660, 0.15, 'square', 0.06), 180);
  setTimeout(() => playTone(880, 0.25, 'square', 0.08), 360);
}

export function playAgentOnline() {
  playTone(523, 0.08, 'sine', 0.04);
  setTimeout(() => playTone(659, 0.08, 'sine', 0.04), 100);
  setTimeout(() => playTone(784, 0.12, 'sine', 0.05), 200);
}

export function playApprove() {
  playTone(523, 0.1, 'sine', 0.05);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.06), 120);
}

export function playDeny() {
  playTone(330, 0.15, 'sawtooth', 0.04);
  setTimeout(() => playTone(220, 0.2, 'sawtooth', 0.04), 150);
}

export function useSound() {
  const escalations = useStore((s) => s.escalations);
  const agents = useStore((s) => s.agents);
  const prevEscCount = useRef(0);
  const prevAgentCount = useRef(0);

  // Escalation alert sound
  useEffect(() => {
    const pendingCount = escalations.filter((e) => e.status === 'pending').length;
    if (pendingCount > prevEscCount.current) {
      playEscalationAlert();
    }
    prevEscCount.current = pendingCount;
  }, [escalations]);

  // Agent online chime
  useEffect(() => {
    const count = agents.size;
    if (count > prevAgentCount.current && prevAgentCount.current > 0) {
      playAgentOnline();
    }
    prevAgentCount.current = count;
  }, [agents.size]);
}
