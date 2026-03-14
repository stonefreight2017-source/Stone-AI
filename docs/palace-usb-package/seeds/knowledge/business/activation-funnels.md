# Activation Funnels — Complete Knowledge Seed

## Purpose
This document contains everything a Palace agent needs to understand about user activation in SaaS, applied to Stone AI. Activation is the single most important phase of the user lifecycle — it determines whether a signup becomes a user or a ghost.

---

## 1. Time-to-Value: The First 60 Seconds

### The Principle
Users form their opinion of your product in the first 60 seconds after signup. This opinion is sticky — it takes 5-10 positive experiences to overcome a bad first impression. The goal: get the user to their "aha moment" as fast as humanly possible.

### What Is the "Aha Moment"?
The "aha moment" is the point where the user understands — not intellectually, but experientially — why this product exists for them. It's the moment they think "oh, this is useful."

For Stone AI, potential aha moments:
1. **First quality agent response**: The user asks a question and gets a genuinely helpful, specific, expert-level answer. Not a generic chatbot response — something that demonstrates specialist knowledge.
2. **Agent switching realization**: The user discovers they can talk to different specialists for different problems. "Wait, I can switch from the writing agent to the coding agent?" This is Stone AI's core differentiator.
3. **Bestie connection**: The user's Bestie says something that feels personal, remembered, or emotionally resonant. This is deeper and takes longer, but it's the strongest aha moment.
4. **Problem solved**: The user came with a specific problem and the agent solved it. Tangible value delivered.

### The 60-Second Target
From signup completion to first aha moment: 60 seconds maximum. Here's what that looks like:

**Second 0-5**: Signup completes. User lands on the main interface.
**Second 5-15**: Onboarding overlay or guided prompt: "What would you like help with?" with quick-start suggestions.
**Second 15-30**: User sends first message (either typed or clicked a suggestion).
**Second 30-60**: Agent responds with a high-quality, specific answer. Aha moment achieved.

### What Breaks the 60-Second Window
- **Lengthy onboarding surveys**: "Tell us about yourself" screens that delay the first interaction.
- **Forced profile setup**: Making users choose an avatar, set preferences, or configure their Bestie before they can chat.
- **Loading screens**: Slow API responses, model initialization delays.
- **Unclear interface**: User doesn't know where to type or which agent to talk to.
- **Email verification gates**: Requiring email confirmation before first use.

### Design Rules for the First 60 Seconds
1. **No gates before first value.** Let users chat immediately. Email verification can happen after.
2. **Pre-select a default agent.** Don't make users choose from a list of 4+ agents before their first message. Start them with the most versatile FREE agent.
3. **Provide conversation starters.** Show 3-4 clickable prompts: "Help me write an email," "Explain this code," "Give me business advice," "Just chat." These eliminate the blank-input-field problem.
4. **Optimize response speed.** The first response should be fast, even if subsequent ones are slower. Cache common first-message patterns. Pre-warm the model.
5. **Make the response visibly good.** The first agent response sets expectations. It should be formatted well (markdown, headers, bullet points), specific, and helpful. Generic "How can I help you today?" responses waste the aha moment.

---

## 2. Onboarding Friction Mapping

### Every Click Is a Potential Dropout
Each step in the onboarding flow is a point where users can abandon. Map every step and measure the dropout rate at each one.

### Stone AI Onboarding Flow (Ideal)

**Step 1: Landing Page → Signup Button**
- Friction: User must decide to try the product.
- Dropout risk: 70-85% of landing page visitors don't click signup.
- Optimization: Clear value proposition, social proof, prominent CTA, no-credit-card-required badge.

**Step 2: Signup Form**
- Friction: Form fields, password requirements, email entry.
- Dropout risk: 30-50% of people who click signup don't complete the form.
- Optimization: Clerk handles this — social login (Google, GitHub) reduces friction. Minimize form fields. Just email + password, or social login.
- The gold standard: One-click Google signup. No typing required.

