# Disaster Recovery — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. The 3-2-1 Rule

**3** copies of your data, on **2** different media types, with **1** offsite.

### Stone AI Implementation

| Copy | Location | Media Type | Purpose |
|---|---|---|---|
| **Live** | Neon (cloud DB) / stoneai-db (local) | Cloud PostgreSQL / Docker volume | Active production data |
| **Backup 1** | OMEN local disk (`/var/backups/postgresql/`) | SSD | Fast local restore |
| **Backup 2** | Palace USB / external drive | USB / different physical device | Offsite / disaster recovery |

### Automated Backup to Multiple Locations

```bash
#!/bin/bash
# full-backup.sh — 3-2-1 compliant backup
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_BACKUP_DIR="/var/backups/postgresql"
USB_BACKUP_DIR="/mnt/usb/backups/postgresql"  # Mount point for USB drive
DB_CONTAINER="stoneai-db"
DB_USER="postgres"
DB_NAME="stoneai"

mkdir -p "$LOCAL_BACKUP_DIR"

BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.dump"

echo "[$(date)] Starting 3-2-1 backup..."

# Copy 1: Live database (already exists)
echo "Copy 1: Live database (active)"

# Copy 2: Local backup
echo "Copy 2: Local backup..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}"

SIZE=$(wc -c < "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}")
if [ "$SIZE" -lt 1000 ]; then
  echo "ERROR: Backup suspiciously small ($SIZE bytes). Aborting."
  rm -f "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}"
  exit 1
fi
echo "  Saved: ${LOCAL_BACKUP_DIR}/${BACKUP_FILE} ($(du -h "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}" | cut -f1))"

# Copy 3: USB / external (if mounted)
if [ -d "$USB_BACKUP_DIR" ]; then
  echo "Copy 3: USB backup..."
  cp "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}" "${USB_BACKUP_DIR}/${BACKUP_FILE}"
  echo "  Saved: ${USB_BACKUP_DIR}/${BACKUP_FILE}"
else
  echo "WARNING: USB backup dir not mounted ($USB_BACKUP_DIR). Only 2 copies exist."
fi

# Rotate old backups (keep 14 days local, 30 days USB)
find "$LOCAL_BACKUP_DIR" -name "*.dump" -mtime +14 -delete
[ -d "$USB_BACKUP_DIR" ] && find "$USB_BACKUP_DIR" -name "*.dump" -mtime +30 -delete

echo "[$(date)] Backup complete"
```

---

## 2. Backup Verification — Actually Test Restores

A backup you've never tested is not a backup. It's a hope.

### Automated Restore Test

```bash
#!/bin/bash
# test-restore.sh — Verify backup integrity by actually restoring it
set -euo pipefail

BACKUP_DIR="/var/backups/postgresql"
DB_CONTAINER="stoneai-db"
DB_USER="postgres"
TEST_DB="stoneai_restore_test"

# Find most recent backup
LATEST=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1)
if [ -z "$LATEST" ]; then
  echo "ERROR: No backups found in $BACKUP_DIR"
  exit 1
fi

echo "Testing restore of: $LATEST"

# Create test database
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $TEST_DB;"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $TEST_DB;"

# Restore into test database
docker exec -i "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$TEST_DB" < "$LATEST"
RESTORE_EXIT=$?

if [ $RESTORE_EXIT -ne 0 ]; then
  echo "WARNING: pg_restore exited with $RESTORE_EXIT (warnings are OK, errors are not)"
fi

# Verify key tables exist and have data
echo "=== Verification ==="

tables=("User" "Message" "Agent" "Bestie")
all_good=true

for table in "${tables[@]}"; do
  count=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$TEST_DB" -t -A -c "SELECT count(*) FROM \"$table\";" 2>/dev/null || echo "ERROR")
  if [ "$count" = "ERROR" ]; then
    echo "  FAIL: Table $table does not exist or is inaccessible"
    all_good=false
  else
    echo "  OK: $table has $count rows"
  fi
done

# Cleanup test database
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $TEST_DB;"

if $all_good; then
  echo "RESTORE TEST PASSED"
  # Update marker for dead man's switch
  touch /var/run/stone-ai-markers/restore-test
  exit 0
else
  echo "RESTORE TEST FAILED — backup may be corrupt"
  exit 1
fi
```

### Schedule Monthly Restore Tests

```bash
# crontab
# Monthly restore test on the 1st at 4 AM
0 4 1 * * /usr/local/bin/test-restore.sh >> /var/log/stone-ai/restore-test.log 2>&1
```

---

## 3. Configuration Backup

### Version Control All Configs

