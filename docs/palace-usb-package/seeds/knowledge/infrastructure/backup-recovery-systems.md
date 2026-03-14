# Backup & Recovery Systems — Palace Infrastructure Seed

## Chaos Directive: Never Lose a Byte

This seed covers automated backup strategies for the Palace — database, seeds, configuration, and application state. Off-site storage, backup verification, recovery time objectives, and the 3-2-1 rule. The OMEN 45L has 4TB NVMe — plenty of room for local backups, but local-only is a death sentence.

---

## 1. The 3-2-1 Backup Rule

```
3 copies of data
2 different storage media
1 offsite copy

Palace Implementation:
  Copy 1: Live data (NVMe, Neon DB, Vercel)
  Copy 2: Local backup (NVMe secondary partition)
  Copy 3: Offsite (cloud storage — S3/Backblaze B2)
  Media 1: NVMe SSD (local)
  Media 2: Cloud object storage (remote)
```

---

## 2. Database Backup Strategy

### 2.1 PostgreSQL Backup Types

**Logical backups (pg_dump):**
- Portable, human-readable SQL
- Can restore to different PostgreSQL versions
- Slower for large databases
- Best for: Daily full backups, migration testing

**Physical backups (pg_basebackup):**
- Byte-level copy of data directory
- Fastest restore time
- Same PostgreSQL version required
- Best for: Point-in-time recovery, disaster recovery

**Continuous archiving (WAL):**
- Write-Ahead Log streaming
- Point-in-time recovery to any moment
- Combined with base backup for full PITR
- Best for: Minimal data loss requirement

### 2.2 Automated Daily Backup Script

```bash
#!/bin/bash
# backup-database.sh — Daily PostgreSQL backup
set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-stoneai}"
BACKUP_DIR="/mnt/nvme/backups/database"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/stoneai-${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/backup-database.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG_FILE"
}

log "Starting database backup: $BACKUP_FILE"

# Create compressed backup with custom format
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    --compress=6 \
    --verbose \
    --file="${BACKUP_DIR}/stoneai-${TIMESTAMP}.dump" \
    2>> "$LOG_FILE"

# Also create SQL text backup (for emergency manual recovery)
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE" \
    2>> "$LOG_FILE"

# Verify backup integrity
DUMP_SIZE=$(stat -c%s "${BACKUP_DIR}/stoneai-${TIMESTAMP}.dump" 2>/dev/null || echo "0")
SQL_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")

if [ "$DUMP_SIZE" -lt 1000 ] || [ "$SQL_SIZE" -lt 1000 ]; then
    log "ERROR: Backup files suspiciously small (dump: ${DUMP_SIZE}B, sql: ${SQL_SIZE}B)"
    exit 1
fi

log "Backup created: dump=${DUMP_SIZE}B, sql.gz=${SQL_SIZE}B"

# Verify custom format backup can be listed
pg_restore --list "${BACKUP_DIR}/stoneai-${TIMESTAMP}.dump" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log "Backup verification passed"
else
    log "ERROR: Backup verification FAILED"
    exit 1
fi

# Clean up old backups
DELETED=$(find "$BACKUP_DIR" -name "stoneai-*" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log "Cleaned up $DELETED old backup files (retention: ${RETENTION_DAYS} days)"

# Upload to offsite storage
if command -v aws &>/dev/null; then
    aws s3 cp "$BACKUP_FILE" "s3://stone-ai-backups/database/$(basename $BACKUP_FILE)" --storage-class STANDARD_IA
    aws s3 cp "${BACKUP_DIR}/stoneai-${TIMESTAMP}.dump" "s3://stone-ai-backups/database/stoneai-${TIMESTAMP}.dump" --storage-class STANDARD_IA
    log "Offsite upload complete"
elif command -v b2 &>/dev/null; then
    b2 upload-file stone-ai-backups "$BACKUP_FILE" "database/$(basename $BACKUP_FILE)"
    log "Backblaze B2 upload complete"
fi

log "Database backup complete"
```

