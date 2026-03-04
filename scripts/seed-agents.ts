/**
 * Standalone seed script for agents.
 * Run with: npx tsx scripts/seed-agents.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { AGENT_DEFINITIONS } from "../src/lib/agent-definitions";

async function main() {
  console.log(`Seeding ${AGENT_DEFINITIONS.length} agents...`);

  for (const def of AGENT_DEFINITIONS) {
    const agent = await db.agent.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category as any,
        icon: def.icon,
        systemPrompt: def.systemPrompt,
        requiredTier: def.requiredTier as any,
        sortOrder: def.sortOrder,
      },
      update: {
        name: def.name,
        description: def.description,
        category: def.category as any,
        icon: def.icon,
        systemPrompt: def.systemPrompt,
        requiredTier: def.requiredTier as any,
        sortOrder: def.sortOrder,
      },
    });

    // Seed knowledge chunks if not already seeded
    const existingChunks = await db.agentKnowledgeChunk.count({
      where: { agentId: agent.id },
    });

    if (existingChunks === 0 && def.knowledgeSeed.length > 0) {
      for (const seed of def.knowledgeSeed) {
        await db.agentKnowledgeChunk.create({
          data: {
            agentId: agent.id,
            title: seed.title,
            content: seed.content,
            source: "seed",
          },
        });
      }
      console.log(`  + ${def.name}: ${def.knowledgeSeed.length} knowledge chunks`);
    } else {
      console.log(`  = ${def.name}: OK`);
    }
  }

  console.log("\nDone. All agents seeded.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
