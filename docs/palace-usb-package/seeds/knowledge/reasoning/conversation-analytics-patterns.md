# Conversation Analytics Patterns for AI Agents

## Seed Classification
- **Domain**: Product Analytics / Conversation Quality
- **Applies to**: All Stone AI agents, analytics pipeline, quality monitoring
- **Priority**: High — you cannot improve what you do not measure
- **Last Updated**: 2026-03-09

---

## 1. What to Measure in AI Conversations

Most AI products track vanity metrics: total messages, daily active users, sessions. These tell you that people are using the product. They tell you nothing about whether the product is good.

Conversation analytics must answer three questions:
1. **Did the user accomplish what they came to do?** (Task completion)
2. **Was the experience good?** (Satisfaction)
3. **Will the user come back?** (Retention signal)

Everything else is supporting data.

---

## 2. Core Metrics Framework

### 2.1 Task Completion Rate

The single most important metric. Did the conversation achieve its purpose?

```typescript
interface TaskCompletionMetrics {
  // Explicit completion signals
  explicitSuccess: {
    // User says "thanks", "perfect", "that's exactly what I needed"
    positiveClosing: boolean;
    // User copies code, downloads file, takes action
    actionTaken: boolean;
    // User explicitly says "done" or moves to next topic
    taskClosed: boolean;
  };

  // Implicit completion signals
  implicitSuccess: {
    // Conversation ended naturally (not abruptly)
    naturalEnding: boolean;
    // User sent 3+ messages (engaged, not bounced)
    sustainedEngagement: boolean;
    // User returned within 24 hours (satisfied enough to come back)
    returnVisit: boolean;
  };

  // Failure signals
  failureSignals: {
    // User rephrased the same question 3+ times
    repeatedRephrase: boolean;
    // User expressed frustration
    frustrationDetected: boolean;
    // Conversation ended abruptly (mid-task)
    abruptEnding: boolean;
    // User switched agents for the same task
    agentSwitch: boolean;
    // User left within 60 seconds
    quickBounce: boolean;
  };
}
```

**Computation**:

```sql
-- Task completion scoring
CREATE OR REPLACE FUNCTION score_task_completion(session_id UUID)
RETURNS FLOAT AS $$
DECLARE
  score FLOAT := 0.5; -- Start neutral
  session RECORD;
  messages RECORD[];
  last_user_msg TEXT;
BEGIN
  SELECT * INTO session FROM conversation_sessions WHERE id = session_id;

  -- Get last user message
  SELECT content INTO last_user_msg
  FROM conversation_messages
  WHERE session_id = session_id AND role = 'user'
  ORDER BY created_at DESC LIMIT 1;

  -- Positive signals
  IF last_user_msg ~* '\b(thanks|thank you|perfect|exactly|great|awesome|works)\b' THEN
    score := score + 0.2;
  END IF;

  IF session.message_count >= 4 THEN
    score := score + 0.1; -- Sustained engagement
  END IF;

  IF session.outcome = 'completed' THEN
    score := score + 0.2;
  END IF;

  -- Negative signals
  IF session.message_count <= 2 AND
     EXTRACT(EPOCH FROM (session.last_message - session.first_message)) < 60 THEN
    score := score - 0.3; -- Quick bounce
  END IF;

  IF session.outcome = 'abandoned' THEN
    score := score - 0.2;
  END IF;

  RETURN GREATEST(0, LEAST(1, score));
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Conversation Quality Score (CQS)

A composite score that grades every conversation:

```typescript
interface ConversationQualityScore {
  // Component scores (0-1 each)
  taskCompletion: number;        // Weight: 35%
  userSatisfaction: number;      // Weight: 25%
  agentAccuracy: number;         // Weight: 20%
  conversationEfficiency: number; // Weight: 10%
  toneMatch: number;             // Weight: 10%

  // Composite
  overall: number; // Weighted average, 0-1

