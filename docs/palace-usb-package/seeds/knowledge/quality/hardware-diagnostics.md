# Hardware Diagnostics
## GPU Health, OMEN Monitoring, Degradation Detection

Version: 1.0 | GPU: RTX 5090 (OMEN) + RX 550 (Dev) | Workload: vLLM + Qwen 2.5 32B AWQ

---

## 1. GPU HEALTH MONITORING

### nvidia-smi Parsing
```bash
# Basic status check
nvidia-smi

# Key fields to parse:
# Temperature:     GPU Temp column (C)
# Power:           Power Usage / Power Cap
# Memory:          Memory-Usage (Used/Total)
# Utilization:     GPU-Util %
# Errors:          ECC errors, Xid errors

# Machine-readable output:
nvidia-smi --query-gpu=name,temperature.gpu,power.draw,power.limit,memory.used,memory.total,utilization.gpu,utilization.memory --format=csv,noheader,nounits

# Example output:
# NVIDIA GeForce RTX 5090, 45, 85.00, 450.00, 8192, 32768, 65, 40

# Continuous monitoring (every 2 seconds):
nvidia-smi -l 2

# Log to file for trend analysis:
nvidia-smi --query-gpu=timestamp,temperature.gpu,power.draw,memory.used,utilization.gpu --format=csv -l 5 >> /var/log/gpu-metrics.csv
```

### nvidia-smi Field Interpretation
```
| Field          | Healthy         | Warning          | Critical           |
|----------------|-----------------|------------------|--------------------|
| Temperature    | < 70C           | 70-83C           | > 83C (throttle)   |
| Power Draw     | < 80% of limit  | 80-95% of limit  | > 95% (near limit) |
| Memory Used    | < 80% of total  | 80-90%           | > 90% (OOM risk)   |
| GPU Util       | Varies by load  | Sustained 100%   | 100% + queue growth|
| Memory Util    | < 80%           | 80-95%           | > 95%              |
| ECC Errors     | 0               | 1-10 correctable | Any uncorrectable  |
| Xid Errors     | None            | Any Xid error    | Xid 79/119 (fatal) |
```

### Xid Error Reference (Critical Errors)
```
Xid 13:  Graphics Engine Exception → Driver bug or hardware fault
Xid 31:  GPU memory page fault → VRAM corruption or driver issue
Xid 43:  GPU stopped processing → Hardware hang
Xid 48:  Double Bit ECC Error → VRAM cell failure (CRITICAL)
Xid 63:  ECC page retirement → VRAM degradation
Xid 64:  ECC page retirement (double bit) → Imminent failure
Xid 79:  GPU Fallen Off the Bus → PCIe link failure (CRITICAL)
Xid 119: GPU Fallen Off the Bus → Power issue (CRITICAL)

DETECTION:
  dmesg | grep -i "xid\|nvrm\|nvidia"
  # Or check system log
  journalctl -u nvidia-persistenced --since "1 hour ago"

ACTION for any Xid error:
  1. Log the error with timestamp
  2. Check GPU temperature at time of error
  3. Xid 48/63/64: Run memory test → plan hardware replacement if persistent
  4. Xid 79/119: Check PCIe seating, power cables, PSU output
  5. Any Xid: report to founder immediately
```

---

## 2. RTX 5090 PROFILE

### Blackwell Architecture Specs
```
| Spec                    | RTX 5090                    |
|-------------------------|-----------------------------|
| Architecture            | Blackwell (GB202)           |
| VRAM                    | 32GB GDDR7                  |
| Memory Bus              | 512-bit                     |
| Memory Bandwidth        | ~1.8 TB/s                   |
| CUDA Cores              | ~21,760                     |
| Tensor Cores            | 5th gen                     |
| TDP                     | 450W                        |
| PCIe                    | Gen 5 x16                   |
| NVLink                  | Not on consumer cards        |
| Max Temp (Tjunction)    | 90C (throttle starts ~83C)  |
```

### Expected VRAM Patterns for Our Workload
```
Qwen 2.5 32B AWQ on RTX 5090 (32GB VRAM):

MODEL LOADING:
  - Model weights (AWQ 4-bit): ~16-18GB VRAM
  - Expected load time: 15-30 seconds
  - Post-load idle: ~17GB used

INFERENCE:
  - KV cache per request: varies by sequence length
  - Short prompt (512 tokens): +200-400MB per concurrent request
  - Long prompt (4096 tokens): +1-2GB per concurrent request
  - Max concurrent at 4096 tokens: ~7-8 requests

VRAM BUDGET:
  Total:          32GB
  Model weights:  ~17GB
  OS/Driver:      ~1GB
  Available:      ~14GB for KV cache + overhead
  Safety margin:  ~2GB (keep free)
  Usable:         ~12GB for inference

HEALTHY VRAM PATTERN:
  Idle:    ~17-18GB used (model loaded)
  Light:   ~20-22GB (few concurrent requests)
  Heavy:   ~26-28GB (many concurrent requests)
  Danger:  >29GB (approaching OOM)
```

