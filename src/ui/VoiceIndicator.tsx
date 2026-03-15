import { useStore } from '../store';

export function VoiceIndicator() {
  const isListening = useStore((s) => s.isListening);
  const lastCommand = useStore((s) => s.lastVoiceCommand);

  return (
    <div className={`voice-indicator ${isListening ? 'listening' : ''}`}>
      <div className="voice-indicator-dot" />
      <span className="voice-indicator-label">{isListening ? 'LISTENING...' : 'VOICE: V'}</span>
      {lastCommand && <span className="voice-indicator-command visible">"{lastCommand}"</span>}
    </div>
  );
}
