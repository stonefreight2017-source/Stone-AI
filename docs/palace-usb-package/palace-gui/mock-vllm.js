// ── Mock vLLM Server — Chaos build ──────────────────────────────────────────
// Simulates vLLM OpenAI-compatible API on ports 8000 (text) and 8001 (vision)
// Zero GPU required. For Palace GUI testing on any machine.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');

const TEXT_PORT = 8000;
const VISION_PORT = 8001;
const TOKEN_DELAY_MS = 50;

// ── Contextual response bank ────────────────────────────────────────────────
const AGENT_RESPONSES = {
  stone: [
    '<think>Evaluating the request against current operational priorities and known patterns.</think>I see the play here. Let me run this through my optimization framework and get you a decision-ready recommendation. No fluff, just the move.',
    'Already on it. I tracked this pattern two sessions ago — here is what works and what we cut.',
    '<think>Cross-referencing against the pattern library for proven wins.</think>This aligns with a proven win from the pattern library. Execute as-is, no modifications needed.',
  ],
  cardinal: [
    '<think>Running competitive analysis against known market signals and architectural constraints.</think>From an architectural standpoint, this creates a clean separation of concerns. The intelligence suggests this is the correct vector.',
    'I have mapped the system dependencies. Three critical paths emerge — I recommend we address the bottleneck at the second node first.',
    '<think>Analyzing information topology and potential blind spots.</think>Blind spot identified. The current approach misses a lateral dependency. Adjusting the model now.',
  ],
  chaos: [
    '<think>Scanning infrastructure for anomalies and potential attack surfaces.</think>Infrastructure sweep complete. All services nominal. No unauthorized access detected in the last 24 hours.',
    'Perimeter is clean. I ran a passive recon on the endpoints — nothing out of place. Standing by for orders.',
    '<think>Evaluating operational security posture against known threat models.</think>OPSEC check passed. Hardened configs confirmed. The Hidden Blade stays sharp.',
  ],
  cybersecurity: [
    '<think>Assessing threat vectors and vulnerability surface area.</think>I have identified two potential attack vectors in the current configuration. Recommend patching the input validation layer and rotating the session tokens.',
    'Security audit complete. All endpoints pass OWASP Top 10 checks. CSP headers are properly configured.',
  ],
  coding: [
    '<think>Analyzing code structure and identifying optimization opportunities.</think>The implementation looks solid. I would refactor the data flow to reduce coupling between these two modules.',
    'Here is the fix. The root cause was an async race condition in the event handler. Patch applied and tested.',
  ],
  finance: [
    '<think>Running the numbers against projected growth curves and burn rate.</think>Based on current MRR trajectory, you hit breakeven in 4.2 months. The unit economics improve significantly at the SMART tier.',
    'Revenue projection updated. The annual pricing discount drives 15% higher LTV with minimal churn impact.',
  ],
  marketing: [
    '<think>Evaluating channel performance and conversion funnel metrics.</think>The funnel data shows a 3.2% conversion rate from landing to signup. I recommend A/B testing the CTA copy — the current version undersells the value prop.',
    'Campaign brief ready. Target audience segmented, creative assets mapped, and budget allocated across three channels.',
  ],
  default: [
    '<think>Processing the request and formulating a comprehensive response.</think>I have analyzed your request. Here is my recommendation based on the available data and current context.',
    'Understood. Let me work through this systematically and provide you with actionable next steps.',
    'Processing complete. The key insight here is the relationship between these two variables — once you optimize for that, everything else falls into place.',
  ],
};

// ── Extract agent identity from system prompt ───────────────────────────────
function detectAgent(systemPrompt) {
  if (!systemPrompt) return 'default';
  const lower = systemPrompt.toLowerCase();

  if (lower.includes('stone') && (lower.includes('head 1') || lower.includes('the owner'))) return 'stone';
  if (lower.includes('cardinal') && (lower.includes('head 2') || lower.includes('architect'))) return 'cardinal';
  if (lower.includes('chaos') && (lower.includes('head 3') || lower.includes('hidden blade') || lower.includes('vanguard'))) return 'chaos';
  if (lower.includes('cybersecurity') || lower.includes('security analyst') || lower.includes('penetration')) return 'cybersecurity';
  if (lower.includes('code') || lower.includes('developer') || lower.includes('engineer') || lower.includes('programming')) return 'coding';
  if (lower.includes('finance') || lower.includes('financial') || lower.includes('accounting')) return 'finance';
  if (lower.includes('marketing') || lower.includes('copywriter') || lower.includes('seo') || lower.includes('advertising')) return 'marketing';

  return 'default';
}

