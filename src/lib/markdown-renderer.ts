// ---------------------------------------------------------------------------
// Lightweight markdown → HTML renderer with XSS sanitization
//
// The project already includes `react-markdown` and `react-syntax-highlighter`
// for React component rendering. This module provides a *plain string*
// renderer for contexts where you need raw HTML (e.g. server-side email
// templates, RSS feeds, plain innerHTML injection with sanitized output).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CodeBlock {
  /** Language identifier from the fenced code block (empty string if none) */
  language: string;
  /** Raw code content (no surrounding backticks / fences) */
  code: string;
  /** Approximate 0-based line offset in the original markdown source */
  startLine: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a markdown string to sanitized HTML.
 *
 * Supports: headings (h1-h6), bold, italic, fenced & inline code, links,
 * unordered / ordered lists, tables, blockquotes, horizontal rules, images,
 * and line breaks.
 *
 * All output is sanitized — `<script>`, event-handler attributes, and
 * dangerous protocols are stripped.
 */
export function renderMarkdown(content: string): string {
  if (!content) return "";

  let html = content;

  // --- Pass 1: Protect fenced code blocks from further processing ----------
  const codeBlockPlaceholders: string[] = [];
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang: string, code: string) => {
      const escaped = escapeHtml(code.trimEnd());
      const langClass = lang ? ` class="language-${sanitizeAttr(lang)}"` : "";
      const rendered = `<pre><code${langClass}>${escaped}</code></pre>`;
      const idx = codeBlockPlaceholders.length;
      codeBlockPlaceholders.push(rendered);
      return `\x00CODEBLOCK_${idx}\x00`;
    },
  );

  // --- Pass 2: Inline code (protect from further transforms) ---------------
  const inlinePlaceholders: string[] = [];
  html = html.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    const rendered = `<code>${escapeHtml(code)}</code>`;
    const idx = inlinePlaceholders.length;
    inlinePlaceholders.push(rendered);
    return `\x00INLINE_${idx}\x00`;
  });

  // --- Blockquotes ---------------------------------------------------------
  html = html.replace(/^(>{1,})\s?(.*)/gm, (_match, arrows: string, text: string) => {
    const depth = arrows.length;
    const open = "<blockquote>".repeat(depth);
    const close = "</blockquote>".repeat(depth);
    return `${open}<p>${text}</p>${close}`;
  });

  // --- Headings (ATX style) ------------------------------------------------
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // --- Horizontal rule -----------------------------------------------------
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, "<hr />");

  // --- Bold & italic -------------------------------------------------------
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // --- Strikethrough -------------------------------------------------------
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // --- Images (must come before links) -------------------------------------
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_match, alt: string, src: string) => {
      const safeSrc = sanitizeUrl(src);
      const safeAlt = escapeHtml(alt);
      return `<img src="${safeSrc}" alt="${safeAlt}" />`;
    },
  );

  // --- Links ---------------------------------------------------------------
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text: string, href: string) => {
      const safeHref = sanitizeUrl(href);
      return `<a href="${safeHref}" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
    },
  );

  // --- Tables --------------------------------------------------------------
  html = renderTables(html);

  // --- Unordered lists -----------------------------------------------------
  html = renderLists(html, /^[ \t]*[-*+]\s+(.+)$/gm, "ul");

  // --- Ordered lists -------------------------------------------------------
  html = renderLists(html, /^[ \t]*\d+\.\s+(.+)$/gm, "ol");

  // --- Paragraphs (blank-line separated blocks) ----------------------------
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap blocks that are already block-level elements
      if (/^<(?:h[1-6]|ul|ol|li|blockquote|pre|hr|table|div|p)/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  // --- Line breaks (two trailing spaces or backslash) ----------------------
  html = html.replace(/ {2,}\n/g, "<br />\n");
  html = html.replace(/\\\n/g, "<br />\n");

  // --- Restore placeholders ------------------------------------------------
  for (let i = 0; i < codeBlockPlaceholders.length; i++) {
    html = html.replace(`\x00CODEBLOCK_${i}\x00`, codeBlockPlaceholders[i]);
  }
  for (let i = 0; i < inlinePlaceholders.length; i++) {
    html = html.replace(`\x00INLINE_${i}\x00`, inlinePlaceholders[i]);
  }

  // --- Final sanitization pass — strip anything dangerous ------------------
  html = sanitizeHtml(html);

  return html.trim();
}

/**
 * Extract all fenced code blocks from a markdown string.
 */
export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const beforeMatch = content.slice(0, match.index);
    const startLine = beforeMatch.split("\n").length - 1;

    blocks.push({
      language: match[1] || "",
      code: match[2].trimEnd(),
      startLine,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Internal: Table rendering
// ---------------------------------------------------------------------------

function renderTables(html: string): string {
  const lines = html.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    // Detect a table: current line has pipes AND next line is a separator row
    if (
      i + 1 < lines.length &&
      lines[i].includes("|") &&
      /^\|?[\s:]*-{3,}[\s:]*(\|[\s:]*-{3,}[\s:]*)*\|?\s*$/.test(lines[i + 1])
    ) {
      const headerCells = parsePipeLine(lines[i]);
      const alignments = parseAlignmentRow(lines[i + 1]);

      let tableHtml = "<table><thead><tr>";
      for (let c = 0; c < headerCells.length; c++) {
        const align = alignments[c] ? ` style="text-align:${alignments[c]}"` : "";
        tableHtml += `<th${align}>${headerCells[c].trim()}</th>`;
      }
      tableHtml += "</tr></thead><tbody>";

      i += 2; // skip header + separator

      while (i < lines.length && lines[i].includes("|")) {
        const cells = parsePipeLine(lines[i]);
        tableHtml += "<tr>";
        for (let c = 0; c < cells.length; c++) {
          const align = alignments[c] ? ` style="text-align:${alignments[c]}"` : "";
          tableHtml += `<td${align}>${cells[c].trim()}</td>`;
        }
        tableHtml += "</tr>";
        i++;
      }

      tableHtml += "</tbody></table>";
      result.push(tableHtml);
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join("\n");
}

function parsePipeLine(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseAlignmentRow(line: string): (string | null)[] {
  return parsePipeLine(line).map((cell) => {
    const trimmed = cell.trim();
    const left = trimmed.startsWith(":");
    const right = trimmed.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
  });
}

// ---------------------------------------------------------------------------
// Internal: List rendering
// ---------------------------------------------------------------------------

function renderLists(
  html: string,
  pattern: RegExp,
  tag: "ul" | "ol",
): string {
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const match = line.match(
      tag === "ul" ? /^[ \t]*[-*+]\s+(.+)$/ : /^[ \t]*\d+\.\s+(.+)$/,
    );

    if (match) {
      if (!inList) {
        result.push(`<${tag}>`);
        inList = true;
      }
      result.push(`<li>${match[1]}</li>`);
    } else {
      if (inList) {
        result.push(`</${tag}>`);
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    result.push(`</${tag}>`);
  }

  return result.join("\n");
}

// ---------------------------------------------------------------------------
// Sanitization helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeAttr(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Block dangerous protocols
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return "#";
  }
  return escapeHtml(trimmed);
}

/**
 * Final-pass sanitizer — removes script tags, event handlers, and other
 * dangerous HTML constructs from the rendered output.
 */
function sanitizeHtml(html: string): string {
  // Strip <script> tags and content
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Strip event handler attributes (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Strip <iframe>, <object>, <embed>, <form>, <input>, <style> tags
  clean = clean.replace(
    /<\/?(iframe|object|embed|form|input|style|link|meta|base)\b[^>]*>/gi,
    "",
  );

  // Strip javascript: in any remaining href/src attributes
  clean = clean.replace(
    /(href|src)\s*=\s*["']?\s*javascript:/gi,
    '$1="#"',
  );

  return clean;
}
