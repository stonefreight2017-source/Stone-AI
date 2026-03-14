# GPU Cluster Management — Palace Infrastructure Seed

## Chaos Directive: GPU Mastery on the OMEN 45L

RTX 5090, 32GB VRAM. One GPU that needs to serve inference, handle concurrent requests, and never waste a cycle. This seed covers multi-GPU scheduling principles (for future expansion), CUDA memory management, GPU sharing via MPS and MIG, monitoring utilization, and vLLM-specific GPU optimization.

---

## 1. CUDA Memory Management

### 1.1 Understanding GPU Memory Architecture

The RTX 5090 has 32GB GDDR7 VRAM. Understanding how this memory is allocated is critical for maximizing inference throughput.

**Memory hierarchy:**
- **Global Memory (VRAM):** 32GB — where model weights and KV cache live
- **Shared Memory:** Per-SM, fast, programmer-managed
- **L1 Cache:** Per-SM, automatic
- **L2 Cache:** Shared across all SMs, 96MB on RTX 5090
- **Registers:** Per-thread, fastest

**Memory allocation breakdown for Qwen 2.5 32B AWQ:**

```
Model weights (AWQ 4-bit):     ~16GB
KV Cache (dynamic):            ~8-12GB
CUDA context overhead:         ~500MB
Framework overhead (PyTorch):  ~1-2GB
Activation memory:             ~1-2GB
──────────────────────────────────────
Total:                         ~27-32GB
```

### 1.2 Monitoring CUDA Memory

```bash
# Real-time GPU monitoring
nvidia-smi

# Continuous monitoring (1 second interval)
nvidia-smi -l 1

# Specific metrics
nvidia-smi --query-gpu=timestamp,name,temperature.gpu,utilization.gpu,utilization.memory,memory.total,memory.free,memory.used,power.draw --format=csv -l 1

# Per-process memory usage
nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv

# Detailed memory breakdown
nvidia-smi --query-gpu=memory.total,memory.used,memory.free,compute_mode --format=csv,noheader

# Watch with formatting
watch -n 1 'nvidia-smi --query-gpu=utilization.gpu,utilization.memory,memory.used,memory.free,temperature.gpu,power.draw --format=csv,noheader,nounits'
```

### 1.3 PyTorch CUDA Memory Management

```python
import torch
import gc

# Check available memory
def gpu_memory_report():
    """Detailed GPU memory report."""
    if not torch.cuda.is_available():
        return "No CUDA device available"

    device = torch.cuda.current_device()
    total = torch.cuda.get_device_properties(device).total_mem / (1024**3)
    allocated = torch.cuda.memory_allocated(device) / (1024**3)
    reserved = torch.cuda.memory_reserved(device) / (1024**3)
    free = total - allocated

    return {
        "device": torch.cuda.get_device_name(device),
        "total_gb": round(total, 2),
        "allocated_gb": round(allocated, 2),
        "reserved_gb": round(reserved, 2),
        "free_gb": round(free, 2),
        "utilization_pct": round(allocated / total * 100, 1)
    }

# Force memory cleanup
def clear_gpu_memory():
    """Aggressively free GPU memory."""
    gc.collect()
    torch.cuda.empty_cache()
    torch.cuda.synchronize()

# Memory-efficient inference context
@torch.inference_mode()
def run_inference(model, inputs):
    """Run inference with minimal memory overhead."""
    with torch.cuda.amp.autocast(dtype=torch.float16):
        outputs = model(**inputs)
    return outputs

# Environment variables for memory management
"""
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
  - Reduces fragmentation by using expandable memory segments

PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
  - Limits the maximum size of memory blocks that can be split

CUDA_VISIBLE_DEVICES=0
  - Restrict to specific GPU(s)

PYTORCH_NO_CUDA_MEMORY_CACHING=1
  - Disable caching allocator (debugging only, slower)
"""
```

### 1.4 Memory Fragmentation Prevention