---

## 3. OMEN DIAGNOSTICS

### Remote Health Check Script
```bash
#!/bin/bash
# omen-health.sh — Run from dev machine, SSH to OMEN
OMEN_HOST="[OMEN_IP]"

echo "=== OMEN Health Check ==="

# GPU Status
echo "--- GPU ---"
ssh $OMEN_HOST "nvidia-smi --query-gpu=name,temperature.gpu,power.draw,memory.used,memory.total,utilization.gpu --format=csv,noheader"

# vLLM Process
echo "--- vLLM ---"
ssh $OMEN_HOST "pgrep -a vllm || echo 'vLLM NOT RUNNING'"

# vLLM API Health
echo "--- vLLM API ---"
ssh $OMEN_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health || echo 'vLLM API UNREACHABLE'"

# System Resources
echo "--- System ---"
ssh $OMEN_HOST "free -h | head -2"
ssh $OMEN_HOST "df -h / | tail -1"
ssh $OMEN_HOST "uptime"

# Recent Errors
echo "--- Recent GPU Errors ---"
ssh $OMEN_HOST "dmesg | grep -i 'nvidia\|xid\|error' | tail -5"
```

### GPU Utilization Baselines
```
| Scenario                     | GPU Util | VRAM Used | Temp  | Power |
|------------------------------|----------|-----------|-------|-------|
| Idle (model loaded)          | 0-5%     | ~17GB     | 35-45C| ~30W  |
| Single inference request     | 40-70%   | ~19GB     | 50-60C| 150W  |
| 3 concurrent requests        | 70-90%   | ~23GB     | 60-70C| 250W  |
| 5+ concurrent requests       | 95-100%  | ~27GB     | 70-80C| 350W  |
| Stress test (max concurrent) | 100%     | ~30GB     | 75-83C| 400W+ |

If metrics deviate significantly from baselines → investigate
```

### Inference Latency Baselines
```
| Prompt Length | Output Length | Expected Latency | Tokens/sec |
|---------------|---------------|-------------------|------------|
| 128 tokens    | 256 tokens    | 1-3s              | ~80-120    |
| 512 tokens    | 512 tokens    | 3-6s              | ~70-100    |
| 2048 tokens   | 1024 tokens   | 8-15s             | ~60-90     |
| 4096 tokens   | 2048 tokens   | 20-40s            | ~50-80     |
| 8192 tokens   | 4096 tokens   | 45-90s            | ~40-70     |

DEGRADATION THRESHOLDS:
  If actual latency > 2x expected → check GPU health
  If tokens/sec < 50% baseline → check thermal throttling
  If latency spikes intermittently → check concurrent load
```

---

## 4. DEGRADATION DETECTION

### Thermal Paste Aging
```
SYMPTOM: GPU temperatures 10-15C higher than baseline at same workload
TIMELINE: Thermal paste degrades over 2-4 years
DETECTION:
  Compare current idle temp to initial baseline:
  - Initial idle: 35-40C
  - After 1 year: 38-43C (normal)
  - After 2 years: 42-48C (monitoring)
  - After 3 years: 48-55C (repaste recommended)
  - If idle > 55C: repaste urgently

ACTION:
  1. Log temperatures weekly
  2. Compare to baselines above
  3. If temps elevated 10C+ → clean fans first (dust)
  4. If still elevated → repaste GPU (IPA clean + new paste)
  5. Use high-quality paste: Thermal Grizzly Kryonaut or Noctua NT-H2
```

### VRAM Cell Failure Patterns
```
SYMPTOM: Increasing ECC errors, visual artifacts, CUDA memory errors
PROGRESSION:
  Stage 1: Occasional correctable ECC errors (logged, auto-fixed)
  Stage 2: Frequent correctable errors (performance impact)
  Stage 3: Uncorrectable errors (Xid 48/63/64)
  Stage 4: GPU becomes unstable, frequent crashes

DETECTION:
  # Check ECC error counts
  nvidia-smi --query-gpu=ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv,noheader

  # Aggregate since last reset
  nvidia-smi --query-gpu=ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv,noheader

  # Note: Consumer GPUs (RTX) may not support ECC
  # Alternative: watch for Xid errors in dmesg

VRAM STRESS TEST:
  # Use cuda-memcheck or compute-sanitizer
  compute-sanitizer --tool memcheck /path/to/test/program

  # Or gpu-burn for stress testing
  gpu-burn 300  # 5-minute stress test

ACTION:
  - Correctable errors < 10/day: monitor
  - Correctable errors > 100/day: plan replacement
  - Any uncorrectable error: replace ASAP
```

