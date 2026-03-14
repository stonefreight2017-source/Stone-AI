# vLLM Operations — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Launch Command — Production Standard

```bash
VLLM_FLASH_ATTN_VERSION=2 \
  /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000
```

### Flag Breakdown

| Flag | Purpose | Stone AI Default |
|---|---|---|
| `VLLM_FLASH_ATTN_VERSION=2` | Use FlashAttention v2 for faster attention computation | Always set |
| `--model` | Path to the model directory on disk | `/mnt/c/models/qwen3-32b-awq` |
| `--quantization awq_marlin` | Use Marlin kernel for AWQ quantized models (fastest) | Always for AWQ |
| `--max-model-len 32768` | Maximum context window in tokens | 32768 (32K) |
| `--port 8000` | HTTP port for the OpenAI-compatible API | 8000 |

### Extended Launch with KV Cache Tuning

```bash
VLLM_FLASH_ATTN_VERSION=2 \
  /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000 \
  --gpu-memory-utilization 0.90 \
  --kv-cache-dtype fp8_e5m2 \
  --max-num-seqs 64 \
  --max-num-batched-tokens 32768 \
  --enforce-eager
```

### Launch as Background Process with Logging

```bash
nohup bash -c 'VLLM_FLASH_ATTN_VERSION=2 \
  /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000 \
  --gpu-memory-utilization 0.90' \
  > /var/log/vllm/vllm-server.log 2>&1 &

echo $! > /var/run/vllm.pid
echo "vLLM started with PID $(cat /var/run/vllm.pid)"
```

---

## 2. KV Cache Configuration

The KV cache stores key-value pairs from the attention mechanism. It's the largest VRAM consumer after model weights.

### Memory Utilization Dial

| `--gpu-memory-utilization` | Behavior | When to Use |
|---|---|---|
| `0.85` | Conservative. ~15% headroom for spikes. | Default safe setting |
| `0.88` | Balanced. Good for steady workloads. | Normal production |
| `0.90` | Aggressive. Maximizes concurrent requests. | High-throughput, stable workload |
| `0.92` | Near-limit. Minimal headroom. | Max throughput, risk of OOM on spikes |
| `0.95` | Dangerous. Almost no headroom. | Never in production |

### FP8 KV Cache

```bash
--kv-cache-dtype fp8_e5m2
```

- Halves KV cache VRAM usage compared to float16
- Minimal quality loss for most tasks
- RTX 5090 (Blackwell) has native FP8 support — no performance penalty
- **Always use this** unless you're doing precision-critical tasks (math proofs, code generation with exact syntax)

### Calculating KV Cache Size

```
KV cache per token = 2 * num_layers * num_kv_heads * head_dim * dtype_bytes
```

For Qwen 2.5 32B AWQ:
- 64 layers, 8 KV heads, 128 head dim
- FP16: 2 * 64 * 8 * 128 * 2 = 256 KB per token
- FP8: 2 * 64 * 8 * 128 * 1 = 128 KB per token

At 32K context: FP16 = ~8GB, FP8 = ~4GB per sequence

### Monitoring KV Cache Usage

```bash
# Check vLLM metrics endpoint
curl -s http://localhost:8000/metrics | grep kv_cache

# Key metrics:
# vllm:gpu_cache_usage_perc — current KV cache utilization (0.0-1.0)
# vllm:cpu_cache_usage_perc — CPU offload cache usage
```

If `gpu_cache_usage_perc` stays above 0.95, you need to either:
1. Reduce `--max-model-len`
2. Reduce `--max-num-seqs`
3. Increase `--gpu-memory-utilization` (if headroom exists)

---

## 3. Batch Scheduling

vLLM uses **continuous batching** by default — it doesn't wait for all requests in a batch to finish before accepting new ones.

### Key Scheduling Parameters

```bash
--max-num-seqs 64          # Max concurrent sequences in flight
--max-num-batched-tokens 32768  # Max tokens processed per iteration
--scheduler-delay-factor 0.0    # 0 = no delay, higher = wait for more requests to batch
```

