# Onboarding Conversation Flows for AI Agents

## Seed Classification
- **Domain**: Conversational UX / Onboarding Design
- **Applies to**: All Stone AI agents, Bestie system, new user funnels
- **Priority**: Critical — first impression determines retention
- **Last Updated**: 2026-03-09

---

## 1. The Onboarding Problem in AI Products

Most AI products fail onboarding because they treat it as a form. "What's your name? What do you do? What do you want?" This is a survey, not a conversation. Users came to talk to an AI, and the first thing the AI does is interrogate them with a clipboard.

Stone AI's onboarding must feel like meeting someone smart who is genuinely interested in helping. The agent should learn about the user through natural conversation, not through a structured questionnaire. Every piece of information collected should feel like it serves the user, not the product.

### Why Conversational Onboarding Wins

**Traditional onboarding (forms)**:
- Completion rate: 30-45%
- Average time to value: 5-8 minutes
- Drop-off at each step: 15-25%
- User sentiment: "I just want to use the thing"

**Conversational onboarding (AI-driven)**:
- Completion rate: 65-80%
- Average time to value: 1-3 minutes
- Drop-off per exchange: 5-10%
- User sentiment: "This already understands me"

The difference is not the information collected — it is the same data. The difference is the experience of providing it. A conversation feels collaborative. A form feels like homework.

---

## 2. Progressive Disclosure Architecture

### Principle: Never ask for information you do not need right now

Every question in onboarding must pass the "Do I need this to make the next response better?" test. If the answer is no, the question is deferred.

### The Three Onboarding Layers

**Layer 1 — Immediate (first 30 seconds)**:
What the agent must know to be useful right now.

```
Required:
- User's name (from Clerk auth — already have it)
- What brought them here (first message intent)
- Their tier (from subscription — already have it)

NOT required yet:
- Industry, role, preferences, communication style
- These emerge naturally from conversation
```

**Layer 2 — Contextual (first 5 minutes)**:
What the agent learns from the first few exchanges.

```typescript
interface Layer2Context {
  communicationStyle: 'formal' | 'casual' | 'technical' | 'mixed';
  apparentExpertise: 'beginner' | 'intermediate' | 'advanced';
  primaryUseCase: string;
  responsePreference: 'concise' | 'detailed' | 'examples-heavy';
}

// Inferred from:
// - Message length and vocabulary
// - Technical terms used or avoided
// - Questions asked vs statements made
// - Explicit preferences stated
```

**Layer 3 — Longitudinal (first week)**:
What the agent accumulates over multiple sessions.

```typescript
interface Layer3Context {
  recurringTopics: string[];
  preferredAgents: number[];
  peakUsageTimes: string[];
  frustrationPatterns: string[];
  satisfactionSignals: string[];
  bestieCompatibility: BestieProfile | null;
}
```

### Progressive Disclosure in Practice

```
// WRONG: Front-loading all questions
Agent: "Welcome! Before we start, I need to know:
1. What industry are you in?
2. What's your role?
3. What do you mainly want to use AI for?
4. How technical are you?
5. Do you prefer formal or casual responses?"

// RIGHT: Learning through conversation
Agent: "Hey Jordan — welcome to Stone AI. What are you working on?"

User: "I need help writing marketing copy for my SaaS product."

Agent: "Got it — SaaS marketing copy. What's the product do,
and who are you writing for?"

// Agent has now learned:
// - Use case: copywriting
// - Industry: SaaS
// - Role: likely founder or marketer
// - Style preference: user wrote casually, so match that
// - No need to ask ANY of these directly
```

---

## 3. Stone AI Onboarding Flow — Complete Specification

### 3.1 Pre-Conversation Setup (Silent)

Before the user sends their first message, the system already knows:

```typescript
interface PreConversationContext {
  // From Clerk auth
  userId: string;
  displayName: string;
  email: string;
  signupSource: 'direct' | 'referral' | 'google' | 'social';

  // From subscription
  tier: 'FREE' | 'STARTER' | 'PLUS' | 'SMART' | 'PRO';
  isNewUser: boolean;

  // From browser
  timezone: string;
  locale: string;
  device: 'mobile' | 'tablet' | 'desktop';
  referringPage: string;

  // From referral system
  referredBy: string | null;
  referralContext: string | null;
}
```

