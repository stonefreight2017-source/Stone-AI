# Customer Segmentation — Complete Knowledge Seed

## Purpose
This document contains everything a Palace agent needs to segment Stone AI's user base by behavior, identify high-value segments, and tailor messaging and product decisions to each segment. Behavioral segmentation, not demographic.

---

## 1. Why Behavioral Segmentation, Not Demographic

### The Problem with Demographics
- "25-34 year old male in tech" tells you nothing about how they use your product.
- Two users with identical demographics can have completely different usage patterns, needs, and willingness to pay.
- Demographic segmentation works for mass-market consumer goods. For SaaS, it's nearly useless.

### Behavioral Segmentation Advantage
- Group users by what they DO, not who they ARE.
- Actions predict outcomes: a user who chats daily will behave differently than one who chats weekly, regardless of age, gender, or location.
- Behavioral segments are actionable. You can't change someone's demographics, but you can influence their behavior.

---

## 2. Behavioral Segments for Stone AI

### Segment 1: The Explorer
**Behavior**: Tries many agents, short conversations with each, frequent agent switching.
**Profile**: Curious, evaluating the product, hasn't found their primary use case yet.
**Tier tendency**: FREE or STARTER. Exploring before committing.
**Churn risk**: Medium. They might conclude "interesting but not essential."
**Strategy**: Help them find their "home agent" — the one that becomes indispensable. Feature discovery nudges. "You've tried 6 agents — users who find their favorite typically stay. Which one solved a real problem for you?"
**Conversion path**: Explorers convert when they find a paid agent they love. Show them previews of locked agents.

### Segment 2: The Specialist
**Behavior**: Uses 1-2 agents repeatedly, long conversations, same topic.
**Profile**: Has a clear use case (coding, writing, business). Stone AI = a specific tool for a specific job.
**Tier tendency**: STARTER or PLUS. Willing to pay for the agent they need.
**Churn risk**: Low if their agent is good. High if a competitor does their niche better.
**Strategy**: Make their primary agent excellent. Push depth, not breadth. Offer advanced features within that agent's domain. "You've sent 200 messages to the Code Agent — try its advanced debugging mode."
**Conversion path**: Specialists upgrade when they need a higher-tier agent that serves their niche. Or when model quality (SMART tier) noticeably improves their primary agent's output.

### Segment 3: The Power User
**Behavior**: High volume, many agents, long sessions, frequent visits. Uses advanced features.
**Profile**: Stone AI is integrated into their daily workflow. They'd notice immediately if it were gone.
**Tier tendency**: PLUS, SMART, or PRO. High willingness to pay.
**Churn risk**: Very low. High switching costs due to workflow integration.
**Strategy**: Don't mess with their experience. Stability, speed, and quality are paramount. Invite them to beta test new features. Ask for feedback. Make them feel like insiders.
**Conversion path**: Power users upgrade for completeness (PRO) or model quality (SMART). They rarely need convincing — they upgrade when the value is clear.

### Segment 4: The Bestie User
**Behavior**: Primary interaction is with Bestie. Less agent usage, more companion conversation.
**Profile**: Values emotional connection over functional utility. May use Stone AI as a social/emotional outlet.
**Tier tendency**: Any tier — Bestie users exist at every price point.
**Churn risk**: Low (highest retention segment) — but fragile. If Bestie breaks or resets, churn is immediate and emotional.
**Strategy**: Protect Bestie quality and continuity above all. Never break Bestie state. Gradually introduce agent usage: "Your Bestie thinks you'd enjoy chatting with the Creative Agent. Give it a try?"
**Conversion path**: Bestie users upgrade when higher tiers offer better Bestie features (more memory, deeper personalization, richer interactions).

### Segment 5: The Ghost
**Behavior**: Signed up, used it once or twice, disappeared.
**Profile**: Didn't find value fast enough. Bad first experience, wrong expectations, or just tried it out of curiosity.
**Tier tendency**: FREE. Never converted.
**Churn risk**: Already churned (inactive).
**Strategy**: Win-back sequence. Identify why they left (exit data, first-session behavior). Send targeted re-engagement based on what they tried: "Last time you asked about [topic] — we've improved our [Agent] since then."
**Conversion path**: Ghosts require reactivation before conversion. Most won't return. Focus effort on the 10-15% who might.

