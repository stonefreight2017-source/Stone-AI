# Creative Problem Solving

## Why Creativity Matters for AI Systems

Creativity isn't magic — it's systematic. It's the ability to generate novel, useful solutions by making connections between ideas that aren't obviously related. AI agents that can think creatively don't just retrieve known solutions — they synthesize new ones by combining elements from different domains, challenging assumptions, and reframing problems.

The most valuable AI assistance happens when the user is stuck. They've tried the obvious approaches and they haven't worked. This is precisely when creative problem-solving techniques become essential. A menu of systematic creativity methods turns "I'm stuck" into "Let me try a different angle."

## TRIZ: Theory of Inventive Problem Solving

### Background

TRIZ (Teoriya Resheniya Izobretatelskikh Zadach) was developed by Genrich Altshuller from analyzing over 40,000 patents. His insight: inventive solutions follow patterns. The same handful of principles solve problems across wildly different domains.

### The 40 Inventive Principles (Key Selections)

**1. Segmentation**: Divide an object or system into independent parts.
- Monolithic application too complex? Segment into microservices.
- Single pricing tier doesn't fit all users? Segment into tiers.
- One-size-fits-all onboarding failing? Segment by user type.

**2. Taking out (Extraction)**: Extract the problematic part or property.
- Slow page loads? Extract heavy components into lazy-loaded modules.
- Complex feature overwhelming users? Extract advanced options into a separate settings panel.

**5. Merging**: Combine identical or similar objects or operations.
- Multiple API calls for related data? Merge into a single endpoint with includes.
- Similar agent personalities? Merge common traits into a shared base with differentiation layers.

**10. Preliminary action**: Perform required changes in advance.
- Users need data on demand? Pre-compute and cache during off-peak hours.
- Onboarding requires setup? Complete as much as possible before the user even starts.

**13. The other way round (Inversion)**: Instead of the expected action, do the opposite.
- Instead of pushing content to users, let users pull what they need.
- Instead of fixing bugs after they ship, prevent them before they're written (type safety, linting, tests).

**15. Dynamization**: Make an object or process adjustable or adaptive.
- Fixed pricing? Dynamic pricing based on usage.
- Static UI? Adaptive interface that changes based on user behavior patterns.

**17. Another dimension**: Move into an additional dimension.
- Text-only support? Add voice, video, visual aids.
- 2D UI not working? Consider spatial or temporal dimensions (timeline views, contextual panels).

**25. Self-service**: Make an object serve itself or perform auxiliary functions.
- Users asking repetitive questions? Self-service knowledge base.
- Agents needing human intervention? Self-healing with automatic retry logic.

**35. Parameter changes**: Change physical/chemical properties or operational parameters.
- Response too slow? Change the temperature/creativity parameter.
- Model too expensive? Change the model size based on task complexity.

