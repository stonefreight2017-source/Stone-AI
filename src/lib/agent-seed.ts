import { db } from "@/lib/db";
import { AGENT_DEFINITIONS } from "@/lib/agent-definitions";
import { indexKnowledgeChunk } from "@/lib/embeddings";

/**
 * Seed all agents into the database.
 * Upserts agents by slug and re-indexes knowledge chunks.
 */
export async function seedAgents() {
  console.log(`Seeding ${AGENT_DEFINITIONS.length} agents...`);

  for (const def of AGENT_DEFINITIONS) {
    // Upsert agent
    const agent = await db.agent.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        systemPrompt: def.systemPrompt,
        requiredTier: def.requiredTier,
        sortOrder: def.sortOrder,
      },
      update: {
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        systemPrompt: def.systemPrompt,
        requiredTier: def.requiredTier,
        sortOrder: def.sortOrder,
      },
    });

    // Seed knowledge chunks (skip if already seeded)
    const existingChunks = await db.agentKnowledgeChunk.count({
      where: { agentId: agent.id },
    });

    if (existingChunks === 0 && def.knowledgeSeed.length > 0) {
      for (const seed of def.knowledgeSeed) {
        const chunk = await db.agentKnowledgeChunk.create({
          data: {
            agentId: agent.id,
            title: seed.title,
            content: seed.content,
            source: "seed",
          },
        });

        // Index the chunk for vector search
        try {
          await indexKnowledgeChunk(chunk.id, seed.content);
        } catch (err) {
          console.warn(`Failed to index chunk ${chunk.id}:`, err);
        }
      }
      console.log(`  ✓ ${def.name}: ${def.knowledgeSeed.length} knowledge chunks seeded`);
    } else {
      console.log(`  ✓ ${def.name}: already seeded`);
    }
  }

  console.log("Agent seeding complete.");
}
