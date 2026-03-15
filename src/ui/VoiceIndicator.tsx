import { useStore } from '../store';

export function VoiceIndicator() {
  const isListening = useStore((s) => s.isListening);
  const lastCommand = useStore((s) => s.lastVoiceCommand);

  const handleDown = () => {
    const start = (window as any).__nexusVoiceStart;
    if (start) start();
  };

  const handleUp = () => {
    const stop = (window as any).__nexusVoiceStop;
    if (stop) stop();
  };

  return (
    <div
      className={`voice-indicator ${isListening ? 'listening' : ''}`}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchEnd={handleUp}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <div className="voice-indicator-dot" />
      <span className="voice-indicator-label">{isListening ? 'LISTENING...' : 'HOLD TO SPEAK'}</span>
      {lastCommand && <span className="voice-indicator-command visible">"{lastCommand}"</span>}
    </div>
  );
}
