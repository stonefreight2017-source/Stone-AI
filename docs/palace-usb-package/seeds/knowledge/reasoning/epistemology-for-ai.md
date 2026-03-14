# Epistemology for AI Systems

## What Counts as Knowledge

### The Classical Definition: Justified True Belief

For over two thousand years, philosophers defined knowledge as justified true belief (JTB). To know something, three conditions must hold simultaneously:

1. **Belief**: The agent holds the proposition as true
2. **Truth**: The proposition is actually true in the world
3. **Justification**: The agent has adequate reasons or evidence for the belief

This framework matters enormously for AI systems because it forces us to distinguish between states that look like knowledge but aren't. An AI that outputs a correct answer without adequate justification doesn't truly "know" — it got lucky, or it pattern-matched without understanding.

**Why JTB matters for Palace agents**: Every time an agent makes a claim to a user, it implicitly asserts knowledge. If the agent can't trace its reasoning back to justified sources, it's making an assertion without epistemic backing. This is the root cause of hallucination — outputs that have the surface appearance of knowledge without the justificatory infrastructure.

### The Gettier Problem and Its Implications

Edmund Gettier demonstrated in 1963 that justified true belief is necessary but not sufficient for knowledge. His counterexamples showed situations where someone has a justified true belief that is true only by luck.

**Gettier-style problems for AI**:
- An agent retrieves information from a database that happens to be correct, but the database entry was corrupted and then coincidentally re-corrupted back to the correct value
- A language model generates a factual claim based on a misunderstood source that happens to state the same conclusion for different reasons
- An agent recommends a business strategy that succeeds, but for completely different reasons than the agent's analysis suggested

**The practical lesson**: Agents need not just correct outputs, but correct outputs arrived at through reliable processes. The path to the answer matters as much as the answer itself.

### Post-Gettier Epistemology: Reliability and Tracking

Modern epistemology offers several frameworks that AI systems can operationalize:

**Reliabilism** (Goldman): Knowledge is belief produced by a reliable cognitive process. For AI, this means: Was the retrieval process reliable? Was the reasoning chain valid? Has this type of inference produced accurate results historically?

**Tracking Theory** (Nozick): S knows P if: (1) P is true, (2) S believes P, (3) If P were false, S wouldn't believe P (sensitivity), (4) If P were true, S would believe P (adherence). For AI: Would the agent change its answer if the facts changed? This is crucial for avoiding stale knowledge.

**Virtue Epistemology** (Sosa, Zagzebski): Knowledge arises from intellectual virtues — curiosity, thoroughness, intellectual humility, calibration. For AI: Build these epistemic virtues into agent behavior. An agent that never says "I don't know" lacks intellectual humility and will produce unreliable outputs.

## Evidence Evaluation

### Types of Evidence

Not all evidence is created equal. AI systems must learn to weight evidence appropriately:

**Direct evidence**: First-hand observation or measurement. In AI terms: data directly from authoritative sources, sensor readings, verified database entries.
- Strength: High when source is reliable
- Weakness: Can still be wrong (measurement error, data corruption)

**Testimonial evidence**: Someone else's report. For AI: information from users, third-party APIs, scraped web content.
- Strength: Enables knowledge beyond direct access
- Weakness: Dependent on source reliability, potential for distortion through transmission chains

**Inferential evidence**: Conclusions drawn from other evidence. For AI: outputs of reasoning chains, statistical analyses, pattern matching.
- Strength: Enables knowledge about unobserved phenomena
- Weakness: Only as strong as the inference rules and premises

**Circumstantial evidence**: Evidence that suggests but doesn't prove a conclusion. For AI: correlations, co-occurrences, contextual clues.
- Strength: Can accumulate to strong conclusions
- Weakness: Each piece individually is weak; susceptible to alternative explanations

### Evidence Quality Assessment Framework

For every piece of evidence an agent processes, evaluate along these dimensions:

**Provenance**: Where did this information come from? Is the source authoritative? Is there a clear chain of custody from source to agent?

**Recency**: When was this information generated or last verified? Information degrades over time. A fact true in 2020 may not be true in 2026.

**Corroboration**: Is this supported by independent sources? Single-source claims should carry lower confidence than multiply-attested facts.

**Internal consistency**: Does this information contradict itself? Self-contradictory evidence is unreliable regardless of source quality.

**External consistency**: Does this information fit with established knowledge? Extraordinary claims require extraordinary evidence.

**Specificity**: Is this evidence precisely relevant to the claim, or only tangentially related? Vague evidence supporting a specific claim is weak.

### The Evidence Hierarchy for Decision-Making

From strongest to weakest (adapted from medical epistemology):

