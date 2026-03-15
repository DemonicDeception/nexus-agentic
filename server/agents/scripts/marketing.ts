import { SimScript } from '../simulated-agent.js';

export const script: SimScript = {
  tasks: [
    {
      name: 'Analyzing campaign performance',
      output: `## Campaign Performance Report — Week 11

### Active Campaigns Summary

**Campaign: "AI Fleet Launch" (Product Awareness)**
- Channel: LinkedIn + Google Ads
- Status: Active (Day 12 of 30)
- Budget: $8,400 spent of $15,000 allocated

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Impressions | 284,320 | 247,100 | ↑ 15.1% |
| Clicks | 4,127 | 3,589 | ↑ 15.0% |
| CTR | 1.45% | 1.45% | → 0.0% |
| Conversions | 89 | 72 | ↑ 23.6% |
| Conv. Rate | 2.16% | 2.01% | ↑ 0.15pp |
| CPA | $18.43 | $21.12 | ↓ 12.7% |
| ROAS | 4.2x | 3.8x | ↑ 10.5% |

**Campaign: "Developer Community" (Content/SEO)**
- Channel: Blog + Dev.to + Twitter/X
- Status: Active (ongoing)

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Blog Views | 12,847 | 11,203 | ↑ 14.7% |
| Avg. Time on Page | 4m 32s | 3m 58s | ↑ 14.3% |
| Newsletter Signups | 234 | 198 | ↑ 18.2% |
| GitHub Stars | +127 | +89 | ↑ 42.7% |
| Dev.to Reactions | 892 | 614 | ↑ 45.3% |

### Top Performing Content
1. "Building an AI Agent Fleet from Scratch" — 4,231 views, 12.3% conv rate
2. "Cost Optimization for Multi-Agent Systems" — 2,847 views, 8.7% conv rate
3. "Real-time Agent Orchestration Patterns" — 1,923 views, 6.2% conv rate

### Key Insights
- LinkedIn outperforming Google Ads by 2.3x on CPA
- Developer content driving 3x more qualified leads than paid ads
- Best performing ad creative: "See 15 AI agents work in real-time"`,
      durationMs: 12000,
      tokensEstimate: 580,
      costEstimate: 0.006,
    },
    {
      name: 'Generating content calendar',
      output: `## Content Calendar — Week 12

### Monday
- **Blog Post:** "How We Reduced Agent Coordination Latency by 60%"
  - Author: Engineering team (ghostwritten by Atlas)
  - Target: 2,500 words, technical depth
  - Distribution: Blog → Dev.to → Hacker News
  - Keywords: agent orchestration, multi-agent systems, latency optimization
  - Status: Draft in progress

### Tuesday
- **Social Thread:** Twitter/X — "5 patterns we learned running 15 AI agents in production"
  - Format: 8-tweet thread with diagrams
  - Target engagement: 50+ retweets, 200+ likes
  - Tie-in: Link to fleet demo

### Wednesday
- **Case Study:** "How TechCorp Automated 80% of Their Code Review"
  - Format: PDF + landing page
  - Gated: Email capture for download
  - Distribution: LinkedIn sponsored, email to prospects
  - Expected leads: 40-60

### Thursday
- **Webinar Prep:** "Live Demo: Building Your First Agent Fleet"
  - Speaker: CTO + Atlas agent (live)
  - Registration target: 300
  - Follow-up sequence: 3 emails
  - Promotion: All channels starting Monday

### Friday
- **Newsletter:** Weekly Digest #23
  - Sections: Product updates, community highlights, tip of the week
  - Subscriber count: 4,847
  - Target open rate: >35%
  - Featured: Webinar announcement + this week's top blog post

### Content Metrics Targets
- Total new blog views: 15,000
- Newsletter growth: +250 subscribers
- Social engagement: +20% WoW
- Content-attributed leads: 45`,
      durationMs: 11000,
      tokensEstimate: 500,
      costEstimate: 0.005,
    },
    {
      name: 'Optimizing ad spend',
      output: `## Ad Spend Optimization Report

### Current Monthly Budget: $32,000
### Recommended Reallocation

| Channel | Current | Recommended | Change | Rationale |
|---------|---------|-------------|--------|-----------|
| LinkedIn Ads | $12,000 | $15,500 | +$3,500 | Highest ROAS (4.2x), scale top performers |
| Google Search | $10,000 | $7,500 | -$2,500 | CPA 2.3x above LinkedIn, reduce low-intent terms |
| Google Display | $4,000 | $2,000 | -$2,000 | Low conv. rate (0.8%), shift to retargeting only |
| Twitter/X Ads | $3,000 | $3,500 | +$500 | Developer audience engagement up 45% |
| Dev.to Sponsor | $2,000 | $2,500 | +$500 | Content performing well, increase visibility |
| Retargeting | $1,000 | $1,000 | — | Maintain current level, high efficiency |

### Budget Impact Analysis
**Projected improvement with reallocation:**
- Monthly leads: 312 → 387 (↑ 24%)
- Average CPA: $38.46 → $31.52 (↓ 18%)
- Projected ROAS: 3.4x → 4.1x

### Specific Optimizations

**LinkedIn (Scaling):**
- Increase budget on "VP Engineering" + "CTO" targeting by 40%
- Duplicate top ad creative with A/B variant (different CTA)
- Add lookalike audience from converted customers

**Google Search (Trimming):**
- Pause keywords: "AI tools" (too broad, $4.20 CPC, 0.3% conv)
- Pause keywords: "automation software" (low intent, $3.80 CPC)
- Increase bids: "AI agent platform" (high intent, 4.8% conv)
- Add negative keywords: "free", "open source", "tutorial"

**Google Display → Retargeting Only:**
- Disable prospecting campaigns
- Keep retargeting: website visitors (7-day window)
- Creative: Social proof + demo CTA

### Implementation Timeline
- Day 1: Pause underperforming Google campaigns
- Day 2: Scale LinkedIn top performers
- Day 3: Launch new Twitter/X campaigns
- Day 7: First performance review
- Day 14: Full optimization report`,
      durationMs: 14000,
      tokensEstimate: 620,
      costEstimate: 0.007,
    },
  ],
};