**Step 3: Email Verification**
- Friction: User must leave your product, open email, click link, return.
- Dropout risk: 10-30% don't complete verification.
- Optimization: Don't require verification before first use. Let them chat immediately. Verify later.
- Alternative: Send verification code to the page so they never leave the product.

**Step 4: First Screen After Signup**
- Friction: What do they see? If it's a blank chat interface, they might not know what to do.
- Dropout risk: 15-25% of new users who reach the main interface bounce without interacting.
- Optimization: Guided first experience — conversation starters, agent introduction, subtle onboarding tooltip.

**Step 5: First Interaction**
- Friction: Typing a message, waiting for response.
- Dropout risk: 5-10% send a message and leave before the response.
- Optimization: Fast response times. Typing indicators. Streaming responses (show text as it generates).

**Step 6: Continued Engagement**
- Friction: Finding a reason to come back.
- Dropout risk: 40-60% of users who complete their first session never return.
- Optimization: End the first session with a hook — "I can help with more tomorrow" or a reminder of other agents they haven't tried.

### Friction Mapping Exercise
For each step in your flow:
1. What action does the user take?
2. What could go wrong?
3. What's the measured dropout rate?
4. What's the target dropout rate?
5. What change would reduce friction?

### The Friction Budget
You have a "friction budget" — users will tolerate a certain amount of friction before quitting. Spend it wisely.
- **Don't waste friction on low-value steps.** Profile setup, preference configuration, and surveys burn friction without delivering value.
- **Spend friction on high-value moments.** If choosing their Bestie personality is important for long-term retention, it's worth the friction — but do it after the first aha moment, not before.
- **Front-load value, back-load friction.** Get them to the aha moment first. Then ask for profile info, preferences, and verification.

---

## 3. Activation Metrics

### What Day 1 Actions Predict 30-Day Retention?

The key question: What can a user do on Day 1 that predicts they'll still be around on Day 30? These are your "activation events."

### Candidate Activation Events for Stone AI

**1. First Chat Message Sent**
- Prediction strength: Moderate. Sending one message is low effort and low signal. Many users who send one message never return.
- Threshold: Users who send 3+ messages in first session have significantly higher 30-day retention.

**2. First Agent Switch**
- Prediction strength: High. A user who discovers they can switch between agents has understood the core product. This is Stone AI's differentiator.
- Threshold: Users who interact with 2+ different agents on Day 1 retain at 2-3x the rate of single-agent users.

**3. First Bestie Interaction**
- Prediction strength: Very high. Bestie creates emotional connection. Users who set up and chat with their Bestie have the highest retention rates.
- Threshold: Any Bestie interaction on Day 1 predicts strong 30-day retention.

**4. Return Visit Within 24 Hours**
- Prediction strength: Very high. A user who comes back within 24 hours is hooked. They found enough value to remember and return.
- This isn't something you "make" them do — it's a signal of organic engagement.

**5. Profile Customization**
- Prediction strength: Moderate-high. Users who invest time personalizing (avatar, Bestie, preferences) have skin in the game.
- But don't force this early — let it happen naturally after engagement.

### The Activation Metric Hierarchy
1. **Leading indicator**: First message sent (immediate, easy to track).
2. **Early signal**: Agent switch or 3+ messages (within first session).
3. **Strong signal**: Return visit within 24 hours.
4. **Confirmed activation**: 3+ sessions in first 7 days.
5. **Retention predictor**: Bestie setup OR 5+ agent interactions in first week.

### How to Identify Your Activation Metric
1. Export user data: first 7 days of behavior for every user.
2. Split into two groups: users who retained at Day 30 vs users who churned before Day 30.
3. Compare Day 1-7 behaviors between groups.
4. The behaviors with the biggest difference between retained and churned groups are your activation events.
5. Pick the one that's both predictive AND actionable (you can design experiences to drive it).

