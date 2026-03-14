# RAG Evaluation Frameworks

## Purpose
You cannot improve what you cannot measure. RAG systems fail silently — the LLM generates confident-sounding answers from irrelevant context, and nobody notices until a user complains. This seed covers systematic evaluation: RAGAS metrics, custom eval pipelines, LLM-as-judge, regression testing, A/B testing retrieval, and chunk quality measurement.

---

## The RAG Evaluation Stack

```
Level 1: Component Evaluation (retrieval quality, generation quality — isolated)
Level 2: End-to-End Evaluation (full pipeline — query to answer)
Level 3: Production Monitoring (live traffic — drift, failures, latency)
Level 4: User Feedback Loop (thumbs up/down, corrections, escalations)
```

Each level catches different failure modes. You need all four.

---

## RAGAS Framework (Retrieval Augmented Generation Assessment)

RAGAS provides four core metrics that evaluate RAG without needing ground-truth answers for every query.

### Metric 1: Faithfulness
**Question**: Is the generated answer supported by the retrieved context?
**Range**: 0 to 1 (1 = fully faithful)
**Catches**: Hallucination — LLM inventing facts not in the context

```typescript
interface FaithfulnessEvaluation {
  query: string;
  answer: string;
  contexts: string[];
  score: number;
  unsupportedClaims: string[];
}

async function evaluateFaithfulness(
  query: string,
  answer: string,
  contexts: string[],
  llmEndpoint: string
): Promise<FaithfulnessEvaluation> {
  // Step 1: Extract claims from the answer
  const claimExtractionPrompt = `Given this answer, extract every factual claim as a separate statement.
Answer: ${answer}
Output each claim on a new line, prefixed with "CLAIM: "`;

  const claimsResponse = await callLLM(claimExtractionPrompt, llmEndpoint);
  const claims = claimsResponse
    .split('\n')
    .filter((l: string) => l.startsWith('CLAIM: '))
    .map((l: string) => l.replace('CLAIM: ', ''));

  // Step 2: Verify each claim against contexts
  const unsupportedClaims: string[] = [];
  let supportedCount = 0;

  for (const claim of claims) {
    const verifyPrompt = `Given the following context, determine if the claim is supported.
Context: ${contexts.join('\n---\n')}
Claim: ${claim}
Answer ONLY "supported" or "unsupported".`;

    const verdict = await callLLM(verifyPrompt, llmEndpoint);
    if (verdict.trim().toLowerCase() === 'supported') {
      supportedCount++;
    } else {
      unsupportedClaims.push(claim);
    }
  }

  const score = claims.length > 0 ? supportedCount / claims.length : 1;
  return { query, answer, contexts, score, unsupportedClaims };
}
```

### Metric 2: Answer Relevancy
**Question**: Does the answer actually address the query?
**Range**: 0 to 1 (1 = perfectly relevant)
**Catches**: Off-topic answers, tangential responses

```typescript
async function evaluateAnswerRelevancy(
  query: string,
  answer: string,
  llmEndpoint: string,
  numGenerations: number = 3
): Promise<number> {
  // Generate hypothetical questions that the answer would address
  const generatedQueries: string[] = [];

  for (let i = 0; i < numGenerations; i++) {
    const prompt = `Given this answer, generate a question that this answer would be a good response to.
Answer: ${answer}
Generate ONLY the question, nothing else.`;

    const generatedQuery = await callLLM(prompt, llmEndpoint);
    generatedQueries.push(generatedQuery.trim());
  }

  // Compare embeddings of generated questions to original query
  const queryEmbedding = await getEmbedding(query);
  const similarities = await Promise.all(
    generatedQueries.map(async (gq) => {
      const gqEmbedding = await getEmbedding(gq);
      return cosineSimilarity(queryEmbedding, gqEmbedding);
    })
  );

  return similarities.reduce((a, b) => a + b, 0) / similarities.length;
}
```

### Metric 3: Context Precision
**Question**: Are the retrieved contexts actually relevant to the query?
**Range**: 0 to 1 (1 = all contexts relevant)
**Catches**: Retrieval returning noise

