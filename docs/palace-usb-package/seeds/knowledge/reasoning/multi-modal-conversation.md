# Multi-Modal Conversation Patterns for AI Agents

## Seed Classification
- **Domain**: Agent UX / Content Rendering
- **Applies to**: All 42 user-facing Stone AI agents, chat interface, content pipeline
- **Priority**: High — modern AI must handle more than plain text
- **Last Updated**: 2026-03-09

---

## 1. Beyond Text: The Multi-Modal Imperative

A text-only AI agent is a 1990s chatbot with better language skills. Users today expect to paste images, share code, upload files, and receive rich responses — tables, charts, syntax-highlighted code, formatted markdown, and interactive elements.

Stone AI's conversation interface must handle multiple content types seamlessly. The user should never have to think about what format to use. They paste, type, or upload — and the agent figures out what to do with it.

### Content Types in Stone AI Conversations

```typescript
type ContentType =
  | 'text'           // Plain text messages
  | 'markdown'       // Rich formatted text
  | 'code'           // Source code with language detection
  | 'image'          // User-uploaded images
  | 'file'           // Documents, CSVs, PDFs
  | 'table'          // Structured tabular data
  | 'list'           // Ordered/unordered lists
  | 'math'           // Mathematical expressions
  | 'diagram'        // Mermaid/PlantUML diagrams
  | 'diff'           // Code diffs (additions/removals)
  | 'error'          // Error messages with stack traces
  | 'terminal'       // Terminal/command output
  | 'quote'          // Cited text from sources
  | 'callout'        // Warnings, tips, notes
  | 'link_preview'   // URL previews with metadata
  ;
```

---

## 2. Rich Response Formatting

### 2.1 Markdown Rendering Pipeline

All agent responses are processed through a markdown rendering pipeline:

```typescript
interface MarkdownConfig {
  // Core markdown features
  headings: true;
  bold: true;
  italic: true;
  strikethrough: true;
  links: true;
  images: true;

  // Extended features
  tables: true;
  taskLists: true;
  footnotes: true;
  abbreviations: true;

  // Code features
  inlineCode: true;
  codeBlocks: true;
  syntaxHighlighting: true;
  lineNumbers: true;         // For code blocks > 5 lines
  copyButton: true;          // One-click copy for code blocks

  // Math features
  inlineMath: true;          // $equation$
  blockMath: true;           // $$equation$$

  // Diagram features
  mermaid: true;             // ```mermaid blocks

  // Safety
  sanitizeHtml: true;        // Strip any raw HTML
  maxImageSize: '10MB';
  allowedImageTypes: ['png', 'jpeg', 'webp', 'gif'];
}
```

### 2.2 Syntax Highlighting

Code blocks are the most common rich content type. Every code block must have:

```typescript
interface CodeBlockConfig {
  // Language detection
  autoDetect: true;          // Detect language if not specified
  supportedLanguages: [
    'typescript', 'javascript', 'python', 'rust', 'go',
    'java', 'csharp', 'cpp', 'ruby', 'php', 'swift',
    'kotlin', 'sql', 'html', 'css', 'scss', 'bash',
    'powershell', 'yaml', 'json', 'toml', 'xml',
    'markdown', 'dockerfile', 'graphql', 'prisma',
  ];

  // Display features
  lineNumbers: boolean;       // Show for blocks > 5 lines
  highlightLines: number[];   // Highlight specific lines (for emphasis)
  maxHeight: '500px';         // Scroll for long blocks
  wordWrap: false;            // Horizontal scroll for long lines
  copyButton: true;           // Always show copy button
  languageLabel: true;        // Show detected/specified language

  // Interaction
  expandable: boolean;        // Collapse long blocks with expand button
  collapseThreshold: 30;      // Lines before auto-collapse
}
```

**Implementation with Shiki/Prism**:

```typescript
import { codeToHtml } from 'shiki';

