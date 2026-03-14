# Multi-Agent Coordination for the Palace

> Palace Knowledge Seed — AI/ML Operations
> Category: Engineering / Orchestration
> Version: 1.0 | Created: 2026-03-09
> Dependency: Integrates with `prompt-engineering-patterns.md`, `rag-pipeline-design.md`, `api-design-patterns.md`

---

## Table of Contents

1. [Orchestration Architecture](#orchestration-architecture)
2. [Sequential vs Parallel Dispatch](#sequential-vs-parallel-dispatch)
3. [Context Passing Between Agents](#context-passing-between-agents)
4. [Handling Conflicting Agent Outputs](#handling-conflicting-agent-outputs)
5. [Agent Specialization Boundaries](#agent-specialization-boundaries)
6. [Load Balancing and Effort Points](#load-balancing-and-effort-points)
7. [Inter-Agent Communication Protocols](#inter-agent-communication-protocols)
8. [Result Synthesis](#result-synthesis)
9. [Quality Control: The Grading System](#quality-control-the-grading-system)
10. [The Dispatch Protocol for vLLM](#the-dispatch-protocol-for-vllm)
11. [Error Handling and Recovery](#error-handling-and-recovery)
12. [Scaling Patterns](#scaling-patterns)
13. [Complete Orchestration Code](#complete-orchestration-code)

---

## Orchestration Architecture

The Palace runs 42 user-facing agents, 3 heads (Stone, Cardinal, Chaos), and 2 Royal Guards (Computer Wiz, Rush). Coordinating this requires a structured orchestration layer that handles dispatch, context management, quality control, and result synthesis.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FOUNDER                                   │
│                    (Final Authority)                              │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DISPATCH LAYER (Claude)                         │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ P0:Triage│→ │P1:Context│→ │P2:Launch │→ │P3:Review │→ P4    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT EXECUTION LAYER                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              THREE HEADS (Lateral Authority)              │    │
│  │  ┌──────┐    ┌──────────┐    ┌───────┐                  │    │
│  │  │Stone │    │ Cardinal │    │ Chaos │                   │    │
│  │  │Head 1│    │  Head 2  │    │Head 3 │                   │    │
│  │  └──────┘    └──────────┘    └───────┘                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ROYAL GUARDS (Lateral to Heads)              │    │
│  │  ┌──────────────┐    ┌──────┐                            │    │
│  │  │ Computer Wiz │    │ Rush │                             │    │
│  │  └──────────────┘    └──────┘                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           SPECIALIST AGENTS (42 User-Facing)              │    │
│  │                                                           │    │
│  │  Frontend │ Backend │ Database │ Security │ DevOps │ ... │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   RESEARCH AGENT                          │    │
│  │         (Roaming friction-buster, always deployed)        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SHARED INFRASTRUCTURE                           │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ pgvector │  │  vLLM    │  │  Prisma  │  │  Redis   │        │
│  │ (Memory) │  │ (Qwen)   │  │  (ORM)   │  │ (Cache)  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Core Types

```typescript
// --- Core orchestration types ---

interface Agent {
  id: string;
  type: AgentType;
  speciality: string;
  fileOwnership: string[];     // Glob patterns this agent owns
  constraints: string[];
  maxEffortPoints: number;
}

type AgentType =
  | 'frontend' | 'backend' | 'database' | 'security' | 'devops'
  | 'copywriter' | 'marketing'
  | 'stone' | 'cardinal' | 'chaos'
  | 'computer-wiz' | 'rush'
  | 'research' | 'explore' | 'plan';

interface Task {
  id: string;
  description: string;
  effortPoints: number;         // 1=modify, 2=simple, 3=complex
  assignedAgent: AgentType;
  dependencies: string[];       // Task IDs that must complete first
  status: TaskStatus;
  fileScope: string[];          // Files this task will touch
  result?: TaskResult;
}

type TaskStatus = 'pending' | 'blocked' | 'running' | 'completed' | 'failed' | 'redispatched';

interface TaskResult {
  output: string;
  filesModified: string[];
  grade?: Grade;
  errors?: string[];
  duration: number;             // milliseconds
}

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface DispatchPlan {
  id: string;
  tasks: Task[];
  parallelGroups: Task[][];     // Tasks within a group run in parallel
  researchAgent: Task;          // Always present per D4
  estimatedDuration: number;
  createdAt: Date;
}
```

---

## Sequential vs Parallel Dispatch

The FDD (Formation Deployment Directive) defines when agents run sequentially vs in parallel. The rule is simple: **dependent tasks are sequential, independent tasks are parallel.**

### Dependency Rules

```
DATABASE  →  before  →  API  →  before  →  UI
(Schema)              (Routes)             (Components)

SECURITY  →  before  →  any agent that touches auth/headers

RESEARCH  →  launches WITH builders (D4: within 1 minute)
```

### Parallel Group Builder

```typescript
const buildParallelGroups = (tasks: Task[]): Task[][] => {
  const groups: Task[][] = [];
  const completed = new Set<string>();
  const remaining = [...tasks];

  while (remaining.length > 0) {
    // Find all tasks whose dependencies are met
    const ready = remaining.filter(task =>
      task.dependencies.every(dep => completed.has(dep))
    );

    if (ready.length === 0 && remaining.length > 0) {
      // Circular dependency — should never happen. Force sequential.
      console.error('Circular dependency detected. Forcing sequential execution.');
      groups.push([remaining.shift()!]);
      continue;
    }

    // All ready tasks form a parallel group
    groups.push(ready);

    // Mark them as completed and remove from remaining
    for (const task of ready) {
      completed.add(task.id);
      const idx = remaining.indexOf(task);
      if (idx !== -1) remaining.splice(idx, 1);
    }
  }

  return groups;
};
```

### Execution Engine

```typescript
const executeDispatchPlan = async (plan: DispatchPlan): Promise<DispatchResult> => {
  const results = new Map<string, TaskResult>();
  const startTime = Date.now();

  // Launch research agent immediately (D4 compliance)
  const researchPromise = executeAgent(plan.researchAgent, new Map());

  for (const group of plan.parallelGroups) {
    // Execute all tasks in this group in parallel
    const groupResults = await Promise.allSettled(
      group.map(task => executeAgent(task, results))
    );

    // Process results
    for (let i = 0; i < group.length; i++) {
      const task = group[i];
      const result = groupResults[i];

      if (result.status === 'fulfilled') {
        task.status = 'completed';
        task.result = result.value;
        results.set(task.id, result.value);
      } else {
        task.status = 'failed';
        task.result = {
          output: `Error: ${result.reason}`,
          filesModified: [],
          errors: [String(result.reason)],
          duration: 0,
        };
        results.set(task.id, task.result);

        // Check if downstream tasks should be cancelled
        const blocked = plan.tasks.filter(t =>
          t.dependencies.includes(task.id) && t.status === 'pending'
        );
        for (const blockedTask of blocked) {
          blockedTask.status = 'blocked';
        }
      }
    }
  }

  // Wait for research agent
  const researchResult = await researchPromise;
  plan.researchAgent.result = researchResult;

  return {
    plan,
    results,
    totalDuration: Date.now() - startTime,
    successRate: plan.tasks.filter(t => t.status === 'completed').length / plan.tasks.length,
  };
};
```

### Decision Matrix: Sequential vs Parallel

| Scenario | Dispatch Mode | Reasoning |
|----------|--------------|-----------|
| New Prisma model + API route + UI page | Sequential (DB→API→UI) | Each depends on previous |
| Two independent UI components | Parallel | No shared files, no dependencies |
| Security audit + performance fix | Parallel | Different domains, different files |
| Auth middleware change + API route update | Sequential (Security→Backend) | Routes depend on middleware |
| Research + any builder | Parallel | Research is always concurrent (D4) |
| Bug in frontend + bug in backend | Parallel | Independent fixes |
| Schema migration + seed data | Sequential | Seed depends on schema |

---

## Context Passing Between Agents

When agents need to build on each other's work, context must be passed carefully — include what's needed, exclude what's noise.

### Context Trim Rules

```typescript
interface AgentContext {
  taskDescription: string;
  priorResults: PriorResult[];
  fileContents: FileContent[];
  constraints: string[];
}

interface PriorResult {
  agentType: AgentType;
  taskSummary: string;          // NOT the full output — summarized
  filesModified: string[];
  keyDecisions: string[];       // Critical decisions that affect downstream
  codeSnippets?: string[];      // Only code that downstream agents need
}

const buildDownstreamContext = (
  upstreamResult: TaskResult,
  upstreamTask: Task,
  downstreamTask: Task
): PriorResult => {
  // Only pass what the downstream agent needs
  const relevantFiles = upstreamResult.filesModified.filter(file =>
    downstreamTask.fileScope.some(scope =>
      file.includes(scope) || isRelatedFile(file, scope)
    )
  );

  return {
    agentType: upstreamTask.assignedAgent,
    taskSummary: summarizeForDownstream(upstreamResult.output, downstreamTask.assignedAgent),
    filesModified: relevantFiles,
    keyDecisions: extractKeyDecisions(upstreamResult.output),
    codeSnippets: extractRelevantCode(upstreamResult.output, downstreamTask.fileScope),
  };
};
```

### What to Include vs Exclude

| Include | Exclude |
|---------|---------|
| Interface/type definitions the next agent needs | Full implementation details of unrelated code |
| Schema changes (new fields, types) | Migration boilerplate |
| API endpoint signatures (method, path, request/response types) | Full API implementation |
| Key decisions that constrain downstream work | Reasoning process / chain-of-thought |
| Error patterns to avoid (if upstream hit issues) | Successful debugging steps |
| File paths modified | File paths only viewed |

### Context Size Budget

For Qwen 2.5 (32K context), downstream context should not exceed 4,000 tokens. For Claude (200K), budget up to 10,000 tokens.

```typescript
const MAX_CONTEXT_TOKENS: Record<string, number> = {
  'qwen-2.5-32b': 4000,
  'claude-sonnet': 10000,
  'claude-haiku': 8000,
};

const trimContextToFit = (
  context: PriorResult[],
  model: string
): PriorResult[] => {
  const maxTokens = MAX_CONTEXT_TOKENS[model] || 4000;
  let tokenCount = 0;
  const trimmed: PriorResult[] = [];

  // Prioritize most recent results (reverse chronological)
  for (const result of context.reverse()) {
    const resultTokens = estimateTokens(JSON.stringify(result));
    if (tokenCount + resultTokens > maxTokens) break;
    trimmed.unshift(result);
    tokenCount += resultTokens;
  }

  return trimmed;
};
```

---

## Handling Conflicting Agent Outputs

When multiple agents produce outputs that conflict, the system needs a resolution mechanism.

### Conflict Detection

```typescript
interface ConflictReport {
  type: 'file-conflict' | 'logic-conflict' | 'design-conflict';
  agents: AgentType[];
  description: string;
  severity: 'blocking' | 'warning' | 'info';
  affectedFiles: string[];
}

const detectConflicts = (
  results: Map<string, TaskResult>
): ConflictReport[] => {
  const conflicts: ConflictReport[] = [];

  // File conflict: Multiple agents modified the same file
  const fileToAgents = new Map<string, { agent: string; taskId: string }[]>();
  for (const [taskId, result] of results) {
    for (const file of result.filesModified) {
      const existing = fileToAgents.get(file) || [];
      existing.push({ agent: taskId, taskId });
      fileToAgents.set(file, existing);
    }
  }

  for (const [file, agents] of fileToAgents) {
    if (agents.length > 1) {
      conflicts.push({
        type: 'file-conflict',
        agents: agents.map(a => a.agent as AgentType),
        description: `Multiple agents modified ${file}`,
        severity: 'blocking',
        affectedFiles: [file],
      });
    }
  }

  return conflicts;
};
```

### Resolution Strategies

**1. Authority Hierarchy**

When agents conflict, the agent with domain authority wins:

```typescript
const AUTHORITY_HIERARCHY: Record<string, AgentType[]> = {
  // For each file pattern, which agent types have authority (highest first)
  'prisma/**': ['database', 'backend'],
  'src/app/api/**': ['backend', 'security'],
  'src/app/**/*.tsx': ['frontend'],
  'src/components/**': ['frontend'],
  'src/lib/auth/**': ['security', 'backend'],
  'src/middleware.*': ['security'],
  '.env*': ['devops', 'security'],
  'docker*': ['devops'],
};

const resolveByAuthority = (
  conflict: ConflictReport,
  results: Map<string, TaskResult>
): AgentType => {
  const file = conflict.affectedFiles[0];

  for (const [pattern, hierarchy] of Object.entries(AUTHORITY_HIERARCHY)) {
    if (matchesGlob(file, pattern)) {
      // Find the highest-authority agent involved in the conflict
      for (const authoritative of hierarchy) {
        if (conflict.agents.includes(authoritative)) {
          return authoritative;
        }
      }
    }
  }

  // Default: the first agent listed (the one dispatched first)
  return conflict.agents[0];
};
```

**2. Confidence-Based Voting**

When agents provide alternative solutions, score by confidence:

```typescript
interface AgentVote {
  agentType: AgentType;
  solution: string;
  confidence: number;       // 0.0 to 1.0
  reasoning: string;
}

const resolveByVoting = (votes: AgentVote[]): AgentVote => {
  // Weight by confidence
  const weighted = votes.map(v => ({
    ...v,
    weightedScore: v.confidence * getAgentReliability(v.agentType),
  }));

  // Highest weighted score wins
  return weighted.sort((a, b) => b.weightedScore - a.weightedScore)[0];
};

// Historical reliability scores per agent type (updated by Stone's grading)
const getAgentReliability = (agentType: AgentType): number => {
  const reliabilityScores: Record<AgentType, number> = {
    frontend: 0.85,
    backend: 0.88,
    database: 0.90,
    security: 0.92,
    devops: 0.87,
    stone: 0.95,
    cardinal: 0.93,
    chaos: 0.90,
    'computer-wiz': 0.91,
    rush: 0.89,
    copywriter: 0.80,
    marketing: 0.82,
    research: 0.85,
    explore: 0.80,
    plan: 0.83,
  };
  return reliabilityScores[agentType] ?? 0.75;
};
```

**3. Escalation to Stone**

If automated resolution fails:

```typescript
const escalateToStone = async (
  conflict: ConflictReport,
  results: Map<string, TaskResult>
): Promise<string> => {
  const stonePrompt = `
IDENTITY: Agent Stone, Head 1 — The Owner

CONFLICT DETECTED:
Type: ${conflict.type}
Agents involved: ${conflict.agents.join(', ')}
Description: ${conflict.description}
Affected files: ${conflict.affectedFiles.join(', ')}

AGENT OUTPUTS:
${conflict.agents.map(a => {
  const result = findResultByAgent(results, a);
  return `--- ${a} ---\n${result?.output?.slice(0, 1000) || 'No output'}`;
}).join('\n\n')}

DECISION NEEDED:
1. Which agent's output should be used?
2. Should either output be modified?
3. Is a re-dispatch needed with clearer boundaries?

Use OODA + First Principles. Decide now.
`;

  return await callLLM(stonePrompt, { temperature: 0.2 });
};
```

---

## Agent Specialization Boundaries

Clear boundaries prevent agents from stepping on each other's work. The dispatch table from D2 defines these, and here we encode them programmatically.

### File Ownership Map

```typescript
const FILE_OWNERSHIP: Record<AgentType, string[]> = {
  frontend: [
    'src/app/**/*.tsx',
    'src/app/**/*.css',
    'src/components/**',
    'public/**',
  ],
  backend: [
    'src/app/api/**',
    'src/lib/**',
    'src/services/**',
    'src/utils/**',
  ],
  database: [
    'prisma/**',
    'src/lib/db/**',
    'scripts/seed*',
    'scripts/migrate*',
  ],
  security: [
    'src/middleware.*',
    'src/lib/auth/**',
    'src/lib/encryption/**',
    'src/lib/rate-limit*',
  ],
  devops: [
    'Dockerfile*',
    'docker-compose*',
    '.github/**',
    'vercel.json',
    '.env*',
    'next.config.*',
  ],
  copywriter: [],  // No file ownership — produces copy as output text
  marketing: [],   // No file ownership — produces strategy documents
  stone: [],       // Strategy — no direct file ownership
  cardinal: [],    // Research — no direct file ownership
  chaos: [
    'scripts/infra/**',
    'scripts/server/**',
  ],
  'computer-wiz': [],  // Diagnostics — reads only
  rush: [],             // Network ops — reads only
  research: [],         // Read-only recon
  explore: [],          // Read-only recon
  plan: [],             // Architecture planning — no file changes
};

const validateFileOwnership = (
  agentType: AgentType,
  filestoModify: string[]
): { valid: boolean; violations: string[] } => {
  const owned = FILE_OWNERSHIP[agentType] || [];
  const violations: string[] = [];

  for (const file of filestoModify) {
    const isOwned = owned.some(pattern => matchesGlob(file, pattern));
    if (!isOwned) {
      violations.push(file);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
};
```

### When to Split vs Combine Tasks

**Split into multiple agents when:**
- Task touches files from 2+ different ownership rows
- Task requires expertise from 2+ domains
- Changes are independent and can be reviewed separately
- File ownership would overlap

**Combine into one agent when:**
- All files are within one ownership domain
- The task is small (effort points = 1)
- Splitting would create artificial dependency chains
- The "split" would produce two tasks that each take more time to context-switch than the combined task

```typescript
const shouldSplitTask = (task: {
  description: string;
  filesAffected: string[];
}): { split: boolean; subTasks: Partial<Task>[] } => {
  // Map files to agents
  const agentFiles = new Map<AgentType, string[]>();

  for (const file of task.filesAffected) {
    for (const [agentType, patterns] of Object.entries(FILE_OWNERSHIP)) {
      if (patterns.some(p => matchesGlob(file, p))) {
        const existing = agentFiles.get(agentType as AgentType) || [];
        existing.push(file);
        agentFiles.set(agentType as AgentType, existing);
        break; // First match wins
      }
    }
  }

  if (agentFiles.size <= 1) {
    return { split: false, subTasks: [] };
  }

  // Multiple domains — split
  const subTasks = Array.from(agentFiles.entries()).map(([agentType, files]) => ({
    assignedAgent: agentType,
    fileScope: files,
    description: `${agentType} portion of: ${task.description}`,
  }));

  return { split: true, subTasks };
};
```

---

## Load Balancing and Effort Points

The FDD (D3) assigns effort points: complex=3, simple=2, modify=1. No agent should carry more than 1.5x the mean effort.

### Effort Estimation

```typescript
const estimateEffort = (task: {
  description: string;
  filesAffected: string[];
  isNewFeature: boolean;
  requiresSchemaChange: boolean;
}): number => {
  let effort = 1; // Base: modification

  // New feature = complex
  if (task.isNewFeature) effort = 3;

  // Schema changes add complexity
  if (task.requiresSchemaChange) effort = Math.max(effort, 2);

  // Multiple files increase complexity
  if (task.filesAffected.length > 3) effort = Math.max(effort, 2);
  if (task.filesAffected.length > 6) effort = 3;

  return effort;
};
```

### Balance Checker

```typescript
const checkLoadBalance = (
  tasks: Task[]
): { balanced: boolean; overloaded: AgentType[]; recommendation: string } => {
  // Calculate effort per agent
  const agentEffort = new Map<AgentType, number>();
  for (const task of tasks) {
    const current = agentEffort.get(task.assignedAgent) || 0;
    agentEffort.set(task.assignedAgent, current + task.effortPoints);
  }

  if (agentEffort.size === 0) {
    return { balanced: true, overloaded: [], recommendation: 'No tasks to balance' };
  }

  // Calculate mean effort
  const totalEffort = Array.from(agentEffort.values()).reduce((a, b) => a + b, 0);
  const meanEffort = totalEffort / agentEffort.size;
  const maxAllowed = meanEffort * 1.5;

  // Find overloaded agents
  const overloaded: AgentType[] = [];
  for (const [agent, effort] of agentEffort) {
    if (effort > maxAllowed) {
      overloaded.push(agent);
    }
  }

  const recommendation = overloaded.length > 0
    ? `Agents ${overloaded.join(', ')} exceed 1.5x mean effort (${meanEffort.toFixed(1)}). Redistribute tasks.`
    : 'Load is balanced.';

  return { balanced: overloaded.length === 0, overloaded, recommendation };
};
```

### Redistribution

```typescript
const redistributeLoad = (tasks: Task[]): Task[] => {
  const balance = checkLoadBalance(tasks);
  if (balance.balanced) return tasks;

  // For each overloaded agent, try to move lowest-effort tasks to a capable alternative
  for (const overloadedAgent of balance.overloaded) {
    const agentTasks = tasks
      .filter(t => t.assignedAgent === overloadedAgent)
      .sort((a, b) => a.effortPoints - b.effortPoints);

    // Try to reassign the lowest-effort task
    const taskToMove = agentTasks[0];
    if (!taskToMove) continue;

    const alternative = findAlternativeAgent(taskToMove, overloadedAgent, tasks);
    if (alternative) {
      taskToMove.assignedAgent = alternative;
    }
  }

  return tasks;
};

const findAlternativeAgent = (
  task: Task,
  exclude: AgentType,
  allTasks: Task[]
): AgentType | null => {
  // Find agents with capacity that can handle this task's file scope
  const candidates: AgentType[] = [];

  for (const [agentType, patterns] of Object.entries(FILE_OWNERSHIP)) {
    if (agentType === exclude) continue;
    const canHandle = task.fileScope.every(file =>
      patterns.some(p => matchesGlob(file, p))
    );
    if (canHandle) candidates.push(agentType as AgentType);
  }

  // Pick the candidate with lowest current load
  const agentEffort = new Map<AgentType, number>();
  for (const t of allTasks) {
    agentEffort.set(t.assignedAgent, (agentEffort.get(t.assignedAgent) || 0) + t.effortPoints);
  }

  return candidates.sort((a, b) =>
    (agentEffort.get(a) || 0) - (agentEffort.get(b) || 0)
  )[0] ?? null;
};
```

---

## Inter-Agent Communication Protocols

Agents don't communicate directly — all communication flows through the orchestration layer. This prevents circular dependencies and maintains auditability.

### Shared Context Store

```typescript
interface SharedContext {
  taskId: string;
  agentType: AgentType;
  timestamp: Date;
  contextType: 'decision' | 'discovery' | 'warning' | 'request';
  content: string;
  targetAudience: AgentType[] | 'all';
  priority: 'high' | 'medium' | 'low';
}

class ContextBus {
  private contexts: SharedContext[] = [];
  private subscribers = new Map<AgentType, ((ctx: SharedContext) => void)[]>();

  publish(context: SharedContext): void {
    this.contexts.push(context);

    // Notify relevant subscribers
    if (context.targetAudience === 'all') {
      for (const [, handlers] of this.subscribers) {
        handlers.forEach(h => h(context));
      }
    } else {
      for (const target of context.targetAudience) {
        const handlers = this.subscribers.get(target) || [];
        handlers.forEach(h => h(context));
      }
    }
  }

  subscribe(agentType: AgentType, handler: (ctx: SharedContext) => void): void {
    const existing = this.subscribers.get(agentType) || [];
    existing.push(handler);
    this.subscribers.set(agentType, existing);
  }

  getContextFor(agentType: AgentType): SharedContext[] {
    return this.contexts.filter(ctx =>
      ctx.targetAudience === 'all' || ctx.targetAudience.includes(agentType)
    );
  }

  getDecisions(): SharedContext[] {
    return this.contexts.filter(ctx => ctx.contextType === 'decision');
  }
}
```

### Message Passing Patterns

**1. Upstream → Downstream (most common)**

Database agent completes schema change, backend agent needs to know the new types:

```typescript
const passSchemaChangeDownstream = (
  dbResult: TaskResult,
  downstreamAgents: AgentType[]
): SharedContext => ({
  taskId: dbResult.taskId,
  agentType: 'database',
  timestamp: new Date(),
  contextType: 'decision',
  content: `Schema change completed. New/modified models:\n${extractPrismaModels(dbResult.output)}`,
  targetAudience: downstreamAgents,
  priority: 'high',
});
```

**2. Research → Builder (friction-busting)**

Research agent finds a solution that helps a stuck builder:

```typescript
const passResearchFinding = (
  finding: string,
  targetBuilder: AgentType,
  relevance: string
): SharedContext => ({
  taskId: `research-${Date.now()}`,
  agentType: 'research',
  timestamp: new Date(),
  contextType: 'discovery',
  content: `Research finding (relevance: ${relevance}):\n${finding}`,
  targetAudience: [targetBuilder],
  priority: 'medium',
});
```

**3. Warning Broadcasts**

Security agent discovers an issue that affects multiple agents:

```typescript
const broadcastWarning = (
  warning: string,
  severity: 'high' | 'medium' | 'low'
): SharedContext => ({
  taskId: `warning-${Date.now()}`,
  agentType: 'security',
  timestamp: new Date(),
  contextType: 'warning',
  content: warning,
  targetAudience: 'all',
  priority: severity,
});
```

---

## Result Synthesis

After multiple agents complete their tasks, their outputs must be combined into a coherent result.

### Synthesis Pipeline

```typescript
const synthesizeResults = async (
  tasks: Task[],
  contextBus: ContextBus
): Promise<SynthesizedResult> => {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');

  // 1. Collect all file changes
  const allFileChanges = new Map<string, { agent: AgentType; changes: string }>();
  for (const task of completedTasks) {
    if (!task.result) continue;
    for (const file of task.result.filesModified) {
      allFileChanges.set(file, {
        agent: task.assignedAgent,
        changes: extractFileChanges(task.result.output, file),
      });
    }
  }

  // 2. Check for integration issues
  const conflicts = detectConflicts(
    new Map(completedTasks.map(t => [t.id, t.result!]))
  );

  // 3. Build summary
  const summary: SynthesizedResult = {
    totalTasks: tasks.length,
    completed: completedTasks.length,
    failed: failedTasks.length,
    blocked: blockedTasks.length,
    filesModified: Array.from(allFileChanges.keys()),
    conflicts,
    taskSummaries: completedTasks.map(t => ({
      agent: t.assignedAgent,
      task: t.description,
      grade: t.result?.grade || 'pending',
      filesModified: t.result?.filesModified || [],
    })),
    decisions: contextBus.getDecisions().map(d => d.content),
    needsReview: conflicts.length > 0 || failedTasks.length > 0,
  };

  return summary;
};
```

### Report Card Generation

Per D2, every dispatch ends with a report card:

```typescript
const generateReportCard = (
  plan: DispatchPlan,
  results: Map<string, TaskResult>
): ReportCard => {
  const rows: ReportCardRow[] = plan.tasks.map(task => {
    const result = results.get(task.id);
    return {
      agent: task.assignedAgent,
      task: task.description,
      effortPoints: task.effortPoints,
      grade: result?.grade || 'N/A',
      deductions: result?.errors || [],
      duration: result?.duration || 0,
      filesModified: result?.filesModified || [],
    };
  });

  // Compute aggregate stats
  const grades = rows.filter(r => r.grade !== 'N/A').map(r => r.grade);
  const gradeToNumber: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const avgGradeNum = grades.reduce((sum, g) => sum + (gradeToNumber[g] || 0), 0) / grades.length;
  const numberToGrade = (n: number): Grade => {
    if (n >= 3.5) return 'A';
    if (n >= 2.5) return 'B';
    if (n >= 1.5) return 'C';
    if (n >= 0.5) return 'D';
    return 'F';
  };

  return {
    dispatchId: plan.id,
    rows,
    averageGrade: numberToGrade(avgGradeNum),
    totalDuration: rows.reduce((sum, r) => sum + r.duration, 0),
    totalEffortPoints: rows.reduce((sum, r) => sum + r.effortPoints, 0),
    passRate: grades.filter(g => g === 'A' || g === 'B' || g === 'C').length / grades.length,
    redispatchNeeded: rows.some(r => r.grade === 'D' || r.grade === 'F'),
  };
};

interface ReportCard {
  dispatchId: string;
  rows: ReportCardRow[];
  averageGrade: Grade;
  totalDuration: number;
  totalEffortPoints: number;
  passRate: number;
  redispatchNeeded: boolean;
}

interface ReportCardRow {
  agent: AgentType;
  task: string;
  effortPoints: number;
  grade: string;
  deductions: string[];
  duration: number;
  filesModified: string[];
}
```

---

## Quality Control: The Grading System

Stone grades every agent, every time (D2). No agent grades itself. No head grades itself.

### Grading Prompt

```typescript
const gradeAgentOutput = async (
  task: Task,
  result: TaskResult,
  originalRequirements: string
): Promise<{ grade: Grade; score: number; feedback: string }> => {
  const gradingPrompt = `
IDENTITY: Agent Stone, Head 1 — The Owner
TASK: Grade this agent's work output.

ORIGINAL REQUIREMENTS:
${originalRequirements}

AGENT: ${task.assignedAgent}
TASK DESCRIPTION: ${task.description}
FILES MODIFIED: ${result.filesModified.join(', ')}
DURATION: ${result.duration}ms

AGENT OUTPUT:
${result.output.slice(0, 3000)}

GRADING RUBRIC:
- A (90-100): Exceeds requirements. Clean, efficient, no issues.
- B (80-89): Meets all requirements. Minor style/optimization opportunities.
- C (70-79): Meets most requirements. Some gaps needing fixes.
- D (50-69): Partial completion. Significant gaps or bugs.
- F (0-49): Failed or introduced breaking changes.

EVALUATION CRITERIA:
1. Correctness (30%): Does the output actually work?
2. Completeness (25%): Were all requirements addressed?
3. Quality (20%): Is the code clean and maintainable?
4. Safety (15%): Any security or stability concerns?
5. Efficiency (10%): Is the solution appropriately efficient?

Respond ONLY with this JSON:
{
  "grade": "A"|"B"|"C"|"D"|"F",
  "score": 0-100,
  "strengths": ["what went well"],
  "deductions": ["what was wrong, with specifics"],
  "requiresRedispatch": true|false,
  "redispatchReason": "why" | null
}
`;

  const response = await callLLM(gradingPrompt, { temperature: 0.1 });
  return parseGradingResponse(response);
};
```

### Automated Spot-Checks

Beyond Stone's grading, automated checks verify basic quality:

```typescript
const runSpotChecks = async (
  task: Task,
  result: TaskResult
): Promise<SpotCheckResult[]> => {
  const checks: SpotCheckResult[] = [];

  // Check 1: TypeScript compilation
  if (result.filesModified.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
    const tsCheck = await runCommand('npx tsc --noEmit');
    checks.push({
      name: 'TypeScript compilation',
      passed: tsCheck.exitCode === 0,
      details: tsCheck.exitCode === 0 ? 'Clean compilation' : tsCheck.stderr,
    });
  }

  // Check 2: Zod .strict() compliance (D7)
  if (result.filesModified.some(f => f.includes('/api/'))) {
    const zodCheck = await checkZodStrictCompliance(result.filesModified);
    checks.push({
      name: 'Zod .strict() on mutation schemas',
      passed: zodCheck.compliant,
      details: zodCheck.violations.join(', ') || 'All schemas use .strict()',
    });
  }

  // Check 3: File ownership validation
  const ownershipCheck = validateFileOwnership(task.assignedAgent, result.filesModified);
  checks.push({
    name: 'File ownership boundaries',
    passed: ownershipCheck.valid,
    details: ownershipCheck.valid
      ? 'Agent stayed within boundaries'
      : `Boundary violations: ${ownershipCheck.violations.join(', ')}`,
  });

  // Check 4: No secrets in output
  const secretsCheck = checkForSecrets(result.output);
  checks.push({
    name: 'No secrets in output',
    passed: !secretsCheck.found,
    details: secretsCheck.found ? `Potential secrets detected: ${secretsCheck.types.join(', ')}` : 'Clean',
  });

  return checks;
};
```

---

## The Dispatch Protocol for vLLM

Implementing D2 and D3 programmatically for the vLLM-powered agent system.

### Dispatch Controller

```typescript
// src/lib/orchestration/dispatch-controller.ts

import { prisma } from '@/lib/prisma';

interface DispatchRequest {
  userRequest: string;
  userId: string;
  userTier: string;
}

class DispatchController {
  private contextBus = new ContextBus();

  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    // P0 TRIAGE (<60 seconds)
    const triage = await this.triage(request);

    // P1 CONTEXT (<2 minutes)
    const context = await this.buildContext(triage);

    // P2 LAUNCH
    const plan = this.createPlan(triage, context);

    // Validate load balance
    const balance = checkLoadBalance(plan.tasks);
    if (!balance.balanced) {
      plan.tasks = redistributeLoad(plan.tasks);
    }

    // D4 COMPLIANCE: Research agent MUST be scheduled
    if (!plan.researchAgent) {
      throw new Error('D4 VIOLATION: Research agent not scheduled. Aborting dispatch.');
    }

    // Execute
    const result = await executeDispatchPlan(plan);

    // P3 REVIEW
    await this.review(result);

    // P4 INTEGRATION
    const synthesis = await synthesizeResults(result.plan.tasks, this.contextBus);
    const reportCard = generateReportCard(result.plan, result.results);

    return {
      ...result,
      synthesis,
      reportCard,
    };
  }

  private async triage(request: DispatchRequest): Promise<TriageResult> {
    const triagePrompt = `
IDENTITY: Agent Stone, Head 1 — The Owner
TASK: Triage this user request. You have 60 seconds.

USER REQUEST: ${request.userRequest}

Determine:
1. What files are likely affected? (List file paths or patterns)
2. Effort points per specialist needed (complex=3, simple=2, modify=1)
3. Research level needed (none, light, heavy)
4. Which specialists are needed? (From: frontend, backend, database, security, devops)
5. Are there dependencies between specialists?

Respond ONLY with JSON:
{
  "specialists": [
    {
      "type": "frontend"|"backend"|"database"|"security"|"devops",
      "effort": 1|2|3,
      "files": ["file patterns"],
      "description": "what this specialist does",
      "dependsOn": ["other specialist types"] | []
    }
  ],
  "researchLevel": "none"|"light"|"heavy",
  "researchTarget": "what to research" | null,
  "totalEffort": number
}
`;

    const response = await callLLM(triagePrompt, { temperature: 0.2 });
    return parseTriageResponse(response);
  }

  private async buildContext(triage: TriageResult): Promise<ContextBundle> {
    // Build interface contracts and file ownership map
    const contracts: InterfaceContract[] = [];
    const pitfalls: string[] = [];

    // Check for known patterns from Stone's pattern library
    const knownPatterns = await retrieveProceduralMemory(
      triage.specialists.map(s => s.description).join('; '),
      'stone',
      3
    );

    // Build file ownership map
    const ownershipMap = new Map<string, AgentType>();
    for (const spec of triage.specialists) {
      for (const file of spec.files) {
        ownershipMap.set(file, spec.type);
      }
    }

    return {
      contracts,
      ownershipMap,
      pitfalls,
      knownPatterns,
    };
  }

  private createPlan(triage: TriageResult, context: ContextBundle): DispatchPlan {
    // Create tasks from triage specialists
    const tasks: Task[] = triage.specialists.map((spec, i) => ({
      id: `task-${Date.now()}-${i}`,
      description: spec.description,
      effortPoints: spec.effort,
      assignedAgent: spec.type,
      dependencies: spec.dependsOn.map(dep => {
        const depTask = triage.specialists.findIndex(s => s.type === dep);
        return depTask >= 0 ? `task-${Date.now()}-${depTask}` : '';
      }).filter(Boolean),
      status: 'pending' as TaskStatus,
      fileScope: spec.files,
    }));

    // D4: Always include research agent
    const researchTask: Task = {
      id: `task-${Date.now()}-research`,
      description: triage.researchTarget || 'Roaming friction-buster. Watch for walls.',
      effortPoints: 1,
      assignedAgent: 'research',
      dependencies: [],
      status: 'pending',
      fileScope: [],
    };

    // Build parallel groups
    const parallelGroups = buildParallelGroups(tasks);

    return {
      id: `dispatch-${Date.now()}`,
      tasks,
      parallelGroups,
      researchAgent: researchTask,
      estimatedDuration: triage.totalEffort * 30000, // Rough: 30s per effort point
      createdAt: new Date(),
    };
  }

  private async review(result: DispatchResult): Promise<void> {
    // Grade every completed task
    for (const task of result.plan.tasks) {
      if (task.status !== 'completed' || !task.result) continue;

      const grading = await gradeAgentOutput(task, task.result, task.description);
      task.result.grade = grading.grade;

      // D or F → redispatch
      if (grading.grade === 'D' || grading.grade === 'F') {
        await this.redispatch(task, grading.feedback);
      }
    }

    // Run automated spot-checks
    for (const task of result.plan.tasks) {
      if (task.status !== 'completed' || !task.result) continue;
      const spotChecks = await runSpotChecks(task, task.result);
      const failures = spotChecks.filter(c => !c.passed);
      if (failures.length > 0) {
        console.warn(`Spot-check failures for ${task.assignedAgent}:`, failures);
      }
    }
  }

  private async redispatch(task: Task, feedback: string): Promise<void> {
    task.status = 'redispatched';

    // D5: Same issue TWICE → escalate to Stone
    if (task.result?.errors && task.result.errors.length > 1) {
      console.warn(`Escalating to Stone: ${task.assignedAgent} failed twice on ${task.description}`);
      await escalateToStone(
        {
          type: 'logic-conflict',
          agents: [task.assignedAgent],
          description: `Agent failed twice: ${feedback}`,
          severity: 'blocking',
          affectedFiles: task.fileScope,
        },
        new Map([[task.id, task.result!]])
      );
      return;
    }

    // Re-dispatch with feedback
    const newTask: Task = {
      ...task,
      id: `${task.id}-redispatch`,
      status: 'pending',
      result: undefined,
    };

    // Add feedback to the agent's context
    this.contextBus.publish({
      taskId: task.id,
      agentType: 'stone',
      timestamp: new Date(),
      contextType: 'warning',
      content: `REDISPATCH FEEDBACK: ${feedback}. Fix these issues.`,
      targetAudience: [task.assignedAgent],
      priority: 'high',
    });

    await executeAgent(newTask, new Map([[task.id, task.result!]]));
  }
}

// Singleton
export const dispatchController = new DispatchController();
```

### Agent Execution (vLLM Integration)

```typescript
const executeAgent = async (
  task: Task,
  priorResults: Map<string, TaskResult>
): Promise<TaskResult> => {
  const startTime = Date.now();

  // Build the agent's prompt using the prompt engineering patterns
  const identity = AGENT_IDENTITIES[task.assignedAgent];
  const priorContext = Array.from(priorResults.entries())
    .map(([id, result]) => buildDownstreamContext(result, { id } as Task, task));

  const prompt = `
IDENTITY: ${identity}
SCOPE: ${task.fileScope.join(', ')}
SUCCESS CRITERIA: ${task.description}
BOUNDARIES: Only modify files in scope. Do not touch: ${getExcludedFiles(task.assignedAgent).join(', ')}

${priorContext.length > 0 ? `PRIOR AGENT RESULTS:\n${priorContext.map(c => `[${c.agentType}] ${c.taskSummary}`).join('\n')}` : ''}

TASK: ${task.description}

Respond with:
1. Analysis of what needs to change
2. The actual code changes (full file contents or diffs)
3. Files you modified (list)
4. Any concerns or blockers
`;

  try {
    const response = await callVLLM(prompt, {
      temperature: getSamplingConfig(task.assignedAgent).temperature,
      maxTokens: 4096,
    });

    return {
      output: response,
      filesModified: extractModifiedFiles(response),
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      output: `Agent ${task.assignedAgent} failed: ${error}`,
      filesModified: [],
      errors: [String(error)],
      duration: Date.now() - startTime,
    };
  }
};

const AGENT_IDENTITIES: Record<AgentType, string> = {
  frontend: 'Senior Frontend Engineer specializing in Next.js 16, React Server Components, TypeScript, Tailwind CSS, and shadcn/ui',
  backend: 'Senior Backend Engineer specializing in Next.js API routes, Prisma ORM, TypeScript services, and middleware',
  database: 'Senior Database Engineer specializing in PostgreSQL 16, Prisma schema design, migrations, and pgvector',
  security: 'Senior Security Engineer specializing in auth (Clerk), encryption (AES-256-GCM), CSP, rate limiting, and OWASP Top 10',
  devops: 'Senior DevOps Engineer specializing in Vercel deployment, Docker, CI/CD, and Cloudflare DNS',
  copywriter: 'Senior Copywriter specializing in SaaS landing pages, CTAs, and conversion-focused copy',
  marketing: 'Digital Marketing Strategist specializing in ad compliance, brand copy, and campaign management',
  stone: 'Agent Stone, Head 1 — The Owner. Strategy, optimization, escalation. Uses OODA, First Principles, Theory of Constraints, Inversion.',
  cardinal: 'Cardinal, Head 2 — The Architect. Intelligence, systems architecture, competitive research, blind spot analysis.',
  chaos: 'Chaos, Head 3 — The Vanguard. Palace infrastructure, servers, GPU, networking, WSL, Docker, vLLM.',
  'computer-wiz': 'Computer Wiz, Royal Guard — The Diagnostician. Hardware/software diagnostics, deployment gating, clearance reports.',
  rush: 'Rush, Royal Guard — Network Penetration. SSH/tunneling, firewall bypass, packet diagnostics, remote access.',
  research: 'Research Agent — Roaming friction-buster. Targets hardest friction first. Memory-backed from past wins.',
  explore: 'Explorer — Read-only recon. File search, codebase navigation, pattern identification.',
  plan: 'Architect Planner — Architecture planning, system design, dependency mapping.',
};
```

---

## Error Handling and Recovery

### Error Categories

```typescript
type AgentError =
  | 'timeout'           // Agent took too long
  | 'malformed_output'  // Output doesn't match expected format
  | 'file_conflict'     // Agent modified files outside its scope
  | 'compilation_error' // Changes break TypeScript compilation
  | 'runtime_error'     // Changes break at runtime
  | 'llm_error'         // vLLM/API error
  | 'dependency_error'  // Required upstream result missing
  | 'boundary_violation'; // Agent crossed specialization boundary

const handleAgentError = async (
  task: Task,
  error: AgentError,
  details: string
): Promise<RecoveryAction> => {
  switch (error) {
    case 'timeout':
      // Retry once with increased timeout, then escalate
      return { action: 'retry', config: { timeout: task.timeout * 2 }, maxRetries: 1 };

    case 'malformed_output':
      // Re-prompt with stricter output format instructions
      return {
        action: 'retry',
        config: {
          appendToPrompt: 'Your previous output was malformed. Respond ONLY with the required format. No extra text.',
        },
        maxRetries: 2,
      };

    case 'file_conflict':
      // Revert changes, re-dispatch with explicit boundaries
      return {
        action: 'redispatch',
        config: {
          revertFiles: true,
          appendToPrompt: `CRITICAL: You modified files outside your scope. You may ONLY modify: ${task.fileScope.join(', ')}. Do NOT touch any other files.`,
        },
      };

    case 'compilation_error':
      // Re-dispatch with the compilation error as context
      return {
        action: 'redispatch',
        config: {
          appendToPrompt: `Your changes caused a TypeScript compilation error:\n${details}\n\nFix this error while maintaining the original task requirements.`,
        },
      };

    case 'llm_error':
      // Try fallback model
      return {
        action: 'retry',
        config: { model: 'claude-haiku' }, // Fallback from Qwen to Haiku
        maxRetries: 1,
      };

    case 'dependency_error':
      // Block and wait for upstream, or skip if non-critical
      return { action: 'block', config: { reason: details } };

    case 'boundary_violation':
      // Same as file_conflict but with Stone escalation
      return {
        action: 'escalate',
        config: { reason: `Boundary violation: ${details}` },
      };

    default:
      return { action: 'escalate', config: { reason: details } };
  }
};
```

### Recovery Execution

```typescript
const executeRecovery = async (
  task: Task,
  recovery: RecoveryAction,
  attempt: number = 0
): Promise<TaskResult> => {
  switch (recovery.action) {
    case 'retry':
      if (attempt >= (recovery.maxRetries || 1)) {
        return {
          output: `Agent ${task.assignedAgent} failed after ${attempt} retries`,
          filesModified: [],
          errors: ['Max retries exceeded'],
          duration: 0,
        };
      }

      // Modify task based on recovery config
      if (recovery.config.appendToPrompt) {
        task.description += `\n\n${recovery.config.appendToPrompt}`;
      }
      if (recovery.config.model) {
        // Switch to fallback model
        (task as any).model = recovery.config.model;
      }

      return executeAgent(task, new Map());

    case 'redispatch':
      if (recovery.config.revertFiles) {
        // Git revert the agent's changes
        await revertAgentChanges(task);
      }
      if (recovery.config.appendToPrompt) {
        task.description += `\n\n${recovery.config.appendToPrompt}`;
      }
      return executeAgent(task, new Map());

    case 'block':
      task.status = 'blocked';
      return {
        output: `Blocked: ${recovery.config.reason}`,
        filesModified: [],
        errors: ['Blocked on dependency'],
        duration: 0,
      };

    case 'escalate':
      const stoneDecision = await escalateToStone(
        {
          type: 'logic-conflict',
          agents: [task.assignedAgent],
          description: recovery.config.reason || 'Unknown error',
          severity: 'blocking',
          affectedFiles: task.fileScope,
        },
        new Map()
      );
      return {
        output: `Escalated to Stone. Decision: ${stoneDecision}`,
        filesModified: [],
        errors: ['Escalated'],
        duration: 0,
      };

    default:
      throw new Error(`Unknown recovery action: ${recovery.action}`);
  }
};
```

### Circuit Breaker

Prevent cascading failures when the LLM service is down:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 30000; // 30 seconds

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.lastFailure && Date.now() - this.lastFailure.getTime() > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN. LLM service appears down.');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.error(`Circuit breaker OPENED after ${this.failures} failures`);
    }
  }
}

const llmCircuitBreaker = new CircuitBreaker();

const callVLLM = async (prompt: string, options: any): Promise<string> => {
  return llmCircuitBreaker.execute(async () => {
    const response = await fetch('http://localhost:8000/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-32B-Instruct-AWQ',
        prompt,
        ...options,
      }),
      signal: AbortSignal.timeout(60000), // 60s timeout
    });

    if (!response.ok) throw new Error(`vLLM error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].text;
  });
};
```

---

## Scaling Patterns

### Adding New Agents

```typescript
const registerNewAgent = (config: {
  type: string;
  identity: string;
  fileOwnership: string[];
  constraints: string[];
  samplingConfig: SamplingConfig;
}): void => {
  // 1. Add to identity map
  AGENT_IDENTITIES[config.type] = config.identity;

  // 2. Add file ownership
  FILE_OWNERSHIP[config.type] = config.fileOwnership;

  // 3. Register sampling config
  SAMPLING_CONFIGS[config.type] = config.samplingConfig;

  // 4. Validate no ownership conflicts
  for (const pattern of config.fileOwnership) {
    for (const [existingAgent, existingPatterns] of Object.entries(FILE_OWNERSHIP)) {
      if (existingAgent === config.type) continue;
      for (const existingPattern of existingPatterns) {
        if (patternsOverlap(pattern, existingPattern)) {
          console.warn(
            `WARNING: New agent ${config.type} pattern "${pattern}" overlaps with ${existingAgent} pattern "${existingPattern}"`
          );
        }
      }
    }
  }
};
```

### Retiring Agents

```typescript
const retireAgent = (agentType: AgentType): void => {
  // 1. Check for active tasks
  const activeTasks = getActiveTasksForAgent(agentType);
  if (activeTasks.length > 0) {
    throw new Error(`Cannot retire ${agentType} — has ${activeTasks.length} active tasks`);
  }

  // 2. Reassign file ownership
  const orphanedPatterns = FILE_OWNERSHIP[agentType] || [];
  delete FILE_OWNERSHIP[agentType];

  if (orphanedPatterns.length > 0) {
    console.warn(`Orphaned file patterns from retired ${agentType}:`, orphanedPatterns);
    // These need to be assigned to another agent manually
  }

  // 3. Remove from identity map
  delete AGENT_IDENTITIES[agentType];

  // 4. Archive procedural memory (don't delete — might be useful)
  archiveAgentMemory(agentType);
};
```

### Horizontal Scaling (Multiple vLLM Instances)

```typescript
class AgentPool {
  private instances: VLLMInstance[] = [];
  private roundRobinIndex = 0;

  addInstance(url: string, capacity: number): void {
    this.instances.push({
      url,
      capacity,
      activeTasks: 0,
      healthy: true,
    });
  }

  async getAvailableInstance(): Promise<VLLMInstance> {
    // Health check
    const healthy = this.instances.filter(i => i.healthy);
    if (healthy.length === 0) {
      throw new Error('No healthy vLLM instances available');
    }

    // Least-loaded selection
    const leastLoaded = healthy.sort((a, b) =>
      (a.activeTasks / a.capacity) - (b.activeTasks / b.capacity)
    )[0];

    if (leastLoaded.activeTasks >= leastLoaded.capacity) {
      // All at capacity — queue or reject
      throw new Error('All vLLM instances at capacity');
    }

    leastLoaded.activeTasks++;
    return leastLoaded;
  }

  releaseInstance(instance: VLLMInstance): void {
    instance.activeTasks = Math.max(0, instance.activeTasks - 1);
  }
}

interface VLLMInstance {
  url: string;
  capacity: number;     // Max concurrent requests
  activeTasks: number;
  healthy: boolean;
}
```

### Agent Performance Tracking (for Stone's Optimization Referrals, D5)

```typescript
interface AgentPerformanceRecord {
  agentType: AgentType;
  taskId: string;
  grade: Grade;
  duration: number;
  effortPoints: number;
  errors: string[];
  timestamp: Date;
}

class PerformanceTracker {
  private records: AgentPerformanceRecord[] = [];
  private jobCounters = new Map<AgentType, number>();

  recordCompletion(record: AgentPerformanceRecord): void {
    this.records.push(record);

    const count = (this.jobCounters.get(record.agentType) || 0) + 1;
    this.jobCounters.set(record.agentType, count);

    // D5: After 10 completed tasks, generate optimization referral
    if (count % 10 === 0) {
      this.generateOptimizationReferral(record.agentType);
    }
  }

  private generateOptimizationReferral(agentType: AgentType): void {
    const agentRecords = this.records.filter(r => r.agentType === agentType);
    const last10 = agentRecords.slice(-10);

    const gradeToNum: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    const avgGrade = last10.reduce((sum, r) => sum + (gradeToNum[r.grade] || 0), 0) / 10;
    const avgDuration = last10.reduce((sum, r) => sum + r.duration, 0) / 10;
    const errorRate = last10.filter(r => r.errors.length > 0).length / 10;

    const referral = {
      agentType,
      totalJobs: this.jobCounters.get(agentType) || 0,
      averageGrade: avgGrade.toFixed(1),
      averageDuration: `${(avgDuration / 1000).toFixed(1)}s`,
      errorRate: `${(errorRate * 100).toFixed(0)}%`,
      strengths: identifyStrengths(last10),
      weaknesses: identifyWeaknesses(last10),
      recommendations: generateRecommendations(last10),
    };

    console.log(`[STONE OPTIMIZATION REFERRAL] Agent: ${agentType}`, referral);
    // Present to founder for review/approval
  }
}

export const performanceTracker = new PerformanceTracker();
```

---

## Quick Reference

### Dispatch Checklist (Stone runs this every time)

```
PRE-DISPATCH:
[ ] P0 Triage complete — files identified, effort scored
[ ] P1 Context built — ownership map, interface contracts, pitfalls
[ ] One specialty per dispatch (D2 RULE 1)
[ ] File ownership validated — no overlaps
[ ] Dependencies mapped — sequential where needed
[ ] Load balanced — no agent >1.5x mean effort
[ ] Research agent scheduled (D4 — MANDATORY)
[ ] Prompt format correct (IDENTITY/SCOPE/SUCCESS/BOUNDARIES)

POST-DISPATCH:
[ ] Every agent graded (A through F)
[ ] Spot-checks run (TypeScript, Zod, boundaries, secrets)
[ ] D or F grades → redispatched
[ ] Same issue twice → escalated to Stone
[ ] Conflicts detected and resolved
[ ] Report card generated
[ ] Results synthesized and presented to founder
```

### Error Recovery Decision Tree

```
Agent fails
    │
    ├─ Timeout → Retry with 2x timeout (max 1 retry)
    │
    ├─ Malformed output → Re-prompt with stricter format (max 2 retries)
    │
    ├─ File conflict → Revert + redispatch with explicit boundaries
    │
    ├─ Compilation error → Redispatch with error context
    │
    ├─ LLM error → Try fallback model (Qwen→Haiku)
    │
    ├─ Dependency error → Block and wait
    │
    └─ Boundary violation → Escalate to Stone
         │
         └─ Same issue 2x → Stone uses OODA + First Principles
              │
              └─ Still failing → Present to founder with full context
```

### Communication Flow

```
Founder ←→ Claude (Delegator)
              │
              ├→ Stone (grades, escalations, strategy)
              ├→ Cardinal (research, architecture)
              ├→ Chaos (infrastructure)
              ├→ Computer Wiz (diagnostics)
              ├→ Rush (network ops)
              │
              └→ Specialist Agents (builds)
                   │
                   └→ Research Agent (friction-busting, always concurrent)
```

---

*This seed is maintained by the Senior Backend Engineer (AI/ML specialist). Last updated: 2026-03-09.*
*Cross-references: `prompt-engineering-patterns.md`, `rag-pipeline-design.md`, `api-design-patterns.md`, `typescript-advanced-patterns.md`*
