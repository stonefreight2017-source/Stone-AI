# RAG Multimodal Retrieval

## Purpose
Real-world knowledge is not just text. It includes images (diagrams, charts, screenshots), tables (structured data), and code blocks (implementation details). A RAG system that only retrieves text paragraphs misses critical information. This seed covers multi-modal embedding strategies, CLIP embeddings, document layout analysis, OCR integration, and retrieval patterns for images, tables, and code alongside text.

---

## The Multimodal RAG Architecture

```
Document Ingestion:
  PDF/HTML/Markdown → Layout Analysis → Segment by type
    ├── Text blocks     → Text embeddings   → Vector store
    ├── Images/diagrams → CLIP embeddings   → Vector store
    ├── Tables          → Table embeddings  → Vector store (+ structured store)
    └── Code blocks     → Code embeddings   → Vector store

Query Time:
  Query → Multi-modal query embedding
    ├── Text vector search    → Text chunks
    ├── Image vector search   → Relevant images
    ├── Table search          → Relevant tables
    └── Code search           → Relevant code snippets
        ↓
  Fusion + Ranking → Context assembly → LLM
```

---

## Document Layout Analysis

### Segmenting Documents by Content Type

```typescript
interface DocumentSegment {
  type: 'text' | 'image' | 'table' | 'code' | 'heading' | 'list';
  content: string;           // Text content or description
  rawContent?: string;       // Original format (markdown table, code with syntax)
  imageUrl?: string;         // For images: URL or base64
  boundingBox?: { x: number; y: number; width: number; height: number };
  pageNumber?: number;
  order: number;             // Position in document
  metadata: Record<string, string>;
}

// Markdown document segmentation
function segmentMarkdown(markdown: string): DocumentSegment[] {
  const segments: DocumentSegment[] = [];
  let order = 0;

  // Split into blocks
  const lines = markdown.split('\n');
  let currentBlock: string[] = [];
  let currentType: DocumentSegment['type'] = 'text';
  let inCodeBlock = false;
  let codeLang = '';
  let inTable = false;

  for (const line of lines) {
    // Code block detection
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        segments.push({
          type: 'code',
          content: currentBlock.join('\n'),
          rawContent: `\`\`\`${codeLang}\n${currentBlock.join('\n')}\n\`\`\``,
          order: order++,
          metadata: { language: codeLang },
        });
        currentBlock = [];
        inCodeBlock = false;
      } else {
        // Start code block — flush current text
        if (currentBlock.length > 0) {
          segments.push({
            type: currentType,
            content: currentBlock.join('\n'),
            order: order++,
            metadata: {},
          });
          currentBlock = [];
        }
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      currentBlock.push(line);
      continue;
    }

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        // Flush current text
        if (currentBlock.length > 0) {
          segments.push({
            type: currentType,
            content: currentBlock.join('\n'),
            order: order++,
            metadata: {},
          });
          currentBlock = [];
        }
        inTable = true;
      }
      currentBlock.push(line);
      continue;
    } else if (inTable) {
      // End of table
      segments.push({
        type: 'table',
        content: parseTableToText(currentBlock.join('\n')),
        rawContent: currentBlock.join('\n'),
        order: order++,
        metadata: {},
      });
      currentBlock = [];
      inTable = false;
    }

    // Heading detection
    if (line.startsWith('#')) {
      if (currentBlock.length > 0) {
        segments.push({
          type: currentType,
          content: currentBlock.join('\n'),
          order: order++,
          metadata: {},
        });
        currentBlock = [];
      }
      segments.push({
        type: 'heading',
        content: line.replace(/^#+\s*/, ''),
        order: order++,
        metadata: { level: String(line.match(/^#+/)?.[0].length ?? 1) },
      });
      continue;
    }

    // Image detection
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      if (currentBlock.length > 0) {
        segments.push({
          type: currentType,
          content: currentBlock.join('\n'),
          order: order++,
          metadata: {},
        });
        currentBlock = [];
      }
      segments.push({
        type: 'image',
        content: imgMatch[1] || 'Image',
        imageUrl: imgMatch[2],
        order: order++,
        metadata: { altText: imgMatch[1] },
      });
      continue;
    }

    currentBlock.push(line);
    currentType = 'text';
  }

  // Flush remaining
  if (currentBlock.length > 0) {
    segments.push({
      type: inTable ? 'table' : currentType,
      content: inTable
        ? parseTableToText(currentBlock.join('\n'))
        : currentBlock.join('\n'),
      rawContent: inTable ? currentBlock.join('\n') : undefined,
      order: order++,
      metadata: {},
    });
  }

  return segments;
}

function parseTableToText(markdownTable: string): string {
  const rows = markdownTable
    .split('\n')
    .filter((r) => !r.match(/^\s*\|[-:]+/)) // Remove separator rows
    .map((r) =>
      r
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
    );

  if (rows.length === 0) return markdownTable;

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) =>
      row.map((cell, i) => `${headers[i] || 'Column ' + i}: ${cell}`).join(', ')
    )
    .join('. ');
}
```

---

## Multi-Modal Embedding Strategies

### Strategy 1: Unified Embedding Space (CLIP-like)

```typescript
// Using CLIP for image+text in same embedding space
interface MultiModalEmbedding {
  vector: number[];
  modality: 'text' | 'image';
  sourceId: string;
}

