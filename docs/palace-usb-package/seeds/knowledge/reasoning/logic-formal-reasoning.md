# Logic & Formal Reasoning

## Purpose
Logic is the foundation of correct reasoning. When an AI agent generates a response, it must reason logically — avoid contradictions, draw valid conclusions, and identify fallacies. This seed covers propositional logic, predicate logic, proof strategies, logical fallacies, truth tables, and applications to AI reasoning and prompt engineering.

---

## Propositional Logic

### The Building Blocks

| Symbol | Name | Meaning | Example |
|--------|------|---------|---------|
| P, Q, R | Propositions | Statements that are true or false | "The user is subscribed" |
| NOT (P) | Negation | Opposite of P | "The user is NOT subscribed" |
| P AND Q | Conjunction | Both must be true | "Subscribed AND verified" |
| P OR Q | Disjunction | At least one true | "FREE tier OR trial active" |
| P → Q | Implication | If P then Q | "If PRO tier, then all agents available" |
| P ↔ Q | Biconditional | P if and only if Q | "Admin access iff role = admin" |

### Truth Tables

```python
def truth_table_and(p, q):
    return p and q

def truth_table_or(p, q):
    return p or q

def truth_table_implies(p, q):
    """P → Q is false ONLY when P is true and Q is false."""
    return (not p) or q

def truth_table_iff(p, q):
    return p == q

# Generate full truth table
print("P     Q     P→Q   P∧Q   P∨Q   P↔Q")
print("-" * 42)
for p in [True, False]:
    for q in [True, False]:
        impl = truth_table_implies(p, q)
        conj = truth_table_and(p, q)
        disj = truth_table_or(p, q)
        bicon = truth_table_iff(p, q)
        print(f"{str(p):5} {str(q):5} {str(impl):5} {str(conj):5} {str(disj):5} {str(bicon):5}")
```

### Implication: The Tricky One
"If P then Q" (P → Q) is counterintuitive because it's TRUE when P is false, regardless of Q.

