import { SimScript } from '../simulated-agent.js';

export const script: SimScript = {
  tasks: [
    {
      name: 'Processing data pipeline',
      output: `## Data Pipeline Status Report

### ETL Job: daily_metrics_aggregation
**Run ID:** ETL-2024-W11-0314
**Schedule:** Daily @ 06:00 UTC
**Status:** Completed Successfully

### Extract Phase [COMPLETE] ✓
- Sources processed: 7/7
- Records extracted: 2,847,321
- Duration: 2m 14s

| Source | Records | Status | Duration |
|--------|---------|--------|----------|
| PostgreSQL (primary) | 1,247,892 | ✓ | 48s |
| MongoDB (events) | 892,341 | ✓ | 31s |
| Redis (sessions) | 412,088 | ✓ | 12s |
| S3 (logs) | 198,234 | ✓ | 28s |
| Stripe API | 47,823 | ✓ | 8s |
| Salesforce | 34,219 | ✓ | 14s |
| HubSpot | 14,724 | ✓ | 5s |

### Transform Phase [COMPLETE] ✓
- Transformations applied: 23
- Records validated: 2,847,321 (100%)
- Records rejected: 1,247 (0.04%)
- Rejection reasons:
  - Missing required fields: 892
  - Invalid timestamp format: 234
  - Duplicate key violation: 121
- Duration: 3m 47s

### Load Phase [COMPLETE] ✓
- Target: Snowflake (analytics warehouse)
- Tables updated: 14
- Records loaded: 2,846,074
- Partitions refreshed: 31
- Duration: 1m 52s

### Pipeline Summary
- Total duration: 7m 53s (SLA: <15m ✓)
- Data freshness: 7m 53s lag
- Next scheduled run: Tomorrow 06:00 UTC
- Storage delta: +2.3GB (total warehouse: 4.7TB)`,
      durationMs: 11000,
      tokensEstimate: 520,
      costEstimate: 0.006,
    },
    {
      name: 'Generating executive dashboard',
      output: `## Executive Dashboard — Daily KPI Summary

**Report Date:** March 14, 2026
**Generated:** 14:52 UTC

### Revenue & Growth
| KPI | Current | Target | Trend | Status |
|-----|---------|--------|-------|--------|
| MRR | $847,200 | $900,000 | ↑ 4.2% MoM | On Track |
| ARR (annualized) | $10.17M | $10.8M | ↑ 4.2% MoM | On Track |
| New MRR | $38,400 | $35,000 | ↑ 9.7% above target | Exceeding |
| Churned MRR | $12,100 | <$15,000 | ↓ 19% vs last month | Healthy |
| Net Revenue Retention | 118% | >110% | → stable | Exceeding |
| ARPU | $342 | $320 | ↑ 6.9% | Exceeding |

### Customer Metrics
| KPI | Current | Prev. Month | Change |
|-----|---------|-------------|--------|
| Total Customers | 2,476 | 2,389 | +87 |
| Enterprise (>$50K) | 23 | 21 | +2 |
| Business ($10-50K) | 184 | 172 | +12 |
| Starter (<$10K) | 2,269 | 2,196 | +73 |
| NPS Score | 62 | 58 | +4 |
| CSAT | 4.7/5 | 4.6/5 | +0.1 |

### Operational Efficiency
| KPI | Current | Target | Status |
|-----|---------|--------|--------|
| Agent Fleet Uptime | 99.94% | 99.9% | ✓ |
| Avg. Task Completion | 3.2m | <5m | ✓ |
| Cost per Task | $0.023 | <$0.03 | ✓ |
| Support Response Time | 45s | <2m | ✓ |
| Deployment Frequency | 23/week | >15/week | ✓ |

### Cash & Runway
- Monthly Burn: $287K
- Cash on Hand: $18.4M
- Runway: 64 months at current burn
- Revenue / Burn Ratio: 2.95x (approaching profitability)

### Alerts
- ⚡ MRR growth accelerating — on pace for $1M MRR by Month 4
- ⚡ Enterprise segment growing faster than forecast (+2 vs +1 expected)
- ⚠ Support ticket volume up 28% — may need capacity increase`,
      durationMs: 13000,
      tokensEstimate: 650,
      costEstimate: 0.007,
    },
    {
      name: 'Running anomaly detection',
      output: `## Anomaly Detection Report

**Analysis Window:** Last 24 hours
**Models:** Statistical (Z-score) + ML (Isolation Forest)
**Data Points Analyzed:** 14,847,231

### Detected Anomalies

**ANOMALY #1 — Medium Confidence (87%)**
- **Metric:** API request volume from single customer
- **Customer:** Acme Corp (ID: cust_847)
- **Pattern:** 12,400 requests in 60s window (normal: ~200/min)
- **Time:** 14:23 UTC
- **Root Cause:** Identified — batch import job (see support ticket #4821)
- **Action:** Already mitigated, rate limit temporarily raised
- **Impact:** Caused brief 429 errors for this customer only

**ANOMALY #2 — Low Confidence (62%)**
- **Metric:** Signup conversion rate spike
- **Pattern:** Conversion rate jumped from 2.1% to 4.8% between 11:00-13:00 UTC
- **Potential Causes:**
  1. Hacker News front page mention (confirmed — post at 10:47 UTC)
  2. Traffic quality unusually high (76% direct/organic vs 55% normal)
- **Action:** No action needed — positive anomaly
- **Note:** Monitor for sustained traffic; may need to scale onboarding infrastructure

**ANOMALY #3 — Low Confidence (58%)**
- **Metric:** Database query latency — p99
- **Pattern:** p99 latency increased from 45ms to 78ms between 02:00-04:00 UTC
- **Potential Causes:**
  1. Nightly backup job overlap with analytics queries
  2. Table bloat on events table (last VACUUM: 5 days ago)
- **Action:** Schedule VACUUM ANALYZE on events table
- **Impact:** Minimal — latency still within SLA

### Baseline Health Scores
| System | Health Score | Trend |
|--------|-------------|-------|
| API Layer | 97/100 | → Stable |
| Database | 91/100 | ↓ 3pts (vacuum needed) |
| Cache Layer | 99/100 | → Stable |
| Worker Queue | 95/100 | ↑ 2pts |
| CDN / Static | 100/100 | → Stable |

### Model Performance
- True Positive Rate: 94.2%
- False Positive Rate: 3.1%
- Mean Detection Latency: 2.4 minutes
- Model last retrained: 3 days ago`,
      durationMs: 14000,
      tokensEstimate: 700,
      costEstimate: 0.008,
    },
  ],
};
