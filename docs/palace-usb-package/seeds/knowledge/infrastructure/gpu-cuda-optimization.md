# GPU & CUDA Optimization — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. nvidia-smi — Your Eyes on the GPU

### Basic Monitoring

```bash
# One-shot status
nvidia-smi

# Continuous monitoring (refreshes every 1 second)
nvidia-smi -l 1

# Compact monitoring (better for scripts)
watch -n 1 nvidia-smi

# Device monitoring daemon (logs to file)
nvidia-smi dmon -s pucvmet -d 1 > /var/log/gpu-metrics.log &
# Columns: power, utilization, clock, vram, memory controller, encoder, temperature
```

### Parsing nvidia-smi for Scripts

```bash
# GPU utilization percentage
nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits
# Returns: 85

# VRAM used/total/free
nvidia-smi --query-gpu=memory.used,memory.total,memory.free --format=csv,noheader,nounits
# Returns: 28500, 32768, 4268

# Temperature
nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits
# Returns: 72

# Power draw
nvidia-smi --query-gpu=power.draw,power.limit --format=csv,noheader,nounits
# Returns: 280.50, 450.00

# Clock speeds
nvidia-smi --query-gpu=clocks.gr,clocks.mem --format=csv,noheader,nounits
# Returns: 2520, 1750

# All at once (for dashboards)
nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw --format=csv,noheader
# Returns: NVIDIA GeForce RTX 5090, 72, 85, 28500, 32768, 280.50

# Process-level VRAM
nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv,noheader
# Returns: 12345, python, 28000 MiB
```

### VRAM Leak Detection

```bash
#!/bin/bash
# vram-leak-watch.sh — Alert if VRAM grows without new processes
set -euo pipefail

THRESHOLD_MB=500  # Alert if VRAM grows by this much between checks
INTERVAL=60       # Check every 60 seconds
LOG="/var/log/vram-watch.log"

prev_used=0

while true; do
  current_used=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits | head -1)
  process_count=$(nvidia-smi --query-compute-apps=pid --format=csv,noheader,nounits | wc -l)
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  if [ "$prev_used" -gt 0 ]; then
    delta=$((current_used - prev_used))
    if [ "$delta" -gt "$THRESHOLD_MB" ]; then
      echo "[$timestamp] WARN: VRAM grew by ${delta}MB (${prev_used} -> ${current_used}), processes: $process_count" | tee -a "$LOG"
    fi
  fi

  echo "[$timestamp] VRAM: ${current_used}MB, Processes: $process_count" >> "$LOG"
  prev_used=$current_used
  sleep $INTERVAL
done
```

### Process-Level VRAM Accounting

```bash
# Which processes are using the GPU?
nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv

# Detailed per-process view
nvidia-smi pmon -s um -d 1
# Shows: PID, type (C=compute, G=graphics), SM%, MEM%, encoder%, decoder%, VRAM

# Cross-reference with system processes
nvidia-smi --query-compute-apps=pid --format=csv,noheader,nounits | while read pid; do
  echo "PID $pid: $(ps -p $pid -o cmd= 2>/dev/null || echo 'DEAD PROCESS')"
  echo "  VRAM: $(nvidia-smi --query-compute-apps=pid,used_memory --format=csv,noheader,nounits | grep "^$pid," | cut -d',' -f2)"
done
```

---

## 2. Thermal Management

### Temperature Zones

| Temperature | Zone | Action |
|---|---|---|
| < 70C | Green | Normal operation |
| 70-80C | Yellow | Monitoring. Check airflow. |
| 80-83C | Orange | Throttling likely imminent. Reduce load or improve cooling. |
| 83-90C | Red | GPU is throttling. Performance degraded. Immediate action needed. |
| > 90C | Critical | Risk of shutdown or hardware damage. Stop workload NOW. |

### Temperature Monitoring

```bash
# Current temperature
nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits

# Detailed thermal info
nvidia-smi -q -d TEMPERATURE
# Shows: GPU Current Temp, GPU T.Limit Temp, GPU Shutdown Temp, GPU Slowdown Temp

# Temperature with throttle reason
nvidia-smi -q -d PERFORMANCE
# Shows current and target clocks, plus throttle reason codes

# Continuous temperature logging
nvidia-smi --query-gpu=timestamp,temperature.gpu,power.draw,clocks.gr --format=csv -l 5 >> /var/log/gpu-thermal.csv
```

### Throttle Detection