  // Grade
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

function calculateCQS(components: Omit<ConversationQualityScore, 'overall' | 'grade'>): ConversationQualityScore {
  const overall =
    components.taskCompletion * 0.35 +
    components.userSatisfaction * 0.25 +
    components.agentAccuracy * 0.20 +
    components.conversationEfficiency * 0.10 +
    components.toneMatch * 0.10;

  const grade =
    overall >= 0.9 ? 'A' :
    overall >= 0.75 ? 'B' :
    overall >= 0.6 ? 'C' :
    overall >= 0.4 ? 'D' : 'F';

  return { ...components, overall, grade };
}
```

### 2.3 Satisfaction Signals

Detecting satisfaction without asking "How was your experience?":

```typescript
class SatisfactionDetector {
  async analyze(conversation: Conversation): Promise<SatisfactionScore> {
    const messages = conversation.messages;
    let score = 0.5; // Neutral start

    // Positive signals
    const positivePatterns = [
      { pattern: /\b(thanks|thank you|ty|thx)\b/i, weight: 0.1 },
      { pattern: /\b(perfect|exactly|great job|well done)\b/i, weight: 0.15 },
      { pattern: /\b(love|amazing|awesome|brilliant)\b/i, weight: 0.1 },
      { pattern: /\b(that.?s? (exactly )?what I (needed|wanted))\b/i, weight: 0.2 },
    ];

    // Negative signals
    const negativePatterns = [
      { pattern: /\b(doesn.t work|not (right|correct|helpful))\b/i, weight: -0.15 },
      { pattern: /\b(wrong|mistake|error|broken)\b/i, weight: -0.1 },
      { pattern: /\b(frustrated|annoyed|useless|terrible)\b/i, weight: -0.2 },
      { pattern: /\b(never mind|forget it|I.ll do it myself)\b/i, weight: -0.25 },
    ];

    // Analyze user messages only (not agent messages)
    const userMessages = messages.filter(m => m.role === 'user');

    for (const msg of userMessages) {
      for (const { pattern, weight } of [...positivePatterns, ...negativePatterns]) {
        if (pattern.test(msg.content)) {
          score += weight;
        }
      }
    }

    // Behavioral signals
    const behaviorScore = this.analyzeBehavior(conversation);
    score = score * 0.7 + behaviorScore * 0.3;

    return {
      score: Math.max(0, Math.min(1, score)),
      confidence: this.calculateConfidence(userMessages.length),
      signals: this.collectSignals(userMessages),
    };
  }

  private analyzeBehavior(conversation: Conversation): number {
    let score = 0.5;

    // Conversation length (longer = more engaged, generally)
    if (conversation.messageCount >= 6) score += 0.1;
    if (conversation.messageCount >= 12) score += 0.05;

    // Message length trend (growing = more engaged)
    const userMsgLengths = conversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content.length);
    if (userMsgLengths.length >= 3) {
      const trend = linearTrend(userMsgLengths);
      if (trend > 0) score += 0.1; // Growing engagement
      if (trend < -0.3) score -= 0.1; // Declining engagement
    }

    // Time between messages (consistent = engaged)
    const gaps = calculateMessageGaps(conversation.messages);
    const avgGap = average(gaps);
    if (avgGap < 30_000) score += 0.05; // Quick responses = engaged

    return score;
  }
}
```

---

## 3. Drop-Off Detection

### 3.1 Where Users Leave

```sql
-- Conversation drop-off analysis
CREATE TABLE conversation_dropoff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  session_id      UUID NOT NULL,
  agent_id        INTEGER NOT NULL,
  dropoff_point   TEXT NOT NULL, -- 'first_message', 'mid_conversation', 'after_error', etc.
  message_count   INTEGER NOT NULL,
  last_user_message TEXT,
  last_agent_message TEXT,
  duration_seconds INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Find where users drop off most
SELECT
  dropoff_point,
  agent_id,
  COUNT(*) as dropoffs,
  AVG(message_count) as avg_messages_before_drop,
  AVG(duration_seconds) as avg_duration_before_drop
FROM conversation_dropoff
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY dropoff_point, agent_id
ORDER BY dropoffs DESC;

-- Identify problematic agent responses that precede dropoffs
SELECT
  last_agent_message,
  COUNT(*) as preceded_dropoff,
  agent_id
