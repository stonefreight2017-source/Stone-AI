/**
 * Step 1: Remove 7 agents that will be merged.
 * - smma → into Digital Marketing Strategist
 * - social-media-management → into Digital Marketing Strategist
 * - paid-ads → into Digital Marketing Strategist
 * - youtube-automation → into Video Content Strategist
 * - youtube-video-editor → into Video Content Strategist
 * - short-form-content → into Video Content Strategist
 * - enterprise-sales-advisor → knowledge into Sales Agent (not user-facing)
 */
import { readFileSync, writeFileSync } from "fs";

const FILE = "src/lib/agent-definitions.ts";
let lines = readFileSync(FILE, "utf-8").split("\n");

const SLUGS_TO_REMOVE = [
  "smma",
  "social-media-management",
  "paid-ads",
  "youtube-automation",
  "youtube-video-editor",
  "short-form-content",
  "enterprise-sales-advisor",
];

function removeAgent(lines, slug) {
  // Find the line with this slug
  const slugIdx = lines.findIndex(l => l.includes(`slug: "${slug}",`));
  if (slugIdx === -1) {
    console.log(`  WARNING: slug "${slug}" not found, skipping`);
    return lines;
  }

  // Search backward for the opening `  {` (2-space indent)
  let start = slugIdx;
  while (start > 0) {
    start--;
    if (/^  \{/.test(lines[start])) break;
  }

  // Search forward from start for the closing `  },` (2-space indent)
  // Use bracket depth counting (only counting lines that start at 2-space indent)
  let end = -1;
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    // Count all { and } in the line
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0) {
      end = i;
      break;
    }
  }

  if (end === -1) {
    console.log(`  WARNING: could not find closing for "${slug}", skipping`);
    return lines;
  }

  const removedCount = end - start + 1;
  console.log(`  Removing "${slug}": lines ${start + 1}-${end + 1} (${removedCount} lines)`);

  // Remove the agent block
  lines.splice(start, removedCount);

  // Clean up any trailing blank line
  if (start < lines.length && lines[start].trim() === '') {
    lines.splice(start, 1);
  }

  return lines;
}

const originalCount = lines.length;

for (const slug of SLUGS_TO_REMOVE) {
  console.log(`Processing: ${slug}`);
  lines = removeAgent(lines, slug);
}

writeFileSync(FILE, lines.join("\n"), "utf-8");
console.log(`\nOriginal: ${originalCount} lines`);
console.log(`New: ${lines.length} lines`);
console.log(`Removed: ${originalCount - lines.length} lines`);
