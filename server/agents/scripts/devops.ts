import { SimScript } from '../simulated-agent.js';

export const script: SimScript = {
  tasks: [
    {
      name: 'Monitoring deployment pipeline',
      output: `## Deployment Pipeline — Build #2847

**Trigger:** Push to main (commit e4a91bf)
**Author:** @atlas-agent (automated merge)
**Pipeline:** production-us-east-1

### Stage 1: Build [COMPLETE] ✓
- Duration: 47s
- Docker image: nexus-api:2847-e4a91bf
- Image size: 234MB (↓ 12MB from prev build)
- Cache hit: 89% of layers cached
- Artifacts: 3 generated, uploaded to S3

### Stage 2: Test [COMPLETE] ✓
- Duration: 3m 18s
- Unit tests: 247/247 passed
- Integration: 67/67 passed
- Lint: 0 errors, 2 warnings (non-blocking)
- Security scan: 0 critical, 0 high, 3 medium (known, tracked)

### Stage 3: Staging Deploy [COMPLETE] ✓
- Duration: 1m 22s
- Target: staging-us-east-1 (ECS Fargate)
- Tasks launched: 4/4 healthy
- Health check: HTTP 200 in 8.3s
- Smoke tests: 12/12 passed
- Canary metrics: p50 latency 23ms, p99 latency 187ms

### Stage 4: Production Deploy [IN PROGRESS]
- Strategy: Rolling update (25% increments)
- Progress: 2/4 task sets updated
- Old version: draining connections...
- Health: All instances reporting healthy
- Estimated completion: 2m 15s

### Pipeline Timing
\`\`\`
Build   [████████]         47s
Test    [████████████████]  3m 18s
Stage   [██████████]        1m 22s
Prod    [██████░░░░]        ~2m 15s  ← in progress
        ─────────────────────────────
Total:  ~7m 42s (SLA: < 10m ✓)
\`\`\``,
      durationMs: 11000,
      tokensEstimate: 520,
      costEstimate: 0.006,
    },
    {
      name: 'Scaling infrastructure',
      output: `## Auto-Scaling Decision Report

**Cluster:** nexus-production-us-east-1
**Time:** 14:47 UTC
**Trigger:** CPU utilization threshold exceeded

### Current Metrics
| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| CPU Utilization | 78.3% | 70% | ⚠ OVER |
| Memory Utilization | 62.1% | 80% | ✓ OK |
| Request Rate | 12,847/min | 15,000/min | ✓ OK |
| p99 Latency | 245ms | 300ms | ✓ OK |
| Active Connections | 4,231 | 5,000 | ✓ OK |

### Scaling Decision
**Action:** SCALE OUT — Adding 2 instances
**Reason:** CPU utilization above 70% threshold for >5 minutes
**Scaling policy:** target-tracking (CPU 65% target)

### Execution Plan
1. Launching 2x c6g.xlarge instances in us-east-1a, us-east-1b
2. Pulling container image nexus-api:2847-e4a91bf
3. Registering with ALB target group
4. Waiting for health check (60s grace period)
5. Enabling traffic routing

### Scaling Timeline
- T+0:00 — Instances requested
- T+0:45 — Instances running, containers starting
- T+1:30 — Health checks passing
- T+2:00 — Traffic routing enabled
- T+5:00 — Metrics stabilization check

### Cost Impact
- Additional hourly cost: $0.136/hr ($3.26/day)
- Projected daily spend: $47.82 → $51.08
- Scale-in cooldown: 15 minutes after CPU < 55%

### Fleet Status Post-Scale
- Running instances: 4 → 6
- Availability zones: 3/3 covered
- Estimated capacity: ~18,000 req/min`,
      durationMs: 12000,
      tokensEstimate: 480,
      costEstimate: 0.005,
    },
    {
      name: 'Running security scan',
      output: `## Security Scan Report — Automated Weekly Audit

**Scan ID:** SEC-2024-W11-847
**Scope:** Full stack (infrastructure + application + dependencies)
**Duration:** 4m 12s

### Vulnerability Summary
| Severity | Count | New | Fixed Since Last |
|----------|-------|-----|-----------------|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 1 |
| Medium | 3 | 1 | 0 |
| Low | 7 | 2 | 3 |
| Info | 12 | 4 | 1 |

### Medium Vulnerabilities (Action Required)

**MED-001:** Dependency — jsonwebtoken@9.0.0
- CVE: CVE-2024-33573 (CVSS 5.3)
- Risk: Algorithm confusion in JWT verification
- Status: Patch available (v9.0.2)
- Action: Upgrade in next maintenance window

**MED-002:** Configuration — S3 bucket logging
- Finding: Access logging disabled on nexus-assets-prod bucket
- Risk: Reduced audit trail for asset access
- Action: Enable logging, route to centralized log bucket

**MED-003:** Application — Rate limiter bypass (NEW)
- Finding: Authenticated endpoints missing rate limit headers
- Risk: Potential abuse of high-privilege API endpoints
- Action: Add rate limiting middleware to /api/admin/* routes

### Infrastructure Compliance
- TLS: All endpoints ✓ (TLS 1.3)
- Encryption at rest: All databases ✓ (AES-256)
- Network segmentation: ✓ (VPC isolation verified)
- IAM policies: ✓ (least privilege audit passed)
- Secrets management: ✓ (no hardcoded credentials found)

### Container Image Scan
- Base image: node:20-alpine (up to date)
- OS packages: 0 critical, 0 high vulnerabilities
- Node modules: 347 scanned, 3 advisories (medium/low)

### Next Scan: Scheduled in 7 days`,
      durationMs: 10000,
      tokensEstimate: 550,
      costEstimate: 0.006,
    },
  ],
};