### Tuning Strategy

| Workload | `--max-num-seqs` | `--max-num-batched-tokens` | Why |
|---|---|---|---|
| Single user, long context | 4-8 | 32768 | Prioritize per-request latency |
| Chat app, many short requests | 32-64 | 32768 | Maximize throughput |
| Mixed (Stone AI production) | 16-32 | 32768 | Balance latency and throughput |
| Batch processing, offline | 64-128 | 65536 | Pure throughput, latency doesn't matter |

### Monitoring Scheduling

```bash
# Active requests
curl -s http://localhost:8000/metrics | grep "vllm:num_requests"

# Queue depth
curl -s http://localhost:8000/metrics | grep "vllm:num_requests_waiting"

# If waiting > 0 consistently, either increase max-num-seqs or add another instance
```

---

## 4. Quantization — AWQ vs GPTQ vs GGUF

### Comparison Table

| Method | Speed | Quality | VRAM | Best For |
|---|---|---|---|---|
| **AWQ (Marlin)** | Fastest on GPU | Excellent | Low | Production serving (our choice) |
| **GPTQ** | Fast on GPU | Good | Low | Alternative if AWQ unavailable |
| **GGUF** | Slow on GPU | Variable | Flexible (CPU+GPU split) | CPU inference, constrained VRAM |
| **FP16 (no quant)** | Fast | Perfect | High (2x AWQ) | When VRAM is abundant |

### Why AWQ Marlin

AWQ (Activation-aware Weight Quantization) with Marlin kernels is the production standard because:
1. **Marlin kernels** are hand-optimized CUDA kernels for 4-bit matrix multiplication
2. **Activation-aware** preserves quality on the weights that matter most
3. On RTX 5090: ~2x faster than naive FP16, ~30% faster than GPTQ
4. Quality loss is negligible for chat/reasoning tasks

### Specifying Quantization

```bash
# AWQ with Marlin (fastest, our standard)
--quantization awq_marlin

# AWQ without Marlin (fallback if Marlin fails)
--quantization awq

# GPTQ
--quantization gptq

# GPTQ with Marlin
--quantization gptq_marlin

# No quantization (FP16)
# Simply omit --quantization flag
```

### Troubleshooting Quantization

**Symptom**: `RuntimeError: Marlin kernel not supported`
**Diagnosis**: GPU compute capability too low or CUDA version mismatch
**Fix**: Fall back to `--quantization awq` (non-Marlin)

**Symptom**: `ValueError: quantization method awq_marlin is not compatible with model`
**Diagnosis**: Model wasn't quantized with AWQ
**Fix**: Check model's `config.json` for `quantization_config`. Use matching method.

---

## 5. Multi-Model Serving

### Running Multiple Models on Different Ports

```bash
# Model 1: Qwen 32B for chat (primary)
CUDA_VISIBLE_DEVICES=0 VLLM_FLASH_ATTN_VERSION=2 \
  /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000 \
  --gpu-memory-utilization 0.45 &

# Model 2: Vision model (secondary, lower priority)
CUDA_VISIBLE_DEVICES=0 VLLM_FLASH_ATTN_VERSION=2 \
  /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/vision-model \
  --max-model-len 4096 \
  --port 8001 \
  --gpu-memory-utilization 0.40 &
```

**WARNING**: Two models on one GPU means splitting VRAM. Their `--gpu-memory-utilization` values must sum to < 0.95.

### CUDA_VISIBLE_DEVICES for Multi-GPU (Future)

```bash
# If you ever have multiple GPUs:
CUDA_VISIBLE_DEVICES=0  # First GPU only
CUDA_VISIBLE_DEVICES=1  # Second GPU only
CUDA_VISIBLE_DEVICES=0,1  # Both GPUs (tensor parallel)

# With tensor parallelism:
--tensor-parallel-size 2  # Split model across 2 GPUs
```

