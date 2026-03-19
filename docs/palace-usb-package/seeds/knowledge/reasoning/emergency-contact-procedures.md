# Emergency Contact Procedures

## Purpose

This seed defines what to do when the Palace is down, including backup plans, manual fallback procedures, and critical system recovery steps. When things go wrong, this document tells you exactly what to do, in what order, without thinking.

## Why This Matters

Emergencies don't wait for you to read documentation. This document is designed for crisis mode — short sentences, clear steps, no ambiguity. When the Palace is down and users are affected, every minute counts.

---

## Emergency Classification

### Severity Levels

```
SEV-1: CRITICAL — Palace completely down, all users affected
  Response time: IMMEDIATE (< 5 minutes)
  Examples: vLLM crash + fallback failure, data breach, total hardware failure

SEV-2: HIGH — Major feature down, many users affected
  Response time: < 15 minutes
  Examples: vLLM down (fallback working), database outage, auth failure

SEV-3: MEDIUM — Partial degradation, some users affected
  Response time: < 1 hour
  Examples: Single agent misbehaving, slow responses, intermittent errors

SEV-4: LOW — Minor issue, few users notice
  Response time: < 4 hours
  Examples: UI glitch, non-critical feature bug, cosmetic issue
```

---

## SEV-1: Palace Completely Down

### Immediate Actions (First 5 Minutes)

```
STEP 1: CONFIRM THE OUTAGE
  □ Can you reach https://stone-ai.net?
  □ Can you reach https://stone-ai-sooty.vercel.app?
  □ Is it just you or is it everyone? (Check from phone/different network)

STEP 2: IDENTIFY THE FAILURE POINT
  □ Is it Vercel? → Check https://www.vercel-status.com
  □ Is it Cloudflare? → Check https://www.cloudflarestatus.com
  □ Is it Neon DB? → Check Neon status page
  □ Is it the OMEN? → Can you access the machine locally?

STEP 3: ACTIVATE FALLBACK
  IF Vercel is down:
    → Nothing you can do. Wait for Vercel to recover.
    → Users hitting stone-ai-sooty.vercel.app as backup.

  IF Cloudflare is down:
    → Switch DNS to direct Vercel IP (temporary)
    → Or direct users to stone-ai-sooty.vercel.app

  IF Neon DB is down:
    → Application will show database errors
    → No immediate fix — wait for Neon recovery
    → Consider: Can local PG serve as emergency backend?

  IF OMEN is down (vLLM unavailable):
    → Claude API fallback should auto-activate
    → Verify: Check Vercel logs for Claude API calls
    → If fallback not working: Check ANTHROPIC_API_KEY in Vercel env

STEP 4: COMMUNICATE
  □ Send founder alert: sendFounderAlert({alertType: "system.critical"})
  □ If email system also down: Use backup communication
```

### Recovery Actions

```
ONCE THE CAUSE IS IDENTIFIED:

For vLLM failure:
  1. SSH/access OMEN locally
  2. nvidia-smi → Check GPU status
  3. If GPU OK: Restart vLLM
  4. If GPU dead: Claude fallback is your friend
  5. Verify recovery: curl http://localhost:8000/health

For Vercel failure:
  1. Check Vercel status page
  2. If prolonged: Consider emergency deploy to alternative platform
  3. Vercel outages typically resolve within 30 minutes

For database failure:
  1. Check Neon dashboard
  2. If Neon is down: Wait for recovery
  3. If connection issue: Check env vars, try connection from CLI
  4. If data corruption: Restore from Neon's automatic backups

For hardware failure:
  1. Assess: What failed? GPU? PSU? Motherboard?
  2. If repairable: Fix and restart
  3. If not repairable: Order replacement
  4. Cloud GPU rental as bridge: RunPod, Lambda Labs, Vast.ai
  5. Palace USB package has everything to rebuild on new hardware
```

---

## SEV-2: Major Feature Down

### vLLM Down, Fallback Working

```
IMPACT: Users get Claude Haiku instead of Qwen — reduced quality, still functional

STEPS:
  1. Confirm fallback is active (check Vercel logs)
  2. Don't panic — users are being served
  3. Investigate vLLM failure:
     a. nvidia-smi → GPU status
     b. Check vLLM terminal output
     c. Check system resources (RAM, disk)
  4. Fix and restart vLLM
  5. Verify: Send test inference
  6. Monitor for 15 minutes to ensure stability
  7. Log the incident

TIMELINE: Target 30-minute resolution
```