### Setting Activation Targets
- **Day 1 activation rate** (% of signups who complete activation event): Target 40-60%.
- **Day 7 activation rate**: Target 30-45%.
- If Day 1 activation is below 30%, the first experience is broken.
- If Day 7 activation is above Day 1 activation, users are discovering value on return visits — which means the first visit could be better but the product itself is strong.

---

## 4. Progressive Disclosure

### The Principle
Don't overwhelm new users with everything at once. Reveal features and complexity gradually as users become more experienced.

### Progressive Disclosure in Stone AI

**Layer 1: First Visit (Show)**
- The default chat agent (most versatile FREE agent).
- A clean, simple chat interface.
- 2-3 conversation starter suggestions.
- A visible but non-intrusive indicator that more agents exist.

**Layer 2: After First Chat (Reveal)**
- The agent selector showing all 4 FREE agents with brief descriptions.
- A "More agents available on STARTER" teaser.
- Basic settings (theme, notifications).

**Layer 3: After 3+ Sessions (Introduce)**
- Bestie feature with setup prompt.
- Forum discovery.
- Agent detail pages with capability descriptions.
- Upgrade prompts based on usage patterns.

**Layer 4: Power User Features (Discover)**
- Advanced agent settings.
- Conversation export.
- Keyboard shortcuts.
- Detailed agent comparison.

### Why 42 Agents on Day 1 Is Wrong
- Showing 42 agents (or even 4) with detailed descriptions creates "choice overload."
- The Jam Study (Iyengar & Lepper, 2000): 24 jam choices → 3% bought. 6 choices → 30% bought. Fewer options, more action.
- Apply to Stone AI: Show 1 default agent with "3 more available" on Day 1. Not 4 agents with a "38 more on paid tiers" wall.
- Let users discover agents through need: "That's a great coding question — did you know our Code Agent specializes in this?"

### Progressive Disclosure Rules
1. **Start simple.** One agent, one chat, one purpose.
2. **Reveal on demand.** Show more when the user takes an action that signals readiness.
3. **Never hide permanently.** Everything should be discoverable for users who look for it. Progressive disclosure means "show later," not "hide forever."
4. **Use inline education.** "Tip: Switch to our Writing Agent for better prose" inside a chat, not a separate tutorial screen.
5. **Track disclosure depth.** How many features has each user discovered? Users who've discovered 5+ features retain better than those who've discovered 1-2.

---

## 5. Habit Loops

### The Cue → Routine → Reward Framework
Every habit has three components:
1. **Cue**: A trigger that initiates the behavior.
2. **Routine**: The behavior itself.
3. **Reward**: The benefit that reinforces the behavior.

### Building AI Chat Habits

**Habit Loop 1: Morning Check-In**
- Cue: User opens phone/laptop in the morning.
- Routine: Opens Stone AI, chats with Bestie or checks agent for daily advice.
- Reward: Feels prepared, informed, or emotionally connected.
- How to engineer: Push notification at user's typical morning time. "Good morning! Your Bestie has a thought for you." Or "Here's your daily briefing from your Strategy Agent."

**Habit Loop 2: Problem-Solution**
- Cue: User encounters a problem (writing task, coding bug, business question).
- Routine: Opens Stone AI, asks the relevant specialist agent.
- Reward: Problem solved faster than alternatives.
- How to engineer: Be the fastest path to a solution. Speed of first response is critical. If the user can get help in 10 seconds from Stone AI vs 5 minutes of Googling, the habit forms.

**Habit Loop 3: Creative Companion**
- Cue: User has a creative task (brainstorming, writing, planning).
- Routine: Bounces ideas off Stone AI agents.
- Reward: Better output than working alone. Feels like having a smart colleague.
- How to engineer: Train agents to be excellent brainstorming partners. Ask follow-up questions. Build on ideas. Be collaborative, not just responsive.