### Sleep Mode for Secondary Model

When the vision model isn't needed, free its VRAM:

```bash
# Find the PID
cat /var/run/vllm-vision.pid

# Graceful shutdown
kill -SIGTERM $(cat /var/run/vllm-vision.pid)

# Wait for clean exit
sleep 5

# Verify VRAM freed
nvidia-smi | grep python
# Should only show the primary model process

# Increase primary model's memory util if desired
# (requires restart of primary)
```

### Model Swapping Script

```bash
#!/bin/bash
# swap-model.sh — Swap between chat and vision models
set -euo pipefail

CHAT_MODEL="/mnt/c/models/qwen3-32b-awq"
VISION_MODEL="/mnt/c/models/vision-model"
VLLM_BIN="/home/vllm-env/bin/python"
PORT=8000

stop_current() {
  if [ -f /var/run/vllm.pid ]; then
    local pid=$(cat /var/run/vllm.pid)
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping current model (PID $pid)..."
      kill -SIGTERM "$pid"
      # Wait up to 30 seconds for clean shutdown
      for i in $(seq 1 30); do
        kill -0 "$pid" 2>/dev/null || break
        sleep 1
      done
      # Force kill if still running
      kill -0 "$pid" 2>/dev/null && kill -9 "$pid"
    fi
    rm -f /var/run/vllm.pid
  fi
  # Verify VRAM is clear
  sleep 2
  if nvidia-smi | grep -q python; then
    echo "WARNING: GPU processes still running"
    nvidia-smi | grep python
    return 1
  fi
}

start_chat() {
  stop_current
  echo "Starting chat model..."
  nohup bash -c "VLLM_FLASH_ATTN_VERSION=2 $VLLM_BIN -m vllm.entrypoints.openai.api_server \
    --model $CHAT_MODEL --quantization awq_marlin --max-model-len 32768 \
    --port $PORT --gpu-memory-utilization 0.90" \
    > /var/log/vllm/chat.log 2>&1 &
  echo $! > /var/run/vllm.pid
  echo "Chat model starting on port $PORT (PID $(cat /var/run/vllm.pid))"
}

start_vision() {
  stop_current
  echo "Starting vision model..."
  nohup bash -c "VLLM_FLASH_ATTN_VERSION=2 $VLLM_BIN -m vllm.entrypoints.openai.api_server \
    --model $VISION_MODEL --max-model-len 4096 \
    --port $PORT --gpu-memory-utilization 0.90" \
    > /var/log/vllm/vision.log 2>&1 &
  echo $! > /var/run/vllm.pid
  echo "Vision model starting on port $PORT (PID $(cat /var/run/vllm.pid))"
}

case "${1:-}" in
  chat) start_chat ;;
  vision) start_vision ;;
  stop) stop_current ;;
  *) echo "Usage: $0 {chat|vision|stop}" ;;
esac
```

---

## 6. Failure Modes — Diagnosis and Recovery

### OOM During Prefill

**Symptom**: `torch.cuda.OutOfMemoryError: CUDA out of memory` during the first request or when a long-context request arrives.

**Diagnosis**:
```bash
# Check what VRAM was allocated
nvidia-smi

# Check the model len vs available KV cache
curl -s http://localhost:8000/metrics | grep kv_cache
```

**Fix**:
```bash
# Option 1: Reduce max context length
--max-model-len 16384  # Half the context window

# Option 2: Reduce memory utilization (sounds counterintuitive, but
# it changes the ratio of model weights to KV cache)
--gpu-memory-utilization 0.85

# Option 3: Enable FP8 KV cache
--kv-cache-dtype fp8_e5m2

# Option 4: Reduce max concurrent sequences
--max-num-seqs 8
```

**Prevention**: Always test with a max-length input before declaring production-ready.

### CUDA Illegal Memory Access

**Symptom**: `CUDA error: an illegal memory access was encountered` — process crashes hard.

