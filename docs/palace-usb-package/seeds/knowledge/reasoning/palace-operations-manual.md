# Palace Operations Manual

## Purpose

This is the complete operations manual for the Palace — the local AI infrastructure that powers Stone AI's agent ecosystem. It covers startup procedures, daily operations, maintenance, troubleshooting, emergency procedures, and founder escalation protocols. This document is the single source of truth for keeping the Palace running.

## Why This Matters

The Palace is not a toy — it's the backbone of three businesses. Downtime means lost users, lost revenue, and lost trust. This manual ensures anyone with access (currently: the founder) can start, operate, maintain, and troubleshoot the Palace without relying on memory or tribal knowledge.

---

## System Overview

### Hardware Configuration

```
Machine: HP OMEN 45L
CPU: AMD Ryzen (high-core count)
GPU: NVIDIA RTX 5090 (32GB VRAM)
RAM: 64GB DDR5
Storage: 4TB NVMe SSD
OS: Windows 11 Pro
Network: Gigabit Ethernet + WiFi 6E
```

### Software Stack

```
Inference Engine: vLLM (latest stable)
Model: Qwen 2.5 32B Instruct AWQ (quantized for VRAM efficiency)
Runtime: Python 3.11+ with CUDA toolkit
Container: Docker (optional, for isolated services)
Database: PostgreSQL 16 + pgvector (Neon for production, local for dev)
Cache: Redis 6379
Platform: Next.js application on Vercel
Auth: Clerk
Payments: Stripe
```

### Network Architecture

```
PRODUCTION FLOW:
  User → Cloudflare (proxy + SSL) → Vercel (Next.js) → Neon DB
                                        ↓
                                   vLLM (OMEN, local)
                                   [or Claude API fallback]

LOCAL DEVELOPMENT:
  localhost:3000 → Next.js dev server → localhost:5432 (Docker PG)
                                           ↓
                                      localhost:8000 (vLLM)
                                      localhost:6379 (Redis)
```

---

## Startup Procedures

### Full System Startup (Cold Boot)

Execute in order. Do not skip steps.

```
STEP 1: Hardware Power-On
  [ ] Power on OMEN 45L
  [ ] Verify POST completes (no beep codes)
  [ ] Log into Windows 11
  [ ] Verify GPU is detected: nvidia-smi
      Expected: RTX 5090, driver version, CUDA version
      If missing: Check PCIe seating, driver installation

STEP 2: GPU Health Check
  [ ] Run: nvidia-smi
  [ ] Verify: Temperature < 40°C at idle
  [ ] Verify: VRAM shows full 32GB
  [ ] Verify: No ECC errors listed
  [ ] If issues: DO NOT proceed. See Troubleshooting section.

STEP 3: Start Docker Services
  [ ] Run: docker start stoneai-db
  [ ] Verify PG is up: docker exec stoneai-db pg_isready
      Expected: "accepting connections"
  [ ] Run: docker ps — verify stoneai-db is running
  [ ] Verify Redis: redis-cli ping → PONG

STEP 4: Start vLLM
  [ ] Open Git Bash terminal
  [ ] Activate Python environment (DO NOT hardcode Python paths)
  [ ] Run vLLM server:
      python -m vllm.entrypoints.openai.api_server \
        --model Qwen/Qwen2.5-32B-Instruct-AWQ \
        --quantization awq \
        --gpu-memory-utilization 0.90 \
        --max-model-len 8192 \
        --host 0.0.0.0 \
        --port 8000
  [ ] Wait for: "Uvicorn running on http://0.0.0.0:8000"
  [ ] Verify health: curl http://localhost:8000/health
      Expected: 200 OK
  [ ] Verify model: curl http://localhost:8000/v1/models
      Expected: Model list containing Qwen

STEP 5: Verify Inference
  [ ] Send test prompt:
      curl http://localhost:8000/v1/chat/completions \
        -H "Content-Type: application/json" \
        -d '{"model":"Qwen/Qwen2.5-32B-Instruct-AWQ",
             "messages":[{"role":"user","content":"Hello"}],
             "max_tokens":50}'
  [ ] Verify: Response contains coherent text
  [ ] Verify: Response time < 10 seconds

STEP 6: Start Development Server (if developing locally)
  [ ] cd C:\Users\stone\stone-ai
  [ ] npm run dev
  [ ] Verify: http://localhost:3000 loads
  [ ] Verify: API routes respond

STEP 7: System Status Check
  [ ] All services green? Log startup time and date.
  [ ] Any warnings? Document them before proceeding.
```

### Quick Restart (vLLM Only)

When vLLM crashed but everything else is fine:

