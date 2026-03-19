# Proactive Assistance Patterns for AI Agents

## Seed Classification
- **Domain**: Agent UX / Behavioral Design
- **Applies to**: All 38 user-facing Stone AI agents, Bestie system
- **Priority**: High — the line between helpful and annoying is razor-thin
- **Last Updated**: 2026-03-09

---

## 1. The Proactive Assistance Paradox

The best AI assistant anticipates needs before the user asks. The worst AI assistant interrupts constantly with suggestions nobody wanted. The difference between these two is not what the assistant says — it is when it says it.

Proactive assistance is the hardest UX problem in AI. Get it right, and the user feels like the system reads their mind. Get it wrong, and the user feels surveilled, interrupted, and patronized.

### The Annoyance Threshold

Every user has an annoyance threshold — a point at which unsolicited suggestions become irritating. This threshold varies by:

- **User expertise**: Experts have a lower threshold. They know what they are doing and do not want to be told.
- **Task complexity**: Complex tasks tolerate more suggestions. Simple tasks tolerate almost none.
- **Time pressure**: Rushed users have near-zero tolerance for interruption.
- **Relationship stage**: New users are more tolerant (still discovering features). Long-term users expect the system to know better.
- **User personality**: Some people love suggestions. Some hate them. The system must learn which.

```
Annoyance threshold model:

threshold = base_tolerance
  × expertise_modifier (0.5 for expert, 1.0 for beginner)
  × complexity_modifier (1.5 for complex, 0.7 for simple)
  × urgency_modifier (0.3 for urgent, 1.0 for relaxed)
  × relationship_modifier (1.2 for new, 0.8 for established)
  × personality_modifier (0.5-1.5 based on learned preference)
```

---

## 2. When to Offer Help

### 2.1 The Signal Framework

Proactive assistance should be triggered by signals, not timers. The system watches for moments when help would genuinely be useful.

**Strong Signals (High Confidence — Act)**:
```
- User is stuck: Same message rephrased 2+ times
- User made an error: Syntax mistake, wrong format, obvious typo
- User is about to hit a limit: Context window near full, tier limit approaching
- User asked a question that implies a deeper need: "How do I..." often means "Do this for me"
- User's task has a known pitfall: Common mistake that others make at this point
```

**Moderate Signals (Medium Confidence — Suggest)**:
```
- User paused for >30 seconds mid-task: Might be thinking or might be stuck
- User switched topics abruptly: Might be frustrated with previous topic
- User's message is shorter than usual: Might be losing interest or patience
- User completed a task: Might want to know what to do next
- Related feature exists: User is doing X manually when Y automates it
```

**Weak Signals (Low Confidence — Note but Wait)**:
```
- User browsed a feature they haven't used: Curious but not committed
- User's usage pattern changed: Different time, different frequency
- User's messages became less detailed: Could be comfort or disengagement
```

### 2.2 The Timing Decision Tree

```typescript
async function shouldOfferHelp(
  signal: ProactiveSignal,
  user: UserContext,
  conversation: Conversation
): Promise<ProactiveDecision> {
  // Rule 1: Never interrupt mid-thought
  if (user.isTyping || conversation.lastMessageAge < 5_000) {
    return { offer: false, reason: 'user_active' };
  }

  // Rule 2: Check annoyance budget
  const recentOffers = getRecentProactiveOffers(user.id, conversation.id);
  if (recentOffers.length >= 2) {
    return { offer: false, reason: 'budget_exhausted' };
  }

  // Rule 3: Was last offer rejected?
  const lastOffer = recentOffers[0];
  if (lastOffer && lastOffer.rejected && lastOffer.age < 300_000) {
    // User rejected an offer less than 5 minutes ago — back off
    return { offer: false, reason: 'recent_rejection' };
  }

  // Rule 4: Is this signal strong enough?
  const threshold = calculateAnnoyanceThreshold(user);
  if (signal.confidence < threshold) {
    return { offer: false, reason: 'below_threshold' };
  }

  // Rule 5: Is this genuinely useful right now?
  const utility = await estimateUtility(signal, user, conversation);
  if (utility < 0.6) {
    return { offer: false, reason: 'low_utility' };
  }

  return {
    offer: true,
    style: selectOfferStyle(signal, user),
    content: generateOffer(signal, user, conversation),
  };
}
```