**Diagnosis**:
```bash
# Check driver version
nvidia-smi  # Top right shows driver version

# Check CUDA toolkit version
nvcc --version  # This is the toolkit, NOT the driver

# Check for driver/toolkit mismatch
# Driver must be >= toolkit requirement
```

**Fix**:
```bash
# If driver mismatch:
# Update driver from NVIDIA website or:
sudo apt update && sudo apt install nvidia-driver-XXX

# If sporadic (not consistent):
# Likely thermal throttling causing memory corruption
nvidia-smi -q -d TEMPERATURE

# Nuclear option: reset GPU
sudo nvidia-smi --gpu-reset
```

**Prevention**: Pin driver + toolkit versions. Document what works. Don't upgrade unless necessary.

### Tokenizer Mismatch

**Symptom**: Garbled output, wrong special tokens, `KeyError` on token IDs.

**Diagnosis**:
```bash
# Check tokenizer files exist
ls -la /mnt/c/models/qwen3-32b-awq/tokenizer*
ls -la /mnt/c/models/qwen3-32b-awq/special_tokens_map.json

# Check model config matches tokenizer
cat /mnt/c/models/qwen3-32b-awq/config.json | grep -i "tokenizer\|vocab"
```

**Fix**:
```bash
# Re-download tokenizer files from HuggingFace
# Make sure config.json, tokenizer.json, tokenizer_config.json,
# special_tokens_map.json all come from the same model version

# Or specify tokenizer explicitly:
--tokenizer /path/to/correct/tokenizer
```

### Hung Inference (Request Never Returns)

**Symptom**: Request hangs indefinitely. No error. No output.

**Diagnosis**:
```bash
# Check if process is alive
ps aux | grep vllm

# Check GPU utilization
nvidia-smi  # If GPU util is 0% but process exists, it's stuck

# Check for deadlock
strace -p $(cat /var/run/vllm.pid) -e trace=futex
# If you see futex(..., FUTEX_WAIT, ...) repeating, it's deadlocked
```

**Fix**:
```bash
# Kill and restart
kill -9 $(cat /var/run/vllm.pid)
sleep 3

# Verify GPU memory freed
nvidia-smi | grep python
# If processes remain:
fuser -v /dev/nvidia*
kill -9 <remaining_pids>

# Restart with --enforce-eager to disable CUDA graphs (sometimes helps)
--enforce-eager
```

**Prevention**: Set request timeout in your API client (Stone AI uses 120s). Add a watchdog script.

---

## 7. Health Checks

### Built-in Endpoints

```bash
# Basic health check — returns 200 if server is ready
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health

# List loaded models
curl -s http://localhost:8000/v1/models | python3 -m json.tool

# Prometheus metrics
curl -s http://localhost:8000/metrics
```

### Custom Health Check Script

```bash
#!/bin/bash
# vllm-healthcheck.sh
set -euo pipefail

ENDPOINT="http://localhost:8000"
TIMEOUT=5

# Check 1: HTTP health endpoint
http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$ENDPOINT/health" 2>/dev/null || echo "000")
if [ "$http_code" != "200" ]; then
  echo "FAIL: Health endpoint returned $http_code"
  exit 1
fi

# Check 2: Model is loaded
model_count=$(curl -s --max-time $TIMEOUT "$ENDPOINT/v1/models" 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "0")
if [ "$model_count" -eq 0 ]; then
  echo "FAIL: No models loaded"
  exit 1
fi

# Check 3: GPU is accessible
gpu_util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "-1")
if [ "$gpu_util" -eq -1 ]; then
  echo "FAIL: nvidia-smi not responding"
  exit 1
fi

# Check 4: VRAM not exhausted (>500MB free)
vram_free=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "0")
if [ "$vram_free" -lt 500 ]; then
  echo "WARN: Low VRAM — only ${vram_free}MB free"
fi

echo "OK: vLLM healthy, $model_count model(s) loaded, GPU util ${gpu_util}%, VRAM free ${vram_free}MB"
exit 0
```

