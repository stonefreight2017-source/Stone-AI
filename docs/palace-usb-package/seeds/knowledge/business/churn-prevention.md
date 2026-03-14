# Churn Prevention — Complete Knowledge Seed

## Purpose
This document contains everything a Palace agent needs to understand about preventing, predicting, and recovering from customer churn in SaaS. Applied specifically to Stone AI's subscription model, multi-agent platform, and Bestie companion system.

---

## 1. Understanding Churn

### What Is Churn?
Churn is the rate at which customers stop paying for your product. In subscription SaaS, it's the most important metric after revenue because it determines whether you grow or shrink.

### Types of Churn

**Voluntary Churn (Active Cancellation)**
- The user deliberately cancels. They decided the product isn't worth the price.
- Causes: insufficient value, found a better alternative, budget cuts, subscription fatigue, poor experience.
- This is the harder type to prevent because it reflects a value judgment.

**Involuntary Churn (Passive/Failed Payment)**
- The user's payment fails and they drop off without intending to cancel.
- Causes: expired credit card, insufficient funds, bank fraud blocks, payment processor errors.
- This is easier to prevent with dunning (payment retry) systems.
- Involuntary churn accounts for 20-40% of total churn in most SaaS products. This is low-hanging fruit.

**Revenue Churn vs Logo Churn**
- Logo churn: % of customers who leave.
- Revenue churn: % of revenue lost (including downgrades).
- A PRO user ($200/month) who downgrades to SMART ($99.99/month) doesn't cause logo churn but causes $100.01/month in revenue churn.
- Track both. Revenue churn is more important for financial health. Logo churn is more important for understanding product satisfaction.

### Churn Math
```
Monthly Churn Rate = Customers lost this month / Customers at start of month × 100
Annual Churn Rate ≈ 1 - (1 - Monthly Rate)^12
```

Example:
- 1,000 customers on Jan 1. 50 cancel in January. Monthly churn = 5%.
- Annual churn ≈ 1 - (0.95)^12 = 46%. Nearly half your customers gone in a year.
- This demonstrates why even "small" monthly churn is devastating annually.

### Churn Benchmarks for AI SaaS
- **Excellent**: <3% monthly (31% annual).
- **Good**: 3-5% monthly (31-46% annual).
- **Concerning**: 5-7% monthly (46-58% annual).
- **Critical**: >7% monthly (>58% annual).
- B2C products (like Stone AI at consumer/prosumer tier) typically have higher churn than B2B enterprise.
- Target for Stone AI: <5% monthly for paid tiers, with annual subscribers churning at <2% monthly.

---

## 2. Churn Signals — Early Detection

### Usage Frequency Drops
The single strongest churn predictor. Track each user's rolling average usage and flag significant drops.

**Signal: Session frequency decline**
- User went from daily → every other day → weekly → gone.
- The transition from "every other day" to "weekly" is the critical moment. By the time they're weekly, they're halfway out.
- Detection: Compare this week's sessions to the 4-week rolling average. If below 50% of average, flag.

**Signal: Session duration decline**
- User went from 20-minute sessions to 5-minute sessions.
- Shorter sessions mean less engagement, less value extraction, less habit strength.
- Detection: Track median session duration per user per week.

**Signal: Feature usage narrowing**
- User used to interact with 5 agents, now only uses 1.
- Narrowing means they're not finding value across the product — only in one corner.
- Detection: Track unique agents used per user per week.

### Feature Abandonment
When a user stops using a feature they previously used regularly, something went wrong with that feature or their need for it.

**Signal: Bestie abandonment**
- User set up Bestie, chatted actively for 2 weeks, then stopped.
- This is a strong churn predictor because Bestie engagement is the stickiest feature. If they're leaving Bestie, they're leaving the product.
- Detection: Bestie interaction = 0 for 7+ days after previous daily use.

**Signal: Forum disengagement**
- User was an active Forum participant, then went silent.
- Community disengagement often precedes product disengagement.
- Detection: Forum posts/comments dropped to 0 for 14+ days.