```bash
# Kill any orphan vLLM processes
taskkill /F /IM python.exe /FI "WINDOWTITLE eq vLLM*" 2>/dev/null

# Wait for GPU memory to clear
sleep 5
nvidia-smi  # Verify VRAM is free

# Restart vLLM
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --quantization awq \
  --gpu-memory-utilization 0.90 \
  --max-model-len 8192 \
  --host 0.0.0.0 \
  --port 8000

# Verify
curl http://localhost:8000/health
```

---

## Daily Operations

### Morning Checklist (5 minutes)

```
[ ] 1. GPU Status: nvidia-smi
       Check: Temp < 50°C, no errors, VRAM as expected
[ ] 2. vLLM Status: curl http://localhost:8000/health
       Check: 200 OK
[ ] 3. Docker Status: docker ps
       Check: stoneai-db running, healthy
[ ] 4. Redis Status: redis-cli ping
       Check: PONG
[ ] 5. Quick Inference Test: Send "Hello" to vLLM
       Check: Response in < 10 seconds
[ ] 6. Disk Space: Check free space > 100GB
[ ] 7. Check logs for overnight errors
```

### During Operations

Monitor these during active use:

```
GPU Temperature: Keep below 85°C under load
  Check: nvidia-smi -l 5 (updates every 5 seconds)
  Alert: If temp > 80°C, reduce concurrent sessions

VRAM Usage: Keep below 95%
  Check: nvidia-smi
  Alert: If > 95%, some requests may OOM

Inference Latency: Should be < 15 seconds per response
  Check: Time a test request
  Alert: If > 20 seconds, check for resource contention

Error Rate: Should be < 1%
  Check: vLLM logs for error messages
  Alert: Any recurring error pattern needs investigation
```

### End-of-Day Procedures

```
[ ] 1. Review any errors from today's logs
[ ] 2. Note any performance anomalies
[ ] 3. GPU temperature check (should be returning to idle)
[ ] 4. Decision: Leave running overnight or shut down?
       - Leave running: If expecting overnight users
       - Shut down: If no overnight usage expected (saves power/GPU life)
[ ] 5. If shutting down:
       - Stop vLLM (Ctrl+C or kill process)
       - Optionally stop Docker: docker stop stoneai-db
       - GPU fan will spin down naturally
```

---

## Maintenance Procedures

### Weekly Maintenance (30 minutes)

```
EVERY MONDAY:
[ ] 1. Update system packages (Windows Update check)
[ ] 2. Check NVIDIA driver version — update if new stable release
[ ] 3. Check vLLM version — update if new stable release
[ ] 4. Review week's error logs
[ ] 5. Disk cleanup: Clear temp files, old logs, pip cache
[ ] 6. Check Docker container health: docker inspect stoneai-db
[ ] 7. Run 3 agent spot-check tests
[ ] 8. Document any issues in weekly log
```

### Monthly Maintenance (2 hours)

```
FIRST SATURDAY OF MONTH:
[ ] 1. Full system restart (cold boot test)
[ ] 2. GPU stress test: Run sustained inference for 30 minutes
       Monitor: Temperature, VRAM, error rate
[ ] 3. Database maintenance:
       - Check PG table bloat
       - Run VACUUM ANALYZE on large tables
       - Check index health
[ ] 4. Backup verification:
       - Verify Neon automated backups exist
       - Test a backup restore (on a branch, not production)
[ ] 5. Security check:
       - Review open ports
       - Check for unauthorized access attempts
       - Update any expired credentials
[ ] 6. Performance benchmarking:
       - Run standard inference benchmark
       - Compare to previous month
       - Document any degradation
[ ] 7. Knowledge seed review:
       - Check for outdated seeds
       - Review gap analysis results
       - Plan any seed updates
[ ] 8. Agent certification spot-checks:
       - Pick 5 random agents
       - Run mini-certification
       - Document results
```

### Quarterly Maintenance (Half Day)

```
EVERY 3 MONTHS:
[ ] 1. Full agent certification run (all 40 agents)
[ ] 2. Hardware inspection:
       - Clean dust filters
       - Check fan operation
       - Inspect cable connections
       - Check thermal paste condition (visual only)
[ ] 3. Complete knowledge audit (see knowledge-completeness-audit.md)
[ ] 4. Model evaluation:
       - Is current model still best option?
       - Any new models worth testing?
       - Benchmark against newer alternatives
[ ] 5. Infrastructure review:
       - Is current hardware sufficient?
       - Any bottlenecks identified?
       - Plan hardware upgrades if needed
[ ] 6. Security audit:
       - Full OWASP review of API routes
       - Check all authentication flows
       - Review rate limiting configuration
       - Check encryption implementation
[ ] 7. Disaster recovery test:
       - Simulate Palace failure
       - Verify fallback to Claude API works
       - Measure recovery time
       - Document any gaps in recovery plan
```

