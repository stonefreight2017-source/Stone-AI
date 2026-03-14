# API Marketplace Design for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Product Design
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: API design, search systems, product catalog patterns
- **Last Updated**: 2026-03-09

---

## 1. Marketplace Architecture

### Overview

The Stone AI Tools marketplace is where developers discover, evaluate, and subscribe to AI agents. It is both a catalog and a storefront.

```
Marketplace Components:

┌──────────────────────────────────────────────────────┐
│                   MARKETPLACE                         │
│                                                      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  Agent     │  │  Discovery  │  │  Reviews &   │ │
│  │  Catalog   │  │  & Search   │  │  Ratings     │ │
│  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘ │
│        │                │                 │          │
│  ┌─────┴──────┐  ┌──────┴──────┐  ┌──────┴───────┐ │
│  │  Category  │  │  Featured   │  │  Usage       │ │
│  │  Taxonomy  │  │  Agents     │  │  Analytics   │ │
│  └────────────┘  └─────────────┘  └──────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 2. Agent Catalog Data Model

### 2.1 Schema Design

```prisma
// File: prisma/schema.prisma (Stone AI Tools additions)

model AgentListing {
  id              String          @id @default(cuid())
  slug            String          @unique
  name            String
  shortDescription String        // 1-2 sentences, shown in cards
  longDescription  String        // Full markdown description

  // Classification
  category        AgentCategory
  subcategory     String?
  tags            String[]        @default([])

  // Access control
  tier            AgentTier       @default(FREE)

  // Technical details
  inputSchema     Json            // JSON Schema for agent input
  outputFormats   String[]        @default(["text"])
  maxTokens       Int             @default(4000)
  supportsStreaming Boolean       @default(false)

  // Performance
  avgResponseMs   Int             @default(0)
  p95ResponseMs   Int             @default(0)
  successRate     Float           @default(0)

  // Marketplace
  featured        Boolean         @default(false)
  featuredOrder   Int?
  rating          Float           @default(0)
  reviewCount     Int             @default(0)
  totalInvocations BigInt         @default(0)

  // Content
  iconUrl         String?
  bannerUrl       String?
  examples        Json            @default("[]")  // Array of example prompts/responses
  changelog       Json            @default("[]")  // Version history

  // Status
  status          AgentListingStatus @default(ACTIVE)
  publishedAt     DateTime?

  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  reviews         AgentReview[]
  usageStats      AgentUsageStat[]

  @@index([category, tier])
  @@index([featured, featuredOrder])
  @@index([rating])
  @@index([totalInvocations])
  @@fulltext([name, shortDescription, tags])
  @@map("agent_listings")
}

enum AgentCategory {
  PRODUCTIVITY
  CODING
  WRITING
  ANALYSIS
  CREATIVE
  SECURITY
  DATA
  COMMUNICATION
  RESEARCH
  BUSINESS
}

enum AgentTier {
  FREE
  STARTER
  PLUS
  SMART
  PRO
}

enum AgentListingStatus {
  DRAFT
  ACTIVE
  DEPRECATED
  DISABLED
}

model AgentReview {
  id            String      @id @default(cuid())
  agentId       String
  tenantId      String
  userId        String

  rating        Int         // 1-5 stars
  title         String?
  body          String?     // Review text

  // Moderation
  status        ReviewStatus @default(PENDING)
  moderatedAt   DateTime?
  moderatedBy   String?

  // Helpfulness
  helpfulCount  Int         @default(0)

  // Context
  usageCount    Int         @default(0) // How many times reviewer used the agent

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  agent         AgentListing @relation(fields: [agentId], references: [id])

  @@unique([agentId, tenantId]) // One review per tenant per agent
  @@index([agentId, status, createdAt])
  @@index([agentId, rating])
  @@map("agent_reviews")
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
}

model AgentUsageStat {
  id            String    @id @default(cuid())
  agentId       String
  period        String    // "2026-03"

  totalCalls    BigInt    @default(0)
  uniqueTenants Int       @default(0)
  avgResponseMs Int       @default(0)
  p95ResponseMs Int       @default(0)
  successRate   Float     @default(0)
  totalTokens   BigInt    @default(0)

  createdAt     DateTime  @default(now())

  agent         AgentListing @relation(fields: [agentId], references: [id])

  @@unique([agentId, period])
  @@map("agent_usage_stats")
}
```

---

## 3. Category Taxonomy

### 3.1 Category Hierarchy

```typescript
// File: src/lib/marketplace/categories.ts