### 2.3 Neon Database Backup

Neon handles continuous backups with point-in-time recovery built in. But never trust a single provider.

```bash
#!/bin/bash
# backup-neon.sh — Backup Neon production database locally
set -euo pipefail

NEON_CONNECTION_STRING="${NEON_DATABASE_URL}"
BACKUP_DIR="/mnt/nvme/backups/neon"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Full logical backup from Neon
pg_dump "$NEON_CONNECTION_STRING" \
    --format=custom \
    --compress=6 \
    --no-owner \
    --no-privileges \
    --file="${BACKUP_DIR}/neon-prod-${TIMESTAMP}.dump"

# Schema-only backup (lightweight, version control)
pg_dump "$NEON_CONNECTION_STRING" \
    --schema-only \
    --no-owner \
    > "${BACKUP_DIR}/neon-schema-${TIMESTAMP}.sql"

# Data-only backup (for analysis)
pg_dump "$NEON_CONNECTION_STRING" \
    --data-only \
    --no-owner \
    | gzip > "${BACKUP_DIR}/neon-data-${TIMESTAMP}.sql.gz"

echo "Neon backup complete: ${TIMESTAMP}"
```

### 2.4 Redis Backup

```bash
#!/bin/bash
# backup-redis.sh
set -euo pipefail

BACKUP_DIR="/mnt/nvme/backups/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Trigger RDB snapshot
redis-cli BGSAVE
sleep 5  # Wait for snapshot

# Copy RDB file
REDIS_DIR=$(redis-cli CONFIG GET dir | tail -1)
REDIS_FILE=$(redis-cli CONFIG GET dbfilename | tail -1)

cp "${REDIS_DIR}/${REDIS_FILE}" "${BACKUP_DIR}/redis-${TIMESTAMP}.rdb"

# Also export AOF if enabled
if [ -f "${REDIS_DIR}/appendonly.aof" ]; then
    cp "${REDIS_DIR}/appendonly.aof" "${BACKUP_DIR}/redis-aof-${TIMESTAMP}.aof"
fi

echo "Redis backup complete: ${TIMESTAMP}"
```

---

## 3. Seed and Configuration Backup

### 3.1 Palace Seeds Backup

```bash
#!/bin/bash
# backup-seeds.sh — Backup knowledge seeds and configuration
set -euo pipefail

BACKUP_DIR="/mnt/nvme/backups/seeds"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STONE_AI_DIR="/c/Users/stone/stone-ai"

mkdir -p "$BACKUP_DIR"

# Backup seeds directory
tar czf "${BACKUP_DIR}/seeds-${TIMESTAMP}.tar.gz" \
    -C "$STONE_AI_DIR/docs/palace-usb-package" \
    seeds/

# Backup configuration files
tar czf "${BACKUP_DIR}/config-${TIMESTAMP}.tar.gz" \
    -C "$STONE_AI_DIR" \
    .env.local \
    prisma/schema.prisma \
    next.config.ts \
    tailwind.config.ts \
    tsconfig.json \
    package.json \
    vercel.json \
    2>/dev/null || true

# Backup Prisma migrations
tar czf "${BACKUP_DIR}/migrations-${TIMESTAMP}.tar.gz" \
    -C "$STONE_AI_DIR" \
    prisma/migrations/

# Backup Claude memory
tar czf "${BACKUP_DIR}/claude-memory-${TIMESTAMP}.tar.gz" \
    -C "/c/Users/stone/.claude" \
    projects/ \
    2>/dev/null || true

echo "Seeds and config backup complete: ${TIMESTAMP}"

# Size report
echo "Backup sizes:"
ls -lh "${BACKUP_DIR}/"*-${TIMESTAMP}* 2>/dev/null
```

### 3.2 Full System Configuration Backup