```python
# Pre-allocate memory pool
torch.cuda.memory.set_per_process_memory_fraction(0.90, device=0)

# Use memory pools for predictable allocation
# vLLM handles this internally, but for custom code:
class MemoryPool:
    def __init__(self, pool_size_gb: float, device: int = 0):
        self.device = torch.device(f"cuda:{device}")
        self.pool = torch.empty(
            int(pool_size_gb * 1024**3 // 4),  # float32 elements
            dtype=torch.float32,
            device=self.device
        )
        self.offset = 0

    def allocate(self, size_bytes: int) -> torch.Tensor:
        elements = size_bytes // 4
        if self.offset + elements > len(self.pool):
            raise RuntimeError("Memory pool exhausted")
        tensor = self.pool[self.offset:self.offset + elements]
        self.offset += elements
        return tensor

    def reset(self):
        self.offset = 0
```

### 1.5 CUDA Error Recovery

```python
def handle_cuda_oom(func):
    """Decorator to handle CUDA OOM errors gracefully."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except torch.cuda.OutOfMemoryError:
            print("CUDA OOM detected. Clearing cache and retrying...")
            gc.collect()
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
            try:
                return func(*args, **kwargs)
            except torch.cuda.OutOfMemoryError:
                print("CUDA OOM persists after cache clear.")
                raise
    return wrapper
```

---

## 2. GPU Sharing Mechanisms

### 2.1 NVIDIA Multi-Process Service (MPS)

MPS allows multiple processes to share a single GPU simultaneously. Instead of time-slicing (context switching), MPS enables true concurrent execution on the GPU's compute units.

**When to use MPS:**
- Multiple lightweight inference processes sharing one GPU
- API server handling concurrent requests to the same model
- Development environments where multiple users need GPU access

**MPS Setup:**

```bash
# Start MPS daemon
export CUDA_VISIBLE_DEVICES=0
nvidia-cuda-mps-control -d

# Verify MPS is running
echo get_server_list | nvidia-cuda-mps-control

# Set active thread percentage per client (resource limit)
echo set_default_active_thread_percentage 50 | nvidia-cuda-mps-control

# Per-client limits
echo set_active_thread_percentage <PID> 25 | nvidia-cuda-mps-control

# Check status
echo get_default_active_thread_percentage | nvidia-cuda-mps-control

# Stop MPS
echo quit | nvidia-cuda-mps-control
```

**MPS in Docker:**

```yaml
services:
  vllm-primary:
    runtime: nvidia
    environment:
      - CUDA_MPS_PIPE_DIRECTORY=/tmp/nvidia-mps
      - CUDA_MPS_LOG_DIRECTORY=/tmp/nvidia-log
    volumes:
      - mps-pipe:/tmp/nvidia-mps
      - mps-log:/tmp/nvidia-log
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  mps-server:
    image: nvidia/cuda:12.6-base-ubuntu22.04
    runtime: nvidia
    command: nvidia-cuda-mps-control -f
    environment:
      - CUDA_VISIBLE_DEVICES=0
    volumes:
      - mps-pipe:/tmp/nvidia-mps
      - mps-log:/tmp/nvidia-log

volumes:
  mps-pipe:
  mps-log:
```

**MPS performance characteristics:**

| Metric | Without MPS | With MPS |
|--------|------------|----------|
| Context switch overhead | ~25-50μs | ~0μs |
| Max concurrent processes | Time-sliced | True concurrent |
| Memory isolation | Full | Shared address space |
| Error containment | Per-process | Server-wide (risk) |
| Latency jitter | High | Low |

### 2.2 NVIDIA Multi-Instance GPU (MIG)

MIG partitions a single GPU into physically isolated instances. Each instance has dedicated memory, cache, and compute cores. **The RTX 5090 does NOT support MIG** — MIG is available only on A100, A30, H100, and datacenter GPUs. Documented here for future Palace expansion.

**MIG on datacenter GPUs (A100/H100):**

```bash
# Enable MIG mode (requires reboot)
sudo nvidia-smi -i 0 -mig 1

# List available MIG profiles
nvidia-smi mig -lgip

# Create GPU instances
# A100 80GB example: 7 instances of 10GB each
nvidia-smi mig -cgi 19,19,19,19,19,19,19 -C

# List created instances
nvidia-smi mig -lgi
nvidia-smi mig -lci

# Assign to containers via device UUID
docker run --gpus '"device=MIG-GPU-<uuid>/1/0"' ...

# Destroy instances
nvidia-smi mig -dci
nvidia-smi mig -dgi

# Disable MIG mode
sudo nvidia-smi -i 0 -mig 0
```