async function renderCodeBlock(
  code: string,
  language: string,
  options: Partial<CodeBlockConfig> = {}
): Promise<string> {
  const detectedLang = language || await detectLanguage(code);

  const html = await codeToHtml(code, {
    lang: detectedLang,
    theme: 'one-dark-pro', // Dark theme for Stone AI
    transformers: [
      {
        line(node, line) {
          // Add line numbers
          node.properties['data-line'] = line;
          // Highlight specific lines
          if (options.highlightLines?.includes(line)) {
            node.properties.class = 'highlighted-line';
          }
        },
      },
    ],
  });

  const lineCount = code.split('\n').length;
  const isCollapsible = lineCount > (options.collapseThreshold || 30);

  return `
    <div class="code-block" data-language="${detectedLang}">
      <div class="code-header">
        <span class="code-language">${detectedLang}</span>
        <button class="code-copy" onclick="copyCode(this)">Copy</button>
      </div>
      <div class="code-content ${isCollapsible ? 'collapsed' : ''}">
        ${html}
      </div>
      ${isCollapsible ? '<button class="code-expand">Show all ' + lineCount + ' lines</button>' : ''}
    </div>
  `;
}
```

### 2.3 Table Rendering

Agents frequently need to present data in tables:

```typescript
interface TableConfig {
  // Rendering
  striped: true;              // Alternating row colors
  hoverable: true;            // Row highlight on hover
  responsive: true;           // Horizontal scroll on mobile
  sortable: false;            // Client-side sorting (future)
  maxRows: 100;               // Truncate with "show more" after 100

  // Formatting
  alignNumbers: 'right';      // Right-align numeric columns
  formatCurrency: true;       // Auto-format $ amounts
  formatDates: true;          // Auto-format dates
  truncateText: 50;           // Truncate cell text at 50 chars
}

// Agent response with table:
const tableExample = `
| Plan | Price | Agents | Bestie |
|------|-------|--------|--------|
| FREE | $0 | 4 | No |
| STARTER | $19.99/mo | 16 | Yes |
| PLUS | $49.99/mo | 30 | Yes |
| SMART | $99.99/mo | 39 | Yes |
| PRO | $200/mo | 42 | Yes |
`;
```

### 2.4 Mathematical Expression Rendering

For agents handling math, data science, or education:

```typescript
// Inline math: $E = mc^2$
// Block math: $$\int_{a}^{b} f(x) \, dx$$

import katex from 'katex';

function renderMath(expression: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      errorColor: '#ef4444',
      trust: false, // No arbitrary HTML in math
      strict: 'warn',
    });
  } catch (error) {
    return `<span class="math-error">${escapeHtml(expression)}</span>`;
  }
}
```

### 2.5 Diagram Rendering

Mermaid diagrams for flowcharts, sequence diagrams, and architecture:

```typescript
import mermaid from 'mermaid';

const mermaidConfig = {
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366f1',      // Stone AI brand indigo
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#818cf8',
    lineColor: '#94a3b8',
    secondaryColor: '#1e1b4b',
    tertiaryColor: '#312e81',
  },
  securityLevel: 'strict', // No click handlers or scripts
  maxTextSize: 50000,
};

