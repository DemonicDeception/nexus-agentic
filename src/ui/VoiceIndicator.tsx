import { useStore } from '../store';

export function VoiceIndicator() {
  const isListening = useStore((s) => s.isListening);
  const lastCommand = useStore((s) => s.lastVoiceCommand);

  const handleClick = () => {
    const toggle = (window as any).__nexusVoiceToggle;
    if (toggle) toggle();
  };

  return (
    <div
      className={`voice-indicator ${isListening ? 'listening' : ''}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="voice-indicator-dot" />
      <span className="voice-indicator-label">{isListening ? 'LISTENING...' : 'CLICK OR PRESS V'}</span>
      {lastCommand && <span className="voice-indicator-command visible">"{lastCommand}"</span>}
    </div>
  );
}