interface Category {
  id: AgentCategory;
  name: string;
  description: string;
  icon: string;          // Lucide icon name
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  description: string;
}

const AGENT_CATEGORIES: Category[] = [
  {
    id: 'CODING',
    name: 'Coding',
    description: 'Code review, bug finding, refactoring, and development assistance',
    icon: 'Code2',
    subcategories: [
      { id: 'code-review', name: 'Code Review', description: 'Automated code review and quality checks' },
      { id: 'bug-detection', name: 'Bug Detection', description: 'Static analysis and bug finding' },
      { id: 'refactoring', name: 'Refactoring', description: 'Code improvement suggestions' },
      { id: 'generation', name: 'Code Generation', description: 'Generate code from descriptions' },
      { id: 'documentation', name: 'Documentation', description: 'Generate code documentation' },
    ],
  },
  {
    id: 'SECURITY',
    name: 'Security',
    description: 'Vulnerability scanning, penetration testing, and security analysis',
    icon: 'Shield',
    subcategories: [
      { id: 'vulnerability-scan', name: 'Vulnerability Scanning', description: 'Detect security vulnerabilities' },
      { id: 'dependency-audit', name: 'Dependency Audit', description: 'Check for vulnerable dependencies' },
      { id: 'compliance', name: 'Compliance', description: 'Security compliance checking' },
    ],
  },
  {
    id: 'WRITING',
    name: 'Writing',
    description: 'Content creation, copywriting, technical writing, and editing',
    icon: 'PenTool',
    subcategories: [
      { id: 'blog-posts', name: 'Blog Posts', description: 'Generate blog content' },
      { id: 'technical-docs', name: 'Technical Docs', description: 'Technical documentation' },
      { id: 'marketing-copy', name: 'Marketing Copy', description: 'Sales and marketing content' },
      { id: 'editing', name: 'Editing', description: 'Proofread and improve existing text' },
    ],
  },
  {
    id: 'ANALYSIS',
    name: 'Analysis',
    description: 'Data analysis, insights extraction, and reporting',
    icon: 'BarChart3',
    subcategories: [
      { id: 'data-analysis', name: 'Data Analysis', description: 'Analyze datasets and find patterns' },
      { id: 'sentiment', name: 'Sentiment Analysis', description: 'Analyze text sentiment' },
      { id: 'summarization', name: 'Summarization', description: 'Summarize long documents' },
    ],
  },
  {
    id: 'PRODUCTIVITY',
    name: 'Productivity',
    description: 'Task management, scheduling, email drafting, and workflow automation',
    icon: 'Zap',
    subcategories: [
      { id: 'email', name: 'Email', description: 'Draft and manage emails' },
      { id: 'scheduling', name: 'Scheduling', description: 'Calendar and scheduling assistance' },
      { id: 'workflow', name: 'Workflow', description: 'Workflow automation' },
    ],
  },
  {
    id: 'CREATIVE',
    name: 'Creative',
    description: 'Creative writing, brainstorming, design suggestions, and ideation',
    icon: 'Sparkles',
    subcategories: [
      { id: 'brainstorming', name: 'Brainstorming', description: 'Generate ideas and concepts' },
      { id: 'creative-writing', name: 'Creative Writing', description: 'Fiction, poetry, scripts' },
      { id: 'design', name: 'Design', description: 'Design suggestions and feedback' },
    ],
  },
  {
    id: 'DATA',
    name: 'Data',
    description: 'Data processing, transformation, validation, and enrichment',
    icon: 'Database',
    subcategories: [
      { id: 'transformation', name: 'Transformation', description: 'Transform and clean data' },
      { id: 'validation', name: 'Validation', description: 'Validate data quality' },
      { id: 'enrichment', name: 'Enrichment', description: 'Enrich data with additional context' },
    ],
  },
  {
    id: 'RESEARCH',
    name: 'Research',
    description: 'Market research, competitive analysis, and information gathering',
    icon: 'Search',
    subcategories: [
      { id: 'market-research', name: 'Market Research', description: 'Industry and market analysis' },
      { id: 'competitive-analysis', name: 'Competitive Analysis', description: 'Competitor intelligence' },
      { id: 'literature-review', name: 'Literature Review', description: 'Academic paper analysis' },
    ],
  },
  {
    id: 'COMMUNICATION',
    name: 'Communication',
    description: 'Translation, chat, customer support, and message drafting',
    icon: 'MessageSquare',
    subcategories: [
      { id: 'translation', name: 'Translation', description: 'Translate between languages' },
      { id: 'customer-support', name: 'Customer Support', description: 'Support response drafting' },
      { id: 'messaging', name: 'Messaging', description: 'Professional message drafting' },
    ],
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    description: 'Financial analysis, legal document review, and business strategy',
    icon: 'Briefcase',
    subcategories: [
      { id: 'financial', name: 'Financial', description: 'Financial analysis and modeling' },
      { id: 'legal', name: 'Legal', description: 'Legal document review' },
      { id: 'strategy', name: 'Strategy', description: 'Business strategy and planning' },
    ],
  },
];
```

---

## 4. Agent Discovery and Search

### 4.1 Search API

```typescript
// File: src/app/api/marketplace/agents/route.ts

