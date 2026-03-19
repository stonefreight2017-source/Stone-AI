/**
 * Secure code execution sandbox using Docker containers.
 *
 * SECURITY MODEL:
 * - Each execution runs in an isolated Docker container
 * - No network access (--network=none)
 * - Read-only filesystem (--read-only)
 * - Limited resources (256MB RAM, 0.5 CPU, 50 PIDs)
 * - 30-second timeout with forced kill
 * - User code is NEVER passed via CLI args — always mounted as a file
 * - Output truncated to prevent memory exhaustion
 */

import { execFile } from "node:child_process";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { getTierConfig } from "./tier-config";
import { db } from "./db";
import type { Tier } from "./tier-config";

// ═══ Types ═══

export interface ExecuteOptions {
  /** Max execution time in ms. Default: 30000 (30s). Max: 30000. */
  timeoutMs?: number;
  /** Max stdout bytes. Default: 10240 (10KB). */
  maxStdoutBytes?: number;
  /** Max stderr bytes. Default: 5120 (5KB). */
  maxStderrBytes?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
}

export type SupportedLanguage = "python" | "javascript" | "bash";

// ═══ Constants ═══

const MAX_TIMEOUT_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_STDOUT_BYTES = 10_240;  // 10KB
const MAX_STDERR_BYTES = 5_120;   // 5KB
const MAX_CODE_LENGTH = 50_000;   // 50KB max code input

/** Docker images per language — pinned to specific alpine variants for minimal attack surface */
const DOCKER_IMAGES: Record<SupportedLanguage, string> = {
  python: "python:3.12-alpine",
  javascript: "node:22-alpine",
  bash: "alpine:3.20",
};

/** Entrypoint commands per language */
const ENTRYPOINTS: Record<SupportedLanguage, string[]> = {
  python: ["python3", "/sandbox/code.py"],
  javascript: ["node", "/sandbox/code.js"],
  bash: ["sh", "/sandbox/code.sh"],
};

/** File extensions per language */
const EXTENSIONS: Record<SupportedLanguage, string> = {
  python: "py",
  javascript: "js",
  bash: "sh",
};

const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set<SupportedLanguage>([
  "python",
  "javascript",
  "bash",
]);

/**
 * Tier-based daily execution limits.
 * These mirror the codeExecutionsPerDay field in tier-config.ts.
 * When tier-config values are updated from 0 (Coming Soon) to real values,
 * this map should be updated to match. Until then, these are the intended limits.
 */
const EXECUTION_LIMITS: Record<string, number> = {
  FREE: 0,
  STARTER: 10,
  PLUS: 30,
  SMART: 100,
  PRO: 500,
  ENTERPRISE: 1000,
};

// ═══ Validation ═══

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.has(lang);
}

/**
 * Validate code input before execution.
 * Returns null if valid, or an error message string.
 */
function validateCode(code: string): string | null {
  if (!code || typeof code !== "string") {
    return "Code must be a non-empty string";
  }
  if (code.length > MAX_CODE_LENGTH) {
    return `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`;
  }
  return null;
}

// ═══ Quota Management ═══

/**
 * Check if a user has remaining code execution quota for today.
 *
 * Uses raw SQL to track code executions in a dedicated table.
 * This avoids modifying the existing DailyUsage Prisma model.
 * The table is auto-created on first use (idempotent).
 */
export async function checkExecutionQuota(
  userId: string,
  tier: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = EXECUTION_LIMITS[tier] ?? 0;

  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0 };
  }

  await ensureExecutionTable();

  const todayStr = getTodayDateString();

  const rows = await db.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT count FROM code_execution_usage WHERE user_id = $1 AND date = $2`,
    userId,
    todayStr
  );

  const used = rows.length > 0 ? Number(rows[0].count) : 0;

  return {
    allowed: used < limit,
    used,
    limit,
  };
}

/**
 * Increment the daily code execution counter for a user.
 */
async function incrementExecutionCount(userId: string): Promise<void> {
  await ensureExecutionTable();

  const todayStr = getTodayDateString();

  await db.$executeRawUnsafe(
    `INSERT INTO code_execution_usage (user_id, date, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, date)
     DO UPDATE SET count = code_execution_usage.count + 1`,
    userId,
    todayStr
  );
}

/** Get today's date as YYYY-MM-DD string (UTC) */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/** Idempotent: create the tracking table if it doesn't exist */
let tableEnsured = false;
async function ensureExecutionTable(): Promise<void> {
  if (tableEnsured) return;
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS code_execution_usage (
      user_id TEXT NOT NULL,
      date    TEXT NOT NULL,
      count   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    )
  `);
  tableEnsured = true;
}

// ═══ Core Execution ═══

/**
 * Execute user code in a secure Docker sandbox.
 *
 * Security measures:
 * - Code is written to a temp file and bind-mounted read-only into the container
 * - Container has NO network access
 * - Container filesystem is read-only (except /tmp with 10MB limit)
 * - Resource limits: 256MB RAM, 0.5 CPU cores, 50 PIDs, 64 open files
 * - Execution killed after timeout (default 30s)
 * - Output truncated to prevent memory exhaustion
 * - Container auto-removed after execution
 * - Runs as non-root user (uid 1000) inside the container
 */