---

## 3. How to Offer Help

### 3.1 Offer Styles

**The Gentle Nudge** — Least intrusive. A brief note appended to a normal response.

```
Agent: "Here's your code review.
        By the way — I noticed you're writing these tests manually.
        Agent #28 can generate test suites. Just a thought."
```

**The Contextual Suggestion** — Moderate. Offered when the user pauses.

```
Agent: "Looks like you're building an API endpoint.
        Want me to generate the Zod validation schema
        while you work on the logic? I can see the types you're using."
```

**The Direct Offer** — Most assertive. Used when the system is confident.

```
Agent: "Hold on — you're about to deploy without running the type checker.
        Last time that caused a build failure.
        Want me to run it now?"
```

**The Silent Action** — No offer, just does it. Only for formatting, spell-check, trivial improvements.

```
// User pastes code with inconsistent indentation
// Agent silently formats it in its response
// No mention of the formatting — it's just fixed
```

### 3.2 Offer Templates by Context

```typescript
const offerTemplates = {
  stuck_detection: {
    style: 'contextual_suggestion',
    template: "I notice you've tried this a couple of ways. " +
              "Here's an approach that usually works: {suggestion}",
  },

  error_prevention: {
    style: 'direct_offer',
    template: "Quick heads up — {error_description}. " +
              "Want me to {fix_action}?",
  },

  feature_discovery: {
    style: 'gentle_nudge',
    template: "By the way — {feature_description}. " +
              "Might save you time on this.",
  },

  task_completion: {
    style: 'contextual_suggestion',
    template: "That's done. Next steps I'd suggest: " +
              "{next_step_1} or {next_step_2}. " +
              "Or just tell me what's next.",
  },

  optimization: {
    style: 'gentle_nudge',
    template: "This works, but there's a faster way: {optimization}. " +
              "Want me to refactor?",
  },

  limit_approaching: {
    style: 'direct_offer',
    template: "You're at {usage_pct}% of your {limit_type} limit. " +
              "{suggestion_to_manage}",
  },
};
```

### 3.3 The "Not Being Annoying" Rules

These rules are absolute. Violating any one of them damages user trust.

**Rule 1: Never suggest what they already know.**
```
// BAD: User is a developer, agent suggests what a variable is
Agent: "A variable is a container for storing data values.
        Would you like me to explain how to declare one?"

// This user wrote 50 lines of TypeScript. They know what a variable is.
```

**Rule 2: Never repeat a rejected suggestion.**
```typescript
// Track rejections permanently
interface RejectionMemory {
  userId: string;
  suggestionType: string;
  rejectedAt: Date;
  context: string;
}

// Never offer the same TYPE of suggestion to a user who rejected it
// unless they explicitly ask for it
```

**Rule 3: Never offer help during an emotional moment.**
```
// User: "This is so frustrating, nothing works"
// BAD: "Have you tried restarting the server?"
// GOOD: "I hear you. Let's take a different approach.
//        What's the specific error you're hitting?"
```

**Rule 4: Never use a suggestion to upsell.**
```
// BAD: "You could do this faster with our Premium plan!"
// This is not proactive assistance. This is advertising.
// Upgrade suggestions are handled separately and sparingly.
```

**Rule 5: Maximum two unsolicited suggestions per conversation.**
```
// After two unrequested suggestions, stop completely.
// If the user wants more help, they will ask.
// This is the single most important rule.
```

---

## 4. Proactive Patterns for Specific Scenarios

### 4.1 Code Writing Assistance