**Habit Loop 4: Emotional Regulation (Bestie)**
- Cue: User feels stressed, lonely, bored, or wants to vent.
- Routine: Talks to Bestie.
- Reward: Feels heard, less alone, emotionally lighter.
- How to engineer: Bestie must be genuinely good at emotional conversations — empathetic, non-judgmental, remembering past conversations. This is the stickiest habit loop because the reward is emotional, not just functional.

### Variable Reward Schedules
- Fixed rewards (same response every time) create weak habits.
- Variable rewards (sometimes surprising, sometimes delightful) create strong habits.
- Apply to agents: Vary response format, occasionally include unexpected insights, sometimes ask questions that reframe the user's thinking.
- The "slot machine effect": Not knowing exactly what the agent will say keeps users engaged.

### Habit Formation Timeline
- **Day 1-7**: The user is deciding whether to form the habit. Every session matters.
- **Day 7-21**: The habit is fragile. A bad experience can break it. Consistency is critical.
- **Day 21-66**: The habit is solidifying. Usage becomes more automatic.
- **Day 66+**: The habit is established. Usage is reflexive. Retention is strong.
- Target: Get users to 7 sessions in the first 21 days. This is the critical mass for habit formation.

---

## 6. Behavioral Triggers

### Push Notifications
- **Timing**: Send based on user's typical usage time, not a fixed schedule. If they usually chat at 9am, send the notification at 8:55am.
- **Content**: Must be valuable, not nagging. "Your Writing Agent found a better way to phrase that email you worked on" > "You haven't visited in 3 days!"
- **Frequency**: Max 1 per day for active users. Max 2 per week for lapsed users. More = unsubscribe/uninstall.
- **Permission**: Always ask permission. Never spam. Violating notification trust destroys the relationship.

### Email Sequences

**Welcome Sequence (Days 1-14)**
- Day 0: "Welcome to Stone AI! Here's what you can do." Brief, focused, one CTA.
- Day 1: "Did you know you can switch between agents? Try [Agent Name] for [use case]."
- Day 3: "Your Bestie is waiting to meet you. Set up your companion in 30 seconds."
- Day 7: "Here's what Stone AI users accomplish in their first week: [stats/testimonials]."
- Day 14: "You've been with us for two weeks! Here's your activity summary."

**Engagement Emails (Ongoing)**
- Weekly digest: "This week, you chatted X times and explored Y agents. Here's what's new."
- Feature spotlight: "Did you know about [feature]? Here's how to use it."
- Milestone celebration: "You've sent your 100th message! 🎉"

**Re-Engagement (Lapsed Users)**
- Day 3 of inactivity: "We miss you. [Agent Name] has a tip for you."
- Day 7: "Here's what you missed — new features, new agents."
- Day 14: "It's been two weeks. Come back with [incentive]."
- Day 30: "Last chance — [strong incentive]."
- After 30 days: Move to win-back sequence (see churn-prevention.md).

### In-App Nudges
- **Empty state nudges**: When a section of the UI is empty, fill it with a helpful prompt. Empty chat history: "Start a conversation! Try asking about..."
- **Feature discovery nudges**: Subtle highlights or tooltips on features the user hasn't tried. "NEW: Try our Code Agent for programming help."
- **Progress indicators**: "You've explored 2 of 4 free agents. Try [Agent Name] next!"
- **Social nudges**: "1,200 users chatted with this agent today."

### Trigger Rules
1. **Be helpful, not annoying.** Every trigger should provide genuine value.
2. **Respect frequency.** More triggers ≠ more engagement. There's an optimal frequency, and exceeding it causes unsubscribes.
3. **Personalize.** Generic triggers are weak. Triggers based on user behavior are strong. "You asked about Python yesterday — our Code Agent has a follow-up tip" beats "Check out our Code Agent!"
4. **Test everything.** A/B test trigger timing, content, frequency, and channel. What works changes over time.
5. **Have a kill switch.** If a trigger campaign isn't working (low open rates, high unsubscribe rates), kill it fast.

