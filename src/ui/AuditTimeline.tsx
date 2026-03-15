import { useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';

export function AuditTimeline() {
  const cameraMode = useStore((s) => s.cameraMode);
  const allEvents = useStore((s) => s.auditEvents);
  const events = useMemo(() => allEvents.slice(-15), [allEvents]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  // Early return AFTER all hooks
  if (cameraMode === 'fleet') return null;

  return (
    <div className="audit-timeline">
      <div className="audit-timeline-header">
        <div className="audit-timeline-title">Event Log</div>
      </div>
      <div className="audit-timeline-list" ref={scrollRef}>
        {events.map((evt) => (
          <div key={evt.id} className={`audit-entry ${evt.type.replace('_', '-')}`}>
            <span className="audit-entry-time">{new Date(evt.timestamp).toLocaleTimeString()}</span>
            <span className="audit-entry-agent">{evt.agentName}</span>
            <span className="audit-entry-message">{evt.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