FROM conversation_dropoff
WHERE dropoff_point = 'mid_conversation'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY last_agent_message, agent_id
HAVING COUNT(*) >= 3
ORDER BY preceded_dropoff DESC
LIMIT 20;
```

### 3.2 Drop-Off Classification

```typescript
enum DropoffType {
  BOUNCE = 'bounce',           // Left within 60s, 0-1 messages
  EARLY_EXIT = 'early_exit',   // Left within 2min, 2-3 messages
  FRUSTRATION = 'frustration', // Left after negative signal
  TASK_COMPLETE = 'task_done', // Left because done (not a real dropoff)
  TIMEOUT = 'timeout',         // Session expired
  ERROR = 'error',             // Left after system error
  HANDOFF_LOSS = 'handoff',    // Lost during agent handoff
}

async function classifyDropoff(session: ConversationSession): Promise<DropoffType> {
  const duration = session.lastMessage.getTime() - session.firstMessage.getTime();
  const messageCount = session.messageCount;

  // Quick bounce
  if (duration < 60_000 && messageCount <= 1) return DropoffType.BOUNCE;

  // Check for completion (not a real dropoff)
  const completionScore = await scoreTaskCompletion(session.id);
  if (completionScore > 0.7) return DropoffType.TASK_COMPLETE;

  // Check for frustration
  const lastUserMessages = await getLastUserMessages(session.id, 3);
  const frustration = await detectFrustration(lastUserMessages);
  if (frustration > 0.7) return DropoffType.FRUSTRATION;

  // Check for error
  const errors = await getSessionErrors(session.id);
  if (errors.length > 0) return DropoffType.ERROR;

  // Check for handoff
  const handoffs = await getSessionHandoffs(session.id);
  if (handoffs.length > 0 && handoffs[handoffs.length - 1].success === false) {
    return DropoffType.HANDOFF_LOSS;
  }

  // Early exit
  if (duration < 120_000 && messageCount <= 3) return DropoffType.EARLY_EXIT;

  // Default to timeout
  return DropoffType.TIMEOUT;
}
```

---

## 4. Agent Performance Analytics

### 4.1 Per-Agent Scorecard

```sql
-- Agent performance dashboard
CREATE MATERIALIZED VIEW agent_performance AS
SELECT
  cs.agent_id,
  COUNT(*) as total_sessions,
  AVG(cs.message_count) as avg_messages,
  AVG(EXTRACT(EPOCH FROM (cs.last_message - cs.first_message))) as avg_duration_seconds,

  -- Task completion
  AVG(score_task_completion(cs.id)) as avg_completion_score,

  -- Satisfaction (from scored sessions)
  AVG(cqs.user_satisfaction) as avg_satisfaction,
  AVG(cqs.overall) as avg_quality_score,

  -- Efficiency
  AVG(cs.message_count) FILTER (WHERE cs.outcome = 'completed')
    as avg_messages_to_complete,

  -- Problem indicators
  COUNT(*) FILTER (WHERE cs.outcome = 'abandoned') as abandoned_sessions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cs.outcome = 'abandoned')
    / NULLIF(COUNT(*), 0), 1) as abandonment_rate,

  -- Handoff patterns
  COUNT(DISTINCT he.id) as total_handoffs_out,
  COUNT(DISTINCT he2.id) as total_handoffs_in

FROM conversation_sessions cs
LEFT JOIN conversation_quality_scores cqs ON cs.id = cqs.session_id
LEFT JOIN handoff_events he ON cs.agent_id = he.source_agent
  AND cs.user_id = he.user_id
LEFT JOIN handoff_events he2 ON cs.agent_id = he2.target_agent
  AND cs.user_id = he2.user_id
WHERE cs.created_at > NOW() - INTERVAL '30 days'
GROUP BY cs.agent_id;

CREATE UNIQUE INDEX idx_agent_perf ON agent_performance(agent_id);
```

### 4.2 Comparative Agent Analysis

```sql
-- Which agents perform best/worst?
SELECT
  agent_id,
  total_sessions,
  avg_quality_score,
  avg_satisfaction,
  avg_completion_score,
  abandonment_rate,
  avg_messages_to_complete,
  RANK() OVER (ORDER BY avg_quality_score DESC) as quality_rank,
  RANK() OVER (ORDER BY abandonment_rate ASC) as retention_rank