```bash
# Check if currently throttling
nvidia-smi -q -d PERFORMANCE | grep -A 5 "Clocks Throttle Reasons"

# Key reasons:
# SW Thermal Slowdown: Active   <-- GPU is too hot
# HW Thermal Slowdown: Active   <-- CRITICAL
# SW Power Cap: Active           <-- Power limit reached
# Idle: Active                   <-- Normal when idle

# Quick check script
#!/bin/bash
thermal=$(nvidia-smi -q -d PERFORMANCE 2>/dev/null | grep "SW Thermal Slowdown" | awk '{print $NF}')
if [ "$thermal" = "Active" ]; then
  temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits)
  echo "ALERT: GPU thermal throttling at ${temp}C"
fi
```

### Cooling Actions

1. **Immediate**: Reduce `--gpu-memory-utilization` and `--max-num-seqs` to lower workload
2. **Short-term**: Check case airflow, clean dust filters, ensure fans are working
3. **Medium-term**: Adjust fan curve (if supported by GPU utility)
4. **Long-term**: Add case fans, improve cable management for airflow, consider aftermarket GPU cooler

```bash
# Set fan speed (if supported — requires Xorg or coolbits)
# Usually not available in headless/WSL2 — use hardware controls instead
nvidia-settings -a "[gpu:0]/GPUFanControlState=1" -a "[fan:0]/GPUTargetFanSpeed=90"
```

---

## 3. Driver and CUDA Toolkit Matrix

### Understanding the Two Versions

```bash
# Driver version (manages the GPU hardware)
nvidia-smi
# Top right corner shows: Driver Version: 570.XX  CUDA Version: 12.X

# Toolkit version (compiles CUDA code)
nvcc --version
# Shows: Cuda compilation tools, release 12.X
```

**Critical**: The "CUDA Version" shown by `nvidia-smi` is the MAXIMUM CUDA version the driver supports, NOT the installed toolkit version. The actual toolkit version comes from `nvcc`.

### Compatibility Rules

1. Driver version must be >= the minimum driver for your CUDA toolkit
2. Newer drivers are backward compatible with older CUDA toolkits
3. NEVER downgrade the driver below what your toolkit requires

### Version Matrix (Common Combinations)

| CUDA Toolkit | Minimum Driver (Linux) | Notes |
|---|---|---|
| 12.6 | 560.28+ | Current stable |
| 12.4 | 550.54+ | Widely compatible |
| 12.2 | 535.86+ | LTS-friendly |
| 12.0 | 525.60+ | Older but stable |
| 11.8 | 520.61+ | Legacy, avoid for new installs |

### Checking Compatibility

```bash
# Full driver info
nvidia-smi -q | head -20

# CUDA toolkit details
nvcc --version

# Python's view of CUDA
python3 -c "import torch; print(f'PyTorch CUDA: {torch.version.cuda}, cuDNN: {torch.backends.cudnn.version()}')"

# vLLM's view
python3 -c "import vllm; print(vllm.__version__)"
```

### Driver Update (Native Linux)

```bash
# Check current
nvidia-smi | head -3

# Update (Ubuntu/Debian)
sudo apt update
sudo apt install nvidia-driver-570  # Replace with target version

# Reboot required after driver update
sudo reboot
```

### Driver Update (WSL2)

WSL2 uses the **Windows host driver**. You don't install drivers inside WSL2.

1. Update the NVIDIA driver on the **Windows side** via GeForce Experience or nvidia.com
2. The WSL2 kernel automatically picks up the new driver
3. Restart WSL: `wsl --shutdown` from PowerShell, then relaunch

---

## 4. Performance Debugging

### CUDA_LAUNCH_BLOCKING

```bash
# Force synchronous CUDA execution for debugging
CUDA_LAUNCH_BLOCKING=1 python3 my_script.py

# This makes CUDA errors report on the exact line they occur
# WITHOUT it, errors are reported lazily (wrong line number)
# NEVER use in production — massive performance hit
```

### Mixed Precision Patterns

```bash
# vLLM handles precision automatically based on model config
# But for custom scripts:

# Check what precision the model is running
python3 -c "
import torch
print(f'Default dtype: {torch.get_default_dtype()}')
print(f'CUDA available: {torch.cuda.is_available()}')
print(f'BF16 supported: {torch.cuda.is_bf16_supported()}')
"

# RTX 5090 supports: FP32, FP16, BF16, FP8, INT8, INT4
# For inference: FP16 or BF16 for weights, FP8 for KV cache is optimal
```

