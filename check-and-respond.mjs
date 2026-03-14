import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const CREDS = { user: "3headedm@gmail.com", pass: "xlscicjddqyqcjiu" };

const transporter = nodemailer.createTransport({ service: "gmail", auth: CREDS });

async function checkForReplies() {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: CREDS,
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    const messages = [];
    // Get last 10 messages
    const totalMessages = client.mailbox.exists;
    const startSeq = Math.max(1, totalMessages - 9);
    
    for await (const msg of client.fetch(`${startSeq}:*`, { envelope: true, source: true })) {
      const parsed = await simpleParser(msg.source);
      messages.push({
        uid: msg.uid,
        date: msg.envelope.date,
        from: msg.envelope.from?.[0]?.address || "unknown",
        subject: msg.envelope.subject || "(no subject)",
        text: parsed.text || "",
        html: parsed.html || "",
        isReply: (msg.envelope.subject || "").startsWith("Re:"),
        inReplyTo: msg.envelope.inReplyTo,
      });
    }

    // Find founder replies (Re: subjects that aren't from Palace system emails)
    const replies = messages.filter(m => m.isReply);
    
    console.log(`\n=== INBOX CHECK: ${new Date().toISOString()} ===`);
    console.log(`Total scanned: ${messages.length}`);
    console.log(`Replies found: ${replies.length}\n`);

    for (const r of replies) {
      console.log(`REPLY FOUND:`);
      console.log(`  Date: ${r.date}`);
      console.log(`  Subject: ${r.subject}`);
      console.log(`  Body: ${r.text.substring(0, 500)}`);
      console.log(`---`);
    }

    return replies;
  } finally {
    lock.release();
    await client.logout();
  }
}

async function sendAcknowledgment(originalSubject, founderMessage, actionTaken) {
  const subject = `Re: ${originalSubject.replace(/^Re:\s*/i, "")}`;
  
  const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a2e); padding: 16px; border-radius: 12px 12px 0 0;">
    <h2 style="color: #ffd700; margin: 0; font-size: 18px;">Executive Inbox Manager — Action Confirmed</h2>
  </div>
  <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0;">
    <h3 style="color: #333; border-bottom: 2px solid #ffd700; padding-bottom: 6px;">Your Directive</h3>
    <blockquote style="background: #f8f8f0; padding: 12px; border-left: 4px solid #ffd700; margin: 12px 0; font-style: italic;">
      ${founderMessage}
    </blockquote>
    
    <h3 style="color: #333; border-bottom: 2px solid #ffd700; padding-bottom: 6px;">Action Taken</h3>
    <p>${actionTaken}</p>
    
    <p style="color: #666; font-size: 12px; margin-top: 20px;">
      Status: <strong style="color: #2e7d32;">COMPLETED</strong> | Processed: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
    </p>
  </div>
  <div style="background: #0a0a0a; padding: 12px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; margin: 0; font-size: 11px;">Executive Inbox Manager — Three-Headed Monster — Palace Intelligence Division</p>
  </div>
</div>`;

  const info = await transporter.sendMail({
    from: '"Executive Inbox Manager" <3headedm@gmail.com>',
    to: "3headedm@gmail.com",
    subject,
    html,
  });
  
  console.log(`\nACKNOWLEDGMENT SENT: ${info.messageId}`);
  return info;
}

// Main execution
const replies = await checkForReplies();

if (replies.length === 0) {
  console.log("No founder replies found yet. Run again to check.");
} else {
  console.log(`\nProcessing ${replies.length} replies...`);
  for (const r of replies) {
    // Extract just the founder's reply text (before quoted content)
    const founderText = r.text.split(/On .* wrote:/)[0].trim() || r.text.substring(0, 300);
    console.log(`\nFOUNDER DIRECTIVE: "${founderText}"`);
  }
}