FROM agent_performance
WHERE total_sessions >= 10 -- Minimum sample size
ORDER BY avg_quality_score DESC;
```

---

## 5. User Engagement Analytics

### 5.1 Engagement Funnel

```typescript
interface EngagementFunnel {
  // Daily funnel
  daily: {
    visitedSite: number;
    openedChat: number;
    sentFirstMessage: number;
    receivedResponse: number;
    sentSecondMessage: number;  // Key engagement signal
    completedTask: number;
    returnedSameDay: number;
  };

  // Weekly funnel
  weekly: {
    activeUsers: number;
    multiSessionUsers: number;   // 2+ sessions in a week
    multiAgentUsers: number;     // Used 2+ agents
    powerUsers: number;          // 5+ sessions, 3+ agents
  };

  // Conversion funnel
  conversion: {
    freeSignups: number;
    freeToStarter: number;
    starterToPlus: number;
    plusToSmart: number;
    smartToPro: number;
    conversionRates: Record<string, number>;
  };
}
```

### 5.2 Retention Cohort Analysis

```sql
-- Weekly retention cohorts
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('week', MIN(created_at)) as cohort_week
  FROM conversation_sessions
  GROUP BY user_id
),
activity AS (
  SELECT
    cs.user_id,
    DATE_TRUNC('week', cs.created_at) as activity_week
  FROM conversation_sessions cs
  GROUP BY cs.user_id, DATE_TRUNC('week', cs.created_at)
)
SELECT
  c.cohort_week,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE
    WHEN a.activity_week = c.cohort_week + INTERVAL '1 week'
    THEN a.user_id END) as week_1_retained,
  COUNT(DISTINCT CASE
    WHEN a.activity_week = c.cohort_week + INTERVAL '2 weeks'
    THEN a.user_id END) as week_2_retained,
  COUNT(DISTINCT CASE
    WHEN a.activity_week = c.cohort_week + INTERVAL '4 weeks'
    THEN a.user_id END) as week_4_retained,
  ROUND(100.0 * COUNT(DISTINCT CASE
    WHEN a.activity_week = c.cohort_week + INTERVAL '1 week'
    THEN a.user_id END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 1)
    as week_1_retention_pct
FROM cohorts c
LEFT JOIN activity a ON c.user_id = a.user_id
GROUP BY c.cohort_week
ORDER BY c.cohort_week DESC
LIMIT 12;
```

---

## 6. Quality Monitoring Alerts

### 6.1 Automated Alert System

```typescript
interface QualityAlert {
  type: 'critical' | 'warning' | 'info';
  metric: string;
  threshold: number;
  currentValue: number;
  message: string;
}

const alertRules = [
  {
    name: 'high_abandonment',
    query: `SELECT agent_id, abandonment_rate FROM agent_performance
            WHERE abandonment_rate > 30`,
    type: 'critical' as const,
    message: (row: any) =>
      `Agent #${row.agent_id} has ${row.abandonment_rate}% abandonment rate (threshold: 30%)`,
  },
  {
    name: 'quality_drop',
    query: `SELECT agent_id, avg_quality_score FROM agent_performance
            WHERE avg_quality_score < 0.5`,
    type: 'warning' as const,
    message: (row: any) =>
      `Agent #${row.agent_id} quality score dropped to ${row.avg_quality_score.toFixed(2)} (threshold: 0.50)`,
  },
  {
    name: 'satisfaction_drop',
    query: `SELECT agent_id, avg_satisfaction FROM agent_performance
            WHERE avg_satisfaction < 0.4`,
    type: 'critical' as const,
    message: (row: any) =>
      `Agent #${row.agent_id} satisfaction score is ${row.avg_satisfaction.toFixed(2)} — users are unhappy`,
  },
  {
    name: 'error_spike',
    query: `SELECT COUNT(*) as errors FROM conversation_dropoff
            WHERE dropoff_point = 'after_error'
            AND created_at > NOW() - INTERVAL '1 hour'`,
    type: 'critical' as const,
    threshold: 10,
    message: (row: any) =>
      `${row.errors} error-related dropoffs in the last hour`,
  },
  {
    name: 'bounce_rate_spike',
    query: `SELECT COUNT(*) FILTER (WHERE message_count <= 1) * 100.0
            / NULLIF(COUNT(*), 0) as bounce_rate
            FROM conversation_sessions
            WHERE created_at > NOW() - INTERVAL '1 hour'`,
    type: 'warning' as const,
    threshold: 40,
    message: (row: any) =>
      `Bounce rate is ${row.bounce_rate.toFixed(1)}% in the last hour (threshold: 40%)`,
  },
];

// Run alerting every 15 minutes
async function checkQualityAlerts(): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = [];

  for (const rule of alertRules) {
    const results = await db.$queryRawUnsafe(rule.query);
    for (const row of results as any[]) {
      alerts.push({
        type: rule.type,
        metric: rule.name,
        threshold: rule.threshold || 0,
        currentValue: row[Object.keys(row)[0]],
        message: rule.message(row),
      });
    }
  }

  if (alerts.filter(a => a.type === 'critical').length > 0) {
    // Send founder alert via Three-Headed Monster email system
    await sendFounderAlert({
      alertType: 'quality.critical',
      title: `[QUALITY ALERT] ${alerts.length} issues detected`,
      body: alerts.map(a => `${a.type.toUpperCase()}: ${a.message}`).join('\n'),
    });
  }

  return alerts;
}
```

---

## 7. Conversation Pattern Mining

### 7.1 Common Conversation Paths

```sql
-- Most common conversation patterns (first 3 intents in sequence)
WITH sequenced AS (
  SELECT
    session_id,
    content,
    ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at) as msg_order
  FROM conversation_messages
  WHERE role = 'user'
),
paths AS (
  SELECT
    s1.session_id,
    classify_intent(s1.content) as intent_1,
    classify_intent(s2.content) as intent_2,
    classify_intent(s3.content) as intent_3
  FROM sequenced s1
  LEFT JOIN sequenced s2 ON s1.session_id = s2.session_id AND s2.msg_order = 2
  LEFT JOIN sequenced s3 ON s1.session_id = s3.session_id AND s3.msg_order = 3
  WHERE s1.msg_order = 1
)
SELECT
  intent_1, intent_2, intent_3,
  COUNT(*) as frequency,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM paths