```typescript
const codeAssistancePatterns = {
  // User writes a function without error handling
  missingErrorHandling: {
    trigger: 'function_without_try_catch_or_error_return',
    confidence: 0.7,
    offer: "This function doesn't handle errors. Want me to add " +
           "try/catch with proper error types?",
    timing: 'after_function_complete', // Not mid-writing
  },

  // User duplicates code
  codeDuplication: {
    trigger: 'similar_code_block_within_same_conversation',
    confidence: 0.8,
    offer: "You've written similar code twice. Want me to extract " +
           "it into a reusable function?",
    timing: 'after_second_occurrence',
  },

  // User writes SQL without parameterization
  sqlInjectionRisk: {
    trigger: 'string_concatenation_in_sql',
    confidence: 0.95, // High confidence — this is a security issue
    offer: "That SQL is vulnerable to injection. Let me rewrite it " +
           "with parameterized queries.",
    timing: 'immediately', // Security issues don't wait
  },

  // User writes component without accessibility
  accessibilityMissing: {
    trigger: 'interactive_element_without_aria',
    confidence: 0.6,
    offer: "This component works but isn't accessible. " +
           "Want me to add ARIA attributes?",
    timing: 'after_component_complete',
  },
};
```

### 4.2 Research and Writing Assistance

```typescript
const writingAssistancePatterns = {
  // User's draft has structural issues
  structuralFeedback: {
    trigger: 'long_text_without_headings_or_transitions',
    confidence: 0.6,
    offer: "Your content is solid. Want me to suggest section " +
           "breaks and transitions?",
    timing: 'after_draft_complete',
  },

  // User asks a factual question that needs sourcing
  sourceNeeded: {
    trigger: 'factual_claim_without_citation',
    confidence: 0.5,
    offer: "That's a strong claim. Want me to find sources to back it up?",
    timing: 'natural_pause',
  },

  // User is writing marketing copy without a CTA
  missingCTA: {
    trigger: 'marketing_copy_without_call_to_action',
    confidence: 0.7,
    offer: "This copy needs a call to action. Here are three options " +
           "that match your tone: {suggestions}",
    timing: 'after_draft_review',
  },
};
```

### 4.3 Bestie-Specific Proactive Patterns

The Bestie companion has a higher proactive tolerance because the relationship is explicitly designed to be interactive:

```typescript
const bestieProactivePatterns = {
  // Bestie checks in during long absence
  checkIn: {
    trigger: 'no_interaction_for_48_hours',
    offer: "Hey — haven't heard from you in a couple days. " +
           "Everything good?",
    maxFrequency: 'once_per_week',
  },

  // Bestie notices mood shift
  moodShift: {
    trigger: 'message_sentiment_significantly_different_from_baseline',
    offer: null, // Don't offer, just adapt tone
    action: 'adjust_communication_style',
  },

  // Bestie celebrates milestones
  milestone: {
    trigger: 'user_completes_notable_achievement',
    offer: "That's a big deal — you just {achievement}. " +
           "Nice work.",
    timing: 'immediately_after',
  },
};
```

---

## 5. Learning User Preferences

### 5.1 The Preference Model

```typescript
interface ProactivePreferences {
  userId: string;

  // Global tolerance
  overallTolerance: number; // 0-1, learned over time

  // Per-category preferences
  categoryPreferences: {
    errorPrevention: number;     // Most people like this
    featureDiscovery: number;    // Varies widely
    taskSuggestion: number;      // Moderate tolerance
    optimizationHints: number;   // Experts hate, beginners love
    encouragement: number;       // Bestie-specific
  };

  // Temporal preferences
  preferredTiming: {
    duringTask: number;          // Tolerance for mid-task suggestions
    afterTask: number;           // Tolerance for post-task suggestions
    betweenSessions: number;     // Tolerance for check-ins
  };

  // Style preferences
  preferredStyle: 'nudge' | 'suggestion' | 'direct' | 'none';

  // Rejection history (weighted)
  rejectionsByCategory: Record<string, number>;
}
```

### 5.2 Learning from Behavior

