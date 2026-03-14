# Daily Operations Checklist

## Purpose

This seed provides the structured daily operational routine for the Palace. It covers morning startup, health checks, system monitoring throughout the day, end-of-day procedures, and maintenance windows. Following this checklist consistently prevents small issues from becoming big problems.

## Why This Matters

Systems degrade silently. A GPU running 5 degrees hotter each week. A log file slowly filling the disk. An agent that started drifting three days ago. Daily checks catch these trends before they become outages. Discipline in daily operations is what separates a reliable system from a fragile one.

---

## Morning Startup Routine (5-10 minutes)

### If Palace Was Left Running Overnight

```
TIME: First thing in the morning, before any other work

STEP 1: Quick Health Check
  □ nvidia-smi
    → GPU detected? Temperature reasonable (< 50°C idle)?
    → VRAM usage expected? No ECC errors?

  □ curl -s http://localhost:8000/health
    → 200 OK? If not, restart vLLM.

  □ docker ps
    → stoneai-db running and healthy?

  □ redis-cli ping
    → PONG?

STEP 2: Overnight Log Review
  □ Check vLLM terminal for overnight errors
    → Look for: OOM, CUDA errors, timeout patterns
    → If errors found: Note them, assess severity

  □ Check Docker logs: docker logs --since 12h stoneai-db
    → Look for: connection refused, crash recovery, unexpected restarts
    → If errors found: Note them, assess severity

STEP 3: Quick Inference Test
  □ Send a test prompt to vLLM
    → Response in < 10 seconds?
    → Response coherent?
    → If slow or incoherent: Restart vLLM

STEP 4: Resource Check
  □ Disk space: df -h /
    → More than 100GB free? If not, clean up.
  □ RAM usage: free -h (or Task Manager)
    → Less than 80% used? If not, investigate what's consuming it.

STEP 5: Log Morning Status
  □ Record: Date, time, all checks passed? Any notes?
  □ Format: "2026-03-10 08:00 — All systems green" or note issues
```

### If Palace Was Shut Down Overnight

```
Follow the Full System Startup procedure in palace-operations-manual.md

Additional morning items after startup:
  □ Verify vLLM model is fully loaded (first inference may be slow)
  □ Allow 2-3 minutes for GPU to warm up
  □ Run 3 test inferences before considering system ready
  □ Check that Vercel/production can reach vLLM
```

---

## Midday Health Check (2-3 minutes)

### Quick Status Sweep

```
TIME: Around noon or after 4 hours of operation

□ GPU Temperature Check
  nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader
  → Under 80°C? Good.
  → 80-85°C? Monitor more closely. Check ambient temperature.
  → Over 85°C? Reduce load or improve cooling.

□ VRAM Usage
  nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader
  → Under 95%? Good.
  → Over 95%? Possible memory leak. Note it for end-of-day.

□ Quick vLLM Health
  curl -s http://localhost:8000/health
  → 200 OK? Move on.
  → Error? Investigate immediately.

□ Vercel Check (if production is live)
  → Visit https://stone-ai.net briefly
  → Loading normally? Chat working?
  → Any visual bugs or errors?
```

---

## Active Monitoring During Heavy Use

When multiple users are active or you're running tests:

```
CONTINUOUS MONITORING COMMANDS:

# GPU monitoring (updates every 5 seconds)
nvidia-smi -l 5

# Watch for these red flags:
  → Temperature climbing above 80°C
  → VRAM consistently above 90%
  → GPU utilization pegged at 100% for extended periods
  → Power draw near maximum TDP

# vLLM request monitoring
# Watch the vLLM terminal for:
  → Error messages
  → Timeout warnings
  → OOM (out of memory) errors
  → Unusual latency spikes

# If you see problems during heavy use:
  1. Reduce concurrent requests
  2. Check if context lengths are unusually long
  3. Consider temporarily lowering max_model_len
  4. If GPU is thermal throttling: Point a fan at the case
```

---

## End-of-Day Procedures (5-10 minutes)

### Daily Wrap-Up

