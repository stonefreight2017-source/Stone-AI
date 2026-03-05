import { readFileSync, writeFileSync } from "fs";

const FILE = "src/lib/agent-definitions.ts";
let lines = readFileSync(FILE, "utf8").split("\n");

// The misplaced seed is between line 20457 and 20531 (1-based)
// Line 20456 ends with: ...best fit.`,
// Line 20457 starts: {
// Line 20531 ends: },
// Line 20532: knowledgeSeed: [

// Extract the misplaced block (0-based indices: 20456 to 20530)
const startIdx = 20456; // 0-based for line 20457
const endIdx = 20530;   // 0-based for line 20531

// Verify we're cutting the right thing
console.log("Line 20457:", lines[startIdx].trim().substring(0, 50));
console.log("Line 20531:", lines[endIdx].trim().substring(0, 50));

if (!lines[startIdx].trim().startsWith("{") || !lines[endIdx].trim().startsWith("},")) {
  console.error("Boundary mismatch - aborting");
  process.exit(1);
}

// Cut the misplaced block
const block = lines.splice(startIdx, endIdx - startIdx + 1);
console.log("Cut", block.length, "lines");

// Now find the knowledgeSeed closing ], for enterprise-sales-advisor
// After removal, line numbers shifted. Re-find it.
let knowledgeSeedEnd = -1;
let inEnterpriseSales = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('slug: "enterprise-sales-advisor"')) {
    inEnterpriseSales = true;
  }
  if (inEnterpriseSales && lines[i].includes('slug: "bestie-companion-base"')) {
    // We've gone too far
    break;
  }
  if (inEnterpriseSales && lines[i].trim() === "],") {
    knowledgeSeedEnd = i; // Keep updating - we want the LAST ], before bestie
  }
}

console.log("Inserting before line:", knowledgeSeedEnd + 1);
console.log("Context:", lines[knowledgeSeedEnd - 1]?.trim().substring(0, 60));
console.log("Target:", lines[knowledgeSeedEnd]?.trim());

// Insert the block before the closing ],
lines.splice(knowledgeSeedEnd, 0, ...block);

writeFileSync(FILE, lines.join("\n"), "utf8");
console.log("Done. New total:", lines.length, "lines");
