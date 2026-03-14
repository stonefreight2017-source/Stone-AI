/**
 * Palace Inbox Manager — Inbound Email System
 * Three-Headed Monster Operations
 *
 * Connects to Gmail via IMAP to read, parse, classify, and route emails.
 * Implements D13 command parsing (@AGENT ACTION) and founder reply detection.
 *
 * Usage:
 *   node inbox-manager.mjs                  # Interactive menu
 *   node inbox-manager.mjs --check          # Check latest 10 emails
 *   node inbox-manager.mjs --unread         # Get unread emails only
 *   node inbox-manager.mjs --commands       # Find @ prefix commands
 *   node inbox-manager.mjs --replies        # Find founder replies
 *   node inbox-manager.mjs --mark-read UID  # Mark specific email as read
 */

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

// ─── Configuration ───────────────────────────────────────────────────────────

const IMAP_CONFIG = {
  host: "imap.gmail.com",
  port: 993,
  secure: true,
  auth: {
    user: "3headedm@gmail.com",
    pass: "xlscicjddqyqcjiu",
  },
  logger: false, // Set to true for debug output
};

// Recognized command agents per D13
const COMMAND_AGENTS = ["STONE", "CARDINAL", "CHAOS", "WIZ", "RUSH"];

// ─── IMAP Client Factory ────────────────────────────────────────────────────

function createClient() {
  return new ImapFlow(IMAP_CONFIG);
}

// ─── Email Parsing Utilities ─────────────────────────────────────────────────

/**
 * Strips HTML tags and returns plain text.
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts the founder's actual reply text from an email body,
 * removing quoted original content (lines starting with > or "On ... wrote:" blocks).
 */
function extractReplyText(text) {
  if (!text) return "";

  const lines = text.split("\n");
  const replyLines = [];
  let hitQuotedSection = false;

  for (const line of lines) {
    // Detect "On <date> <person> wrote:" pattern — everything after is quoted
    if (/^On .+ wrote:$/i.test(line.trim())) {
      hitQuotedSection = true;
      continue;
    }
    // Detect Gmail's "---------- Forwarded message ----------" separator
    if (/^-{5,}\s*(Forwarded|Original)\s+message/i.test(line.trim())) {
      hitQuotedSection = true;
      continue;
    }
    // Detect "> " quoted lines
    if (line.trim().startsWith(">")) {
      hitQuotedSection = true;
      continue;
    }
    // Detect "From: " header in quoted section
    if (hitQuotedSection && /^(From|To|Date|Subject|Sent|Cc):/i.test(line.trim())) {
      continue;
    }

    if (!hitQuotedSection) {
      replyLines.push(line);
    }
  }

  return replyLines.join("\n").trim();
}

/**
 * Parses a subject line for @ prefix commands per D13.
 * Returns { agent, command, isCommand } or { isCommand: false }
 */
function parseCommand(subject) {
  if (!subject) return { isCommand: false };

  const match = subject.match(/^@(\w+)\s+(.*)/i);
  if (!match) return { isCommand: false };

  const agentName = match[1].toUpperCase();
  const command = match[2].trim();

  if (COMMAND_AGENTS.includes(agentName)) {
    return {
      isCommand: true,
      agent: agentName,
      command,
      requiresAction: true,
    };
  }

  // Unknown agent name after @
  return {
    isCommand: true,
    agent: agentName,
    command,
    requiresAction: true,
    warning: `Unknown agent "${agentName}". Known agents: ${COMMAND_AGENTS.join(", ")}`,
  };
}

/**
 * Classifies email priority:
 * P0 = urgent (commands, security alerts)
 * P1 = important (replies to Palace Intel)
 * P2 = normal (regular emails)
 * P3 = informational (newsletters, etc.)
 */
function classifyPriority(email) {
  const subject = (email.subject || "").toLowerCase();
  const from = (email.from || "").toLowerCase();

  // P0: @ commands from founder
  if (email.parsedCommand?.isCommand) return "P0";

  // P0: Security-related
  if (subject.includes("security") || subject.includes("breach") || subject.includes("urgent")) return "P0";

  // P1: Replies to Palace emails
  if (email.isReply) return "P1";

  // P2: Regular correspondence
  if (from.includes("3headedm") || from.includes("stone")) return "P2";

  // P3: Everything else
  return "P3";
}

// ─── Core IMAP Functions ─────────────────────────────────────────────────────

/**
 * Fetches the latest N emails from INBOX.
 * Returns array of { uid, date, from, subject, body, html, replyText }
 */
