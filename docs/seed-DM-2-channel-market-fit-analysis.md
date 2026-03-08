# DM-2: Channel-Market Fit Analysis

## Purpose
Provide a scoring framework for evaluating which marketing channels have the best fit for Stone AI's ideal customer profile, considering cost, speed, scalability, and audience overlap. This seed is intelligence and analysis only -- it produces a ranked list of channels and a prioritization matrix. Execution planning happens downstream. Per D11, this stays within the Digital Marketing Strategist's intelligence domain.

## Framework / Standards

### Stone AI Ideal Customer Profile (ICP)

Before scoring channels, define who we're trying to reach.

**Primary ICP: The AI-Curious Professional**
- **Demographics:** 25-50 years old, professional or small business owner, comfortable with technology but not necessarily technical
- **Psychographics:** Ambitious, time-starved, looking for leverage, willing to try new tools if the value is clear, skeptical of hype
- **Job titles / roles:** Solo founder, freelancer, small agency owner, marketing manager, content creator, consultant, early-stage startup founder, operations manager
- **Business stage:** Side hustle to established small business (1-50 employees)
- **Pain points:** Wearing too many hats, can't afford specialist hires, spending hours on tasks AI could handle, worried about data privacy with free AI tools, overwhelmed by the number of AI options
- **Budget range:** $0-$200/mo for AI tools (matches our tier range)
- **Where they spend time online:** Reddit, X/Twitter, YouTube, LinkedIn, Hacker News, Product Hunt, industry-specific Discord servers, newsletters

**Secondary ICP: The AI Agency Builder**
- **Demographics:** 28-45, entrepreneurial, technical or marketing background
- **Psychographics:** Sees AI as a business opportunity, wants to resell or white-label, margin-conscious
- **Job titles / roles:** Agency owner, consultant, fractional CMO/CTO, SaaS builder
- **Relevant tier:** Reseller ($200/mo) or Enterprise
- **Where they spend time online:** X/Twitter, LinkedIn, Product Hunt, Indie Hackers, specific Slack/Discord communities

**Tertiary ICP: The Enterprise Buyer**
- **Demographics:** 35-55, decision-maker at a company with 50+ employees
- **Psychographics:** Risk-averse, compliance-focused, needs to justify ROI to leadership
- **Job titles / roles:** VP of Operations, CTO, Head of Innovation, IT Director
- **Relevant tier:** Enterprise (From $500/mo)
- **Where they spend time online:** LinkedIn, industry publications, conferences, vendor review sites (G2, Capterra)

### Channel Scoring Criteria

Score each channel 1-5 on each criterion. Total possible: 25 points.

| Criterion | 1 (Poor) | 3 (Moderate) | 5 (Excellent) | Weight |
|---|---|---|---|---|
| **Audience Overlap** | <10% of channel users match our ICP | 30-50% match | >70% match | 1.5x |
| **Cost to Acquire** | Requires paid spend from day one, high CPA | Mix of free and paid, moderate CPA | Fully organic possible, near-zero CPA | 1.0x |
| **Time to First Result** | 6+ months before meaningful traction | 1-3 months | <30 days | 1.0x |
| **Scalability Ceiling** | Maxes out quickly, niche audience | Moderate ceiling, can sustain growth for 6-12 months | Massive audience, years of runway | 0.75x |
| **Content Fit** | Requires content formats we can't easily produce | Moderate effort to create appropriate content | Our natural content (text, demos, comparisons) fits perfectly | 0.75x |

**Weighted total = (Audience x 1.5) + (Cost x 1.0) + (Speed x 1.0) + (Scale x 0.75) + (Fit x 0.75)**

**Max weighted score: 25.0**

### Channel Scores