**MIG partition profiles (A100 80GB):**

| Profile | GPU Memory | SMs | Use Case |
|---------|-----------|-----|----------|
| 1g.10gb | 10GB | 14 | Small inference |
| 2g.20gb | 20GB | 28 | Medium models |
| 3g.40gb | 40GB | 42 | Large inference |
| 4g.40gb | 40GB | 56 | Large + compute |
| 7g.80gb | 80GB | 98 | Full GPU |

### 2.3 Time-Slicing (Kubernetes)

For the RTX 5090, time-slicing is the primary sharing mechanism in Kubernetes.

```yaml
# NVIDIA device plugin ConfigMap for time-slicing
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: gpu-operator
data:
  rtx5090: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        renameByDefault: true
        failRequestsGreaterThanOne: false
        resources:
        - name: nvidia.com/gpu
          replicas: 4  # 4 virtual GPUs from 1 physical

# Apply to specific nodes
# kubectl label node omen-45l nvidia.com/device-plugin.config=rtx5090
```

**Time-slicing limitations:**
- No memory isolation — processes can OOM each other
- Context switching overhead (~25-50μs per switch)
- No bandwidth guarantees
- No preemption fairness by default

### 2.4 GPU Sharing Decision Matrix

| Feature | MPS | MIG | Time-Slicing |
|---------|-----|-----|-------------|
| RTX 5090 support | Yes | No | Yes |
| Memory isolation | No | Yes | No |
| Compute isolation | Partial | Yes | No |
| Max partitions | Unlimited* | 7 (A100) | Configurable |
| Overhead | Very low | None | Medium |
| Error containment | Weak | Strong | Weak |
| Best for | Concurrent inference | Multi-tenant | K8s scheduling |

*Practical limit is GPU compute capacity

---

## 3. Multi-GPU Scheduling

### 3.1 Multi-GPU Architecture Patterns

Even though the OMEN currently has one RTX 5090, understanding multi-GPU patterns prepares for expansion.

**Data Parallelism:**
```python
# Distribute data across GPUs, each GPU has full model copy
import torch.nn as nn

model = YourModel()
if torch.cuda.device_count() > 1:
    model = nn.DataParallel(model)  # Simple but not optimal
model = model.cuda()

# Better: DistributedDataParallel
import torch.distributed as dist

dist.init_process_group(backend="nccl")
model = nn.parallel.DistributedDataParallel(
    model.cuda(),
    device_ids=[local_rank],
    output_device=local_rank
)
```

**Tensor Parallelism (used by vLLM):**
```python
# Split model layers across GPUs
# vLLM handles this via --tensor-parallel-size
# Each GPU holds a portion of each layer's weights
# Requires fast GPU-to-GPU communication (NVLink preferred)

# Example: 2 GPUs, each processes half the attention heads
# GPU 0: heads 0-31
# GPU 1: heads 32-63
```

**Pipeline Parallelism:**
```python
# Split model layers sequentially across GPUs
# GPU 0: layers 0-15
# GPU 1: layers 16-31
# Microbatching to keep all GPUs busy

# Less communication than tensor parallel
# But introduces pipeline bubbles
```

### 3.2 NCCL Configuration

NCCL (NVIDIA Collective Communication Library) handles GPU-to-GPU communication.

```bash
# Environment variables for multi-GPU communication
export NCCL_DEBUG=INFO
export NCCL_SOCKET_IFNAME=eth0
export NCCL_IB_DISABLE=1  # Disable InfiniBand if not available
export NCCL_P2P_DISABLE=0  # Enable peer-to-peer
export NCCL_SHM_DISABLE=0  # Enable shared memory

# For PCIe (no NVLink) setups
export NCCL_P2P_LEVEL=PHB  # Within same PCIe hub
export NCCL_NET_GDR_LEVEL=0  # Disable GPU Direct RDMA
```

### 3.3 GPU Affinity and NUMA

```bash
# Check GPU topology
nvidia-smi topo -m

# Check NUMA node assignment
nvidia-smi topo -p

# Bind process to GPU's NUMA node for optimal memory access
numactl --cpunodebind=0 --membind=0 python serve.py

# In Docker
docker run --cpuset-cpus="0-7" --gpus device=0 ...
```

