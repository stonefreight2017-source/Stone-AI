/**
 * File parsing module for Stone AI file upload & analysis.
 *
 * Extracts text content from uploaded files for injection into agent context.
 * Supports: PDF, DOCX, CSV, TXT, and image metadata extraction.
 *
 * Dependencies required (add to package.json if missing):
 *   - pdf-parse
 *   - mammoth
 *
 * IMPORTANT: This module does NOT persist files. All parsing is in-memory.
 */

import type { Tier } from "@/lib/tier-config";

// ═══ Types ═══

export interface ParsedFile {
  text: string;
  metadata: {
    pages?: number;
    words: number;
    format: string;
    filename: string;
    originalSize: number;
    truncated: boolean;
  };
}

export interface UploadValidation {
  valid: boolean;
  error?: string;
}

// ═══ Tier-based limits ═══

/** Max file size in bytes per tier */
const MAX_FILE_SIZE: Record<Tier, number> = {
  FREE: 0,           // No upload for free tier
  STARTER: 5_242_880,   // 5 MB
  PLUS: 10_485_760,     // 10 MB
  SMART: 26_214_400,    // 25 MB
  PRO: 52_428_800,      // 50 MB
};

/** Max extracted text length (characters) per tier */
const MAX_CONTEXT_LENGTH: Record<Tier, number> = {
  FREE: 0,
  STARTER: 2_000,
  PLUS: 5_000,
  SMART: 10_000,
  PRO: 20_000,
};

/** Allowed MIME types for upload */
const ALLOWED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
  // Images (metadata extraction only — OCR requires vision model)
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** Human-readable format names */
const FORMAT_NAMES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/csv": "CSV",
  "text/plain": "TXT",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "image/gif": "GIF",
};

// ═══ Validation ═══

/**
 * Validate a file upload against tier restrictions.
 * Checks: tier access, file size, and MIME type.
 */