```bash
#!/bin/bash
# backup-configs.sh — Backup all configuration files
set -euo pipefail

CONFIG_BACKUP_DIR="/var/backups/configs"
TIMESTAMP=$(date +%Y%m%d)
ARCHIVE="${CONFIG_BACKUP_DIR}/configs_${TIMESTAMP}.tar.gz"

mkdir -p "$CONFIG_BACKUP_DIR"

# Collect all important config files
tar czf "$ARCHIVE" \
  /etc/nginx/sites-available/ \
  /etc/docker/daemon.json \
  /etc/wsl.conf \
  /etc/systemd/system/vllm.service \
  /etc/fail2ban/jail.local \
  /etc/logrotate.d/stone-ai \
  /home/*/.wslconfig \
  2>/dev/null || true

echo "Config backup: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# Keep 30 days
find "$CONFIG_BACKUP_DIR" -name "configs_*.tar.gz" -mtime +30 -delete
```

### Infra-as-Code Mindset

Every configuration change should be:
1. **Documented**: What was changed and why
2. **Reproducible**: Can be recreated from files, not memory
3. **Version controlled**: Ideally in git (separate infra repo)

```bash
# Infrastructure repo structure (ideal)
infra/
  docker-compose.yml
  docker-compose.prod.yml
  nginx/
    stone-ai.conf
  systemd/
    vllm.service
  scripts/
    backup-db.sh
    health-check.sh
    vllm-restart.sh
  .env.example  # Template (no actual secrets)
```

---

## 4. RTO and RPO

### Definitions

- **RTO (Recovery Time Objective)**: How long until service is restored
- **RPO (Recovery Point Objective)**: How much data can you afford to lose

### Stone AI Targets

| Service | RTO | RPO | Priority |
|---|---|---|---|
| PostgreSQL (data) | 30 minutes | 24 hours (daily backups) | 1 (highest) |
| vLLM (inference) | 5 minutes | N/A (stateless) | 2 |
| Redis (cache) | 2 minutes | N/A (rebuildable) | 3 |
| Next.js (frontend) | 5 minutes | N/A (deployed from git) | 2 |
| nginx (proxy) | 5 minutes | N/A (config backup) | 2 |

### Recovery Priority Order

In a total disaster (everything is down), restore in this order:

1. **PostgreSQL** — Foundation. Everything depends on data.
2. **Redis** — Cache layer. Services work without it but slower.
3. **vLLM** — AI inference. Core feature.
4. **Next.js** — Frontend. Users can't do anything without it.
5. **nginx** — Proxy. Optional for direct access.

### Full Recovery Playbook

```bash
#!/bin/bash
# full-recovery.sh — Restore all services from scratch
set -euo pipefail

echo "=== FULL RECOVERY STARTED ==="
echo "[$(date)] Beginning disaster recovery"

# Step 1: PostgreSQL
echo ""
echo "=== Step 1: PostgreSQL ==="
docker compose up -d db
echo "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 60); do
  docker exec stoneai-db pg_isready -U postgres > /dev/null 2>&1 && break
  sleep 1
done
echo "PostgreSQL is ready"

# Restore from backup
LATEST_BACKUP=$(ls -t /var/backups/postgresql/*.dump 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
  echo "Restoring from: $LATEST_BACKUP"
  docker exec -i stoneai-db pg_restore -U postgres --clean --if-exists -d stoneai < "$LATEST_BACKUP" || true
  echo "Database restored"
else
  echo "WARNING: No backup found. Database will be empty."
  echo "Run Prisma migrations: npx prisma migrate deploy"
fi

# Step 2: Redis
echo ""
echo "=== Step 2: Redis ==="
docker compose up -d redis
echo "Waiting for Redis..."
for i in $(seq 1 30); do
  docker exec stoneai-redis redis-cli ping 2>/dev/null | grep -q PONG && break
  sleep 1
done
echo "Redis is ready"

# Step 3: vLLM
echo ""
echo "=== Step 3: vLLM ==="
/usr/local/bin/vllm-restart.sh || echo "WARNING: vLLM start failed — manual intervention needed"

# Step 4: Next.js
echo ""
echo "=== Step 4: Next.js ==="
cd /path/to/stone-ai
npm run build && npm run start &
echo "Next.js starting..."

# Step 5: Verify all services
echo ""
echo "=== Step 5: Verification ==="
sleep 10  # Give services a moment

/usr/local/bin/master-health.sh

echo ""
echo "=== RECOVERY COMPLETE ==="
echo "[$(date)] Recovery finished. Verify manually and monitor closely."
```

---

## 5. Disaster Scenarios and Responses

### Scenario 1: OMEN Hardware Failure