### Database Outage

```
IMPACT: Users can't log in, can't access data, can't use agents

STEPS:
  1. Check Docker: docker ps
  2. If stoneai-db stopped: docker start stoneai-db
  3. If Neon (production): Check Neon status page
  4. Check connection strings in env vars
  5. Try direct PG connection: psql -h localhost -p 5432
  6. If connection pooling issue: Restart the connection pool
  7. Verify: Run a simple SELECT query

TIMELINE: Target 15-minute resolution for Docker, variable for Neon
```

### Authentication Failure (Clerk)

```
IMPACT: Nobody can log in or sign up

STEPS:
  1. Check Clerk status: https://status.clerk.com
  2. If Clerk is down: Wait for recovery (you can't fix this)
  3. If env var issue: Check Vercel env vars
  4. If key expired: Regenerate in Clerk dashboard, update Vercel
  5. Clear browser cookies/cache and test
  6. Check if middleware is blocking: Review auth middleware

TIMELINE: Variable — depends on whether it's Clerk or your config
```

---

## SEV-3: Partial Degradation

### Single Agent Misbehaving

```
IMPACT: One agent giving bad responses, others fine

STEPS:
  1. Identify which agent
  2. Test the agent directly with a known-good prompt
  3. Check the system prompt for errors or corruption
  4. Compare with another agent (is it agent-specific or model-wide?)
  5. Fix the system prompt if needed
  6. Recertify the agent
  7. Monitor for 24 hours

NO USER NOTIFICATION NEEDED unless it's a high-tier agent
```

### Slow Responses

```
IMPACT: Users waiting longer than normal

STEPS:
  1. nvidia-smi → Check GPU temp and utilization
  2. If thermal throttling (> 85°C):
     → Reduce concurrent requests
     → Check fan operation
     → Improve airflow
  3. If VRAM pressure (> 95%):
     → Reduce max_model_len
     → Lower gpu_memory_utilization
     → Restart vLLM to clear memory
  4. If CPU bottleneck:
     → Check Task Manager for resource hogs
     → Kill unnecessary processes
  5. Restart vLLM if nothing else works
```

---

## Manual Fallback Procedures

### Fallback Level 1: Claude API

```
TRIGGER: vLLM unreachable
AUTOMATIC: Yes — application detects vLLM timeout and routes to Claude
MANUAL ACTIVATION: Set FALLBACK_MODE=claude in Vercel env vars

WHAT USERS GET:
  - Claude Haiku responses instead of Qwen
  - Agent personas maintained via system prompts
  - Quality difference: Noticeable but acceptable
  - Cost: Per-token charges to Anthropic API

LIMITATIONS:
  - Higher latency (network round-trip)
  - Per-token cost vs free local inference
  - May hit rate limits under heavy load
  - Some agent nuances may differ
```

### Fallback Level 2: Degraded Mode

```
TRIGGER: Both vLLM and Claude API unavailable
MANUAL ACTIVATION: Set MAINTENANCE_MODE=true in Vercel env vars

WHAT USERS GET:
  - Maintenance page with status message
  - Estimated time to recovery
  - Suggestion to return later

IMPLEMENTATION:
  - Static maintenance page served by Vercel
  - No API calls attempted
  - Database remains accessible for admin
```

### Fallback Level 3: Complete Rebuild

```
TRIGGER: Hardware destroyed, data lost, starting from scratch
REQUIREMENTS: Palace USB package + new hardware

REBUILD STEPS:
  1. Acquire replacement hardware (minimum: RTX 3090 + 32GB RAM)
  2. Install OS, drivers, CUDA toolkit
  3. Install Python, Node.js, Docker
  4. Clone repo from GitHub
  5. Load seeds from USB package
  6. Download model from HuggingFace
  7. Configure vLLM
  8. Run database migrations
  9. Verify all 40 agents
  10. Update DNS/Vercel to point to new machine

ESTIMATED TIME: 1-2 days with USB package, 1 week without
```

---

## Critical System Recovery Steps

### Recovery Procedure: vLLM