### Liveness Probe (for systemd or cron)

```bash
# Add to crontab: */2 * * * * /usr/local/bin/vllm-healthcheck.sh || /usr/local/bin/vllm-restart.sh
```

---

## 8. Restart and Recovery

### Clean Shutdown

```bash
# Graceful
kill -SIGTERM $(cat /var/run/vllm.pid)

# Wait for in-flight requests to complete (up to 30s)
timeout 30 tail --pid=$(cat /var/run/vllm.pid) -f /dev/null 2>/dev/null

# Verify
! kill -0 $(cat /var/run/vllm.pid) 2>/dev/null && echo "Clean shutdown" || echo "Still running"
```

### Zombie GPU Process Detection and Cleanup

```bash
#!/bin/bash
# cleanup-gpu.sh — Kill orphaned GPU processes
set -euo pipefail

echo "Checking for GPU processes..."
gpu_pids=$(nvidia-smi --query-compute-apps=pid --format=csv,noheader,nounits 2>/dev/null || true)

if [ -z "$gpu_pids" ]; then
  echo "No GPU processes found"
  exit 0
fi

echo "GPU processes: $gpu_pids"

for pid in $gpu_pids; do
  cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "dead")
  if [ "$cmd" = "dead" ]; then
    echo "Zombie process $pid — GPU has reference but process is dead"
    echo "GPU reset may be needed: sudo nvidia-smi --gpu-reset"
  else
    echo "PID $pid: $cmd"
  fi
done

# Check if our expected vLLM PID matches
if [ -f /var/run/vllm.pid ]; then
  expected_pid=$(cat /var/run/vllm.pid)
  if ! echo "$gpu_pids" | grep -q "$expected_pid"; then
    echo "WARNING: Expected vLLM PID $expected_pid not found on GPU"
    echo "vLLM may have crashed. Check logs."
  fi
fi
```

### Full Restart Script

```bash
#!/bin/bash
# vllm-restart.sh — Full stop, cleanup, and restart
set -euo pipefail

LOG_DIR="/var/log/vllm"
mkdir -p "$LOG_DIR"

echo "[$(date)] Restarting vLLM..."

# Stop
if [ -f /var/run/vllm.pid ]; then
  pid=$(cat /var/run/vllm.pid)
  kill -SIGTERM "$pid" 2>/dev/null || true
  sleep 5
  kill -9 "$pid" 2>/dev/null || true
  rm -f /var/run/vllm.pid
fi

# Kill any remaining python processes on GPU
for pid in $(nvidia-smi --query-compute-apps=pid --format=csv,noheader,nounits 2>/dev/null); do
  echo "Killing remaining GPU process $pid"
  kill -9 "$pid" 2>/dev/null || true
done

sleep 3

# Verify clean state
if nvidia-smi --query-compute-apps=pid --format=csv,noheader,nounits 2>/dev/null | grep -q .; then
  echo "ERROR: GPU processes still present after cleanup"
  echo "May need: sudo nvidia-smi --gpu-reset"
  exit 1
fi

# Start
echo "Starting vLLM..."
nohup bash -c 'VLLM_FLASH_ATTN_VERSION=2 \
  /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000 \
  --gpu-memory-utilization 0.90 \
  --kv-cache-dtype fp8_e5m2' \
  > "$LOG_DIR/vllm-server.log" 2>&1 &

echo $! > /var/run/vllm.pid
echo "vLLM started with PID $(cat /var/run/vllm.pid)"

# Wait for health
echo "Waiting for health check..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "" http://localhost:8000/health 2>/dev/null; then
    echo "vLLM healthy after ${i}s"
    exit 0
  fi
  sleep 1
done

echo "ERROR: vLLM did not become healthy in 60s"
echo "Check logs: tail -100 $LOG_DIR/vllm-server.log"
exit 1
```

---

## 9. Performance Tuning Checklist

