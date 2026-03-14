# Emergency Operations Procedures — System Recovery and Crisis Management

## Purpose

This seed defines what the Palace does when things go catastrophically wrong. vLLM crashes, GPU failure, database corruption, network outage, complete system failure — every scenario has a procedure. When the Palace is on fire, there is no time to think. There is only time to execute the playbook.

---

## Core Philosophy

Emergencies are not a question of "if" but "when." Hardware fails. Software crashes. Networks go down. The difference between a minor incident and a catastrophe is preparation. This seed is the preparation.

### Emergency Principles

1. **Detect fast**: The faster you know something is wrong, the less damage it causes
2. **Communicate immediately**: The founder must know within minutes. Users must know if they are affected.
3. **Contain first, fix second**: Stop the bleeding before you diagnose the disease
4. **Follow the playbook**: Emergencies are not the time for improvisation
5. **Document everything**: Every action taken during an emergency is logged for post-mortem
6. **Test regularly**: A playbook that has never been tested is a theory, not a plan

---

## Severity Classification

### SEV-1: CRITICAL

**Definition**: The Palace is fully or largely unavailable to users. Data loss is occurring or imminent. Safety systems are compromised.

**Examples**:
- Complete system outage
- Database corruption with active data loss
- Security breach with user data exposure
- Payment processing failure during active transactions

**Response time**: Immediate (< 5 minutes)
**Notification**: Founder alert via email + SMS. User-facing status page update.
**Authority level**: All hands. Any available system can be taken down to protect data.

### SEV-2: HIGH

**Definition**: Major functionality is degraded. A significant portion of users is affected. Core features are impaired but the system is not completely down.

**Examples**:
- vLLM inference server down (no local AI responses)
- Primary database unreachable (failover active)
- Authentication system failing intermittently
- Single critical agent completely non-functional

**Response time**: < 15 minutes
**Notification**: Founder alert via email. Status page update if user-visible.
**Authority level**: Standard emergency procedures. Escalate if not resolved in 1 hour.

### SEV-3: MEDIUM

**Definition**: Some functionality is degraded but workarounds exist. Limited user impact.

**Examples**:
- Elevated latency (> 2x normal)
- Non-critical agent failures
- Seed retrieval slowdown
- Background job failures

**Response time**: < 1 hour
**Notification**: Founder notified in daily summary unless it escalates.
**Authority level**: Normal operations with increased monitoring.

---

## Emergency Playbooks

### Playbook 1: vLLM Crash

**Symptoms**:
- Inference requests timing out
- 502/503 errors from vLLM endpoint
- GPU utilization drops to 0%
- Queue depth spiking with no processing

**Immediate Actions** (First 5 minutes):
1. Confirm vLLM process is down: `systemctl status vllm` or check Docker container status
2. Activate Claude fallback routing — all requests go to Anthropic API
3. Update status: "Running on cloud AI while local systems recover"
4. Alert founder: "vLLM down, cloud fallback active"

**Diagnosis** (5-30 minutes):
1. Check vLLM logs for crash reason: OOM, CUDA error, model corruption, config issue
2. Check GPU health: `nvidia-smi` — is the GPU responsive?
3. Check system resources: RAM, disk space, CPU — is something else consuming resources?
4. Check for recent changes: Was anything deployed or modified before the crash?

**Recovery Procedures**:

*If OOM (Out of Memory)*:
```bash
# Clear GPU memory
sudo fuser -v /dev/nvidia* 2>/dev/null
# Restart vLLM with conservative memory settings
# Reduce max_model_len or batch size if needed
systemctl restart vllm
```

*If CUDA Error*:
```bash
# Reset GPU
nvidia-smi --gpu-reset
# Verify GPU health
nvidia-smi
# Restart vLLM
systemctl restart vllm
```

*If Model Corruption*:
```bash
# Re-download or restore model from backup
# Verify model file checksums
# Restart vLLM with verified model
```

**Verification** (After restart):
1. Send test inference request
2. Verify response quality matches expected output
3. Check latency is within normal range
4. Monitor for 15 minutes for stability
5. Gradually shift traffic back from Claude fallback
6. Confirm all metrics return to baseline

**Fallback if Recovery Fails**:
- Continue running on Claude API
- Schedule deeper investigation during maintenance window
- Consider if hardware replacement is needed

### Playbook 2: GPU Failure

**Symptoms**:
- `nvidia-smi` returns error or shows GPU in error state
- System logs show GPU-related kernel errors
- All GPU-dependent processes fail
- Machine may become unstable