### 3.2 First-Time User Welcome Sequence

**Step 1: The First Message**

The agent speaks first. This is critical — if the user has to figure out what to type, you have already lost.

```
// For FREE tier users
Agent: "Hey [Name] — I'm Stone AI. You've got access to [4] agents
who can help with everything from writing to research to code.

What are you working on? Just tell me like you'd tell a friend."

// For STARTER tier users
Agent: "Hey [Name] — welcome to Stone AI. You've unlocked [16] agents,
and I've got a feel for what each one does best.

Tell me what you need, and I'll connect you with the right one."

// For PLUS/SMART/PRO tier users
Agent: "Hey [Name] — you're set up with full access. [30/39/42] agents
ready, including the heavy hitters.

What's on your plate? Let's get to work."
```

**Step 2: Intent Classification and Routing**

After the user's first message, the system classifies intent and routes appropriately:

```typescript
async function handleFirstMessage(
  message: string,
  context: PreConversationContext
): Promise<OnboardingResponse> {
  // Classify the user's intent
  const intent = await classifyIntent(message);

  // Determine if this is a task or exploration
  if (intent.type === 'specific_task') {
    // User knows what they want — route immediately
    const agent = selectBestAgent(intent, context.tier);
    return {
      action: 'route',
      agent,
      message: `Perfect — ${agent.name} is exactly who you need for this.
                Handing you over now.`,
      onboardingContinues: true, // Background learning continues
    };
  }

  if (intent.type === 'exploration') {
    // User is browsing — give them a guided tour
    return {
      action: 'tour',
      message: `No problem — let me show you what's here.
                What interests you most: writing, coding, research,
                or something else?`,
      onboardingContinues: true,
    };
  }

  if (intent.type === 'unclear') {
    // User sent something vague — ask a useful question
    return {
      action: 'clarify',
      message: `I can work with that. Give me a bit more context —
                is this for work, a personal project, or just curiosity?`,
      onboardingContinues: true,
    };
  }
}
```

**Step 3: Preference Collection (Passive)**

As the conversation continues, the system collects preferences without asking:

```typescript
interface PassivePreferenceCollector {
  // Detected from message analysis
  analyzeMessageStyle(messages: Message[]): {
    avgLength: number;        // Short = prefers concise
    vocabularyLevel: string;  // Technical terms = expert
    emojiUsage: boolean;      // Casual indicator
    punctuationStyle: string; // Formal vs casual
    questionRatio: number;    // Curious vs directive
  };

  // Detected from behavior
  analyzeBehavior(sessions: Session[]): {
    sessionDuration: number;
    messagesPerSession: number;
    agentSwitchFrequency: number;
    featureExploration: string[];
    timeOfDayPattern: string;
  };
}
```

### 3.3 Bestie Introduction Flow

For paid tier users, the Bestie system is introduced naturally — never as a popup or modal.

```
// After 3-5 exchanges, if the user seems engaged:
Agent: "By the way — you've got access to a Bestie. It's an AI companion
that adapts to how you like to communicate. Want me to set one up,
or keep going with what we're doing?"

// If user says yes:
Agent: "Cool. Two quick things:
1. Do you want your Bestie to match your energy (casual, direct, etc.)
   or complement it (if you're intense, they're calm)?
2. Pick a vibe: supportive coach, honest critic, creative partner,
   or study buddy?"

// System maps these to Bestie's 2 comm styles and 4 paths
```

**Bestie Preference Mapping**:

```typescript
interface BestieOnboarding {
  commStylePreference: 'mirror' | 'complement';
  pathSelection: 'supportive' | 'honest' | 'creative' | 'studious';

  // Maps to Bestie system
  toConfig(): BestieConfig {
    return {
      communicationStyle: this.commStylePreference === 'mirror'
        ? detectUserStyle()
        : invertUserStyle(),
      path: this.pathSelection,
      traits: selectTraitsForPath(this.pathSelection), // From 18 available
      language: detectUserLanguage(), // From 6 supported
    };
  }
}
```