### 3.4 Future Multi-GPU Expansion Planning

```
Current OMEN Setup:
  1× RTX 5090 32GB (PCIe 5.0 x16)

Expansion Options:
  Option A: Add second RTX 5090
    - Requires: Motherboard with 2× PCIe 5.0 x16 slots
    - Power: Additional ~450W TDP
    - Cooling: Significant additional thermal load
    - Benefit: 64GB total VRAM, tensor parallel size 2
    - vLLM: --tensor-parallel-size 2

  Option B: External GPU via Thunderbolt 5
    - Lower bandwidth than internal PCIe
    - Good for offloading secondary workloads
    - Not suitable for tensor parallelism

  Option C: Dedicated inference server
    - Separate machine with multiple GPUs
    - Network-based inference (gRPC/REST)
    - Better isolation, independent scaling
    - Higher latency than local GPU
```

---

## 4. Monitoring GPU Utilization

### 4.1 NVIDIA DCGM (Data Center GPU Manager)

```bash
# Install DCGM
sudo apt-get install -y datacenter-gpu-manager

# Start DCGM service
sudo systemctl start nvidia-dcgm
sudo systemctl enable nvidia-dcgm

# Run diagnostics
dcgmi diag -r 3  # Level 3 diagnostic (thorough)

# Monitor specific metrics
dcgmi dmon -e 155,150,156,100,101,140,141,142
# 155 = SM utilization
# 150 = memory utilization
# 156 = occupancy
# 100 = power usage
# 101 = temperature
# 140 = memory clock
# 141 = SM clock
# 142 = PCIe throughput

# Set up health monitoring
dcgmi health -s a  # Watch all subsystems
dcgmi health -c    # Check current health
```

### 4.2 DCGM Exporter for Prometheus

```yaml
# docker-compose monitoring addition
services:
  dcgm-exporter:
    image: nvcr.io/nvidia/k8s/dcgm-exporter:3.3.0-3.2.0-ubuntu22.04
    container_name: dcgm-exporter
    runtime: nvidia
    restart: unless-stopped
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    ports:
      - "9400:9400"
    cap_add:
      - SYS_ADMIN
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

**Prometheus scrape config:**

```yaml
scrape_configs:
  - job_name: 'dcgm'
    static_configs:
      - targets: ['dcgm-exporter:9400']
    scrape_interval: 15s
    metrics_path: /metrics
```

### 4.3 Key GPU Metrics to Monitor

```
Critical Metrics:
─────────────────
DCGM_FI_DEV_GPU_UTIL          GPU utilization (%)
DCGM_FI_DEV_MEM_COPY_UTIL     Memory bandwidth utilization (%)
DCGM_FI_DEV_FB_USED           Frame buffer (VRAM) used (MB)
DCGM_FI_DEV_FB_FREE           Frame buffer (VRAM) free (MB)
DCGM_FI_DEV_GPU_TEMP          GPU temperature (°C)
DCGM_FI_DEV_POWER_USAGE       Power draw (W)
DCGM_FI_DEV_SM_CLOCK          SM clock frequency (MHz)
DCGM_FI_DEV_MEM_CLOCK         Memory clock frequency (MHz)

Inference-Specific:
───────────────────
DCGM_FI_PROF_SM_ACTIVE        SM active ratio
DCGM_FI_PROF_SM_OCCUPANCY     SM occupancy
DCGM_FI_PROF_DRAM_ACTIVE      DRAM active ratio
DCGM_FI_PROF_PIPE_TENSOR_ACTIVE  Tensor core utilization
DCGM_FI_PROF_PCIE_TX_BYTES    PCIe TX bytes
DCGM_FI_PROF_PCIE_RX_BYTES    PCIe RX bytes
```

### 4.4 Grafana Dashboard for GPU Monitoring

```json
{
  "dashboard": {
    "title": "Palace GPU Monitor — RTX 5090",
    "panels": [
      {
        "title": "GPU Utilization",
        "type": "gauge",
        "targets": [{"expr": "DCGM_FI_DEV_GPU_UTIL"}],
        "thresholds": [
          {"color": "green", "value": 0},
          {"color": "yellow", "value": 70},
          {"color": "red", "value": 90}
        ]
      },
      {
        "title": "VRAM Usage",
        "type": "timeseries",
        "targets": [
          {"expr": "DCGM_FI_DEV_FB_USED / 1024", "legendFormat": "Used (GB)"},
          {"expr": "DCGM_FI_DEV_FB_FREE / 1024", "legendFormat": "Free (GB)"}
        ]
      },
      {
        "title": "Temperature & Power",
        "type": "timeseries",
        "targets": [
          {"expr": "DCGM_FI_DEV_GPU_TEMP", "legendFormat": "Temp °C"},
          {"expr": "DCGM_FI_DEV_POWER_USAGE", "legendFormat": "Power W"}
        ]
      },
      {
        "title": "Tensor Core Utilization",
        "type": "gauge",
        "targets": [{"expr": "DCGM_FI_PROF_PIPE_TENSOR_ACTIVE * 100"}]
      }
    ]
  }
}
```

### 4.5 Custom GPU Monitoring Script

```bash
#!/bin/bash
# gpu-monitor.sh — Palace GPU watchdog

