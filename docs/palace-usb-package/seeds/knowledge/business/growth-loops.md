# Growth Loops — Complete Knowledge Seed

## Purpose
This document contains everything a Palace agent needs to understand about sustainable growth loops for Stone AI. Viral mechanics, referral optimization, content loops, paid acquisition, organic growth, and network effects — all applied to a multi-agent AI SaaS.

---

## 1. Understanding Growth Loops vs Funnels

### The Funnel Model (Linear)
Traditional: Awareness → Interest → Consideration → Purchase → Retention.
Problem: It's a one-way street. Each user goes through once. Growth requires constantly refilling the top.

### The Loop Model (Circular)
New concept: Each user's activity generates inputs that attract more users, who generate more inputs.
Example: User joins → uses product → shares result → new user sees it → joins → loop repeats.

Loops compound. Funnels don't. A growth loop with a 10% viral coefficient means every 100 users bring 10 new users, who bring 1, etc. The multiplier effect is why loops are more sustainable than linear acquisition.

### Stone AI's Growth Loops
We need to identify and optimize multiple loops:
1. Viral loop (user shares → new user joins).
2. Content loop (product generates content → content attracts visitors → visitors join).
3. Referral loop (user refers → friend joins → friend refers).
4. Paid loop (revenue funds ads → ads acquire users → users generate revenue).

---

## 2. Viral Loops for AI Products

### What Makes AI Products Shareable?

**Impressive Outputs**
When an AI agent produces something genuinely impressive (a well-crafted email, a debugging solution, a creative piece), the user wants to share it. "Look what this AI did!"
- This is Stone AI's most natural viral mechanism.
- The output is the marketing.

**Surprising Capabilities**
"I didn't know AI could do that" moments drive sharing. When a specialist agent demonstrates unexpected depth, users tell others.
- Engineering surprise: Have agents occasionally offer insights or capabilities users don't expect.
- "The Strategy Agent used the Theory of Constraints to analyze my business. I didn't even know what that was."

**Social Currency**
People share things that make them look smart, informed, or ahead of the curve. Using AI tools is still novel enough that sharing conveys "I'm tech-savvy."
- Frame Stone AI as a tool for smart people: "Smart people use 44 specialists. Everyone else uses one generalist."

### Viral Loop Mechanics for Stone AI

**Loop 1: Share a Conversation**
- User has a valuable conversation with an agent.
- User clicks "Share" → generates a public link to the conversation (read-only).
- Shared link includes a CTA: "Get your own AI specialist team — free."
- Viewer signs up.
- Loop metrics: Share rate (% of conversations shared), click-through rate on shared links, signup rate from shared links.

**Loop 2: Share an Output**
- User asks an agent to write something, solve something, or create something.
- User copies the output and shares it (email, social media, Slack).
- Output includes a subtle watermark or attribution: "Created with Stone AI."
- Recipients are curious, visit Stone AI.
- Loop metrics: Attribution click rate, signup rate.

**Loop 3: Collaborative AI (Future)**
- User invites a collaborator to a shared conversation with an agent.
- Collaborator needs a Stone AI account to participate.
- Collaborator experiences the product through collaboration, then starts using independently.
- Loop metrics: Invite rate, collaborator signup rate, collaborator activation rate.

### Viral Coefficient
```
Viral Coefficient = Average invites per user × Conversion rate of invites
```

- If each user shares 2 conversations/month and 5% of viewers sign up: K = 2 × 0.05 = 0.1.
- K > 1 = exponential growth (rare, requires dedicated viral product design).
- K = 0.2-0.5 = meaningful viral supplement to paid/organic growth.
- K < 0.1 = minimal viral contribution.
- Target for Stone AI: K = 0.2-0.3 initially.

