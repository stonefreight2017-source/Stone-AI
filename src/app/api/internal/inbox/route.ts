/**
 * Internal inbox check endpoint for Three-Headed Monster.
 * GET /api/internal/inbox
 *
 * Secured by INTERNAL_ALERT_SECRET header.
 * Reads UNSEEN emails from Gmail IMAP, parses @AGENT commands,
 * routes them to agent queues, and sends confirmation replies.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkInbox } from "@/lib/alert-system/inbox";
import { routeCommands } from "@/lib/alert-system/command-router";
import { sendFounderAlert } from "@/lib/alert-system/send";
import { AlertAgent, AlertPriority, AlertType } from "@/lib/alert-system/types";

export async function GET(req: NextRequest) {
  // Auth: require internal secret
  const secret = req.headers.get("x-alert-secret");
  const expected = process.env.INTERNAL_ALERT_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check inbox
  const inboxResult = await checkInbox();

  if (!inboxResult.success) {
    return NextResponse.json(
      {
        error: "Inbox check failed",
        detail: inboxResult.error,
        messagesRead: inboxResult.messages.length,
      },
      { status: 500 }
    );
  }

  // Route commands
  const { routed, summary } = routeCommands(inboxResult.commands);

  // Send confirmation reply for each command found
  for (const cmd of routed) {
    const agentEnum =
      cmd.agent === "chaos"
        ? AlertAgent.CHAOS
        : cmd.agent === "stone"
          ? AlertAgent.STONE
          : AlertAgent.CARDINAL;

    await sendFounderAlert(
      {
        agent: agentEnum,
        priority: AlertPriority.P3,
        alertType: AlertType.HEALTH_CHECK,
        title: `Command Received: @${cmd.agent.toUpperCase()}`,
        body: `Received: @${cmd.agent.toUpperCase()} ${cmd.command} -- queued for execution.\n\nFrom: ${cmd.from}\nTimestamp: ${cmd.timestamp.toISOString()}`,
        metadata: {
          originalSubject: cmd.subject,
          messageId: cmd.messageId,
          queuedAt: new Date().toISOString(),
        },
      },
      0 // No cooldown on command confirmations
    );
  }

  return NextResponse.json(
    {
      success: true,
      totalMessages: inboxResult.messages.length,
      commandsFound: inboxResult.commands.length,
      routed: summary,
      messages: inboxResult.messages.map((m) => ({
        from: m.from,
        subject: m.subject,
        timestamp: m.timestamp,
        isCommand: m.isCommand,
        agent: m.parsedCommand?.agent ?? null,
        command: m.parsedCommand?.command ?? null,
      })),
    },
    { status: 200 }
  );
}