// Example agent response with diagram:
const diagramExample = `
Here's how the agent routing works:

\`\`\`mermaid
graph TD
    A[User Message] --> B{Intent Classification}
    B -->|Writing| C[Agent #1-6]
    B -->|Code| D[Agent #20-25]
    B -->|Research| E[Agent #15-19]
    B -->|Design| F[Agent #7-10]
    B -->|Unclear| G[Ask Clarifying Question]
    G --> A
\`\`\`
`;
```

---

## 3. Input Handling: What Users Send

### 3.1 Code Paste Detection

When a user pastes content, the system must detect if it is code:

```typescript
async function detectPastedContent(
  text: string
): Promise<{ type: 'text' | 'code' | 'error' | 'data'; language?: string }> {
  // Check for code patterns
  const codeSignals = {
    hasIndentation: /^\s{2,}/m.test(text),
    hasBrackets: /[{}()\[\]]/.test(text),
    hasSemicolons: /;\s*$/m.test(text),
    hasKeywords: /\b(function|class|const|let|var|import|export|if|else|return|async|await)\b/.test(text),
    hasArrows: /=>/.test(text),
    hasComments: /\/\/|\/\*|#\s/.test(text),
  };

  const codeScore = Object.values(codeSignals).filter(Boolean).length;

  // Check for error/stack trace
  const errorSignals = {
    hasErrorKeyword: /\b(Error|Exception|FATAL|WARN|Traceback)\b/.test(text),
    hasStackTrace: /at\s+\w+\s+\(/.test(text) || /File\s+".*",\s+line\s+\d+/.test(text),
    hasLineNumbers: /:\d+:\d+/.test(text),
  };

  const errorScore = Object.values(errorSignals).filter(Boolean).length;

  // Check for structured data
  const dataSignals = {
    isJson: isValidJson(text),
    isCsv: /^[^,\n]+,[^,\n]+(,[^,\n]+)*\n/m.test(text),
    isYaml: /^[\w-]+:\s+/m.test(text) && !codeSignals.hasBrackets,
  };

  if (errorScore >= 2) {
    return { type: 'error' };
  }
  if (codeScore >= 3) {
    const language = await detectLanguage(text);
    return { type: 'code', language };
  }
  if (dataSignals.isJson) return { type: 'data', language: 'json' };
  if (dataSignals.isCsv) return { type: 'data', language: 'csv' };

  return { type: 'text' };
}
```

### 3.2 Image Input Handling

```typescript
interface ImageInput {
  // Supported input methods
  methods: [
    'file_upload',     // Traditional file picker
    'paste',           // Ctrl+V image paste
    'drag_drop',       // Drag image into chat
    'url',             // Paste image URL
  ];

  // Processing pipeline
  pipeline: {
    validate: {
      maxSize: 10 * 1024 * 1024,  // 10MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      maxDimensions: { width: 4096, height: 4096 },
    };
    compress: {
      targetSize: 2 * 1024 * 1024, // Compress to 2MB for processing
      quality: 0.85,
      format: 'webp',
    };
    analyze: {
      // What the AI can do with images
      describe: true,    // Describe what's in the image
      ocr: true,         // Extract text from screenshots
      codeFromScreenshot: true, // Extract code from code screenshots
      compareImages: true, // Compare two images
    };
  };
}
```

**Image Upload Component**:

```typescript
// React component for image handling in chat
function ImageUploadHandler({ onImageReady }: Props) {
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) processImage(file);
      }
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        processImage(file);
      }
    }
  }, []);

  async function processImage(file: File) {
    // Validate
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    // Compress if needed
    let processed = file;
    if (file.size > 2 * 1024 * 1024) {
      processed = await compressImage(file, { quality: 0.85, format: 'webp' });
    }

    // Create preview
    const preview = URL.createObjectURL(processed);

    // Convert to base64 for API
    const base64 = await fileToBase64(processed);

    onImageReady({ file: processed, preview, base64, type: file.type });
  }

  return null; // Event handlers attached to chat input container
}
```

### 3.3 File Upload Handling

```typescript
interface FileUploadConfig {
  allowedTypes: {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    spreadsheets: ['.csv', '.xlsx', '.xls', '.tsv'],
    code: ['.js', '.ts', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.rb', '.php'],
    config: ['.json', '.yaml', '.yml', '.toml', '.xml', '.env.example'],
    data: ['.sql', '.graphql', '.prisma'],
  };

  maxFileSize: 25 * 1024 * 1024; // 25MB
  maxFilesPerMessage: 5;

  processing: {
    pdf: 'extract_text_and_images';
    csv: 'parse_to_table';
    code: 'syntax_highlight_and_analyze';
    json: 'pretty_print_and_validate';
  };
}

async function processFileUpload(
  file: File
): Promise<ProcessedFile> {
  const extension = getExtension(file.name);

  switch (extension) {
    case '.pdf':
      return {
        type: 'document',
        content: await extractPdfText(file),
        pageCount: await getPdfPageCount(file),
        preview: `PDF: ${file.name} (${formatSize(file.size)}, ${await getPdfPageCount(file)} pages)`,
      };

    case '.csv':
    case '.tsv':
      const parsed = await parseCsv(file);
      return {
        type: 'data',
        content: parsed,
        rowCount: parsed.length,
        columns: Object.keys(parsed[0] || {}),
        preview: `Data: ${file.name} (${parsed.length} rows, ${Object.keys(parsed[0] || {}).length} columns)`,
      };

    case '.json':
      const json = await file.text();
      const validated = validateJson(json);
      return {
        type: 'data',
        content: validated.parsed,
        valid: validated.valid,
        preview: `JSON: ${file.name} (${validated.valid ? 'valid' : 'invalid'})`,
      };

    default:
      // Code and text files
      const text = await file.text();
      const language = detectLanguageFromExtension(extension);
      return {
        type: 'code',
        content: text,
        language,
        lineCount: text.split('\n').length,
        preview: `${language}: ${file.name} (${text.split('\n').length} lines)`,
      };
  }
}
```

---

## 4. Response Formatting Strategies

### 4.1 Content-Aware Response Formatting

The agent chooses the best format based on what it is communicating:

```typescript
type ResponseFormat = {
  // When explaining a concept
  explanation: 'prose with headings, bullet points for key takeaways';

  // When showing code
  code: 'syntax-highlighted code block with language label and copy button';

  // When comparing options
  comparison: 'table with columns for each option';

  // When listing steps
  procedure: 'numbered list with code blocks for each step';

  // When showing data
  data: 'table for structured data, code block for raw data';

  // When showing a process
  process: 'mermaid diagram or numbered steps';

  // When correcting an error
  errorFix: 'error highlight + fix with diff format';

  // When summarizing
  summary: 'bullet points with bold key terms';
};
```

### 4.2 The Diff Format for Code Changes

When an agent suggests code changes, diffs are more readable than full blocks:

```typescript
function formatCodeDiff(
  original: string,
  modified: string,
  language: string
): string {
  const diff = createDiff(original, modified);

  return `
\`\`\`diff
${diff.map(line => {
  if (line.type === 'add') return `+ ${line.content}`;
  if (line.type === 'remove') return `- ${line.content}`;
  return `  ${line.content}`;
}).join('\n')}
\`\`\`
  `;
}

// Example output:
// ```diff
// - const result = await fetch(url);
// + const result = await fetch(url, {
// +   headers: { 'Content-Type': 'application/json' },
// +   signal: AbortSignal.timeout(5000),
// + });
// ```
```

### 4.3 Callout Boxes

For important information that should stand out:

```typescript
type CalloutType = 'info' | 'warning' | 'error' | 'tip' | 'note';

function formatCallout(type: CalloutType, content: string): string {
  const prefixes = {
    info: '> **Info**',
    warning: '> **Warning**',
    error: '> **Error**',
    tip: '> **Tip**',
    note: '> **Note**',
  };

  return `${prefixes[type]}\n> ${content.split('\n').join('\n> ')}`;
}

// Renders as:
// > **Warning**
// > This will delete all user data. Make sure you have a backup
// > before proceeding.
```

---

## 5. Mobile-Specific Formatting

### 5.1 Responsive Content Rules

```typescript
const mobileFormatRules = {
  // Code blocks
  code: {
    maxWidth: '100vw',
    horizontalScroll: true,
    fontSize: '13px',       // Slightly smaller on mobile
    lineNumbers: false,     // Disable on mobile to save space
    collapseThreshold: 15,  // Collapse sooner on mobile
  },

  // Tables
  tables: {
    maxColumns: 4,           // Collapse to card layout above 4 columns
    horizontalScroll: true,
    fontSize: '13px',
    stickyFirstColumn: true, // First column stays visible during scroll
  },

  // Images
  images: {
    maxWidth: '100%',
    lazyLoad: true,
    tapToExpand: true,       // Tap to view full size
  },

  // General
  maxLineLength: 80,         // Wrap earlier on mobile
  preferBullets: true,       // Bullets over paragraphs
  shorterResponses: true,    // Trim verbose explanations
};
```

### 5.2 Adaptive Content Length

```typescript
function adaptContentForDevice(
  content: string,
  device: 'mobile' | 'tablet' | 'desktop'
): string {
  if (device === 'desktop') return content;

  if (device === 'mobile') {
    // Shorten long explanations
    const sections = splitIntoSections(content);
    return sections.map(section => {
      if (section.type === 'prose' && section.wordCount > 100) {
        return summarizeSection(section, { maxWords: 60 });
      }
      return section.content;
    }).join('\n\n');
  }

  return content; // Tablet gets full content
}
```

---

## 6. Streaming Response Rendering

### 6.1 Progressive Rendering

Agent responses stream token-by-token. The UI must render progressively:

```typescript
class StreamingRenderer {
  private buffer = '';
  private renderedContent: RenderedBlock[] = [];
  private inCodeBlock = false;
  private codeBlockBuffer = '';
  private codeBlockLanguage = '';