```typescript
async function evaluateContextPrecision(
  query: string,
  contexts: string[],
  llmEndpoint: string
): Promise<{ score: number; relevancePerContext: boolean[] }> {
  const relevancePerContext: boolean[] = [];

  for (const context of contexts) {
    const prompt = `Given the query and context below, is this context relevant and useful for answering the query?
Query: ${query}
Context: ${context}
Answer ONLY "relevant" or "irrelevant".`;

    const verdict = await callLLM(prompt, llmEndpoint);
    relevancePerContext.push(verdict.trim().toLowerCase() === 'relevant');
  }

  // Weighted by position — earlier contexts matter more (DCG-style)
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < relevancePerContext.length; i++) {
    const weight = 1 / Math.log2(i + 2); // DCG weighting
    weightedSum += relevancePerContext[i] ? weight : 0;
    weightTotal += weight;
  }

  return {
    score: weightTotal > 0 ? weightedSum / weightTotal : 0,
    relevancePerContext,
  };
}
```

### Metric 4: Context Recall
**Question**: Did retrieval find ALL the relevant information needed?
**Range**: 0 to 1 (1 = nothing missed)
**Catches**: Incomplete retrieval — answer is correct but missing important details
**Requires**: Ground truth answer or reference answer

```typescript
async function evaluateContextRecall(
  query: string,
  contexts: string[],
  groundTruthAnswer: string,
  llmEndpoint: string
): Promise<number> {
  // Extract statements from ground truth
  const extractPrompt = `Extract every factual statement from this answer.
Answer: ${groundTruthAnswer}
Output each statement on a new line, prefixed with "STMT: "`;

  const stmtsResponse = await callLLM(extractPrompt, llmEndpoint);
  const statements = stmtsResponse
    .split('\n')
    .filter((l: string) => l.startsWith('STMT: '))
    .map((l: string) => l.replace('STMT: ', ''));

  let attributedCount = 0;
  for (const stmt of statements) {
    const checkPrompt = `Can the following statement be attributed to (found in) any of the given contexts?
Statement: ${stmt}
Contexts: ${contexts.join('\n---\n')}
Answer ONLY "yes" or "no".`;

    const verdict = await callLLM(checkPrompt, llmEndpoint);
    if (verdict.trim().toLowerCase() === 'yes') attributedCount++;
  }

  return statements.length > 0 ? attributedCount / statements.length : 1;
}
```

---

## LLM-as-Judge

### Why Use LLM-as-Judge
- Ground truth labels are expensive and slow to create
- Human evaluation doesn't scale beyond 100s of examples
- LLMs correlate well with human judgment when prompted correctly (0.8+ correlation in studies)

### The Rubric Pattern

```typescript
interface JudgmentResult {
  score: number;          // 1-5
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

async function llmJudge(
  query: string,
  answer: string,
  contexts: string[],
  llmEndpoint: string
): Promise<JudgmentResult> {
  const prompt = `You are an expert evaluator for a question-answering system.

QUERY: ${query}

RETRIEVED CONTEXT:
${contexts.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}

GENERATED ANSWER: ${answer}

Evaluate the answer on a scale of 1-5 using this rubric:

5 - EXCELLENT: Fully answers the query, all claims supported by context, well-organized, no hallucination
4 - GOOD: Mostly answers the query, minor gaps, all major claims supported
3 - ADEQUATE: Partially answers the query, some unsupported claims or missing key information
2 - POOR: Barely addresses the query, significant hallucination or missing information
1 - TERRIBLE: Wrong answer, major hallucination, or completely off-topic

Respond in this exact JSON format:
{
  "score": <number 1-5>,
  "reasoning": "<2-3 sentences explaining the score>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"]
}`;

  const response = await callLLM(prompt, llmEndpoint);
  return JSON.parse(response);
}
```

### Anti-Patterns for LLM-as-Judge
- **Position bias**: LLMs prefer the first option in A/B comparisons. Randomize order.
- **Verbosity bias**: Longer answers get higher scores. Control for length in your rubric.
- **Self-preference**: GPT-4 rates GPT-4 outputs higher. Use a different model as judge than as generator.
- **No rubric**: "Rate this answer 1-10" produces inconsistent results. Always provide explicit criteria.

---

## Custom Evaluation Pipeline

### Building a Test Suite

