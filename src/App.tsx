import { Canvas } from '@react-three/fiber';
import { createXRStore, XR } from '@react-three/xr';
import { useEffect, useCallback } from 'react';
import { CommandCenter } from './scene/CommandCenter';
import { HUD } from './ui/HUD';
import { CostTicker } from './ui/CostTicker';
import { AgentInspector } from './ui/AgentInspector';
import { AuditTimeline } from './ui/AuditTimeline';
import { EscalationBanner } from './ui/EscalationBanner';
import { VoiceIndicator } from './ui/VoiceIndicator';
import { BootSplash } from './ui/BootSplash';
import { FleetOverview } from './ui/FleetOverview';
import { Toasts } from './ui/Toasts';
import { CostSparkline } from './ui/CostSparkline';
import { ShortcutOverlay } from './ui/ShortcutOverlay';
import { FpsCounter } from './ui/FpsCounter';
import { NarrationBar } from './ui/NarrationBar';
import { ConnectionStatus } from './ui/ConnectionStatus';
import { NexusPrompt } from './ui/NexusPrompt';
import { OutputFeed } from './ui/OutputFeed';
import { AssetsPanel } from './ui/AssetsPanel';
import { initSocket } from './socket';
import { useVoice } from './hooks/useVoice';
import { useDemoControls } from './hooks/useDemoControls';
import { useSound } from './hooks/useSound';
import { useAmbientSound } from './hooks/useAmbientSound';
import { useAutoPilot } from './hooks/useAutoPilot';
import { useStore } from './store';

const xrStore = createXRStore({ foveation: 1 });

export default function App() {
  useEffect(() => {
    initSocket();
  }, []);

  useVoice();
  useDemoControls();
  useSound();
  useAmbientSound();
  useAutoPilot();

  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const autoPilotActive = useStore((s) => s.autoPilotActive);

  const handleEnterVR = useCallback(async () => {
    try {
      await xrStore.enterVR();
      return;
    } catch {
      // fallback
    }
    try {
      if (!navigator.xr) { alert('WebXR not supported — open this URL in the PICO browser'); return; }
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      if (!supported) { alert('Immersive VR not supported on this device'); return; }
      await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
    } catch (e) {
      alert('Failed to enter VR: ' + (e as Error).message);
    }
  }, []);

  return (
    <div className="app">
      <Canvas
        camera={{ position: [0, 12, 20], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#030712' }}
      >
        <XR store={xrStore}>
          <CommandCenter />
        </XR>
      </Canvas>

      <HUD />
      <NexusPrompt />
      <CostTicker />
      <CostSparkline />
      <AuditTimeline />
      <VoiceIndicator />
      <EscalationBanner />
      <FleetOverview />
      <Toasts />
      <OutputFeed />
      <AssetsPanel />
      {selectedAgentId && <AgentInspector />}

      <button className="xr-button" onClick={handleEnterVR}>
        ENTER VR
      </button>

      {autoPilotActive && <div className="autopilot-badge">AUTO-PILOT</div>}
      <NarrationBar />
      <ConnectionStatus />

      <ShortcutOverlay />
      <FpsCounter />
      <BootSplash />
    </div>
  );
}
