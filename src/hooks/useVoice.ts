import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { emitCommand } from '../socket';

export function useVoice() {
  const setListening = useStore((s) => s.setListening);
  const setLastVoiceCommand = useStore((s) => s.setLastVoiceCommand);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript;
      setLastVoiceCommand(command);

      // Handle camera commands client-side for instant response
      const cmd = command.toLowerCase();
      const store = useStore.getState();
      if (cmd.includes('show fleet') || cmd.includes('fleet view') || cmd.includes('fleet')) {
        store.setCameraMode('fleet');
      } else if (cmd.includes('command') || cmd.includes('go back') || cmd.includes('back')) {
        store.setCameraMode('command');
      } else {
        // Forward other commands to server (approve, deny, pause all, etc.)
        emitCommand('voice:command', command);
      }

      setTimeout(() => setLastVoiceCommand(''), 3000);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [setListening, setLastVoiceCommand]);

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
