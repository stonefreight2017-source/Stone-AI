import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const VLLM_URL = process.env.VLLM_BASE_URL || "http://localhost:8000/v1";
const VLLM_MODEL = process.env.VLLM_MODEL || "/mnt/c/models/qwen3-32b-awq";
const VLLM_API_KEY = process.env.VLLM_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SEEDS = [
  // Strategy (5)
  "How should a small business develop a competitive advantage?",
  "What are effective strategies for entering a saturated market?",
  "How do you build a sustainable business model for a SaaS startup?",
  "What frameworks help prioritize strategic initiatives?",
  "How should a company approach international expansion?",
  // Marketing (5)
  "What are the most effective digital marketing channels for B2B?",
  "How do you create a content marketing strategy from scratch?",
  "What metrics matter most for measuring marketing ROI?",
  "How should a startup allocate its marketing budget?",
  "What are effective strategies for building brand awareness on a budget?",
  // Finance (5)
  "How should a startup approach financial projections?",
  "What are the key metrics investors look for in a pitch deck?",
  "How do you calculate customer lifetime value?",
  "What are effective cash flow management strategies for small businesses?",
  "How should a company prepare for a Series A funding round?",
  // Legal (5)
  "What legal structure is best for a tech startup?",
  "How should a company protect its intellectual property?",
  "What are the essential contracts every business needs?",
  "How do employment laws differ for contractors vs employees?",
  "What compliance requirements apply to SaaS businesses handling user data?",
  // HR (5)
  "How do you build a strong company culture from day one?",
  "What are effective strategies for remote team management?",
  "How should a startup design its first compensation structure?",
  "What are best practices for employee onboarding?",
  "How do you handle performance reviews in a small team?",
  // Project Management (5)
  "How do you choose between Agile and Waterfall methodologies?",
  "What are effective strategies for managing scope creep?",
  "How do you prioritize features for a product roadmap?",
  "What tools and processes help remote teams stay aligned?",
  "How do you estimate project timelines accurately?",
  // Sales (5)
  "How do you build a sales pipeline from zero?",
  "What are effective strategies for B2B cold outreach?",
  "How should a startup price its product?",
  "What are the key components of a sales playbook?",
  "How do you qualify leads effectively?",
  // Operations (5)
  "How do you design efficient business processes?",
  "What are strategies for scaling operations without proportional cost increases?",
  "How should a company approach vendor selection and management?",
  "What KPIs should operations teams track?",
  "How do you build resilient supply chains?",
  // Product Dev (5)
  "How do you validate a product idea before building it?",
  "What are effective strategies for gathering and prioritizing user feedback?",
  "How should a startup approach MVP development?",
  "What are best practices for product-market fit measurement?",
  "How do you manage technical debt while shipping features?",
  // Customer Service (5)
  "How do you build a customer support team from scratch?",
  "What are effective strategies for reducing customer churn?",
  "How should a company handle negative reviews or feedback?",
  "What metrics define excellent customer service?",
  "How do you create a knowledge base that actually helps customers?",
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGroq(messages: { role: string; content: string }[]): Promise<string | null> {
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });
    if (res.status === 429) {
        console.log("Rate limited by Groq, waiting 60 seconds...");
        await delay(60000);
        return callGroq(messages); // retry once
      }
      if (!res.ok) { console.log("Groq error:", res.status, await res.text().catch(() => "")); return null; }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e: any) {
    console.log("Groq fetch error:", e.message);
    return null;
  }
}

async function callVllm(messages: { role: string; content: string }[]): Promise<string | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (VLLM_API_KEY) headers["Authorization"] = `Bearer ${VLLM_API_KEY}`;
    const res = await fetch(`${VLLM_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: VLLM_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });
    if (!res.ok) { console.log("vLLM error:", res.status, await res.text().catch(() => "")); return null; }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e: any) { console.log("vLLM fetch error:", e.message);
    return null;
  }
}

async function evolvePrompt(seed: string): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content: "You are an expert prompt engineer. Take the given question and make it more complex, specific, and challenging. Add concrete details like industry, company size, budget constraints, or specific scenarios. Return only the evolved question.",
    },
    { role: "user" as const, content: seed },
  ];

  const result = await callGroq(messages);
  if (result) {
    await delay(3500);
    return result;
  }

  const fallback = await callVllm(messages);
  return fallback || seed;
}

async function generateResponse(prompt: string): Promise<{ response: string; source: string }> {
  const messages = [
    {
      role: "system" as const,
      content: "You are a senior business consultant with 20+ years of experience. Provide detailed, actionable, expert-level advice. Include specific frameworks, metrics, examples, and step-by-step guidance where appropriate.",
    },
    { role: "user" as const, content: prompt },
  ];

  const groqResult = await callGroq(messages);
  if (groqResult) {
    await delay(3500);
    return { response: groqResult, source: "groq-llama-70b" };
  }

  const vllmResult = await callVllm(messages);
  if (vllmResult) {
    return { response: vllmResult, source: "local-qwen-32b" };
  }

  return { response: "", source: "failed" };
}

async function main() {
  const outputDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "training-pairs.jsonl");

  // Resume support: count existing pairs to skip
  let existingCount = 0;
  if (fs.existsSync(outputPath)) {
    const lines = fs.readFileSync(outputPath, "utf-8").split("\n").filter(l => l.trim());
    existingCount = lines.length;
    console.log(`Resuming: ${existingCount} pairs already exist, skipping...`);
  }

  const stream = fs.createWriteStream(outputPath, { flags: "a" });

  const totalTasks = SEEDS.length * 3;
  let completed = 0;
  let skipped = 0;
  const startTime = Date.now();

  console.log(`Training data generation: ${SEEDS.length} seeds x 3 evolutions = ${totalTasks} pairs`);

  for (const seed of SEEDS) {
    for (let evo = 0; evo < 3; evo++) {
      // Skip already-generated pairs
      if (skipped < existingCount) {
        skipped++;
        completed++;
        continue;
      }
      const evolved = await evolvePrompt(seed);
      const { response, source } = await generateResponse(evolved);

      if (response && source !== "failed") {
        const pair = JSON.stringify({ instruction: evolved, response, source });
        stream.write(pair + "\n");
      }

      completed++;
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = completed / elapsed;
      const remaining = Math.round((totalTasks - completed) / rate);
      console.log(`[${completed}/${totalTasks}] ${source} | ETA: ${remaining}s | ${seed.slice(0, 50)}...`);
    }
  }

  stream.end();
  console.log(`\nDone! ${completed} pairs saved to ${outputPath}`);
}

main().catch(console.error);
