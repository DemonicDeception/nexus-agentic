import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';

export function useVoice() {
  const setListening = useStore((s) => s.setListening);
  const setLastVoiceCommand = useStore((s) => s.setLastVoiceCommand);
  const recognitionRef = useRef<any>(null);

  const processCommand = useCallback((command: string) => {
    console.log(`[Voice] "${command}"`);
    setLastVoiceCommand(command);

    const cmd = command.toLowerCase();
    const store = useStore.getState();

    if (cmd.includes('show fleet') || cmd.includes('fleet view')) {
      store.setCameraMode('fleet');
    } else if (cmd.includes('command view') || cmd.includes('go back')) {
      store.setCameraMode('command');
    } else if (cmd.includes('approve')) {
      const esc = store.escalations.find(e => e.status === 'pending');
      if (esc) emitCommand('escalation:approve', esc.id);
    } else if (cmd.includes('deny') || cmd.includes('reject')) {
      const esc = store.escalations.find(e => e.status === 'pending');
      if (esc) emitCommand('escalation:deny', esc.id);
    } else if (cmd.includes('pause all') || cmd.includes('freeze')) {
      emitCommand('voice:command', 'pause all');
    } else if (cmd.includes('resume all') || cmd.includes('unfreeze')) {
      emitCommand('voice:command', 'resume all');
    } else if (cmd.includes('show assets') || cmd.includes('open assets')) {
      store.setAssetsOpen(true);
    } else if (cmd.includes('close assets') || cmd.includes('hide assets')) {
      store.setAssetsOpen(false);
    } else if (cmd.includes('auto pilot') || cmd.includes('autopilot') || cmd.includes('start demo')) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', shiftKey: true }));
    } else if (cmd.length > 5) {
      emitCommand('nexus:prompt', command);
    }

    setTimeout(() => setLastVoiceCommand(''), 4000);
  }, [setLastVoiceCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) return; // Already listening

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[Voice] Started listening');
      setListening(true);
    };
    recognition.onend = () => {
      console.log('[Voice] Stopped');
      setListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (e: any) => {
      console.warn('[Voice] Error:', e.error, e.message);
      setListening(false);
      recognitionRef.current = null;
    };
    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      // Show interim results in the UI so user sees it's working
      if (!last.isFinal) {
        setLastVoiceCommand(last[0].transcript + '...');
      } else {
        processCommand(last[0].transcript);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {}
  }, [setListening, processCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, [setListening]);

  // Expose for VoiceIndicator
  useEffect(() => {
    (window as any).__nexusVoiceStart = startListening;
    (window as any).__nexusVoiceStop = stopListening;
    return () => {
      delete (window as any).__nexusVoiceStart;
      delete (window as any).__nexusVoiceStop;
    };
  }, [startListening, stopListening]);

  // Hold V to talk
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
        const t = e.target as HTMLElement;
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
        startListening();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'v') {
        stopListening();
      }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [startListening, stopListening]);
}