---

## 7. Cohort Analysis

### What Is Cohort Analysis?
Grouping users by their signup date (or another shared characteristic) and tracking their behavior over time. This reveals trends that aggregate metrics hide.

### Time-Based Cohorts
- Group users by signup week or month.
- Track each cohort's behavior: activation rate, Day 7 retention, Day 30 retention, conversion to paid, churn rate.
- Compare cohorts to each other. Is this month's cohort activating better than last month's? If yes, your recent changes are working.

### Behavior-Based Cohorts
- Group users by first-session behavior: "sent 1 message," "sent 3+ messages," "switched agents," "set up Bestie."
- Track each behavior cohort's long-term outcomes.
- This reveals which first-session behaviors predict success. It's how you identify your activation metric.

### Cohort Analysis for Stone AI

**Example Cohort Table**:
| Signup Week | Users | Day 1 Active | Day 7 Retained | Day 30 Retained | Paid Convert |
|-------------|-------|-------------|----------------|-----------------|-------------|
| Week 1 | 500 | 60% | 35% | 18% | 4% |
| Week 2 | 520 | 62% | 38% | 20% | 5% |
| Week 3 | 480 | 55% | 30% | 15% | 3% |

**What this tells you**:
- Week 3 underperformed — what changed? Did we ship a bug? Change the onboarding?
- Week 2 was the best — what did we do right?
- Overall trend: ~60% Day 1, ~35% Day 7, ~18% Day 30, ~4% paid. Are these healthy?

### Healthy Benchmarks for AI SaaS
- Day 1 activation: 50-70%.
- Day 7 retention: 25-40%.
- Day 30 retention: 15-25%.
- Free-to-paid conversion (30 days): 3-7%.
- Free-to-paid conversion (90 days): 5-10%.

If your numbers are below these ranges, focus on activation and first experience. If above, focus on scaling acquisition.

### Cohort Visualization
- **Retention curve**: Plot retention (%) on Y-axis, days since signup on X-axis, one line per cohort.
- **Healthy curve**: Drops quickly in first 3 days, then flattens. The flattening point is where engaged users stabilize.
- **Unhealthy curve**: Drops continuously without flattening. Users keep leaving at every stage. The product isn't sticky.
- **Target**: The curve should flatten at 15-25% by Day 30. If it flattens at 10% or lower, activation is broken.

---

## 8. Funnel Math

### The Full Funnel: Signup → Revenue

**Stage 1: Visit → Signup**
- Benchmark conversion: 2-5% for SaaS landing pages.
- If 10,000 people visit stone-ai.net per month and 3% sign up, that's 300 signups.
- Levers: Landing page copy, social proof, CTA placement, page speed, trust indicators.

**Stage 2: Signup → Onboarded (First Meaningful Action)**
- Benchmark: 60-80% of signups complete onboarding.
- 300 signups × 70% = 210 onboarded users.
- Levers: Onboarding flow simplicity, time-to-first-action, conversation starters.

**Stage 3: Onboarded → Activated (Aha Moment)**
- Benchmark: 40-60% of onboarded users reach aha moment.
- 210 onboarded × 50% = 105 activated users.
- Levers: Agent response quality, Bestie introduction, agent switching discovery.

**Stage 4: Activated → Engaged (Return Within 7 Days)**
- Benchmark: 50-70% of activated users return.
- 105 activated × 60% = 63 engaged users.
- Levers: Habit loop triggers, email sequences, notification timing, content quality.

**Stage 5: Engaged → Paying**
- Benchmark: 10-20% of engaged users convert to paid.
- 63 engaged × 15% = ~9-10 paying users.
- Levers: Upgrade prompts, ceiling hits, promo offers, value demonstration.