THRESHOLD_TEMP=85
THRESHOLD_VRAM_PCT=95
THRESHOLD_POWER=400
LOG_FILE="/var/log/gpu-monitor.log"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Query all metrics at once
    read GPU_UTIL MEM_UTIL TEMP POWER MEM_USED MEM_TOTAL FAN_SPEED <<< $(
        nvidia-smi --query-gpu=utilization.gpu,utilization.memory,temperature.gpu,power.draw,memory.used,memory.total,fan.speed \
        --format=csv,noheader,nounits | tr ',' ' '
    )

    VRAM_PCT=$((MEM_USED * 100 / MEM_TOTAL))

    # Log metrics
    echo "$TIMESTAMP | GPU: ${GPU_UTIL}% | MEM: ${MEM_UTIL}% | VRAM: ${MEM_USED}/${MEM_TOTAL}MB (${VRAM_PCT}%) | Temp: ${TEMP}°C | Power: ${POWER}W | Fan: ${FAN_SPEED}%" >> "$LOG_FILE"

    # Alert conditions
    if [ "$TEMP" -gt "$THRESHOLD_TEMP" ]; then
        echo "$TIMESTAMP | ALERT: GPU temperature ${TEMP}°C exceeds threshold ${THRESHOLD_TEMP}°C" >> "$LOG_FILE"
        # Could trigger sendFounderAlert() here
    fi

    if [ "$VRAM_PCT" -gt "$THRESHOLD_VRAM_PCT" ]; then
        echo "$TIMESTAMP | ALERT: VRAM usage ${VRAM_PCT}% exceeds threshold ${THRESHOLD_VRAM_PCT}%" >> "$LOG_FILE"
    fi

    POWER_INT=${POWER%.*}
    if [ "$POWER_INT" -gt "$THRESHOLD_POWER" ]; then
        echo "$TIMESTAMP | ALERT: Power draw ${POWER}W exceeds threshold ${THRESHOLD_POWER}W" >> "$LOG_FILE"
    fi

    sleep 5
done
```

---

## 5. vLLM GPU Optimization

### 5.1 vLLM Memory Management

vLLM uses PagedAttention, which manages KV cache memory like virtual memory pages. This eliminates memory waste from padding and reservation.

**Key vLLM GPU parameters:**

```bash
# GPU memory utilization — fraction of VRAM vLLM can use
--gpu-memory-utilization 0.90  # 90% of 32GB = 28.8GB for vLLM

# KV cache data type
--kv-cache-dtype auto  # Matches model dtype (FP16 for AWQ)

# Block size for PagedAttention
--block-size 16  # Default, good for most cases

# Maximum model length (affects KV cache size)
--max-model-len 32768  # Qwen 2.5 supports 128K, but limit for memory

# Swap space (CPU memory for overflow)
--swap-space 4  # GB of CPU RAM for swapped-out KV cache blocks

# Enable prefix caching (reuse KV cache for common prefixes)
--enable-prefix-caching