```
SYMPTOM: vLLM crashed or won't start

RECOVERY SEQUENCE:
  1. Kill all Python processes:
     taskkill /F /IM python.exe

  2. Clear GPU memory:
     Wait 10 seconds
     nvidia-smi  # Confirm VRAM is free

  3. Check disk space:
     df -h  # Ensure > 50GB free

  4. Check model files:
     ls -la ~/.cache/huggingface/  # Verify model exists

  5. Start vLLM with verbose logging:
     python -m vllm.entrypoints.openai.api_server \
       --model Qwen/Qwen2.5-32B-Instruct-AWQ \
       --quantization awq \
       --gpu-memory-utilization 0.85 \
       --max-model-len 4096 \
       --host 0.0.0.0 \
       --port 8000
     # Note: Reduced memory and context for recovery stability

  6. Verify health:
     curl http://localhost:8000/health

  7. Run test inference:
     curl http://localhost:8000/v1/chat/completions \
       -H "Content-Type: application/json" \
       -d '{"model":"Qwen/Qwen2.5-32B-Instruct-AWQ",
            "messages":[{"role":"user","content":"test"}],
            "max_tokens":10}'

  8. If stable: Gradually increase settings back to production values
  9. Monitor for 30 minutes before declaring recovered
```

### Recovery Procedure: Database

```
SYMPTOM: Database unreachable or corrupted

LOCAL (Docker):
  1. docker logs stoneai-db  # Check for errors
  2. docker restart stoneai-db
  3. docker exec stoneai-db pg_isready
  4. If corrupted: docker stop stoneai-db && docker rm stoneai-db
     Then recreate from backup

PRODUCTION (Neon):
  1. Check Neon dashboard
  2. Create a branch from last known good point
  3. Verify data integrity on branch
  4. If needed: Promote branch to production
  5. Run: npx prisma migrate deploy  # Ensure schema is current
```

### Recovery Procedure: Full System

```
SYMPTOM: Multiple services down simultaneously

ORDER OF RECOVERY (dependencies first):
  1. Hardware check (power, GPU, network)
  2. Network (can you reach the internet?)
  3. Docker (database depends on this)
  4. PostgreSQL (application depends on this)
  5. Redis (caching depends on this)
  6. vLLM (inference depends on this)
  7. Application (depends on everything above)

DO NOT skip steps. Each layer depends on the one below it.
```

---

## Communication During Emergencies

### Internal Communication

```
PRIMARY: sendFounderAlert() via Three-Headed Monster email system
BACKUP: Direct access to OMEN for on-machine alerts
LAST RESORT: Manual email from personal account

ALERT FORMAT:
  Subject: [SEV-X] Brief description
  Body:
    Status: [DOWN / DEGRADED / RECOVERING]
    Impact: [What users experience]
    ETA: [When we expect recovery]
    Action needed: [Yes/No]
```

### External Communication (If Users Ask)

```
DO:
  - Acknowledge the issue
  - Provide estimated recovery time
  - Assure data is safe

DON'T:
  - Reveal technical details
  - Blame third parties
  - Promise specific times unless certain
  - Ignore the issue
```

---

## Post-Incident Procedures

After every SEV-1 or SEV-2 incident:

```
1. INCIDENT REPORT (within 24 hours):
   - Timeline of events
   - Root cause analysis
   - Actions taken
   - Resolution
   - Duration of impact

2. PREVENTION PLAN:
   - What could prevent this from happening again?
   - What monitoring would catch it earlier?
   - What automation could speed up recovery?

3. UPDATE PROCEDURES:
   - Does this document need updating?
   - Does the operations manual need updating?
   - Do monitoring thresholds need adjusting?

4. TEST THE FIX:
   - Verify the prevention measure works
   - Add a test case for this failure mode
   - Schedule a drill for this scenario
```

---

## Emergency Kit Checklist

Keep these ready at all times:

```
DIGITAL:
  [ ] Palace USB package (current version)
  [ ] Credentials file accessible
  [ ] GitHub access verified
  [ ] Vercel admin access verified
  [ ] Neon admin access verified
  [ ] Clerk admin access verified
  [ ] Stripe admin access verified
  [ ] Cloudflare admin access verified
  [ ] Backup API keys stored securely

PHYSICAL:
  [ ] OMEN power supply working
  [ ] Ethernet cable connected
  [ ] UPS (if you have one) charged
  [ ] Spare peripherals accessible

KNOWLEDGE:
  [ ] This document bookmarked/printed
  [ ] Operations manual accessible offline
  [ ] Recovery procedures practiced within last quarter
```

When the Palace is on fire, this document is your fire extinguisher. Know where it is before you need it.
