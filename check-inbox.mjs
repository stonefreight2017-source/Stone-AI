import { ImapFlow } from 'imapflow';

const client = new ImapFlow({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: {
    user: '3headedm@gmail.com',
    pass: 'xlscicjddqyqcjiu'
  },
  logger: false
});

const FOUNDER_INDICATORS = ['stonefreight', 'stone', 'founder'];
const COMMAND_PATTERN = /^@\w+/i;

function isFromFounder(from) {
  if (!from) return false;
  const lower = from.toLowerCase();
  return FOUNDER_INDICATORS.some(ind => lower.includes(ind));
}

function isReply(subject) {
  return subject && /^re:/i.test(subject.trim());
}

function isCommand(subject) {
  if (!subject) return false;
  const cleaned = subject.replace(/^re:\s*/i, '').trim();
  return COMMAND_PATTERN.test(cleaned) || cleaned.startsWith('@');
}

async function main() {
  console.log('=== PALACE INBOX READER ===');
  console.log('Connecting to 3headedm@gmail.com via IMAP...\n');

  await client.connect();
  console.log('Connected.\n');

  const lock = await client.getMailboxLock('INBOX');

  try {
    const status = await client.status('INBOX', { messages: true });
    const total = status.messages;
    console.log(`Total messages in INBOX: ${total}\n`);

    if (total === 0) {
      console.log('No messages found.');
      return;
    }

    // Fetch the 5 most recent
    const startSeq = Math.max(1, total - 4);
    const range = `${startSeq}:${total}`;

    const emails = [];

    for await (const msg of client.fetch(range, {
      envelope: true,
      source: true
    })) {
      const envelope = msg.envelope;
      const from = envelope.from?.map(a => `${a.name || ''} <${a.address}>`).join(', ') || 'Unknown';
      const subject = envelope.subject || '(no subject)';
      const date = envelope.date ? new Date(envelope.date).toLocaleString() : 'Unknown';

      // Extract text body from raw source
      let body = '';
      if (msg.source) {
        const raw = msg.source.toString();
        // Try to extract text body - look for the text content after headers
        const parts = raw.split(/\r?\n\r?\n/);
        if (parts.length > 1) {
          // Get everything after headers
          let bodyRaw = parts.slice(1).join('\n\n');

          // Handle multipart - try to find text/plain part
          const boundaryMatch = raw.match(/boundary="?([^"\r\n;]+)"?/i);
          if (boundaryMatch) {
            const boundary = boundaryMatch[1];
            const sections = bodyRaw.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
            for (const section of sections) {
              if (section.toLowerCase().includes('text/plain')) {
                const sectionParts = section.split(/\r?\n\r?\n/);
                if (sectionParts.length > 1) {
                  body = sectionParts.slice(1).join('\n\n').trim();
                  // Handle base64
                  if (section.toLowerCase().includes('base64')) {
                    try { body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8'); } catch {}
                  }
                  // Handle quoted-printable
                  if (section.toLowerCase().includes('quoted-printable')) {
                    body = body.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                  }
                  break;
                }
              }
            }
            // If no text/plain found, try text/html
            if (!body) {
              for (const section of sections) {
                if (section.toLowerCase().includes('text/html')) {
                  const sectionParts = section.split(/\r?\n\r?\n/);
                  if (sectionParts.length > 1) {
                    body = sectionParts.slice(1).join('\n\n').trim();
                    if (section.toLowerCase().includes('base64')) {
                      try { body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8'); } catch {}
                    }
                    if (section.toLowerCase().includes('quoted-printable')) {
                      body = body.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                    }
                    // Strip HTML tags for readability
                    body = body.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
                    break;
                  }
                }
              }
            }
          } else {
            // No multipart, just use body directly
            body = bodyRaw.trim();
            // Check for base64/QP in headers
            if (raw.toLowerCase().includes('content-transfer-encoding: base64')) {
              try { body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8'); } catch {}
            }
            if (raw.toLowerCase().includes('content-transfer-encoding: quoted-printable')) {
              body = body.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
            }
          }
        }
      }

      emails.push({ from, subject, date, body, seq: msg.seq });
    }

    // Print newest first
    emails.reverse();

    console.log('─'.repeat(70));
    console.log(' 5 MOST RECENT EMAILS (newest first)');
    console.log('─'.repeat(70));

    for (const email of emails) {
      const reply = isReply(email.subject);
      const founderEmail = isFromFounder(email.from);
      const command = isCommand(email.subject);

      let flags = [];
      if (reply) flags.push('REPLY');
      if (founderEmail) flags.push('FOUNDER');
      if (command) flags.push('COMMAND/DIRECTIVE');

      const highlight = (reply && founderEmail) || command;

      if (highlight) {
        console.log('\n' + '★'.repeat(70));
        console.log('★  FOUNDER REPLY / COMMAND DETECTED');
        console.log('★'.repeat(70));
      } else {
        console.log('\n' + '─'.repeat(70));
      }

      console.log(`  Date:    ${email.date}`);
      console.log(`  From:    ${email.from}`);
      console.log(`  Subject: ${email.subject}`);
      if (flags.length) console.log(`  Flags:   [${flags.join('] [')}]`);
      console.log(`  Body:`);
      console.log(`  ${'-'.repeat(40)}`);
      const bodyLines = (email.body || '(empty)').split('\n');
      for (const line of bodyLines.slice(0, 50)) {
        console.log(`  ${line}`);
      }
      if (bodyLines.length > 50) console.log(`  ... (${bodyLines.length - 50} more lines)`);
      console.log(`  ${'-'.repeat(40)}`);
    }

    console.log('\n' + '─'.repeat(70));
    console.log('Done. Checked 5 most recent emails.');

  } finally {
    lock.release();
    await client.logout();
    console.log('Disconnected.\n');
  }
}

main().catch(err => {
  console.error('IMAP ERROR:', err.message);
  process.exit(1);
});
