import { sendFounderAlert } from "../src/lib/alert-system/send";

async function main() {
  const result = await sendFounderAlert(
    {
      agent: "cardinal" as any,
      priority: "P1" as any,
      alertType: "seed.deliverable" as any,
      title: "[GOLDEN SEEDS] 32B-to-70B Gap Strategy — 33 Seeds, 4 Gaps, MVP Plan",
      body: `GOLDEN SEEDS STRATEGY — CLOSING THE 32B-TO-70B GAP
From: Cardinal (Head 2) + Stone (Head 1)
Date: 2026-03-10

EXECUTIVE SUMMARY
33 golden seeds across 4 gap categories. MVP of 8 seeds for first measurable results in 2 weeks. A 32B that knows when to retrieve instead of guess BEATS a 70B that generates everything.

================================
THE 4 GAPS AND HOW WE CLOSE THEM
================================

GAP 1: KNOWLEDGE (8 seeds, +25-35% accuracy)
70B knows more facts by heart. 32B guesses.
Fix: Externalize knowledge into retrievable seeds — lookup tables, decision trees, protocol specs, terminology, comparisons, numerical references.
CRITICAL SEED: K-8 "I Don't Know Triggers" — teaches 32B to RETRIEVE instead of hallucinate. The #1 golden seed.

GAP 2: REASONING (9 seeds, +30-40% on complex tasks)
70B reasons deeper (more layers = more computation).
Fix: Scaffold templates that structure reasoning for 32B — chain-of-thought, decomposition, self-verification, causal reasoning, working memory anchors.
CRITICAL SEEDS: R-2 Decomposition Patterns (hard to easy) + R-8 Meta-Reasoning (am I guessing?).

GAP 3: INSTRUCTION FOLLOWING (8 seeds, +25-35% compliance)
70B follows complex multi-part instructions better.
Fix: Instruction parsers, output format templates, constraint checklists, few-shot exemplar banks, ambiguity resolution.
CRITICAL SEED: I-1 Instruction Decomposition Parser — parses instructions into checklist before responding.

GAP 4: EDGE CASES (8 seeds, +20-30% robustness)
70B degrades gracefully on weird inputs.
Fix: Input validation, fallback chains, uncertainty quantification, adversarial handlers, domain boundary markers.

================================
THE 4 CRITICAL SEEDS (DEPLOY FIRST)
================================
1. K-8: "I Don't Know" Triggers — prevents hallucination, forces retrieval
2. R-2: Decomposition Patterns — complex becomes simple
3. R-8: Meta-Reasoning — self-aware retrieval behavior
4. I-1: Instruction Decomposition — never skip parts of requests

================================
MVP: 8 SEEDS FOR FIRST RESULTS
================================
1. K-8: I Don't Know Triggers (Knowledge)
2. R-2: Decomposition Patterns (Reasoning)
3. I-1: Instruction Decomposition (Instruction)
4. R-8: Meta-Reasoning (Reasoning)
5. K-1: Domain Lookup Tables (Knowledge)
6. I-7: Few-Shot Exemplar Banks (Instruction)
7. E-2: Fallback Chain Seeds (Edge Cases)
8. R-1: Chain-of-Thought Templates (Reasoning)

MVP estimated impact: 20-30% measurable improvement across all task types.

================================
TOKEN OPTIMIZATION + GOLDEN SEEDS COMPOUND
================================
- Prompt caching: Critical seeds cached as prefixes = zero retrieval latency
- Context compression: More seeds fit in window (10 compressed > 3 verbose)
- Tiered retrieval: Golden seeds = tier-1 (always loaded)

================================
FULL INVENTORY
================================
Knowledge seeds: 8 (1 critical, 6 must-have, 1 nice-to-have)
Reasoning seeds: 9 (2 critical, 7 must-have)
Instruction seeds: 8 (1 critical, 6 must-have, 1 nice-to-have)
Edge Case seeds: 8 (7 must-have, 1 nice-to-have)
TOTAL: 33 seeds (4 critical, 26 must-have, 3 nice-to-have)

================================
TIMELINE
================================
Week 1: Baseline benchmarks + 4 Critical seeds
Week 2: Remaining 4 MVP seeds + deploy + measure
Weeks 3-4: 25 must-have seeds in batches
Week 5: Nice-to-have seeds + tuning
Week 6: Production A/B test (10% to 70B, 90% to 32B+seeds)

================================
MEASUREMENT
================================
- 200-query benchmark (50 per gap)
- Head-to-head: 32B+seeds vs 70B baseline
- Track: accuracy, hallucination rate, instruction compliance, reasoning depth
- Target: No significant user satisfaction difference

================================
STONE'S KEY INSIGHT
================================
Golden seeds are not about making 32B smarter. They make it CORRECTLY SELF-AWARE. A model that knows what it knows and retrieves what it doesn't will BEAT a larger model that confidently generates everything. K-8 + R-8 create that self-awareness. That is the real gap-closer.

================================
DECISIONS NEEDED
================================
1. Approve MVP 8 seeds for immediate development?
2. Approve 4 Critical seeds as first sprint?
3. Approve measurement framework?
4. Approve production A/B test at Week 6?
5. Approve full 33-seed roadmap?

— Cardinal (Head 2) + Stone (Head 1)
Direct report to founder per D10.`,
      metadata: {
        proposal_type: "golden_seeds_32b_70b",
        total_seeds: 33,
        critical_seeds: 4,
        must_have_seeds: 26,
        mvp_seeds: 8,
        estimated_improvement: "20-30% MVP, 40-60% full deployment",
        timeline_weeks: 6,
        current_seed_count: 370,
      },
    },
    0
  );

  console.log("Result:", JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

main();