async function checkInbox(count = 10) {
  const client = createClient();
  const emails = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Get the latest messages
      const totalMessages = client.mailbox.exists;
      if (totalMessages === 0) {
        console.log("Inbox is empty.");
        return emails;
      }

      const startSeq = Math.max(1, totalMessages - count + 1);
      const range = `${startSeq}:${totalMessages}`;

      for await (const message of client.fetch(range, {
        envelope: true,
        source: true,
        uid: true,
        flags: true,
      })) {
        const parsed = await simpleParser(message.source);

        const fromAddr =
          parsed.from?.value?.map((a) => `${a.name || ""} <${a.address}>`).join(", ") || "Unknown";

        const plainBody = parsed.text || stripHtml(parsed.html) || "";
        const replyText = extractReplyText(plainBody);
        const subject = parsed.subject || "(no subject)";
        const parsedCommand = parseCommand(subject);
        const isReply = subject.toLowerCase().startsWith("re:");

        const email = {
          uid: message.uid,
          seq: message.seq,
          date: parsed.date || message.envelope?.date,
          from: fromAddr,
          subject,
          body: plainBody.substring(0, 5000), // Cap at 5KB for display
          replyText,
          parsedCommand,
          isReply,
          flags: message.flags,
          isRead: message.flags?.has("\\Seen") || false,
        };

        email.priority = classifyPriority(email);
        emails.push(email);
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("IMAP Error:", err.message);
    try { await client.logout(); } catch {}
  }

  // Most recent first
  return emails.reverse();
}

/**
 * Fetches only unread emails from INBOX.
 */
async function getUnread() {
  const client = createClient();
  const emails = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for unseen messages
      const unseenUids = await client.search({ seen: false });

      if (unseenUids.length === 0) {
        console.log("No unread emails.");
        return emails;
      }

      for await (const message of client.fetch(unseenUids, {
        envelope: true,
        source: true,
        uid: true,
        flags: true,
      }, { uid: true })) {
        const parsed = await simpleParser(message.source);

        const fromAddr =
          parsed.from?.value?.map((a) => `${a.name || ""} <${a.address}>`).join(", ") || "Unknown";

        const plainBody = parsed.text || stripHtml(parsed.html) || "";
        const replyText = extractReplyText(plainBody);
        const subject = parsed.subject || "(no subject)";
        const parsedCommand = parseCommand(subject);
        const isReply = subject.toLowerCase().startsWith("re:");

        const email = {
          uid: message.uid,
          date: parsed.date || message.envelope?.date,
          from: fromAddr,
          subject,
          body: plainBody.substring(0, 5000),
          replyText,
          parsedCommand,
          isReply,
          flags: message.flags,
          isRead: false,
        };

        email.priority = classifyPriority(email);
        emails.push(email);
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("IMAP Error:", err.message);
    try { await client.logout(); } catch {}
  }

  return emails.reverse();
}

/**
 * Finds emails that are replies (subject starts with "Re:").
 * Useful for detecting founder replies to Palace Intel briefings.
 */
async function findReplies(count = 20) {
  const allEmails = await checkInbox(count);
  return allEmails.filter((e) => e.isReply);
}

/**
 * Finds emails with @ prefix commands per D13.
 * Parses the command and identifies the target agent.
 */
async function findCommands(count = 20) {
  const allEmails = await checkInbox(count);
  return allEmails.filter((e) => e.parsedCommand?.isCommand);
}

/**
 * Marks a specific email as read by UID.
 */
async function markAsRead(uid) {
  const client = createClient();

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      await client.messageFlagsAdd({ uid: [uid] }, ["\\Seen"], { uid: true });
      console.log(`Email UID ${uid} marked as read.`);
    } finally {
      lock.release();
    }

    await client.logout();
    return true;
  } catch (err) {
    console.error("Failed to mark as read:", err.message);
    try { await client.logout(); } catch {}
    return false;
  }
}

/**
 * Marks a specific email as unread by UID.
 */