```typescript
interface EvalTestCase {
  id: string;
  query: string;
  expectedAnswer?: string;          // Ground truth (optional)
  requiredContextIds?: string[];     // Chunks that MUST be retrieved
  forbiddenPatterns?: string[];      // Patterns that must NOT appear in answer
  minFaithfulness?: number;          // Per-case threshold override
  category: string;                  // For stratified analysis
}

interface EvalResult {
  testCase: EvalTestCase;
  retrievedContexts: string[];
  generatedAnswer: string;
  metrics: {
    faithfulness: number;
    answerRelevancy: number;
    contextPrecision: number;
    contextRecall?: number;
    latencyMs: number;
    tokenCount: number;
  };
  passed: boolean;
  failureReasons: string[];
}

async function runEvalSuite(
  testCases: EvalTestCase[],
  ragPipeline: (query: string) => Promise<{ answer: string; contexts: string[] }>,
  llmEndpoint: string
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const tc of testCases) {
    const start = Date.now();
    const { answer, contexts } = await ragPipeline(tc.query);
    const latencyMs = Date.now() - start;

    // Run all metrics in parallel
    const [faithfulness, answerRelevancy, contextPrecision, contextRecall] =
      await Promise.all([
        evaluateFaithfulness(tc.query, answer, contexts, llmEndpoint),
        evaluateAnswerRelevancy(tc.query, answer, llmEndpoint),
        evaluateContextPrecision(tc.query, contexts, llmEndpoint),
        tc.expectedAnswer
          ? evaluateContextRecall(tc.query, contexts, tc.expectedAnswer, llmEndpoint)
          : Promise.resolve(undefined),
      ]);

    const failureReasons: string[] = [];

    // Check faithfulness threshold
    const faithThreshold = tc.minFaithfulness ?? 0.8;
    if (faithfulness.score < faithThreshold) {
      failureReasons.push(
        `Faithfulness ${faithfulness.score.toFixed(2)} < ${faithThreshold}`
      );
    }

    // Check forbidden patterns
    for (const pattern of tc.forbiddenPatterns ?? []) {
      if (answer.toLowerCase().includes(pattern.toLowerCase())) {
        failureReasons.push(`Forbidden pattern found: "${pattern}"`);
      }
    }

    results.push({
      testCase: tc,
      retrievedContexts: contexts,
      generatedAnswer: answer,
      metrics: {
        faithfulness: faithfulness.score,
        answerRelevancy,
        contextPrecision: contextPrecision.score,
        contextRecall: contextRecall,
        latencyMs,
        tokenCount: answer.split(/\s+/).length, // rough estimate
      },
      passed: failureReasons.length === 0,
      failureReasons,
    });
  }

  return results;
}
```

### Generating Reports

```typescript
function generateEvalReport(results: EvalResult[]): string {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  const avgMetrics = {
    faithfulness: avg(results.map((r) => r.metrics.faithfulness)),
    answerRelevancy: avg(results.map((r) => r.metrics.answerRelevancy)),
    contextPrecision: avg(results.map((r) => r.metrics.contextPrecision)),
    latencyMs: avg(results.map((r) => r.metrics.latencyMs)),
  };

  // Group by category
  const byCategory = new Map<string, EvalResult[]>();
  for (const r of results) {
    const cat = r.testCase.category;
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), r]);
  }

  let report = `## RAG Evaluation Report\n`;
  report += `Pass Rate: ${passed}/${total} (${passRate}%)\n\n`;
  report += `### Aggregate Metrics\n`;
  report += `| Metric | Score |\n|--------|-------|\n`;
  report += `| Faithfulness | ${avgMetrics.faithfulness.toFixed(3)} |\n`;
  report += `| Answer Relevancy | ${avgMetrics.answerRelevancy.toFixed(3)} |\n`;
  report += `| Context Precision | ${avgMetrics.contextPrecision.toFixed(3)} |\n`;
  report += `| Avg Latency | ${avgMetrics.latencyMs.toFixed(0)}ms |\n\n`;

  report += `### By Category\n`;
  for (const [cat, catResults] of byCategory) {
    const catPassed = catResults.filter((r) => r.passed).length;
    report += `- **${cat}**: ${catPassed}/${catResults.length} passed\n`;
  }

  // Worst performers
  const failures = results.filter((r) => !r.passed);
  if (failures.length > 0) {
    report += `\n### Failures\n`;
    for (const f of failures.slice(0, 10)) {
      report += `- [${f.testCase.id}] "${f.testCase.query}" — ${f.failureReasons.join('; ')}\n`;
    }
  }

  return report;
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
```

---

## Regression Testing for RAG

### The Problem
You change chunking strategy, embedding model, or prompt template — how do you know you didn't break existing good results?

### Solution: Golden Set + CI Integration

```typescript
interface RegressionResult {
  improved: string[];     // Test cases that got better
  regressed: string[];    // Test cases that got worse
  stable: string[];       // Test cases unchanged
  newPassRate: number;
  oldPassRate: number;
  delta: number;
}