# Chunked prefill (overlap prefill and decode)
--enable-chunked-prefill
--max-num-batched-tokens 4096
```

### 5.2 vLLM Performance Tuning

```bash
# Optimal configuration for Qwen 2.5 32B AWQ on RTX 5090
python -m vllm.entrypoints.openai.api_server \
    --model /models/qwen2.5-32b-awq \
    --quantization awq \
    --dtype half \
    --gpu-memory-utilization 0.90 \
    --max-model-len 32768 \
    --max-num-seqs 32 \
    --max-num-batched-tokens 4096 \
    --block-size 16 \
    --swap-space 4 \
    --enable-prefix-caching \
    --enable-chunked-prefill \
    --disable-log-requests \
    --tensor-parallel-size 1 \
    --host 0.0.0.0 \
    --port 8000 \
    --served-model-name qwen-32b \
    --trust-remote-code \
    --enforce-eager  # Disable CUDA graphs if memory-constrained
```

**Tuning parameters explained:**

| Parameter | Effect | Trade-off |
|-----------|--------|-----------|
| `--gpu-memory-utilization` | Higher = more KV cache | Too high = OOM risk |
| `--max-model-len` | Max context length | Longer = more VRAM for KV cache |
| `--max-num-seqs` | Concurrent requests | More = higher throughput, more memory |
| `--max-num-batched-tokens` | Batch size for prefill | Larger = better GPU utilization |
| `--enable-prefix-caching` | Reuse KV cache | Small memory overhead, big speed gain |
| `--enforce-eager` | Disable CUDA graphs | Slower but uses less memory |
| `--swap-space` | CPU offloading | Prevents OOM but adds latency |

### 5.3 vLLM Benchmarking

```bash
# Built-in benchmark tool
python -m vllm.entrypoints.openai.api_server &
sleep 30  # Wait for model to load

# Throughput benchmark
python -m vllm.benchmark_throughput \
    --model /models/qwen2.5-32b-awq \
    --quantization awq \
    --input-len 512 \
    --output-len 256 \
    --num-prompts 100

# Latency benchmark
python -m vllm.benchmark_latency \
    --model /models/qwen2.5-32b-awq \
    --quantization awq \
    --input-len 512 \
    --output-len 256 \
    --batch-size 1

# Custom load test with concurrent requests
python << 'EOF'
import asyncio
import aiohttp
import time
import statistics

async def benchmark_inference(url, num_requests, concurrency):
    semaphore = asyncio.Semaphore(concurrency)
    latencies = []

    async def single_request(session):
        async with semaphore:
            payload = {
                "model": "qwen-32b",
                "messages": [{"role": "user", "content": "Explain quantum computing in 100 words."}],
                "max_tokens": 150,
                "temperature": 0.7
            }
            start = time.monotonic()
            async with session.post(f"{url}/v1/chat/completions", json=payload) as resp:
                await resp.json()
            latency = time.monotonic() - start
            latencies.append(latency)

    async with aiohttp.ClientSession() as session:
        tasks = [single_request(session) for _ in range(num_requests)]
        overall_start = time.monotonic()
        await asyncio.gather(*tasks)
        overall_time = time.monotonic() - overall_start

    print(f"Total requests: {num_requests}")
    print(f"Concurrency: {concurrency}")
    print(f"Total time: {overall_time:.2f}s")
    print(f"Throughput: {num_requests/overall_time:.2f} req/s")
    print(f"Latency P50: {statistics.median(latencies):.3f}s")
    print(f"Latency P95: {sorted(latencies)[int(len(latencies)*0.95)]:.3f}s")
    print(f"Latency P99: {sorted(latencies)[int(len(latencies)*0.99)]:.3f}s")

asyncio.run(benchmark_inference("http://localhost:8000", 100, 10))
EOF
```

### 5.4 vLLM KV Cache Optimization

```python
# Understanding KV cache memory usage:
# Per-token KV cache size = 2 * num_layers * num_heads * head_dim * dtype_size
# Qwen 2.5 32B: 2 * 64 * 40 * 128 * 2 (FP16) = 1,310,720 bytes per token = ~1.25MB/token

# For max_model_len=32768:
# Max KV cache per sequence = 32768 * 1.25MB = ~40GB (doesn't fit!)
# This is why gpu-memory-utilization and max-model-len must be balanced

# Practical calculation:
# Available VRAM: 32GB * 0.90 = 28.8GB
# Model weights (AWQ): ~16GB
# Available for KV cache: 28.8 - 16 = 12.8GB
# Tokens that fit: 12.8GB / 1.25MB = ~10,240 tokens total
# With 32 concurrent sequences: ~320 tokens each average context