```bash
#!/bin/bash
# backup-system-config.sh — System-level config backup
set -euo pipefail

BACKUP_DIR="/mnt/nvme/backups/system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Docker compose files and configs
tar czf "${BACKUP_DIR}/docker-${TIMESTAMP}.tar.gz" \
    /opt/stone-ai/docker-compose*.yml \
    /opt/stone-ai/Dockerfile* \
    /opt/stone-ai/nginx/ \
    /opt/stone-ai/monitoring/ \
    2>/dev/null || true

# WSL2 configuration
cp /mnt/c/Users/stone/.wslconfig "${BACKUP_DIR}/wslconfig-${TIMESTAMP}" 2>/dev/null || true

# Crontab
crontab -l > "${BACKUP_DIR}/crontab-${TIMESTAMP}" 2>/dev/null || true

# SSH keys (encrypted)
if [ -d ~/.ssh ]; then
    tar czf - ~/.ssh/ | gpg --symmetric --cipher-algo AES256 \
        -o "${BACKUP_DIR}/ssh-${TIMESTAMP}.tar.gz.gpg"
fi

# Installed packages list
dpkg --get-selections > "${BACKUP_DIR}/packages-${TIMESTAMP}.txt" 2>/dev/null || true
pip list --format=freeze > "${BACKUP_DIR}/pip-packages-${TIMESTAMP}.txt" 2>/dev/null || true
npm list -g --depth=0 > "${BACKUP_DIR}/npm-global-${TIMESTAMP}.txt" 2>/dev/null || true

echo "System config backup complete: ${TIMESTAMP}"
```

---

## 4. Master Backup Orchestrator

```bash
#!/bin/bash
# palace-backup.sh — Master backup script (runs all backups)
set -euo pipefail

LOG_FILE="/var/log/palace-backup.log"
LOCK_FILE="/tmp/palace-backup.lock"

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Backup already running (PID: $PID)"
        exit 1
    fi
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG_FILE"
}

ERRORS=0

log "===== Palace Backup Starting ====="

# Database backup
log "Running database backup..."
if /opt/scripts/backup-database.sh >> "$LOG_FILE" 2>&1; then
    log "Database backup: SUCCESS"
else
    log "Database backup: FAILED"
    ERRORS=$((ERRORS + 1))
fi

# Neon backup
log "Running Neon backup..."
if /opt/scripts/backup-neon.sh >> "$LOG_FILE" 2>&1; then
    log "Neon backup: SUCCESS"
else
    log "Neon backup: FAILED"
    ERRORS=$((ERRORS + 1))
fi

# Redis backup
log "Running Redis backup..."
if /opt/scripts/backup-redis.sh >> "$LOG_FILE" 2>&1; then
    log "Redis backup: SUCCESS"
else
    log "Redis backup: FAILED"
    ERRORS=$((ERRORS + 1))
fi

# Seeds backup
log "Running seeds backup..."
if /opt/scripts/backup-seeds.sh >> "$LOG_FILE" 2>&1; then
    log "Seeds backup: SUCCESS"
else
    log "Seeds backup: FAILED"
    ERRORS=$((ERRORS + 1))
fi

# System config backup
log "Running system config backup..."
if /opt/scripts/backup-system-config.sh >> "$LOG_FILE" 2>&1; then
    log "System config backup: SUCCESS"
else
    log "System config backup: FAILED"
    ERRORS=$((ERRORS + 1))
fi

# Report
log "===== Palace Backup Complete ====="
log "Errors: $ERRORS"

# Disk usage report
log "Backup disk usage:"
du -sh /mnt/nvme/backups/*/ 2>/dev/null | while read line; do
    log "  $line"
done

TOTAL_SIZE=$(du -sh /mnt/nvme/backups/ 2>/dev/null | cut -f1)
log "Total backup storage: $TOTAL_SIZE"

# Alert on errors
if [ $ERRORS -gt 0 ]; then
    log "ALERT: $ERRORS backup(s) failed!"
    # sendFounderAlert "BACKUP FAILURE: $ERRORS backup(s) failed"
    exit 1
fi
```