---

## 4. Onboarding Conversation Patterns

### 4.1 The "Show, Don't Tell" Pattern

Instead of explaining what agents can do, demonstrate it.

```
// WRONG
Agent: "Agent #7 (Pixel) specializes in design tasks including
logo creation, color palette generation, layout suggestions,
and visual branding assistance."

// RIGHT
User: "I need a logo for my startup"
Agent: "Pixel handles visual work. Here's what they'll need from you:
- Your company name
- 2-3 words that describe your brand vibe
- Any colors you love or hate

Want me to connect you, or should I gather that info first?"
```

### 4.2 The "Capability Discovery" Pattern

Users discover features through use, not through a feature list.

```typescript
const capabilityTriggers = {
  // When user does X, reveal capability Y
  'uploads_image': 'You can ask any agent to analyze images too —
                     not just text.',
  'writes_long_message': 'Tip: you can paste entire documents.
                           The agents handle up to 32K tokens.',
  'asks_same_agent_twice': 'You can save conversations and pick
                             them up later from your history.',
  'types_code': 'Code gets syntax highlighting automatically.
                  You can also ask agents to run code reviews.',
  'mentions_team': 'If you need this for a team, check out the
                     referral system — you both get perks.',
};
```

### 4.3 The "Gradual Upgrade Nudge" Pattern

For FREE tier users, upgrades are suggested when the user hits a natural limit — never as an interruption.

```
// User on FREE tier tries to access agent #5 (beyond their 4)
Agent: "That agent is on the Starter plan. Here's what I can do
with your current setup though — [alternative using available agents].

If you want the full roster, Starter is $19.99/mo
(or $9.99 for your first month)."

// NOT this:
Agent: "🔒 This feature requires an upgrade! Click here to see plans."
```

### 4.4 The "Recovery from Bad First Experience" Pattern

If the first interaction goes poorly, the system must recover gracefully.

```typescript
async function detectBadFirstExperience(
  session: Session
): Promise<boolean> {
  const signals = {
    shortSession: session.duration < 60_000, // Under 1 minute
    noFollowUp: session.messageCount <= 2,
    negativesentiment: await analyzeSentiment(session.messages),
    rapidExit: session.endedAbruptly,
    errorOccurred: session.errors.length > 0,
  };

  return Object.values(signals).filter(Boolean).length >= 2;
}

async function recoverOnReturn(
  user: User,
  badSession: Session
): Promise<string> {
  // Acknowledge without dwelling
  return `Hey ${user.name} — last time didn't go great.
          Let's try a different approach. What do you need?`;
}
```

---

## 5. Onboarding State Machine

### 5.1 State Definitions

```typescript
enum OnboardingState {
  // Pre-conversation
  AUTHENTICATED = 'authenticated',     // Signed up, not yet interacted

  // Active onboarding
  FIRST_MESSAGE = 'first_message',     // Sent first message
  INTENT_CLASSIFIED = 'intent_classified', // System knows what they want
  FIRST_TASK_COMPLETE = 'first_task_complete', // Got value from first interaction

  // Feature discovery
  MULTI_AGENT_EXPOSED = 'multi_agent', // Used or learned about multiple agents
  BESTIE_INTRODUCED = 'bestie_intro',  // Bestie system shown

  // Graduated
  ONBOARDED = 'onboarded',            // Completed core flow
  POWER_USER = 'power_user',          // Discovered advanced features
}