### Optimizing the Viral Loop
1. **Reduce sharing friction.** One-click share. Pre-formatted for different platforms (Twitter, LinkedIn, email).
2. **Make the shared content valuable.** A shared conversation should be interesting to read, not just a raw chat log. Format it.
3. **CTA on shared content must be prominent.** Every shared piece is a landing page. Treat it as one.
4. **Track viral attribution.** Know which users generate the most viral signups. They're your champions.
5. **Don't force sharing.** Forced "share to unlock" mechanics feel manipulative. Sharing should be organic, driven by genuine value.

---

## 3. Referral System Optimization

### Stone AI's Referral System
Current: Users can refer friends. Both parties receive a benefit.

### What Incentives Actually Drive Sharing?

**Monetary Incentives**
- "$10 credit for you and your friend."
- Effective for price-sensitive segments. Less effective for power users who value features over discounts.
- Risk: Attracts referral gamers who create fake accounts. Require referral to be on a paid plan for X days before credit is issued.

**Feature Incentives**
- "Refer a friend, unlock premium backdrop for a month."
- Effective for engaged users who want more from the product.
- Low cost to deliver. High perceived value.

**Status Incentives**
- "Refer 5 friends, earn the 'Ambassador' badge."
- Effective for promoters and community-driven users.
- The OG badge concept could extend to referral milestones.

**Tier Incentives**
- "Refer 3 friends, get a free month of PLUS."
- Strongest incentive. Gives users a taste of a higher tier, which may drive permanent upgrade.

### Optimal Incentive Structure
Research suggests two-sided incentives (both referrer and referee get something) outperform one-sided by 2-3x.

Recommended for Stone AI:
- **Referrer**: 1 free month of their current tier (or upgrade trial for 1 month).
- **Referee**: $10 off first month of any paid plan.
- **Milestone bonuses**: 5 referrals = OG Referrer badge. 10 = permanent 10% discount. 25 = lifetime free month annually.

### Referral Funnel
1. **Awareness**: User knows referral program exists. (Target: 80% of paid users aware.)
2. **Intent**: User decides to refer. (Target: 30% of aware users intend.)
3. **Action**: User shares referral link. (Target: 50% of intending users share.)
4. **Click**: Referee clicks the link. (Target: 30% of shared links clicked.)
5. **Signup**: Referee creates account. (Target: 40% of clickers sign up.)
6. **Conversion**: Referee becomes paid. (Target: 15% of referee signups.)

### Referral Program Metrics
- **Referral rate**: % of users who refer at least once.
- **Shares per referrer**: Average number of shares per active referrer.
- **Referral conversion rate**: % of referred visitors who become paid users.
- **Referral LTV**: LTV of referred users vs organic users (referred users typically have 15-25% higher LTV).
- **Referral payback**: Cost of referral incentives / Revenue from referred users.