import { z } from 'zod';

const SearchParamsSchema = z.object({
  q: z.string().optional(),
  category: z.nativeEnum(AgentCategory).optional(),
  subcategory: z.string().optional(),
  tier: z.nativeEnum(AgentTier).optional(),
  maxTier: z.nativeEnum(AgentTier).optional(),
  sort: z.enum(['relevance', 'rating', 'popular', 'newest', 'fastest']).default('relevance'),
  featured: z.coerce.boolean().optional(),
  streaming: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params = SearchParamsSchema.parse(Object.fromEntries(searchParams));

  const where: any = {
    status: 'ACTIVE',
  };

  // Category filter
  if (params.category) {
    where.category = params.category;
  }
  if (params.subcategory) {
    where.subcategory = params.subcategory;
  }

  // Tier filter
  if (params.tier) {
    where.tier = params.tier;
  }
  if (params.maxTier) {
    const tierOrder = ['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO'];
    const maxIndex = tierOrder.indexOf(params.maxTier);
    where.tier = { in: tierOrder.slice(0, maxIndex + 1) };
  }

  // Featured filter
  if (params.featured) {
    where.featured = true;
  }

  // Streaming filter
  if (params.streaming !== undefined) {
    where.supportsStreaming = params.streaming;
  }

  // Full-text search
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { shortDescription: { contains: params.q, mode: 'insensitive' } },
      { tags: { has: params.q.toLowerCase() } },
    ];
  }

  // Sort
  let orderBy: any;
  switch (params.sort) {
    case 'rating':
      orderBy = [{ rating: 'desc' }, { reviewCount: 'desc' }];
      break;
    case 'popular':
      orderBy = { totalInvocations: 'desc' };
      break;
    case 'newest':
      orderBy = { publishedAt: 'desc' };
      break;
    case 'fastest':
      orderBy = { avgResponseMs: 'asc' };
      break;
    case 'relevance':
    default:
      // Relevance combines rating, popularity, and recency
      orderBy = [{ featured: 'desc' }, { rating: 'desc' }, { totalInvocations: 'desc' }];
      break;
  }

  const [agents, total] = await Promise.all([
    db.raw.agentListing.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        category: true,
        subcategory: true,
        tier: true,
        tags: true,
        iconUrl: true,
        featured: true,
        rating: true,
        reviewCount: true,
        totalInvocations: true,
        avgResponseMs: true,
        supportsStreaming: true,
        outputFormats: true,
      },
    }),
    db.raw.agentListing.count({ where }),
  ]);

  return Response.json({
    data: agents,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
    facets: params.q ? await buildFacets(where) : undefined,
  });
}