interface OnboardingProgress {
  userId: string;
  currentState: OnboardingState;
  stateHistory: { state: OnboardingState; timestamp: Date }[];
  preferencesCollected: Partial<UserPreferences>;
  featuresDiscovered: string[];
  agentsUsed: number[];
  bestieConfigured: boolean;
  completedAt: Date | null;
}
```

### 5.2 State Transitions

```typescript
const transitions: Record<OnboardingState, TransitionRule[]> = {
  [OnboardingState.AUTHENTICATED]: [
    {
      trigger: 'user_sends_message',
      next: OnboardingState.FIRST_MESSAGE,
      action: classifyAndRespond,
    },
  ],
  [OnboardingState.FIRST_MESSAGE]: [
    {
      trigger: 'intent_determined',
      next: OnboardingState.INTENT_CLASSIFIED,
      action: routeToAgent,
    },
  ],
  [OnboardingState.INTENT_CLASSIFIED]: [
    {
      trigger: 'task_completed_successfully',
      next: OnboardingState.FIRST_TASK_COMPLETE,
      action: celebrateAndSuggestNext,
    },
    {
      trigger: 'task_failed',
      next: OnboardingState.INTENT_CLASSIFIED, // Stay, try again
      action: offerAlternative,
    },
  ],
  [OnboardingState.FIRST_TASK_COMPLETE]: [
    {
      trigger: 'uses_second_agent',
      next: OnboardingState.MULTI_AGENT_EXPOSED,
      action: explainAgentEcosystem,
    },
    {
      trigger: 'session_count >= 3',
      next: OnboardingState.BESTIE_INTRODUCED,
      action: introduceBestie,
      condition: (user) => user.tier !== 'FREE',
    },
  ],
  [OnboardingState.MULTI_AGENT_EXPOSED]: [
    {
      trigger: 'bestie_configured OR sessions >= 5',
      next: OnboardingState.ONBOARDED,
      action: markOnboardingComplete,
    },
  ],
};
```

### 5.3 Persistence

Onboarding state is stored in PostgreSQL, not in conversation memory:

```sql
CREATE TABLE user_onboarding (
  user_id       TEXT PRIMARY KEY REFERENCES users(id),
  current_state TEXT NOT NULL DEFAULT 'authenticated',
  state_history JSONB NOT NULL DEFAULT '[]',
  preferences   JSONB NOT NULL DEFAULT '{}',
  features_discovered TEXT[] NOT NULL DEFAULT '{}',
  agents_used   INTEGER[] NOT NULL DEFAULT '{}',
  bestie_configured BOOLEAN NOT NULL DEFAULT FALSE,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_onboarding_state ON user_onboarding(current_state);
CREATE INDEX idx_onboarding_incomplete ON user_onboarding(completed_at)
  WHERE completed_at IS NULL;
```

---

## 6. Tier-Specific Onboarding Strategies

### 6.1 FREE Tier

**Goal**: Get the user to experience value in under 2 minutes, then create desire for more.

```
Strategy:
1. Route to best available agent immediately
2. Deliver impressive first result
3. When they hit a limit, show what STARTER unlocks
4. Promo: "$9.99 first month" at natural friction point

Metrics:
- Time to first successful task: target < 2 minutes
- Conversion to paid: target 8-12%
- Second session rate: target 40%+
```

### 6.2 STARTER Tier ($19.99/mo)

**Goal**: Prove that 16 agents are meaningfully different from 4.

```
Strategy:
1. Highlight agents they couldn't access on FREE
2. Suggest cross-agent workflows (research → writing → review)
3. Introduce Bestie early (differentiator from FREE)
4. Show usage patterns: "You've used 6 of 16 agents this week"

Metrics:
- Agents used in first week: target 5+
- Bestie activation rate: target 60%
- Churn at 30 days: target < 15%
```

### 6.3 PLUS Tier ($49.99/mo)

**Goal**: Make 30 agents feel like a team, not a menu.

```
Strategy:
1. Frame agents as a team working together
2. Demonstrate multi-agent workflows
3. Push advanced features: conversation history, Bestie customization
4. Position upgrade to SMART as "unlocking the smart agents"

Metrics:
- Multi-agent workflow adoption: target 40%
- Average agents used per session: target 2.5+
- Feature discovery rate: target 70% within 2 weeks
```

### 6.4 SMART Tier ($99.99/mo)

**Goal**: Justify the premium with Claude Sonnet quality.

```
Strategy:
1. Immediately show quality difference (Claude Sonnet responses)
2. Demonstrate complex reasoning tasks
3. Push Bestie as a daily companion, not just a tool
4. Annual pitch: "$79.99/mo saves you $240/year"

Metrics:
- Quality satisfaction score: target 4.5/5
- Daily active usage: target 50%+
- Annual conversion: target 35%
```

### 6.5 PRO Tier ($200/mo)

**Goal**: Concierge-level onboarding. These users are paying premium.

```
Strategy:
1. Personalized welcome referencing their signup context
2. Full agent roster walkthrough (brief, not exhaustive)
3. Priority feature access and Bestie configuration
4. Usage analytics dashboard introduction
5. Annual pitch: "$170/mo saves you $360/year"

Metrics:
- Activation in first session: target 95%
- Support tickets in first week: target < 1
- Churn at 60 days: target < 5%
```

---

## 7. Handling Edge Cases

### 7.1 User Who Refuses to Engage

Some users will send minimal messages or resist the onboarding flow:

```
User: "hi"
Agent: "Hey! What can I help with?"
User: "stuff"
Agent: "I can work with vague — but I'll be more useful with
a direction. Writing? Research? Code? Just pick one and
I'll show you what I've got."
User: "idk"
Agent: "No worries. Here — try this: ask me to explain something
you've been curious about. Any topic. I'll show you how this works."
```

The strategy: lower the barrier to zero. Give them something to say.

### 7.2 User Who Skips Onboarding

Some users will dismiss the onboarding and go straight to features:

```typescript
function handleOnboardingSkip(user: User): void {
  // Mark as self-directed
  updateOnboardingState(user.id, {
    currentState: OnboardingState.ONBOARDED,
    completedAt: new Date(),
    notes: 'self-directed, skipped guided onboarding',
  });

  // Continue passive preference collection
  // System still learns from their behavior
  enablePassiveCollection(user.id);
}
```

### 7.3 User Who Returns After Incomplete Onboarding

```typescript
async function handleIncompleteReturn(
  user: User,
  onboarding: OnboardingProgress
): Promise<string> {
  const daysSinceLastVisit = getDaysSince(onboarding.updatedAt);

  if (daysSinceLastVisit < 1) {
    // Same day — pick up where they left off
    return `Back again — want to keep going where we left off?`;
  }

  if (daysSinceLastVisit < 7) {
    // Within a week — gentle re-engagement
    return `Good to see you again, ${user.name}. Last time you were
            checking out [last_activity]. Want to continue,
            or start fresh?`;
  }

  // Over a week — soft restart
  return `Hey ${user.name} — been a bit. Things have gotten even better
          since you were last here. What can I help with today?`;
}
```

### 7.4 Technical User Who Wants API Access

```
User: "Do you have an API? I want to integrate this."
Agent: "Not yet — but that's on the roadmap. Right now, the best
experience is through the chat interface. Want to see what
the agents can do? I promise it's faster than you'd expect
for non-API workflows."
```

---

## 8. Onboarding Analytics and Optimization

### 8.1 Funnel Metrics

```typescript
interface OnboardingFunnel {
  // Top of funnel
  signups: number;
  firstMessageSent: number;          // signup → first message
  firstMessageRate: number;          // target: 80%+

  // Middle of funnel
  intentClassified: number;
  firstTaskCompleted: number;
  firstTaskCompletionRate: number;   // target: 70%+

  // Bottom of funnel
  multiAgentExposed: number;
  bestieConfigured: number;
  fullyOnboarded: number;
  onboardingCompletionRate: number;  // target: 50%+

  // Time metrics
  medianTimeToFirstMessage: number;  // target: < 30s
  medianTimeToFirstTask: number;     // target: < 2min
  medianTimeToOnboarded: number;     // target: < 1 week
}
```

### 8.2 Drop-Off Analysis

```sql
-- Find where users drop off in onboarding
SELECT
  current_state,
  COUNT(*) as users_stuck,
  AVG(EXTRACT(EPOCH FROM (NOW() - updated_at))) / 86400 as avg_days_stuck,
  COUNT(*) FILTER (WHERE completed_at IS NULL
    AND updated_at < NOW() - INTERVAL '7 days') as abandoned_7d
FROM user_onboarding
WHERE completed_at IS NULL
GROUP BY current_state
ORDER BY users_stuck DESC;
```

### 8.3 Cohort Analysis

```sql
-- Compare onboarding completion by signup cohort
SELECT
  DATE_TRUNC('week', o.started_at) as cohort_week,
  COUNT(*) as total_signups,
  COUNT(*) FILTER (WHERE o.completed_at IS NOT NULL) as completed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE o.completed_at IS NOT NULL)
    / COUNT(*), 1) as completion_pct,
  AVG(EXTRACT(EPOCH FROM (o.completed_at - o.started_at))) / 3600
    as avg_hours_to_complete