  processChunk(chunk: string): RenderUpdate {
    this.buffer += chunk;
    const updates: RenderUpdate[] = [];

    // Check for code block boundaries
    const codeBlockStart = this.buffer.match(/```(\w*)\n/);
    const codeBlockEnd = this.buffer.match(/\n```\s*\n/);

    if (codeBlockStart && !this.inCodeBlock) {
      // Render everything before the code block as markdown
      const before = this.buffer.substring(0, codeBlockStart.index);
      if (before.trim()) {
        updates.push({ type: 'markdown', content: before });
      }

      this.inCodeBlock = true;
      this.codeBlockLanguage = codeBlockStart[1] || 'text';
      this.codeBlockBuffer = '';
      this.buffer = this.buffer.substring(
        codeBlockStart.index! + codeBlockStart[0].length
      );
    }

    if (this.inCodeBlock) {
      if (codeBlockEnd) {
        // Code block complete — render with syntax highlighting
        this.codeBlockBuffer += this.buffer.substring(0, codeBlockEnd.index);
        updates.push({
          type: 'code',
          content: this.codeBlockBuffer,
          language: this.codeBlockLanguage,
          complete: true,
        });
        this.inCodeBlock = false;
        this.buffer = this.buffer.substring(
          codeBlockEnd.index! + codeBlockEnd[0].length
        );
      } else {
        // Still in code block — render raw (no highlighting until complete)
        this.codeBlockBuffer += chunk;
        updates.push({
          type: 'code',
          content: this.codeBlockBuffer,
          language: this.codeBlockLanguage,
          complete: false,
        });
        this.buffer = '';
      }
    } else {
      // Regular markdown — render incrementally
      if (this.buffer.trim()) {
        updates.push({ type: 'markdown', content: this.buffer });
        // Keep last incomplete line in buffer
        const lastNewline = this.buffer.lastIndexOf('\n');
        if (lastNewline >= 0) {
          this.buffer = this.buffer.substring(lastNewline + 1);
        }
      }
    }

    return { updates };
  }
}
```

### 6.2 Streaming Code Block UX

```css
/* Code block while streaming (not yet complete) */
.code-block.streaming {
  border-left: 3px solid #6366f1;
  opacity: 0.9;
}

.code-block.streaming .code-header {
  /* Hide copy button until block is complete */
}

.code-block.streaming .code-header .code-copy {
  display: none;
}

/* Code block complete */
.code-block.complete {
  border-left: 3px solid #22c55e;
  opacity: 1;
  animation: codeComplete 0.3s ease;
}

@keyframes codeComplete {
  from { border-left-color: #6366f1; }
  to { border-left-color: #22c55e; }
}
```

---

## 7. Security Considerations

### 7.1 Content Sanitization

All rendered content must be sanitized to prevent XSS:

```typescript
import DOMPurify from 'dompurify';

const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'del', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
    'pre', 'code', 'span', 'div', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'img', 'hr', 'sup', 'sub',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'data-language',
    'data-line', 'alt', 'src', 'width', 'height',
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'style'],
};

function sanitizeRenderedContent(html: string): string {
  // Force all links to open in new tab with noopener
  const sanitized = DOMPurify.sanitize(html, sanitizeConfig);
  return sanitized.replace(
    /<a\s+href/g,
    '<a target="_blank" rel="noopener noreferrer" href'
  );
}
```

### 7.2 Image Security

```typescript
async function validateImageUpload(file: File): Promise<ValidationResult> {
  // Check file type via magic bytes, not just extension
  const header = await readFileHeader(file, 12);
  const detectedType = detectImageType(header);

  if (!['png', 'jpeg', 'webp', 'gif'].includes(detectedType)) {
    return { valid: false, reason: 'Invalid image type detected from file header' };
  }

  // Check for embedded scripts in SVGs (blocked entirely)
  if (detectedType === 'svg') {
    return { valid: false, reason: 'SVG uploads are not allowed for security reasons' };
  }

  // Verify image can be decoded (not a disguised file)
  try {
    const img = await createImageBitmap(file);
    if (img.width > 4096 || img.height > 4096) {
      return { valid: false, reason: 'Image dimensions exceed 4096x4096 limit' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'File could not be decoded as an image' };
  }
}
```

---

## 8. Accessibility

### 8.1 Content Accessibility Requirements

```typescript
const accessibilityRequirements = {
  images: {
    altText: 'required',      // All images must have alt text
    agentGeneratedAlt: true,  // Agent describes images it sends
    userUploadAlt: 'auto',    // System generates alt for uploads
  },

  codeBlocks: {
    ariaLabel: 'required',    // "Code block in TypeScript, 15 lines"
    keyboardNavigation: true,  // Tab into, arrow keys to navigate
    copyAnnouncement: true,    // Screen reader announces "Copied to clipboard"
  },

  tables: {
    headerRow: 'required',    // First row is always th
    ariaLabel: 'required',    // "Table: Pricing comparison, 5 rows, 4 columns"
    keyboardNavigation: true,
  },

  math: {
    ariaLabel: 'required',    // LaTeX source as fallback
    altText: 'equation',      // "Mathematical equation: E equals mc squared"
  },

  diagrams: {
    altText: 'required',      // Describe the diagram's meaning
    fallbackText: true,       // Text description for screen readers
  },

  colors: {
    contrastRatio: 4.5,       // WCAG AA minimum
    noColorOnly: true,         // Never use color as sole indicator
  },
};
```

---

## 9. Performance Optimization

### 9.1 Lazy Loading and Virtualization

```typescript
const performanceConfig = {
  // Lazy load images below the fold
  imageLazyLoading: true,

  // Virtualize long conversations (only render visible messages)
  virtualizeThreshold: 100, // After 100 messages, virtualize

  // Defer syntax highlighting for off-screen code blocks
  deferHighlighting: true,

  // Mermaid diagram rendering
  mermaidRenderOnVisible: true, // Only render when scrolled into view

  // Math rendering
  mathRenderOnVisible: true,

  // Code block limits
  maxCodeBlocksPerMessage: 10,
  maxCodeBlockSize: 50_000, // Characters — truncate with expand
};
```

### 9.2 Rendering Budget

```typescript
// Target: message renders in under 100ms
const renderingBudget = {
  markdown: 20,          // ms for markdown parsing
  syntaxHighlight: 30,   // ms per code block
  mathRender: 15,        // ms per equation
  mermaidRender: 50,     // ms per diagram
  sanitize: 10,          // ms for DOMPurify
  total: 100,            // ms total target

  // If budget exceeded, defer non-critical rendering
  deferOrder: [
    'mermaid',           // Defer diagrams first
    'math',              // Then math
    'syntax',            // Then highlighting (show plain code)
  ],
};
```

---

## 10. Production Checklist

- [ ] Markdown rendering pipeline handles all content types
- [ ] Syntax highlighting covers all 25+ languages with Shiki/Prism
- [ ] Code blocks have copy button, language label, line numbers (>5 lines)
- [ ] Table rendering is responsive with horizontal scroll on mobile
- [ ] Image uploads validated via magic bytes, not just extension
- [ ] SVG uploads blocked entirely (XSS vector)
- [ ] All rendered HTML sanitized with DOMPurify
- [ ] Streaming responses render progressively without layout shift
- [ ] Code blocks show completion state (streaming vs complete)
- [ ] Mobile formatting adapts (smaller fonts, earlier collapse, card layouts)
- [ ] Mermaid diagrams render in Stone AI dark theme
- [ ] Math expressions render via KaTeX with error handling
- [ ] All content types have ARIA labels and screen reader support
- [ ] Paste detection correctly identifies code vs text vs data
- [ ] File upload supports PDF, CSV, code files with preview
- [ ] Performance budget: message renders in under 100ms
- [ ] Virtualization activates for conversations over 100 messages
