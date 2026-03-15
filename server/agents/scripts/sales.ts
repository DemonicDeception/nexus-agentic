import { SimScript } from '../simulated-agent.js';

export const script: SimScript = {
  tasks: [
    {
      name: 'Qualifying inbound lead',
      output: `## Lead Qualification Report

**Company:** TechFlow Inc.
**Source:** Inbound — Demo Request Form
**Submitted:** 2 minutes ago

### Company Profile
- Industry: Enterprise SaaS / Developer Tools
- Stage: Series B ($42M raised, Accel + a16z)
- Employees: ~200 (Engineering: 85, Sales: 40, Support: 30)
- ARR: Estimated $18-22M based on headcount signals
- Tech Stack: AWS, Kubernetes, React, PostgreSQL

### Contact Information
- Name: Sarah Chen, VP of Engineering
- Title confirms decision-making authority
- LinkedIn: 12 years exp, prev. Staff Eng at Stripe

### Qualification Scoring (BANT)
- **Budget:** HIGH — Series B funded, actively evaluating automation tools
- **Authority:** HIGH — VP Eng is direct buyer for dev tools
- **Need:** HIGH — Form mentions "scaling engineering without 2x headcount"
- **Timeline:** MEDIUM — Q2 evaluation cycle, decision by end of quarter

### Lead Score: 92/100 — HOT
**Recommended Action:** Priority outreach within 4 hours
**Estimated Deal Value:** $65,000 ARR (200 seats x $325/seat)
**Notes:** Deal value exceeds standard approval threshold — escalation required for enterprise pricing authorization.`,
      durationMs: 12000,
      tokensEstimate: 520,
      costEstimate: 0.006,
    },
    {
      name: 'Drafting outreach sequence',
      output: `## Outbound Email Sequence — TechFlow Inc.

### Email 1: Initial Outreach (Day 0)
**Subject:** Scaling TechFlow's engineering output without scaling headcount

Hi Sarah,

I noticed TechFlow recently closed your Series B — congratulations. Based on your team's growth trajectory, I wanted to share how companies at your stage are using AI agents to multiply engineering output by 3-4x.

We're helping teams like yours automate code review, test generation, and deployment pipelines — the work that slows down shipping velocity as you scale from 85 to 200+ engineers.

Would you be open to a 20-minute walkthrough this week? I can show you exactly how our fleet orchestration handles the workflows your team deals with daily.

Best,
Beacon

---

### Email 2: Value-Add Follow-Up (Day 3)
**Subject:** How Vercel cut their code review backlog by 73%

Sarah, quick case study I thought you'd find relevant:

Vercel deployed a 5-agent engineering fleet and saw:
- Code review turnaround: 48hrs → 4hrs
- Test coverage: 64% → 91%
- Developer satisfaction: +34 NPS points

The key insight: agents handle the predictable 80%, engineers focus on architecture and design decisions.

Happy to walk through the technical architecture if useful.

---

### Email 3: Breakup / Urgency (Day 7)
**Subject:** Last note from me, Sarah

I know VPs of Engineering get flooded with vendor emails, so I'll keep this brief and final.

If scaling engineering velocity is a priority for TechFlow this quarter, I'd love 15 minutes to show you our platform. If the timing isn't right, no worries at all — I'll follow up next quarter.

Either way, I put together a quick ROI calculator based on your team size: [link]

Best of luck with the Series B execution.`,
      durationMs: 14000,
      tokensEstimate: 680,
      costEstimate: 0.007,
    },
    {
      name: 'Updating pipeline forecast',
      output: `## Pipeline Forecast Update — Week 11

### New Additions
| Company | Stage | Deal Value | Probability | Weighted |
|---------|-------|-----------|-------------|----------|
| TechFlow Inc. | Discovery | $65,000 | 25% | $16,250 |
| DataMesh Corp | Demo Scheduled | $42,000 | 40% | $16,800 |
| CloudSync Ltd | Proposal Sent | $28,000 | 60% | $16,800 |

### Pipeline Movement
- **Moved Forward:** 4 deals (+$127K weighted)
- **Stalled:** 1 deal (Nexigen — awaiting legal review)
- **Lost:** 0

### Q2 Pipeline Summary
- Total Pipeline: $1,247,000
- Weighted Pipeline: $498,800
- Quota: $380,000
- Coverage Ratio: 3.28x (healthy: >3x)
- Forecast Confidence: 87%

### Key Risks
1. Nexigen ($85K) stalled in legal — 15 days no movement
2. Two deals have competing evaluations with Devin AI
3. Q2 budget freezes reported at 2 prospect companies

### Next Actions
- Schedule TechFlow demo for this week (hot lead)
- Send Nexigen a mutual action plan to unstick legal
- Prepare competitive battle card vs. Devin for active evals`,
      durationMs: 10000,
      tokensEstimate: 450,
      costEstimate: 0.005,
    },
  ],
  escalation: {
    afterTask: 1,
    reason: 'Deal value exceeds autonomous approval limit ($50,000+)',
    context: 'TechFlow Inc. — Estimated deal value: $65,000 ARR. Lead Score: 92/100. VP Engineering contact with budget authority. Requires human approval for enterprise pricing tier and custom contract terms.',
  },
};