### Segment 6: The Promoter
**Behavior**: Active user who also engages with Forum, refers friends, writes positive feedback.
**Profile**: Genuinely loves the product. Advocates voluntarily.
**Tier tendency**: PLUS or SMART. Invested enough to evangelize.
**Churn risk**: Very low. Emotional investment in the product's success.
**Strategy**: Reward them. Referral bonuses, exclusive access, recognition (OG badge, Forum moderator status). Ask for testimonials. Feature their stories.
**Conversion path**: Already paying. Optimize for referrals, not upgrades.

### Segment 7: The Price Shopper
**Behavior**: Signed up during a promo. High initial usage, drops off when price normalizes.
**Profile**: Motivated by deals. Will leave for a cheaper alternative.
**Tier tendency**: STARTER (promo entry). Won't move to higher tiers without incentive.
**Churn risk**: High — especially at month 2 when promo ends.
**Strategy**: Deliver overwhelming value during the promo period. Convert to annual before the promo ends. If they do churn, don't win them back with another discount (trains bad behavior). Win them back with value.
**Conversion path**: Price shoppers upgrade only if the perceived value dramatically exceeds the price. Rare. Focus on retaining them at entry tier.

---

## 3. RFM Analysis

### The Framework
RFM = Recency × Frequency × Monetary

Originally from retail/direct marketing, adapted for SaaS subscriptions.

- **Recency**: How recently did the user last engage? (More recent = higher score)
- **Frequency**: How often do they engage? (More frequent = higher score)
- **Monetary**: How much do they spend? (Higher tier = higher score)

### RFM Scoring for Stone AI

**Recency (1-5)**
- 5: Active today.
- 4: Active in last 3 days.
- 3: Active in last 7 days.
- 2: Active in last 14 days.
- 1: Not active in 14+ days.

**Frequency (1-5)**
- 5: Daily user (7+ sessions/week).
- 4: Regular user (4-6 sessions/week).
- 3: Moderate user (2-3 sessions/week).
- 2: Occasional user (1 session/week).
- 1: Rare user (<1 session/week).

**Monetary (1-5)**
- 5: PRO ($200/month).
- 4: SMART ($99.99/month).
- 3: PLUS ($49.99/month).
- 2: STARTER ($19.99/month).
- 1: FREE ($0).

### RFM Segment Actions

**High R, High F, High M (5,5,5 — Best Customers)**
- Your VIPs. Treat them like gold.
- Actions: White-glove support, beta access, referral incentives, personal thank-you.

**High R, High F, Low M (5,5,1-2 — Engaged but Cheap)**
- They love the product but won't pay (much).
- Actions: Upgrade nudges. Show them what they're missing. "You use Stone AI daily — imagine what PLUS agents could do for you."

**High R, Low F, High M (5,2,4-5 — Paying but Disengaged)**
- They pay but don't use it much. Churn risk when they review their subscriptions.
- Actions: Engagement campaigns. Value reports showing what they could be getting. Feature discovery.

**Low R, High F (historical), Any M (1-2, 4-5, any — Lapsed Power Users)**
- Were very active, now gone. High value if recovered.
- Actions: Priority win-back. Personal outreach. "We miss you. What happened?"

**Low R, Low F, Low M (1,1,1 — Ghosts)**
- Never engaged, never paid. Low priority.
- Actions: One automated win-back email. If no response, remove from active outreach.

### RFM Implementation
1. Score each user on R, F, M.
2. Update scores weekly.
3. Segment users into groups based on combined score.
4. Automate actions for each segment (email campaigns, in-app prompts, support priority).
5. Review segment sizes monthly. Growing "Ghost" segment = acquisition problem. Shrinking "VIP" segment = retention problem.

---

## 4. Power User Identification

### What Defines a Power User in Stone AI?

**Quantitative Indicators**
- Sessions per week: 5+ (daily usage).
- Messages per session: 10+ (deep engagement).
- Agents used per week: 3+ (breadth of usage).
- Feature adoption: Uses Bestie, Forum, settings customization.
- Session duration: 15+ minutes average.
- Tenure: 60+ days active.

**Qualitative Indicators**
- Sends complex, multi-step queries (not just "what is X?").
- Uses agent switching strategically (asks one agent, then refines with another).
- Provides feedback (Forum posts, support suggestions, survey responses).
- Refers others.

