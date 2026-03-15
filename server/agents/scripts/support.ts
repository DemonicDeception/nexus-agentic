import { SimScript } from '../simulated-agent.js';

export const script: SimScript = {
  tasks: [
    {
      name: 'Triaging support tickets',
      output: `## Support Ticket Triage — Batch Processing

### Queue Snapshot: 5 new tickets processed

**TICKET #4821 — P1 CRITICAL**
Subject: "API returning 429 errors in production"
Customer: Acme Corp (Enterprise, $120K ARR)
Category: API / Rate Limiting
SLA: 1 hour response (47 min remaining)
→ Action: Assigned to on-call engineer, customer notified
→ Initial diagnosis: Rate limit threshold exceeded during batch import

**TICKET #4822 — P2 HIGH**
Subject: "Dashboard metrics not updating since 3am UTC"
Customer: GlobalTech (Business, $36K ARR)
Category: Data Pipeline / Dashboard
SLA: 4 hour response
→ Action: Queued for data team review
→ Likely cause: Stale cache or pipeline delay

**TICKET #4823 — P3 MEDIUM**
Subject: "How to configure SSO with Okta?"
Customer: StartupXYZ (Starter, $6K ARR)
Category: Authentication / Setup
SLA: 24 hour response
→ Action: Auto-responded with SSO setup guide link
→ KB Article: #A-2847 matches 94% confidence

**TICKET #4824 — P3 MEDIUM**
Subject: "Feature request: bulk user import via CSV"
Customer: MidScale Inc. (Business, $24K ARR)
Category: Feature Request
SLA: 48 hour response
→ Action: Logged in feature request tracker, tagged PM team
→ Note: 14th request for this feature this quarter

**TICKET #4825 — P4 LOW**
Subject: "Typo in onboarding email template"
Customer: Internal report
Category: Content / UX
SLA: Best effort
→ Action: Forwarded to content team

### Triage Summary
- P1: 1 (auto-escalated)
- P2: 1
- P3: 2 (1 auto-resolved)
- P4: 1
- Average triage time: 8.3 seconds/ticket`,
      durationMs: 11000,
      tokensEstimate: 580,
      costEstimate: 0.006,
    },
    {
      name: 'Drafting response for P1 ticket',
      output: `## Response Draft — Ticket #4821

**To:** devops@acmecorp.com
**Subject:** RE: API returning 429 errors in production
**Priority:** P1 — Critical

---

Hi Team,

Thank you for reporting this. We've identified the issue and here's what's happening:

### Root Cause
Your batch import job at 14:23 UTC triggered approximately 12,400 API calls within a 60-second window, exceeding your current rate limit of 1,000 requests/minute on the /api/v2/records endpoint.

### Immediate Resolution
We've taken two actions:
1. **Temporary rate limit increase** — Your account has been bumped to 5,000 req/min for the next 24 hours while we work on a permanent solution.
2. **Retry guidance** — Failed requests (HTTP 429) can be safely retried. The response headers include \`Retry-After\` with the recommended backoff in seconds.

### Recommended Long-Term Fix
For batch imports of this size, we recommend using our Bulk Import API:
\`\`\`
POST /api/v2/bulk/records
Content-Type: application/json

{
  "records": [...],  // Up to 10,000 per request
  "options": {
    "upsert": true,
    "on_error": "continue"
  }
}
\`\`\`
This endpoint is designed for high-volume operations and has a separate, much higher rate limit (100 requests/min, 10K records each).

### Documentation
- Bulk Import Guide: docs.nexus.ai/bulk-import
- Rate Limit Reference: docs.nexus.ai/rate-limits
- Status Page: status.nexus.ai

### Next Steps
- We'll keep the elevated limit active for 24 hours
- Our solutions engineer can help migrate your import job to the bulk endpoint — reply here to schedule a call
- We'll monitor your account for any further 429s

Let us know if you have any questions.

Best regards,
Echo — Nexus Support`,
      durationMs: 13000,
      tokensEstimate: 650,
      costEstimate: 0.007,
    },
    {
      name: 'Updating knowledge base',
      output: `## Knowledge Base Update — New Article Draft

### Article: "Handling API Rate Limits and 429 Errors"
**ID:** KB-2891
**Category:** API / Troubleshooting
**Status:** Draft — Pending Review

---

# Handling API Rate Limits (HTTP 429)

## Overview
When your application exceeds the allowed request rate, the API returns a 429 (Too Many Requests) status code. This guide explains rate limits, how to handle 429 errors, and best practices for high-volume operations.

## Default Rate Limits
| Plan | Requests/min | Burst Limit | Bulk Endpoint |
|------|-------------|-------------|---------------|
| Starter | 100 | 150 | Not available |
| Business | 500 | 750 | 50 req/min |
| Enterprise | 1,000 | 2,000 | 100 req/min |

## Handling 429 Responses
1. Read the \`Retry-After\` header for backoff duration
2. Implement exponential backoff with jitter
3. Queue requests and process in batches

## Best Practices
- Use the Bulk Import API for operations > 100 records
- Implement client-side rate limiting before hitting the API
- Monitor usage via the /api/v2/usage endpoint
- Set up webhook alerts at 80% threshold

---

### Additional Updates
- Updated article KB-2847 (SSO Setup) with Okta-specific screenshots
- Merged duplicate articles KB-1923 and KB-2104 (webhook configuration)
- Added 3 new entries to auto-response matching index
- KB health score: 94.2% (target: >90%)`,
      durationMs: 12000,
      tokensEstimate: 520,
      costEstimate: 0.005,
    },
  ],
};