**The Math Summary**
- 10,000 visitors → 300 signups → 210 onboarded → 105 activated → 63 engaged → 9 paying.
- That's a 0.09% visitor-to-paid conversion rate, which is normal for freemium SaaS.
- Each 10% improvement at any funnel stage compounds. If you improve activation from 50% to 60%, paying users go from 9 to 11 (22% revenue increase).

### Where to Focus (Greatest Impact)

**The highest-leverage improvement is usually the stage with the worst conversion rate relative to benchmarks.**

If your signup → onboarded rate is 40% (below the 60-80% benchmark), fix onboarding. If it's 75%, that stage is healthy — look elsewhere.

Priority order (typically):
1. **Activation**: Getting users to the aha moment. This is where most products lose the most users.
2. **Engagement**: Getting activated users to return. Habit loops and triggers.
3. **Conversion**: Getting engaged users to pay. Pricing and upgrade prompts.
4. **Acquisition**: Getting more visitors. Marketing and SEO.

Why acquisition is last: if your funnel leaks at activation, more visitors just means more leakage. Fix the funnel first, then pour more in.

---

## 9. Onboarding Personalization

### Why Personalization Matters
Not all users want the same thing. A developer who signs up wants coding help. A writer wants writing help. A business owner wants strategy help. The onboarding experience should adapt.

### Implementation Approaches

**Ask Early, Act Immediately**
- One question after signup: "What do you most want help with?" with 4-5 options.
- Based on the answer, pre-select the most relevant agent and show relevant conversation starters.
- This adds friction (one click) but dramatically improves time-to-value because the first interaction is relevant.

**Infer from Behavior**
- Don't ask — observe. What's the user's first message about? Route them to the best agent automatically.
- If they ask a coding question, surface the Code Agent. If they ask about writing, surface the Writing Agent.
- This is frictionless but requires smart routing logic.

**Hybrid Approach**
- Ask the question but make it optional: "Tell us what you're here for, or just start chatting."
- Impatient users skip and chat immediately. Patient users answer and get a curated experience.

### Personalized Onboarding Flows

**Flow A: Developer**
- Default agent: Code Agent.
- Conversation starters: "Debug this code," "Explain this error," "Help me architect a feature."
- Day 1 email: "Our Code Agent supports Python, JavaScript, TypeScript, and more. Try it with your current project."

**Flow B: Writer/Creator**
- Default agent: Writing Agent.
- Conversation starters: "Help me write an email," "Improve this paragraph," "Generate ideas for a blog post."
- Day 1 email: "Our Writing Agent can match any tone — formal, casual, persuasive. Give it a try."

**Flow C: Business/Entrepreneur**
- Default agent: Strategy/Business Agent.
- Conversation starters: "Review my business plan," "Help me with pricing strategy," "Analyze this market."
- Day 1 email: "Our Business Agent has frameworks for strategy, pricing, and decision-making. What's your biggest challenge?"

**Flow D: Curious Explorer**
- Default: General chat agent.
- Conversation starters: "Surprise me," "What can you do?" "Tell me about Stone AI's agents."
- Day 1 email: "With 4 free agents (and 38 more on paid tiers), there's a lot to explore. Start anywhere."

---

## 10. Measuring Activation Success

### Key Metrics Dashboard

**Real-Time Metrics**
- Signups per hour/day.
- Time-to-first-message (median and distribution).
- First-session length (minutes).
- First-session messages sent.
- Agents interacted with in first session.

**Daily Metrics**
- Day 1 activation rate (% completing activation event).
- Day 1 retention (% returning within 24 hours).
- Onboarding completion rate.
- Conversion rate from signup to first chat.

**Weekly Metrics**
- Day 7 retention by cohort.
- Activation event completion rates.
- Feature discovery rates.
- Agent switching rates.

**Monthly Metrics**
- Day 30 retention by cohort.
- Free-to-paid conversion by cohort.
- Funnel conversion rates at each stage.
- Cohort comparison (is this month better than last?).

