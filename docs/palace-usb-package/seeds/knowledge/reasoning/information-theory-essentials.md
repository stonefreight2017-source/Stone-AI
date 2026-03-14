# Information Theory Essentials

## Purpose
Information theory is the mathematical foundation of language models. Cross-entropy loss — the function every LLM is trained to minimize — comes directly from information theory. Understanding entropy, cross-entropy, KL divergence, and perplexity lets you reason about why language models work, how to evaluate them, and what their outputs mean.

---

## Entropy: Measuring Uncertainty

### Intuition
Entropy measures HOW UNCERTAIN you are about an outcome. High entropy = many equally likely outcomes. Low entropy = one outcome dominates.

- Coin flip: HIGH entropy (2 equally likely outcomes)
- Loaded die that always lands on 6: LOW entropy (1 outcome dominates)
- English text: MEDIUM entropy (some letters/words are much more common than others)

### Formula
For a discrete probability distribution P:

```
H(P) = -Σ P(x) * log2(P(x))
```

### Python Implementation

```python
import numpy as np

def entropy(probs):
    """Calculate entropy of a probability distribution in bits."""
    probs = np.array(probs)
    # Filter out zeros to avoid log(0)
    nonzero = probs[probs > 0]
    return -np.sum(nonzero * np.log2(nonzero))

# Fair coin: maximum entropy for 2 outcomes
print(f"Fair coin: {entropy([0.5, 0.5]):.4f} bits")  # 1.0 bit

# Loaded coin (90% heads)
print(f"Loaded coin: {entropy([0.9, 0.1]):.4f} bits")  # 0.469 bits

# Fair die: maximum entropy for 6 outcomes
print(f"Fair die: {entropy([1/6]*6):.4f} bits")  # 2.585 bits

# Loaded die (always 6)
print(f"Loaded die: {entropy([0, 0, 0, 0, 0, 1]):.4f} bits")  # 0 bits

# English text: approximately 1.0-1.5 bits per character
# (much less than 4.7 bits for uniform over 26 letters)
# This is why compression works — English is redundant
```

### Maximum Entropy
For n outcomes, maximum entropy is log2(n) (when all outcomes are equally likely). This is the theoretical maximum uncertainty.

```python
# Maximum entropy = uniform distribution
n_outcomes = 50257  # GPT-2 vocabulary size
max_entropy = np.log2(n_outcomes)
print(f"Max entropy for {n_outcomes} tokens: {max_entropy:.2f} bits")
# ~15.6 bits — if the model had no idea what token comes next
```

---

## Cross-Entropy: Measuring Model Quality

### Intuition
Cross-entropy measures how well your model's predicted distribution Q matches the true distribution P. Lower is better.

- If Q = P: cross-entropy equals entropy (the best possible)
- If Q is wrong: cross-entropy is HIGHER than entropy (the penalty for being wrong)

### Formula
```
H(P, Q) = -Σ P(x) * log(Q(x))
```

### Why It's THE Loss Function for Language Models

```python
def cross_entropy(true_distribution, predicted_distribution):
    """Cross-entropy between true distribution P and predicted Q."""
    p = np.array(true_distribution)
    q = np.array(predicted_distribution)
    # Clip to avoid log(0)
    q = np.clip(q, 1e-15, 1.0)
    return -np.sum(p * np.log(q))

# The model predicts the next token
# True answer: token "cat" (one-hot: P = [0, 0, 1, 0, 0])
# Model prediction Q = [0.1, 0.05, 0.7, 0.1, 0.05]

true = [0, 0, 1, 0, 0]  # "cat" is the true next token
pred_good = [0.1, 0.05, 0.7, 0.1, 0.05]   # Good model
pred_bad = [0.3, 0.3, 0.1, 0.2, 0.1]       # Bad model
pred_perfect = [0, 0, 1, 0, 0]              # Perfect model

print(f"Good model CE: {cross_entropy(true, pred_good):.4f}")     # 0.3567
print(f"Bad model CE: {cross_entropy(true, pred_bad):.4f}")       # 2.3026
print(f"Perfect model CE: {cross_entropy(true, pred_perfect):.4f}") # 0.0000

# For one-hot true distributions, cross-entropy simplifies to:
# CE = -log(Q(correct_token))
# This is why we often see "negative log likelihood" (NLL) — it's the same thing
```

### Cross-Entropy in Practice (Token by Token)

```python
def sequence_cross_entropy(token_ids, model_logits):
    """
    Calculate cross-entropy loss for a sequence.
    token_ids: list of true token IDs
    model_logits: list of logit vectors (one per position)
    """
    total_loss = 0
    for i in range(len(token_ids)):
        # Softmax to get probabilities
        logits = model_logits[i]
        probs = np.exp(logits) / np.sum(np.exp(logits))

        # Cross-entropy for this token
        true_token = token_ids[i]
        token_loss = -np.log(probs[true_token] + 1e-15)
        total_loss += token_loss

    avg_loss = total_loss / len(token_ids)
    return avg_loss
```