export function validateUpload(
  fileSize: number,
  mimeType: string,
  tier: Tier
): UploadValidation {
  // FREE tier cannot upload
  if (tier === "FREE") {
    return {
      valid: false,
      error: "File upload is not available on the Free plan. Upgrade to Builder or higher to upload files.",
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${mimeType}. Supported formats: PDF, DOCX, CSV, TXT, PNG, JPEG, WebP, GIF.`,
    };
  }

  // Check file size
  const maxSize = MAX_FILE_SIZE[tier];
  if (fileSize > maxSize) {
    const maxMB = Math.round(maxSize / 1_048_576);
    const fileMB = (fileSize / 1_048_576).toFixed(1);
    return {
      valid: false,
      error: `File too large (${fileMB} MB). Your plan allows up to ${maxMB} MB per file.`,
    };
  }

  return { valid: true };
}

// ═══ Parsing ═══

/**
 * Parse a file buffer and extract text content.
 * Returns extracted text truncated to the tier's context limit.
 *
 * @param buffer - Raw file bytes
 * @param mimeType - MIME type of the file
 * @param filename - Original filename
 * @param tier - User's subscription tier (controls text truncation)
 */
export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  tier: Tier
): Promise<ParsedFile> {
  const format = FORMAT_NAMES[mimeType] ?? mimeType;
  const maxLength = MAX_CONTEXT_LENGTH[tier] || MAX_CONTEXT_LENGTH.STARTER;

  try {
    let rawText = "";
    let pages: number | undefined;

    switch (mimeType) {
      case "application/pdf":
        ({ text: rawText, pages } = await parsePDF(buffer));
        break;

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        rawText = await parseDOCX(buffer);
        break;

      case "text/csv":
        rawText = parseCSV(buffer);
        break;

      case "text/plain":
        rawText = buffer.toString("utf-8");
        break;

      default:
        if (mimeType.startsWith("image/")) {
          rawText = extractImageMetadata(buffer, mimeType, filename);
        } else {
          return {
            text: "",
            metadata: {
              format,
              filename,
              words: 0,
              originalSize: buffer.length,
              truncated: false,
            },
          };
        }
    }

    // Normalize whitespace
    rawText = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

    // Truncate to tier limit
    const truncated = rawText.length > maxLength;
    const text = truncated ? rawText.slice(0, maxLength) : rawText;

    // Word count on the full text (before truncation)
    const words = rawText.split(/\s+/).filter(Boolean).length;

    return {
      text,
      metadata: {
        pages,
        words,
        format,
        filename,
        originalSize: buffer.length,
        truncated,
      },
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown parsing error";
    return {
      text: `[Error parsing file "${filename}": ${errorMessage}]`,
      metadata: {
        format,
        filename,
        words: 0,
        originalSize: buffer.length,
        truncated: false,
      },
    };
  }
}

// ═══ Format-specific parsers ═══

async function parsePDF(
  buffer: Buffer
): Promise<{ text: string; pages: number }> {
  // pdf-parse must be installed: npm install pdf-parse
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer, {
    // Limit to prevent DoS on huge PDFs
    max: 500, // max pages
  });
  return {
    text: data.text,
    pages: data.numpages,
  };
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  // mammoth must be installed: npm install mammoth
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseCSV(buffer: Buffer): string {
  // Manual CSV parsing — no external dependency needed.
  // Converts CSV to a readable table-like text format for LLM context.
  const raw = buffer.toString("utf-8").trim();
  const lines = raw.split("\n");

  if (lines.length === 0) return "";

  // Parse each line respecting quoted fields
  const rows = lines.map((line) => parseCSVLine(line));

  if (rows.length === 0) return "";

  // Format as "Row N: col1=val1, col2=val2, ..." for LLM readability
  const headers = rows[0];
  if (rows.length === 1) {
    return `Headers: ${headers.join(", ")}`;
  }

  const output: string[] = [`Headers: ${headers.join(", ")}`];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const pairs = headers
      .map((h, j) => `${h}=${row[j] ?? ""}`)
      .join(", ");
    output.push(`Row ${i}: ${pairs}`);
  }

  return output.join("\n");
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function extractImageMetadata(
  buffer: Buffer,
  mimeType: string,
  filename: string
): string {
  // Basic image metadata extraction without external dependencies.
  // Full OCR would require the vision model (vLLM port 8001).
  const sizeMB = (buffer.length / 1_048_576).toFixed(2);
  const format = FORMAT_NAMES[mimeType] ?? mimeType;

  const lines: string[] = [
    `[Image File: ${filename}]`,
    `Format: ${format}`,
    `Size: ${sizeMB} MB`,
  ];

  // Try to extract basic dimensions from PNG header
  if (mimeType === "image/png" && buffer.length >= 24) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && width < 100_000 && height > 0 && height < 100_000) {
      lines.push(`Dimensions: ${width}x${height}`);
    }
  }

  // Try to extract JPEG dimensions from SOF marker
  if (mimeType === "image/jpeg" && buffer.length > 2) {
    const dims = extractJpegDimensions(buffer);
    if (dims) {
      lines.push(`Dimensions: ${dims.width}x${dims.height}`);
    }
  }

  lines.push(
    "",
    "Note: This is an image file. Text content cannot be extracted without OCR.",
    "The image has been uploaded and its metadata is shown above.",
    "For image analysis, consider using the vision-enabled model."
  );

  return lines.join("\n");
}

function extractJpegDimensions(
  buffer: Buffer
): { width: number; height: number } | null {
  // Scan for SOF0/SOF2 markers (0xFF 0xC0 or 0xFF 0xC2)
  for (let i = 0; i < buffer.length - 9; i++) {
    if (
      buffer[i] === 0xff &&
      (buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc2)
    ) {
      const height = buffer.readUInt16BE(i + 5);
      const width = buffer.readUInt16BE(i + 7);
      if (
        width > 0 &&
        width < 100_000 &&
        height > 0 &&
        height < 100_000
      ) {
        return { width, height };
      }
    }
  }
  return null;
}

// ═══ Exports for use by other modules ═══

export function getMaxFileSize(tier: Tier): number {
  return MAX_FILE_SIZE[tier];
}

export function getMaxContextLength(tier: Tier): number {
  return MAX_CONTEXT_LENGTH[tier];
}

export function isFileUploadEnabled(tier: Tier): boolean {
  return tier !== "FREE";
}