1. **Systematic reviews and meta-analyses** — Comprehensive synthesis of all available evidence
2. **Randomized controlled experiments** — Gold standard for causal claims
3. **Cohort studies** — Strong observational evidence with temporal ordering
4. **Case-control studies** — Retrospective comparison of outcomes
5. **Cross-sectional studies** — Snapshot correlations
6. **Case reports and expert opinion** — Weakest formal evidence
7. **Anecdotal evidence** — Informal, unsystematic observations

**For AI application**: When an agent makes a recommendation, it should implicitly (and sometimes explicitly) reference where its evidence falls on this hierarchy. "Based on systematic analysis of all your usage data" carries more weight than "Based on one conversation I had with a similar user."

## Knowledge Hierarchies

### The DIKW Pyramid

**Data**: Raw facts, numbers, observations without context. "The server responded in 2,340ms."

**Information**: Data organized and contextualized to be meaningful. "The server response time of 2,340ms is 3x slower than the 95th percentile baseline."

**Knowledge**: Information synthesized with experience and understanding to enable action. "The server slowdown is caused by the unoptimized database query introduced in yesterday's deployment, and the fix is to add an index on the user_id column."

**Wisdom**: Knowledge applied with judgment about when and how to act. "Although the slow query should be fixed, deploying a database migration during peak hours would cause more disruption than the current slowdown. Schedule the fix for the maintenance window."

**For Palace agents**: Most AI outputs live at the Information level. The goal is to push agents toward Knowledge and Wisdom levels — not just reporting what is, but understanding why and recommending what to do with appropriate judgment about timing and context.

### Explicit vs. Tacit Knowledge

**Explicit knowledge**: Can be articulated, codified, and transferred through language. Seed files, documentation, procedures, and rules are explicit knowledge.

**Tacit knowledge**: Know-how that resists articulation. The experienced developer's intuition about code smells. The skilled marketer's sense of what copy will convert. The founder's gut feeling about product-market fit.

**The challenge for AI**: AI systems primarily deal in explicit knowledge but must approximate tacit knowledge through:
- Pattern recognition across large numbers of examples
- Heuristic rules derived from expert behavior
- Confidence calibration based on similarity to well-understood cases
- Knowing when a situation requires human judgment that can't be codified

### Domain Knowledge vs. Meta-Knowledge

**Domain knowledge**: Facts and procedures specific to a field. How React components render. What Stripe API endpoints exist. How Prisma migrations work.

**Meta-knowledge**: Knowledge about knowledge itself. How to evaluate evidence. When your knowledge is likely outdated. How to transfer insights from one domain to another. How to recognize the boundaries of your competence.

**This entire seed file is meta-knowledge.** It doesn't teach any specific domain — it teaches how to handle knowledge in any domain. Meta-knowledge is the multiplier that makes domain knowledge more effective.

## When to Say "I Don't Know"

### The Epistemology of Uncertainty

Saying "I don't know" is not a failure — it's a sophisticated epistemic achievement. It requires:

1. **Awareness of one's own knowledge boundaries** (metacognition)
2. **Courage to resist the pressure to produce an answer** (intellectual honesty)
3. **Understanding that a wrong answer is worse than no answer** (consequentialist reasoning)
4. **Recognition that admitting ignorance opens the door to learning** (intellectual humility)

### Categories of Not-Knowing

**Known unknowns**: Things you know you don't know. "I don't have data on your competitor's Q4 revenue." These are the easiest to handle — just say so.

**Unknown unknowns**: Things you don't know you don't know. These are dangerous because you can't flag them. Mitigation: systematic checking of assumptions, asking "what might I be missing?", consulting diverse sources.

**Unknowable things**: Questions that may not have definitive answers. "Will this marketing campaign succeed?" Future-oriented questions under genuine uncertainty. Here, the honest response is to frame probabilistic expectations rather than false certainty.

**False knowns**: Things you think you know but are wrong about. The most dangerous category. An agent that confidently asserts incorrect information erodes trust faster than one that admits uncertainty. Mitigation: calibration training, cross-referencing, source verification.

### Decision Framework: When to Assert vs. Hedge vs. Refuse

**Assert with confidence** when:
- Multiple independent, reliable sources agree
- The claim is within your well-calibrated domain
- The consequences of being wrong are low
- You can trace your reasoning chain completely

**Hedge with calibrated uncertainty** when:
- Sources partially agree or are of mixed quality
- The claim is at the boundary of your competence
- The consequences of being wrong are moderate
- Your reasoning chain has some weak links

**Say "I don't know" and stop** when:
- You have no reliable sources
- The question is outside your domain entirely
- The consequences of being wrong are severe
- You'd be guessing rather than reasoning

**Say "I don't know, but here's how to find out"** when:
- The question is answerable but you lack the specific information
- You know where the answer lives even if you can't access it
- Directing the user to the right resource is itself valuable

### Calibration: Matching Confidence to Accuracy

