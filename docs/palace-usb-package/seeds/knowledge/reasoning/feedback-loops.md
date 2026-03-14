# Feedback Loops

## Core Principle

Most systems — code, business, teams — are driven by feedback loops. Understanding which type you're in determines the correct response. Trying to grow in a balancing loop or stabilize in a reinforcing loop is how you waste effort.

## Three Types of Feedback Loops

### 1. Reinforcing Loops (Snowball Effect)

Output feeds back as input, amplifying in the same direction. Can be positive (growth spirals) or negative (death spirals).

**Structure:** More A → More B → More A → ...

**Growth Spiral Examples:**
```
More happy users → More referrals → More users → More social proof → More happy users
  FUEL: Product quality
  LIMIT: Market size, support capacity

More revenue → More development → Better product → More revenue
  FUEL: Revenue margin
  LIMIT: Team capacity, market saturation

Good content → SEO rankings → More traffic → More engagement signals → Better SEO rankings
  FUEL: Content quality
  LIMIT: Content creation capacity, competition
```

**Death Spiral Examples:**
```
Bugs → User complaints → Developer time on bugs → Less time on features →
  Users leave → Revenue drops → Fewer developers → More bugs
  TRIGGER: When bug rate exceeds fix rate
  ESCAPE: Freeze features, fix bugs, reset the loop

Technical debt → Slower development → Shortcuts → More technical debt
  TRIGGER: When deadline pressure forces shortcuts
  ESCAPE: Dedicated debt reduction sprint, no new features

Poor performance → Users leave → Less revenue → Less infrastructure → Worse performance
  TRIGGER: When cost cuts affect user experience
  ESCAPE: Invest in performance BEFORE cutting costs
```

**How to Identify:**
- The same variable appears as both cause and effect
- Things are accelerating (getting better faster OR worse faster)
- Small changes have outsized effects

**Correct Response:**
- Growth spiral: FUEL IT. Identify the engine and feed it resources.
- Death spiral: BREAK IT. Find the weakest link in the loop and intervene there.

### 2. Balancing Loops (Thermostat Effect)

Output feeds back to counter the input, maintaining stability. The system resists change.

**Structure:** More A → More B → LESS A → ...

**Examples:**
```
Price increase → Fewer customers → Revenue pressure → Price decrease
  EQUILIBRIUM: The price where demand meets revenue needs

Feature additions → Complexity → User confusion → Feature removal/simplification
  EQUILIBRIUM: The complexity level users can tolerate

Aggressive growth → Quality issues → Churn → Slower growth
  EQUILIBRIUM: The growth rate the team can support without quality loss

Hiring → Onboarding burden → Slower output → Less hiring
  EQUILIBRIUM: The team size where new hire value exceeds onboarding cost
```

**How to Identify:**
- Changes get "pulled back" toward a set point
- Efforts to push in one direction are counteracted
- The system seems to have a "natural level" it returns to

**Correct Response:**
- If the equilibrium is where you want it: leave it alone
- If you want to shift the equilibrium: change the STRUCTURE of the loop, not the variables
  - Example: Don't push for more features (balancing loop resists). Instead, improve UX so users tolerate more complexity. That shifts the equilibrium point.
- Forcing against a balancing loop wastes energy

### 3. Delayed Loops (Time Bomb / Slow Burn)

Feedback exists but with significant time delay. Actions today have consequences months or years later.

**Structure:** A happens now → B happens much later → appears unconnected

**Examples:**
```
TECHNICAL DEBT:
  Take shortcut now → Ship faster this week →
  [6 months later] → Codebase is unmaintainable → Development slows to crawl
  DELAY: Months. The debt accrues silently.
  DETECTION: Measure velocity trend, not just current velocity.

BRAND EROSION:
  Cut quality to save costs → Users don't notice immediately →
  [3-6 months later] → Reputation declines → New user acquisition drops
  DELAY: Months. Brand damage is invisible until it's severe.
  DETECTION: Track NPS/sentiment over time, not just revenue.

SECURITY NEGLECT:
  Skip security reviews → Nothing bad happens → More shortcuts →
  [Unknown time later] → Breach → Catastrophic trust loss
  DELAY: Unknown. Could be days, could be years.
  DETECTION: You can't detect this by outcomes. Process compliance is the only metric.

TEAM BURNOUT:
  Sustained crunch → High output → "We're doing great" →
  [2-3 months later] → Key people leave → Knowledge loss → Output crashes
  DELAY: Months. People endure before they leave.
  DETECTION: Track hours, morale, turnover intent — not just output.
```

**How to Identify:**
- Current actions have no visible consequences (suspicious!)
- "We've always done it this way and nothing bad happened" (delayed loop hiding)
- Sudden catastrophic failures with "no warning" (the warning was the delay)

**Correct Response:**
- Leading indicators, not lagging. Measure the INPUTS to the delayed loop.
- Treat the absence of negative consequences as a RISK, not a reassurance.
- Set time-based review triggers: "In 3 months, evaluate the effects of this decision."

## Loop Interaction Patterns

Loops rarely exist in isolation. Common interaction patterns:

### Growth Hits a Ceiling
```
Reinforcing loop (growth) + Balancing loop (limit)
= Growth that accelerates, then plateaus

Example: User growth → More load → Performance degrades → Users leave
Solution: Invest in infrastructure BEFORE the balancing loop activates
```

### Death Spiral with Delayed Feedback
```
Reinforcing loop (negative) + Delayed feedback
= Feels fine until catastrophic collapse

Example: Tech debt accumulates → "We're shipping fast!" →
         [6 months later] → Can't ship anything
Solution: Measure debt leading indicators (code complexity,
          test coverage, bug rate trend)
```

### Competing Loops
```
Two reinforcing loops pulling in opposite directions
= Whichever is stronger wins, the other collapses

Example:
  Loop A: Good UX → More users → More revenue → Better UX
  Loop B: Feature requests → More features → More complexity → Worse UX
Solution: Consciously strengthen Loop A and weaken Loop B
```

## Loop Detection Checklist

When analyzing any system, ask:

```
[] What are the variables in this system?
[] Which variables affect each other? (draw arrows)
[] Are any arrows circular? (that's a loop)
[] Is each loop reinforcing (+→+) or balancing (+→−)?
[] What's the time delay on each arrow?
[] Which loop is currently dominant?
[] What would shift dominance to a different loop?
```

## Applied to Stone AI

**Active Reinforcing Loop (positive):**
Quality agents → User satisfaction → Referrals → Growth → Revenue → Better agents

**Active Balancing Loop:**
More agents (44) → More complexity → User confusion → Need for better onboarding

**Delayed Loop (risk):**
Fast shipping → Minimal testing → No consequences yet → [Future: reliability issues]

**Strategic Implication:**
Feed the growth spiral (quality). Shift the balancing loop equilibrium (better onboarding, not fewer agents). Address the delayed loop NOW (testing investment).

## Integration

- **Second-Order Effects** identify loops; this seed classifies and responds to them
- **Theory of Constraints** finds the bottleneck in a reinforcing loop
- **OODA** tempo should match loop speed (fast loops need fast OODA)
- **Inversion** reveals which death spirals could activate
