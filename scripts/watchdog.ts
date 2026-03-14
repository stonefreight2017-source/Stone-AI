import { exec } from "child_process";
import * as nodemailer from "nodemailer";

const CHECK_INTERVAL = 30000;
const ALERT_THRESHOLD = 3;

const failCounts: Record<string, number> = {
  vllm: 0,
  nextjs: 0,
  postgres: 0,
};

const alertSent: Record<string, boolean> = {
  vllm: false,
  nextjs: false,
  postgres: false,
};

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function checkService(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkPostgres(): Promise<boolean> {
  try {
    const { PrismaClient } = await import("@/generated/prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    const db = new PrismaClient({ adapter });
    await db.$queryRawUnsafe("SELECT 1");
    await db.$disconnect();
    return true;
  } catch {
    return false;
  }
}

async function sendAlert(service: string): Promise<void> {
  const user = process.env.ALERT_EMAIL_USER || process.env.ALERT_EMAIL_ADDRESS || "";
  const pass = process.env.ALERT_EMAIL_PASS || process.env.ALERT_EMAIL_APP_PASSWORD || "";
  if (!user || !pass) {
    console.error(`[WATCHDOG] Cannot send alert — email credentials not set`);
    return;
  }

  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    await transport.sendMail({
      from: user,
      to: "3headedm@gmail.com",
      subject: `WATCHDOG ALERT — ${service.toUpperCase()} DOWN`,
      text: `[${timestamp()}] Service ${service} has been down for ${ALERT_THRESHOLD} consecutive checks (${ALERT_THRESHOLD * CHECK_INTERVAL / 1000}s).\n\nMachine: OMEN MAX 45L\nAction required.`,
    });

    console.log(`[WATCHDOG] Alert email sent for ${service}`);
  } catch (err) {
    console.error(`[WATCHDOG] Failed to send alert:`, err);
  }
}

function restartService(service: string): void {
  if (service === "vllm") {
    console.log("[WATCHDOG] vLLM DOWN — attempting restart");
    exec('wsl -d Ubuntu -- bash -c "cd /mnt/c && nohup vllm serve Qwen/Qwen3-32B-AWQ --port 8000 &"', (err) => {
      if (err) console.error("[WATCHDOG] vLLM restart failed:", err.message);
    });
  } else if (service === "nextjs") {
    console.log("[WATCHDOG] Next.js DOWN — attempting restart");
    exec(`cd "C:\\Users\\admin\\stone-ai" && start /B npm run dev`, { shell: "cmd.exe" }, (err) => {
      if (err) console.error("[WATCHDOG] Next.js restart failed:", err.message);
    });
  } else if (service === "postgres") {
    console.log("[WATCHDOG] PostgreSQL DOWN — check manually");
  }
}

async function runChecks(): Promise<void> {
  const vllmUp = await checkService("http://localhost:8000/v1/models");
  const nextjsUp = await checkService("http://localhost:3000");
  let pgUp = false;
  try {
    pgUp = await checkPostgres();
  } catch {
    pgUp = false;
  }

  console.log(
    `[WATCHDOG ${timestamp()}] vLLM: ${vllmUp ? "UP" : "DOWN"} | Next.js: ${nextjsUp ? "UP" : "DOWN"} | PostgreSQL: ${pgUp ? "UP" : "DOWN"}`
  );

  for (const [service, isUp] of Object.entries({ vllm: vllmUp, nextjs: nextjsUp, postgres: pgUp })) {
    if (!isUp) {
      failCounts[service]++;
      if (failCounts[service] >= ALERT_THRESHOLD && !alertSent[service]) {
        await sendAlert(service);
        alertSent[service] = true;
      }
      restartService(service);
    } else {
      failCounts[service] = 0;
      alertSent[service] = false;
    }
  }
}

async function main(): Promise<void> {
  console.log(`[WATCHDOG] Starting — checking every ${CHECK_INTERVAL / 1000}s`);
  while (true) {
    await runChecks();
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
  }
}

main().catch(console.error);
