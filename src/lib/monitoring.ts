export function traceChat(params: {
  userId: string;
  agentSlug: string;
  input: string;
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  mode: string;
  tier: string;
}): void {
  const totalTokens = params.tokensIn + params.tokensOut;
  console.log(
    `[MONITOR] agent=${params.agentSlug} mode=${params.mode} tokens=${totalTokens} latency=${params.latencyMs}ms tier=${params.tier}`
  );

  // Langfuse integration deferred until package is installed
  // To enable: npm install langfuse && set LANGFUSE_URL, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY
}