### Profiling GPU Utilization

```bash
# Real-time GPU utilization breakdown
nvidia-smi dmon -s pucvmet -d 1
# Columns: pwr, gtemp, mtemp, sm, mem, enc, dec, mclk, pclk

# SM (streaming multiprocessor) utilization is the key metric
# - High SM + High MEM = compute + memory bound (normal for LLMs)
# - High SM + Low MEM = compute bound
# - Low SM + High MEM = memory bandwidth bound (typical for inference)
# - Low SM + Low MEM = underutilized (batch size too small)

# For LLM inference on RTX 5090:
# Expect: SM 30-70%, MEM 80-95% (memory bandwidth is the bottleneck)
```

---

## 5. RTX 5090 Specifics (Blackwell Architecture)

### Hardware Specs

| Spec | RTX 5090 |
|---|---|
| Architecture | Blackwell (GB202) |
| VRAM | 32 GB GDDR7 |
| Memory Bandwidth | ~1792 GB/s |
| CUDA Cores | 21760 |
| Tensor Cores | 680 (5th gen) |
| FP16 TFLOPS | ~209 |
| FP8 TFLOPS | ~419 |
| TDP | 575W |
| PCIe | Gen 5 x16 |

### Blackwell-Specific Behavior

1. **FP8 is native**: No performance penalty for FP8 compute. Always use `--kv-cache-dtype fp8_e5m2`.
2. **GDDR7 bandwidth**: Memory bandwidth is exceptional. LLM inference (memory-bound) benefits hugely.
3. **Power draw**: 575W TDP means ensure PSU has adequate 12VHPWR capacity. Monitor `power.draw`.
4. **Thermal**: High power = high heat. Expect higher temps than previous gen. 80C under sustained load is normal.
5. **CUDA Compute Capability**: 10.0 (Blackwell). Ensure PyTorch/vLLM are compiled for this.

### Optimal vLLM Settings for RTX 5090

```bash
VLLM_FLASH_ATTN_VERSION=2 \
  /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000 \
  --gpu-memory-utilization 0.90 \
  --kv-cache-dtype fp8_e5m2 \
  --max-num-seqs 32 \
  --max-num-batched-tokens 32768
```

With 32GB GDDR7:
- Model weights (AWQ 4-bit, 32B params): ~18GB
- KV cache (FP8, 32K context): ~4GB per sequence
- With `gpu-memory-utilization 0.90`: ~28.8GB available
- After model weights: ~10.8GB for KV cache
- Can serve ~2-3 concurrent 32K-context requests, or ~10+ short-context requests

---

## 6. GPU Recovery Procedures

### Stuck Processes

```bash
# Find all processes using the GPU
fuser -v /dev/nvidia*

# Sample output:
# /dev/nvidia0:    root   12345 F...m python3
#                  root   12346 F...m python3

# Kill specific process
kill -9 12345

# Kill ALL GPU processes (nuclear option)
fuser -k /dev/nvidia*

# Verify
nvidia-smi --query-compute-apps=pid --format=csv,noheader
# Should be empty
```

### GPU Reset

```bash
# Last resort — resets the GPU hardware
# WARNING: Kills ALL processes using the GPU
sudo nvidia-smi --gpu-reset

# If that doesn't work:
sudo nvidia-smi --gpu-reset -i 0  # Specify GPU index

# If THAT doesn't work (GPU truly hung):
# WSL2: wsl --shutdown from PowerShell, then restart WSL
# Native Linux: sudo reboot
```

### Post-Recovery Verification

```bash
#!/bin/bash
# verify-gpu.sh — Run after any GPU recovery
set -euo pipefail

echo "=== GPU Recovery Verification ==="

# 1. nvidia-smi responds
echo -n "nvidia-smi responsive: "
if nvidia-smi > /dev/null 2>&1; then
  echo "YES"
else
  echo "NO — GPU may need driver reload or reboot"
  exit 1
fi

# 2. No orphan processes
echo -n "Orphan GPU processes: "
orphans=$(nvidia-smi --query-compute-apps=pid --format=csv,noheader,nounits 2>/dev/null | wc -l)
echo "$orphans"

# 3. VRAM is free
echo -n "VRAM used: "
nvidia-smi --query-gpu=memory.used --format=csv,noheader

# 4. Temperature is safe
echo -n "Temperature: "
temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits)
echo "${temp}C"
if [ "$temp" -gt 60 ]; then
  echo "  WARNING: Temperature elevated after reset. Wait for cooldown."
fi

# 5. CUDA works
echo -n "CUDA functional: "
python3 -c "import torch; t=torch.zeros(1).cuda(); print('YES')" 2>/dev/null || echo "NO"

# 6. Clocks are normal (not stuck at low)
echo -n "GPU clock: "
nvidia-smi --query-gpu=clocks.gr --format=csv,noheader

echo "=== Verification Complete ==="
```