### Power User Threshold
A user is a "power user" if they meet 4+ of these 6 criteria:
1. 5+ sessions/week.
2. 10+ messages/session average.
3. 3+ agents used/week.
4. Bestie active.
5. 60+ day tenure.
6. Forum participation.

### Why Power Users Matter
- Power users generate the most direct revenue (tend to be on higher tiers).
- Power users generate indirect revenue through referrals and testimonials.
- Power users provide the best product feedback (they know the product deeply).
- Power users define the ideal customer profile for acquisition targeting.
- Losing a power user hurts more than losing 5 casual users.

### Serving Power Users
1. **Don't slow them down.** Speed, reliability, and consistency matter most to them.
2. **Give them depth.** Advanced features, keyboard shortcuts, conversation management.
3. **Listen to them.** Their feature requests are informed by deep usage.
4. **Reward them.** Beta access, recognition, exclusive features.
5. **Don't force them through experiences designed for newbies.** Skip onboarding, allow customization, respect their expertise.

---

## 5. Persona-to-Tier Mapping

### Which Persona Belongs on Which Tier?

**FREE Tier Personas**
- The Curious: Trying AI for the first time. Doesn't know if they need it.
- The Casual: Uses AI occasionally for simple questions. Not willing to pay.
- The Evaluator: Testing Stone AI against competitors. Will upgrade or leave.

**STARTER ($19.99) Personas**
- The Hobbyist: Uses AI regularly for personal projects. $20/month is their budget.
- The Student: Needs AI help for learning/studying. Price-sensitive.
- The Experimenter: Past the evaluation phase, committed enough to pay, but not yet a power user.

**PLUS ($49.99) Personas**
- The Professional Lite: Uses AI for work but not as a primary tool. 30 agents cover their needs.
- The Multi-Tasker: Needs breadth across many domains (writing, coding, strategy, research).
- The Bestie Lover: Upgraded partly for enhanced Bestie features.

**SMART ($99.99) Personas**
- The Quality Seeker: Needs the best AI output. Claude Sonnet's quality is worth the premium.
- The Professional: Uses Stone AI as a core work tool. ROI is clear.
- The Optimizer: Willing to pay more for better results. Values quality over price.

**PRO ($200) Personas**
- The Completionist: Wants everything. Doesn't want to hit any ceiling ever.
- The Business User: Expenses it. $200/month is trivial for a business tool used daily.
- The Advocate: Loves Stone AI enough to buy the top tier. Brand loyalty.

### Marketing Implications
- Target FREE tier marketing at Curious and Evaluator personas: "Try it free. No risk."
- Target STARTER marketing at Hobbyists and Students: "Less than a dollar per specialist."
- Target PLUS marketing at Professionals and Multi-Taskers: "Every expert you need. One plan."
- Target SMART marketing at Quality Seekers: "Premium AI. Premium answers."
- Target PRO marketing at Business Users: "The complete AI team. $200/month."

---

## 6. Segment-Specific Messaging

### How to Talk to Each Segment Differently

**Explorers**
- Tone: Encouraging, guiding.
- Message: "You've discovered 4 agents — 40 more are waiting."
- CTA: Feature discovery, not upgrade.
- Channel: In-app tooltips, guided tours.

**Specialists**
- Tone: Respectful of their expertise, additive.
- Message: "Your go-to agent just got better. Here's what's new."
- CTA: Deeper features within their preferred agent.
- Channel: In-app notifications, targeted email.

**Power Users**
- Tone: Peer-to-peer, insider.
- Message: "You're one of our top users. Here's early access to [feature]."
- CTA: Beta access, feedback requests.
- Channel: Direct email, in-app banner.

**Bestie Users**
- Tone: Warm, personal.
- Message: "Your Bestie has a new capability — [feature]."
- CTA: Bestie interaction.
- Channel: Push notification, in-app.