// Build facet counts for search refinement
async function buildFacets(baseWhere: any): Promise<Record<string, any>> {
  const [categories, tiers] = await Promise.all([
    db.raw.agentListing.groupBy({
      by: ['category'],
      where: { ...baseWhere, category: undefined },
      _count: true,
    }),
    db.raw.agentListing.groupBy({
      by: ['tier'],
      where: { ...baseWhere, tier: undefined },
      _count: true,
    }),
  ]);

  return {
    categories: categories.map(c => ({ value: c.category, count: c._count })),
    tiers: tiers.map(t => ({ value: t.tier, count: t._count })),
  };
}
```

### 4.2 Agent Detail API

```typescript
// File: src/app/api/marketplace/agents/[slug]/route.ts

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const agent = await db.raw.agentListing.findUnique({
    where: { slug: params.slug, status: 'ACTIVE' },
    include: {
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { helpfulCount: 'desc' },
        take: 10,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          helpfulCount: true,
          usageCount: true,
          createdAt: true,
        },
      },
      usageStats: {
        orderBy: { period: 'desc' },
        take: 6, // Last 6 months
      },
    },
  });

  if (!agent) {
    return Response.json({ error: { code: 'not_found', message: 'Agent not found' } }, { status: 404 });
  }

  // Get rating distribution
  const ratingDistribution = await db.raw.agentReview.groupBy({
    by: ['rating'],
    where: { agentId: agent.id, status: 'APPROVED' },
    _count: true,
  });

  // Related agents (same category, similar tier)
  const related = await db.raw.agentListing.findMany({
    where: {
      category: agent.category,
      id: { not: agent.id },
      status: 'ACTIVE',
    },
    orderBy: { rating: 'desc' },
    take: 4,
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      tier: true,
      rating: true,
      iconUrl: true,
    },
  });

  return Response.json({
    ...agent,
    ratingDistribution: Object.fromEntries(
      ratingDistribution.map(r => [r.rating, r._count])
    ),
    relatedAgents: related,
  });
}
```

---

## 5. Reviews and Ratings System

### 5.1 Review Submission

```typescript
// File: src/app/api/marketplace/agents/[slug]/reviews/route.ts

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100).optional(),
  body: z.string().min(10).max(2000).optional(),
}).strict();

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const tenantId = await requireAuth(req);
  const body = CreateReviewSchema.parse(await req.json());

  const agent = await db.raw.agentListing.findUnique({
    where: { slug: params.slug },
  });

  if (!agent) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  // Check if tenant has actually used this agent
  const usageCount = await db.raw.usageRecord.count({
    where: {
      tenantId,
      agentId: agent.id,
      statusCode: { lt: 400 },
    },
  });

  if (usageCount < 3) {
    return Response.json({
      error: {
        code: 'insufficient_usage',
        message: 'You must use an agent at least 3 times before reviewing it.',
      },
    }, { status: 403 });
  }

  // Create or update review
  const review = await db.raw.agentReview.upsert({
    where: {
      agentId_tenantId: { agentId: agent.id, tenantId },
    },
    create: {
      agentId: agent.id,
      tenantId,
      userId: req.auth.userId,
      rating: body.rating,
      title: body.title,
      body: body.body,
      usageCount,
      status: 'PENDING', // Moderation queue
    },
    update: {
      rating: body.rating,
      title: body.title,
      body: body.body,
      usageCount,
      status: 'PENDING',
    },
  });

  // Auto-approve if body is clean (basic moderation)
  if (!body.body || await isContentClean(body.body)) {
    await db.raw.agentReview.update({
      where: { id: review.id },
      data: { status: 'APPROVED', moderatedAt: new Date() },
    });

    // Recalculate agent rating
    await recalculateAgentRating(agent.id);
  }

  return Response.json(review, { status: 201 });
}