async function embedWithCLIP(
  input: string | Buffer,
  modality: 'text' | 'image',
  endpoint: string = 'http://localhost:8081/embed'
): Promise<number[]> {
  const body =
    modality === 'text'
      ? { text: input, modality: 'text' }
      : { image: (input as Buffer).toString('base64'), modality: 'image' };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data.embedding;
}

// Cross-modal search: text query → find relevant images
async function searchImages(
  textQuery: string,
  pool: any,
  clipEndpoint: string,
  topK: number = 5
): Promise<Array<{ imageUrl: string; score: number; caption: string }>> {
  const queryEmbedding = await embedWithCLIP(textQuery, 'text', clipEndpoint);

  const result = await pool.query(
    `SELECT image_url, caption,
            1 - (clip_embedding <=> $1::vector) as score
     FROM image_chunks
     ORDER BY clip_embedding <=> $1::vector
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), topK]
  );

  return result.rows;
}
```

### Strategy 2: Caption-Based (No CLIP Required)

```typescript
// Convert images to text descriptions, then embed as text
async function captionImage(
  imageUrl: string,
  llmEndpoint: string
): Promise<string> {
  // Use a vision-capable LLM to describe the image
  const prompt = `Describe this image in detail. Include:
- What type of image it is (diagram, chart, screenshot, photo)
- All text visible in the image
- Key data points if it's a chart/graph
- Layout and relationships if it's a diagram
- Colors, sizes, and spatial relationships

Be specific and thorough — this description will be used for search retrieval.`;

  const response = await fetch(llmEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Ingestion pipeline with captioning
async function ingestImageForRAG(
  imageUrl: string,
  documentId: string,
  position: number,
  llmEndpoint: string,
  embeddingEndpoint: string,
  pool: any
): Promise<void> {
  // Generate detailed caption
  const caption = await captionImage(imageUrl, llmEndpoint);

  // Embed the caption as text
  const embedding = await getTextEmbedding(caption, embeddingEndpoint);

  await pool.query(
    `INSERT INTO image_chunks (document_id, image_url, caption, embedding, position)
     VALUES ($1, $2, $3, $4::vector, $5)`,
    [documentId, imageUrl, caption, JSON.stringify(embedding), position]
  );
}
```

### Strategy 3: Specialized Code Embeddings

```typescript
// Code benefits from specialized embeddings that understand syntax
async function embedCode(
  code: string,
  language: string,
  embeddingEndpoint: string
): Promise<number[]> {
  // Preprocess: add language context and strip comments for embedding
  const processed = `Language: ${language}\n${code}`;

  // Use a code-specialized embedding model if available
  const response = await fetch(embeddingEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: processed,
      model: 'code-embedding-model', // e.g., voyage-code-2, or your local model
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

// For code search, also extract and index function signatures
function extractCodeSignatures(code: string, language: string): string[] {
  const signatures: string[] = [];

  if (language === 'typescript' || language === 'javascript') {
    // Match function declarations, arrow functions, class methods
    const patterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g,
      /(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g,
      /interface\s+(\w+)\s*\{/g,
      /type\s+(\w+)\s*=/g,
      /class\s+(\w+)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        signatures.push(match[0]);
      }
    }
  }

  if (language === 'python') {
    const patterns = [
      /def\s+(\w+)\s*\([^)]*\)/g,
      /class\s+(\w+)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        signatures.push(match[0]);
      }
    }
  }

  return signatures;
}
```

---

## OCR Integration

### When You Need OCR
- Scanned PDFs (no text layer)
- Screenshots with text
- Handwritten notes
- Images of whiteboards

```typescript
interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
}

// Using Tesseract.js (runs in Node.js)
async function performOCR(imagePath: string): Promise<OCRResult> {
  const Tesseract = await import('tesseract.js');

  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: () => {}, // suppress logs
  });

  return {
    text: result.data.text,
    confidence: result.data.confidence / 100,
    blocks: result.data.blocks?.map((block: any) => ({
      text: block.text,
      boundingBox: block.bbox,
      confidence: block.confidence / 100,
    })) || [],
  };
}

// OCR + embedding pipeline
async function ingestScannedDocument(
  imagePath: string,
  documentId: string,
  embeddingEndpoint: string,
  pool: any
): Promise<void> {
  const ocrResult = await performOCR(imagePath);

  if (ocrResult.confidence < 0.5) {
    console.warn(`Low OCR confidence (${ocrResult.confidence}) for ${imagePath}`);
    // Fall back to image captioning if OCR is unreliable
    return;
  }

  const embedding = await getTextEmbedding(ocrResult.text, embeddingEndpoint);

  await pool.query(
    `INSERT INTO document_chunks (document_id, content, content_type, embedding, metadata)
     VALUES ($1, $2, 'ocr_text', $3::vector, $4)`,
    [documentId, ocrResult.text, JSON.stringify(embedding),
     JSON.stringify({ ocrConfidence: ocrResult.confidence, source: imagePath })]
  );
}
```

---

## Table Retrieval Strategies

### Tables Need Special Treatment

```typescript
// Strategy 1: Linearize tables into natural language
function linearizeTable(
  headers: string[],
  rows: string[][],
  tableName?: string
): string {
  const lines: string[] = [];
  if (tableName) lines.push(`Table: ${tableName}`);

  for (const row of rows) {
    const pairs = row.map((cell, i) => `${headers[i]}: ${cell}`);
    lines.push(pairs.join(', '));
  }

  return lines.join('\n');
}

// Strategy 2: SQL-ready table storage for structured queries
async function ingestTable(
  headers: string[],
  rows: string[][],
  tableName: string,
  sourceDocId: string,
  embeddingEndpoint: string,
  pool: any
): Promise<void> {
  // Store the linearized version for semantic search
  const linearized = linearizeTable(headers, rows, tableName);
  const embedding = await getTextEmbedding(linearized, embeddingEndpoint);

  await pool.query(
    `INSERT INTO document_chunks (document_id, content, content_type, embedding, metadata)
     VALUES ($1, $2, 'table', $3::vector, $4)`,
    [sourceDocId, linearized, JSON.stringify(embedding),
     JSON.stringify({ tableName, headers, rowCount: rows.length })]
  );

  // Also store structured data for SQL-like queries
  await pool.query(
    `INSERT INTO structured_tables (document_id, table_name, headers, data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (document_id, table_name) DO UPDATE SET
       headers = $3, data = $4`,
    [sourceDocId, tableName, JSON.stringify(headers), JSON.stringify(rows)]
  );
}

// Strategy 3: Row-level embedding for large tables
async function ingestTableByRow(
  headers: string[],
  rows: string[][],
  tableName: string,
  sourceDocId: string,
  embeddingEndpoint: string,
  pool: any
): Promise<void> {
  // For large tables (100+ rows), embed each row separately
  for (let i = 0; i < rows.length; i++) {
    const rowText = rows[i]
      .map((cell, j) => `${headers[j]}: ${cell}`)
      .join(', ');

    const contextualRow = `From table "${tableName}": ${rowText}`;
    const embedding = await getTextEmbedding(contextualRow, embeddingEndpoint);

    await pool.query(
      `INSERT INTO document_chunks (document_id, content, content_type, embedding, metadata)
       VALUES ($1, $2, 'table_row', $3::vector, $4)`,
      [sourceDocId, contextualRow, JSON.stringify(embedding),
       JSON.stringify({ tableName, rowIndex: i })]
    );
  }
}
```

---

## Unified Multimodal Query Pipeline

```typescript
interface MultiModalResult {
  textChunks: Array<{ content: string; score: number }>;
  images: Array<{ url: string; caption: string; score: number }>;
  tables: Array<{ content: string; rawTable?: string; score: number }>;
  codeBlocks: Array<{ content: string; language: string; score: number }>;
}

async function multiModalSearch(
  query: string,
  pool: any,
  embeddingEndpoint: string,
  config: {
    textTopK: number;
    imageTopK: number;
    tableTopK: number;
    codeTopK: number;
  }
): Promise<MultiModalResult> {
  const queryEmbedding = await getTextEmbedding(query, embeddingEndpoint);
  const embeddingStr = JSON.stringify(queryEmbedding);

  // Run all searches in parallel
  const [textResults, imageResults, tableResults, codeResults] = await Promise.all([
    pool.query(
      `SELECT content, 1 - (embedding <=> $1::vector) as score
       FROM document_chunks WHERE content_type = 'text'
       ORDER BY embedding <=> $1::vector LIMIT $2`,
      [embeddingStr, config.textTopK]
    ),
    pool.query(
      `SELECT image_url as url, caption, 1 - (embedding <=> $1::vector) as score
       FROM image_chunks
       ORDER BY embedding <=> $1::vector LIMIT $2`,
      [embeddingStr, config.imageTopK]
    ),
    pool.query(
      `SELECT content, metadata->>'rawTable' as raw_table,
              1 - (embedding <=> $1::vector) as score
       FROM document_chunks WHERE content_type IN ('table', 'table_row')
       ORDER BY embedding <=> $1::vector LIMIT $2`,
      [embeddingStr, config.tableTopK]
    ),
    pool.query(
      `SELECT content, metadata->>'language' as language,
              1 - (embedding <=> $1::vector) as score
       FROM document_chunks WHERE content_type = 'code'
       ORDER BY embedding <=> $1::vector LIMIT $2`,
      [embeddingStr, config.codeTopK]
    ),
  ]);

  return {
    textChunks: textResults.rows,
    images: imageResults.rows,
    tables: tableResults.rows.map((r: any) => ({
      content: r.content,
      rawTable: r.raw_table,
      score: r.score,
    })),
    codeBlocks: codeResults.rows,
  };
}

// Assemble multimodal context for LLM
function assembleMultiModalContext(results: MultiModalResult): string {
  const sections: string[] = [];

  if (results.textChunks.length > 0) {
    sections.push('TEXT CONTEXT:\n' +
      results.textChunks.map((c) => c.content).join('\n---\n'));
  }

  if (results.tables.length > 0) {
    sections.push('TABLE DATA:\n' +
      results.tables.map((t) => t.rawTable || t.content).join('\n---\n'));
  }

  if (results.codeBlocks.length > 0) {
    sections.push('CODE EXAMPLES:\n' +
      results.codeBlocks.map((c) =>
        `\`\`\`${c.language}\n${c.content}\n\`\`\``
      ).join('\n'));
  }

  if (results.images.length > 0) {
    sections.push('RELEVANT IMAGES:\n' +
      results.images.map((img) =>
        `[Image: ${img.caption}] (${img.url})`
      ).join('\n'));
  }

  return sections.join('\n\n');
}
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| Ignoring images entirely | Diagrams often contain the answer text doesn't | Caption + embed images |
| Embedding raw table markdown | `|---|---|` is noise for embeddings | Linearize tables to natural language |
| Same embedding model for code and text | Code has different semantics | Use code-specialized embeddings |
| OCR without confidence check | Low-quality OCR adds garbage to index | Threshold at 0.5+ confidence |
| Treating all modalities equally | Some queries are text-only, some need diagrams | Route by query intent |
| Huge images in context window | Images eat token budget | Use captions, not raw images for text LLMs |

---

## Key Takeaways

- Multi-modal RAG requires type-aware ingestion: segment first, then embed with appropriate strategy
- Caption-based image retrieval works without CLIP and is easier to deploy
- Tables need linearization for embedding and optionally structured storage for exact lookups
- Code blocks benefit from specialized embeddings and signature extraction
- OCR extends RAG to scanned documents but needs confidence gating
- Assemble multi-modal context with clear section labels so the LLM knows what each piece is
