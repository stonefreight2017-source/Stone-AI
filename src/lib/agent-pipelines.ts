import { db } from "@/lib/db";

export interface PipelineStep {
  agentSlug: string;
  instruction: string;
}

export interface Pipeline {
  name: string;
  description: string;
  steps: PipelineStep[];
  requiredTier: string;
}

export const PIPELINES: Pipeline[] = [
  {
    name: "startup-launch",
    description: "Complete startup launch analysis: market research, strategy, financials, and legal setup",
    requiredTier: "SMART",
    steps: [
      { agentSlug: "market-analyst", instruction: "Analyze the target market, competitors, and opportunity size. Focus on market gaps and timing." },
      { agentSlug: "business-strategist", instruction: "Based on the market analysis, develop a go-to-market strategy with positioning, pricing, and growth plan." },
      { agentSlug: "financial-advisor", instruction: "Create financial projections based on the strategy. Include startup costs, revenue forecasts, and break-even analysis." },
      { agentSlug: "legal-advisor", instruction: "Identify legal requirements for this business: entity structure, licenses, IP protection, and compliance needs." },
    ],
  },
  {
    name: "funding-round",
    description: "Prepare for a funding round with financial analysis and pitch deck",
    requiredTier: "SMART",
    steps: [
      { agentSlug: "financial-advisor", instruction: "Prepare investor-ready financials: valuation rationale, use of funds, unit economics, and key metrics." },
      { agentSlug: "pitch-deck-specialist", instruction: "Create a compelling pitch deck narrative based on the financials. Focus on problem, solution, traction, and ask." },
    ],
  },
  {
    name: "scale-operations",
    description: "Scale business operations with strategy, project management, HR, and financial planning",
    requiredTier: "PRO",
    steps: [
      { agentSlug: "business-strategist", instruction: "Assess current operations and identify scaling bottlenecks. Recommend organizational structure changes." },
      { agentSlug: "project-management-coach", instruction: "Design project management frameworks and processes for the scaling phase. Include team coordination and delivery pipelines." },
      { agentSlug: "hr-consultant", instruction: "Create a hiring plan and organizational development strategy. Include role definitions, compensation benchmarks, and culture frameworks." },
      { agentSlug: "financial-advisor", instruction: "Build financial models for the scaling phase. Include hiring costs, infrastructure investment, and revised projections." },
    ],
  },
  {
    name: "content-blitz",
    description: "Full content marketing campaign across all channels",
    requiredTier: "PLUS",
    steps: [
      { agentSlug: "content-studio", instruction: "Create a content strategy with blog posts, articles, and thought leadership pieces. Focus on SEO-friendly, value-driven content." },
      { agentSlug: "social-media-manager", instruction: "Adapt the content for social media distribution. Create platform-specific posts, hashtag strategies, and engagement plans." },
      { agentSlug: "email-marketing-specialist", instruction: "Design email campaigns to distribute the content. Include nurture sequences, newsletters, and conversion-focused emails." },
      { agentSlug: "seo-specialist", instruction: "Optimize all content for search engines. Provide keyword targets, meta descriptions, internal linking strategy, and technical SEO recommendations." },
    ],
  },
];

export function getPipeline(name: string): Pipeline | null {
  return PIPELINES.find((p) => p.name === name) ?? null;
}

export async function executePipelineStep(
  agentSlug: string,
  userInput: string,
  previousOutput: string
): Promise<string> {
  const agent = await db.agent.findUnique({
    where: { slug: agentSlug },
    select: { systemPrompt: true },
  });

  const systemPrompt = agent?.systemPrompt || "You are a helpful business advisor.";
  const baseUrl = process.env.VLLM_BASE_URL || "http://localhost:8000/v1";
  const model = process.env.VLLM_MODEL || "Qwen/Qwen3-32B-AWQ";

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (previousOutput) {
    messages.push({
      role: "user",
      content: `Context from previous analysis:\n${previousOutput}\n\n---\n\nNow, based on the above context: ${userInput}`,
    });
  } else {
    messages.push({ role: "user", content: userInput });
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    throw new Error(`vLLM returned ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