### Referral Timing
When to prompt referrals:
- After a positive experience (great agent response, problem solved, milestone reached).
- Not during onboarding (too early — they don't love the product yet).
- After 2+ weeks of active use (they have enough experience to recommend genuinely).
- After an upgrade (they just committed — they're feeling positive).
- Never after a support ticket or bug (they're not in a referring mood).

---

## 4. Content Loops

### User-Generated Content That Attracts New Users

**Forum as SEO Content**
- Forum discussions about AI use cases, agent tips, and problem-solving become indexable pages.
- User asks "How do I use AI to write a business plan?" → Discussion with agent-powered answers → Google indexes it → New users find it.
- Each quality Forum thread is a long-tail SEO landing page.

**Agent Outputs as Marketing**
- With permission, showcase anonymized agent outputs. "Here's what our Strategy Agent produced for a real user's pricing problem."
- Blog format: "We asked our Code Agent to review a GitHub repository. Here's what it found."
- These demonstrate capability better than any marketing copy.

**User Stories**
- Encourage users to share how they use Stone AI. Feature these stories on the blog, social media, and in the product.
- User stories are authentic social proof. They convert better than company-written marketing.

### Content Loop Mechanics
1. Users interact with agents → produce valuable content.
2. Content is shared (Forum, social media, blog).
3. Content is indexed by search engines.
4. New users discover content through search or social.
5. New users sign up to get similar value.
6. New users produce their own content.
7. Loop repeats.

### Content Loop Optimization
- Make Forum posts publicly indexable (not behind a login wall).
- Add structured data (schema markup) to Forum posts for better search visibility.
- Encourage long-form, detailed Forum posts (better for SEO than short comments).
- Regularly feature the best user stories and Forum threads in marketing.
- Create "evergreen" content that remains relevant: "How to use AI for [common task]."

---

## 5. Paid Acquisition Fundamentals

### CAC Targets
Based on financial-modeling.md analysis:
- Maximum CAC for healthy economics: $100 (given ~$1,000 blended LTV at 3:1 minimum).
- Ideal CAC: $50-70.
- CAC by channel varies — allocate budget to lowest-CAC channels first.

### Channel Selection

**Google Ads (Search)**
- Target keywords: "AI assistant," "AI writing tool," "AI coding help," "best AI chatbot."
- Pros: High intent (people searching for AI tools want one). Measurable.
- Cons: Competitive keywords are expensive ($2-10/click). CAC can be high.
- Strategy: Focus on long-tail keywords: "AI agent for business strategy" instead of "AI chatbot."

**Social Media Ads (Meta, LinkedIn)**
- Target audiences: Tech workers, entrepreneurs, content creators, developers.
- Pros: Targeting precision. Visual/video formats showcase the product.
- Cons: Lower intent (people aren't searching for you — you're interrupting). Higher creative requirements.
- Strategy: Use short demo videos showing agent switching. "Watch our Code Agent debug this code in 30 seconds."

**Reddit**
- Subreddits: r/artificial, r/ChatGPT, r/SaaS, r/startups, r/webdev.
- Pros: Highly engaged, tech-savvy audience. Organic promotion is possible.
- Cons: Reddit hates obvious self-promotion. Must provide genuine value.
- Strategy: Be helpful in relevant threads. Reference Stone AI naturally when it genuinely solves the user's question. Build reputation before promoting.

**YouTube**
- Content: Tutorials, agent demos, comparison videos.
- Pros: Long-form content demonstrates value deeply. Evergreen SEO.
- Cons: Production effort. Slow to build audience.
- Strategy: Create "Stone AI vs ChatGPT for [specific task]" comparison videos. These attract searchers comparing tools.

**Twitter/X**
- Content: Short demos, agent output highlights, founder story.
- Pros: Tech/AI audience is large and engaged.
- Cons: Organic reach is declining. Paid ads are variable quality.
- Strategy: Share impressive agent outputs with context. Build a following around AI productivity.

### Attribution
Track which channel each user came from:
- UTM parameters on all marketing links.
- Referral source in analytics.
- First-touch vs last-touch attribution (first-touch = what made them aware; last-touch = what made them sign up).
- For a solo founder, keep attribution simple. Know which channels are working; don't over-complicate.

### Paid Acquisition Budget Allocation
- Start with $500-1,000/month total across channels.
- Split: 40% Google Ads, 30% Social, 20% Content/SEO investment, 10% Experimental.
- Run each channel for 30 days minimum before evaluating.
- Kill channels with CAC > $150 after 60 days. Double down on channels with CAC < $50.
- Reinvest revenue into acquisition: Target spending 20-30% of MRR on acquisition.

---

## 6. Organic Growth

### SEO for AI Tools

**Keyword Strategy**
Target three types of keywords:
1. **Tool queries**: "AI writing assistant," "AI code debugger," "AI business advisor."
2. **Problem queries**: "how to write a business plan," "how to debug Python code," "how to create marketing copy."
3. **Comparison queries**: "best AI chatbot 2026," "ChatGPT alternatives," "AI tools for entrepreneurs."

**Content Strategy**
- Create pages/blog posts targeting each keyword cluster.
- Each page should demonstrate Stone AI's capability for that specific query.
- Include a CTA to try the relevant agent free.
- Example: Blog post "How to Write a Business Plan with AI" → walks through using the Strategy Agent → CTA: "Try the Strategy Agent free."

**Technical SEO**
- Fast page loads (Vercel handles this well).
- Proper meta tags, titles, descriptions for every page.
- Structured data for FAQ sections.
- Sitemap and robots.txt properly configured.
- Mobile-responsive (Google's mobile-first indexing).
- Cloudflare CDN helps with global performance.

### Community Building

**Forum as Community Hub**
- Active Forums attract and retain users.
- Encourage regular discussions, challenges, and tip-sharing.
- Moderator presence (eventually community-driven moderation).

**Social Media Community**
- Consider a Discord server or Telegram group for Stone AI users.
- Community channels where users help each other, share tips, and provide feedback.
- Lower support burden (users help users).

**Events and Challenges**
- "Agent Challenge: Write the best marketing copy using Stone AI. Share your result."
- "Weekly prompt contest: Best conversation with an agent wins a free month."
- These drive engagement, content creation, and sharing.

### Thought Leadership
- The founder's personal brand is a growth engine.
- Share insights about building an AI product, running a SaaS, and solo founding.
- Twitter threads, blog posts, podcast appearances.
- Authentic founder story attracts sympathetic users.
- "I built a 44-agent AI platform as a solo founder. Here's what I learned."

---

## 7. Network Effects

### Do More Users Make Stone AI Better?

**Direct Network Effects**
- Do more users improve the product for other users? In pure AI chat, not really — each user's experience is independent.
- However: Forum activity is a network effect. More users = more Forum content = more value for each Forum user.
- Bestie doesn't have network effects (it's personal, not shared).

**Indirect Network Effects**
- More users = more data on what agents struggle with = better system prompts = better product for everyone.
- More users = more revenue = more investment in model quality and new agents = better product.
- More users = more referrals = more users (flywheel).

**Data Network Effects**
- Aggregated (anonymized) usage patterns can inform agent improvement. Which prompts succeed? Which fail? This data improves quality.
- But this requires careful privacy handling. Never use individual conversation content.

### Building Network Effects into Stone AI

**Forum Network Effect** (strongest)
- Every new Forum user adds content. Every piece of content adds value. Classic network effect.
- Critical mass: Forum needs ~50-100 active participants to be self-sustaining. Below that, it feels empty.
- Strategy: Seed the Forum heavily at launch. Drive initial participation through incentives.

**Community Knowledge Base**
- User-submitted tips, prompts, and agent configurations.
- Each contribution makes the platform more valuable.
- "Community Prompts: See how other users get the best from the Code Agent."

**Referral Network Effect**
- Users who refer friends are more retained (they've put social capital on the line).
- Referred users retain better (they have a trusted recommendation).
- Each referral strengthens the network.

### Network Effect Measurement
- **Forum**: Posts per week, unique contributors per week, answers per question.
- **Referral**: Viral coefficient, referral rate, referral conversion.
- **Data improvement**: Agent quality scores over time (are they improving as user count grows?).

---

## 8. Growth Loop Prioritization

### Which Loop to Focus On First?

**Stage 1: Pre-1,000 Users — Organic + Manual**
- No budget for paid acquisition. Focus on organic.
- SEO content targeting long-tail queries.
- Founder-led social media (Twitter/X, Reddit, LinkedIn).
- Direct outreach (comment on relevant threads, participate in AI discussions).
- Every user at this stage is hand-acquired.

**Stage 2: 1,000-10,000 Users — Referral + Content**
- Enough users to make referral loops work.
- Launch and optimize referral program.
- Scale content production (blog posts, tutorials, videos).
- Forum starts becoming self-sustaining.
- Begin testing paid acquisition on one channel.

**Stage 3: 10,000-100,000 Users — Paid + Viral + Content**
- Revenue supports meaningful paid acquisition budget.
- Scale paid channels that showed positive CAC.
- Optimize viral loops (sharing, conversation links, attribution watermarks).
- Content loops compound (SEO traffic grows).
- Community effects strengthen.

**Stage 4: 100,000+ Users — All Loops Compounding**
- Multiple loops running simultaneously.
- Paid acquisition is efficient and scalable.
- Viral coefficient contributes meaningful growth.
- Organic/SEO drives steady baseline.
- Community and network effects create defensibility.

### The Growth Accounting Equation
```
New Users This Month = Paid Acquisition + Organic + Referral + Viral + Reactivation
```

Track each channel's contribution. Healthy distribution:
- No single channel > 50% of new users (channel dependency risk).
- Organic + Referral + Viral combined > Paid (sustainable growth).
- Reactivation = bonus (win-backs contribute but aren't primary).

---

## 9. Growth Experiments

### Experiment Framework
1. **Hypothesis**: "If we [change X], then [metric Y] will [improve/decrease] by [Z%]."
2. **Metric**: The specific metric being measured.
3. **Duration**: How long to run the experiment.
4. **Sample size**: How many users/impressions needed for significance.
5. **Success criteria**: What result constitutes a win.
6. **Implementation**: What exactly to change.
7. **Measurement**: How to track the result.

### Growth Experiment Ideas for Stone AI

**Experiment 1: Shareable Conversation Links**
- Hypothesis: If users can share conversation links with one click, sharing rate increases 50%.
- Metric: Shares per active user per month.
- Duration: 30 days.
- Success: Sharing rate goes from X to 1.5X.

**Experiment 2: Referral Incentive A/B Test**
- Hypothesis: A free month of current tier drives 2x more referrals than $10 credit.
- Metric: Referrals per participating user.
- Duration: 60 days.
- Success: Tier-month incentive produces 2x referral volume.

**Experiment 3: SEO Blog Launch**
- Hypothesis: 10 targeted blog posts will generate 500 organic visits/month within 90 days.
- Metric: Organic search traffic to blog posts.
- Duration: 90 days.
- Success: 500+ organic visits/month from blog content.

**Experiment 4: Forum SEO Indexing**
- Hypothesis: Making Forum posts publicly indexable increases organic traffic by 30%.
- Metric: Organic search traffic.
- Duration: 60 days.
- Success: 30%+ increase in organic traffic.

**Experiment 5: Agent Output Watermark**
- Hypothesis: Adding "Created with Stone AI" to exported agent outputs drives 100 visits/month.
- Metric: Attribution link clicks.
- Duration: 60 days.
- Success: 100+ visits from watermark links.

---

## 10. Quick Reference: Growth Loop Summary

| Loop | Type | Cost | Timeline | Defensibility |
|------|------|------|----------|---------------|
| Referral | Viral | Low (incentive cost) | Medium (needs user base) | High (trust-based) |
| Share Conversation | Viral | Very Low (feature cost) | Short (build once) | Medium |
| Forum Content | Content/SEO | Low (user-generated) | Long (SEO takes months) | High (accumulates) |
| Blog/SEO | Content | Medium (creation time) | Long (3-6 months) | High (compounds) |
| Social Media | Organic | Low (time investment) | Medium | Low (algorithm-dependent) |
| Google Ads | Paid | High (direct spend) | Immediate | Low (stops when spend stops) |
| Social Ads | Paid | High (direct spend) | Immediate | Low |
| Community | Network Effect | Medium (time to build) | Long | Very High (hard to replicate) |

### The Golden Rule of Growth
Sustainable growth comes from a product people want to use and tell others about. No growth hack, ad campaign, or viral mechanic compensates for a product that doesn't deliver value. Get the product right first. Then amplify with loops.
