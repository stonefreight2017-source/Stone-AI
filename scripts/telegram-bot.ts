import { Bot, InlineKeyboard, Context } from "grammy";
import * as cron from "node-cron";
import { exec } from "child_process";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from project root
config({ path: resolve(__dirname, "..", ".env") });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const FOUNDER_ID = Number(process.env.TELEGRAM_FOUNDER_CHAT_ID!);
const VLLM_URL = process.env.VLLM_BASE_URL || "http://localhost:8000/v1";
const VLLM_MODEL = process.env.VLLM_MODEL || "Qwen/Qwen3-32B-AWQ";

const TELEGRAM_PREFIX = `IMPORTANT: You are responding via Telegram to the founder. Be CONCISE. Short, direct answers. Never ask "Would you like me to proceed?" — just do it. Use bullet points, not paragraphs. Maximum 10 lines. The founder is busy — respect their time.\n\n`;

// Selected agent per user
const selectedAgents = new Map<number, { slug: string; name: string }>();

// --- Prisma Setup ---
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: InstanceType<typeof PrismaClient>;

async function getDb() {
  if (!prisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

// --- Agent Alias Map ---
// Maps natural language names/aliases to agent slugs
const AGENT_ALIASES: Record<string, string> = {
  // Three Heads
  stone: "stone",
  stones: "stone",
  "agent stone": "stone",
  cardinal: "cardinal",
  cards: "cardinal",
  "the architect": "cardinal",
  chaos: "chaos",

  // Business & Strategy
  strategist: "business-strategist",
  strategy: "business-strategist",
  "business strategist": "business-strategist",
  "biz strat": "business-strategist",
  market: "market-analyst",
  "market analyst": "market-analyst",
  finance: "financial-advisor",
  financial: "financial-advisor",
  "financial advisor": "financial-advisor",
  tax: "tax-strategist",
  "tax strategist": "tax-strategist",
  pitch: "pitch-deck-specialist",
  "pitch deck": "pitch-deck-specialist",

  // Marketing & Content
  marketing: "marketing",
  "digital marketing": "marketing",
  content: "content-studio",
  "content studio": "content-studio",
  social: "social-media-manager",
  "social media": "social-media-manager",
  email: "email-marketing-specialist",
  "email marketing": "email-marketing-specialist",
  seo: "seo-specialist",
  copywriter: "copywriter",
  copy: "copywriter",

  // Legal & HR
  legal: "legal-advisor",
  "legal advisor": "legal-advisor",
  hr: "hr-consultant",
  "hr consultant": "hr-consultant",

  // Operations
  project: "project-management-coach",
  "project manager": "project-management-coach",
  pm: "project-management-coach",
  product: "product-development",
  "product dev": "product-development",
  ecommerce: "e-commerce",
  "e-commerce": "e-commerce",
  support: "customer-support",
  "customer support": "customer-support",
  proposal: "proposal-writer",
  "proposal writer": "proposal-writer",
  "meeting notes": "meeting-notes",
  meetings: "meeting-notes",

  // Finance & RE
  "real estate": "real-estate-advisor",
  realestate: "real-estate-advisor",
  grant: "grant-writer",
  "grant writer": "grant-writer",
  data: "data-analyst",
  "data analyst": "data-analyst",

  // Personal
  "life coach": "life-coach",
  lifecoach: "life-coach",
  "mental health": "mental-health",
  therapy: "mental-health",
  fitness: "fitness-coach",
  "fitness coach": "fitness-coach",
  nutrition: "nutrition-advisor",
  diet: "nutrition-advisor",
  career: "career-coach",
  "career coach": "career-coach",
  relationship: "relationship-advisor",
  parenting: "parenting-advisor",

  // Tech
  cyber: "cybersecurity-analyst",
  cybersecurity: "cybersecurity-analyst",
  security: "cybersecurity-analyst",
  tutor: "academic-tutor",
  academic: "academic-tutor",

  // Companions
  bestie: "bestie-female",
  "bestie female": "bestie-female",
  "bestie male": "bestie-male",
  "bestie nb": "bestie-nonbinary",
};

// Build a sorted list of alias keys (longest first for greedy matching)
const ALIAS_KEYS = Object.keys(AGENT_ALIASES).sort(
  (a, b) => b.length - a.length
);

// --- vLLM Helper ---
async function queryVllm(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const res = await fetch(`${VLLM_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.VLLM_API_KEY || "not-needed"}`,
    },
    body: JSON.stringify({
      model: VLLM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) throw new Error(`vLLM returned ${res.status}`);
  const data = await res.json();
  let text =
    data.choices?.[0]?.message?.content?.trim() || "No response generated.";
  // Strip think tags from Qwen
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  return text;
}

// --- HTML Escape ---
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Send long messages in chunks ---
async function sendLongMessage(
  ctx: Context,
  text: string,
  parseMode: "HTML" | undefined = "HTML"
) {
  const MAX = 4000;
  if (text.length <= MAX) {
    await ctx.reply(text, { parse_mode: parseMode });
    return;
  }
  let remaining = text;
  while (remaining.length > 0) {
    let chunk: string;
    if (remaining.length <= MAX) {
      chunk = remaining;
      remaining = "";
    } else {
      let breakPoint = remaining.lastIndexOf("\n", MAX);
      if (breakPoint < MAX * 0.5) breakPoint = MAX;
      chunk = remaining.slice(0, breakPoint);
      remaining = remaining.slice(breakPoint);
    }
    try {
      await ctx.reply(chunk, { parse_mode: parseMode });
    } catch {
      await ctx.reply(chunk);
    }
  }
}

// --- Typing indicator loop ---
function startTyping(ctx: Context): () => void {
  let active = true;
  const loop = async () => {
    while (active) {
      try {
        await ctx.replyWithChatAction("typing");
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
  };
  loop();
  return () => {
    active = false;
  };
}

// --- Service Check Helpers ---
async function checkService(url: string, timeout = 5000): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Route message to agent via vLLM ---
async function routeToAgent(ctx: Context, slug: string, prompt: string) {
  const stopTyping = startTyping(ctx);
  try {
    const db = await getDb();
    const agent = await db.agent.findUnique({
      where: { slug },
      select: { systemPrompt: true, name: true },
    });

    const systemPrompt =
      TELEGRAM_PREFIX + (agent?.systemPrompt || "You are a helpful AI assistant.");
    const agentName = agent?.name || slug;

    const response = await queryVllm(systemPrompt, prompt);
    stopTyping();

    const header = `<b>${escapeHtml(agentName)}</b>\n\n`;
    await sendLongMessage(ctx, header + escapeHtml(response));
  } catch (err) {
    stopTyping();
    const msg = err instanceof Error ? err.message : "Unknown error";
    await ctx.reply(`Error: ${escapeHtml(msg)}`);
  }
}

// --- Agent Categories ---
const CATEGORIES: Record<string, string[]> = {
  "Business & Strategy": [
    "business-strategist",
    "market-analyst",
    "financial-advisor",
    "tax-strategist",
    "pitch-deck-specialist",
  ],
  "Marketing & Content": [
    "content-studio",
    "social-media-manager",
    "email-marketing-specialist",
    "seo-specialist",
  ],
  "Legal & HR": ["legal-advisor", "hr-consultant"],
  Operations: [
    "project-management-coach",
    "product-development",
    "e-commerce",
    "customer-support",
    "proposal-writer",
    "meeting-notes",
  ],
  "Finance & RE": [
    "financial-advisor",
    "real-estate-advisor",
    "grant-writer",
    "data-analyst",
  ],
  Personal: [
    "life-coach",
    "mental-health",
    "fitness-coach",
    "nutrition-advisor",
    "career-coach",
    "relationship-advisor",
    "parenting-advisor",
  ],
  Companions: ["bestie-female", "bestie-male", "bestie-nonbinary"],
  Tech: ["cybersecurity-analyst", "academic-tutor"],
  Internal: ["stone", "cardinal"],
};

// --- Whitelisted scripts ---
const SCRIPTS: Record<string, { cmd: string; dangerous: boolean }> = {
  status: {
    cmd: 'systeminfo | findstr /C:"OS" /C:"Memory"',
    dangerous: false,
  },
  gpu: {
    cmd: "nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader",
    dangerous: false,
  },
  "restart-vllm": { cmd: "echo Restart vLLM placeholder", dangerous: true },
  "restart-nextjs": {
    cmd: 'cd "C:\\Users\\admin\\stone-ai" && start /B npm run dev',
    dangerous: true,
  },
  disk: {
    cmd: "wmic logicaldisk get size,freespace,caption",
    dangerous: false,
  },
};

// Pending confirmations
const pendingConfirms = new Map<string, string>();

// ======================
// BOT SETUP
// ======================
const bot = new Bot(BOT_TOKEN);

// --- Auth Middleware ---
bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (chatId !== FOUNDER_ID) {
    if (chatId)
      console.log(
        `[TELEGRAM] Unauthorized access attempt from chat ID: ${chatId}`
      );
    return;
  }
  await next();
});

// --- /start ---
bot.command("start", async (ctx) => {
  await ctx.reply(
    "Stone AI Command Center active. Type /help or just talk to me."
  );
});

// --- /help ---
bot.command("help", async (ctx) => {
  await ctx.reply(
    `<b>Stone AI Command Center</b>\n\n` +
      `<b>Natural Language (just type):</b>\n` +
      `  stones check vLLM status\n` +
      `  cardinal run full audit\n` +
      `  marketing write me a campaign\n` +
      `  strategy analyze my competitors\n` +
      `  hr draft an offer letter\n\n` +
      `<b>Slash Commands:</b>\n` +
      `  /ask @agent prompt — Send a task to any agent\n` +
      `  /agents — Browse all agents with tap-to-select\n` +
      `  /status — Platform health check\n` +
      `  /digest — Today's platform summary\n` +
      `  /run scriptname — Execute approved scripts\n` +
      `  /help — Show this message\n\n` +
      `<b>No-slash shortcuts:</b>\n` +
      `  status, digest, help, agents, run gpu\n\n` +
      `Tip: Say an agent name to select it, then just type your messages.`,
    { parse_mode: "HTML" }
  );
});

// --- /agents ---
bot.command("agents", async (ctx) => {
  await showAgentCategories(ctx);
});

async function showAgentCategories(ctx: Context) {
  const keyboard = new InlineKeyboard();
  const cats = Object.keys(CATEGORIES);
  for (let i = 0; i < cats.length; i += 2) {
    if (i + 1 < cats.length) {
      keyboard
        .text(cats[i], `cat:${cats[i]}`)
        .text(cats[i + 1], `cat:${cats[i + 1]}`)
        .row();
    } else {
      keyboard.text(cats[i], `cat:${cats[i]}`).row();
    }
  }
  await ctx.reply("Select an agent category:", { reply_markup: keyboard });
}

// Category selection callback
bot.callbackQuery(/^cat:(.+)$/, async (ctx) => {
  const category = ctx.match![1];
  const agents = CATEGORIES[category];
  if (!agents) {
    await ctx.answerCallbackQuery("Category not found");
    return;
  }

  const keyboard = new InlineKeyboard();
  for (let i = 0; i < agents.length; i += 3) {
    const row = agents.slice(i, i + 3);
    for (const slug of row) {
      keyboard.text(slug, `agent:${slug}`);
    }
    keyboard.row();
  }
  keyboard.text("\u00ab Back", "back:categories").row();

  await ctx.editMessageText(
    `<b>${escapeHtml(category)}</b>\nTap an agent to select:`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  );
  await ctx.answerCallbackQuery();
});

// Back to categories
bot.callbackQuery("back:categories", async (ctx) => {
  const keyboard = new InlineKeyboard();
  const cats = Object.keys(CATEGORIES);
  for (let i = 0; i < cats.length; i += 2) {
    if (i + 1 < cats.length) {
      keyboard
        .text(cats[i], `cat:${cats[i]}`)
        .text(cats[i + 1], `cat:${cats[i + 1]}`)
        .row();
    } else {
      keyboard.text(cats[i], `cat:${cats[i]}`).row();
    }
  }
  await ctx.editMessageText("Select an agent category:", {
    reply_markup: keyboard,
  });
  await ctx.answerCallbackQuery();
});

// Agent selection callback
bot.callbackQuery(/^agent:(.+)$/, async (ctx) => {
  const slug = ctx.match![1];
  selectedAgents.set(FOUNDER_ID, { slug, name: slug });
  await ctx.editMessageText(
    `Selected <b>${escapeHtml(slug)}</b>. Send your message now.`,
    {
      parse_mode: "HTML",
    }
  );
  await ctx.answerCallbackQuery(`Selected ${slug}`);
});

// --- /ask ---
bot.command("ask", async (ctx) => {
  const text = ctx.message?.text || "";
  const afterCmd = text.replace(/^\/ask\s*/, "").trim();

  let agentSlug: string | null = null;
  let prompt: string = afterCmd;

  // Parse @agentname
  const atMatch = afterCmd.match(/^@(\S+)\s+([\s\S]+)/);
  if (atMatch) {
    agentSlug = atMatch[1];
    prompt = atMatch[2].trim();
  } else {
    const selected = selectedAgents.get(FOUNDER_ID);
    if (selected) {
      agentSlug = selected.slug;
      prompt = afterCmd;
    }
  }

  if (!agentSlug || !prompt) {
    await ctx.reply(
      "Usage: /ask @agentname your prompt\nOr select an agent first with /agents"
    );
    return;
  }

  await routeToAgent(ctx, agentSlug, prompt);
});

// --- /status ---
bot.command("status", async (ctx) => {
  await handleStatus(ctx);
});

async function handleStatus(ctx: Context) {
  const stopTyping = startTyping(ctx);

  try {
    const [vllm, nextjs, battleStation] = await Promise.all([
      checkService(`${VLLM_URL}/models`),
      checkService("http://localhost:3000"),
      checkService("http://localhost:5000/api/health"),
    ]);

    let dbUp = false;
    try {
      const db = await getDb();
      await db.$queryRawUnsafe("SELECT 1");
      dbUp = true;
    } catch {
      /* db down */
    }

    let gpuInfo = "";
    try {
      gpuInfo = await new Promise<string>((resolve, reject) => {
        exec(
          "nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader",
          { timeout: 10000 },
          (err, stdout) => {
            if (err) reject(err);
            else resolve(stdout.trim());
          }
        );
      });
    } catch {
      gpuInfo = "Unavailable";
    }

    stopTyping();

    const icon = (up: boolean) => (up ? "\u{1F7E2}" : "\u{1F534}");
    await ctx.reply(
      `<b>Platform Status</b>\n\n` +
        `${icon(vllm)} vLLM: ${vllm ? "UP" : "DOWN"}\n` +
        `${icon(dbUp)} Database: ${dbUp ? "UP" : "DOWN"}\n` +
        `${icon(nextjs)} Next.js: ${nextjs ? "UP" : "DOWN"}\n` +
        `${icon(battleStation)} Battle Station: ${battleStation ? "UP" : "DOWN"}\n\n` +
        `<b>GPU:</b> ${escapeHtml(gpuInfo)}`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    stopTyping();
    await ctx.reply(
      `Error: ${err instanceof Error ? err.message : "Unknown"}`
    );
  }
}

// --- /digest ---
async function generateDigest(): Promise<string> {
  try {
    const db = await getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [messageCount, convCount, topAgents] = await Promise.all([
      db.message.count({ where: { createdAt: { gte: today } } }),
      db.conversation.count({ where: { createdAt: { gte: today } } }),
      db.$queryRawUnsafe<{ name: string; count: bigint }[]>(
        `SELECT a.name, COUNT(m.id) as count
         FROM "Message" m
         JOIN "Conversation" c ON m."conversationId" = c.id
         JOIN "Agent" a ON c."agentId" = a.id
         WHERE m."createdAt" >= $1
         GROUP BY a.name
         ORDER BY count DESC
         LIMIT 5`,
        today
      ),
    ]);

    const agentLines =
      topAgents.length > 0
        ? topAgents
            .map((a, i) => `${i + 1}. ${a.name}: ${a.count} msgs`)
            .join("\n")
        : "No agent activity today";

    return (
      `<b>Daily Digest \u2014 ${today.toISOString().split("T")[0]}</b>\n\n` +
      `Messages today: <b>${messageCount}</b>\n` +
      `Conversations today: <b>${convCount}</b>\n\n` +
      `<b>Top Agents:</b>\n${escapeHtml(agentLines)}`
    );
  } catch (err) {
    return `Digest error: ${err instanceof Error ? err.message : "Unknown"}`;
  }
}

bot.command("digest", async (ctx) => {
  const stopTyping = startTyping(ctx);
  try {
    const digest = await generateDigest();
    stopTyping();
    await ctx.reply(digest, { parse_mode: "HTML" });
  } catch (err) {
    stopTyping();
    await ctx.reply(
      `Error: ${err instanceof Error ? err.message : "Unknown"}`
    );
  }
});

// --- /run ---
bot.command("run", async (ctx) => {
  const scriptName = (ctx.message?.text || "")
    .replace(/^\/run\s*/, "")
    .trim();

  await handleRun(ctx, scriptName);
});

async function handleRun(ctx: Context, scriptName: string) {
  if (!scriptName || !SCRIPTS[scriptName]) {
    const available = Object.keys(SCRIPTS).join(", ");
    await ctx.reply(`Unknown script. Available: ${available}`);
    return;
  }

  const script = SCRIPTS[scriptName];

  if (script.dangerous) {
    const confirmId = `confirm:${scriptName}:${Date.now()}`;
    pendingConfirms.set(confirmId, scriptName);
    const keyboard = new InlineKeyboard()
      .text("\u2705 Confirm", confirmId)
      .text("\u274C Cancel", `cancel:${confirmId}`);
    await ctx.reply(
      `\u26A0\uFE0F <b>${escapeHtml(scriptName)}</b> is a dangerous operation. Confirm?`,
      {
        parse_mode: "HTML",
        reply_markup: keyboard,
      }
    );
    return;
  }

  await executeScript(ctx, scriptName, script.cmd);
}

// Confirm/cancel callbacks
bot.callbackQuery(/^confirm:(.+)$/, async (ctx) => {
  const key = ctx.match![0];
  const scriptName = pendingConfirms.get(key);
  if (!scriptName || !SCRIPTS[scriptName]) {
    await ctx.answerCallbackQuery("Expired or invalid");
    return;
  }
  pendingConfirms.delete(key);
  await ctx.answerCallbackQuery("Executing...");
  await ctx.editMessageText(
    `Executing <b>${escapeHtml(scriptName)}</b>...`,
    { parse_mode: "HTML" }
  );
  await executeScript(ctx, scriptName, SCRIPTS[scriptName].cmd);
});

bot.callbackQuery(/^cancel:(.+)$/, async (ctx) => {
  const key = ctx.match![1];
  pendingConfirms.delete(key);
  await ctx.editMessageText("Cancelled.");
  await ctx.answerCallbackQuery("Cancelled");
});

async function executeScript(ctx: Context, name: string, cmd: string) {
  try {
    const output = await new Promise<string>((resolve, reject) => {
      exec(
        cmd,
        { timeout: 30000, shell: "cmd.exe" },
        (err, stdout, stderr) => {
          if (err && !stdout) reject(err);
          else resolve(stdout || stderr || "No output");
        }
      );
    });
    await sendLongMessage(
      ctx,
      `<b>${escapeHtml(name)}</b>\n<pre>${escapeHtml(output.trim())}</pre>`
    );
  } catch (err) {
    await ctx.reply(
      `Error executing ${name}: ${err instanceof Error ? err.message : "Unknown"}`
    );
  }
}

// --- Natural Language Message Router ---
// Priority: (a) exact agent match → select, (b) agent name + space → select + route,
// (c-g) builtin commands without slash, (h) route to selected agent, (i) fallback
bot.on("message:text", async (ctx) => {
  const raw = ctx.message.text.trim();
  const lower = raw.toLowerCase();

  // (a) Exact agent alias match → select that agent
  if (AGENT_ALIASES[lower]) {
    const slug = AGENT_ALIASES[lower];
    selectedAgents.set(FOUNDER_ID, { slug, name: slug });
    await ctx.reply(
      `Selected <b>${escapeHtml(slug)}</b>. Send your message now.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // (b) Starts with agent name/alias + space → select + route prompt
  for (const alias of ALIAS_KEYS) {
    if (lower.startsWith(alias + " ")) {
      const slug = AGENT_ALIASES[alias];
      const prompt = raw.slice(alias.length).trim();
      if (prompt) {
        selectedAgents.set(FOUNDER_ID, { slug, name: slug });
        await routeToAgent(ctx, slug, prompt);
        return;
      }
    }
  }

  // (c) No-slash "status"
  if (lower === "status") {
    await handleStatus(ctx);
    return;
  }

  // (d) No-slash "digest"
  if (lower === "digest") {
    const stopTyping = startTyping(ctx);
    try {
      const digest = await generateDigest();
      stopTyping();
      await ctx.reply(digest, { parse_mode: "HTML" });
    } catch (err) {
      stopTyping();
      await ctx.reply(
        `Error: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
    return;
  }

  // (e) No-slash "help"
  if (lower === "help") {
    await ctx.reply(
      `<b>Stone AI Command Center</b>\n\n` +
        `<b>Natural Language (just type):</b>\n` +
        `  stones check vLLM status\n` +
        `  cardinal run full audit\n` +
        `  marketing write me a campaign\n` +
        `  strategy analyze my competitors\n` +
        `  hr draft an offer letter\n\n` +
        `<b>Slash Commands:</b>\n` +
        `  /ask @agent prompt — Send a task to any agent\n` +
        `  /agents — Browse all agents with tap-to-select\n` +
        `  /status — Platform health check\n` +
        `  /digest — Today's platform summary\n` +
        `  /run scriptname — Execute approved scripts\n` +
        `  /help — Show this message\n\n` +
        `<b>No-slash shortcuts:</b>\n` +
        `  status, digest, help, agents, run gpu`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // (f) No-slash "agents"
  if (lower === "agents") {
    await showAgentCategories(ctx);
    return;
  }

  // (g) No-slash "run <script>"
  if (lower.startsWith("run ")) {
    const scriptName = raw.slice(4).trim();
    await handleRun(ctx, scriptName);
    return;
  }

  // (h) Route to currently selected agent
  const selected = selectedAgents.get(FOUNDER_ID);
  if (selected) {
    await routeToAgent(ctx, selected.slug, raw);
    return;
  }

  // (i) Fallback — no agent selected, no match
  await ctx.reply(
    "No agent selected. Say an agent name (e.g. <b>stones</b>, <b>cardinal</b>, <b>marketing</b>) or use /agents to browse.",
    { parse_mode: "HTML" }
  );
});

// --- Daily Digest Cron (8 AM Eastern) ---
cron.schedule(
  "0 8 * * *",
  async () => {
    try {
      const digest = await generateDigest();
      await bot.api.sendMessage(FOUNDER_ID, digest, { parse_mode: "HTML" });
      console.log("[TELEGRAM] Daily digest sent");
    } catch (err) {
      console.error("[TELEGRAM] Failed to send digest:", err);
    }
  },
  { timezone: "America/New_York" }
);

// --- START ---
console.log("[TELEGRAM] Starting Stone AI Command Center bot...");
bot.start({
  onStart: async () => {
    console.log("[TELEGRAM] Bot is running");
    try {
      await bot.api.sendMessage(
        FOUNDER_ID,
        "Stone AI bot started. Natural language routing active."
      );
    } catch (err) {
      console.error("[TELEGRAM] Failed to send startup message:", err);
    }
  },
});

// Graceful shutdown
process.on("SIGINT", () => {
  bot.stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  bot.stop();
  process.exit(0);
});