---

## 7. VRAM Budget Calculator

```bash
#!/bin/bash
# vram-budget.sh — Calculate how much VRAM is available for KV cache
set -euo pipefail

TOTAL_VRAM_MB=32768  # RTX 5090
MODEL_SIZE_GB=${1:-18}  # AWQ 4-bit 32B model
UTIL=${2:-0.90}  # gpu-memory-utilization
KV_DTYPE=${3:-fp8}  # fp8 or fp16

model_mb=$((MODEL_SIZE_GB * 1024))
usable_mb=$(echo "$TOTAL_VRAM_MB * $UTIL" | bc | cut -d. -f1)
kv_budget_mb=$((usable_mb - model_mb))

echo "=== VRAM Budget ==="
echo "Total VRAM:        ${TOTAL_VRAM_MB}MB"
echo "Utilization:       ${UTIL}"
echo "Usable VRAM:       ${usable_mb}MB"
echo "Model weights:     ${model_mb}MB"
echo "KV cache budget:   ${kv_budget_mb}MB"

# Calculate max concurrent sequences at various context lengths
echo ""
echo "=== Max Concurrent Sequences ==="
for ctx in 2048 4096 8192 16384 32768; do
  if [ "$KV_DTYPE" = "fp8" ]; then
    # Qwen 32B: 64 layers, 8 KV heads, 128 head dim, 1 byte per value
    kv_per_token_kb=$(echo "2 * 64 * 8 * 128 * 1 / 1024" | bc)
  else
    kv_per_token_kb=$(echo "2 * 64 * 8 * 128 * 2 / 1024" | bc)
  fi
  kv_per_seq_mb=$(echo "$kv_per_token_kb * $ctx / 1024" | bc)
  max_seqs=$((kv_budget_mb / kv_per_seq_mb))
  echo "  Context ${ctx}: ~${kv_per_seq_mb}MB/seq, max ~${max_seqs} concurrent"
done
```

---

## 8. Environment Variables Reference

| Variable | Purpose | Stone AI Default |
|---|---|---|
| `VLLM_FLASH_ATTN_VERSION=2` | FlashAttention version | Always set |
| `CUDA_VISIBLE_DEVICES` | Which GPUs to use | `0` (single GPU) |
| `CUDA_LAUNCH_BLOCKING=1` | Sync CUDA for debugging | Only for debugging |
| `PYTORCH_CUDA_ALLOC_CONF` | PyTorch memory allocator tuning | Usually unset |
| `NCCL_P2P_DISABLE=1` | Disable peer-to-peer GPU comm | Only if multi-GPU issues |
| `VLLM_WORKER_MULTIPROC_METHOD=spawn` | Process creation method | Set if fork causes issues |

### PyTorch Memory Allocator Tuning (Advanced)

```bash
# If seeing fragmentation (OOM with plenty of "free" VRAM):
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

# More aggressive:
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True,max_split_size_mb:128
```

---

## 9. Quick Reference Card

| Task | Command |
|---|---|
| GPU status | `nvidia-smi` |
| GPU temp | `nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits` |
| VRAM usage | `nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader` |
| GPU processes | `nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv` |
| Stuck processes | `fuser -v /dev/nvidia*` |
| Kill GPU process | `kill -9 <pid>` |
| Kill all GPU procs | `fuser -k /dev/nvidia*` |
| GPU reset | `sudo nvidia-smi --gpu-reset` |
| Continuous monitor | `nvidia-smi dmon -s pucvmet -d 1` |
| Throttle check | `nvidia-smi -q -d PERFORMANCE` |
| Driver version | `nvidia-smi \| head -3` |
| CUDA toolkit ver | `nvcc --version` |
| PyTorch CUDA | `python3 -c "import torch; print(torch.version.cuda)"` |
| Test CUDA works | `python3 -c "import torch; print(torch.zeros(1).cuda())"` |