**Ghosts**
- Tone: Light, no pressure.
- Message: "It's been a while. We've improved since your last visit."
- CTA: Return to product.
- Channel: Email only (they're not in the app).

**Promoters**
- Tone: Grateful, empowering.
- Message: "Your friends get $10 off and you get a month free."
- CTA: Refer a friend.
- Channel: Email, in-app referral widget.

**Price Shoppers**
- Tone: Value-focused, not discount-focused.
- Message: "Here's what your $19.99 saved you this month: [value report]."
- CTA: Demonstrate value, not discounts.
- Channel: Email, in-app value report.

---

## 7. Champion Identification

### What Is a Champion?
A champion is a user who actively promotes your product to others. They're your unpaid sales team. Identifying and nurturing them is one of the highest-ROI activities.

### Champion Indicators
1. **Referral activity**: Has referred 1+ users (strongest signal).
2. **Forum posting**: Creates content that helps other users.
3. **Positive feedback**: Writes positive support tickets, survey responses, or reviews.
4. **High NPS score**: Rates 9-10 on "How likely are you to recommend Stone AI?"
5. **Social sharing**: Mentions Stone AI on social media.
6. **Long tenure + high engagement**: Been a consistent user for 3+ months.

### Champion Scoring
Score each user 0-100 based on champion indicators:
- Referral sent: +30 points.
- Forum post created: +10 points per post (max 50).
- Positive feedback submitted: +15 points.
- NPS 9-10: +20 points.
- Social mention: +15 points.
- 3+ months active: +10 points.

**70+**: Active champion. Nurture and reward.
**40-69**: Potential champion. Encourage champion behaviors.
**Below 40**: Not a champion (yet). Focus on making them a satisfied user first.

### Nurturing Champions
1. **Recognize them.** OG badges, Forum moderator roles, public thank-yous.
2. **Reward referrals.** Free months, tier upgrades, exclusive features.
3. **Give them insider access.** Beta features, product roadmap previews, founder emails.
4. **Ask for their input.** Feature requests from champions are worth 10x random requests.
5. **Feature their stories.** Testimonials, case studies, community spotlights.
6. **Never take them for granted.** A neglected champion becomes a detractor faster than any other segment.

### Champion-Driven Growth Math
- Average champion refers 2-3 users per year.
- Referred users convert at 2-3x the rate of organic signups.
- If 5% of paid users are champions (50 out of 1,000), that's 100-150 referrals per year.
- At 2-3x conversion rate, that's 6-15+ new paid users from referrals alone.
- Champions also reduce acquisition cost: referral acquisition cost ≈ $0 vs paid acquisition cost of $20-100+.

---

## 8. Segmentation Infrastructure

### Data Needed
To segment users effectively, you need:
1. Login timestamps (recency).
2. Session counts and durations (frequency).
3. Message counts per session (depth).
4. Agent interaction logs (breadth, which agents, switching patterns).
5. Bestie interaction logs (Bestie engagement).
6. Forum activity (posts, comments).
7. Billing tier and history (monetary).
8. Referral activity.
9. Support ticket history.
10. Feature usage logs (which features discovered and used).

### Segmentation Update Frequency
- **Real-time**: Health score, churn risk score (for immediate interventions).
- **Daily**: RFM scores, engagement metrics.
- **Weekly**: Segment assignment (users can move between segments).
- **Monthly**: Segment size analysis, champion scoring, cohort analysis.

### Segmentation Pitfalls
1. **Over-segmenting.** 20 segments with 10 users each isn't useful. Keep it to 5-8 behavioral segments.
2. **Static segments.** Users change behavior. Re-segment regularly.
3. **Ignoring segment overlap.** A user can be a Specialist AND a Promoter. Handle overlap in messaging priority.
4. **Segment-based discrimination.** Don't give worse product experience to lower-value segments. Improve the product for everyone, message differently.
5. **Analysis paralysis.** Segmentation is a tool for action, not an end in itself. If you're not changing behavior based on segments, the segmentation is wasted.

---

## 9. Quick Reference: Segment Action Matrix

| Segment | Priority | Primary Action | Upgrade Path | Churn Risk |
|---------|----------|---------------|-------------|------------|
| Explorer | Medium | Guide to home agent | Show locked agents | Medium |
| Specialist | High | Deepen their niche | Model quality (SMART) | Low |
| Power User | Highest | Stability + insider access | PRO completeness | Very Low |
| Bestie User | High | Protect Bestie quality | Better Bestie features | Low |
| Ghost | Low | One win-back attempt | Reactivate first | Already gone |
| Promoter | Highest | Referral incentives | Already paying | Very Low |
| Price Shopper | Low | Value demonstration | Annual lock-in | High |