- "If you're PRO, you get all agents" — if the user is FREE tier, the statement is still true (it just doesn't apply).
- The ONLY way P → Q is false: P is true AND Q is false.

```python
# Checking access rules as implications
def check_access_rule(user_tier, required_tier, has_access):
    """
    Rule: IF user_tier >= required_tier THEN has_access
    Violation: user meets requirement but doesn't have access
    """
    meets_requirement = user_tier >= required_tier
    # Implication: meets_requirement → has_access
    rule_satisfied = truth_table_implies(meets_requirement, has_access)

    if not rule_satisfied:
        return f"VIOLATION: User meets {required_tier} requirement but lacks access"
    return "OK"

# Tier ranking
tiers = {"FREE": 0, "STARTER": 1, "PLUS": 2, "SMART": 3, "PRO": 4}

# Test cases
print(check_access_rule(tiers["PRO"], tiers["SMART"], True))   # OK
print(check_access_rule(tiers["PRO"], tiers["SMART"], False))  # VIOLATION
print(check_access_rule(tiers["FREE"], tiers["SMART"], False)) # OK (doesn't meet req)
```

---

## Predicate Logic (First-Order Logic)

### Beyond True/False Propositions
Predicate logic adds variables and quantifiers:
- **For all (∀)**: "For ALL agents, if tier >= SMART, then agent is available"
- **There exists (∃)**: "There EXISTS an agent that can handle billing questions"

```python
# Predicate logic in code
agents = [
    {"name": "Agent 1", "tier": "FREE", "specialties": ["general"]},
    {"name": "Agent 15", "tier": "STARTER", "specialties": ["billing", "general"]},
    {"name": "Agent 30", "tier": "PLUS", "specialties": ["technical", "code"]},
    {"name": "Agent 39", "tier": "SMART", "specialties": ["analysis", "research"]},
]

tier_order = {"FREE": 0, "STARTER": 1, "PLUS": 2, "SMART": 3, "PRO": 4}

# ∀ agent: tier(agent) >= SMART → specialty_count(agent) >= 1
# "All SMART+ agents have at least one specialty"
def check_universal(agents, predicate):
    """Check if predicate holds for ALL agents."""
    return all(predicate(a) for a in agents)

universal_holds = check_universal(
    agents,
    lambda a: not (tier_order[a["tier"]] >= tier_order["SMART"]) or len(a["specialties"]) >= 1
)
print(f"All SMART+ agents have specialties: {universal_holds}")

# ∃ agent: "billing" ∈ specialties(agent)
# "There exists an agent that handles billing"
def check_existential(agents, predicate):
    """Check if predicate holds for at least one agent."""
    return any(predicate(a) for a in agents)

exists_billing = check_existential(
    agents,
    lambda a: "billing" in a["specialties"]
)
print(f"Billing agent exists: {exists_billing}")
```

### Quantifier Relationships
- NOT (∀x: P(x)) = ∃x: NOT P(x) — "Not all agents are fast" = "Some agent is slow"
- NOT (∃x: P(x)) = ∀x: NOT P(x) — "No agent handles billing" = "All agents lack billing"

---

## Common Logical Fallacies

### Fallacies That AI Systems Must Avoid

```python
fallacies = {
    "affirming_the_consequent": {
        "pattern": "P → Q. Q is true. Therefore P is true.",
        "example": "If it rains, the ground is wet. The ground is wet. Therefore it rained.",
        "why_wrong": "The ground could be wet for other reasons (sprinkler, spill).",
        "ai_risk": "Model sees Q (symptom) and assumes P (specific cause) without considering alternatives.",
    },
    "denying_the_antecedent": {
        "pattern": "P → Q. P is false. Therefore Q is false.",
        "example": "If you're PRO, you get all agents. You're not PRO. Therefore you don't get all agents.",
        "why_wrong": "Another condition might also grant all agents (admin, founder).",
        "ai_risk": "Model applies rules too narrowly, missing override conditions.",
    },
    "false_dichotomy": {
        "pattern": "Either A or B. Not A. Therefore B.",
        "example": "Either the API is down or the user made an error. API is up. Therefore user error.",
        "why_wrong": "Could be network issue, auth expiry, rate limit, etc.",
        "ai_risk": "Model presents only two options when many exist.",
    },
    "hasty_generalization": {
        "pattern": "X happened in cases A, B, C. Therefore X always happens.",
        "example": "Three users with Chrome reported the bug. Chrome must be the cause.",
        "why_wrong": "Small sample, confounding variables.",
        "ai_risk": "Model draws broad conclusions from limited retrieved context.",
    },
    "appeal_to_authority": {
        "pattern": "Expert says X. Therefore X is true.",
        "example": "The documentation says to use method A. Therefore method A is always correct.",
        "why_wrong": "Documentation can be outdated, wrong, or context-dependent.",
        "ai_risk": "Model trusts retrieved context without critical evaluation.",
    },
    "begging_the_question": {
        "pattern": "Assumes the conclusion in the premise.",
        "example": "This approach is best because it's the optimal solution.",
        "why_wrong": "Circular reasoning — 'best' and 'optimal' are the same claim.",
        "ai_risk": "Model generates confident-sounding tautologies.",
    },
    "straw_man": {
        "pattern": "Misrepresents the argument, then argues against the misrepresentation.",
        "example": "User asks 'Should we use Redis?' Model argues against 'replacing our entire database with Redis'",
        "why_wrong": "Nobody suggested replacing the entire database.",
        "ai_risk": "Model misinterprets query scope and argues against an extreme version.",
    },
}

def check_for_fallacy(reasoning_chain):
    """
    Heuristic check for common fallacies in a reasoning chain.
    Returns potential fallacy warnings.
    """
    warnings = []

    # Check for absolute language (hasty generalization risk)
    absolutes = ["always", "never", "every", "all", "none", "must"]
    for word in absolutes:
        if word in reasoning_chain.lower():
            warnings.append(
                f"Potential hasty generalization: '{word}' used — is this truly universal?"
            )

    # Check for false dichotomy
    if "either" in reasoning_chain.lower() and "or" in reasoning_chain.lower():
        warnings.append(
            "Potential false dichotomy: are there really only two options?"
        )

    # Check for circular reasoning
    sentences = reasoning_chain.split('. ')
    for i, s1 in enumerate(sentences):
        for j, s2 in enumerate(sentences):
            if i != j and len(s1) > 20 and len(s2) > 20:
                # Simple overlap check
                words1 = set(s1.lower().split())
                words2 = set(s2.lower().split())
                overlap = len(words1 & words2) / max(len(words1), len(words2))
                if overlap > 0.8:
                    warnings.append(
                        f"Potential circular reasoning: sentences {i+1} and {j+1} are very similar"
                    )

    return warnings
```

---

## Proof Strategies

### Direct Proof
To prove P → Q: Assume P is true, show Q follows.

### Proof by Contradiction
To prove P: Assume NOT P, show this leads to a contradiction.

```python
# Example: Prove that if n^2 is even, then n is even
# Proof by contradiction:
# Assume n^2 is even but n is odd.
# If n is odd, n = 2k+1 for some integer k.
# n^2 = (2k+1)^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1
# n^2 is odd. But we assumed n^2 is even. Contradiction!
# Therefore, if n^2 is even, n must be even.

def verify_even_square_rule(n):
    n_squared = n * n
    n_is_even = n % 2 == 0
    n_sq_is_even = n_squared % 2 == 0
    # Implication: n_sq_is_even → n_is_even
    return truth_table_implies(n_sq_is_even, n_is_even)

# Verify for many values
assert all(verify_even_square_rule(n) for n in range(-1000, 1000))
```

### Proof by Induction
To prove P(n) for all n >= base_case:
1. **Base case**: Show P(base_case) is true
2. **Inductive step**: Assume P(k) is true, show P(k+1) follows

### Proof by Counterexample
To DISPROVE "for all x, P(x)": find ONE x where P(x) is false.

```python
def disprove_by_counterexample(predicate, search_space):
    """Find a counterexample to disprove a universal claim."""
    for x in search_space:
        if not predicate(x):
            return f"Counterexample found: x={x}"
    return "No counterexample found (claim may be true)"

# Claim: "All prime numbers are odd"
def is_prime(n):
    if n < 2: return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0: return False
    return True

result = disprove_by_counterexample(
    lambda n: not is_prime(n) or n % 2 != 0,  # prime → odd
    range(2, 100)
)
print(result)  # Counterexample found: x=2 (2 is prime and even)
```

---

## Applications to AI Reasoning

### Structured Reasoning for Agents

```python
def logical_reasoning_prompt(query, context):
    """
    Structure an LLM prompt to encourage logical reasoning.
    """
    return f"""Answer the following question using logical reasoning.

CONTEXT:
{context}

QUESTION: {query}

Structure your answer as follows:
1. PREMISES: List the relevant facts from the context (numbered)
2. REASONING: Show step-by-step logical deduction from premises to conclusion
   - Each step should follow from previous steps via a named rule:
     - Modus Ponens: If P→Q and P, then Q
     - Modus Tollens: If P→Q and NOT Q, then NOT P
     - Conjunction: If P and Q, then P∧Q
     - Disjunction: If P, then P∨Q
     - Hypothetical Syllogism: If P→Q and Q→R, then P→R
3. CONCLUSION: State the final answer
4. CONFIDENCE: Rate 1-5 and note any assumptions or gaps

If any step requires information NOT in the context, explicitly state the assumption."""

# Example usage
query = "Can a PLUS tier user access Agent 35?"
context = """
- PLUS tier includes agents 1-30
- Agent 35 requires SMART tier or above
- SMART tier includes agents 1-39
"""

prompt = logical_reasoning_prompt(query, context)
# Expected logical chain:
# P1: PLUS tier includes agents 1-30 (from context)
# P2: Agent 35 requires SMART tier or above (from context)
# P3: PLUS tier < SMART tier (background knowledge / assumption)
# C1: PLUS tier does not include Agent 35 (from P1, Agent 35 > 30)
# C2: PLUS user cannot access Agent 35 (Modus Ponens on P2 + C1)
```

### Consistency Checking

```python
def check_consistency(statements):
    """
    Check a set of statements for logical consistency.
    Returns contradictions found.
    """
    contradictions = []

    for i, s1 in enumerate(statements):
        for j, s2 in enumerate(statements):
            if i >= j:
                continue

            # Simple negation check
            if s1.lower().startswith("not ") and s1[4:].lower() == s2.lower():
                contradictions.append((s1, s2, "Direct negation"))
            elif s2.lower().startswith("not ") and s2[4:].lower() == s1.lower():
                contradictions.append((s1, s2, "Direct negation"))

            # Numeric contradiction check
            # "X is 5" vs "X is 10"
            import re
            pattern = r'^(\w+)\s+is\s+(\d+)$'
            m1 = re.match(pattern, s1, re.IGNORECASE)
            m2 = re.match(pattern, s2, re.IGNORECASE)
            if m1 and m2 and m1.group(1).lower() == m2.group(1).lower():
                if m1.group(2) != m2.group(2):
                    contradictions.append((s1, s2, f"Numeric contradiction: {m1.group(1)}"))

    return contradictions

# Test
statements = [
    "The free tier has 4 agents",
    "All agents require subscription",
    "The free tier has 6 agents",  # Contradicts statement 1
    "Free users can access agents",  # Contradicts statement 2
]

for s1, s2, reason in check_consistency(statements):
    print(f"CONTRADICTION ({reason}):\n  '{s1}'\n  '{s2}'")
```

---

## De Morgan's Laws

Essential for simplifying conditions in code and logic:

```
NOT (A AND B) = (NOT A) OR (NOT B)
NOT (A OR B) = (NOT A) AND (NOT B)
```

```python
# In code: simplifying access checks
# Original: NOT (isSubscribed AND isVerified)
# Equivalent: NOT isSubscribed OR NOT isVerified

def check_access_original(is_subscribed, is_verified):
    return not (is_subscribed and is_verified)

def check_access_demorgan(is_subscribed, is_verified):
    return (not is_subscribed) or (not is_verified)

# Verify equivalence
for s in [True, False]:
    for v in [True, False]:
        assert check_access_original(s, v) == check_access_demorgan(s, v)
```

---

## Decision Logic for Agents

```python
def evaluate_decision_tree(conditions, rules):
    """
    Evaluate a set of logical rules against conditions.
    Rules are (condition_expression, action) pairs.
    """
    results = []

    for rule_name, condition_fn, action in rules:
        try:
            if condition_fn(conditions):
                results.append({
                    "rule": rule_name,
                    "triggered": True,
                    "action": action,
                })
        except Exception as e:
            results.append({
                "rule": rule_name,
                "triggered": False,
                "error": str(e),
            })

    return results

# Example: Agent routing rules
rules = [
    ("billing_query",
     lambda c: c.get("intent") == "billing" and c.get("tier") != "FREE",
     "route_to_billing_agent"),

    ("technical_query",
     lambda c: c.get("intent") == "technical" and c.get("has_code", False),
     "route_to_code_agent"),

    ("escalation",
     lambda c: c.get("sentiment_score", 0) < -0.5 or c.get("attempt_count", 0) > 3,
     "route_to_senior_agent"),

    ("default",
     lambda c: True,
     "route_to_general_agent"),
]

conditions = {
    "intent": "billing",
    "tier": "PLUS",
    "sentiment_score": -0.2,
    "attempt_count": 1,
}

triggered = evaluate_decision_tree(conditions, rules)
for r in triggered:
    if r["triggered"]:
        print(f"Rule '{r['rule']}' → {r['action']}")
```

---

## Key Takeaways

- Every AI response involves implicit logical reasoning. Making it explicit improves accuracy.
- Implication (P → Q) is the most misunderstood logical operator — it's only false when P is true and Q is false.
- Logical fallacies are failure modes for LLMs. Train your prompts to avoid them by requiring structured reasoning.
- Proof by contradiction is a powerful debugging technique — assume the opposite and find where it breaks.
- De Morgan's laws simplify complex boolean conditions in code and access rules.
- Consistency checking between retrieved context chunks catches contradictions before the LLM does (or doesn't).
- Predicate logic with quantifiers (∀, ∃) maps directly to database queries and access control policies.