async function recalculateAgentRating(agentId: string): Promise<void> {
  const stats = await db.raw.agentReview.aggregate({
    where: { agentId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: true,
  });

  await db.raw.agentListing.update({
    where: { id: agentId },
    data: {
      rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      reviewCount: stats._count,
    },
  });
}
```

---

## 6. Featured Agents

### 6.1 Featured Agent Selection

```typescript
// File: src/services/featured-agents.ts

class FeaturedAgentService {
  /**
   * Automatically select featured agents based on metrics.
   * Runs weekly as a scheduled job.
   */
  async updateFeaturedAgents(): Promise<void> {
    // Score all active agents
    const agents = await db.raw.agentListing.findMany({
      where: { status: 'ACTIVE' },
      include: {
        usageStats: {
          orderBy: { period: 'desc' },
          take: 1,
        },
      },
    });

    const scored = agents.map(agent => {
      const recentStats = agent.usageStats[0];

      // Weighted scoring formula
      const score =
        (agent.rating * 30) +                                      // 30% rating
        (Math.log10(Number(agent.totalInvocations) + 1) * 20) +  // 20% popularity (log scale)
        ((recentStats?.successRate ?? 0) * 20) +                   // 20% reliability
        (agent.reviewCount > 5 ? 10 : 0) +                        // 10% has reviews
        ((1000 / Math.max(agent.avgResponseMs, 100)) * 10) +      // 10% speed
        (agent.supportsStreaming ? 10 : 0);                        // 10% features

      return { agent, score };
    });

    // Sort by score and pick top agents per category
    scored.sort((a, b) => b.score - a.score);

    // Feature top 2 from each category + top 6 overall
    const featured = new Set<string>();

    // Top per category
    const byCategory = new Map<string, typeof scored>();
    for (const item of scored) {
      const cat = item.agent.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(item);
    }

    for (const [, items] of byCategory) {
      items.slice(0, 2).forEach(item => featured.add(item.agent.id));
    }

    // Top overall
    scored.slice(0, 6).forEach(item => featured.add(item.agent.id));

    // Update database
    await db.raw.$transaction([
      // Clear all featured flags
      db.raw.agentListing.updateMany({
        where: { featured: true },
        data: { featured: false, featuredOrder: null },
      }),
      // Set new featured agents
      ...Array.from(featured).map((id, index) =>
        db.raw.agentListing.update({
          where: { id },
          data: { featured: true, featuredOrder: index },
        })
      ),
    ]);

    logger.info('Featured agents updated', { count: featured.size });
  }
}
```

---

## 7. Marketplace UI Components

### 7.1 Agent Card Component

```typescript
// File: src/components/marketplace/agent-card.tsx

interface AgentCardProps {
  agent: {
    slug: string;
    name: string;
    shortDescription: string;
    category: string;
    tier: AgentTier;
    iconUrl?: string;
    rating: number;
    reviewCount: number;
    totalInvocations: bigint;
    avgResponseMs: number;
    featured: boolean;
  };
}

function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agents/${agent.slug}`} className="block">
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
        {agent.featured && (
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            Featured
          </span>
        )}

        <div className="flex items-center gap-3 mt-2">
          {agent.iconUrl ? (
            <img src={agent.iconUrl} alt="" className="w-10 h-10 rounded" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
              <CategoryIcon category={agent.category} />
            </div>
          )}

          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <TierBadge tier={agent.tier} />
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {agent.shortDescription}
        </p>

        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <StarRating rating={agent.rating} />
            <span>({agent.reviewCount})</span>
          </div>

          <div className="flex items-center gap-3">
            <span>{formatNumber(Number(agent.totalInvocations))} calls</span>
            <span>{agent.avgResponseMs}ms avg</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### 7.2 Category Navigation

```typescript
// File: src/components/marketplace/category-nav.tsx

function CategoryNav({ activeCategory }: { activeCategory?: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      <CategoryPill
        href="/agents"
        active={!activeCategory}
        label="All"
        count={42}
      />
      {AGENT_CATEGORIES.map(category => (
        <CategoryPill
          key={category.id}
          href={`/agents?category=${category.id}`}
          active={activeCategory === category.id}
          icon={category.icon}
          label={category.name}
        />
      ))}
    </nav>
  );
}
```

---

## 8. Agent Usage Statistics Aggregation

```typescript
// File: src/jobs/aggregate-agent-stats.ts

/**
 * Aggregate agent usage statistics for marketplace display.
 * Runs daily as a scheduled job.
 */
async function aggregateAgentStats(): Promise<void> {
  const period = getCurrentBillingPeriod();

  // Aggregate usage per agent for the current period
  const stats = await db.raw.usageRecord.groupBy({
    by: ['agentId'],
    where: {
      billingPeriod: period,
    },
    _sum: {
      requestCount: true,
      tokenCount: true,
      responseTimeMs: true,
    },
    _avg: {
      responseTimeMs: true,
    },
    _count: true,
  });

  // Calculate success rate per agent
  const successStats = await db.raw.usageRecord.groupBy({
    by: ['agentId'],
    where: {
      billingPeriod: period,
      statusCode: { lt: 400 },
    },
    _sum: { requestCount: true },
  });

  const successMap = new Map(
    successStats.map(s => [s.agentId, s._sum.requestCount ?? 0])
  );

  // Unique tenants per agent
  const tenantCounts = await db.raw.$queryRaw<Array<{ agentId: string; count: number }>>`
    SELECT agent_id as "agentId", COUNT(DISTINCT tenant_id) as count
    FROM usage_records
    WHERE billing_period = ${period}
    GROUP BY agent_id
  `;

  const tenantMap = new Map(
    tenantCounts.map(t => [t.agentId, Number(t.count)])
  );

  // Upsert stats
  for (const stat of stats) {
    const totalCalls = stat._sum.requestCount ?? 0;
    const successCalls = successMap.get(stat.agentId) ?? 0;

    await db.raw.agentUsageStat.upsert({
      where: {
        agentId_period: { agentId: stat.agentId, period },
      },
      create: {
        agentId: stat.agentId,
        period,
        totalCalls: BigInt(totalCalls),
        uniqueTenants: tenantMap.get(stat.agentId) ?? 0,
        avgResponseMs: Math.round(stat._avg.responseTimeMs ?? 0),
        successRate: totalCalls > 0 ? successCalls / totalCalls : 0,
        totalTokens: BigInt(stat._sum.tokenCount ?? 0),
      },
      update: {
        totalCalls: BigInt(totalCalls),
        uniqueTenants: tenantMap.get(stat.agentId) ?? 0,
        avgResponseMs: Math.round(stat._avg.responseTimeMs ?? 0),
        successRate: totalCalls > 0 ? successCalls / totalCalls : 0,
        totalTokens: BigInt(stat._sum.tokenCount ?? 0),
      },
    });

    // Update agent listing totals
    await db.raw.agentListing.update({
      where: { id: stat.agentId },
      data: {
        totalInvocations: { increment: BigInt(totalCalls) },
        avgResponseMs: Math.round(stat._avg.responseTimeMs ?? 0),
        successRate: totalCalls > 0 ? successCalls / totalCalls : 0,
      },
    });
  }
}
```

---

## 9. Marketplace Search with Elasticsearch (Future)

```typescript
// For scale beyond PostgreSQL full-text search

interface AgentSearchDocument {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  tier: string;
  rating: number;
  reviewCount: number;
  totalInvocations: number;
  avgResponseMs: number;
  featured: boolean;
  capabilities: string[];
}

// Elasticsearch mapping for agent search
const AGENT_INDEX_MAPPING = {
  mappings: {
    properties: {
      name: { type: 'text', analyzer: 'standard', boost: 3 },
      description: { type: 'text', analyzer: 'standard', boost: 1 },
      tags: { type: 'keyword', boost: 2 },
      category: { type: 'keyword' },
      tier: { type: 'keyword' },
      rating: { type: 'float' },
      totalInvocations: { type: 'long' },
      featured: { type: 'boolean' },
      capabilities: { type: 'text', analyzer: 'standard' },
    },
  },
};
```

---

## Summary

The Stone AI Tools marketplace is the discovery engine for AI agents:

1. **Agent Catalog**: Rich data model with categories, tiers, performance metrics, and examples
2. **Category Taxonomy**: 10 top-level categories with subcategories for precise browsing
3. **Search**: Full-text search with faceted filtering (category, tier, features), sortable by relevance, rating, popularity, speed
4. **Reviews & Ratings**: Usage-verified reviews (minimum 3 calls), moderation queue, helpfulness voting
5. **Featured Agents**: Auto-selected weekly based on rating, reliability, popularity, and speed
6. **Usage Statistics**: Daily aggregation of agent performance for marketplace display
7. **Agent Cards**: Compact, information-dense cards showing tier, rating, usage count, response time

The marketplace makes it easy for developers to find the right agent for their use case and compare options before integrating.