```
TIME: End of work day, before deciding to leave running or shut down

STEP 1: Performance Review
  □ How did the system perform today?
    → Any slow periods?
    → Any errors or crashes?
    → Any user complaints?
  □ Note any anomalies for weekly review

STEP 2: Log Review
  □ Scan vLLM logs for errors since morning
    → New errors? Recurring patterns?
  □ Scan Docker logs for database issues
    → Connection problems? Slow queries?
  □ Check Vercel deployment logs (if applicable)
    → Any failed deployments? API errors?

STEP 3: Resource Trending
  □ GPU temperature pattern today:
    → Stable throughout? Trending up?
    → Compare to yesterday. Getting hotter over days = problem.
  □ Disk usage:
    → Growing faster than expected?
    → Any large log files to rotate?
  □ Memory usage:
    → Stable or growing? Growing = possible leak.

STEP 4: Overnight Decision
  □ Leave running or shut down?

  LEAVE RUNNING IF:
    → Users expected overnight (different time zones)
    → Running automated tests overnight
    → No thermal concerns
    → System has been stable all day

  SHUT DOWN IF:
    → No overnight users expected
    → GPU temperature was concerning
    → Want to save power/extend hardware life
    → System showed instability today
    → Maintenance planned for tomorrow morning

STEP 5: If Shutting Down
  □ Stop vLLM: Ctrl+C in terminal
  □ Verify vLLM process is gone: tasklist | findstr python
  □ Optionally stop Docker: docker stop stoneai-db
  □ Verify GPU is idle: nvidia-smi (memory should be minimal)
  □ Leave a note about system state for tomorrow morning

STEP 6: If Leaving Running
  □ Verify all health checks pass one more time
  □ Ensure vLLM terminal is visible (to catch errors)
  □ Consider: Is monitoring active? Will you be alerted if it crashes?
  □ Set display to not sleep (prevent any power management issues)
```

---

## Weekly Maintenance Window

### Recommended: Monday Morning (30 minutes)

```
BEFORE REGULAR OPERATIONS:

□ Windows Update Check
  → Any pending updates?
  → If critical security update: Install and restart
  → If feature update: Schedule for weekend

□ NVIDIA Driver Check
  → Current version: nvidia-smi | head -1
  → Latest version: Check NVIDIA website
  → If new stable release available: Schedule update for weekend

□ vLLM Version Check
  → Current: pip show vllm
  → Latest: Check GitHub releases
  → If new version: Test on branch before updating production

□ Docker Maintenance
  → docker system prune -f (clean unused resources)
  → docker logs --tail 1000 stoneai-db > weekly_pg_log.txt (archive)

□ Log Cleanup
  → Archive logs older than 7 days
  → Delete temp files
  → Clear pip cache if disk space is tight

□ Agent Spot Check
  → Pick 3 random agents
  → Send each a domain question
  → Grade response quality (1-5 scale)
  → Document results

□ Performance Benchmark
  → Run standard inference test
  → Record: Response time, tokens/second
  → Compare to last week
  → Flag any degradation > 10%

□ Weekly Status Entry
  → System health: [GREEN/YELLOW/RED]
  → Notable events this week
  → Metrics trending
  → Priorities for next week
```

---

## System Monitoring Dashboard (Manual)

Since the Palace doesn't have a fancy monitoring dashboard yet, use this manual tracking sheet:

### Daily Tracking Template

```
DATE: ___________

MORNING CHECK:
  GPU Temp:       ___°C  (idle)
  VRAM Used:      ___GB / 32GB
  vLLM Status:    [UP / DOWN]
  DB Status:      [UP / DOWN]
  Redis Status:   [UP / DOWN]
  Disk Free:      ___GB
  RAM Used:       ___GB / 64GB
  Notes:          ________________________________

MIDDAY CHECK:
  GPU Temp:       ___°C  (under load)
  vLLM Status:    [UP / DOWN]
  Inference Time: ___s  (test prompt)
  Notes:          ________________________________

END-OF-DAY:
  GPU Peak Temp:  ___°C
  Errors Today:   ___
  System Status:  [GREEN / YELLOW / RED]
  Overnight Plan: [RUNNING / SHUTDOWN]
  Notes:          ________________________________
```

