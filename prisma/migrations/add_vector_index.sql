-- Migration: Add HNSW index on AgentKnowledgeChunk.embedding for cosine similarity search
-- Replaces sequential scan with approximate nearest-neighbor index
-- Requires: pgvector extension already enabled
--
-- Run with:
--   psql $DATABASE_URL -f prisma/migrations/add_vector_index.sql
-- Or via Neon console SQL editor

-- Create HNSW index with cosine distance operator class
-- m = 16 (connections per layer, default), ef_construction = 64 (build-time search width, default)
-- These defaults work well for 768-dim vectors up to ~1M rows
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_knowledge_chunk_embedding_hnsw
  ON "AgentKnowledgeChunk"
  USING hnsw (embedding vector_cosine_ops);