---

## KL Divergence: Measuring Distribution Difference

### Intuition
KL divergence measures how different distribution Q is from distribution P. It's the "extra bits" needed when you use Q to encode data that actually follows P.

### Formula
```
KL(P || Q) = Σ P(x) * log(P(x) / Q(x))
```

### Key Properties
- **KL >= 0**: Always non-negative
- **KL = 0**: Only when P = Q
- **NOT symmetric**: KL(P||Q) != KL(Q||P)
- **Cross-entropy = Entropy + KL divergence**: H(P,Q) = H(P) + KL(P||Q)

```python
def kl_divergence(p, q):
    """KL divergence from Q to P: KL(P || Q)."""
    p = np.array(p, dtype=float)
    q = np.array(q, dtype=float)
    # Filter where p > 0
    mask = p > 0
    q_safe = np.clip(q[mask], 1e-15, 1.0)
    return np.sum(p[mask] * np.log(p[mask] / q_safe))

# How different are these distributions?
p = [0.4, 0.3, 0.2, 0.1]  # True distribution
q1 = [0.35, 0.30, 0.20, 0.15]  # Close approximation
q2 = [0.25, 0.25, 0.25, 0.25]  # Uniform (farther)
q3 = [0.1, 0.1, 0.1, 0.7]      # Very wrong

print(f"KL(P || Q1) = {kl_divergence(p, q1):.6f}")  # Small
print(f"KL(P || Q2) = {kl_divergence(p, q2):.6f}")  # Medium
print(f"KL(P || Q3) = {kl_divergence(p, q3):.6f}")  # Large

# Note: KL is asymmetric
print(f"KL(Q1 || P) = {kl_divergence(q1, p):.6f}")  # Different!
```

### KL Divergence in ML Applications
- **Knowledge distillation**: Minimize KL between teacher and student model outputs
- **VAE training**: KL term pushes the latent distribution toward a prior (usually Gaussian)
- **Reinforcement learning from human feedback (RLHF)**: KL penalty prevents the model from drifting too far from the base model

```python
# Knowledge distillation: train small model to match large model
def distillation_loss(teacher_probs, student_logits, temperature=2.0):
    """
    Soft targets from teacher, hard training for student.
    Higher temperature → softer probability distribution.
    """
    # Soften teacher probabilities
    teacher_soft = np.power(teacher_probs, 1/temperature)
    teacher_soft = teacher_soft / np.sum(teacher_soft)

    # Soften student probabilities
    student_soft = np.exp(student_logits / temperature)
    student_soft = student_soft / np.sum(student_soft)

    # KL divergence (or equivalently, cross-entropy since teacher is fixed)
    return kl_divergence(teacher_soft, student_soft) * temperature**2
```

---

## Mutual Information

### Intuition
Mutual information measures how much knowing X tells you about Y (and vice versa). It's the reduction in uncertainty about Y when you observe X.

### Formula
```
I(X; Y) = H(X) + H(Y) - H(X, Y)
```

Or equivalently:
```
I(X; Y) = KL(P(X,Y) || P(X)*P(Y))
```

If X and Y are independent, mutual information = 0 (knowing X tells you nothing about Y).

```python
def mutual_information(joint_probs):
    """
    Calculate mutual information from joint probability table.
    joint_probs: 2D array where joint_probs[i][j] = P(X=i, Y=j)
    """
    joint = np.array(joint_probs)

    # Marginal distributions
    p_x = np.sum(joint, axis=1)
    p_y = np.sum(joint, axis=0)

    mi = 0
    for i in range(joint.shape[0]):
        for j in range(joint.shape[1]):
            if joint[i, j] > 0:
                mi += joint[i, j] * np.log2(
                    joint[i, j] / (p_x[i] * p_y[j])
                )
    return mi

# Example: Query type vs. retrieval source
# Are certain query types more likely to use certain retrieval sources?
joint = [
    [0.20, 0.05, 0.01],  # Factual queries: mostly use docs, rarely code
    [0.05, 0.15, 0.10],  # Technical queries: use docs, code, and API
    [0.02, 0.02, 0.40],  # Code queries: mostly use code source
]

mi = mutual_information(joint)
print(f"Mutual information: {mi:.4f} bits")
# High MI → query type strongly predicts the best retrieval source
# This justifies query routing in agentic RAG
```

---

## Perplexity: The Practical Metric

### What Is Perplexity?
Perplexity is the exponential of cross-entropy. It represents the "effective number of choices" the model is considering at each step.

```
Perplexity = 2^(cross-entropy)    [if using log base 2]
Perplexity = e^(cross-entropy)    [if using natural log]
```

