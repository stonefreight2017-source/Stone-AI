/**
 * ═══ SCALING REMINDER — DATABASE CONNECTIONS ═══
 * Neon free/basic: 100 connections max.
 * At 100+ concurrent users, enable connection pooling:
 *   DATABASE_URL should use the Neon pooler endpoint (port 5432 with ?pgbouncer=true)
 *   or the -pooler hostname Neon provides.
 * At 500+ users: upgrade Neon plan for more compute units.
 * At 2000+ users: consider read replicas for heavy read paths (agent list, forum).
 *
 * ═══ SECURITY ═══
 * - DATABASE_URL contains credentials. Never log it.
 * - Connection is TLS-encrypted by default on Neon.
 * - Prisma parameterizes all queries (SQL injection safe).
 * - Raw queries in audit.ts use $executeRawUnsafe — parameters are passed separately (safe).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
