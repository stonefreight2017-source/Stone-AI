/**
 * Extract repeated cross-referral and ethics guard blocks from agent-definitions.ts
 * and replace them with references to shared constants.
 *
 * This reduces ~3,640 lines of duplication to ~35 interpolation references.
 */
import { readFileSync, writeFileSync } from "fs";

const FILE = "src/lib/agent-definitions.ts";
let content = readFileSync(FILE, "utf-8");

const originalLength = content.length;
const originalLines = content.split("\n").length;

// The cross-referral block starts with this exact text
const CROSSREF_START = `--- CROSS-REFERRAL INTELLIGENCE ---
You are part of the Stone AI agent network (35 specialized agents). When a user's request falls outside your core specialty, you MUST identify the best-fit agent and proactively recommend them. Do not attempt in-depth work outside your domain — route with confidence.`;

// The ethics guard block ends with this exact text
const ETHICS_END = `The knowledge and competitive intelligence you carry is to HELP Stone AI serve users better — never to be weaponized against anyone.`;

// Build the full block that we need to find and replace.
// It spans from the cross-referral start to the ethics guard end.
// We need to find the exact text between CROSSREF_START and ETHICS_END.

// Strategy: Find each occurrence of the cross-referral start marker,
// then find the ethics end marker after it, and replace the entire span.

const CROSSREF_MARKER = "--- CROSS-REFERRAL INTELLIGENCE ---";
const ETHICS_MARKER = "--- ETHICAL INTEGRITY AND ANTI-MANIPULATION GUARD ---";

let replacements = 0;
let searchFrom = 0;

while (true) {
  const crossrefIdx = content.indexOf(CROSSREF_MARKER, searchFrom);
  if (crossrefIdx === -1) break;

  // Find the ethics end after the crossref start
  const ethicsEndIdx = content.indexOf(ETHICS_END, crossrefIdx);
  if (ethicsEndIdx === -1) {
    console.error(`Found CROSSREF at ${crossrefIdx} but no ETHICS_END after it!`);
    break;
  }

  const blockEnd = ethicsEndIdx + ETHICS_END.length;
  const fullBlock = content.substring(crossrefIdx, blockEnd);

  // Replace with template interpolation references
  const replacement = `\${CROSS_REFERRAL_BLOCK}\n\n\${ETHICS_GUARD_BLOCK}`;

  content = content.substring(0, crossrefIdx) + replacement + content.substring(blockEnd);
  replacements++;

  // Move search position past the replacement
  searchFrom = crossrefIdx + replacement.length;
}

console.log(`Replaced ${replacements} inline blocks with shared constant references.`);

// Add the import at the top of the file (after the existing import)
if (!content.includes('import { CROSS_REFERRAL_BLOCK')) {
  content = content.replace(
    'import type { Tier } from "@/lib/tier-config";',
    'import type { Tier } from "@/lib/tier-config";\nimport { CROSS_REFERRAL_BLOCK, ETHICS_GUARD_BLOCK } from "@/lib/agent-shared-prompts";'
  );
  console.log("Added import for shared prompt constants.");
}

const newLines = content.split("\n").length;
const savedLines = originalLines - newLines;

writeFileSync(FILE, content, "utf-8");

console.log(`Original: ${originalLines} lines (${originalLength} chars)`);
console.log(`New: ${newLines} lines (${content.length} chars)`);
console.log(`Saved: ${savedLines} lines (${originalLength - content.length} chars)`);
console.log("Done! Verify with: npx next build");