---

## Monitoring & Alerts

### Key Metrics to Track

```
INFRASTRUCTURE METRICS:
  - GPU temperature (target: < 80°C under load)
  - GPU VRAM usage (target: < 95%)
  - System RAM usage (target: < 80%)
  - Disk usage (alert at < 100GB free)
  - Network latency to Vercel (target: < 100ms)

INFERENCE METRICS:
  - Requests per minute
  - Average response time (target: < 15 seconds)
  - P95 response time (target: < 30 seconds)
  - Error rate (target: < 1%)
  - Tokens per second (throughput)

APPLICATION METRICS:
  - Active users
  - Agent usage distribution
  - API error rates
  - Authentication failures
  - Rate limit hits
```

### Alert Thresholds

```
CRITICAL (immediate action required):
  - vLLM health check fails
  - GPU temperature > 90°C
  - Disk space < 50GB
  - Database connection fails
  - Error rate > 10%

WARNING (investigate within 1 hour):
  - GPU temperature > 80°C
  - Response time > 20 seconds
  - VRAM > 95%
  - Error rate > 5%
  - Disk space < 100GB

INFO (review during daily check):
  - GPU temperature > 70°C
  - Response time > 15 seconds
  - New driver available
  - vLLM update available
```

### Alert Delivery

```
Alerts sent via: sendFounderAlert() (Three-Headed Monster email system)
Alert email: 3headedm@gmail.com
Alert types:
  - "system.critical" — Critical infrastructure alert
  - "system.warning" — Warning level alert
  - "system.info" — Informational alert
```

---

## Troubleshooting Quick Reference

### vLLM Won't Start

```
Symptom: vLLM fails to launch, error on startup

Check 1: Is GPU detected?
  → nvidia-smi
  → If not: Restart PC, check driver, check PCIe

Check 2: Is VRAM available?
  → nvidia-smi (check memory usage)
  → If occupied: Kill other GPU processes

Check 3: Is model downloaded?
  → Check model cache directory
  → If missing: Re-download model

Check 4: Is CUDA compatible?
  → Check CUDA version vs vLLM requirements
  → If mismatch: Update CUDA toolkit or vLLM

Check 5: Is port 8000 in use?
  → netstat -ano | findstr 8000
  → If occupied: Kill the process or use different port
```

### Slow Inference

```
Symptom: Responses taking > 20 seconds

Check 1: GPU utilization
  → nvidia-smi (watch GPU usage percentage)
  → If 100%: Too many concurrent requests

Check 2: VRAM usage
  → nvidia-smi (check memory)
  → If > 95%: Reduce max_model_len or gpu_memory_utilization

Check 3: Context length
  → Are requests sending very long contexts?
  → Solution: Trim context or reduce max_tokens

Check 4: Thermal throttling
  → nvidia-smi (check temperature)
  → If > 85°C: GPU is throttling. Improve cooling.

Check 5: Background processes
  → Task Manager → check for CPU/GPU hogs
  → Kill unnecessary processes
```

### Agent Gives Bad Responses

```
Symptom: Agent output is incoherent, off-topic, or low quality

Check 1: Is this a prompt issue?
  → Test the same prompt with a simple system message
  → If good response: System prompt needs tuning
  → If bad response: Model or inference issue

Check 2: Is temperature too high?
  → Check temperature setting for this agent
  → Try temperature 0.3 for factual agents
  → Try temperature 0.7 for creative agents

Check 3: Is the model quantization causing issues?
  → AWQ quantization loses some quality
  → Compare output to unquantized model if available
  → Certain complex reasoning may suffer

Check 4: Is context window full?
  → Very long conversations degrade quality
  → Implement context truncation

Check 5: Is the system prompt too complex?
  → Simplify and test
  → Remove conflicting instructions
  → Focus on core identity and constraints
```

---

## Emergency Procedures

### Level 1: Service Outage (vLLM down)

```
IMPACT: Agents unavailable, users get errors
TIME TO RESOLVE: 5-15 minutes

STEPS:
1. Verify vLLM is actually down: curl http://localhost:8000/health
2. Check GPU: nvidia-smi
3. If GPU is fine: Restart vLLM (see Quick Restart)
4. If GPU has errors: Full system restart
5. If still failing: Activate Claude API fallback
   → Set environment: FALLBACK_MODE=claude
   → Vercel will route to Claude Haiku
6. Notify founder via alert
7. Investigate root cause after service is restored
```