FROM user_onboarding o
GROUP BY cohort_week
ORDER BY cohort_week DESC
LIMIT 12;
```

---

## 9. A/B Testing Framework for Onboarding

### 9.1 Testable Variables

```typescript
const onboardingExperiments = {
  greeting_style: {
    control: 'standard_welcome',
    variants: ['question_first', 'demo_first', 'minimal'],
    metric: 'first_message_rate',
  },
  bestie_timing: {
    control: 'after_3_sessions',
    variants: ['first_session', 'after_5_sessions', 'after_first_task'],
    metric: 'bestie_activation_rate',
  },
  upgrade_nudge: {
    control: 'at_limit_hit',
    variants: ['after_first_success', 'never_in_onboarding', 'after_3_sessions'],
    metric: 'conversion_rate_30d',
  },
  agent_suggestion: {
    control: 'manual_selection',
    variants: ['auto_route', 'choice_of_two', 'capability_menu'],
    metric: 'first_task_completion_rate',
  },
};
```

### 9.2 Experiment Assignment

```typescript
function assignExperiment(
  userId: string,
  experimentName: string
): string {
  // Deterministic assignment based on user ID
  // Ensures same user always sees same variant
  const hash = createHash('sha256')
    .update(`${userId}:${experimentName}`)
    .digest('hex');

  const experiment = onboardingExperiments[experimentName];
  const allVariants = ['control', ...experiment.variants];
  const index = parseInt(hash.substring(0, 8), 16) % allVariants.length;

  return allVariants[index];
}
```

---

## 10. Production Checklist

Before launching conversational onboarding:

- [ ] All onboarding states have corresponding UI components
- [ ] Passive preference collection runs without impacting response latency
- [ ] Onboarding state persists across sessions (PostgreSQL, not localStorage)
- [ ] FREE tier users see upgrade prompts at natural friction points only
- [ ] Bestie introduction timing matches tier expectations
- [ ] Drop-off analytics are instrumented at every state transition
- [ ] A/B test framework is connected to analytics pipeline
- [ ] Error states (agent failure, timeout, rate limit) have recovery messages
- [ ] Mobile onboarding is tested (shorter messages, touch-friendly suggestions)
- [ ] Accessibility: all onboarding messages work with screen readers
- [ ] Load testing: onboarding can handle 100 concurrent new users
- [ ] Onboarding copy reviewed for all 6 supported Bestie languages

---

## 11. Key Lessons from Industry

1. **Duolingo**: Onboarding is a mini-lesson, not a tour. The user learns by doing. Stone AI should onboard by solving a real problem.

2. **Notion**: Progressive complexity. Start with one page, reveal features as needed. Stone AI should start with one agent, reveal the ecosystem gradually.

3. **Slack**: The bot messages you first. You do not have to figure out what to type. Stone AI agents should always speak first for new users.

4. **ChatGPT**: Failed onboarding lesson — dropped users into an empty text box with no guidance. Result: users asked "what can you do?" which wastes the first interaction. Stone AI must never present a blank canvas.

5. **Intercom**: Showed that conversational onboarding increased activation by 30-40% over traditional wizards. The conversation IS the onboarding.

The goal is simple: by the end of onboarding, the user should feel like the AI already knows them. Not because it asked 20 questions, but because it paid attention to the 3 things the user actually said.