async function markAsUnread(uid) {
  const client = createClient();

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      await client.messageFlagsRemove({ uid: [uid] }, ["\\Seen"], { uid: true });
      console.log(`Email UID ${uid} marked as unread.`);
    } finally {
      lock.release();
    }

    await client.logout();
    return true;
  } catch (err) {
    console.error("Failed to mark as unread:", err.message);
    try { await client.logout(); } catch {}
    return false;
  }
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  P0: "\x1b[31m", // Red
  P1: "\x1b[33m", // Yellow
  P2: "\x1b[36m", // Cyan
  P3: "\x1b[90m", // Gray
};
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function formatEmail(email, index, verbose = true) {
  const color = PRIORITY_COLORS[email.priority] || RESET;
  const readIndicator = email.isRead ? `${DIM}[READ]${RESET}` : `${BOLD}[NEW]${RESET}`;
  const dateStr = email.date ? new Date(email.date).toLocaleString() : "Unknown date";

  let output = `\n${color}━━━ ${email.priority} ━━━${RESET} ${readIndicator} #${index + 1} (UID: ${email.uid})\n`;
  output += `  ${BOLD}Date:${RESET}    ${dateStr}\n`;
  output += `  ${BOLD}From:${RESET}    ${email.from}\n`;
  output += `  ${BOLD}Subject:${RESET} ${email.subject}\n`;

  if (email.parsedCommand?.isCommand) {
    output += `  ${BOLD}\x1b[35mCOMMAND:${RESET} @${email.parsedCommand.agent} → ${email.parsedCommand.command}\n`;
    if (email.parsedCommand.warning) {
      output += `  ${BOLD}\x1b[31mWARNING:${RESET} ${email.parsedCommand.warning}\n`;
    }
  }

  if (email.isReply) {
    output += `  ${BOLD}\x1b[32mREPLY DETECTED${RESET}\n`;
    if (email.replyText && verbose) {
      output += `  ${BOLD}Founder's Reply:${RESET}\n`;
      const replyLines = email.replyText.split("\n").slice(0, 10);
      for (const line of replyLines) {
        output += `    │ ${line}\n`;
      }
      if (email.replyText.split("\n").length > 10) {
        output += `    │ ... (${email.replyText.split("\n").length - 10} more lines)\n`;
      }
    }
  }

  if (verbose && !email.isReply) {
    const bodyPreview = email.body.split("\n").slice(0, 8).join("\n");
    if (bodyPreview.trim()) {
      output += `  ${BOLD}Body Preview:${RESET}\n`;
      for (const line of bodyPreview.split("\n")) {
        output += `    │ ${line}\n`;
      }
    }
  }

  return output;
}

function printEmailList(emails, title) {
  console.log(`\n${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║  ${title.padEnd(56)}║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}`);
  console.log(`  Found: ${emails.length} email(s)\n`);

  if (emails.length === 0) {
    console.log("  (none)\n");
    return;
  }

  for (let i = 0; i < emails.length; i++) {
    console.log(formatEmail(emails[i], i));
  }

  // Summary
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const e of emails) counts[e.priority]++;
  const unread = emails.filter((e) => !e.isRead).length;

  console.log(`\n${BOLD}Summary:${RESET} ${unread} unread | P0:${counts.P0} P1:${counts.P1} P2:${counts.P2} P3:${counts.P3}`);
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "--check";

  console.log(`${BOLD}Palace Inbox Manager${RESET} — Three-Headed Monster Operations`);
  console.log(`${DIM}Connecting to imap.gmail.com:993...${RESET}\n`);

  switch (command) {
    case "--check": {
      const count = parseInt(args[1]) || 10;
      const emails = await checkInbox(count);
      printEmailList(emails, `INBOX — Latest ${count} Emails`);
      break;
    }

    case "--unread": {
      const emails = await getUnread();
      printEmailList(emails, "UNREAD EMAILS");
      break;
    }

    case "--commands": {
      const emails = await findCommands(30);
      printEmailList(emails, "@ COMMANDS (D13 Protocol)");
      break;
    }

    case "--replies": {
      const emails = await findReplies(30);
      printEmailList(emails, "FOUNDER REPLIES");
      break;
    }

    case "--mark-read": {
      const uid = parseInt(args[1]);
      if (!uid) {
        console.error("Usage: node inbox-manager.mjs --mark-read <UID>");
        process.exit(1);
      }
      await markAsRead(uid);
      break;
    }

    case "--mark-unread": {
      const uid = parseInt(args[1]);
      if (!uid) {
        console.error("Usage: node inbox-manager.mjs --mark-unread <UID>");
        process.exit(1);
      }
      await markAsUnread(uid);
      break;
    }

    case "--help": {
      console.log(`
Usage: node inbox-manager.mjs [command]

Commands:
  --check [N]        Fetch latest N emails (default: 10)
  --unread           Fetch only unread emails
  --commands         Find @ prefix commands (D13 protocol)
  --replies          Find founder replies to Palace Intel
  --mark-read UID    Mark email as read by UID
  --mark-unread UID  Mark email as unread by UID
  --help             Show this help

Priority Classification:
  P0 (RED)    — @ commands, security alerts, urgent
  P1 (YELLOW) — Founder replies to Palace Intel
  P2 (CYAN)   — Regular correspondence
  P3 (GRAY)   — Informational, newsletters
      `);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      console.log('Use --help for usage information.');
      process.exit(1);
    }
  }
}

// ─── Exported API (for use by other Palace scripts) ──────────────────────────

export {
  checkInbox,
  getUnread,
  findReplies,
  findCommands,
  markAsRead,
  markAsUnread,
  parseCommand,
  classifyPriority,
  extractReplyText,
  stripHtml,
};

// Run CLI
main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