async function regressionTest(
  goldenResults: EvalResult[],
  newResults: EvalResult[],
  regressionThreshold: number = 0.05
): Promise<RegressionResult> {
  const improved: string[] = [];
  const regressed: string[] = [];
  const stable: string[] = [];

  const goldenMap = new Map(goldenResults.map((r) => [r.testCase.id, r]));

  for (const newResult of newResults) {
    const golden = goldenMap.get(newResult.testCase.id);
    if (!golden) continue;

    const oldScore = golden.metrics.faithfulness * 0.4 +
      golden.metrics.answerRelevancy * 0.3 +
      golden.metrics.contextPrecision * 0.3;

    const newScore = newResult.metrics.faithfulness * 0.4 +
      newResult.metrics.answerRelevancy * 0.3 +
      newResult.metrics.contextPrecision * 0.3;

    const delta = newScore - oldScore;

    if (delta > regressionThreshold) {
      improved.push(newResult.testCase.id);
    } else if (delta < -regressionThreshold) {
      regressed.push(newResult.testCase.id);
    } else {
      stable.push(newResult.testCase.id);
    }
  }

  const oldPassRate = goldenResults.filter((r) => r.passed).length / goldenResults.length;
  const newPassRate = newResults.filter((r) => r.passed).length / newResults.length;

  return {
    improved,
    regressed,
    stable,
    newPassRate,
    oldPassRate,
    delta: newPassRate - oldPassRate,
  };
}
```

---

## A/B Testing Retrieval Strategies

```typescript
interface ABTestConfig {
  name: string;
  controlPipeline: (query: string) => Promise<{ answer: string; contexts: string[] }>;
  treatmentPipeline: (query: string) => Promise<{ answer: string; contexts: string[] }>;
  trafficSplit: number; // 0-1, fraction going to treatment
  queries: string[];
  minSampleSize: number;
}

async function runABTest(config: ABTestConfig): Promise<{
  controlMetrics: Record<string, number>;
  treatmentMetrics: Record<string, number>;
  pValue: number;
  significant: boolean;
  recommendation: string;
}> {
  const controlResults: number[] = [];
  const treatmentResults: number[] = [];

  for (const query of config.queries) {
    const useTreatment = Math.random() < config.trafficSplit;
    const pipeline = useTreatment ? config.treatmentPipeline : config.controlPipeline;

    const { answer, contexts } = await pipeline(query);
    // Use a composite quality score
    const score = await compositeQualityScore(query, answer, contexts);

    if (useTreatment) {
      treatmentResults.push(score);
    } else {
      controlResults.push(score);
    }
  }

  const controlMean = avg(controlResults);
  const treatmentMean = avg(treatmentResults);
  const pValue = welchTTest(controlResults, treatmentResults);
  const significant = pValue < 0.05;

  return {
    controlMetrics: { mean: controlMean, n: controlResults.length },
    treatmentMetrics: { mean: treatmentMean, n: treatmentResults.length },
    pValue,
    significant,
    recommendation: significant
      ? treatmentMean > controlMean
        ? 'SHIP treatment — statistically significant improvement'
        : 'KEEP control — treatment is significantly worse'
      : 'INCONCLUSIVE — need more data or larger effect',
  };
}

