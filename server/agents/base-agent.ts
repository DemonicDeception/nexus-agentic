import { EventEmitter } from 'events';
import { AgentConfig, AgentState, AgentStatus } from '../types.js';

export abstract class BaseAgent extends EventEmitter {
  protected state: AgentState;
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.state = {
      id: config.id,
      name: config.name,
      department: config.department,
      role: config.role,
      status: 'booting',
      isReal: config.isReal,
      color: config.color,
      currentTask: '',
      output: '',
      tokensUsed: 0,
      costUsd: 0,
      startedAt: null,
      lastActivity: Date.now(),
    };
  }

  getState(): AgentState { return { ...this.state }; }
  getId(): string { return this.config.id; }

  protected setStatus(status: AgentStatus) {
    this.state.status = status;
    this.state.lastActivity = Date.now();
    this.emit('status', this.getState());
  }

  protected appendOutput(chunk: string) {
    this.state.output += chunk;
    this.state.lastActivity = Date.now();
    this.emit('output', { agentId: this.config.id, chunk, fullOutput: this.state.output });
  }

  protected setTask(task: string) {
    this.state.currentTask = task;
    this.state.output = '';
    this.state.lastActivity = Date.now();
    this.emit('task', { agentId: this.config.id, task });
  }

  abstract start(): Promise<void>;

  pause() {
    if (this.state.status === 'working' || this.state.status === 'idle') {
      this.setStatus('paused');
    }
  }

  resume() {
    if (this.state.status === 'paused') {
      this.setStatus('idle');
    }
  }

  kill() {
    this.setStatus('idle');
    this.state.currentTask = '';
    this.state.output = '';
    this.emit('killed', this.config.id);
  }
}
