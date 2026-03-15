import { BaseAgent } from './base-agent.js';
import { AgentConfig } from '../types.js';

export interface SimScript {
  tasks: SimTask[];
  escalation?: { afterTask: number; reason: string; context: string };
}

export interface SimTask {
  name: string;
  output: string;
  durationMs: number;
  tokensEstimate: number;
  costEstimate: number;
}

export class SimulatedAgent extends BaseAgent {
  private script: SimScript;
  private currentTaskIndex = 0;
  private charTimer: ReturnType<typeof setTimeout> | null = null;
  private taskTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private loopStarted = false;
  private speedMultiplier = 1;
  private hasEscalated = false;

  constructor(config: AgentConfig, script: SimScript) {
    super(config);
    this.script = script;
  }

  setSpeed(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  async start(): Promise<void> {
    this.running = true;
    this.state.startedAt = Date.now();
    this.setStatus('idle');
    // Start idle — call activate() to begin working
  }

  activate() {
    if (!this.running || this.loopStarted) return;
    this.loopStarted = true;
    this.runLoop();
  }

  private async runLoop(): Promise<void> {
    while (this.running && this.currentTaskIndex < this.script.tasks.length) {
      if (this.state.status === 'paused') {
        await this.delay(500);
        continue;
      }

      const task = this.script.tasks[this.currentTaskIndex];
      this.setTask(task.name);
      this.setStatus('working');

      // Check if escalation should fire (only once per agent lifetime)
      if (this.script.escalation && this.script.escalation.afterTask === this.currentTaskIndex && !this.hasEscalated) {
        // Do partial work then escalate
        await this.typeOutput(task.output.substring(0, Math.floor(task.output.length * 0.4)), task.durationMs * 0.4);
        if (!this.running) return;
        this.hasEscalated = true;
        this.emit('escalation', {
          agentId: this.config.id,
          agentName: this.config.name,
          department: this.config.department,
          reason: this.script.escalation.reason,
          context: this.script.escalation.context,
        });
        // Wait for escalation resolution before continuing
        await this.waitForResume();
        if (!this.running) return;
        await this.typeOutput(task.output.substring(Math.floor(task.output.length * 0.4)), task.durationMs * 0.6);
      } else {
        await this.typeOutput(task.output, task.durationMs);
      }

      if (!this.running) return;

      // Update cost
      this.state.tokensUsed += task.tokensEstimate;
      this.state.costUsd += task.costEstimate;
      this.emit('cost', { agentId: this.config.id, tokens: task.tokensEstimate, cost: task.costEstimate });

      this.setStatus('completed');
      await this.delay(1500 / this.speedMultiplier);

      this.currentTaskIndex++;
      if (this.currentTaskIndex >= this.script.tasks.length) {
        this.currentTaskIndex = 0; // Loop scripts
      }

      this.setStatus('idle');
      await this.delay((2000 + Math.random() * 3000) / this.speedMultiplier);
    }
  }

  private async typeOutput(text: string, totalMs: number): Promise<void> {
    const chars = text.split('');
    const delayPerChar = (totalMs / this.speedMultiplier) / chars.length;

    for (const char of chars) {
      if (!this.running || this.state.status === 'paused') break;
      this.appendOutput(char);
      await this.delay(Math.max(delayPerChar, 8));
    }
  }

  private waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      this.setStatus('paused');
      const check = () => {
        if (this.state.status !== 'paused' || !this.running) {
          resolve();
        } else {
          setTimeout(check, 200);
        }
      };
      setTimeout(check, 200);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.taskTimer = setTimeout(resolve, ms);
    });
  }

  kill() {
    this.running = false;
    if (this.charTimer) clearTimeout(this.charTimer);
    if (this.taskTimer) clearTimeout(this.taskTimer);
    super.kill();
  }
}