**Impact**: All local services down (vLLM, local DB, Redis)
**Response**:
1. Production (stone-ai.net) continues on Vercel + Neon (cloud DB)
2. Cloud fallback: Claude Haiku handles AI inference via Vercel
3. Only local development is affected
4. Recovery: Fix/replace hardware, restore from Palace USB backups

### Scenario 2: Neon Database Corruption

**Impact**: Production database unavailable
**Response**:
1. Neon has its own point-in-time recovery
2. If Neon recovery fails: restore from local pg_dump backup
3. RTO: ~30 minutes (create new Neon project, restore backup, update connection string)

### Scenario 3: Vercel Deployment Failure

**Impact**: Website unreachable
**Response**:
1. Vercel has automatic rollback to previous deployment
2. Fallback domain: stone-ai-sooty.vercel.app
3. Recovery: `vercel --prod` from local machine with good build

### Scenario 4: Cloudflare Issues

**Impact**: DNS not resolving, DDoS protection offline
**Response**:
1. Cloudflare has 100% SLA and global redundancy (very rare)
2. If truly down: update DNS to bypass Cloudflare (direct to Vercel)
3. This removes DDoS protection but restores service

### Scenario 5: Secret Compromise

**Impact**: Attacker has access to API keys or database credentials
**Response**:
1. IMMEDIATELY rotate ALL credentials (see security-hardening.md)
2. Revoke Clerk sessions
3. Rotate Stripe keys
4. Change database password and update connection strings
5. Audit logs for unauthorized access
6. Alert founder

---

## 6. USB Recovery Kit Contents

The Palace USB should contain everything needed to rebuild from zero:

```
palace-usb/
  README.md                    # Quick start guide
  backups/
    postgresql/                # Latest DB dump
    configs/                   # Server configs
  seeds/
    knowledge/
      infrastructure/          # These 12 files
  scripts/
    full-recovery.sh
    backup-db.sh
    vllm-restart.sh
    health-check.sh
  models/
    (symlink or note: models stored on OMEN C:\models\)
  env/
    .env.example               # Template with placeholder values
    (NEVER store actual .env on USB without encryption)
```

### Recovery from USB

```bash
# 1. Mount USB
sudo mount /dev/sdb1 /mnt/usb

# 2. Copy scripts
sudo cp -r /mnt/usb/palace-usb/scripts/* /usr/local/bin/
sudo chmod +x /usr/local/bin/*.sh

# 3. Restore database
cp /mnt/usb/palace-usb/backups/postgresql/latest.dump /var/backups/postgresql/

# 4. Restore configs
tar xzf /mnt/usb/palace-usb/backups/configs/configs_latest.tar.gz -C /

# 5. Run recovery
/usr/local/bin/full-recovery.sh
```

---

## 7. Testing Your DR Plan

### Quarterly DR Drill Checklist

- [ ] Verify all backups exist and are recent
- [ ] Run restore test (test-restore.sh)
- [ ] Verify USB backups are up to date
- [ ] Test vLLM cold start from scratch
- [ ] Test Docker service recreation from compose
- [ ] Verify all scripts are executable and correct
- [ ] Document any changes since last drill
- [ ] Update recovery time estimates

### Chaos Testing (Inspired by Netflix)

```bash
# Kill a random service and see if monitoring catches it
# DON'T do this in production without the founder's OK

# Test: Kill vLLM and verify alert fires
kill -9 $(cat /var/run/vllm.pid)
# Expected: health check fails within 2 minutes, alert fires

# Test: Stop database and verify app handles it gracefully
docker compose stop db
# Expected: App returns meaningful error, not crash

# Test: Fill disk to 90% and verify alert
dd if=/dev/zero of=/tmp/fill-disk bs=1M count=5000
# Expected: Disk alert fires, cleanup script works
rm /tmp/fill-disk
```

---

## 8. Quick Reference Card

| Task | Command |
|---|---|
| Backup database | `/usr/local/bin/backup-db.sh` |
| List backups | `ls -lht /var/backups/postgresql/` |
| Test restore | `/usr/local/bin/test-restore.sh` |
| Restore latest | `docker exec -i stoneai-db pg_restore -U postgres --clean -d stoneai < /var/backups/postgresql/latest.dump` |
| Backup configs | `/usr/local/bin/backup-configs.sh` |
| Full recovery | `/usr/local/bin/full-recovery.sh` |
| Check backup age | `stat -c %y /var/backups/postgresql/*.dump \| tail -1` |
| Mount USB | `sudo mount /dev/sdb1 /mnt/usb` |
| Copy to USB | `cp /var/backups/postgresql/latest.dump /mnt/usb/backups/` |