### Leading vs Lagging Indicators
- **Leading** (predict future outcomes): Time-to-first-message, first-session agent switches, Bestie setup rate. Act on these NOW to affect retention LATER.
- **Lagging** (measure past outcomes): Day 30 retention, paid conversion rate, LTV. These tell you if past changes worked but can't be acted on directly.
- Always monitor leading indicators and optimize for them. Use lagging indicators to validate that leading indicator improvements translate to business outcomes.

### The Activation Rate Formula
```
Activation Rate = (Users who completed activation event within X days) / (Total signups in cohort) × 100
```

Example:
- Activation event: Sent 3+ messages AND switched agents at least once.
- Timeframe: Within 7 days of signup.
- Cohort: Users who signed up in March.
- Calculation: 150 activated / 500 signups = 30% activation rate.

### Improving Activation Rate

**Tactic 1: Reduce steps to activation event.**
- If activation is "switch agents," make the agent selector more visible. Put it in the first screen, not behind a menu.

**Tactic 2: Guide users to the activation event.**
- After first message: "Great conversation! Did you know you can get specialized help? Try our [Agent Name] for deeper [topic] expertise."

**Tactic 3: Remove blockers.**
- If users are dropping off at a specific step, that step is a blocker. Remove it, simplify it, or move it to later.

**Tactic 4: Improve the quality of the activation event.**
- If activation is "first quality response," make sure the first response is genuinely excellent. This might mean curating first-response quality more carefully than subsequent responses.

**Tactic 5: A/B test continuously.**
- Test different onboarding flows, different default agents, different conversation starters, different email sequences.
- Small improvements compound. 5% better activation → 5% better retention → 5% more revenue, compounded monthly.

---

## 11. The "Day Zero" Experience

### What Happens Before Signup
Activation starts before the user creates an account. Their experience on the landing page, in marketing materials, and in word-of-mouth shapes their expectations.

**Setting Correct Expectations**
- If the landing page promises "44 AI agents for any task" and the free tier has 4, the user feels deceived. Disappointment kills activation.
- Set expectations clearly: "Start with 4 specialist agents free. Unlock up to 44 with paid plans."
- Under-promise, over-deliver. If the user expects basic chat and gets expert-level specialist responses, that's an aha moment. If they expect GPT-4 quality and get local Qwen, that's disappointment.

**Pre-Signup Value**
- Consider offering value before signup. A public demo, sample conversations, or a "try without signing up" feature.
- Each piece of pre-signup value increases the likelihood of signup because the user has already experienced the product.

### Day Zero Metrics
- Landing page bounce rate (target: below 60%).
- Time on landing page (target: 60+ seconds).
- Pricing page views (indicates purchase intent).
- Signup button clicks vs signup completions (measures form friction).

---

## 12. Activation for Different User Types

### The Skeptic
- Doesn't believe AI can help them. Signed up to "see what the fuss is about."
- Activation strategy: Blow them away with the first response. Show them something they didn't expect AI could do.
- Risk: If the first response is mediocre, they'll confirm their skepticism and leave.

### The Evaluator
- Comparing Stone AI to competitors. Signed up to test, not to commit.
- Activation strategy: Demonstrate the multi-agent advantage immediately. Show that switching between specialists is something competitors don't offer.
- Risk: If they don't discover agent switching, they'll judge Stone AI as "another chatbot."

### The Power User
- Already uses AI tools. Looking for something better or different.
- Activation strategy: Get out of their way. Minimal onboarding, maximum capability access. Let them explore.
- Risk: If the interface is cluttered or slow, they'll dismiss it as amateur.

### The Nervous Newcomer
- New to AI. Might be intimidated.
- Activation strategy: Warm, welcoming first experience. Bestie as a friendly entry point. Simple prompts, encouraging responses.
- Risk: If the interface feels technical or overwhelming, they'll feel "this isn't for me."

