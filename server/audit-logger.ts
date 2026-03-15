import { AuditEvent } from './types.js';

export class AuditLogger {
  private events: AuditEvent[] = [];
  private idCounter = 0;

  log(agentId: string, agentName: string, type: AuditEvent['type'], message: string, metadata?: Record<string, unknown>): AuditEvent {
    const event: AuditEvent = {
      id: `evt-${++this.idCounter}`,
      timestamp: Date.now(),
      agentId,
      agentName,
      type,
      message,
      metadata,
    };
    this.events.push(event);
    // Keep last 200 events
    if (this.events.length > 200) this.events.shift();
    return event;
  }

  getRecent(count = 50): AuditEvent[] {
    return this.events.slice(-count);
  }

  getForAgent(agentId: string, count = 20): AuditEvent[] {
    return this.events.filter(e => e.agentId === agentId).slice(-count);
  }
}
