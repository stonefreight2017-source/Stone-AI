import { sendFounderAlert } from "../src/lib/alert-system/send";
import { AlertAgent, AlertPriority, AlertType } from "../src/lib/alert-system/types";

async function main() {
  const body = `JOINT PROPOSAL: SEED SCALING — 418 → 700+
From: Agent Stone (Head 1) + Cardinal (Head 2)
Date: 2026-03-10

VERIFIED INVENTORY: 418+ total assets on disk
Knowledge seeds: 345 (reasoning:99, business:92, engineering:78, security:27, infrastructure:23, quality:21, experience-os:5)
Memory operational seeds: 56 | Root seeds + docs: 17

GAP TO 700: ~282 new seeds needed

CRITICAL CORRECTIONS:
1. Registry was STALE — showed 84, reality is 418+
2. Rush 21 seeds ALREADY WRITTEN (not just "designed")
3. 16 mobile-* engineering seeds ALREADY EXIST
4. USB was MISSING 345 knowledge seeds — NOW FIXED

CATEGORY EXPANSION:
reasoning: 99→120 (+21) | business: 92→140 (+48) | engineering: 78→160 (+82)
security: 27→60 (+33) | infrastructure: 23→55 (+32) | quality: 21→45 (+24)
experience-os: 5→20 (+15) | NEW operations: 0→27 (+27) = 282 new total

WAVE 1 (100 seeds, Weeks 1-3): Launch-critical — Tools frontend, Best AI mobile, Stripe live security, OMEN prod setup, launch copy
WAVE 2 (100 seeds, Weeks 4-8): Growth — advanced patterns, marketing depth, agent optimization, incident response
WAVE 3 (82 seeds, Weeks 9-14): Moat — experience-os, operations runbooks, future-proofing

PRESERVATION: Additive only. Never overwrite. SHA256 checksums. Manifest validation. Backup before batch install.

PIPELINE (zero stops): 10 seeds/batch, single specialist, grade AFTER not during. A/B=ship, C=rework queue, D/F=scrap. 25-50 seeds/week.

TIMELINE: Week 4=520 total | Week 8=620 | Week 14=700+ TARGET HIT

USB STATUS: 613 files. 345 knowledge seeds FIXED. omen-deploy added (zero-stops installer).

DECISIONS (approve once, then zero stops):
1. Approve 282-seed expansion targets per category?
2. Approve Wave 1/2/3 priority ordering?
3. Approve operations as new 8th category?
4. Approve schema changes for metadata on AgentKnowledgeChunk?
5. Approve production rate 25-50 seeds/week?
6. Confirm Rush 21 seeds → COMPLETE in registry?`;

  const result = await sendFounderAlert({
    agent: AlertAgent.STONE,
    priority: AlertPriority.P1,
    alertType: AlertType.SEED_DELIVERABLE,
    title: "Seed Scaling Proposal: 418→700+ (Stone + Cardinal Joint Plan)",
    body,
    metadata: {
      current_seeds: 418,
      target_seeds: 700,
      gap: 282,
      waves: 3,
      timeline_weeks: 14,
      usb_files: 613,
      knowledge_seeds_fixed: "345 copied to USB",
      omen_deploy: "zero-stops installer added"
    }
  }, 0);

  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
