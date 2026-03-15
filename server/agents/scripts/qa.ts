import { SimScript } from '../simulated-agent.js';

export const script: SimScript = {
  tasks: [
    {
      name: 'Running regression suite',
      output: `## Regression Test Suite — Run #1847

**Branch:** feature/agent-orchestration-v2
**Commit:** a3f7c2d — "Add fleet scaling logic"
**Environment:** staging-us-east-1
**Started:** 14:32:07 UTC

### Test Execution Progress
[====================================] 249/249 tests

### Results Summary
- Total Tests: 249
- Passed: 247 ✓
- Failed: 2 ✗
- Skipped: 0
- Duration: 3m 42s

### Failed Tests

**FAIL** \`orchestrator.test.ts > Agent Lifecycle > should handle graceful shutdown during active task\`
  Expected: agent.status === "idle" after shutdown
  Received: agent.status === "working"
  Duration: 12,340ms (timeout: 10,000ms)
  Stack: orchestrator.test.ts:247:12

**FAIL** \`cost-tracker.test.ts > Concurrent Updates > should maintain accuracy under concurrent writes\`
  Expected: totalCost === 0.0847
  Received: totalCost === 0.0846
  Difference: 0.0001 (floating point precision)
  Stack: cost-tracker.test.ts:89:8

### Test Categories
| Category | Passed | Failed | Duration |
|----------|--------|--------|----------|
| Unit Tests | 142 | 0 | 28s |
| Integration | 67 | 1 | 1m 45s |
| E2E | 38 | 1 | 1m 29s |
| Performance | 2 | 0 | 12s |

### Flaky Test Detection
- No previously flaky tests failed
- shutdown test is newly failing (first seen this run)
- cost-tracker precision issue seen 2x in last 10 runs`,
      durationMs: 10000,
      tokensEstimate: 480,
      costEstimate: 0.005,
    },
    {
      name: 'Analyzing test failures',
      output: `## Root Cause Analysis — 2 Failed Tests

---

### Failure 1: Graceful Shutdown Timeout
**Test:** orchestrator.test.ts:247 — "should handle graceful shutdown during active task"
**Severity:** Medium — Functional regression

**Root Cause:**
The new fleet scaling logic (commit a3f7c2d) introduced an additional async operation in the agent shutdown sequence. The \`BaseAgent.kill()\` method now waits for in-flight API calls to complete before transitioning to idle, but the test's 10-second timeout doesn't account for this.

**Analysis:**
\`\`\`
Before (v1): kill() → immediate status = "idle"
After  (v2): kill() → await pendingOps → status = "idle"
                       ^^^^^^^^^^^^^^^^
                       New step adds ~3-5s latency
\`\`\`

**Fix Options:**
1. **Recommended:** Increase test timeout to 15,000ms and add a force-kill fallback after 10s
2. Alternative: Add \`AbortController\` to pending operations for instant cancellation
3. Alternative: Make graceful vs. forced shutdown configurable

**Estimated Fix Time:** 15 minutes

---

### Failure 2: Floating Point Precision
**Test:** cost-tracker.test.ts:89 — "should maintain accuracy under concurrent writes"
**Severity:** Low — Non-functional, precision issue

**Root Cause:**
JavaScript floating point arithmetic. Multiple small additions (e.g., 0.003 + 0.005 + 0.002...) accumulate rounding errors. The test uses strict equality instead of approximate comparison.

**Analysis:**
\`\`\`
0.001 + 0.002 + 0.003 + ... (28 additions)
Expected: 0.0847
Actual:   0.08469999999999998
\`\`\`

**Fix Options:**
1. **Recommended:** Use \`toBeCloseTo(0.0847, 4)\` instead of \`toBe(0.0847)\`
2. Alternative: Store costs as integers (cents × 100) and convert on display
3. Alternative: Use a decimal library (overkill for this use case)

**Estimated Fix Time:** 5 minutes

---

### Summary
- Neither failure is a blocking issue for deployment
- Recommended: Fix both before merging to main
- The shutdown test reveals a legitimate design question about graceful vs. forced kill`,
      durationMs: 13000,
      tokensEstimate: 620,
      costEstimate: 0.007,
    },
    {
      name: 'Generating coverage report',
      output: `## Code Coverage Report — Build #1847

### Overall Coverage
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statements | 87.3% | 80% | ✓ PASS |
| Branches | 79.8% | 75% | ✓ PASS |
| Functions | 91.2% | 85% | ✓ PASS |
| Lines | 88.1% | 80% | ✓ PASS |

### Coverage by Module
| Module | Statements | Branches | Functions | Lines | Trend |
|--------|-----------|----------|-----------|-------|-------|
| server/orchestrator | 92.4% | 84.1% | 95.0% | 93.1% | ↑ 1.2% |
| server/agents | 89.7% | 81.3% | 93.8% | 90.2% | → 0.0% |
| server/cost-tracker | 94.1% | 88.7% | 100% | 94.5% | ↑ 0.3% |
| server/audit-logger | 96.2% | 91.0% | 100% | 96.8% | → 0.0% |
| server/api | 78.3% | 68.2% | 82.4% | 79.1% | ↓ 2.1% |
| shared/types | 100% | 100% | 100% | 100% | → 0.0% |

### Uncovered Areas (High Priority)
1. \`orchestrator.ts:312-328\` — Error recovery branch (edge case: all agents crash simultaneously)
2. \`api/routes.ts:89-104\` — Admin override endpoints (no integration tests yet)
3. \`agents/real-agent.ts:156-171\` — API timeout retry logic (mocking needed)

### Coverage Trend (Last 5 Builds)
\`\`\`
#1843  ████████████████████░░░  85.2%
#1844  █████████████████████░░  86.8%
#1845  █████████████████████░░  87.0%
#1846  █████████████████████░░  87.0%
#1847  █████████████████████░░  87.3%  ← current
\`\`\`

### Recommendations
- Add integration tests for admin API routes (+3% estimated gain)
- Mock Anthropic SDK for real-agent retry path (+1.5% estimated gain)
- Target: 90% statement coverage by end of sprint`,
      durationMs: 9000,
      tokensEstimate: 500,
      costEstimate: 0.005,
    },
  ],
};