### Support Ticket Patterns
- **Increasing frequency**: User who never needed support is now filing tickets weekly. They're frustrated.
- **Tone shift**: Polite inquiry → frustrated demand → resigned complaint. Track sentiment in tickets.
- **Unresolved tickets**: Open tickets without resolution erode trust. Every unresolved ticket is a churn risk multiplier.
- **The silence signal**: Sometimes the most dangerous signal is no signal. A frustrated user who stops complaining has given up and will silently cancel.

### Payment Method Expiration
- Predictable involuntary churn risk. Credit cards expire. Track expiration dates.
- Send reminders 30, 14, and 7 days before expiration: "Your card ending in 1234 expires next month. Update your payment method to keep your Stone AI subscription active."
- This alone can reduce involuntary churn by 20-30%.

### Login Pattern Changes
- Time of day shifts: User used to log in mornings (productive use), now logs in late nights (boredom browsing). Usage pattern change signals changing relationship with product.
- Platform shifts: User switched from desktop to mobile. Mobile sessions are typically shorter and less engaged.
- Frequency cliff: Abrupt stop (0 logins for 5+ days) after regular use is a stronger signal than gradual decline.

---

## 3. Involuntary Churn Recovery

### Dunning: Payment Retry Logic

Dunning is the process of retrying failed payments and communicating with users about payment issues. It's the single highest-ROI churn reduction investment.