### Cron Schedule

```bash
# /etc/crontab or crontab -e

# Daily full backup at 2 AM
0 2 * * * /opt/scripts/palace-backup.sh

# Hourly database incremental
0 * * * * /opt/scripts/backup-database.sh --incremental

# Every 6 hours: Neon snapshot
0 */6 * * * /opt/scripts/backup-neon.sh

# Weekly: Full system backup (Sunday 3 AM)
0 3 * * 0 /opt/scripts/backup-system-config.sh --full

# Monthly: Backup verification test (1st at 4 AM)
0 4 1 * * /opt/scripts/test-backup-restore.sh
```

---

## 5. Off-Site Storage

### 5.1 Backblaze B2 (Cost-Effective)

```bash
# Install B2 CLI
pip install b2

# Authorize
b2 authorize-account $B2_KEY_ID $B2_APP_KEY

# Create bucket
b2 create-bucket stone-ai-backups allPrivate --lifecycleRules '[{
  "daysFromHidingToDeleting": 1,
  "daysFromUploadingToHiding": 90,
  "fileNamePrefix": "database/"
}]'

# Upload
b2 upload-file stone-ai-backups /mnt/nvme/backups/database/latest.dump database/latest.dump

# Sync entire backup directory
b2 sync /mnt/nvme/backups/ b2://stone-ai-backups/ --keepDays 90

# Download for restore
b2 download-file-by-name stone-ai-backups database/latest.dump /tmp/restore.dump
```

**Backblaze B2 pricing (as of 2026):**
- Storage: $0.006/GB/month ($6/TB/month)
- Download: $0.01/GB (first 1GB free daily)
- API calls: First 2,500 free daily

### 5.2 AWS S3 (Enterprise-Grade)

```bash
# Install AWS CLI
pip install awscli

# Configure
aws configure

# Create bucket with versioning
aws s3 mb s3://stone-ai-backups --region us-east-1
aws s3api put-bucket-versioning --bucket stone-ai-backups --versioning-configuration Status=Enabled

# Lifecycle policy
aws s3api put-bucket-lifecycle-configuration --bucket stone-ai-backups --lifecycle-configuration '{
  "Rules": [
    {
      "ID": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        {"Days": 30, "StorageClass": "STANDARD_IA"},
        {"Days": 90, "StorageClass": "GLACIER"},
        {"Days": 365, "StorageClass": "DEEP_ARCHIVE"}
      ],
      "Filter": {"Prefix": "database/"}
    },
    {
      "ID": "CleanupOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {"NoncurrentDays": 90},
      "Filter": {}
    }
  ]
}'

# Sync backups
aws s3 sync /mnt/nvme/backups/ s3://stone-ai-backups/ \
    --storage-class STANDARD_IA \
    --exclude "*.tmp" \
    --delete

# Encrypted upload
aws s3 cp backup.dump s3://stone-ai-backups/database/ \
    --sse aws:kms \
    --sse-kms-key-id alias/stone-ai-backup-key
```

### 5.3 Rclone (Universal Cloud Sync)

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure (interactive)
rclone config

# Example rclone.conf
# [b2]
# type = b2
# account = <key-id>
# key = <app-key>
#
# [s3]
# type = s3
# provider = AWS
# access_key_id = <key>
# secret_access_key = <secret>
# region = us-east-1

# Sync to B2
rclone sync /mnt/nvme/backups/ b2:stone-ai-backups/ \
    --transfers 4 \
    --checkers 8 \
    --contimeout 60s \
    --timeout 300s \
    --retries 3 \
    --low-level-retries 10 \
    --stats 1s \
    --log-file /var/log/rclone.log \
    --log-level INFO