**Immediate Actions**:
1. Confirm GPU failure vs software issue: `nvidia-smi`, `dmesg | grep -i gpu`
2. Activate cloud fallback for all inference
3. Alert founder: "GPU hardware failure suspected"
4. Assess: Is this recoverable (driver crash) or hardware (physical failure)?

**If Driver/Software Issue**:
```bash
# Attempt driver reload
sudo rmmod nvidia_uvm nvidia_drm nvidia_modeset nvidia
sudo modprobe nvidia
nvidia-smi
```

**If Hardware Failure**:
1. GPU is dead. Cloud fallback is now primary.
2. Begin hardware replacement process
3. Estimate replacement timeline and cost
4. Present options to founder:
   - Same GPU replacement
   - Upgrade opportunity
   - Extended cloud-only operation
5. Update operational plans for cloud-only mode
6. Adjust rate limits and costs for cloud inference

**Cloud-Only Mode Operations**:
- Route all inference to Anthropic API (Claude Haiku for standard, Sonnet for SMART)
- Monitor API costs carefully — cloud inference is more expensive
- Adjust rate limits if costs exceed budget
- Prioritize paid tier users for cloud inference
- FREE tier may experience reduced availability

### Playbook 3: Database Corruption

**Symptoms**:
- Query errors mentioning data integrity
- Prisma throwing unexpected errors
- Inconsistent data between reads
- PostgreSQL logs showing corruption warnings

**Immediate Actions** (CRITICAL — data preservation is priority):
1. **STOP all write operations immediately**: Put the application in read-only mode
2. Alert founder: "Database corruption detected, write operations halted"
3. Assess scope: Is corruption in a single table, multiple tables, or system-wide?

**Diagnosis**:
```sql
-- Check for corruption
SELECT * FROM pg_stat_database WHERE datname = 'stone_ai';
-- Run integrity checks
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public';
-- Check each critical table
SELECT count(*) FROM "User";
SELECT count(*) FROM "Conversation";
SELECT count(*) FROM "Agent";
```

**Recovery — From Neon Backup**:
1. Identify the last known good point in time
2. Create a Neon branch from that point
3. Verify the branch has clean data
4. Assess data loss between backup point and corruption detection
5. Present options to founder:
   - Restore from backup (may lose recent data)
   - Attempt surgical repair (risky but preserves more data)
   - Hybrid: restore from backup, manually replay critical recent transactions
6. Execute founder's chosen approach

**Recovery — Surgical Repair** (only if corruption is localized):
1. Identify corrupted rows/tables
2. Export uncorrupted data
3. Drop and recreate affected tables
4. Reimport clean data
5. Verify integrity
6. Resume write operations with elevated monitoring

**Post-Recovery**:
1. Run full integrity check across all tables
2. Verify user accounts, subscriptions, and conversations are intact
3. Monitor for 24 hours for any recurring issues
4. Conduct root cause analysis: What caused the corruption?
5. Implement prevention measures

### Playbook 4: Network Outage

**Symptoms**:
- Users cannot reach stone-ai.net
- API requests timing out
- Cloudflare errors (5xx)
- DNS resolution failing

**Diagnosis Path**:
```
Is the server reachable from internal network?
├── YES → Problem is external (DNS, Cloudflare, ISP)
│   ├── Check Cloudflare status page
│   ├── Check DNS propagation: dig stone-ai.net
│   ├── Check Vercel status page
│   └── Check if other Vercel apps are affected
└── NO → Problem is internal
    ├── Check server is running
    ├── Check local network connectivity
    ├── Check firewall rules
    └── Check if hosting provider has an outage
```

**If Cloudflare Issue**:
1. Check Cloudflare status page for known incidents
2. If Cloudflare is down, consider temporarily bypassing (DNS direct to Vercel)
3. Monitor Cloudflare status for resolution
4. Re-enable Cloudflare proxy when resolved

**If Vercel Issue**:
1. Check Vercel status page
2. If Vercel is down, activate fallback deployment
3. Consider deploying to alternative provider temporarily
4. Monitor Vercel status for resolution

**If DNS Issue**:
1. Verify DNS records in Cloudflare dashboard
2. Check if records were accidentally modified
3. If domain expired, renew immediately
4. DNS propagation can take up to 48 hours for changes

**Communication During Outage**:
- Update any status page
- If outage > 30 minutes, post on social media
- Track outage duration for SLA purposes

### Playbook 5: Complete System Recovery

**Scenario**: Everything is down. Database, application, inference — total failure. This is the nuclear option.

