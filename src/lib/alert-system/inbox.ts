/**
 * Inbound email reader for Three-Headed Monster command system.
 * Connects to Gmail via IMAP, reads UNSEEN messages, and parses
 * @AGENT commands from subject lines and email body text.
 *
 * Required env vars:
 *   ALERT_EMAIL_USER  — Gmail address (3headedm@gmail.com)
 *   ALERT_EMAIL_PASS  — Gmail App Password
 */

import Imap from "imap";
import { simpleParser, type ParsedMail } from "mailparser";

export type AgentTarget = "chaos" | "stone" | "cardinal" | "rush" | "wiz";

export interface ParsedCommand {
  agent: AgentTarget;
  command: string;
  from: string;
  subject: string;
  timestamp: Date;
  messageId: string;
  uid: number;
}

export interface InboxMessage {
  from: string;
  subject: string;
  timestamp: Date;
  messageId: string;
  uid: number;
  isCommand: boolean;
  parsedCommand?: ParsedCommand;
  /** Plain text body (for reply parsing — stripped of quoted text) */
  textBody?: string;
}

export interface InboxResult {
  success: boolean;
  messages: InboxMessage[];
  commands: ParsedCommand[];
  error?: string;
}

const AGENT_PATTERN = /^@(CHAOS|STONES?|CARDINAL|RUSH|WIZ)\b\s*(.*)/i;

/** Map raw matched name to canonical AgentTarget (handles aliases like STONES → stone) */
function normalizeAgentName(raw: string): AgentTarget {
  const lower = raw.toLowerCase();
  if (lower === "stones") return "stone";
  return lower as AgentTarget;
}

function parseSubjectForCommand(
  subject: string,
  from: string,
  timestamp: Date,
  messageId: string,
  uid: number
): ParsedCommand | null {
  const trimmed = subject.trim();
  const match = trimmed.match(AGENT_PATTERN);
  if (!match) return null;

  const agent = normalizeAgentName(match[1]);
  const command = match[2].trim();

  return {
    agent,
    command: command || "(no command body)",
    from,
    subject: trimmed,
    timestamp,
    messageId,
    uid,
  };
}

/**
 * Scan the plain-text email body for an @AGENT command.
 * Checks each line for the AGENT_PATTERN (not anchored to start-of-subject,
 * but anchored to start-of-line so we don't match mid-sentence mentions).
 */
const BODY_AGENT_PATTERN = /(?:^|\n)\s*@(CHAOS|STONES?|CARDINAL|RUSH|WIZ)\b\s*(.*)/i;

function parseBodyForCommand(
  body: string,
  from: string,
  subject: string,
  timestamp: Date,
  messageId: string,
  uid: number
): ParsedCommand | null {
  const match = body.match(BODY_AGENT_PATTERN);
  if (!match) return null;

  const agent = normalizeAgentName(match[1]);
  const command = match[2].trim();

  return {
    agent,
    command: command || "(no command body)",
    from,
    subject,
    timestamp,
    messageId,
    uid,
  };
}

function getImapConfig(): Imap.Config {
  const user = process.env.ALERT_EMAIL_USER;
  const password = process.env.ALERT_EMAIL_PASS;

  if (!user || !password) {
    throw new Error("Missing ALERT_EMAIL_USER or ALERT_EMAIL_PASS env vars");
  }

  return {
    user,
    password,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  };
}

/**
 * Connect to Gmail IMAP, read all UNSEEN messages from INBOX,
 * parse @AGENT commands from subjects, mark processed as SEEN.
 */
export async function checkInbox(): Promise<InboxResult> {
  return new Promise((resolve) => {
    const messages: InboxMessage[] = [];
    const commands: ParsedCommand[] = [];

    let imap: Imap;
    try {
      imap = new Imap(getImapConfig());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      resolve({ success: false, messages: [], commands: [], error: msg });
      return;
    }

    const timeout = setTimeout(() => {
      try { imap.end(); } catch { /* ignore */ }
      resolve({
        success: false,
        messages,
        commands,
        error: "IMAP connection timed out after 30s",
      });
    }, 30_000);

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, _box) => {
        if (err) {
          clearTimeout(timeout);
          try { imap.end(); } catch { /* ignore */ }
          resolve({
            success: false,
            messages,
            commands,
            error: `Failed to open INBOX: ${err.message}`,
          });
          return;
        }

        imap.search(["UNSEEN"], (searchErr, uids) => {
          if (searchErr) {
            clearTimeout(timeout);
            try { imap.end(); } catch { /* ignore */ }
            resolve({
              success: false,
              messages,
              commands,
              error: `IMAP search failed: ${searchErr.message}`,
            });
            return;
          }

          if (!uids || uids.length === 0) {
            clearTimeout(timeout);
            try { imap.end(); } catch { /* ignore */ }
            resolve({ success: true, messages: [], commands: [] });
            return;
          }

          const fetch = imap.fetch(uids, { bodies: "", markSeen: true });
          let pending = uids.length;

          fetch.on("message", (msg, seqno) => {
            let uid = seqno;
            const chunks: Buffer[] = [];

            msg.on("attributes", (attrs) => {
              uid = attrs.uid ?? seqno;
            });

            msg.on("body", (stream) => {
              stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            });

            msg.once("end", async () => {
              try {
                const raw = Buffer.concat(chunks);
                const parsed: ParsedMail = await simpleParser(raw);

                const from =
                  parsed.from?.text ?? parsed.from?.value?.[0]?.address ?? "unknown";
                const subject = parsed.subject ?? "(no subject)";
                const timestamp = parsed.date ?? new Date();
                const messageId = parsed.messageId ?? `uid-${uid}`;

                // Try subject first, then fall back to body
                let cmd = parseSubjectForCommand(
                  subject,
                  from,
                  timestamp,
                  messageId,
                  uid
                );

                // Extract plain text body (first part before quoted reply)
                let textBody = parsed.text ?? "";
                // Strip quoted reply sections (lines starting with >)
                const replyIdx = textBody.indexOf("\nOn ");
                if (replyIdx > 0) textBody = textBody.slice(0, replyIdx);
                const quoteIdx = textBody.indexOf("\n>");
                if (quoteIdx > 0) textBody = textBody.slice(0, quoteIdx);
                textBody = textBody.trim();

                if (!cmd && parsed.text) {
                  cmd = parseBodyForCommand(
                    parsed.text,
                    from,
                    subject,
                    timestamp,
                    messageId,
                    uid
                  );
                }

                const inboxMsg: InboxMessage = {
                  from,
                  subject,
                  timestamp,
                  messageId,
                  uid,
                  isCommand: !!cmd,
                  parsedCommand: cmd ?? undefined,
                  textBody: textBody || undefined,
                };

                messages.push(inboxMsg);
                if (cmd) commands.push(cmd);
              } catch (parseErr) {
                console.error(
                  `[inbox] Failed to parse message seqno=${seqno}:`,
                  parseErr
                );
              }

              pending--;
              if (pending === 0) {
                clearTimeout(timeout);
                try { imap.end(); } catch { /* ignore */ }
                resolve({ success: true, messages, commands });
              }
            });
          });

          fetch.once("error", (fetchErr) => {
            clearTimeout(timeout);
            try { imap.end(); } catch { /* ignore */ }
            resolve({
              success: false,
              messages,
              commands,
              error: `Fetch error: ${fetchErr.message}`,
            });
          });
        });
      });
    });

    imap.once("error", (imapErr: Error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        messages,
        commands,
        error: `IMAP error: ${imapErr.message}`,
      });
    });

    imap.connect();
  });
}