### Adapting Onboarding
- Ideally, identify user type from behavior (not surveys) and adapt.
- Fast typing, multiple agents explored immediately → Power User → Reduce friction.
- Slow typing, simple questions → Newcomer → Add guidance.
- Specific comparative questions ("can you do X?") → Evaluator → Showcase differentiation.

---

## 13. Post-Activation: The Bridge to Engagement

### Activation Is Not Enough
Activation gets users to the aha moment. But a single aha moment doesn't create retention. You need to bridge from activation to habit.

**The Bridge Period: Days 1-7**
- This is the fragile period. The user has seen value but hasn't formed a habit yet.
- Goal: Get them to return 3+ times in the first week.
- Tactics: Daily triggers (notifications, emails), new-feature discovery prompts, Bestie conversations that carry over between sessions.

**Session 2 Is Critical**
- The return visit is the most important event after activation. A user who returns once is 3-5x more likely to retain than one who doesn't.
- Engineering session 2: End session 1 with a hook. "I'll have more ideas for you tomorrow." Or save a conversation thread they'll want to continue.
- Remind them: Next-day notification or email referencing their first session. "Yesterday you asked about X — here's a follow-up thought."

**Building Streaks**
- Streak mechanics (X days in a row) are powerful for habit formation.
- "You've chatted 3 days in a row! Keep it going."
- Don't be annoying about it — subtle is better. A small visual indicator on the home screen, not a full-screen popup.

### The Activation-to-Engagement Checklist
1. User completed activation event (first session).
2. User returned within 24 hours (session 2).
3. User explored a second agent (breadth).
4. User had a multi-turn conversation (depth).
5. User returned 3+ times in first week (habit forming).
6. User set up Bestie or customized profile (investment).
7. User discovered Forum or Help (ecosystem engagement).

Track completion of each item. Users who complete 5+ are almost certainly retained. Users who complete 1-2 are at risk.

---

## 14. Quick Reference: Activation Optimization Priorities

### If Activation Is Below 30%
- The first experience is broken. Focus on:
  1. Reducing time-to-first-message.
  2. Improving first response quality.
  3. Simplifying the onboarding flow.
  4. Adding conversation starters.

### If Activation Is 30-50%
- The first experience works for some users but not all. Focus on:
  1. Personalizing onboarding by user type.
  2. Improving agent switching discovery.
  3. Adding progressive disclosure.
  4. Testing different activation events.

### If Activation Is 50-70%
- Healthy activation. Focus on:
  1. Bridging activation to engagement (session 2 optimization).
  2. Habit loop engineering.
  3. Behavioral trigger optimization.
  4. Scaling acquisition (the funnel is working, pour more in).

### If Activation Is Above 70%
- Excellent. You're probably bottlenecked elsewhere. Focus on:
  1. Conversion to paid.
  2. Retention beyond Day 30.
  3. Upgrade rate between tiers.
  4. Growing the top of the funnel.

---

## 15. Activation Metrics Summary Table

| Metric | Formula | Target | Action if Below |
|--------|---------|--------|-----------------|
| Time to First Message | Median seconds from signup to first chat | <60 seconds | Simplify first screen |
| Day 1 Activation Rate | Activated / Signups | 50-60% | Improve first experience |
| Day 1 Return Rate | Returned within 24h / Day 1 Active | 30-40% | Add session-end hooks |
| Day 7 Retention | Active on Day 7 / Signups | 25-35% | Optimize triggers & emails |
| Agent Switch Rate | Users who tried 2+ agents / Active | 30-50% | Make agent switching visible |
| Bestie Setup Rate | Bestie configured / Active | 20-30% | Prompt Bestie setup after aha |
| Session 2 Conversion | Users with 2+ sessions / Signups | 35-50% | Day 1 email, notification |
| Week 1 Sessions (avg) | Total sessions / Active users | 3-5 | Habit loop engineering |