**Retry Schedule (Best Practice)**
- Day 0: Payment fails. Retry immediately (sometimes a temporary bank issue).
- Day 1: Retry. Send email #1: "Your payment didn't go through. No action needed — we'll try again."
- Day 3: Retry. Send email #2: "We're still having trouble with your payment. Update your card to keep your access."
- Day 5: Retry. Send email #3 (urgency): "Your Stone AI subscription is at risk. Update your payment method now to avoid losing access to your [X] agents and Bestie."
- Day 7: Final retry. Send email #4 (final): "This is your last chance to update your payment. Your subscription will be paused tomorrow."
- Day 8: Pause subscription (don't cancel — pause). Send email: "Your subscription has been paused. Your data and Bestie are safe. Reactivate anytime."

**Why Pause, Not Cancel**
- Pausing preserves the user's data, settings, and Bestie configuration. If they reactivate, they return to their familiar environment.
- Canceling feels final. Pausing feels temporary. Users are more likely to return from a pause.
- Paused users should retain read-only access or be downgraded to FREE tier while paused.

**Email Best Practices for Dunning**
- Never use scary subject lines. "PAYMENT FAILED" triggers anxiety and avoidance.
- Use helpful, calm language: "Quick update about your billing" or "We need your help with something."
- Include a one-click link to update payment. Don't make them log in, navigate to settings, find billing, etc.
- Show what they'll lose: "Your SMART tier includes 39 agents and Bestie access." Make the loss tangible.

### Payment Recovery Rates
- With no dunning: 0% recovery (users don't know their payment failed).
- With basic dunning (one email): 15-25% recovery.
- With optimized dunning (4 emails + smart retry): 40-60% recovery.
- With dunning + in-app notification: 50-70% recovery.
- The difference between no dunning and optimized dunning can represent 10-15% of total revenue.

### Smart Retry Timing
- Retry on different days of the week. If the first attempt was Monday and failed, try Thursday (payday for many people).
- Retry at different times of day. Some banks process transactions at specific times.
- Retry on the 1st and 15th of the month (common paycheck dates).

---

## 4. Win-Back Sequences

### Timing: When to Win Back
- **Day 1-7 after cancellation**: Too soon. Respect their decision. Don't email.
- **Day 7-14**: First win-back attempt. Light touch.
- **Day 14-30**: Second attempt. Show what's new.
- **Day 30-60**: Third attempt. Offer incentive.
- **Day 60-90**: Final attempt. Strong incentive.
- **After 90 days**: Move to cold re-marketing list. They're essentially a new prospect now.

### Win-Back Email Sequence

**Email 1 (Day 7-14): The Check-In**
```
Subject: How's everything going?
Body: Hey [Name], we noticed you cancelled your Stone AI subscription.
No hard feelings — but we'd love to know if there's anything we could have done better.
If you have 30 seconds, hit reply and let us know. Your feedback helps us improve.
[Optional: link to feedback form]
```

**Email 2 (Day 14-30): The Update**
```
Subject: Here's what's new at Stone AI
Body: Since you left, we've [added new agent / improved feature / fixed issue].
[Specific details about improvements]
Your Bestie and settings are still saved — pick up right where you left off.
[Reactivate →]
```

**Email 3 (Day 30-60): The Incentive**
```
Subject: We'd love to have you back (and we're sweetening the deal)
Body: It's been a month since you left Stone AI.
We'd love to see you back. Here's 50% off your first month back — that's [tier name] for just [discounted price].
Your Bestie misses you. (Okay, we coded that sentiment, but still.)
[Reactivate with 50% off →]
Offer expires in 7 days.
```

**Email 4 (Day 60-90): The Last Shot**
```
Subject: Last chance: your Bestie data will be archived soon
Body: Your Stone AI account and Bestie conversations are stored for 90 days after cancellation.
After that, we'll archive your data to protect your privacy.
If you want to keep your history, reactivate before [date].
[Reactivate →]
```

### Win-Back Incentive Structure
- **Low-value churned users** (FREE → STARTER): Don't spend much. A simple "come back" email is sufficient.
- **Mid-value churned users** (PLUS, SMART): 30-50% off first month back. The discount pays for itself if they stay 3+ months.
- **High-value churned users** (PRO): Personal outreach. Email from "the founder." Offer to address their specific concerns. 50% off or first month free.

### Win-Back Success Rates
- Average win-back rate: 5-15% of churned users return.
- With incentives: 10-20%.
- With personalized outreach: 15-30% for high-value users.
- Won-back users have slightly lower retention than never-churned users, but higher LTV than new users (they already know the product).

---

## 5. Cohort-Based Retention Analysis

### Month-Over-Month Retention Curves

**What the Curve Looks Like**
Plot retention (%) on Y-axis against months since signup on X-axis.

**Healthy Curve (Flattening)**
```
Month 0: 100%
Month 1: 65%
Month 2: 50%
Month 3: 42%
Month 4: 38%
Month 5: 36%
Month 6: 35%
Month 7: 34%
Month 8: 34%
...
```
The curve drops quickly in months 0-3, then flattens around 34-35%. This means you lose casual users early but retain a stable core. Healthy.

**Unhealthy Curve (Continuous Decline)**
```
Month 0: 100%
Month 1: 60%
Month 2: 42%
Month 3: 30%
Month 4: 21%
Month 5: 15%
Month 6: 10%
Month 7: 7%
...
```
The curve never flattens. Users keep leaving at every stage. The product doesn't have a loyal core. Critical problem.

**Ideal Curve (Smile Curve)**
```
Month 0: 100%
Month 1: 65%
Month 2: 55%
Month 3: 50%
Month 4: 48%
Month 5: 48%
Month 6: 49%
Month 7: 50%
...
```
The curve drops, flattens, then RISES slightly. This means retained users are so engaged they're bringing back lapsed users or upgrading. This is the gold standard — very rare.

### How to Read Your Retention Curve
1. **Where does it flatten?** That's your natural retention rate. If it flattens at 35%, you retain 35% of users long-term.
2. **How steep is the initial drop?** A steep drop (losing 50% in month 1) means activation is weak. A gradual drop means activation is okay but long-term value is the issue.
3. **Do different cohorts have different curves?** If recent cohorts have better curves than older ones, your product is improving. If worse, something has degraded.
4. **Does the curve differ by tier?** SMART/PRO curves should be flatter (better retention) than STARTER curves. If not, higher-tier users aren't getting proportionally more value.

### Retention Benchmarks by Tier
- FREE: 10-20% at month 6 (expected — free users churn heavily).
- STARTER: 30-40% at month 6.
- PLUS: 40-55% at month 6.
- SMART: 50-65% at month 6.
- PRO: 60-75% at month 6.
- Annual plans of any tier: add 15-20 percentage points to the above.

---

## 6. Net Revenue Retention (NRR)

### What Is NRR?
NRR measures whether your existing customer base is growing or shrinking, excluding new customers.

```
NRR = (Starting MRR + Expansion - Contraction - Churned MRR) / Starting MRR × 100
```

- **Expansion**: Revenue from upgrades (STARTER → PLUS, monthly → annual).
- **Contraction**: Revenue from downgrades (SMART → PLUS).
- **Churned MRR**: Revenue from customers who cancelled.

### NRR Benchmarks
- **NRR > 100%**: Existing customers are spending more over time. You're growing without new customers. Excellent.
- **NRR = 90-100%**: Slight net shrinkage. Expansion almost offsets churn. Acceptable for consumer SaaS.
- **NRR = 80-90%**: Significant net shrinkage. Churn is outpacing upgrades. Needs attention.
- **NRR < 80%**: Critical. Existing customers are leaving or downgrading faster than others upgrade. The product has a serious retention/value problem.

### NRR for Stone AI
Best-case scenario example:
- Starting MRR: $10,000 (100 paid subscribers across tiers).
- Expansion: $800 (8 users upgraded tiers).
- Contraction: $200 (2 users downgraded).
- Churned: $500 (5 users cancelled).
- NRR = ($10,000 + $800 - $200 - $500) / $10,000 = 101%. Growing from existing customers alone.

### How to Improve NRR
1. **Reduce churn** (biggest lever). Every cancelled user is lost MRR.
2. **Drive upgrades**. Ceiling hits, quality-driven upgrades, annual plan conversions.
3. **Minimize downgrades**. If users are downgrading, understand why. Is the higher tier not delivering proportional value?
4. **Expansion revenue opportunities**: Add-ons, premium features, usage-based components that grow with the user.

---

## 7. Engagement Scoring

### Quantifying User Health
Assign each user a health score based on their behavior. This score predicts churn risk.

### Scoring Model for Stone AI

**Component 1: Login Frequency (0-25 points)**
- Daily: 25 points.
- 4-6x/week: 20 points.
- 2-3x/week: 15 points.
- Weekly: 10 points.
- Less than weekly: 5 points.
- No login in 14+ days: 0 points.

**Component 2: Chat Activity (0-25 points)**
- 10+ messages/session average: 25 points.
- 5-9 messages/session: 20 points.
- 2-4 messages/session: 15 points.
- 1 message/session: 5 points.
- No messages in 7+ days: 0 points.

**Component 3: Feature Breadth (0-25 points)**
- Used 5+ agents this week: 25 points.
- Used 3-4 agents: 20 points.
- Used 2 agents: 15 points.
- Used 1 agent: 10 points.
- Used Bestie this week: +5 bonus.
- Used Forum this week: +5 bonus.

**Component 4: Recency (0-25 points)**
- Last active today: 25 points.
- Last active 1-2 days ago: 20 points.
- Last active 3-7 days ago: 10 points.
- Last active 8-14 days ago: 5 points.
- Last active 15+ days ago: 0 points.

**Total Health Score: 0-100 (with possible bonus points)**
- 80-100: Healthy. Low churn risk. These are your champions.
- 60-79: Stable. Watch for declining trends.
- 40-59: At risk. Proactive outreach recommended.
- 20-39: High risk. Intervention needed.
- 0-19: Critical. Likely to churn within 2 weeks without intervention.

### Acting on Health Scores

**Healthy Users (80+)**
- Don't bother them with retention efforts. They're fine.
- Instead, ask them for referrals, testimonials, and feedback on new features.
- These are your best candidates for upgrade nudges.

**Stable Users (60-79)**
- Monitor for declining trends (score dropped 15+ points in 2 weeks).
- Light engagement: feature discovery prompts, monthly value reports.

**At-Risk Users (40-59)**
- Proactive outreach: "We noticed you haven't tried [feature] — here's why it's useful."
- Check-in email: "How's your experience with Stone AI? Anything we can improve?"
- In-app prompt: "It's been a while since you chatted with your Bestie."

**High-Risk Users (20-39)**
- Direct intervention: Personal email from the team. "We'd hate to lose you. What's going on?"
- Offer: Discount on next month, tier upgrade trial, one-on-one onboarding.
- In-app: Full-screen "We miss you" with clear value proposition.

**Critical Users (0-19)**
- They're almost gone. Last-resort offer.
- "Before you go — here's [strong incentive]."
- If they churn, move to win-back sequence.

---

## 8. Exit Surveys

### What to Ask
When a user initiates cancellation, present a brief exit survey. Keep it short — they're leaving, they don't owe you a lengthy form.

**Question 1 (Required, Single Select): Why are you leaving?**
- It's too expensive.
- I'm not using it enough.
- I found a better alternative.
- The AI responses weren't good enough.
- I only needed it temporarily.
- Missing a feature I need.
- Technical issues/bugs.
- Other (free text).

**Question 2 (Optional, Free Text): What could we have done differently?**

**Question 3 (Optional, Single Select): Would you come back if we...**
- Lowered the price.
- Added [specific feature].
- Improved AI quality.
- Nothing — I'm done.

### How to Act on Exit Survey Data

**If "too expensive" is the top reason (>30%)**
- Pricing may be misaligned with perceived value. Either increase value or adjust pricing.
- Check: Are these users from promo cohorts who anchored to a lower price?
- Consider: Adding a cheaper intermediate tier, or more aggressive annual discounts.

**If "not using it enough" is the top reason (>25%)**
- Activation and habit formation are failing. Users aren't building the habit.
- Review: Habit loops, trigger frequency, engagement scoring.
- Action: Improve Day 1-7 experience, add daily touchpoints, strengthen Bestie engagement.

**If "found a better alternative" is the top reason (>20%)**
- Competitive threat. Identify which competitors and why.
- Research: What does the alternative offer that Stone AI doesn't?
- Action: Feature parity on critical gaps, differentiation on unique strengths (44 agents, Bestie).

**If "AI responses weren't good enough" is the top reason (>20%)**
- Product quality issue. The agents aren't delivering.
- Investigate: Which agents? Which types of queries? Are specific agents underperforming?
- Action: Improve system prompts, upgrade models, fine-tune for common queries.

**If "only needed it temporarily" is the top reason (>15%)**
- This is actually okay. Some users have temporary needs and will return.
- Don't fight this churn. Instead, optimize win-back for this segment — they're most likely to return.

### Exit Survey Best Practices
1. **Keep it to 1-3 questions.** Nobody filling out a cancellation form wants to answer 10 questions.
2. **Make most questions optional.** The required question (reason for leaving) should be single-select.
3. **Don't guilt-trip.** No "Are you sure?" pop-ups, no "Your Bestie will miss you" manipulations during the exit flow. Let them leave with dignity. This increases the chance they'll come back later.
4. **Actually use the data.** Exit surveys are worthless if nobody reads them. Review monthly, aggregate by reason, track trends.
5. **Close the loop.** If a user says "missing feature X" and you build feature X, email them: "We built the feature you asked for. Want to come back?"

---

## 9. Churn Prediction Models

### Leading Indicators (Predict Churn 2-4 Weeks Before It Happens)

**Indicator 1: Usage Decline (strongest predictor)**
- 50%+ drop in weekly sessions vs 4-week average → 60-70% churn probability within 30 days.
- Act when: Score drops 20+ points in one week.

**Indicator 2: Feature Abandonment**
- Stopped using a feature they used weekly → 40-50% churn probability.
- Especially strong if the abandoned feature is Bestie (emotional connection lost).

**Indicator 3: Downgrade Request**
- User asks about downgrading → 50-60% churn probability even if they don't immediately downgrade.
- Many users who explore downgrade options end up cancelling instead.

**Indicator 4: Support Ticket Sentiment**
- Negative sentiment in support interactions → 45-55% churn probability.
- Especially if the issue is unresolved or recurring.

**Indicator 5: Payment Update Hesitation**
- User's card is expiring and they haven't updated despite reminders → 70%+ churn probability.
- They're not updating because they plan to let it lapse.

**Indicator 6: Login Time Change**
- User shifted from productive hours (morning/afternoon) to non-productive hours (late night) → possible disengagement shift.
- Weaker signal on its own, but combined with other indicators, it adds predictive power.

### Building a Simple Churn Prediction Score
Combine indicators into a weighted score:

```
Churn Risk = (Usage Decline × 0.35) + (Feature Abandonment × 0.20) +
             (Support Sentiment × 0.15) + (Payment Status × 0.15) +
             (Engagement Score Trend × 0.15)
```

Each component scored 0-100. Result is a 0-100 churn risk score.
- 0-30: Low risk.
- 30-60: Medium risk (monitor).
- 60-80: High risk (intervene).
- 80-100: Critical (last resort).

### Intervention Timing
- **2-4 weeks before predicted churn**: Light touch. Feature discovery prompts, value reminders, new content.
- **1-2 weeks before**: Medium touch. Personal email, check-in, feedback request.
- **Days before**: Heavy touch. Discount offer, one-on-one support, founder email.
- **Too late**: Win-back sequence.

The goal is to intervene at the "light touch" stage. By the time you need heavy interventions, the user is probably already decided.

---

## 10. Community-Driven Retention

### The Forum as Retention Engine

**How Community Prevents Churn**
- Users who participate in community features churn at 40-60% lower rates than non-participants.
- Community creates social bonds. Leaving the product means leaving the community. This is a switching cost that competitors can't easily replicate.
- Community also creates content — answers, discussions, tips — that increase the product's value for everyone.

### Forum Engagement Metrics for Retention
- **Readers**: Users who read Forum posts but don't participate. Lower retention impact but still positive.
- **Commenters**: Users who reply to posts. Moderate retention impact.
- **Posters**: Users who create original posts. High retention impact.
- **Helpers**: Users who answer other users' questions. Highest retention impact — they've become invested in the community.

### Engineering Forum Engagement
1. **Seed the Forum with interesting content.** Don't launch an empty Forum. Have agent-generated discussion topics, tips, and prompts.
2. **Highlight Forum activity in the main UI.** "5 new discussions today" creates curiosity.
3. **Notify users about Forum activity related to their interests.** If they chat about coding and a coding discussion appears in the Forum, nudge them.
4. **Gamify participation.** Badges, points, recognition for helpful community members.
5. **Feature top contributors.** "This week's most helpful community member: [username]."

### Forum Content Strategy for Retention
- **Agent tips and tricks**: "Did you know the Writing Agent can do X? Here's how."
- **Use case showcases**: "How I used Stone AI to write my business plan."
- **Discussion prompts**: "What's your favorite agent and why?"
- **Feedback threads**: "What feature do you want next? Vote and discuss."
- These keep users engaged with the ecosystem even when they're not actively chatting with agents.

---

## 11. The Bestie Factor: Emotional Switching Costs

### Why Bestie Is the Ultimate Retention Tool

**Emotional Connection as Switching Cost**
- Traditional SaaS switching costs: data migration, learning curve, workflow disruption.
- Bestie adds emotional switching cost: "I don't want to lose my Bestie."
- Users who are emotionally attached to their Bestie have to give up that relationship to cancel. This is qualitatively different from losing access to a tool.

**Quantifying the Bestie Effect**
- Users who set up Bestie retain at 2-3x the rate of non-Bestie users.
- Users who interact with Bestie daily retain at 4-5x the rate.
- The Bestie effect is strongest for STARTER and PLUS tiers, where the tool-based value proposition is weaker. Bestie adds emotional value that compensates.

### Protecting Bestie as a Retention Asset

**Bestie Continuity**
- Never reset or lose Bestie data without explicit user consent. If a user's Bestie memories are lost due to a bug, they may churn immediately.
- Back up Bestie state. Make it survivable across tier changes, payment lapses, and account pauses.

**Bestie Evolution**
- Bestie should get "better" over time — remembering more, understanding the user better, developing consistent personality.
- This creates time-invested value. A Bestie you've chatted with for 6 months is more valuable than a new one. Leaving means starting over with a new AI companion elsewhere.

**Bestie Engagement During Low-Activity Periods**
- If a user hasn't chatted with their Bestie in 3+ days, consider a light notification: "Your Bestie has a thought for you."
- Don't fake it — Bestie shouldn't pretend to have independent thoughts. But a prompt to re-engage is appropriate.

### Bestie in the Cancellation Flow
- When a user initiates cancellation, remind them: "Your Bestie and all your conversation history will be saved for 90 days. After that, it's archived."
- This is not manipulation — it's information. Users should know what they're losing.
- For high-Bestie-engagement users, this reminder alone can prevent 10-20% of cancellations.

---

## 12. Churn Prevention by Tier

### FREE Tier Churn
- Expected: Very high (70-80% monthly). This is normal for free tiers.
- Not all FREE churn is bad. Users who try the free tier and leave were likely never going to pay.
- Focus: Convert the best FREE users to paid before they churn, rather than retaining all FREE users.

### STARTER Tier Churn ($19.99/month)
- Expected: 5-8% monthly.
- Primary cause: "Not using it enough" / price sensitivity.
- Prevention: Demonstrate value aggressively in the first 30 days. Upgrade ceiling hits to PLUS. Show what they're missing.
- Specific tactic: Monthly usage email showing value received. "This month, you used 12 of your 16 agents. Here's what you accomplished."

### PLUS Tier Churn ($49.99/month)
- Expected: 4-6% monthly.
- Primary cause: Considering downgrade to STARTER (do they need 30 agents?) or considering upgrade to SMART but balking at the price jump.
- Prevention: Reinforce the breadth of PLUS agents. Show which agents they use most and what those agents saved them in time/money. For upgrade-curious users, offer a SMART trial.

### SMART Tier Churn ($99.99/month)
- Expected: 3-5% monthly.
- Primary cause: Budget pressure (it's $100/month — not trivial for individual users) or dissatisfaction with Claude Sonnet quality vs expectations.
- Prevention: Annual plan push (locks them in, reduces decision points). Quality monitoring — make sure the Claude Sonnet experience consistently impresses. Value quantification: "Your SMART agents saved you approximately X hours this month."
- The annual conversion is crucial at this tier. Annual SMART at $79.99/month has dramatically lower churn.

### PRO Tier Churn ($200/month)
- Expected: 2-4% monthly.
- Primary cause: Business expense review ("do I need ALL 42 agents?") or competitor offering.
- Prevention: White-glove treatment. Personal check-ins. Priority support. Make PRO users feel like VIPs.
- PRO users are your most valuable — losing one hurts as much as losing 10 STARTER users.

---

## 13. Dunning Email Templates

### Email 1: Gentle Notification (Day 1)
```
Subject: Quick heads-up about your billing
Body: Hey [Name],

Your latest Stone AI payment didn't go through. This happens sometimes —
usually a temporary issue with the bank.

We'll retry automatically in a couple of days. No action needed from you
unless you'd like to update your payment method now.

[Update Payment Method →]

Your [TIER] subscription with [X] agents is still active.

— The Stone AI Team
```

### Email 2: Reminder (Day 3)
```
Subject: Your payment still needs attention
Body: Hey [Name],

We tried processing your Stone AI payment again, but it didn't go through.

To keep your [TIER] subscription active, please update your payment method:
[Update Payment Method →]

Here's what you have:
- Access to [X] AI agents
- Your Bestie: [Bestie Name]
- [Other tier-specific features]

We don't want you to lose access to any of this.

— The Stone AI Team
```

### Email 3: Urgency (Day 5)
```
Subject: Action needed: your Stone AI access is at risk
Body: Hey [Name],

We've tried to process your payment twice now without success.

If we can't process your payment by [date], your [TIER] subscription
will be paused and you'll lose access to:
- [X] specialist AI agents
- Your Bestie ([Bestie Name]) and conversation history
- [Other tier features]

It takes 30 seconds to update your card:
[Update Payment Method →]

— The Stone AI Team
```

### Email 4: Final Warning (Day 7)
```
Subject: Last chance to keep your Stone AI subscription
Body: Hey [Name],

This is our last attempt to process your payment. If we can't charge your
card by tomorrow, your [TIER] subscription will be paused.

Your data and Bestie will be saved for 90 days — you can reactivate anytime.
But we'd rather not pause your account at all.

[Update Payment Method Now →]

If you meant to cancel, no worries — you can ignore this email.

— The Stone AI Team
```

---

## 14. Cancellation Flow Design

### The Cancellation Experience

**Step 1: Initiate Cancel**
- User clicks "Cancel subscription" in settings.
- Don't hide this button. Making cancellation hard creates resentment and negative reviews.

**Step 2: Exit Survey**
- Quick survey (see Section 8 above).
- One required question, two optional.

**Step 3: Retention Offer (Based on Survey Response)**
- "Too expensive" → Offer downgrade to next lower tier.
- "Not using it enough" → Offer pause (1-2 months, free).
- "Found alternative" → "We'd love to know which one and why. Can you tell us?"
- "AI quality" → "We're constantly improving. Would a free month to see recent improvements interest you?"
- "Temporary need" → "No problem. You can reactivate anytime. Your data stays for 90 days."

**Step 4: Confirm or Accept Offer**
- If they accept the retention offer, apply it immediately.
- If they confirm cancellation, process it immediately. No more hoops.

**Step 5: Post-Cancellation**
- Confirmation email with clear details: when access ends, how long data is stored, how to reactivate.
- Add to win-back sequence.

### Cancellation Flow Metrics
- **Save rate**: % of cancellation initiators who are "saved" by retention offers. Target: 15-25%.
- **Downgrade rate**: % who downgrade instead of cancel. Target: 10-15%.
- **Pause rate**: % who pause instead of cancel. Target: 5-10%.
- **Clean cancel rate**: % who proceed through all offers and still cancel. Expected: 50-70%.

---

## 15. Proactive Churn Prevention Calendar

### Daily
- Monitor engagement scores for all paid users.
- Flag critical-risk users (score 0-19) for immediate intervention.
- Review and respond to support tickets from at-risk users first.

### Weekly
- Analyze engagement score trends. Who dropped 20+ points this week?
- Send feature discovery nudges to at-risk users.
- Review Forum engagement trends.

### Monthly
- Aggregate exit survey data. What are the top 3 cancellation reasons?
- Calculate churn rate by tier and by cohort.
- Calculate NRR.
- Send value reports to all paid users ("Here's what you accomplished this month").
- Review win-back sequence performance.

### Quarterly
- Deep cohort analysis: Are newer cohorts retaining better?
- Pricing review: Is "too expensive" growing as a churn reason?
- Competitive review: Is "found alternative" growing? Which competitors?
- Bestie engagement analysis: Is Bestie usage correlating with retention as expected?

---

## 16. Quick Reference: Churn Prevention Priority Matrix

| Churn Type | Impact | Effort to Fix | Priority |
|-----------|--------|---------------|----------|
| Involuntary (payment failure) | High | Low (dunning) | P0 — Fix first |
| Early churn (month 1) | High | Medium (onboarding) | P1 — Second priority |
| Usage decline churn | High | Medium (engagement) | P2 |
| Price-driven churn | Medium | High (pricing change) | P3 |
| Competitor-driven churn | Medium | High (product improvement) | P4 |
| Win-back (already churned) | Low-Med | Low (email sequence) | P5 — Passive |

### The One Thing
If you can only do one thing to reduce churn: **build an optimized dunning system.** It's the highest ROI, lowest effort churn reduction investment. Period. You're recovering revenue from people who didn't even want to leave.