# To serve longer contexts, reduce concurrency:
# --max-num-seqs 8 allows ~1,280 tokens per sequence
# --max-num-seqs 4 allows ~2,560 tokens per sequence
```

### 5.5 AWQ Quantization Specifics

```python
# AWQ (Activation-aware Weight Quantization) characteristics:
# - 4-bit weight quantization
# - Minimal quality degradation vs FP16
# - ~4x memory reduction for weights
# - Faster inference than FP16 (less memory bandwidth needed)
# - Supported natively by vLLM

# AWQ memory savings for Qwen 2.5 32B:
# FP16 weights: ~64GB (doesn't fit on RTX 5090)
# AWQ 4-bit: ~16GB (fits with room for KV cache)

# Quality comparison (approximate):
# Metric      | FP16  | AWQ 4-bit | Difference
# MMLU        | 83.2  | 82.8      | -0.4
# HumanEval   | 67.5  | 66.9      | -0.6
# MT-Bench    | 8.7   | 8.5       | -0.2
```

### 5.6 vLLM Monitoring Endpoints

```bash
# vLLM exposes metrics at /metrics (Prometheus format)
curl http://localhost:8000/metrics

# Key metrics:
# vllm:num_requests_running          Current running requests
# vllm:num_requests_waiting          Queued requests
# vllm:gpu_cache_usage_perc          GPU KV cache utilization
# vllm:cpu_cache_usage_perc          CPU swap cache utilization
# vllm:avg_prompt_throughput_toks_per_s  Prompt processing speed
# vllm:avg_generation_throughput_toks_per_s  Generation speed
# vllm:time_to_first_token_seconds   TTFT histogram
# vllm:time_per_output_token_seconds  TPOT histogram
# vllm:e2e_request_latency_seconds   End-to-end latency

# Prometheus scrape config
scrape_configs:
  - job_name: 'vllm'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: /metrics
    scrape_interval: 10s
```

---

## 6. GPU Thermal Management

### 6.1 Temperature Monitoring and Limits

```bash
# RTX 5090 thermal specifications:
# - Max operating temp: ~90°C (GPU die)
# - Throttle point: ~83-85°C (starts downclocking)
# - Target temp: <80°C for sustained workloads
# - Memory junction: <95°C

# Monitor temperature with nvidia-smi
nvidia-smi --query-gpu=temperature.gpu,temperature.memory --format=csv -l 1

# Set power limit to control thermals
sudo nvidia-smi -pl 350  # Limit to 350W (default ~450W TDP)
# Lower power = lower temp = slightly lower performance

# Set persistence mode (prevents driver unload, faster queries)
sudo nvidia-smi -pm 1

# Lock clocks for consistent performance (advanced)
sudo nvidia-smi -lgc 1500,2520  # Min,Max clock (MHz)
sudo nvidia-smi -lmc 1500       # Lock memory clock
```

### 6.2 Fan Curve Optimization

```bash
# On Linux/WSL2 with nvidia-settings
nvidia-settings -a "[gpu:0]/GPUFanControlState=1"  # Enable manual control
nvidia-settings -a "[fan:0]/GPUTargetFanSpeed=80"   # Set to 80%

# Automated fan curve script
#!/bin/bash
while true; do
    TEMP=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits)
    if [ "$TEMP" -lt 50 ]; then
        FAN=40
    elif [ "$TEMP" -lt 60 ]; then
        FAN=50
    elif [ "$TEMP" -lt 70 ]; then
        FAN=65
    elif [ "$TEMP" -lt 80 ]; then
        FAN=80
    else
        FAN=100
    fi
    nvidia-settings -a "[fan:0]/GPUTargetFanSpeed=$FAN" 2>/dev/null
    sleep 10
done
```

---

## 7. GPU Error Handling and Recovery

### 7.1 Common GPU Errors

```
Error: CUDA error: out of memory
Fix: Reduce --gpu-memory-utilization, --max-model-len, or --max-num-seqs

Error: NCCL error: unhandled system error
Fix: Check NCCL_DEBUG=INFO output, verify shared memory size (/dev/shm)