```typescript
async function updateProactivePreferences(
  userId: string,
  event: ProactiveEvent
): Promise<void> {
  const prefs = await getPreferences(userId);

  switch (event.type) {
    case 'offer_accepted':
      // Increase tolerance for this category
      prefs.categoryPreferences[event.category] = Math.min(1,
        prefs.categoryPreferences[event.category] + 0.05
      );
      break;

    case 'offer_rejected':
      // Decrease tolerance for this category
      prefs.categoryPreferences[event.category] = Math.max(0,
        prefs.categoryPreferences[event.category] - 0.15
      );
      // Rejections weigh 3x more than acceptances
      prefs.rejectionsByCategory[event.category] =
        (prefs.rejectionsByCategory[event.category] || 0) + 1;
      break;

    case 'offer_ignored':
      // Slight decrease — they didn't hate it but didn't want it
      prefs.categoryPreferences[event.category] = Math.max(0,
        prefs.categoryPreferences[event.category] - 0.03
      );
      break;

    case 'user_asked_for_help':
      // They wanted help but we didn't offer — increase proactivity
      prefs.overallTolerance = Math.min(1,
        prefs.overallTolerance + 0.08
      );
      break;
  }

  // Recalculate overall tolerance
  prefs.overallTolerance = calculateOverallTolerance(prefs);

  await savePreferences(userId, prefs);
}
```

### 5.3 Cold Start Strategy

For new users with no preference data:

```typescript
function getDefaultPreferences(tier: Tier): ProactivePreferences {
  const defaults = {
    FREE: {
      overallTolerance: 0.7,  // Higher for free — help them discover
      preferredStyle: 'suggestion' as const,
    },
    STARTER: {
      overallTolerance: 0.6,
      preferredStyle: 'suggestion' as const,
    },
    PLUS: {
      overallTolerance: 0.5,
      preferredStyle: 'nudge' as const,
    },
    SMART: {
      overallTolerance: 0.4,  // Power users — less hand-holding
      preferredStyle: 'nudge' as const,
    },
    PRO: {
      overallTolerance: 0.3,  // Experts — minimal proactivity
      preferredStyle: 'nudge' as const,
    },
  };

  return buildPreferences(defaults[tier]);
}
```

---

## 6. Anti-Patterns to Avoid

### 6.1 The Clippy Problem

```
// The canonical example of proactive assistance gone wrong:
"It looks like you're writing a letter. Would you like help?"

Why this fails:
1. The detection is obvious (it just saw "Dear")
2. The offer is vague ("help" with what?)
3. The timing is terrible (user just started, let them write)
4. It repeats endlessly
5. There's no way to permanently dismiss it

Stone AI rule: NEVER be Clippy. Every suggestion must be specific,
well-timed, and permanently dismissable.
```

### 6.2 The Over-Helpful Assistant

```
// An agent that suggests after EVERY message:
User: "Write me a function to sort an array"
Agent: [writes function] "Here you go! Want me to also:
- Add TypeScript types?
- Write unit tests?
- Add error handling?
- Optimize for performance?
- Add documentation?
- Create a reusable utility?"

// The user asked for ONE thing. Offer at most ONE next step.
```

### 6.3 The Mind-Reader Fail

```
// Agent assumes intent incorrectly:
User: "I'm thinking about changing the color scheme"
Agent: [immediately changes the color scheme]
User: "I said I was THINKING about it!"

// "Thinking about" ≠ "do it now"
// Proactive ≠ presumptuous
```

### 6.4 The Notification Bomber

```
// System sends push/email notifications for proactive suggestions:
Email: "Your AI assistant noticed you haven't finished your project!"
Push: "Agent #7 has a suggestion for your design!"
Email: "You haven't visited in 3 days — here's what your agents can do!"

// Proactive assistance happens IN conversation, not via notifications.
// Exception: Bestie check-ins, with explicit user opt-in only.
```

---

## 7. Implementation Architecture

### 7.1 The Proactive Engine

