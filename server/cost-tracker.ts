import { EventEmitter } from 'events';

export class CostTracker extends EventEmitter {
  private costs: Map<string, { tokens: number; cost: number }> = new Map();
  private startTime = Date.now();

  addCost(agentId: string, tokens: number, cost: number) {
    const existing = this.costs.get(agentId) || { tokens: 0, cost: 0 };
    existing.tokens += tokens;
    existing.cost += cost;
    this.costs.set(agentId, existing);
    this.emit('update', this.getSummary());
  }

  getAgentCost(agentId: string) {
    return this.costs.get(agentId) || { tokens: 0, cost: 0 };
  }

  getSummary() {
    let totalTokens = 0;
    let totalCost = 0;
    for (const [, v] of this.costs) {
      totalTokens += v.tokens;
      totalCost += v.cost;
    }
    return { totalTokens, totalCost, uptime: Date.now() - this.startTime, perAgent: Object.fromEntries(this.costs) };
  }
}