#### 1. Reddit
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 5 | r/artificial, r/smallbusiness, r/SaaS, r/startups, r/Entrepreneur -- heavy ICP concentration |
| Cost to Acquire | 5 | Fully organic. Helpful answers and genuine engagement cost nothing |
| Time to First Result | 4 | Weeks, not months. A single well-placed comment can drive traffic same day |
| Scalability Ceiling | 3 | Subreddits have size limits. Anti-self-promotion culture limits velocity |
| Content Fit | 4 | Text-native. AI tool discussions are organic. Self-promotion must be subtle |
| **Weighted Total** | **17.75** | |

**Notes:** Reddit rewards genuine expertise. The strategy is answer-first, link-later. Stone AI's local-first privacy angle plays well here -- Reddit users are privacy-conscious. Risk: ban if perceived as spamming.

#### 2. X / Twitter
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 4 | AI/tech community is massive on X. Founders, builders, marketers all present |
| Cost to Acquire | 4 | Organic possible via threads, replies, founder brand. Paid optional |
| Time to First Result | 4 | A viral thread can deliver results in hours. Consistency needed for sustained growth |
| Scalability Ceiling | 4 | Huge platform, algorithm amplifies good content |
| Content Fit | 4 | Short-form, punchy copy matches CW-1 voice. Demo videos play well |
| **Weighted Total** | **16.50** | |

**Notes:** Founder personal brand is the unlock here. AI launch threads on X get massive engagement. The "42 agents, zero salaries" angle is highly tweetable.

#### 3. Product Hunt
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 5 | Early adopters, builders, SaaS enthusiasts -- perfect ICP match |
| Cost to Acquire | 5 | Free to launch. Community votes determine visibility |
| Time to First Result | 5 | Launch day delivers immediate traffic and signups |
| Scalability Ceiling | 1 | One-shot event. Sustained traffic drops sharply after launch week |
| Content Fit | 5 | Product launches with demos are exactly what PH is built for |
| **Weighted Total** | **17.25** | |

**Notes:** Product Hunt is a launch accelerator, not a sustained channel. Plan for one high-quality launch per product (Stone AI, then Best AI, then Stone AI Tools). The "founding member" / OG badge angle gives launch-day urgency.

#### 4. Hacker News
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 4 | Technical founders, engineers, startup people. Good overlap but skews more technical |
| Cost to Acquire | 5 | Fully organic. "Show HN" posts are free |
| Time to First Result | 4 | Front page delivers massive traffic instantly. Getting there is unpredictable |
| Scalability Ceiling | 2 | Infrequent posting. Community self-polices against repeated launches |
| Content Fit | 3 | Needs technical substance. "Local-first AI" angle is strong here. Marketing-speak is penalized |
| **Weighted Total** | **15.00** | |

**Notes:** The local-first, open-weight model, privacy angle resonates strongly with HN. Lead with the technical architecture, not the marketing copy. A "Show HN: We built a local-first AI platform with 42 specialist agents" could land well.

#### 5. Discord
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 4 | AI communities, startup communities, creator communities on Discord |
| Cost to Acquire | 4 | Free to participate. Building own server requires consistent effort |
| Time to First Result | 3 | Relationship-building takes weeks. Community trust must be earned |
| Scalability Ceiling | 3 | Each server is a silo. Scaling requires presence in many servers |
| Content Fit | 4 | Conversations, demos, help -- all natural for Discord |
| **Weighted Total** | **15.00** | |

**Notes:** Two strategies: (1) participate in existing AI/startup/creator Discord servers as a helpful member, (2) build a Stone AI community Discord. Strategy 1 is faster. Strategy 2 builds a moat long-term.

#### 6. SEO / Content Marketing
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 4 | People searching "AI tools for business," "AI agents," etc. are our ICP |
| Cost to Acquire | 4 | Content creation costs time, not money. Hosting is free (blog on stone-ai.net) |
| Time to First Result | 1 | 3-6 months minimum for SEO to generate meaningful organic traffic |
| Scalability Ceiling | 5 | Compounds over time. Every indexed page is a permanent traffic source |
| Content Fit | 4 | Comparisons, tutorials, use cases -- all natural content for Stone AI |
| **Weighted Total** | **14.25** | |