**Recovery Priority Order**:
```
PRIORITY 1: Database (data is irreplaceable)
├── Verify Neon database status
├── If Neon is down: wait for Neon recovery (they have redundancy)
├── If Neon data is gone: restore from last backup
└── Verify data integrity before proceeding

PRIORITY 2: Authentication (users must be able to log in)
├── Verify Clerk service status
├── If Clerk is down: wait for recovery (external service)
└── Test login flow

PRIORITY 3: Application (the web app)
├── Verify Vercel deployment status
├── If deployment is corrupted: redeploy from last known good commit
├── Verify all environment variables are correct
└── Test critical user flows

PRIORITY 4: AI Inference (the brain)
├── Verify Claude API access (cloud fallback)
├── If vLLM available: restart and verify
├── If GPU dead: operate in cloud-only mode
└── Test inference quality

PRIORITY 5: Non-Critical Services
├── Background jobs
├── Analytics
├── Email notifications
└── Monitoring systems (ironic but they can fail too)
```

**System Verification Checklist** (run after recovery):
```
□ Homepage loads correctly
□ User can sign up
□ User can log in
□ User can start a conversation
□ AI responds to a test query
□ Agent routing works
□ Billing page loads
□ Stripe integration responds
□ Database reads work
□ Database writes work
□ Image uploads work
□ Settings save correctly
□ All 44 agents are accessible (per tier)
□ Bestie system functions
□ Admin dashboard accessible
□ No error spikes in monitoring
```

---

## Communication Templates

### Founder Alert — SEV-1

```
Subject: [SEV-1] CRITICAL — {system} down
Body:
What: {description of failure}
When: Detected at {timestamp}
Impact: {number of users affected, features down}
Status: {containment actions taken}
ETA: {estimated recovery time or "investigating"}
Action needed: {any decisions required from founder}
```

### Founder Alert — SEV-2

```
Subject: [SEV-2] HIGH — {system} degraded
Body:
What: {description of issue}
When: Detected at {timestamp}
Impact: {description of user impact}
Status: {actions being taken}
ETA: {estimated resolution}
```

### User-Facing Status Update

```
Title: Service Disruption — {date}
Body:
We are currently experiencing {brief description}.
{Feature X} may be temporarily unavailable/slower than usual.
Our team is actively working on resolution.
We will update this page as the situation develops.

Last updated: {timestamp}
```

---

## Post-Incident Process

### Incident Report Template

Every SEV-1 and SEV-2 incident produces a report within 48 hours:

```
INCIDENT REPORT
───────────────
Incident ID: INC-2026-XXXX
Severity: SEV-X
Duration: X hours Y minutes
Impact: X users affected, Y failed requests

TIMELINE:
HH:MM — First symptom detected
HH:MM — Alert triggered
HH:MM — Investigation started
HH:MM — Root cause identified
HH:MM — Fix deployed
HH:MM — Service restored
HH:MM — All-clear confirmed

ROOT CAUSE:
{Detailed technical explanation}

WHAT WENT WELL:
- {things that worked during the incident}

WHAT WENT WRONG:
- {things that failed or were slow}

ACTION ITEMS:
1. {preventive measure} — Owner: {who} — Due: {when}
2. {monitoring improvement} — Owner: {who} — Due: {when}
3. {process change} — Owner: {who} — Due: {when}

PREVENTION:
How will we prevent this specific failure from recurring?
How will we detect it faster if it does recur?
```

---

## Emergency Drill Schedule

Practice emergencies before they happen:

| Drill | Frequency | What It Tests |
|-------|-----------|---------------|
| Failover test | Monthly | Can we switch to cloud inference smoothly? |
| Database restore | Quarterly | Can we restore from backup within the target time? |
| Full recovery | Bi-annually | Can we recover from total failure? |
| Communication test | Monthly | Do alerts reach the founder? Does the status page work? |

---

## Integration Points

- **performance-self-monitoring.md**: Monitoring detects emergencies and triggers these procedures
- **self-diagnostic-routines.md**: Diagnostics run during emergency investigation
- **palace-succession-planning.md**: Complete system recovery overlaps with succession planning
- **autonomous-decision-boundaries.md**: Defines emergency actions the Palace can take without founder approval
- **palace-governance-model.md**: Emergency authority levels defined in governance model

---

## Summary

When the Palace is on fire, execute the playbook. Every emergency type has a defined severity, notification protocol, diagnosis path, recovery procedure, and verification checklist. vLLM crashes get cloud fallback. GPU failures trigger hardware replacement. Database corruption prioritizes data preservation. Network outages follow a systematic diagnosis tree. Complete system failure has a priority-ordered recovery sequence. Every incident gets a post-mortem. Every post-mortem produces action items. Emergency drills ensure the playbooks work before they are needed. The founder is always informed. The users are always communicated with. Preparation is the only defense against chaos.