Error: CUDA error: device-side assert triggered
Fix: Check for NaN/Inf in inputs, update CUDA drivers

Error: GPU has fallen off the bus
Fix: Hardware issue — check PCIe connection, power cables, thermals

Error: Xid error 79 (GPU has fallen off the bus)
Fix: Usually thermal or power issue. Check PSU and cooling.

Error: ECC memory errors (Xid 48, 63, 64)
Fix: Run nvidia-smi --query-gpu=ecc.errors.corrected.total,ecc.errors.uncorrected.total
     Corrected errors are normal. Uncorrected = potential hardware failure.
```

### 7.2 Automatic GPU Recovery

```bash
#!/bin/bash
# gpu-recovery.sh — Restart vLLM on GPU failure

check_gpu() {
    nvidia-smi > /dev/null 2>&1
    return $?
}

check_vllm() {
    curl -sf http://localhost:8000/health > /dev/null 2>&1
    return $?
}

FAILURES=0
MAX_FAILURES=3

while true; do
    if ! check_gpu; then
        echo "$(date): GPU not responding. Attempting recovery..."
        sudo nvidia-smi -r  # Reset GPU
        sleep 5
        if ! check_gpu; then
            echo "$(date): GPU recovery failed. Manual intervention needed."
            # sendFounderAlert "GPU FAILURE — manual intervention required"
            exit 1
        fi
    fi

    if ! check_vllm; then
        FAILURES=$((FAILURES + 1))
        echo "$(date): vLLM health check failed (${FAILURES}/${MAX_FAILURES})"

        if [ $FAILURES -ge $MAX_FAILURES ]; then
            echo "$(date): Restarting vLLM..."
            docker restart stoneai-vllm
            FAILURES=0
            sleep 120  # Wait for model to reload
        fi
    else
        FAILURES=0
    fi

    sleep 30
done
```

---

## 8. GPU Performance Profiling

### 8.1 NVIDIA Nsight Systems

```bash
# Profile vLLM inference
nsys profile -t cuda,nvtx,osrt \
    --gpu-metrics-device=0 \
    --output=vllm-profile \
    python -m vllm.entrypoints.openai.api_server --model /models/qwen2.5-32b-awq

# Analyze profile
nsys stats vllm-profile.nsys-rep

# Export to text summary
nsys stats --report cuda_gpu_kern_sum vllm-profile.nsys-rep
```

### 8.2 Quick Performance Check

```bash
# GPU compute benchmark
nvidia-smi --query-gpu=clocks.current.graphics,clocks.max.graphics,clocks.current.memory,clocks.max.memory --format=csv

# PCIe bandwidth test
# Install cuda-samples and run bandwidthTest
./bandwidthTest
# Expected: PCIe 5.0 x16 = ~64GB/s theoretical, ~55GB/s practical

# Memory bandwidth test
./deviceQuery
# Expected: RTX 5090 = ~1.8TB/s memory bandwidth
```

---

## 9. OMEN 45L GPU Configuration Summary

```
═══════════════════════════════════════════════
  PALACE GPU CONFIGURATION — OMEN 45L
═══════════════════════════════════════════════

  GPU:            NVIDIA RTX 5090
  VRAM:           32GB GDDR7
  Interface:      PCIe 5.0 x16
  TDP:            ~450W
  CUDA Cores:     21,760
  Tensor Cores:   680 (4th gen)
  Memory BW:      ~1.8 TB/s

  CURRENT WORKLOAD:
  ─────────────────
  Model:          Qwen 2.5 32B Instruct AWQ
  Quantization:   AWQ 4-bit
  Memory Usage:   ~28GB (90% utilization)
  Framework:      vLLM
  Serving:        OpenAI-compatible API

  SHARING:        None (dedicated inference)
  MONITORING:     nvidia-smi + DCGM exporter
  COOLING:        Stock + optimized fan curve
  POWER:          ~350W sustained under load

  EXPANSION PATH:
  ─────────────────
  Phase 1: Current (1× RTX 5090)
  Phase 2: Add NVLink bridge if available
  Phase 3: Dedicated inference server
═══════════════════════════════════════════════
```

---

*Chaos Infrastructure Seed — Batch 14. The GPU is the Palace's engine. Every watt, every byte, every cycle — accounted for.*