export async function executeCode(
  code: string,
  language: string,
  options?: ExecuteOptions
): Promise<ExecutionResult> {
  // Validate language
  if (!isSupportedLanguage(language)) {
    return {
      stdout: "",
      stderr: `Unsupported language: ${language}. Supported: python, javascript, bash`,
      exitCode: 1,
      timedOut: false,
      executionTime: 0,
    };
  }

  // Validate code
  const codeError = validateCode(code);
  if (codeError) {
    return {
      stdout: "",
      stderr: codeError,
      exitCode: 1,
      timedOut: false,
      executionTime: 0,
    };
  }

  const timeoutMs = Math.min(options?.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
  const maxStdout = options?.maxStdoutBytes ?? MAX_STDOUT_BYTES;
  const maxStderr = options?.maxStderrBytes ?? MAX_STDERR_BYTES;

  // Create a unique temp directory for this execution
  const execId = randomUUID();
  const sandboxDir = join(tmpdir(), `stone-sandbox-${execId}`);
  const codeFile = join(sandboxDir, `code.${EXTENSIONS[language]}`);

  try {
    // Write code to temp file
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(codeFile, code, { encoding: "utf-8", mode: 0o444 });

    const startTime = Date.now();

    // Build Docker command with ALL security flags
    const dockerArgs = [
      "run",
      "--rm",                              // Auto-cleanup container
      "--network=none",                    // NO network access
      "--read-only",                       // Read-only root filesystem
      "--tmpfs", "/tmp:size=10M,noexec",   // Limited temp space, no execution from /tmp
      "--memory=256m",                     // Max 256MB RAM
      "--memory-swap=256m",                // No swap (same as memory = no extra swap)
      "--cpus=0.5",                        // Max half a CPU core
      "--pids-limit=50",                   // Prevent fork bombs
      "--ulimit", "nofile=64:64",          // Limit open files
      "--ulimit", "fsize=10485760:10485760", // Limit file writes to 10MB
      "--user", "1000:1000",               // Run as non-root
      "--cap-drop=ALL",                    // Drop ALL Linux capabilities
      "--security-opt=no-new-privileges",  // Prevent privilege escalation
      "-v", `${sandboxDir}:/sandbox:ro`,   // Mount code read-only
      "--workdir", "/sandbox",             // Set working directory
      DOCKER_IMAGES[language],             // Image
      ...ENTRYPOINTS[language],            // Entrypoint + args
    ];

    const result = await new Promise<ExecutionResult>((resolve) => {
      const child = execFile("docker", dockerArgs, {
        timeout: timeoutMs,
        maxBuffer: Math.max(maxStdout, maxStderr) * 2, // Buffer for both streams
        windowsHide: true,
      }, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;

        // Truncate output
        const truncatedStdout = truncateOutput(stdout ?? "", maxStdout);
        const truncatedStderr = truncateOutput(stderr ?? "", maxStderr);

        if (error && "killed" in error && error.killed) {
          // Process was killed (timeout)
          resolve({
            stdout: truncatedStdout,
            stderr: truncatedStderr || "Execution timed out",
            exitCode: 124, // Standard timeout exit code
            timedOut: true,
            executionTime,
          });
          return;
        }

        // Extract exit code from error or default to 0
        let exitCode = 0;
        if (error && "code" in error && typeof error.code === "number") {
          exitCode = error.code;
        } else if (error) {
          exitCode = 1;
        }

        resolve({
          stdout: truncatedStdout,
          stderr: truncatedStderr,
          exitCode,
          timedOut: false,
          executionTime,
        });
      });

      // Safety kill if child process somehow survives
      const safetyTimer = setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {
          // Process may already be dead
        }
      }, timeoutMs + 5_000);

      child.on("close", () => clearTimeout(safetyTimer));
    });

    return result;
  } finally {
    // Cleanup: remove temp files (fire-and-forget)
    cleanup(sandboxDir, codeFile).catch(() => {
      // Silently ignore cleanup errors — OS will handle /tmp eventually
    });
  }
}

/**
 * Execute code with quota tracking.
 * This is the main entry point for the API route.
 */
export async function executeCodeWithQuota(
  userId: string,
  tier: string,
  code: string,
  language: string,
  options?: ExecuteOptions
): Promise<ExecutionResult & { quotaUsed: number; quotaLimit: number }> {
  // Check quota
  const quota = await checkExecutionQuota(userId, tier);
  if (!quota.allowed) {
    return {
      stdout: "",
      stderr: quota.limit === 0
        ? "Code execution is not available on your current tier. Please upgrade."
        : `Daily code execution limit reached (${quota.used}/${quota.limit}). Resets at midnight UTC.`,
      exitCode: 1,
      timedOut: false,
      executionTime: 0,
      quotaUsed: quota.used,
      quotaLimit: quota.limit,
    };
  }

  // Execute code
  const result = await executeCode(code, language, options);

  // Increment quota (even if execution failed — the resource was consumed)
  await incrementExecutionCount(userId);

  return {
    ...result,
    quotaUsed: quota.used + 1,
    quotaLimit: quota.limit,
  };
}

// ═══ Helpers ═══

function truncateOutput(output: string, maxBytes: number): string {
  if (Buffer.byteLength(output, "utf-8") <= maxBytes) {
    return output;
  }
  // Truncate at byte boundary and append notice
  const truncated = Buffer.from(output, "utf-8").subarray(0, maxBytes).toString("utf-8");
  return truncated + "\n\n[Output truncated — exceeded maximum size]";
}

async function cleanup(dir: string, file: string): Promise<void> {
  try {
    await unlink(file);
  } catch {
    // ignore
  }
  try {
    const { rmdir } = await import("node:fs/promises");
    await rmdir(dir);
  } catch {
    // ignore
  }
}
