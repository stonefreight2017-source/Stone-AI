const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const PORT = 7070;

// ── Config ──────────────────────────────────────────────────────────────────
const VLLM_HOST = 'localhost';
const VLLM_PORT = 8000;
const VISION_PORT = 8001;
const SEEDS_DIR = path.join(__dirname, '..', 'seeds');

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Multer for file uploads ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Load seed files for system prompts ──────────────────────────────────────
let agentIdentities = [];
let stoneSeed = '';
let cardinalSeed = '';
let chaosSeed = '';
let sharedContext = '';
let computerwizSeed = '';

function loadSeeds() {
  try {
    const idPath = path.join(SEEDS_DIR, 'agent-identities.json');
    if (fs.existsSync(idPath)) {
      agentIdentities = JSON.parse(fs.readFileSync(idPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load agent-identities.json:', e.message);
  }

  const seedFiles = {
    'stone-seeds.md': (d) => stoneSeed = d,
    'cardinal-seeds.md': (d) => cardinalSeed = d,
    'chaos-seeds.md': (d) => chaosSeed = d,
    'shared-context.md': (d) => sharedContext = d,
    'computerwiz-seeds.md': (d) => computerwizSeed = d,
  };

  for (const [file, setter] of Object.entries(seedFiles)) {
    try {
      const fp = path.join(SEEDS_DIR, file);
      if (fs.existsSync(fp)) setter(fs.readFileSync(fp, 'utf-8'));
    } catch (e) {
      console.error(`Failed to load ${file}:`, e.message);
    }
  }
  console.log(`Loaded ${agentIdentities.length} agent identities, ${Object.keys(seedFiles).length} seed files`);
}

loadSeeds();

// ── Helper: get system prompt for agent ─────────────────────────────────────
function getSystemPrompt(agentSlug) {
  if (agentSlug === 'stone') return stoneSeed;
  if (agentSlug === 'cardinal') return cardinalSeed;
  if (agentSlug === 'chaos') return chaosSeed;
  if (agentSlug === 'computerwiz') return computerwizSeed;

  const agent = agentIdentities.find(a => a.slug === agentSlug);
  if (agent && agent.systemPrompt) return agent.systemPrompt;

  return 'You are a helpful AI assistant running on the Palace inference engine.';
}

// ── GET /api/agents ─────────────────────────────────────────────────────────
app.get('/api/agents', (req, res) => {
  // Build the full agent list including heads and royal guard
  const heads = [
    { slug: 'stone', name: 'Agent Stone', tier: 'PALACE', category: 'PALACE', role: 'Head 1 — The Owner' },
    { slug: 'cardinal', name: 'Cardinal', tier: 'PALACE', category: 'PALACE', role: 'Head 2 — The Architect' },
    { slug: 'chaos', name: 'Chaos', tier: 'PALACE', category: 'PALACE', role: 'Head 3 — The Hidden Blade' },
  ];
  const royalGuard = [
    { slug: 'computerwiz', name: 'Computer Wiz', tier: 'GUARD', category: 'ROYAL_GUARD', role: 'The Royal Guard' },
  ];
  const agents = agentIdentities.map(a => ({
    slug: a.slug,
    name: a.name,
    tier: a.tier,
    category: a.category,
  }));

  res.json({ heads, royalGuard, agents });
});

// ── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const checkService = (port, label) => {
    return new Promise((resolve) => {
      const request = http.get(`http://${VLLM_HOST}:${port}/health`, { timeout: 3000 }, (response) => {
        resolve({ service: label, port, status: response.statusCode === 200 ? 'online' : 'degraded', code: response.statusCode });
      });
      request.on('error', () => resolve({ service: label, port, status: 'offline' }));
      request.on('timeout', () => { request.destroy(); resolve({ service: label, port, status: 'timeout' }); });
    });
  };

  const [text, vision] = await Promise.all([
    checkService(VLLM_PORT, 'vLLM Text'),
    checkService(VISION_PORT, 'vLLM Vision'),
  ]);

  res.json({
    palace: 'online',
    services: [text, vision],
    timestamp: new Date().toISOString(),
  });
});