### Weekly Trending Template

```
WEEK OF: ___________

              Mon   Tue   Wed   Thu   Fri   Sat   Sun
GPU Peak °C:  ___   ___   ___   ___   ___   ___   ___
Avg Response: ___s  ___s  ___s  ___s  ___s  ___s  ___s
Error Count:  ___   ___   ___   ___   ___   ___   ___
Status:       G/Y/R G/Y/R G/Y/R G/Y/R G/Y/R G/Y/R G/Y/R

WEEKLY TREND:
  GPU temps:      [STABLE / RISING / FALLING]
  Response times: [STABLE / RISING / FALLING]
  Error rate:     [STABLE / RISING / FALLING]
  Disk space:     [STABLE / SHRINKING]

WEEKLY ACTIONS TAKEN:
  1. ________________________________
  2. ________________________________
  3. ________________________________
```

---

## Automated Health Check Script

Save and run this for a comprehensive quick check:

```bash
#!/bin/bash
# palace_health.sh — Run daily for system health overview

echo "========================================"
echo "  PALACE HEALTH CHECK — $(date)"
echo "========================================"
echo ""

# GPU
echo "--- GPU STATUS ---"
nvidia-smi --query-gpu=name,temperature.gpu,memory.used,memory.total,gpu_bus_id --format=csv,noheader 2>/dev/null
if [ $? -ne 0 ]; then
    echo "WARNING: nvidia-smi failed — GPU may not be available"
fi
echo ""

# vLLM
echo "--- vLLM STATUS ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "vLLM: UP (HTTP $HTTP_CODE)"
else
    echo "vLLM: DOWN (HTTP $HTTP_CODE)"
fi
echo ""

# PostgreSQL
echo "--- DATABASE STATUS ---"
docker exec stoneai-db pg_isready 2>/dev/null
if [ $? -ne 0 ]; then
    echo "WARNING: PostgreSQL is not ready"
fi
echo ""

# Redis
echo "--- REDIS STATUS ---"
REDIS_REPLY=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_REPLY" = "PONG" ]; then
    echo "Redis: UP"
else
    echo "Redis: DOWN"
fi
echo ""

# Disk
echo "--- DISK USAGE ---"
df -h / | tail -1
echo ""

# Memory
echo "--- MEMORY ---"
free -h 2>/dev/null || echo "free command not available (use Task Manager)"
echo ""

echo "========================================"
echo "  Health check complete"
echo "========================================"
```

---

## Maintenance Windows

### Planned Downtime Schedule

```
REGULAR MAINTENANCE:
  When: Sunday 2:00 AM - 4:00 AM (low traffic)
  Duration: Up to 2 hours
  Activities: Updates, restarts, benchmarks

EMERGENCY MAINTENANCE:
  When: As needed
  Duration: As short as possible
  Notification: Alert sent before and after

MODEL UPDATES:
  When: Scheduled weekend
  Duration: 1-4 hours (includes download + testing)
  Fallback: Claude API active during update
```

### Pre-Maintenance Checklist

```
□ Notify (if users are affected)
□ Activate Claude API fallback
□ Verify fallback is working
□ Perform maintenance
□ Verify vLLM is healthy post-maintenance
□ Run full health check
□ Deactivate fallback (return to vLLM)
□ Monitor for 30 minutes
□ Log maintenance activity
```

---

## Red Flags That Need Immediate Attention

Don't wait for the next check cycle if you notice:

```
STOP EVERYTHING AND INVESTIGATE:
  - GPU temperature > 90°C
  - Burning smell from the OMEN
  - Sudden VRAM spike to 100%
  - Repeated OOM errors in vLLM
  - Database connection pool exhausted
  - Disk space < 20GB
  - Agent producing harmful/unsafe content
  - Unauthorized access attempts in logs
  - vLLM process consuming > 90% CPU
  - System becoming unresponsive
```

Daily operations discipline is the immune system of the Palace. Skip it and you won't notice problems until they become emergencies. Follow it and the Palace runs like clockwork.