**40. Composite materials**: Replace homogeneous with composite.
- One AI model for everything? Composite approach: fast/cheap model for simple tasks, powerful/expensive model for complex ones. (This is exactly Stone AI's approach with vLLM + Claude.)

### The Contradiction Matrix

TRIZ's most powerful tool recognizes that every engineering problem contains a contradiction: improving one parameter worsens another.

**Technical contradictions**: Improving X degrades Y.
- Want faster response? But that costs more (speed vs. cost).
- Want more features? But that increases complexity (capability vs. usability).

**Physical contradictions**: An element must simultaneously have opposite properties.
- A password must be complex (for security) AND simple (for memorability).
- An interface must be information-rich (for power users) AND minimal (for beginners).

**Resolution strategies for contradictions**:
- **Separation in time**: Complex during setup, simple during daily use
- **Separation in space**: Rich on desktop, minimal on mobile
- **Separation by condition**: Complex when needed, simple by default (progressive disclosure)
- **Separation at system level**: Complex system, simple component interfaces

## Lateral Thinking (Edward de Bono)

### The Concept

Vertical thinking digs deeper in the same hole. Lateral thinking digs a new hole in a different place. It's about changing the frame, not working harder within the existing frame.

### Core Techniques

**Random Entry**: Pick a random word, image, or concept and force a connection to your problem. The randomness breaks you out of existing thought patterns.

Example: Problem is user retention. Random word: "garden." Connections: Gardens need watering (regular engagement), pruning (removing unused features), planting seeds (onboarding that creates future value), seasons (natural cycles of engagement). This might generate ideas about seasonal content, "pruning" the feature set, or automated "watering" touchpoints.

**Provocation (Po)**: Make a deliberately provocative, seemingly absurd statement and use it as a stepping stone.

Example: "Po: Users should pay us MORE when they use the product LESS." Absurd — but it provokes thinking about value delivery. Maybe users who use the product less are getting more efficient at solving their problems. Maybe we should charge for outcomes, not usage. Maybe there's a premium tier for minimal-touch, high-value interactions.

**Challenge**: Systematically challenge every assumption about how something must work.

Example: "Why do users need to create an account before using the product?" Challenge: They don't. What if they could use a limited version immediately and only create an account when they want to save their work? This is actually how many successful products operate.

**Analogy**: Find a parallel situation in a different domain and transfer the solution.

Example: "How does a hospital emergency room handle triage?" They don't serve patients first-come-first-served — they assess severity and prioritize accordingly. Transfer to customer support: stop processing tickets in order received; implement severity-based triage with automatic escalation for critical issues.

### Six Thinking Hats

De Bono's parallel thinking framework prevents unstructured argumentation by assigning explicit thinking modes:

**White Hat**: Information. What data do we have? What data do we need? Pure facts, no interpretation.
**Red Hat**: Emotion. How do I feel about this? Gut reactions. No justification required.
**Black Hat**: Caution. What could go wrong? Risks, problems, concerns. The critical voice.
**Yellow Hat**: Optimism. What are the benefits? Best-case scenarios. The supportive voice.
**Green Hat**: Creativity. New ideas, alternatives, possibilities. No judgment.
**Blue Hat**: Process. What hat should we wear now? Managing the thinking process itself.

**Application for agents**: When analyzing a decision, explicitly cycle through all six hats. This ensures you don't get stuck in one mode (usually Black Hat critical thinking or Yellow Hat optimism) and miss perspectives that other modes would surface.

## SCAMPER

A checklist of creative transformations to apply to any existing product, process, or concept:

**S — Substitute**: What can be replaced? Different material, component, person, process?
- Substitute expensive cloud AI with local inference for appropriate tasks
- Substitute long onboarding forms with progressive profiling

**C — Combine**: What can be merged? Features, steps, purposes?
- Combine the help center with the agent interface — AI-powered help that also sells the product
- Combine billing notifications with engagement touchpoints

**A — Adapt**: What can be adjusted? Modified from something else? Borrowed from another domain?
- Adapt gaming loyalty mechanics for user engagement (streaks, achievements, leaderboards)
- Adapt restaurant reservation systems for agent scheduling

**M — Modify/Magnify/Minimize**: What can be changed in size, shape, color, frequency?
- Magnify the onboarding experience — make it a full guided tour instead of a form
- Minimize the time-to-first-value — what if the first useful interaction happens in 10 seconds?

**P — Put to other uses**: Can this serve a different purpose?
- User conversation data (anonymized) as training data
- Support interactions as marketing testimonials
- Error logs as product improvement signals

**E — Eliminate**: What can be removed entirely? What's unnecessary?
- Eliminate registration before first use
- Eliminate confirmation dialogs for low-stakes actions
- Eliminate features that less than 5% of users touch

**R — Reverse/Rearrange**: What if the order changed? What if roles reversed?
- Reverse the sales funnel — let users experience value before hearing the pitch
- Rearrange the dashboard to show most-used features first
- Reverse the support model — agents proactively reach out before users ask for help

## Constraint Removal

### The Method

Most problem-solving operates within assumed constraints. Constraint removal asks: "What if this constraint didn't exist?" Then works backward to find ways to weaken or eliminate the constraint.

### Process

**Step 1: List all constraints** (time, money, technology, skills, regulations, physics, assumptions)

**Step 2: For each constraint, ask**: "What would we do if this constraint didn't exist?"

**Step 3: For each unconstrained solution, ask**: "How close can we get to this within actual constraints? What would it take to relax this constraint partially?"

**Step 4: Identify constraints that are actually self-imposed** rather than external. These are the easiest to remove because they only require changing your mind.

### Example

**Problem**: Agent response quality isn't good enough for enterprise customers.

**Constraints listed**:
1. Model capability (technology)
2. Context window size (technology)
3. Training data quality (data)
4. Response latency requirements (UX)
5. Cost per inference (budget)
6. Single-turn interaction model (architecture)

**Constraint 6 is self-imposed**: Who said interactions must be single-turn? What if the agent could ask clarifying questions, break complex requests into sub-tasks, and iterate? This is an architectural constraint we chose, not an external limitation.

**Constraint 5 is partially self-imposed**: Could we charge enterprise customers more for higher-quality inference? The cost constraint exists because of our pricing, which we control.

Removing these two constraints opens up: multi-turn reasoning agents for enterprise tier at premium pricing using more expensive models. The "constraint" was actually a design choice.

## Reframing

### The Power of Problem Redefinition

Often the most creative act is not solving the problem but redefining it. Einstein said: "If I had an hour to solve a problem, I'd spend 55 minutes thinking about the problem and 5 minutes thinking about solutions."

### Reframing Techniques

**Level shifting**: Move the problem up or down a level of abstraction.
- Problem: "How do we reduce customer churn?" (operational level)
- Reframe up: "How do we make our product indispensable?" (strategic level)
- Reframe down: "What specific moment causes users to decide to cancel?" (tactical level)

**Stakeholder shifting**: See the problem from a different stakeholder's perspective.
- Problem from our view: "How do we increase user engagement?"
- Problem from user's view: "How do I get my work done faster?"
- These might have very different solutions. Increasing engagement (from our view) might mean making the product so efficient that users spend LESS time (from their view).

**Temporal shifting**: Change the time frame of the problem.
- Short-term: "How do we hit this month's revenue target?"
- Long-term: "How do we build a business that sustainably generates revenue for 10 years?"
- These frame very different solution spaces.

**Functional shifting**: Change what "solved" means.
- "How do we build a faster horse?" → "How do we get people from A to B faster?" (Ford)
- "How do we improve our chatbot?" → "How do we resolve user needs regardless of channel?"

### The Five Whys (Root Cause Reframing)

Ask "Why?" five times to move from symptoms to root causes:

1. Why are users canceling? → They say the product isn't useful enough.
2. Why isn't it useful enough? → They're not using the features that would help them.
3. Why aren't they using those features? → They don't know the features exist.
4. Why don't they know? → Our feature discovery and onboarding are weak.
5. Why are they weak? → We prioritized building features over teaching users how to use them.

The original problem (churn) has been reframed from a retention problem to an onboarding/education problem — which has completely different solutions.

## Bisociation (Arthur Koestler)

### The Concept

Creativity occurs when two previously unrelated frames of reference ("matrices of thought") intersect. The moment of insight happens at the intersection — the "bisociation" of two planes of thought.

**Example**: Velcro was invented when George de Mestral noticed burrs sticking to his dog's fur and connected the biological attachment mechanism with the engineering problem of fasteners. Two unrelated matrices (biology + manufacturing) bisociated.

### Applying Bisociation

**Step 1**: Define your problem in one domain
**Step 2**: Find an analogous structure in a completely different domain
**Step 3**: Map the elements from the foreign domain onto your problem
**Step 4**: Generate new ideas from the mapping

**Example for Stone AI**: Problem: How to make agent personalities feel authentic?

Domain shift → Theater: Method actors don't "act" a personality — they live in it. They have backstories, motivations, fears, habits. They stay in character even in unscripted moments.

Mapping: Give each agent a "backstory" that informs responses even when the backstory isn't directly relevant. The agent doesn't just have a personality parameter — it has experiences, preferences, and quirks that emerge naturally. This creates the feeling of authenticity that parameter-based personality lacks.

## Morphological Analysis

### The Method (Fritz Zwicky)

Systematically explore all possible combinations of a problem's dimensions:

**Step 1**: Identify the key dimensions/parameters of the problem
**Step 2**: List possible values for each dimension
**Step 3**: Create a matrix of all combinations
**Step 4**: Evaluate promising combinations that haven't been tried

### Example: Agent Interaction Design

| Dimension | Options |
|-----------|---------|
| Initiative | User-driven / Agent-driven / Mixed |
| Modality | Text / Voice / Visual / Multi-modal |
| Tone | Formal / Casual / Adaptive |
| Depth | Surface / Detailed / Expert |
| Session | One-shot / Multi-turn / Persistent |
| Memory | None / Session / Cross-session |

This gives 3 x 4 x 3 x 3 x 3 x 3 = 972 possible combinations. Most have never been tried. Which unexplored combinations might serve underserved user segments?

Agent-driven + Voice + Casual + Surface + Persistent + Cross-session = A proactive voice assistant that casually checks in on users and remembers past interactions. Has this been explored for the Bestie feature?

## Additional Creative Methods

### Design Thinking (IDEO)
1. **Empathize**: Deeply understand the user's experience
2. **Define**: Articulate the specific problem to solve
3. **Ideate**: Generate many possible solutions (diverge)
4. **Prototype**: Build quick, cheap testable versions
5. **Test**: Get real feedback, iterate

### Brainstorming Rules (Osborn)
1. Defer judgment — don't evaluate during generation
2. Go for quantity — more ideas = more chances for good ones
3. Build on others' ideas — "Yes, AND..."
4. Encourage wild ideas — they can be tamed later

### Reverse Brainstorming
Instead of "How do we solve this?", ask "How would we make this WORSE?" Then invert each answer.

"How would we make user onboarding terrible?"
- Require 20 form fields before showing any value → Invert: Zero fields before first value
- Use jargon they don't understand → Invert: Plain language, explain everything
- Make them wait 3 days for account approval → Invert: Instant access

### Assumption Mapping
List every assumption underlying the current approach. Challenge each one:
- "Users want more features" — Do they? Or do they want fewer, better features?
- "Speed matters most" — Does it? Or does accuracy matter more?
- "Users will read instructions" — Will they? What if they won't?

### Forced Connections
Pick two unrelated concepts and force a meaningful connection:
- "Subscription billing" + "National parks" = ???
- National parks have entrance fees (one-time), campsite fees (per-use), and annual passes (subscription). What if our billing model had all three: one-time feature unlocks, per-use charges for expensive operations, and subscription for regular access?

## Meta-Creativity: Knowing Which Tool to Use

### When to Use Each Method

**TRIZ**: When you face a clear technical contradiction (improving X worsens Y)
**Lateral thinking**: When you're stuck in a rut and need fresh perspective
**SCAMPER**: When you want to improve something that already exists
**Constraint removal**: When you feel limited but aren't sure what's limiting you
**Reframing**: When the problem itself seems wrong or intractable
**Bisociation**: When you need truly novel approaches from outside your domain
**Morphological analysis**: When the solution space is large and unexplored
**Design thinking**: When you're not sure what the user actually needs
**Reverse brainstorming**: When direct ideation has stalled

### The Creative Process

Creativity isn't random — it follows a pattern:

1. **Preparation**: Deeply understand the problem, gather relevant knowledge
2. **Incubation**: Let the problem sit. Unconscious processing works on connections.
3. **Illumination**: The "aha" moment when a connection crystallizes
4. **Verification**: Test the idea rigorously against reality

For AI agents, incubation is replaced by systematic exploration of the solution space using the methods above. The agent doesn't wait for inspiration — it generates candidates through structured techniques and evaluates them against success criteria.

### Creativity as Combinatorial Search

At its core, creativity is the search for useful combinations of existing ideas. The creative methods in this seed are search strategies: they each explore the combination space differently, increasing the probability of finding valuable, non-obvious solutions. The more methods you know and can deploy, the more of the solution space you can cover — and the more likely you are to find something truly novel and useful.
