import pg from "pg";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";

const DATABASE_URL = "postgresql://neondb_owner:npg_6YsiPDZtEMK7@ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Get ALL agent IDs
  const agentRes = await client.query('SELECT id, slug FROM "Agent"');
  const AGENT_IDS = {};
  for (const row of agentRes.rows) {
    AGENT_IDS[row.slug] = row.id;
  }
  console.log(`Loaded ${agentRes.rows.length} agents from DB`);

  const raw = readFileSync("scripts/knowledge-seeds-batch.ts", "utf8");

  // Parse the TypeScript object: find each "slug-name": [ ... ] block
  // then extract {title: `...`, content: `...`} entries
  const seeds = [];

  // Match each slug key and its array
  const slugPattern = /"([a-z][a-z0-9-]+)":\s*\[/g;
  let slugMatch;

  while ((slugMatch = slugPattern.exec(raw)) !== null) {
    const slug = slugMatch[1];
    const arrayStart = slugMatch.index + slugMatch[0].length;

    // Find all title/content pairs within this slug's section
    // We'll scan forward from arrayStart until we hit the closing ] for this array
    let pos = arrayStart;

    while (pos < raw.length) {
      // Find next title: `
      const titleIdx = raw.indexOf("title: `", pos);
      if (titleIdx === -1) break;

      // Check we haven't passed a ], which would mean we left this slug's array
      // Look for the next slug pattern to know our boundary
      const nextSlugIdx = raw.indexOf('": [', arrayStart + 1);
      if (nextSlugIdx !== -1 && titleIdx > nextSlugIdx) break;

      // Extract backtick-delimited title
      const titleStart = titleIdx + 8; // after "title: `"
      const titleEnd = raw.indexOf("`", titleStart);
      if (titleEnd === -1) { pos = titleStart; continue; }
      const title = raw.substring(titleStart, titleEnd);

      // Find content: `
      const contentIdx = raw.indexOf("content: `", titleEnd);
      if (contentIdx === -1 || contentIdx > titleEnd + 50) { pos = titleEnd; continue; }

      const contentStart = contentIdx + 10; // after "content: `"
      const contentEnd = raw.indexOf("`", contentStart);
      if (contentEnd === -1) { pos = contentStart; continue; }
      const content = raw.substring(contentStart, contentEnd);

      if (title && content && content.length > 50) {
        seeds.push({ slug, title, content, source: "Stone Intelligence Research" });
      }

      pos = contentEnd + 1;
    }
  }

  console.log(`Found ${seeds.length} seeds across batch file`);

  let inserted = 0;
  let skipped = 0;

  for (const seed of seeds) {
    const agentId = AGENT_IDS[seed.slug];
    if (!agentId) {
      console.log(`  SKIP: No agent for "${seed.slug}"`);
      skipped++;
      continue;
    }

    const dup = await client.query(
      'SELECT id FROM "AgentKnowledgeChunk" WHERE "agentId" = $1 AND title = $2',
      [agentId, seed.title]
    );
    if (dup.rows.length > 0) {
      skipped++;
      continue;
    }

    await client.query(
      'INSERT INTO "AgentKnowledgeChunk" (id, "agentId", title, content, source, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [randomUUID(), agentId, seed.title, seed.content, seed.source]
    );
    inserted++;
    console.log(`  OK: [${seed.slug}] ${seed.title.substring(0, 55)}`);
  }

  const total = await client.query('SELECT COUNT(*) as count FROM "AgentKnowledgeChunk"');
  console.log(`\n=== RESULTS ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total chunks in DB: ${total.rows[0].count}`);

  await client.end();
}

main().catch(console.error);
