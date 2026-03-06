import pg from "pg";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";

const DATABASE_URL = "postgresql://neondb_owner:npg_6YsiPDZtEMK7@ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  const agentRes = await client.query('SELECT id, slug FROM "Agent"');
  const AGENT_IDS = {};
  for (const row of agentRes.rows) AGENT_IDS[row.slug] = row.id;
  console.log(`Loaded ${agentRes.rows.length} agents`);

  const raw = readFileSync("scripts/seeds-vercel-advanced.ts", "utf8");
  const seeds = [];

  const slugPattern = /"([a-z][a-z0-9-]+)":\s*\[/g;
  let slugMatch;

  while ((slugMatch = slugPattern.exec(raw)) !== null) {
    const slug = slugMatch[1];
    let pos = slugMatch.index + slugMatch[0].length;

    // Find the next slug boundary
    const nextSlug = slugPattern.exec(raw);
    const boundary = nextSlug ? nextSlug.index : raw.length;
    if (nextSlug) slugPattern.lastIndex = nextSlug.index; // reset for next iteration

    const section = raw.substring(pos, boundary);
    let spos = 0;

    while (spos < section.length) {
      const tIdx = section.indexOf("title: `", spos);
      if (tIdx === -1) break;
      const tStart = tIdx + 8;
      const tEnd = section.indexOf("`", tStart);
      if (tEnd === -1) break;
      const title = section.substring(tStart, tEnd);

      const cIdx = section.indexOf("content: `", tEnd);
      if (cIdx === -1) break;
      const cStart = cIdx + 10;
      const cEnd = section.indexOf("`", cStart);
      if (cEnd === -1) break;
      const content = section.substring(cStart, cEnd);

      // Extract source
      let source = "Stone Intelligence Research";
      const srcIdx = section.indexOf("source: ", cEnd);
      if (srcIdx !== -1 && srcIdx < cEnd + 100) {
        const srcDelim = section[srcIdx + 8]; // " or `
        if (srcDelim === '"' || srcDelim === '`') {
          const srcEnd = section.indexOf(srcDelim, srcIdx + 9);
          if (srcEnd !== -1) source = section.substring(srcIdx + 9, srcEnd);
        }
      }

      if (title && content.length > 50) {
        seeds.push({ slug, title, content, source });
      }
      spos = cEnd + 1;
    }
  }

  console.log(`Found ${seeds.length} seeds`);

  let inserted = 0, skipped = 0;
  for (const seed of seeds) {
    const agentId = AGENT_IDS[seed.slug];
    if (!agentId) { console.log(`  SKIP: No agent "${seed.slug}"`); skipped++; continue; }

    const dup = await client.query(
      'SELECT id FROM "AgentKnowledgeChunk" WHERE "agentId" = $1 AND title = $2',
      [agentId, seed.title]
    );
    if (dup.rows.length > 0) { skipped++; continue; }

    await client.query(
      'INSERT INTO "AgentKnowledgeChunk" (id, "agentId", title, content, source, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [randomUUID(), agentId, seed.title, seed.content, seed.source]
    );
    inserted++;
    console.log(`  OK: [${seed.slug}] ${seed.title.substring(0, 60)}`);
  }

  const total = await client.query('SELECT COUNT(*) as count FROM "AgentKnowledgeChunk"');
  console.log(`\n=== RESULTS ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total chunks in DB: ${total.rows[0].count}`);
  await client.end();
}

main().catch(console.error);