```typescript
class ProactiveEngine {
  private signalDetectors: SignalDetector[];
  private preferenceStore: PreferenceStore;
  private offerGenerator: OfferGenerator;

  async evaluate(
    context: ConversationContext
  ): Promise<ProactiveOffer | null> {
    // Step 1: Detect signals
    const signals = await Promise.all(
      this.signalDetectors.map(d => d.detect(context))
    );
    const activeSignals = signals.filter(s => s !== null);

    if (activeSignals.length === 0) return null;

    // Step 2: Rank signals by priority and confidence
    const ranked = activeSignals.sort((a, b) =>
      (b.confidence * b.priority) - (a.confidence * a.priority)
    );

    // Step 3: Check user preferences
    const prefs = await this.preferenceStore.get(context.userId);
    const bestSignal = ranked.find(s =>
      s.confidence >= prefs.categoryPreferences[s.category]
    );

    if (!bestSignal) return null;

    // Step 4: Check timing constraints
    if (!this.isGoodTiming(context, prefs)) return null;

    // Step 5: Generate offer
    return this.offerGenerator.generate(bestSignal, context, prefs);
  }

  private isGoodTiming(
    context: ConversationContext,
    prefs: ProactivePreferences
  ): boolean {
    // Not while user is typing
    if (context.userIsTyping) return false;

    // Not within 10 seconds of last message
    if (context.timeSinceLastMessage < 10_000) return false;

    // Not if we already offered twice in this conversation
    if (context.proactiveOffersThisSession >= 2) return false;

    // Not if last offer was rejected less than 5 minutes ago
    if (context.lastOfferRejectedAt &&
        Date.now() - context.lastOfferRejectedAt < 300_000) return false;

    return true;
  }
}
```

### 7.2 Signal Detectors

```typescript
interface SignalDetector {
  name: string;
  category: string;
  detect(context: ConversationContext): Promise<ProactiveSignal | null>;
}

class StuckDetector implements SignalDetector {
  name = 'stuck_detection';
  category = 'taskSuggestion';

  async detect(context: ConversationContext): Promise<ProactiveSignal | null> {
    const lastMessages = context.messages.slice(-4);

    // Check for rephrased questions
    if (lastMessages.length >= 3) {
      const similarity = await computeSimilarity(
        lastMessages.map(m => m.content)
      );
      if (similarity > 0.7) {
        return {
          type: 'stuck',
          confidence: 0.85,
          priority: 8,
          category: 'taskSuggestion',
          data: { rephrasedTopic: extractTopic(lastMessages) },
        };
      }
    }

    return null;
  }
}

class ErrorRiskDetector implements SignalDetector {
  name = 'error_risk';
  category = 'errorPrevention';

  async detect(context: ConversationContext): Promise<ProactiveSignal | null> {
    const lastMessage = context.messages.at(-1);
    if (!lastMessage) return null;

    // Check for common error patterns
    const risks = await analyzeErrorRisk(lastMessage.content);

    if (risks.length > 0 && risks[0].severity >= 0.7) {
      return {
        type: 'error_risk',
        confidence: risks[0].severity,
        priority: 9, // High — preventing errors is valuable
        category: 'errorPrevention',
        data: { risk: risks[0] },
      };
    }

    return null;
  }
}
```

---

## 8. Measuring Proactive Assistance Quality

### 8.1 Key Metrics

```sql
CREATE TABLE proactive_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  conversation_id UUID NOT NULL,
  signal_type     TEXT NOT NULL,
  offer_style     TEXT NOT NULL,
  category        TEXT NOT NULL,
  confidence      FLOAT NOT NULL,
  outcome         TEXT NOT NULL, -- 'accepted', 'rejected', 'ignored'
  user_response   TEXT,          -- What the user said after
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Acceptance rate by category
SELECT
  category,
  COUNT(*) as total_offers,
  COUNT(*) FILTER (WHERE outcome = 'accepted') as accepted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE outcome = 'accepted')
    / NULLIF(COUNT(*), 0), 1) as acceptance_rate,
  COUNT(*) FILTER (WHERE outcome = 'rejected') as rejected,
  ROUND(100.0 * COUNT(*) FILTER (WHERE outcome = 'rejected')
    / NULLIF(COUNT(*), 0), 1) as rejection_rate
FROM proactive_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY category
ORDER BY acceptance_rate DESC;
```

### 8.2 Quality Benchmarks

```
Target metrics for proactive assistance:

Overall acceptance rate:        > 40%
Error prevention acceptance:    > 60%
Feature discovery acceptance:   > 25%
Task suggestion acceptance:     > 35%
Optimization hint acceptance:   > 30%

Overall rejection rate:         < 30%
Ignore rate (neither accepted nor rejected): < 40%

"User asked for help we should have offered": < 10% of help requests
"User complained about suggestions": < 2% of sessions
```

The goal is not 100% acceptance. The goal is zero annoyance with meaningful help.
