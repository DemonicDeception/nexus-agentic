import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

export function OutputFeed() {
  const [visible, setVisible] = useState(false);
  const feed = useStore((s) => s.outputFeed);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.shiftKey && e.key === 'O') setVisible((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feed]);

  if (!visible || feed.length === 0) return null;

  return (
    <div className="output-feed">
      <div className="output-feed-header">
        <span className="output-feed-title">LIVE OUTPUT</span>
        <span className="output-feed-count">{feed.length} agents</span>
        <button className="output-feed-close" onClick={() => setVisible(false)}>x</button>
      </div>
      <div className="output-feed-scroll" ref={scrollRef}>
        {feed.slice(0, 8).map((item) => (
          <div key={item.agentId} className="output-feed-item">
            <div className="output-feed-agent">
              <span className="output-feed-dot" style={{ background: item.color }} />
              <span className="output-feed-name" style={{ color: item.color }}>{item.name}</span>
              <span className="output-feed-task">{item.task}</span>
            </div>
            <pre className="output-feed-output">{item.output}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