// ── POST /api/chat — streaming proxy to vLLM ───────────────────────────────
app.post('/api/chat', (req, res) => {
  const { messages, agent, temperature = 0.7, max_tokens = 4096 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const agentSlug = agent || 'stone';
  const systemPrompt = getSystemPrompt(agentSlug);

  // Build messages array with system prompt
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const payload = JSON.stringify({
    model: 'Qwen/Qwen2.5-32B-Instruct-AWQ',
    messages: fullMessages,
    temperature,
    max_tokens,
    stream: true,
  });

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const options = {
    hostname: VLLM_HOST,
    port: VLLM_PORT,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 120000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      let body = '';
      proxyRes.on('data', (c) => body += c);
      proxyRes.on('end', () => {
        res.write(`data: ${JSON.stringify({ error: `vLLM returned ${proxyRes.statusCode}: ${body}` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
      return;
    }

    // Stream SSE from vLLM to client
    proxyRes.on('data', (chunk) => {
      res.write(chunk);
    });

    proxyRes.on('end', () => {
      res.end();
    });
  });

  proxyReq.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ error: `Connection to vLLM failed: ${err.message}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.write(`data: ${JSON.stringify({ error: 'Request to vLLM timed out' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  // Client disconnect — abort proxy request
  req.on('close', () => {
    proxyReq.destroy();
  });

  proxyReq.write(payload);
  proxyReq.end();
});

// ── POST /api/upload — file upload + routing ────────────────────────────────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype || '';

  // Classify file type
  let fileType = 'unknown';
  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext)) {
    fileType = 'image';
  } else if (mime.startsWith('video/') || ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
    fileType = 'video';
  } else if (mime.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.flac', '.m4a'].includes(ext)) {
    fileType = 'audio';
  } else if (['.txt', '.md', '.csv', '.json', '.js', '.ts', '.py', '.html', '.css', '.xml', '.yaml', '.yml', '.log', '.sh', '.bat', '.ps1', '.sql', '.env', '.toml', '.ini', '.cfg'].includes(ext)) {
    fileType = 'text';
  } else if (['.pdf', '.doc', '.docx'].includes(ext)) {
    fileType = 'document';
  }

  // For text files, read the content
  let textContent = null;
  if (fileType === 'text') {
    try {
      textContent = fs.readFileSync(file.path, 'utf-8');
    } catch (e) {
      textContent = '[Could not read file content]';
    }
  }

  // For images, prepare base64 for vision model
  let base64 = null;
  if (fileType === 'image') {
    try {
      base64 = fs.readFileSync(file.path).toString('base64');
    } catch (e) {
      // handled below
    }
  }

  res.json({
    filename: file.originalname,
    fileType,
    size: file.size,
    path: file.path,
    textContent,
    base64,
    mimeType: mime,
  });
});

// ── POST /api/vision — send image to vision model ──────────────────────────
app.post('/api/vision', (req, res) => {
  const { image_base64, mime_type, prompt, agent } = req.body;

  if (!image_base64) {
    return res.status(400).json({ error: 'image_base64 required' });
  }

  const agentSlug = agent || 'stone';
  const systemPrompt = getSystemPrompt(agentSlug);
  const userPrompt = prompt || 'Describe what you see in this image in detail.';

  const payload = JSON.stringify({
    model: 'Qwen/Qwen2.5-VL-7B-Instruct',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mime_type || 'image/png'};base64,${image_base64}` } },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    max_tokens: 2048,
    temperature: 0.7,
    stream: true,
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const options = {
    hostname: VLLM_HOST,
    port: VISION_PORT,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 120000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      let body = '';
      proxyRes.on('data', (c) => body += c);
      proxyRes.on('end', () => {
        res.write(`data: ${JSON.stringify({ error: `Vision model returned ${proxyRes.statusCode}: ${body}` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
      return;
    }
    proxyRes.on('data', (chunk) => res.write(chunk));
    proxyRes.on('end', () => res.end());
  });

  proxyReq.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ error: `Vision model connection failed: ${err.message}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.write(`data: ${JSON.stringify({ error: 'Request to vision model timed out' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  req.on('close', () => proxyReq.destroy());

  proxyReq.write(payload);
  proxyReq.end();
});

// ── Fallback: serve index.html ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║         THE PALACE — GUI v1.0            ║');
  console.log('  ║   Stone AI Local Inference Interface     ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → vLLM Text:   localhost:${VLLM_PORT}`);
  console.log(`  → vLLM Vision: localhost:${VISION_PORT}`);
  console.log(`  → Seeds:       ${SEEDS_DIR}`);
  console.log(`  → Agents:      ${agentIdentities.length} loaded`);
  console.log('');
});
