import { generateEmbedding } from "@/lib/embeddings";
import { db } from "@/lib/db";

export async function checkCache(
  agentSlug: string,
  query: string,
  threshold: number = 0.92
): Promise<string | null> {
  try {
    const result = await generateEmbedding(query);
    const vecStr = `[${result.embedding.join(",")}]`;

    const rows = await db.$queryRawUnsafe<
      { id: string; responseText: string; similarity: number }[]
    >(
      `SELECT id, "responseText", 1 - ("queryEmbedding" <=> $1::vector) as similarity
       FROM "SemanticCache"
       WHERE "agentSlug" = $2
         AND "queryEmbedding" IS NOT NULL
         AND 1 - ("queryEmbedding" <=> $1::vector) > $3
       ORDER BY "queryEmbedding" <=> $1::vector
       LIMIT 1`,
      vecStr,
      agentSlug,
      threshold
    );

    if (rows.length > 0) {
      // Increment hit count
      await db.$queryRawUnsafe(
        `UPDATE "SemanticCache" SET "hitCount" = "hitCount" + 1, "lastHitAt" = NOW() WHERE id = $1`,
        rows[0].id
      );
      return rows[0].responseText;
    }

    return null;
  } catch (error) {
    console.warn("[semantic-cache] checkCache error:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function saveToCache(
  agentSlug: string,
  queryText: string,
  responseText: string
): Promise<void> {
  try {
    const result = await generateEmbedding(queryText);
    const vecStr = `[${result.embedding.join(",")}]`;

    await db.$queryRawUnsafe(
      `INSERT INTO "SemanticCache" (id, "agentSlug", "queryEmbedding", "queryText", "responseText", "hitCount", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2::vector, $3, $4, 0, NOW(), NOW())`,
      agentSlug,
      vecStr,
      queryText,
      responseText
    );
  } catch (error) {
    console.warn("[semantic-cache] saveToCache error:", error instanceof Error ? error.message : error);
  }
}