### PSU Ripple Effects
```
SYMPTOM: Random GPU crashes (Xid 79/119), system reboots under load
ROOT CAUSE: PSU can't deliver clean power under peak GPU load

DETECTION:
  - GPU crashes ONLY under heavy load (not idle)
  - System reboots without BSOD (hard power loss)
  - GPU power draw near PSU rail limit

RTX 5090 POWER REQUIREMENTS:
  - GPU TDP: 450W
  - Recommended PSU: 850W+ (1000W with high-end CPU)
  - 12VHPWR connector: must be properly seated
  - Rail capacity: check 12V rail can deliver >40A

CHECKS:
  1. Verify PSU wattage meets requirement
  2. Check 12VHPWR connector for melting/discoloration
  3. Monitor GPU power draw under load:
     nvidia-smi --query-gpu=power.draw,power.limit --format=csv -l 1
  4. If power.draw fluctuates wildly → PSU issue
  5. If system crashes at consistent power draw level → PSU rail limit
```

---

## 5. HARDWARE VS SOFTWARE — Decision Tree

```
PROBLEM: GPU error or poor performance
  │
  ├─ Does the error reproduce with different software/drivers?
  │   ├─ YES → likely HARDWARE
  │   └─ NO → likely SOFTWARE (driver/library issue)
  │
  ├─ Does the error correlate with temperature?
  │   ├─ YES (only when GPU > 80C) → THERMAL issue
  │   │   ├─ Clean fans/heatsink
  │   │   ├─ Repaste if needed
  │   │   └─ Check case airflow
  │   └─ NO → continue
  │
  ├─ Does the error correlate with load?
  │   ├─ YES (only under heavy load) →
  │   │   ├─ Check PSU capacity
  │   │   ├─ Check power connector
  │   │   └─ Check VRAM usage (OOM = software)
  │   └─ NO (happens at idle too) → likely HARDWARE
  │
  ├─ Are there ECC/Xid errors in logs?
  │   ├─ YES → HARDWARE degradation
  │   │   ├─ ECC correctable: monitor, plan replacement
  │   │   └─ ECC uncorrectable: replace soon
  │   └─ NO → continue
  │
  ├─ Does a driver update fix it?
  │   ├─ YES → was SOFTWARE (driver bug)
  │   └─ NO → continue
  │
  ├─ Does it happen with a different model/weights?
  │   ├─ YES (same error, different model) → HARDWARE or driver
  │   └─ NO (only this model) → SOFTWARE (model/weights issue)
  │
  └─ Does it happen after a fresh reboot?
      ├─ YES → HARDWARE (or persistent driver issue)
      └─ NO → SOFTWARE (state corruption, memory leak)

QUICK TESTS:
  1. nvidia-smi → check temp, power, memory, errors
  2. dmesg | grep xid → check for hardware errors
  3. gpu-burn 60 → 1-minute stress test → crashes = hardware
  4. Different CUDA app → same crash = hardware, different = software
```

---

## 6. RX 550 (DEV MACHINE) NOTES

```
AMD Radeon RX 550 — Development machine GPU
  - NOT used for inference (too weak)
  - Used for: display output, basic compute if needed
  - No CUDA support (AMD)
  - No vLLM support
  - Monitor with: AMD Software / radeontop (Linux)

Dev machine GPU health is LOW PRIORITY — inference runs on OMEN.
Only investigate if display issues occur.
```

---

## MONITORING SCHEDULE

```
| Check                        | Frequency  | Tool                    |
|------------------------------|------------|-------------------------|
| GPU temperature              | Continuous | nvidia-smi -l 5         |
| VRAM usage                   | Per request| nvidia-smi or API       |
| ECC errors                   | Daily      | nvidia-smi query        |
| Xid errors                   | Daily      | dmesg grep              |
| Inference latency baseline   | Weekly     | Custom benchmark script  |
| Thermal trend comparison     | Weekly     | Log analysis            |
| Full stress test             | Monthly    | gpu-burn 300            |
| Fan/heatsink inspection      | Quarterly  | Physical inspection     |
| Power connector inspection   | Quarterly  | Physical inspection     |
```

---

## ALERT THRESHOLDS (for automated monitoring)

```typescript
const GPU_ALERTS = {
  temperature: { warn: 75, critical: 83, unit: 'C' },
  vramUsage:   { warn: 0.85, critical: 0.92, unit: 'ratio' },
  powerDraw:   { warn: 0.90, critical: 0.95, unit: 'ratio of limit' },
  eccErrors:   { warn: 1, critical: 10, unit: 'per day' },
  inferenceLatency: { warn: 2.0, critical: 3.0, unit: 'x baseline' },
  // These trigger sendFounderAlert() via the Three-Headed Monster email system
};
```