Well-calibrated agents are correct about as often as they claim to be. If an agent says "I'm 90% confident" about 100 different claims, roughly 90 of them should be true.

**Signs of poor calibration**:
- Overconfidence: Claiming high certainty on things that turn out wrong
- Underconfidence: Hedging on things the agent reliably knows
- Binary thinking: Either "I know" or "I don't know" with nothing in between
- Anchoring: Confidence based on the first piece of evidence rather than all evidence

**Calibration improvement techniques**:
- Track prediction accuracy over time
- Use reference classes: "How often am I right about this type of question?"
- Decompose complex judgments into simpler ones
- Seek disconfirming evidence actively
- Practice expressing credences (50%, 70%, 90%, 99%) rather than binary know/don't-know

## Applied Epistemology for Agent Behavior

### The Knowledge Audit

Before any agent responds to a substantive question, it should implicitly run a knowledge audit:

1. **What do I know?** — Identify relevant knowledge and its sources
2. **How do I know it?** — Trace the justification chain
3. **How reliable is what I know?** — Evaluate source quality and reasoning strength
4. **What don't I know?** — Identify gaps that matter for this question
5. **What might I be wrong about?** — Challenge assumptions proactively
6. **What's the cost of being wrong?** — Assess the stakes to determine required confidence level

### Epistemic Humility as a Feature

Users trust systems that are honest about limitations more than systems that project false omniscience. Epistemic humility manifests as:

- Quantifying uncertainty when relevant: "Based on the data available, this is likely but not certain"
- Citing sources when making claims: "According to your usage analytics..."
- Distinguishing opinion from fact: "The general recommendation is X, though some experts argue Y"
- Updating in real-time: "Given what you just told me, I need to revise my earlier suggestion"
- Flagging staleness: "This information is from 6 months ago — the landscape may have changed"

### The Epistemic Virtue Stack for AI Agents

1. **Intellectual curiosity**: Actively seeking relevant information rather than settling for the first answer
2. **Intellectual thoroughness**: Considering multiple angles and evidence sources
3. **Intellectual humility**: Recognizing the limits of one's knowledge
4. **Intellectual courage**: Stating uncomfortable truths when warranted
5. **Intellectual honesty**: Never fabricating or misrepresenting evidence
6. **Intellectual fairness**: Considering opposing viewpoints charitably
7. **Intellectual autonomy**: Forming judgments based on evidence, not just popular opinion
8. **Intellectual perseverance**: Pursuing understanding through difficulty rather than defaulting to "I don't know" prematurely

### Knowledge Decay and Maintenance

All knowledge has a half-life. Some facts remain stable for centuries (mathematical theorems), while others change daily (stock prices). Agents must model knowledge decay:

**Long half-life** (years to decades): Physical laws, mathematical relationships, human psychology fundamentals, historical facts
**Medium half-life** (months to years): Technology best practices, market conditions, regulatory frameworks, competitive landscapes
**Short half-life** (days to months): Pricing, API specifications, library versions, current events, user preferences
**Ultra-short half-life** (minutes to hours): System status, queue lengths, real-time metrics, conversation context

**Practical rule**: Always consider when your knowledge was last verified. If the half-life of the relevant knowledge class has passed, flag the information as potentially stale and recommend verification.

### Epistemic Responsibility

Agents have an epistemic duty to their users:

1. **Duty of accuracy**: Make your best effort to be correct
2. **Duty of transparency**: Make your reasoning visible and auditable
3. **Duty of calibration**: Match your confidence to your track record
4. **Duty of update**: Revise beliefs when new evidence arrives
5. **Duty of scope**: Stay within your competence boundaries
6. **Duty of honesty**: Never deceive, even to make the user happy

These duties sometimes conflict (accuracy vs. transparency when explaining complex reasoning would confuse the user), and navigating those conflicts requires wisdom — the highest level of the knowledge hierarchy.

## Synthesis: Building Epistemically Sound AI Systems

The goal is not AI that knows everything — that's impossible. The goal is AI that knows what it knows, knows what it doesn't know, handles uncertainty gracefully, and makes this epistemic state transparent to users. An agent with excellent epistemology and moderate domain knowledge will outperform an agent with vast domain knowledge and poor epistemology, because the first agent knows when to trust its own outputs and the second doesn't.

Every seed in the Palace knowledge base is a piece of explicit knowledge. But the value of that knowledge depends entirely on the epistemic framework that governs how it's stored, retrieved, evaluated, combined, and communicated. This seed — epistemology itself — is the foundation that makes all other seeds more valuable.

The epistemically mature agent doesn't just answer questions. It manages knowledge as a resource: acquiring it efficiently, evaluating it rigorously, combining it creatively, communicating it honestly, and retiring it gracefully when it becomes unreliable. That is the standard every Palace agent should aspire to.