**Notes:** SEO is the long game. Start now, expect results in 6 months. Focus on long-tail keywords: "AI agent for [specific task]", "AI business tools for [specific role]", "local AI vs cloud AI." The compound return makes this essential despite slow start.

#### 7. YouTube
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 3 | AI content audience is growing fast. Business tool reviews get views |
| Cost to Acquire | 3 | Video production requires more effort than text. Can start with screen recordings |
| Time to First Result | 2 | Channel growth takes months. Individual videos can spike if picked up by algorithm |
| Scalability Ceiling | 5 | Massive platform. Evergreen content compounds. Videos rank in Google search |
| Content Fit | 3 | Demo videos, tutorials, "watch me use Stone AI to do X" -- works but requires production |
| **Weighted Total** | **12.75** | |

**Notes:** Start with simple screen-capture demos. "I built a business plan in 20 minutes with AI agents" format performs well. Cross-post clips to X, TikTok, LinkedIn. YouTube SEO is a secondary SEO channel.

#### 8. TikTok
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 2 | Skews younger. Business/AI content is growing but not dominant |
| Cost to Acquire | 4 | Fully organic. Algorithm is discovery-based, not follower-based |
| Time to First Result | 3 | Algorithm can surface content fast, but virality is unpredictable |
| Scalability Ceiling | 4 | Massive reach potential. Short-form AI content is trending |
| Content Fit | 2 | Requires short video production. Not our natural format |
| **Weighted Total** | **11.75** | |

**Notes:** Best used as a repurposing channel. Create content for YouTube/X, clip for TikTok. "Watch AI do [impressive thing] in 30 seconds" format works. Not a primary channel.

#### 9. LinkedIn
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 4 | Business professionals, decision-makers, B2B buyers. Strong ICP overlap for Executive/Enterprise tiers |
| Cost to Acquire | 3 | Organic reach has declined. Paid is expensive. Founder posts still get reach |
| Time to First Result | 3 | Consistent posting yields results in 1-2 months |
| Scalability Ceiling | 3 | Good for B2B but saturated. AI content fatigue is real |
| Content Fit | 3 | Professional tone needed. "42 agents replace 42 hires" angle works. Too much hype gets ignored |
| **Weighted Total** | **13.50** | |

**Notes:** Best for targeting Executive and Enterprise tiers. Founder personal brand + thought leadership on local-first AI / business privacy. Not the primary acquisition channel for Free/Builder users.

#### 10. Email Outreach
| Criterion | Score | Rationale |
|---|---|---|
| Audience Overlap | 3 | Depends entirely on list quality. Cold email to right people = high overlap |
| Cost to Acquire | 3 | Free tools exist but deliverability requires investment in domain warming |
| Time to First Result | 3 | Can generate responses within days if targeting is right |
| Scalability Ceiling | 2 | Volume-limited by deliverability, anti-spam laws, and reputation |
| Content Fit | 3 | Short, direct emails match our voice. But cold email has high noise floor |
| **Weighted Total** | **11.63** | |

**Notes:** Best for targeted outreach to agency owners (Reseller tier) and enterprise prospects. Not a volume play. CAN-SPAM and GDPR compliance is non-negotiable.

### Channel Prioritization Matrix

Ranked by weighted total score:

| Rank | Channel | Weighted Score | Best For | Recommended Priority |
|---|---|---|---|---|
| 1 | Reddit | 17.75 | Free, Builder, Growth users | PRIMARY -- start immediately |
| 2 | Product Hunt | 17.25 | Launch event, all tiers | PRIMARY -- plan launch week |
| 3 | X / Twitter | 16.50 | All tiers, brand building | PRIMARY -- start immediately |
| 4 | Hacker News | 15.00 | Builder, technical users | SECONDARY -- plan Show HN post |
| 5 | Discord | 15.00 | Community, retention | SECONDARY -- start participating |
| 6 | SEO / Content | 14.25 | All tiers, long-term | SECONDARY -- start now, expect results later |
| 7 | LinkedIn | 13.50 | Executive, Enterprise | TERTIARY -- founder posts |
| 8 | YouTube | 12.75 | All tiers, evergreen | TERTIARY -- start with simple demos |
| 9 | TikTok | 11.75 | Awareness, younger audience | TERTIARY -- repurpose only |
| 10 | Email Outreach | 11.63 | Reseller, Enterprise | TERTIARY -- targeted only |

### Priority Tiers

**PRIMARY (start now, consistent effort):**
- Reddit: Daily participation in relevant subreddits. Answer questions, share expertise, link naturally.
- Product Hunt: Plan and execute a high-quality launch. One shot -- make it count.
- X/Twitter: Founder account + company account. Daily posting. Engage with AI/startup community.

**SECONDARY (start within 30 days, build momentum):**
- Hacker News: Plan a "Show HN" post timed with a notable feature or milestone.
- Discord: Join 3-5 relevant servers. Be helpful. Build toward own community server.
- SEO/Content: Start publishing 2-4 blog posts per month on stone-ai.net. Target long-tail keywords.

**TERTIARY (start within 60 days, lower effort):**
- LinkedIn: Founder thought leadership posts 2-3x per week. Company page updates.
- YouTube: Monthly demo videos. Keep production simple -- screen capture + voiceover.
- TikTok: Repurpose YouTube/X content into short clips. No original production needed.
- Email Outreach: Targeted campaigns to agency owners and enterprise prospects only. Low volume.

## Templates & Examples

### Channel Evaluation Update Template
Re-score channels quarterly. Markets shift, algorithms change, new channels emerge.

```
CHANNEL RE-EVALUATION: [Quarter] [Year]
DATE: [YYYY-MM-DD]

Changes since last evaluation:
- [Channel X] score changed from [old] to [new] because [reason]
- [New channel Y] added with score [Z] because [reason]

Updated priority ranking:
1. [Channel] -- [score] -- [priority tier]
2. ...

Recommended action changes:
- [Move channel X from SECONDARY to PRIMARY because...]
- [Deprioritize channel Y because...]
```

### ICP Validation Checklist
Before investing significant effort in any channel, validate ICP presence:

```
CHANNEL: [Name]
DATE CHECKED: [YYYY-MM-DD]

[ ] Our ICP's keywords/topics are actively discussed
[ ] Posts about AI tools get engagement (not just posted into void)
[ ] Users in this channel have buying power (not all students/hobbyists)
[ ] We can participate authentically without feeling forced
[ ] At least 3 competitor presences detected (proves market is here)
[ ] Content format matches what we can produce consistently
```

## DO / DON'T Rules

### DO
- Validate ICP presence on a channel before investing time
- Start with the top 3 channels and expand only when those are working
- Track which channel drives the most signups and paying conversions -- not just traffic
- Re-score quarterly as the platform grows and market conditions change
- Respect each channel's culture -- what works on Reddit will fail on LinkedIn
- Focus on channels where organic (free) participation is viable first

### DON'T
- Never spread effort across all 10 channels simultaneously -- that's how you get mediocre results everywhere
- Never assume a channel works because competitors are there -- they might be wasting money too
- Never ignore a low-scoring channel forever -- scores change as the business grows (LinkedIn becomes more important when targeting Enterprise)
- Never violate channel-specific rules (Reddit self-promotion rules, HN guidelines, CAN-SPAM)
- Never prioritize vanity metrics (followers, likes) over conversion metrics (signups, paid conversions)
- Never spend money on paid ads before exhausting organic options on PRIMARY channels
- Never confuse this analysis with execution -- this seed identifies WHERE, not HOW