### Level 2: Hardware Failure

```
IMPACT: Complete Palace outage
TIME TO RESOLVE: Hours to days

STEPS:
1. Confirm hardware failure (GPU dead, PSU failure, etc.)
2. IMMEDIATELY activate Claude API fallback
3. Notify founder with full details
4. If GPU failure:
   → RMA process with NVIDIA/HP
   → Estimated timeline: 7-14 days
   → Palace runs on Claude API during this time
5. If other hardware:
   → Assess repairability
   → Source replacement parts
6. Document the failure for future prevention
```

### Level 3: Data Breach / Security Incident

```
IMPACT: User data at risk
TIME TO RESOLVE: Immediate containment, days for full resolution

STEPS:
1. CONTAIN: Take affected services offline immediately
2. ASSESS: What was accessed? What data is at risk?
3. PRESERVE: Save all logs before they rotate
4. NOTIFY: Founder immediately via all channels
5. INVESTIGATE: Full security audit
6. REMEDIATE: Fix the vulnerability
7. COMMUNICATE: If user data affected, plan disclosure
8. PREVENT: Update security measures to prevent recurrence

DO NOT:
  - Destroy evidence (keep all logs)
  - Attempt to cover up the incident
  - Resume normal operations without security review
```

### Level 4: Complete System Loss

```
IMPACT: OMEN is destroyed/stolen/unrecoverable
TIME TO RESOLVE: Days to weeks

STEPS:
1. Claude API fallback is AUTOMATIC (Vercel detects vLLM unreachable)
2. Users continue with Claude Haiku (reduced quality but functional)
3. Founder assesses situation
4. Recovery plan:
   a. If hardware replaceable: Source new hardware, restore from USB package
   b. If temporary: Use cloud GPU rental (RunPod, Lambda, etc.)
   c. If permanent: Full Palace rebuild on new hardware
5. The Palace USB Package contains everything needed to rebuild:
   - All knowledge seeds
   - All configuration files
   - All system prompts
   - Complete documentation
6. Estimated rebuild time: 1-2 days with new hardware and USB package
```

---

## Founder Escalation Protocols

### When to Escalate

```
ALWAYS ESCALATE:
  - Any security incident
  - Hardware failure
  - Sustained outage > 30 minutes
  - Data loss of any kind
  - User complaints about safety violations
  - Any incident affecting paying users

ESCALATION CHANNEL: sendFounderAlert() with alertType "system.critical"
BACKUP CHANNEL: Direct notification if email system is also down
```

### Escalation Information Template

```
ESCALATION REPORT
=================
Severity: [CRITICAL / HIGH / MEDIUM]
Time Detected: [Timestamp]
Service Affected: [vLLM / Database / API / Auth / etc.]

WHAT HAPPENED:
  [Brief description]

CURRENT IMPACT:
  [What users are experiencing]

ACTIONS TAKEN:
  [What has been done so far]

CURRENT STATUS:
  [Is the system up, degraded, or down?]

NEXT STEPS:
  [What needs to happen next]

FOUNDER DECISION NEEDED:
  [Yes/No — what decision?]
```

---

## Operational Logs

### Log Locations

```
vLLM logs: Terminal output (capture with tee or redirect)
Docker/PG logs: docker logs stoneai-db
Application logs: Vercel dashboard → Logs
System logs: Windows Event Viewer
GPU logs: nvidia-smi -l output
```

### Log Retention

```
Operational logs: 30 days
Error logs: 90 days
Security logs: 1 year
Performance benchmarks: Permanent (for trend analysis)
Incident reports: Permanent
```

### Log Review Schedule

```
Daily: Scan for errors and warnings
Weekly: Review error patterns and trends
Monthly: Archive old logs, generate summary report
Quarterly: Analyze long-term trends
```

---

## Operational Checklists Summary

| Checklist | Frequency | Time | Owner |
|-----------|-----------|------|-------|
| Morning startup | Daily | 5 min | Founder |
| End-of-day review | Daily | 5 min | Founder |
| Weekly maintenance | Weekly | 30 min | Founder/Chaos |
| Monthly maintenance | Monthly | 2 hrs | Founder/Chaos |
| Quarterly deep review | Quarterly | 4 hrs | All Three Heads |
| Agent certification | Quarterly | Full day | Stone |
| Knowledge audit | Quarterly | 4 hrs | Cardinal |
| Security audit | Quarterly | 2 hrs | Security specialist |
| Disaster recovery test | Quarterly | 1 hr | Chaos |

This operations manual is the Palace's bible. Follow it, and the Palace runs smoothly. Ignore it, and problems compound silently until they become crises.
