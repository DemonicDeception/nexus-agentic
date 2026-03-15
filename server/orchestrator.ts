import { Server as SocketServer } from 'socket.io';
import { BaseAgent } from './agents/base-agent.js';
import { RealAgent } from './agents/real-agent.js';
import { CostTracker } from './cost-tracker.js';
import { AuditLogger } from './audit-logger.js';
import { NexusBrain } from './nexus-brain.js';
import { AGENT_ROSTER } from './roster.js';
import { AgentState, Escalation, FleetSummary, Department } from './types.js';

const OUTPUT_FLUSH_INTERVAL = 150;

export class Orchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private costTracker: CostTracker;
  private auditLogger: AuditLogger;
  private nexusBrain: NexusBrain;
  private io: SocketServer;
  private escalations: Map<string, Escalation> = new Map();
  private escalationCounter = 0;
  private startTime = Date.now();
  private speedMultiplier = 1;

  private outputBuffer: Map<string, string> = new Map();
  private outputFlushTimer: ReturnType<typeof setInterval> | null = null;
  private inspecting: Map<string, string> = new Map();
  private pendingUpdates: Map<string, AgentState> = new Map();
  private updateFlushTimer: ReturnType<typeof setInterval> | null = null;

  // Project memory — tracks completed work for follow-up edits
  private completedWork: Map<string, { agentId: string; agentName: string; task: string; output: string }> = new Map();

  constructor(io: SocketServer) {
    this.io = io;
    this.costTracker = new CostTracker();
    this.auditLogger = new AuditLogger();
    this.nexusBrain = new NexusBrain();
  }

  async initialize() {
    // All agents are real now
    for (const config of AGENT_ROSTER) {
      const agent = new RealAgent(config);
      this.agents.set(config.id, agent);
      this.wireAgentEvents(agent);
    }

    this.outputFlushTimer = setInterval(() => this.flushOutputBuffer(), OUTPUT_FLUSH_INTERVAL);
    this.updateFlushTimer = setInterval(() => this.flushStatusUpdates(), 200);

    this.io.on('connection', (socket) => {
      console.log(`[Orchestrator] Client connected (${this.agents.size} agents)`);

      socket.emit('fleet:sync', this.getAllAgentStates());
      socket.emit('cost:update', this.costTracker.getSummary());

      const recentEvents = this.auditLogger.getRecent(50);
      for (const evt of recentEvents) socket.emit('audit:event', evt);

      for (const [, esc] of this.escalations) {
        if (esc.status === 'pending') socket.emit('escalation:raised', esc);
      }

      // ─── Nexus Brain: user sends a prompt, Nexus decomposes and delegates ───
      socket.on('nexus:prompt', async (prompt: string) => {
        console.log(`[Nexus] Received prompt: "${prompt}"`);
        this.auditLogger.log('nexus', 'NEXUS', 'task_start', `Decomposing: ${prompt}`);
        this.io.emit('audit:event', this.auditLogger.getRecent(1)[0]);

        // Pass current roster so Nexus knows what exists
        const currentRoster = AGENT_ROSTER.concat(
          Array.from(this.agents.values())
            .filter((a) => !AGENT_ROSTER.find((r) => r.id === a.getId()))
            .map((a) => a.getState() as any)
        );

        // Build project context from completed work
        const projectContext = Array.from(this.completedWork.values()).map((w) => ({
          agentId: w.agentId,
          agentName: w.agentName,
          task: w.task,
          outputPreview: w.output.substring(0, 100) + '...',
        }));

        const result = await this.nexusBrain.decompose(prompt, currentRoster, projectContext);

        if (result.tokens > 0) {
          this.costTracker.addCost('nexus', result.tokens, result.cost);
        }

        // Spawn any new agents that Nexus requested
        const DEPT_COLORS: Record<string, string> = {
          engineering: '#00d4ff', sales: '#ff6b35', support: '#7c3aed', qa: '#10b981',
          devops: '#f59e0b', marketing: '#ec4899', analytics: '#6366f1', executive: '#f97316',
        };

        let newAgentCount = 0;
        for (const assignment of result.assignments) {
          if (assignment.isNew && !this.agents.has(assignment.agentId)) {
            const config: import('./types.js').AgentConfig = {
              id: assignment.agentId,
              name: assignment.role.substring(0, 20),
              department: assignment.department,
              role: assignment.role,
              isReal: true,
              color: DEPT_COLORS[assignment.department] || '#64748b',
            };
            const agent = new RealAgent(config);
            this.agents.set(config.id, agent);
            this.wireAgentEvents(agent);
            agent.start();
            newAgentCount++;
          }
        }

        if (newAgentCount > 0) {
          console.log(`[Nexus] Spawned ${newAgentCount} new agents (fleet: ${this.agents.size})`);
          // Sync the full fleet to all clients so new agents appear
          this.io.emit('fleet:sync', this.getAllAgentStates());
        }

        // Emit the plan
        this.io.emit('nexus:plan', {
          prompt,
          plan: result.plan,
          agentCount: result.assignments.length,
          newAgents: newAgentCount,
          assignments: result.assignments.map((a) => ({
            agentId: a.agentId,
            agentName: this.agents.get(a.agentId)?.getState().name || a.role,
            task: a.task,
          })),
        });

        this.auditLogger.log('nexus', 'NEXUS', 'task_complete', `${result.plan} [${result.assignments.length} agents, ${newAgentCount} new]`);
        this.io.emit('audit:event', this.auditLogger.getRecent(1)[0]);

        // Dispatch tasks — include previous output for edit tasks
        const stagger = result.assignments.length > 20 ? 200 : result.assignments.length > 10 ? 400 : 800;
        for (let i = 0; i < result.assignments.length; i++) {
          const { agentId, task } = result.assignments[i];
          const agent = this.agents.get(agentId);
          if (agent && agent instanceof RealAgent) {
            // If this is an edit task and agent has previous work, include it
            let fullTask = task;
            const prev = this.completedWork.get(agentId);
            if (prev && (task.toLowerCase().startsWith('edit:') || task.toLowerCase().includes('modify') || task.toLowerCase().includes('update') || task.toLowerCase().includes('change') || task.toLowerCase().includes('revise'))) {
              fullTask = `${task}\n\nYOUR PREVIOUS OUTPUT (modify this, don't start from scratch):\n${prev.output}`;
            }
            setTimeout(() => {
              (agent as RealAgent).runPrompt(fullTask);
            }, i * stagger);
          }
        }
      });

      // Send a custom prompt directly to a specific agent
      socket.on('agent:prompt', (data: { agentId: string; prompt: string }) => {
        const agent = this.agents.get(data.agentId);
        if (agent && agent instanceof RealAgent) {
          (agent as RealAgent).runPrompt(data.prompt);
        }
      });

      socket.on('inspect:subscribe', (agentId: string) => {
        this.inspecting.set(socket.id, agentId);
        const agent = this.agents.get(agentId);
        if (agent) {
          const state = agent.getState();
          socket.emit('agent:output', { agentId, chunk: '', fullOutput: state.output });
        }
      });

      socket.on('inspect:unsubscribe', () => { this.inspecting.delete(socket.id); });
      socket.on('disconnect', () => { this.inspecting.delete(socket.id); });

      socket.on('agent:pause', (id: string) => { this.agents.get(id)?.pause(); });
      socket.on('agent:resume', (id: string) => { this.agents.get(id)?.resume(); });
      socket.on('agent:kill', (id: string) => { this.agents.get(id)?.kill(); });

      socket.on('escalation:approve', (id: string) => { this.resolveEscalation(id, 'approved'); });
      socket.on('escalation:deny', (id: string) => { this.resolveEscalation(id, 'denied'); });

      socket.on('voice:command', (cmd: string) => { this.handleVoiceCommand(cmd); });
      socket.on('demo:speed', (m: number) => { this.speedMultiplier = m; });
      socket.on('demo:force-escalation', () => { this.forceEscalation(); });
    });

    // Start all agents (they'll be idle, waiting for Nexus to assign tasks)
    this.staggerStartAgents();

    setInterval(() => {
      this.io.emit('fleet:summary', this.getFleetSummary());
    }, 5000);

    // Broadcast output feed — last 300 chars of every working agent, every 500ms
    setInterval(() => {
      const feed: { agentId: string; name: string; color: string; task: string; output: string }[] = [];
      for (const [, agent] of this.agents) {
        const s = agent.getState();
        if ((s.status === 'working' || s.status === 'completed') && s.output.length > 0) {
          feed.push({
            agentId: s.id,
            name: s.name,
            color: s.color,
            task: s.currentTask,
            output: s.output.slice(-300),
          });
        }
      }
      if (feed.length > 0) this.io.emit('output:feed', feed);
    }, 500);
  }

  private wireAgentEvents(agent: BaseAgent) {
    const id = agent.getId();

    agent.on('status', (state: AgentState) => {
      this.pendingUpdates.set(id, state);
      this.auditLogger.log(id, state.name, 'status_change', `Status → ${state.status}`);
      // When agent completes, save to project memory and broadcast as asset
      if (state.status === 'completed' && state.output.length > 10) {
        this.completedWork.set(state.id, {
          agentId: state.id,
          agentName: state.name,
          task: state.currentTask,
          output: state.output,
        });
        this.io.emit('agent:asset', {
          agentId: state.id,
          agentName: state.name,
          color: state.color,
          department: state.department,
          task: state.currentTask,
          output: state.output,
        });
      }
    });

    agent.on('output', (data: { agentId: string; chunk: string; fullOutput: string }) => {
      this.outputBuffer.set(data.agentId, data.fullOutput);
    });

    agent.on('task', (data: { agentId: string; task: string }) => {
      const state = agent.getState();
      const evt = this.auditLogger.log(id, state.name, 'task_start', data.task);
      this.io.emit('audit:event', evt);
    });

    agent.on('cost', (data: { agentId: string; tokens: number; cost: number }) => {
      this.costTracker.addCost(data.agentId, data.tokens, data.cost);
    });

    agent.on('escalation', (data: any) => {
      const escalation: Escalation = {
        id: `esc-${++this.escalationCounter}`,
        agentId: data.agentId,
        agentName: data.agentName,
        department: data.department,
        reason: data.reason,
        context: data.context,
        timestamp: Date.now(),
        status: 'pending',
      };
      this.escalations.set(escalation.id, escalation);
      this.io.emit('escalation:raised', escalation);
      this.auditLogger.log(id, data.agentName, 'escalation', data.reason);
    });
  }

  private flushOutputBuffer() {
    if (this.outputBuffer.size === 0) return;
    const sockets = this.io.sockets.sockets;
    for (const [agentId, fullOutput] of this.outputBuffer) {
      for (const [socketId, inspectedId] of this.inspecting) {
        if (inspectedId === agentId) {
          sockets.get(socketId)?.emit('agent:output', { agentId, chunk: '', fullOutput });
        }
      }
    }
    this.outputBuffer.clear();
  }

  private flushStatusUpdates() {
    if (this.pendingUpdates.size === 0) return;
    this.io.emit('agent:update:batch', Array.from(this.pendingUpdates.values()));
    this.pendingUpdates.clear();
  }

  private async staggerStartAgents() {
    const agentList = Array.from(this.agents.values());
    const baseDelay = Math.max(300, Math.min(3000, 45000 / agentList.length));
    for (let i = 0; i < agentList.length; i++) {
      const agent = agentList[i];
      agent.start().catch((err) => console.error(`Agent error:`, err));
      if (i < agentList.length - 1) {
        await new Promise((r) => setTimeout(r, baseDelay / this.speedMultiplier));
      }
    }
    console.log(`[Orchestrator] All ${agentList.length} agents online and idle`);
  }

  private resolveEscalation(escalationId: string, status: 'approved' | 'denied') {
    const esc = this.escalations.get(escalationId);
    if (!esc || esc.status !== 'pending') return;
    esc.status = status;
    const agent = this.agents.get(esc.agentId);
    if (agent) { status === 'approved' ? agent.resume() : agent.kill(); }
    this.io.emit('escalation:resolved', { id: escalationId, status });
    this.auditLogger.log(esc.agentId, esc.agentName, 'escalation', `Escalation ${status}`);
  }

  private forceEscalation() {
    for (const [, agent] of this.agents) {
      const state = agent.getState();
      if (state.status === 'working') {
        agent.emit('escalation', {
          agentId: state.id, agentName: state.name, department: state.department,
          reason: 'Anomalous behavior detected — requires human review',
          context: `Agent ${state.name} flagged unusual patterns in: "${state.currentTask}".`,
        });
        return;
      }
    }
  }

  private handleVoiceCommand(command: string) {
    const cmd = command.toLowerCase().trim();
    if (cmd.includes('show fleet') || cmd.includes('fleet view')) this.io.emit('camera:mode', 'fleet');
    else if (cmd.includes('command view') || cmd.includes('go back')) this.io.emit('camera:mode', 'command');
    else if (cmd.includes('pause all') || cmd.includes('freeze')) { for (const [, a] of this.agents) a.pause(); }
    else if (cmd.includes('resume all') || cmd.includes('unfreeze')) { for (const [, a] of this.agents) a.resume(); }
    else if (cmd.includes('approve')) {
      for (const [, esc] of this.escalations) { if (esc.status === 'pending') { this.resolveEscalation(esc.id, 'approved'); break; } }
    } else if (cmd.includes('deny') || cmd.includes('reject')) {
      for (const [, esc] of this.escalations) { if (esc.status === 'pending') { this.resolveEscalation(esc.id, 'denied'); break; } }
    }
  }

  private getAllAgentStates(): AgentState[] {
    return Array.from(this.agents.values()).map((a) => a.getState());
  }

  private getFleetSummary(): FleetSummary {
    const states = this.getAllAgentStates();
    const costSummary = this.costTracker.getSummary();
    const byDepartment: Record<string, { count: number; active: number; cost: number }> = {};
    for (const state of states) {
      if (!byDepartment[state.department]) byDepartment[state.department] = { count: 0, active: 0, cost: 0 };
      byDepartment[state.department].count++;
      if (state.status === 'working') byDepartment[state.department].active++;
      byDepartment[state.department].cost += state.costUsd;
    }
    return {
      totalAgents: states.length,
      activeAgents: states.filter((s) => s.status === 'working').length,
      totalCost: costSummary.totalCost,
      totalTokens: costSummary.totalTokens,
      byDepartment: byDepartment as Record<Department, { count: number; active: number; cost: number }>,
      uptime: Date.now() - this.startTime,
    };
  }
}