### Interpretation
- **Perplexity = 1**: Model is perfectly certain (always predicts the right token)
- **Perplexity = 10**: Model is "choosing between 10 equally likely options" on average
- **Perplexity = 50000**: Model has no idea (close to uniform over vocabulary)

```python
def perplexity(cross_entropy_loss):
    """Convert cross-entropy loss to perplexity."""
    return np.exp(cross_entropy_loss)

# GPT-2 on WikiText-103: perplexity ≈ 29
# GPT-3 175B: perplexity ≈ 20
# GPT-4 class: perplexity ≈ 10-15 (estimated)

# What this means:
ppl = 29
print(f"Perplexity {ppl}: Model is effectively choosing between {ppl:.0f} tokens at each step")

# Lower perplexity = better model
# But perplexity depends on the test set! Only compare on the same data.
```

### Using Perplexity for RAG Evaluation

```python
def evaluate_rag_with_perplexity(
    questions,
    answers_with_context,
    answers_without_context,
    model
):
    """
    Compare perplexity of answers WITH and WITHOUT retrieved context.
    Lower perplexity with context = RAG is helping.
    """
    ppl_with = []
    ppl_without = []

    for q, a_with, a_without in zip(questions, answers_with_context, answers_without_context):
        ce_with = model.compute_cross_entropy(q + a_with)
        ce_without = model.compute_cross_entropy(q + a_without)

        ppl_with.append(perplexity(ce_with))
        ppl_without.append(perplexity(ce_without))

    avg_with = np.mean(ppl_with)
    avg_without = np.mean(ppl_without)

    print(f"Avg perplexity WITH context: {avg_with:.2f}")
    print(f"Avg perplexity WITHOUT context: {avg_without:.2f}")
    print(f"Reduction: {(1 - avg_with/avg_without)*100:.1f}%")
```

---

## Temperature Sampling and Information Theory

### What Temperature Does

```python
def apply_temperature(logits, temperature):
    """
    Temperature controls the entropy of the output distribution.
    T < 1: Lower entropy → more deterministic (peaks sharpen)
    T = 1: Original distribution
    T > 1: Higher entropy → more random (distribution flattens)
    T → 0: Argmax (greedy, zero entropy)
    T → ∞: Uniform (maximum entropy)
    """
    scaled = np.array(logits) / temperature
    probs = np.exp(scaled) / np.sum(np.exp(scaled))
    return probs

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])

for temp in [0.1, 0.5, 1.0, 1.5, 3.0]:
    probs = apply_temperature(logits, temp)
    ent = entropy(probs)
    print(f"T={temp:.1f}: top_prob={probs[0]:.4f}, entropy={ent:.4f} bits")

# T=0.1: top_prob=1.0000, entropy≈0 → greedy
# T=0.5: top_prob=0.8756, entropy≈0.8
# T=1.0: top_prob=0.4660, entropy≈1.8
# T=1.5: top_prob=0.3282, entropy≈2.1
# T=3.0: top_prob=0.2498, entropy≈2.3 → approaching uniform
```

---

## Connections to RAG

| Concept | RAG Application |
|---|---|
| Entropy | Measures uncertainty in retrieval scores — high entropy = no clear winner |
| Cross-entropy | The loss function your LLM minimizes during training |
| KL divergence | Measures how much your retrieval distribution deviates from the ideal |
| Mutual information | Quantifies the dependency between query type and best retrieval source |
| Perplexity | Evaluates answer quality — lower perplexity = more natural/confident answers |
| Temperature | Controls creativity vs accuracy tradeoff in generation |

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| Comparing perplexity across datasets | Perplexity depends on test data difficulty | Only compare on the SAME dataset |
| Using cross-entropy without understanding scale | CE of 3.5 vs 2.1 — is that good? | Convert to perplexity for intuition |
| Ignoring KL divergence in fine-tuning | Model can drift catastrophically from base | Add KL penalty term |
| Temperature = 0 for all tasks | Kills diversity, bad for creative tasks | Use 0.0-0.3 for factual, 0.7-1.0 for creative |
| Treating entropy as "bad" | High entropy in retrieval scores means you should get more candidates, not fewer | Use entropy as a signal to adjust retrieval depth |

---

## Key Takeaways

- Cross-entropy loss IS the connection between information theory and ML training. Every LLM training step minimizes cross-entropy.
- Perplexity converts cross-entropy to an interpretable number — "how many tokens is the model choosing between."
- KL divergence measures model drift and is critical for knowledge distillation, RLHF, and fine-tuning stability.
- Mutual information quantifies dependencies between variables — use it to validate that query routing actually helps.
- Temperature is an entropy knob — lower = more certain, higher = more random.
- Information theory gives you the language to reason about model quality, not just measure it.