### Before Launch
- [ ] `--kv-cache-dtype fp8_e5m2` enabled
- [ ] `--gpu-memory-utilization` set appropriately (0.88-0.92)
- [ ] `--max-num-seqs` tuned for expected concurrency
- [ ] `--enforce-eager` removed (CUDA graphs enabled) for production
- [ ] `VLLM_FLASH_ATTN_VERSION=2` set

### After Launch
- [ ] Health check passing
- [ ] Test with max-length input (32K tokens)
- [ ] Verify KV cache utilization under load (`/metrics`)
- [ ] Confirm no VRAM leaks over 1 hour of use
- [ ] Check thermal under sustained load (`nvidia-smi -q -d TEMPERATURE`)

### Red Flags to Watch
- `gpu_cache_usage_perc` > 0.95 consistently → reduce concurrency or context
- GPU temperature > 83C → improve cooling or reduce utilization
- `num_requests_waiting` growing unbounded → bottleneck, add capacity
- Tokens/second dropping over time → possible memory leak, schedule restart

---

## 10. Stone AI Integration Points

### API Endpoint Configuration

In Stone AI's Next.js backend, vLLM is accessed as an OpenAI-compatible endpoint:

```
Base URL: http://localhost:8000/v1
Model name: Use whatever is returned by /v1/models
```

### Request Format

```bash
# Test chat completion (same format Stone AI backend uses)
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "/mnt/c/models/qwen3-32b-awq",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 512,
    "temperature": 0.7,
    "stream": true
  }'
```

### Port Assignments (Stone AI Standard)

| Service | Port | Purpose |
|---|---|---|
| vLLM (chat) | 8000 | Primary LLM inference |
| vLLM (vision) | 8001 | Vision model (when loaded) |
| Next.js dev | 3000 | Stone AI frontend/backend |
| PostgreSQL | 5432 | Database (stoneai-db container) |
| Redis | 6379 | Cache and sessions |

### Timeout Configuration

Stone AI sets a 120-second timeout for vLLM requests. If inference takes longer:
1. The request is likely too long (>20K context with complex reasoning)
2. The model may be overloaded (check queue depth)
3. The GPU may be thermal throttling (check temps)

---

## 11. Systemd Service Unit (Optional)

```ini
# /etc/systemd/system/vllm.service
[Unit]
Description=vLLM OpenAI-Compatible Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
Environment=VLLM_FLASH_ATTN_VERSION=2
ExecStart=/home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000 \
  --gpu-memory-utilization 0.90 \
  --kv-cache-dtype fp8_e5m2
ExecStop=/bin/kill -SIGTERM $MAINPID
Restart=on-failure
RestartSec=10
TimeoutStartSec=120
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable vllm
sudo systemctl start vllm

# Check status
sudo systemctl status vllm

# View logs
sudo journalctl -u vllm -f --no-pager
```

> Note: systemctl works in native Linux. In WSL2, you may need to use the manual startup scripts above instead, unless you have systemd enabled in /etc/wsl.conf.

---

## 12. Quick Reference Card

| Task | Command |
|---|---|
| Start vLLM | See Section 1 launch command |
| Check health | `curl -s http://localhost:8000/health` |
| List models | `curl -s http://localhost:8000/v1/models` |
| View metrics | `curl -s http://localhost:8000/metrics` |
| Check GPU | `nvidia-smi` |
| Check VRAM free | `nvidia-smi --query-gpu=memory.free --format=csv,noheader` |
| Kill vLLM | `kill -SIGTERM $(cat /var/run/vllm.pid)` |
| Force kill | `kill -9 $(cat /var/run/vllm.pid)` |
| Clean GPU | `fuser -v /dev/nvidia*` then `kill -9` each PID |
| GPU reset | `sudo nvidia-smi --gpu-reset` |
| View logs | `tail -100 /var/log/vllm/vllm-server.log` |
| Test inference | See Section 10 curl command |