// Welch's t-test for unequal sample sizes
function welchTTest(a: number[], b: number[]): number {
  const meanA = avg(a);
  const meanB = avg(b);
  const varA = variance(a);
  const varB = variance(b);
  const nA = a.length;
  const nB = b.length;

  const t = (meanA - meanB) / Math.sqrt(varA / nA + varB / nB);
  const df = Math.pow(varA / nA + varB / nB, 2) /
    (Math.pow(varA / nA, 2) / (nA - 1) + Math.pow(varB / nB, 2) / (nB - 1));

  // Approximate p-value using normal distribution for large df
  return 2 * (1 - normalCDF(Math.abs(t)));
}

function variance(nums: number[]): number {
  const m = avg(nums);
  return nums.reduce((sum, n) => sum + (n - m) ** 2, 0) / (nums.length - 1);
}

function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 +
    t * (-1.453152027 + t * 1.061405429))));
  const result = 1 - poly * Math.exp(-x * x);
  return x >= 0 ? result : -result;
}
```

---

## Chunk Quality Measurement

### Pre-Retrieval: Measuring Chunk Quality at Ingestion Time

```typescript
interface ChunkQualityMetrics {
  chunkId: string;
  selfContainment: number;    // Can the chunk be understood alone?
  informationDensity: number; // Ratio of meaningful content to filler
  coherence: number;          // Does the chunk flow logically?
  boundaryQuality: number;    // Was it split at a natural boundary?
}

async function assessChunkQuality(
  chunk: string,
  sourceDocument: string,
  llmEndpoint: string
): Promise<ChunkQualityMetrics> {
  const prompt = `Evaluate this text chunk on 4 dimensions (score 1-5 each):

CHUNK:
${chunk}

1. SELF-CONTAINMENT: Can a reader understand this chunk without additional context? (5=fully standalone, 1=incomprehensible alone)
2. INFORMATION DENSITY: How much useful, specific information per sentence? (5=every sentence adds value, 1=mostly filler/boilerplate)
3. COHERENCE: Does the text flow logically from start to end? (5=perfect flow, 1=random sentences)
4. BOUNDARY QUALITY: Does the chunk start and end at natural boundaries? (5=clean paragraph/section breaks, 1=mid-sentence cuts)

Respond as JSON: {"selfContainment": N, "informationDensity": N, "coherence": N, "boundaryQuality": N}`;

  const response = await callLLM(prompt, llmEndpoint);
  const scores = JSON.parse(response);

  return {
    chunkId: generateChunkId(chunk),
    selfContainment: scores.selfContainment / 5,
    informationDensity: scores.informationDensity / 5,
    coherence: scores.coherence / 5,
    boundaryQuality: scores.boundaryQuality / 5,
  };
}
```

---

## Decision Matrix: Which Metrics When

| Situation | Primary Metrics | Secondary Metrics |
|-----------|----------------|-------------------|
| Launching new RAG system | Faithfulness, Context Precision | Latency, Token usage |
| Changing embedding model | Context Recall, Context Precision | Regression test delta |
| Changing chunking strategy | Chunk quality, Context Recall | Faithfulness (downstream) |
| Changing prompt template | Faithfulness, Answer Relevancy | LLM-as-judge score |
| Optimizing for speed | Latency p50/p95/p99 | Quality regression check |
| User complaints about accuracy | Faithfulness per-query | Unsupported claims audit |
| User complaints about completeness | Context Recall | Retrieval coverage analysis |

---

## Production Monitoring Checklist

1. **Log every query-context-answer triple** — you need this for offline evaluation
2. **Track faithfulness scores on a sample** — even 5% of traffic gives you trend data
3. **Alert on latency spikes** — retrieval latency > 2x baseline means something broke
4. **Monitor empty retrieval rate** — queries that return 0 relevant chunks
5. **Track user feedback correlation** — do thumbs-down correlate with low faithfulness?
6. **Weekly regression runs** — compare this week's golden set scores to last week
7. **Stratify by query category** — "code questions" may regress while "general questions" improve

---

## Key Takeaways

- Faithfulness is the most important RAG metric — it directly measures hallucination
- LLM-as-judge scales evaluation but needs careful prompting and calibration
- Golden test sets are your regression safety net — never deploy without running them
- Chunk quality at ingestion prevents downstream retrieval failures
- A/B testing tells you what works in production, not what looks good on benchmarks
- Monitor continuously — RAG quality drifts as knowledge bases change