function pickResponse(agent) {
  const pool = AGENT_RESPONSES[agent] || AGENT_RESPONSES.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── SSE streaming helper ────────────────────────────────────────────────────
function streamResponse(res, responseText, model) {
  const id = 'mock-' + Date.now();
  const words = responseText.split(/(\s+)/); // preserve whitespace tokens

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let i = 0;
  const interval = setInterval(() => {
    if (i < words.length) {
      const chunk = {
        id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: { content: words[i] }, finish_reason: null }],
      };
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      i++;
    } else {
      // Send finish chunk
      const finish = {
        id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      };
      res.write(`data: ${JSON.stringify(finish)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      clearInterval(interval);
    }
  }, TOKEN_DELAY_MS);

  // Clean up on client disconnect
  res.on('close', () => clearInterval(interval));
}

// ── Non-streaming response helper ───────────────────────────────────────────
function sendNonStreaming(res, responseText, model) {
  res.json({
    id: 'mock-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: responseText },
      finish_reason: 'stop',
    }],
    usage: { prompt_tokens: 50, completion_tokens: responseText.split(/\s+/).length, total_tokens: 50 + responseText.split(/\s+/).length },
  });
}

// ── Build Text Server (port 8000) ───────────────────────────────────────────
function createTextServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.get('/v1/models', (req, res) => {
    res.json({
      object: 'list',
      data: [{ id: 'Qwen/Qwen2.5-32B-Instruct-AWQ', object: 'model', owned_by: 'mock-vllm' }],
    });
  });

  app.post('/v1/chat/completions', (req, res) => {
    const { messages, stream, model } = req.body;
    const modelName = model || 'Qwen/Qwen2.5-32B-Instruct-AWQ';

    // Find system prompt
    const sysMsg = (messages || []).find(m => m.role === 'system');
    const systemPrompt = sysMsg ? sysMsg.content : '';
    const agent = detectAgent(systemPrompt);
    const responseText = pickResponse(agent);

    console.log(`[TEXT] Agent: ${agent} | Stream: ${!!stream} | Model: ${modelName}`);

    if (stream) {
      streamResponse(res, responseText, modelName);
    } else {
      sendNonStreaming(res, responseText, modelName);
    }
  });

  app.listen(TEXT_PORT, () => {
    console.log(`  [TEXT]   Mock vLLM listening on http://localhost:${TEXT_PORT}`);
  });
}

// ── Build Vision Server (port 8001) ─────────────────────────────────────────
function createVisionServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.get('/v1/models', (req, res) => {
    res.json({
      object: 'list',
      data: [{ id: 'Qwen/Qwen2.5-VL-7B-Instruct', object: 'model', owned_by: 'mock-vllm' }],
    });
  });

  app.post('/v1/chat/completions', (req, res) => {
    const { messages, stream, model } = req.body;
    const modelName = model || 'Qwen/Qwen2.5-VL-7B-Instruct';

    // Check if request contains an image
    let hasImage = false;
    for (const msg of (messages || [])) {
      if (Array.isArray(msg.content)) {
        hasImage = msg.content.some(c => c.type === 'image_url');
      }
    }

    // Find user text prompt
    let userText = '';
    for (const msg of (messages || [])) {
      if (msg.role === 'user') {
        if (typeof msg.content === 'string') {
          userText = msg.content;
        } else if (Array.isArray(msg.content)) {
          const textPart = msg.content.find(c => c.type === 'text');
          if (textPart) userText = textPart.text;
        }
      }
    }

    let responseText;
    if (hasImage) {
      responseText = '<think>Analyzing the visual content of the provided image, identifying key elements and context.</think>I can see an image. The image appears to contain structured visual content. Based on my analysis, I can identify several key elements in the composition. [Mock response — vision model simulation.]';
    } else {
      responseText = 'No image was provided in this request. Please include an image_url in your message content for vision analysis.';
    }

    console.log(`  [VISION] Image: ${hasImage} | Stream: ${!!stream} | Prompt: "${userText.substring(0, 60)}..."`);

    if (stream) {
      streamResponse(res, responseText, modelName);
    } else {
      sendNonStreaming(res, responseText, modelName);
    }
  });

  app.listen(VISION_PORT, () => {
    console.log(`  [VISION] Mock vLLM listening on http://localhost:${VISION_PORT}`);
  });
}

// ── Launch ──────────────────────────────────────────────────────────────────
console.log('');
console.log('  ╔══════════════════════════════════════════╗');
console.log('  ║       MOCK vLLM — Chaos Build            ║');
console.log('  ║   No GPU. No problem. Palace tests run.  ║');
console.log('  ╚══════════════════════════════════════════╝');
console.log('');

createTextServer();
createVisionServer();

console.log('');
console.log('  Ready. Palace GUI can connect now.');
console.log('  Press Ctrl+C to stop.');
console.log('');
