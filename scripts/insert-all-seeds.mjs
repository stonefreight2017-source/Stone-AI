import pg from "pg";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";

const DATABASE_URL = "postgresql://neondb_owner:npg_6YsiPDZtEMK7@ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const AGENT_IDS = {
  "website-development": "cmmbi398200354cul478v9nhf",
  "engineering-architect": "cmmbi3clv005d4culsq8zrof9",
  "general-coding-assistant": "29c08baf-f8b2-4016-8b58-503b20e42864",
  "platform-onboarding": "d2071043-bbf3-4ce7-b6b6-474da2a7219e",
  "platform-onboarding-concierge": "d2071043-bbf3-4ce7-b6b6-474da2a7219e",
  "digital-marketing-strategist": "e868fead-e12b-448a-87c4-d6acfa08342d",
  "ecommerce-store-builder": null,
  "enterprise-implementation": null,
  "hr-people-operations": null,
  "legal-basics-reviewer": null,
  "project-management-coach": null,
  "podcast-production": null,
  "academic-tutor": null,
  "health-wellness-coach": null,
  "research-synthesis": null,
  "personal-finance-advisor": null,
  "real-estate-investing": null,
};

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Get ALL agent IDs
  const agentRes = await client.query('SELECT id, slug FROM "Agent"');
  for (const row of agentRes.rows) {
    AGENT_IDS[row.slug] = row.id;
  }

  const files = [
    { path: "scripts/seeds-website-dev.ts", defaultSlug: "website-development" },
    { path: "scripts/seeds-engineering.ts", defaultSlug: null },
    { path: "scripts/seeds-devops-marketing.ts", defaultSlug: null },
    { path: "scripts/knowledge-seeds-batch.ts", defaultSlug: null },
  ];

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const file of files) {
    let raw;
    try {
      raw = readFileSync(file.path, "utf8");
    } catch {
      console.log(`SKIP file: ${file.path} not found`);
      continue;
    }
    console.log(`\nProcessing: ${file.path}`);

    // Strategy: use eval-like approach - extract each object manually
    // Find all title/content/source triplets using a state machine
    const seeds = [];
    let pos = 0;

    while (pos < raw.length) {
      // Find next "title:"
      const titleIdx = raw.indexOf("title:", pos);
      if (titleIdx === -1) break;

      // Determine slug context: look backwards for "agentSlug:" or a key like "slug-name": [
      let slug = file.defaultSlug;
      const before = raw.substring(Math.max(0, titleIdx - 500), titleIdx);

      // Check for agentSlug: "xxx"
      const slugMatch = before.match(/agentSlug:\s*"([^"]+)"/);
      if (slugMatch) slug = slugMatch[1];

      // Check for "slug-name": [ pattern (batch file format)
      const keyMatch = before.match(/"([a-z][a-z0-9-]+)":\s*\[(?:(?!\]:)[^])*$/s);
      if (keyMatch) slug = keyMatch[1];

      // Extract title value
      const titleStart = raw.indexOf('"', titleIdx + 6);
      if (titleStart === -1) { pos = titleIdx + 6; continue; }
      const titleEnd = findClosingQuote(raw, titleStart);
      if (titleEnd === -1) { pos = titleIdx + 6; continue; }
      const title = raw.substring(titleStart + 1, titleEnd).replace(/\\"/g, '"');

      // Extract content value (may use backticks or quotes)
      const contentIdx = raw.indexOf("content:", titleEnd);
      if (contentIdx === -1 || contentIdx > titleEnd + 100) { pos = titleEnd; continue; }

      let content;
      const contentDelimStart = raw.indexOf("`", contentIdx + 8);
      const contentQuoteStart = raw.indexOf('"', contentIdx + 8);

      if (contentDelimStart !== -1 && (contentQuoteStart === -1 || contentDelimStart < contentQuoteStart)) {
        // Backtick delimited
        const contentEnd = raw.indexOf("`", contentDelimStart + 1);
        if (contentEnd === -1) { pos = contentIdx + 8; continue; }
        content = raw.substring(contentDelimStart + 1, contentEnd);
        pos = contentEnd + 1;
      } else if (contentQuoteStart !== -1) {
        // Quote delimited
        const contentEnd = findClosingQuote(raw, contentQuoteStart);
        if (contentEnd === -1) { pos = contentIdx + 8; continue; }
        content = raw.substring(contentQuoteStart + 1, contentEnd).replace(/\\"/g, '"').replace(/\\n/g, "\n");
        pos = contentEnd + 1;
      } else {
        pos = contentIdx + 8;
        continue;
      }

      // Extract source
      const sourceIdx = raw.indexOf("source:", pos);
      let source = "Stone Intelligence Research";
      if (sourceIdx !== -1 && sourceIdx < pos + 200) {
        const srcQuote = raw.indexOf('"', sourceIdx + 7);
        if (srcQuote !== -1) {
          const srcEnd = findClosingQuote(raw, srcQuote);
          if (srcEnd !== -1) {
            source = raw.substring(srcQuote + 1, srcEnd);
            pos = srcEnd + 1;
          }
        }
      }

      if (title && content && content.length > 50) {
        seeds.push({ slug, title, content, source });
      }
    }

    console.log(`  Found ${seeds.length} seeds`);

    for (const seed of seeds) {
      const agentId = AGENT_IDS[seed.slug];
      if (!agentId) {
        console.log(`  SKIP: No agent for "${seed.slug}"`);
        totalSkipped++;
        continue;
      }

      // Deduplicate
      const dup = await client.query(
        'SELECT id FROM "AgentKnowledgeChunk" WHERE "agentId" = $1 AND title = $2',
        [agentId, seed.title]
      );
      if (dup.rows.length > 0) {
        totalSkipped++;
        continue;
      }

      await client.query(
        'INSERT INTO "AgentKnowledgeChunk" (id, "agentId", title, content, source, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
        [randomUUID(), agentId, seed.title, seed.content, seed.source]
      );
      totalInserted++;
      console.log(`  OK: [${seed.slug}] ${seed.title.substring(0, 55)}`);
    }
  }

  const total = await client.query('SELECT COUNT(*) as count FROM "AgentKnowledgeChunk"');
  console.log(`\n=== RESULTS ===`);
  console.log(`Inserted: ${totalInserted}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`Total chunks in DB: ${total.rows[0].count}`);

  await client.end();
}

function findClosingQuote(str, openPos) {
  let i = openPos + 1;
  while (i < str.length) {
    if (str[i] === '\\') { i += 2; continue; }
    if (str[i] === '"') return i;
    i++;
  }
  return -1;
}

main().catch(console.error);
