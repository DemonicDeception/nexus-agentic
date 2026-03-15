import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';

export function useVoice() {
  const setListening = useStore((s) => s.setListening);
  const setLastVoiceCommand = useStore((s) => s.setLastVoiceCommand);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    activeRef.current = false;
    setListening(false);
  }, [setListening]);

  const startListening = useCallback(() => {
    // Prevent duplicate instances
    if (activeRef.current) {
      stopListening();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Voice] Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      activeRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      activeRef.current = false;
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (e: any) => {
      console.warn('[Voice] Error:', e.error);
      activeRef.current = false;
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      console.log(`[Voice] "${command}" (confidence: ${(confidence * 100).toFixed(0)}%)`);
      setLastVoiceCommand(command);

      const cmd = command.toLowerCase();
      const store = useStore.getState();

      // Camera commands — handled client-side for speed
      if (cmd.includes('show fleet') || cmd.includes('fleet view')) {
        store.setCameraMode('fleet');
      } else if (cmd.includes('command view') || cmd.includes('go back')) {
        store.setCameraMode('command');
      }
      // Escalation commands
      else if (cmd.includes('approve')) {
        const esc = store.escalations.find(e => e.status === 'pending');
        if (esc) emitCommand('escalation:approve', esc.id);
      } else if (cmd.includes('deny') || cmd.includes('reject')) {
        const esc = store.escalations.find(e => e.status === 'pending');
        if (esc) emitCommand('escalation:deny', esc.id);
      }
      // Fleet commands
      else if (cmd.includes('pause all') || cmd.includes('freeze')) {
        emitCommand('voice:command', 'pause all');
      } else if (cmd.includes('resume all') || cmd.includes('unfreeze')) {
        emitCommand('voice:command', 'resume all');
      }
      // Assets
      else if (cmd.includes('show assets') || cmd.includes('open assets')) {
        store.setAssetsOpen(true);
      } else if (cmd.includes('close assets') || cmd.includes('hide assets')) {
        store.setAssetsOpen(false);
      }
      // Auto-pilot
      else if (cmd.includes('auto pilot') || cmd.includes('autopilot') || cmd.includes('start demo')) {
        // Trigger Shift+D programmatically
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', shiftKey: true }));
      }
      // Default: treat as a Nexus prompt
      else if (cmd.length > 5) {
        emitCommand('nexus:prompt', command);
      }

      setTimeout(() => setLastVoiceCommand(''), 4000);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('[Voice] Failed to start:', e);
    }
  }, [setListening, setLastVoiceCommand, stopListening]);

  // Expose globally so VoiceIndicator can call it on click
  useEffect(() => {
    (window as any).__nexusVoiceToggle = startListening;
    return () => { delete (window as any).__nexusVoiceToggle; };
  }, [startListening]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        startListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startListening]);
}