GROUP BY intent_1, intent_2, intent_3
ORDER BY frequency DESC
LIMIT 20;
```

### 7.2 Failure Pattern Detection

```typescript
// Identify recurring failure patterns
async function detectFailurePatterns(
  timeRange: { start: Date; end: Date }
): Promise<FailurePattern[]> {
  // Get all low-quality sessions
  const failedSessions = await db.conversationQualityScores.findMany({
    where: {
      overall: { lte: 0.4 },
      createdAt: { gte: timeRange.start, lte: timeRange.end },
    },
    include: { session: { include: { messages: true } } },
  });

  // Cluster by similarity
  const clusters = await clusterConversations(
    failedSessions.map(s => s.session),
    { minClusterSize: 3, similarityThreshold: 0.7 }
  );

  // For each cluster, identify the common pattern
  return clusters.map(cluster => ({
    pattern: extractCommonPattern(cluster),
    frequency: cluster.length,
    affectedAgents: [...new Set(cluster.map(s => s.agentId))],
    commonIntents: extractCommonIntents(cluster),
    suggestedFix: generateFixSuggestion(cluster),
  }));
}
```

---

## 8. Real-Time Analytics Dashboard

### 8.1 Dashboard Metrics (Admin Panel)

```typescript
interface AnalyticsDashboard {
  // Real-time (last 5 minutes)
  realtime: {
    activeConversations: number;
    messagesPerMinute: number;
    avgResponseTime: number;
    errorRate: number;
  };

  // Today
  today: {
    totalSessions: number;
    uniqueUsers: number;
    avgQualityScore: number;
    avgSatisfaction: number;
    completionRate: number;
    bounceRate: number;
    topAgents: { agentId: number; sessions: number; quality: number }[];
  };

  // Trends (last 30 days)
  trends: {
    dailyActiveUsers: TimeSeriesPoint[];
    qualityScoreTrend: TimeSeriesPoint[];
    satisfactionTrend: TimeSeriesPoint[];
    completionTrend: TimeSeriesPoint[];
    revenuePerConversation: TimeSeriesPoint[];
  };

