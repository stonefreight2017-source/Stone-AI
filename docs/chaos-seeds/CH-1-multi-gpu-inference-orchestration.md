# CH-1: Multi-GPU Inference Orchestration
**Agent**: Chaos (Agent #44) | **Priority**: P0 | **Date**: 2026-03-07
**Stack**: OMEN PC, RTX 5090 (32GB GDDR7), vLLM, Qwen 2.5 32B AWQ

---

## 1. Single RTX 5090 Capacity Ceiling

### Hardware Specs
- **VRAM**: 32GB GDDR7 (512-bit bus, ~1.8 TB/s bandwidth)
- **TDP**: 575W (measured avg ~560W under sustained load, spikes to 700W+)
- **PCIe**: 5.0 x16

### Qwen 2.5 32B AWQ Performance Envelope

| Metric | Value | Notes |
|---|---|---|
| Model VRAM footprint (AWQ 4-bit) | ~18 GB | Leaves ~14GB for KV cache |
| Max context length | 8K tokens comfortable, 16K with reduced batch | KV cache scales linearly |
| Single-request generation | ~60-80 tok/s | Decode phase, single user |
| Batched throughput (batch=8) | ~300-500 tok/s aggregate | Sweet spot for latency vs throughput |
| Batched throughput (batch=32) | ~800-1200 tok/s aggregate | Higher latency per request |
| Max concurrent requests (latency < 2s TTFT) | 8-16 | Depends on prompt length |
| Max concurrent requests (best effort) | 32-64 | Latency degrades past 16 |

### KV Cache Budget Math
```
32GB total - 18GB model = 14GB for KV cache
Qwen 32B at 4-bit: ~0.5GB KV cache per 4K context request
14GB / 0.5GB = ~28 concurrent 4K-context requests max
At 8K context: ~14 concurrent requests max
```

### Capacity Planning for Stone AI
- **FREE tier** (4 agents): Low traffic, single GPU handles easily
- **Peak estimate** (all tiers active, 50 concurrent users): Need ~25-40 concurrent inference slots
- **Verdict**: Single RTX 5090 handles early-stage traffic. Hits ceiling at ~50 concurrent AI interactions with 4K+ contexts.

---

## 2. When to Add a Second GPU

### Trigger Thresholds (monitor these)

| Metric | Yellow (Plan) | Red (Buy Now) |
|---|---|---|
| GPU utilization (avg 5min) | >75% sustained | >90% sustained |
| VRAM usage | >85% | >95% |
| Request queue depth | >10 waiting | >25 waiting |
| P95 TTFT (time to first token) | >3 seconds | >5 seconds |
| P95 generation latency | >100ms/token | >200ms/token |
| Rejected/timed-out requests/hour | >5 | >20 |

### Monitoring Commands
```bash
# Real-time GPU metrics
nvidia-smi dmon -s pucvmet -d 5

# vLLM metrics endpoint (Prometheus format)
curl http://localhost:8000/metrics | grep -E "vllm_(num_requests|gpu_cache|avg_generation)"

# Key vLLM metrics to track:
# vllm:num_requests_running - current active requests
# vllm:num_requests_waiting - queue depth
# vllm:gpu_cache_usage_perc - KV cache pressure
# vllm:avg_generation_throughput_toks_per_s
```

---

## 3. Multi-GPU Topology Options

### RTX 5090 Does NOT Support NVLink
NVIDIA discontinued NVLink on consumer GeForce cards starting with RTX 40-series. The RTX 5090 has **no NVLink connector**. Multi-GPU communication uses PCIe peer-to-peer only.

### Option A: Dual RTX 5090 in Same Machine (RECOMMENDED FIRST STEP)

| Aspect | Details |
|---|---|
| Interconnect | PCIe 5.0 peer-to-peer (~64 GB/s per direction) |
| Motherboard | Needs 2x PCIe 5.0 x16 slots (AMD Threadripper PRO recommended) |
| PSU | 1500W+ minimum (2x 575W GPU + system) |
| Cooling | Open-air case or 5U rack; closed cases will thermal throttle |
| Cost | ~$2,000 for second GPU + PSU upgrade + possible mobo swap |

**Throughput gain**: Near-linear 2x for independent requests (data parallelism). For tensor parallelism across PCIe: ~1.6-1.7x (PCIe bottleneck vs NVLink).

### Option B: Distributed Multi-Node (FUTURE)

| Aspect | Details |
|---|---|
| Use case | 3+ GPUs, or geographic distribution |
| Framework | vLLM with Ray for multi-node orchestration |
| Interconnect | Ethernet (1-10 Gbps) — too slow for tensor parallelism |
| Best strategy | Data parallelism only (each node runs full model) |
| Complexity | High — requires Ray cluster, shared model storage |

### Recommendation Path
```
Phase 1 (now):     Single RTX 5090, monitor metrics
Phase 2 (trigger): Add second RTX 5090, same machine, data parallelism
Phase 3 (scale):   Dedicated inference server with Threadripper PRO + 2x 5090
Phase 4 (ceiling): Cloud burst to OpenAI/gpt-4o-mini for overflow
```

---

## 4. vLLM Parallelism Configuration

### Data Parallelism (RECOMMENDED for dual 5090 without NVLink)
Run two independent vLLM instances, one per GPU. Load balance at the application layer.

```bash
# GPU 0 — Instance A
CUDA_VISIBLE_DEVICES=0 vllm serve Qwen/Qwen2.5-32B-Instruct-AWQ \
  --quantization awq \
  --max-model-len 8192 \
  --port 8000 \
  --gpu-memory-utilization 0.90

# GPU 1 — Instance B
CUDA_VISIBLE_DEVICES=1 vllm serve Qwen/Qwen2.5-32B-Instruct-AWQ \
  --quantization awq \
  --max-model-len 8192 \
  --port 8001 \
  --gpu-memory-utilization 0.90
```

**Nginx load balancer** (round-robin with health checks):
```nginx
upstream vllm_backend {
    least_conn;
    server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8001 max_fails=3 fail_timeout=30s;
}

server {
    listen 8080;
    location / {
        proxy_pass http://vllm_backend;
        proxy_connect_timeout 5s;
        proxy_read_timeout 120s;
    }
    location /health {
        proxy_pass http://vllm_backend/health;
    }
}
```

### Tensor Parallelism (if you need larger context or bigger model later)
```bash
# Uses both GPUs as one logical unit — splits model layers across GPUs
# Only worth it for models that DON'T fit in single GPU VRAM
vllm serve Qwen/Qwen2.5-72B-Instruct-AWQ \
  --tensor-parallel-size 2 \
  --quantization awq \
  --max-model-len 16384
```

**When to use tensor parallelism**: Only if you upgrade to a 70B+ model that exceeds 32GB VRAM. For Qwen 32B AWQ (~18GB), data parallelism is strictly better — you get 2x throughput with no PCIe communication overhead.

### Pipeline Parallelism (multi-node only)
```bash
# Future: 2 nodes, 2 GPUs each = 4 total
vllm serve model_name \
  --tensor-parallel-size 2 \
  --pipeline-parallel-size 2
```

---

## 5. Request Routing & Load Balancing

### Architecture
```
[Vercel App] → [Cloudflare Tunnel] → [OMEN Nginx :8080]
                                          ↓
                                    ┌─────┴─────┐
                                    │ least_conn │
                                    ├─────┬──────┤
                                [vLLM :8000] [vLLM :8001]
                                  (GPU 0)      (GPU 1)
```

### Smart Routing (beyond round-robin)
For production, implement queue-depth-aware routing:

```python
# In your API route or middleware
import httpx
import asyncio

VLLM_INSTANCES = ["http://localhost:8000", "http://localhost:8001"]

async def get_least_loaded():
    """Route to the instance with fewer running requests."""
    loads = []
    for url in VLLM_INSTANCES:
        try:
            resp = await httpx.AsyncClient().get(f"{url}/metrics", timeout=1.0)
            # Parse vllm:num_requests_running from Prometheus metrics
            running = parse_running_requests(resp.text)
            loads.append((url, running))
        except:
            loads.append((url, float('inf')))  # Mark failed instance
    loads.sort(key=lambda x: x[1])
    return loads[0][0]
```

---

## 6. Cost-Per-GPU-Hour Modeling

### Hardware Amortization (3-year lifecycle)

| Item | Cost | Monthly | Hourly |
|---|---|---|---|
| RTX 5090 | $2,000 | $55.56 | $0.077 |
| OMEN PC (rest of system) | $2,500 | $69.44 | $0.096 |
| Second RTX 5090 | $2,000 | $55.56 | $0.077 |
| Total (single GPU) | $4,500 | $125.00 | $0.173 |
| Total (dual GPU) | $6,500 | $180.56 | $0.251 |

### Electricity Cost

| Config | Watts | kWh/month (24/7) | Cost @ $0.15/kWh | Cost @ $0.25/kWh |
|---|---|---|---|---|
| Single 5090 + system | 700W avg | 504 kWh | $75.60/mo | $126.00/mo |
| Dual 5090 + system | 1250W avg | 900 kWh | $135.00/mo | $225.00/mo |
| Idle (model loaded, no requests) | 150W | 108 kWh | $16.20/mo | $27.00/mo |

### Total Cost of Ownership (single GPU, 24/7)

| Component | Monthly |
|---|---|
| Hardware amortization | $125 |
| Electricity (avg load, $0.20/kWh) | $100 |
| Internet (existing) | $0 |
| **Total** | **$225/mo** |

### vs. Cloud Comparison

| Provider | Cost for equivalent throughput |
|---|---|
| OpenAI GPT-4o-mini | ~$0.15/1M input + $0.60/1M output tokens |
| RunPod RTX 5090 | ~$1.14/hr ($821/mo 24/7) |
| Local OMEN | **~$225/mo** (3.6x cheaper than RunPod) |

**Break-even**: Local GPU pays for itself vs. cloud at ~500K tokens/day usage.

---

## 7. Graceful Degradation (GPU Failure -> Cloud Fallback)

### Failure Detection
```python
# Health check service (runs every 30 seconds)
import asyncio
import httpx

async def check_gpu_health():
    for instance in VLLM_INSTANCES:
        try:
            resp = await httpx.AsyncClient().get(
                f"{instance}/health", timeout=5.0
            )
            if resp.status_code != 200:
                raise Exception(f"Unhealthy: {resp.status_code}")
        except Exception as e:
            await trigger_fallback(instance, str(e))
            await send_alert(f"GPU instance {instance} DOWN: {e}")
```

### Fallback Chain
```
Priority 1: Local vLLM GPU 0
Priority 2: Local vLLM GPU 1 (if dual-GPU)
Priority 3: OpenAI gpt-4o-mini (cloud fallback — already configured on Vercel)
Priority 4: Queue requests + show "High demand" message to users
```

### Implementation in API Route
```typescript
// src/lib/inference-router.ts
const FALLBACK_CHAIN = [
  { url: 'http://localhost:8000/v1', type: 'local', name: 'GPU-0' },
  { url: 'http://localhost:8001/v1', type: 'local', name: 'GPU-1' },
  { url: 'https://api.openai.com/v1',  type: 'cloud', name: 'OpenAI' },
];

async function routeInference(request: InferenceRequest) {
  for (const backend of FALLBACK_CHAIN) {
    try {
      const result = await callBackend(backend, request);
      if (backend.type === 'cloud') {
        // Log cloud fallback for cost tracking
        await logCloudFallback(backend.name, request.tokens);
      }
      return result;
    } catch (e) {
      console.error(`${backend.name} failed, trying next...`);
      continue;
    }
  }
  throw new Error('All inference backends unavailable');
}
```

### Alert Integration
```bash
# Trigger email alert via existing Nodemailer setup
# Alert to 3headedm@gmail.com when:
# - Any GPU instance goes down
# - Cloud fallback is activated (cost tracking)
# - Cloud fallback exceeds $X/hour budget
# - All backends unavailable (P0 CRITICAL)
```

### Recovery Protocol
1. GPU failure detected -> automatic cloud fallback (no user impact)
2. Alert sent to founder email
3. Auto-retry local GPU every 60 seconds
4. If GPU recovers -> drain cloud requests, resume local
5. If GPU stays down > 1 hour -> escalate alert with restart instructions

---

## Summary: Decision Matrix

| Scenario | Action | Timeline |
|---|---|---|
| <50 concurrent users | Single RTX 5090, no changes | Now |
| 50-100 concurrent users | Add second RTX 5090, data parallelism | When triggers hit |
| >100 concurrent users | Threadripper PRO build + dual 5090 | Post-revenue |
| GPU failure | Automatic OpenAI fallback | Automated |
| Need 70B+ model | Tensor parallelism across 2 GPUs | If/when model upgrade |
