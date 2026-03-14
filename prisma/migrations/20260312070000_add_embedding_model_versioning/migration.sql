-- AlterTable: Add embeddingModel column to AgentKnowledgeChunk
-- Tracks which embedding model generated each vector for versioning/re-embedding

ALTER TABLE "AgentKnowledgeChunk" ADD COLUMN "embeddingModel" TEXT DEFAULT 'unknown';