  // Alerts
  activeAlerts: QualityAlert[];
}
```

### 8.2 SQL Views for Dashboard

```sql
-- Real-time metrics (refresh every 30 seconds)
CREATE OR REPLACE VIEW realtime_metrics AS
SELECT
  COUNT(*) FILTER (WHERE last_message > NOW() - INTERVAL '5 minutes')
    as active_conversations,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '5 minutes')
    / 5.0 as messages_per_minute,
  AVG(EXTRACT(EPOCH FROM response_time))
    FILTER (WHERE created_at > NOW() - INTERVAL '5 minutes')
    as avg_response_seconds,
  COUNT(*) FILTER (WHERE outcome = 'error' AND created_at > NOW() - INTERVAL '5 minutes')
    * 100.0 / NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '5 minutes'), 0)
    as error_rate_pct
FROM conversation_sessions
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Daily summary (refresh hourly)
CREATE MATERIALIZED VIEW daily_summary AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(cqs.overall) as avg_quality,
  AVG(cqs.user_satisfaction) as avg_satisfaction,
  ROUND(100.0 * COUNT(*) FILTER (WHERE outcome = 'completed')
    / NULLIF(COUNT(*), 0), 1) as completion_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE message_count <= 1)
    / NULLIF(COUNT(*), 0), 1) as bounce_rate
FROM conversation_sessions cs
LEFT JOIN conversation_quality_scores cqs ON cs.id = cqs.session_id
WHERE cs.created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', cs.created_at);
```

---

## 9. Privacy-Respecting Analytics

### 9.1 Data Minimization

```typescript
const analyticsPrivacyRules = {
  // Never log message content in analytics
  // Only log derived metrics (scores, counts, categories)
  contentLogging: false,

  // Aggregate data after 30 days
  // Individual session data → cohort summaries
  aggregationPeriod: '30 days',

  // Anonymize user IDs in exported analytics
  exportAnonymization: true,

  // Respect user opt-out
  honorOptOut: true,

  // No analytics on Bestie conversations
  // (higher privacy expectation for companion interactions)
  bestieExcluded: true,
};
```

### 9.2 Aggregation Pipeline

```sql
-- Monthly aggregation (runs on 1st of each month)
-- Aggregates individual session data into anonymous cohort summaries
INSERT INTO analytics_monthly_summary (
  month, tier, agent_id,
  total_sessions, unique_users,
  avg_quality, avg_satisfaction,
  completion_rate, abandonment_rate,
  avg_messages_per_session
)
SELECT
  DATE_TRUNC('month', cs.created_at) as month,
  u.tier,
  cs.agent_id,
  COUNT(*),
  COUNT(DISTINCT cs.user_id),
  AVG(cqs.overall),
  AVG(cqs.user_satisfaction),
  ROUND(100.0 * COUNT(*) FILTER (WHERE cs.outcome = 'completed')
    / NULLIF(COUNT(*), 0), 1),
  ROUND(100.0 * COUNT(*) FILTER (WHERE cs.outcome = 'abandoned')
    / NULLIF(COUNT(*), 0), 1),
  AVG(cs.message_count)
FROM conversation_sessions cs
JOIN users u ON cs.user_id = u.id
LEFT JOIN conversation_quality_scores cqs ON cs.id = cqs.session_id
WHERE cs.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
  AND cs.created_at < DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('month', cs.created_at), u.tier, cs.agent_id;

-- After aggregation, delete individual quality scores older than 90 days
DELETE FROM conversation_quality_scores
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 10. Production Checklist

- [ ] Task completion scoring function deployed and tested
- [ ] Conversation Quality Score (CQS) computed for every session
- [ ] Satisfaction detection runs on user messages (not agent messages)
- [ ] Drop-off classification categorizes all session endings
- [ ] Agent performance materialized view refreshes every 15 minutes
- [ ] Quality alerts check every 15 minutes with founder notification
- [ ] Retention cohort analysis available in admin dashboard
- [ ] Real-time metrics view updates every 30 seconds
- [ ] Conversation pattern mining runs weekly
- [ ] Failure pattern detection identifies recurring issues
- [ ] Privacy rules enforced: no message content in analytics
- [ ] Data aggregation runs monthly, old individual data pruned
- [ ] Bestie conversations excluded from analytics
- [ ] All analytics queries use indexes (no full table scans)
- [ ] Dashboard loads in under 2 seconds at 100K+ sessions