# Encrypted sync (rclone crypt)
rclone sync /mnt/nvme/backups/ b2-crypt:stone-ai-backups/ --transfers 4
```

---

## 6. Backup Verification and Testing

### 6.1 Automated Restore Test

```bash
#!/bin/bash
# test-backup-restore.sh — Monthly backup verification
set -euo pipefail

LOG_FILE="/var/log/backup-test.log"
TEST_DB="stoneai_restore_test"
RESULTS=()

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG_FILE"
}

log "===== Backup Restore Test Starting ====="

# 1. Test database restore
log "Testing database restore..."
LATEST_DUMP=$(ls -t /mnt/nvme/backups/database/stoneai-*.dump | head -1)

if [ -z "$LATEST_DUMP" ]; then
    log "FAIL: No database backup found"
    RESULTS+=("DB Restore: FAIL (no backup)")
else
    # Create test database
    psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
    psql -U postgres -c "CREATE DATABASE $TEST_DB;"

    # Restore
    pg_restore \
        -U postgres \
        -d "$TEST_DB" \
        --no-owner \
        --no-privileges \
        "$LATEST_DUMP" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        # Verify table count
        TABLE_COUNT=$(psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        ROW_COUNT=$(psql -U postgres -d "$TEST_DB" -t -c "SELECT SUM(n_live_tup) FROM pg_stat_user_tables;")

        log "Restored: ${TABLE_COUNT} tables, ${ROW_COUNT} rows"
        RESULTS+=("DB Restore: PASS (${TABLE_COUNT} tables, ${ROW_COUNT} rows)")
    else
        RESULTS+=("DB Restore: FAIL (pg_restore error)")
    fi

    # Cleanup
    psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
fi

# 2. Test seeds backup
log "Testing seeds restore..."
LATEST_SEEDS=$(ls -t /mnt/nvme/backups/seeds/seeds-*.tar.gz | head -1)

if [ -z "$LATEST_SEEDS" ]; then
    RESULTS+=("Seeds Restore: FAIL (no backup)")
else
    TEST_DIR=$(mktemp -d)
    tar xzf "$LATEST_SEEDS" -C "$TEST_DIR"
    SEED_COUNT=$(find "$TEST_DIR" -name "*.md" | wc -l)

    if [ "$SEED_COUNT" -gt 0 ]; then
        RESULTS+=("Seeds Restore: PASS ($SEED_COUNT seed files)")
    else
        RESULTS+=("Seeds Restore: FAIL (0 seed files)")
    fi
    rm -rf "$TEST_DIR"
fi

# 3. Test config backup
log "Testing config restore..."
LATEST_CONFIG=$(ls -t /mnt/nvme/backups/seeds/config-*.tar.gz | head -1)

if [ -z "$LATEST_CONFIG" ]; then
    RESULTS+=("Config Restore: FAIL (no backup)")
else
    TEST_DIR=$(mktemp -d)
    tar xzf "$LATEST_CONFIG" -C "$TEST_DIR" 2>/dev/null
    FILE_COUNT=$(find "$TEST_DIR" -type f | wc -l)
    RESULTS+=("Config Restore: PASS ($FILE_COUNT config files)")
    rm -rf "$TEST_DIR"
fi

# 4. Verify offsite copies
log "Verifying offsite backups..."
if command -v b2 &>/dev/null; then
    REMOTE_COUNT=$(b2 ls stone-ai-backups database/ 2>/dev/null | wc -l)
    RESULTS+=("Offsite (B2): $REMOTE_COUNT files")
elif command -v aws &>/dev/null; then
    REMOTE_COUNT=$(aws s3 ls s3://stone-ai-backups/database/ 2>/dev/null | wc -l)
    RESULTS+=("Offsite (S3): $REMOTE_COUNT files")
else
    RESULTS+=("Offsite: SKIP (no cloud CLI)")
fi

# Report
log "===== Backup Restore Test Results ====="
for result in "${RESULTS[@]}"; do
    log "  $result"
done
log "===== Test Complete ====="

# Check for failures
FAILURES=$(printf '%s\n' "${RESULTS[@]}" | grep -c "FAIL" || true)
if [ "$FAILURES" -gt 0 ]; then
    log "ALERT: $FAILURES test(s) FAILED"
    exit 1
fi
```

### 6.2 Backup Monitoring Dashboard

```yaml
# Prometheus metrics for backup monitoring
# Custom exporter or textfile collector

# /var/lib/prometheus/node-exporter/backup.prom
backup_last_success_timestamp{type="database"} 1741478400
backup_last_success_timestamp{type="seeds"} 1741478400
backup_last_success_timestamp{type="neon"} 1741478400
backup_size_bytes{type="database"} 524288000
backup_size_bytes{type="seeds"} 10485760
backup_file_count{type="database"} 30
backup_file_count{type="seeds"} 30
backup_test_last_success_timestamp 1741305600
```

**Alerting rules:**

```yaml
groups:
  - name: backup_alerts
    rules:
      - alert: BackupMissing
        expr: time() - backup_last_success_timestamp > 86400 * 2  # 2 days
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "Backup for {{ $labels.type }} is overdue"

      - alert: BackupSizeShrunk
        expr: backup_size_bytes < backup_size_bytes offset 1d * 0.5
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Backup size for {{ $labels.type }} shrunk by >50%"

      - alert: BackupTestFailed
        expr: time() - backup_test_last_success_timestamp > 86400 * 35  # 35 days
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Monthly backup restore test is overdue"
```

---

## 7. Recovery Time and Point Objectives

### 7.1 RTO/RPO Definitions

```
RTO (Recovery Time Objective): How long until the system is back.
RPO (Recovery Point Objective): How much data can we lose.

Palace Targets:
─────────────────────────────────────────────
Component     │ RTO        │ RPO
─────────────────────────────────────────────
Web app       │ 5 min      │ 0 (stateless, redeploy)
Database      │ 30 min     │ 1 hour (hourly backups)
Neon (prod)   │ 5 min      │ ~0 (Neon PITR)
Redis cache   │ 5 min      │ Acceptable loss (cache)
vLLM/Models   │ 15 min     │ 0 (models re-downloadable)
Seeds/Config  │ 30 min     │ 24 hours (daily backup)
Full system   │ 2 hours    │ 1 hour
─────────────────────────────────────────────
```

### 7.2 Recovery Procedures

**Database Recovery (RTO: 30 min):**

```bash
#!/bin/bash
# recover-database.sh
set -euo pipefail

echo "===== Database Recovery ====="

# Option 1: Restore from latest local backup
LATEST=$(ls -t /mnt/nvme/backups/database/stoneai-*.dump | head -1)
echo "Restoring from: $LATEST"

# Drop and recreate
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'stoneai' AND pid <> pg_backend_pid();"
psql -U postgres -c "DROP DATABASE IF EXISTS stoneai;"
psql -U postgres -c "CREATE DATABASE stoneai;"

pg_restore \
    -U postgres \
    -d stoneai \
    --no-owner \
    --no-privileges \
    --jobs=4 \
    "$LATEST"

echo "Database restored. Running post-recovery checks..."
psql -U postgres -d stoneai -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';"
```

**Full System Recovery (RTO: 2 hours):**

```bash
#!/bin/bash
# full-recovery.sh — Complete Palace recovery
set -euo pipefail

echo "===== Full Palace Recovery ====="

# 1. Restore system packages
echo "[1/6] Restoring system packages..."
sudo dpkg --set-selections < /mnt/nvme/backups/system/packages-latest.txt
sudo apt-get dselect-upgrade -y

# 2. Restore Docker containers
echo "[2/6] Starting Docker services..."
cd /opt/stone-ai
docker compose up -d db redis

# 3. Restore database
echo "[3/6] Restoring database..."
sleep 10  # Wait for PostgreSQL to start
/opt/scripts/recover-database.sh

# 4. Restore application
echo "[4/6] Deploying application..."
git clone https://github.com/stonefreight2017-source/Stone-AI.git /opt/stone-ai/app
cd /opt/stone-ai/app
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm build

# 5. Restore seeds and config
echo "[5/6] Restoring seeds and configuration..."
LATEST_SEEDS=$(ls -t /mnt/nvme/backups/seeds/seeds-*.tar.gz | head -1)
tar xzf "$LATEST_SEEDS" -C /opt/stone-ai/app/docs/palace-usb-package/

LATEST_CONFIG=$(ls -t /mnt/nvme/backups/seeds/config-*.tar.gz | head -1)
tar xzf "$LATEST_CONFIG" -C /opt/stone-ai/app/

# 6. Start all services
echo "[6/6] Starting all services..."
docker compose up -d
pm2 start ecosystem.config.js

echo "===== Recovery Complete ====="
echo "Verify: curl http://localhost:3000/api/health"
```

---

## 8. Backup Encryption

### 8.1 GPG Encryption

```bash
# Generate GPG key for backups
gpg --gen-key
# Name: Stone AI Backup
# Email: backup@stone-ai.net

# Encrypt backup
gpg --encrypt --recipient backup@stone-ai.net \
    /mnt/nvme/backups/database/latest.dump

# Decrypt
gpg --decrypt /mnt/nvme/backups/database/latest.dump.gpg > restored.dump

# Symmetric encryption (password-based)
gpg --symmetric --cipher-algo AES256 backup.tar.gz
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz
```

### 8.2 Age Encryption (Modern Alternative)

```bash
# Install age
sudo apt install age

# Generate key pair
age-keygen -o palace-backup.key
# Public key: age1...

# Encrypt
age -r age1... -o backup.age backup.tar.gz

# Decrypt
age --decrypt -i palace-backup.key -o backup.tar.gz backup.age
```

---

## 9. Backup Storage Budget

```
OMEN 4TB NVMe Allocation:
─────────────────────────────────
  OS + Applications:    500GB
  Models:               500GB
  Database live:        100GB
  Docker volumes:       200GB
  ────────────────────────────
  Available for backups: ~2.7TB
─────────────────────────────────

Backup Storage Estimates (30-day retention):
  Database (daily × 30):    ~15GB
  Neon exports (4/day × 30): ~10GB
  Redis snapshots:           ~1GB
  Seeds/Config:              ~2GB
  System config:             ~1GB
  ──────────────────────────
  Total local backups:       ~30GB
  Growth rate:               ~1GB/month

Offsite Storage Costs (Backblaze B2):
  30GB × $0.006/GB/month = $0.18/month
  With 90-day archive: ~$0.54/month

Plenty of room. The 4TB NVMe can hold YEARS of backups locally.
```

---

## 10. Backup Checklist

### Daily
- [ ] Database full backup (pg_dump)
- [ ] Neon snapshot export
- [ ] Redis RDB snapshot
- [ ] Offsite sync
- [ ] Verify backup sizes

### Weekly
- [ ] Seeds and config backup
- [ ] System config backup
- [ ] Clean old backups beyond retention
- [ ] Check offsite storage health

### Monthly
- [ ] Full restore test
- [ ] Verify all offsite copies
- [ ] Review backup sizes and growth
- [ ] Update recovery documentation
- [ ] Test recovery procedures

### Quarterly
- [ ] Full disaster recovery drill
- [ ] Review and update RTO/RPO targets
- [ ] Audit encryption keys
- [ ] Review offsite storage costs

---

*Chaos Infrastructure Seed — Batch 14. Data that isn't backed up doesn't exist. Data that isn't tested for recovery is a lie.*
