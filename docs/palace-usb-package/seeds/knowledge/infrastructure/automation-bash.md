# Automation & Bash — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Idempotent Script Patterns

### The Golden Header

Every automation script starts with this:

```bash
#!/bin/bash
set -euo pipefail
# -e: Exit on any error
# -u: Error on undefined variables
# -o pipefail: Pipe fails if any command in pipe fails
```

### Check-Before-Act Pattern

```bash
#!/bin/bash
set -euo pipefail

# DON'T: blindly create things
# mkdir /opt/myapp  # Fails if exists

# DO: check first
[ -d /opt/myapp ] || mkdir -p /opt/myapp

# DON'T: blindly install
# apt install -y nginx  # Runs every time

# DO: check if already installed
command -v nginx >/dev/null 2>&1 || sudo apt install -y nginx

# DON'T: blindly add to file
# echo "export PATH=/opt/bin:$PATH" >> ~/.bashrc  # Duplicates on re-run

# DO: check if already present
grep -q '/opt/bin' ~/.bashrc || echo 'export PATH=/opt/bin:$PATH' >> ~/.bashrc
```

### Trap for Cleanup

```bash
#!/bin/bash
set -euo pipefail

TMPDIR=$(mktemp -d)
LOCKFILE="/var/run/my-script.lock"

cleanup() {
  echo "Cleaning up..."
  rm -rf "$TMPDIR"
  rm -f "$LOCKFILE"
}

# Run cleanup on exit, error, or interrupt
trap cleanup EXIT ERR INT TERM

# Create lock file
echo $$ > "$LOCKFILE"

# ... rest of script ...
# Cleanup runs automatically when script ends (success or failure)
```

---

## 2. Error Handling

### Exit Codes

| Code | Meaning | Convention |
|---|---|---|
| 0 | Success | Standard |
| 1 | General error | Standard |
| 2 | Misuse of shell command | Standard |
| 126 | Command not executable | Standard |
| 127 | Command not found | Standard |
| 130 | Terminated by Ctrl+C | Standard |
| Custom 10-99 | Application-specific | Define your own |

### Handling Non-Critical Failures

```bash
#!/bin/bash
set -euo pipefail

# This would exit the script (because of set -e):
# false

# Allow specific commands to fail:
some-command || true  # Ignore failure

# Log failure but continue:
some-command || echo "WARNING: some-command failed, continuing..."

# Capture and handle:
if ! output=$(some-command 2>&1); then
  echo "WARNING: some-command failed: $output"
  # Take alternative action
fi
```

### Retry with Exponential Backoff

```bash
#!/bin/bash
set -euo pipefail

retry() {
  local max_attempts="${1}"
  local delay="${2}"
  local command="${@:3}"
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: $command"
    if eval "$command"; then
      return 0
    fi

    if [ $attempt -lt $max_attempts ]; then
      echo "Failed. Retrying in ${delay}s..."
      sleep "$delay"
      delay=$((delay * 2))  # Double the delay each time
    fi

    attempt=$((attempt + 1))
  done

  echo "ERROR: All $max_attempts attempts failed for: $command"
  return 1
}

# Usage: retry <max_attempts> <initial_delay_seconds> <command>
retry 5 2 "curl -sf http://localhost:8000/health"
retry 3 5 "docker exec stoneai-db pg_isready -U postgres"
```

### Dead Man's Switch

A dead man's switch alerts if a script does NOT run on schedule:

```bash
#!/bin/bash
# dead-mans-switch.sh — Check that critical jobs ran
set -euo pipefail

MARKER_DIR="/var/run/stone-ai-markers"

check_marker() {
  local name="$1"
  local max_age_minutes="$2"
  local marker="$MARKER_DIR/$name"

  if [ ! -f "$marker" ]; then
    echo "ALERT: $name has NEVER run"
    return 1
  fi

  local age_minutes=$(( ($(date +%s) - $(stat -c %Y "$marker" 2>/dev/null || stat -f %m "$marker")) / 60 ))

  if [ "$age_minutes" -gt "$max_age_minutes" ]; then
    echo "ALERT: $name last ran ${age_minutes}m ago (max: ${max_age_minutes}m)"
    return 1
  fi

  echo "OK: $name ran ${age_minutes}m ago"
  return 0
}

# Check that backup ran in last 25 hours
check_marker "db-backup" 1500

# Check that health check ran in last 5 minutes
check_marker "health-check" 5

# Touch marker at end of each script:
# mkdir -p /var/run/stone-ai-markers && touch /var/run/stone-ai-markers/db-backup
```

---

## 3. Cron

### Cron Syntax

```
* * * * * command
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 and 7 = Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

### Common Schedules

```bash
# Every minute
* * * * * /script.sh

# Every 5 minutes
*/5 * * * * /script.sh

# Every hour at :00
0 * * * * /script.sh

# Daily at 3 AM
0 3 * * * /script.sh

# Weekly Sunday at midnight
0 0 * * 0 /script.sh

# Monthly first day at midnight
0 0 1 * * /script.sh

# On reboot
@reboot /script.sh

# Multiple times
0 6,12,18 * * * /script.sh  # 6 AM, noon, 6 PM
```

### Output Capture

```bash
# Log stdout and stderr
*/5 * * * * /usr/local/bin/health.sh >> /var/log/health.log 2>&1

# Discard output (silent)
*/5 * * * * /usr/local/bin/cleanup.sh > /dev/null 2>&1

# Email output (if mail is configured)
MAILTO=admin@example.com
0 3 * * * /usr/local/bin/backup.sh
```

### Lock Files (Prevent Overlapping Runs)

```bash
#!/bin/bash
# Using flock — the RIGHT way to prevent overlapping cron jobs
exec 200>/var/run/my-script.lock
flock -n 200 || { echo "Already running"; exit 0; }

# ... rest of script ...
# Lock is automatically released when script exits
```

Cron entry:
```bash
*/2 * * * * flock -n /var/run/health.lock /usr/local/bin/health.sh >> /var/log/health.log 2>&1
```

### Environment Gotchas

Cron runs with a minimal environment. Variables you have in your shell are NOT available.

```bash
# Fix 1: Set PATH explicitly in crontab
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Fix 2: Source profile in script
#!/bin/bash
source /etc/profile
source ~/.bashrc

# Fix 3: Use full paths for everything
/usr/bin/docker exec stoneai-db /usr/bin/pg_isready
# NOT just: docker exec stoneai-db pg_isready

# Fix 4: Set env vars in crontab
DOCKER=/usr/bin/docker
NVIDIA_SMI=/usr/bin/nvidia-smi
```

---

## 4. Common Scripts

### Log Rotation

```bash
#!/bin/bash
# rotate-logs.sh
set -euo pipefail

rotate_dir() {
  local dir="$1"
  local max_size_mb="${2:-100}"
  local keep="${3:-5}"

  for logfile in "$dir"/*.log; do
    [ -f "$logfile" ] || continue
    size_mb=$(du -m "$logfile" | cut -f1)

    if [ "$size_mb" -gt "$max_size_mb" ]; then
      echo "Rotating $logfile (${size_mb}MB > ${max_size_mb}MB)"
      for i in $(seq $((keep - 1)) -1 1); do
        [ -f "${logfile}.$i.gz" ] && mv "${logfile}.$i.gz" "${logfile}.$((i + 1)).gz"
      done
      cp "$logfile" "${logfile}.1" && gzip "${logfile}.1"
      > "$logfile"
    fi
  done
}

rotate_dir "/var/log/vllm" 100 5
rotate_dir "/var/log/stone-ai" 50 7
```

### Disk Cleanup

```bash
#!/bin/bash
# disk-cleanup.sh
set -euo pipefail

echo "=== Disk Cleanup $(date) ==="

# Docker cleanup
echo "Docker cleanup..."
docker system prune -f --volumes 2>/dev/null || true

# Old log files
echo "Removing logs older than 30 days..."
find /var/log/stone-ai -name "*.gz" -mtime +30 -delete 2>/dev/null || true
find /var/log/vllm -name "*.gz" -mtime +30 -delete 2>/dev/null || true

# Temp files
echo "Cleaning /tmp..."
find /tmp -type f -mtime +7 -delete 2>/dev/null || true

# npm cache
echo "Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

# pip cache
echo "Cleaning pip cache..."
pip cache purge 2>/dev/null || true

# Report
echo "Disk usage after cleanup:"
df -h / | tail -1
```

### Docker Cleanup

```bash
#!/bin/bash
# docker-cleanup.sh
set -euo pipefail

echo "=== Docker Cleanup $(date) ==="

# Remove stopped containers
echo "Removing stopped containers..."
docker container prune -f

# Remove dangling images
echo "Removing dangling images..."
docker image prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# Remove dangling volumes (CAREFUL)
echo "Removing dangling volumes..."
docker volume prune -f

echo "Docker disk usage:"
docker system df
```

### Database Backup

```bash
#!/bin/bash
# backup-db.sh
set -euo pipefail

BACKUP_DIR="/var/backups/postgresql"
CONTAINER="stoneai-db"
DB_USER="postgres"
DB_NAME="stoneai"
KEEP_DAYS=14
MARKER_DIR="/var/run/stone-ai-markers"

mkdir -p "$BACKUP_DIR" "$MARKER_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

echo "[$(date)] Starting backup..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_FILE"

SIZE=$(wc -c < "$BACKUP_FILE")
if [ "$SIZE" -lt 1000 ]; then
  echo "ERROR: Backup suspiciously small (${SIZE} bytes)"
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "Backup: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Rotate
find "$BACKUP_DIR" -name "*.dump" -mtime +$KEEP_DAYS -delete
echo "Rotated backups older than $KEEP_DAYS days"

# Dead man's switch marker
touch "$MARKER_DIR/db-backup"
echo "[$(date)] Backup complete"
```

### Health Check

```bash
#!/bin/bash
# health-check.sh
set -euo pipefail

MARKER_DIR="/var/run/stone-ai-markers"
mkdir -p "$MARKER_DIR"

STATUS=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "OK: $name"
  else
    echo "FAIL: $name"
    STATUS=1
  fi
}

check "vLLM" "curl -sf --max-time 5 http://localhost:8000/health"
check "PostgreSQL" "docker exec stoneai-db pg_isready -U postgres"
check "Redis" "docker exec stoneai-redis redis-cli ping | grep -q PONG"
check "GPU" "nvidia-smi"
check "Disk (<90%)" "[ $(df -h / | tail -1 | awk '{print \$5}' | tr -d '%') -lt 90 ]"

touch "$MARKER_DIR/health-check"
exit $STATUS
```

### Blue-Green Deploy Concept

```bash
#!/bin/bash
# blue-green-deploy.sh — Zero-downtime deployment pattern
set -euo pipefail

BLUE_PORT=3000
GREEN_PORT=3001
CURRENT_FILE="/var/run/current-color"

current_color() {
  cat "$CURRENT_FILE" 2>/dev/null || echo "blue"
}

if [ "$(current_color)" = "blue" ]; then
  DEPLOY_PORT=$GREEN_PORT
  DEPLOY_COLOR="green"
  OLD_COLOR="blue"
else
  DEPLOY_PORT=$BLUE_PORT
  DEPLOY_COLOR="blue"
  OLD_COLOR="green"
fi

echo "Current: $OLD_COLOR. Deploying to: $DEPLOY_COLOR (port $DEPLOY_PORT)"

# 1. Start new version on deploy port
echo "Starting new version on port $DEPLOY_PORT..."
# (Start your app on $DEPLOY_PORT)

# 2. Health check new version
echo "Waiting for health check..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$DEPLOY_PORT/api/health" > /dev/null 2>&1; then
    echo "New version healthy after ${i}s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: New version failed health check"
    exit 1
  fi
  sleep 1
done

# 3. Switch traffic (update nginx upstream)
echo "Switching traffic to $DEPLOY_COLOR..."
# Update nginx config to point to $DEPLOY_PORT
# sudo nginx -s reload

# 4. Stop old version
echo "Stopping old version ($OLD_COLOR)..."
# (Stop old app)

echo "$DEPLOY_COLOR" > "$CURRENT_FILE"
echo "Deploy complete. Active: $DEPLOY_COLOR"
```

---

## 5. Templates

### Parameterized with Defaults

```bash
#!/bin/bash
# template-script.sh — Shows parameter patterns
set -euo pipefail

# Parameters with defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-stoneai}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups}"
LOG_LEVEL="${LOG_LEVEL:-info}"

# Required parameters (fail if not set)
: "${API_KEY:?ERROR: API_KEY must be set}"

# Command-line argument overrides
while [[ $# -gt 0 ]]; do
  case $1 in
    --host) DB_HOST="$2"; shift 2 ;;
    --port) DB_PORT="$2"; shift 2 ;;
    --name) DB_NAME="$2"; shift 2 ;;
    --help) echo "Usage: $0 [--host HOST] [--port PORT] [--name DB]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "Connecting to $DB_HOST:$DB_PORT/$DB_NAME as $DB_USER"
```

### Config Generation from Environment

```bash
#!/bin/bash
# generate-config.sh — Generate nginx config from env vars
set -euo pipefail

DOMAIN="${DOMAIN:-stone-ai.local}"
APP_PORT="${APP_PORT:-3000}"
VLLM_PORT="${VLLM_PORT:-8000}"

cat > /etc/nginx/sites-available/generated.conf << HEREDOC
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /v1/ {
        proxy_pass http://127.0.0.1:${VLLM_PORT}/v1/;
        proxy_read_timeout 300s;
    }
}
HEREDOC

echo "Generated config for ${DOMAIN} -> app:${APP_PORT}, vllm:${VLLM_PORT}"
nginx -t && echo "Config valid" || echo "Config INVALID"
```

---

## 6. Quick Reference Card

| Pattern | Command |
|---|---|
| Safe script header | `set -euo pipefail` |
| Cleanup on exit | `trap cleanup EXIT ERR INT TERM` |
| Check before create | `[ -d /path ] \|\| mkdir -p /path` |
| Idempotent append | `grep -q 'pattern' file \|\| echo 'line' >> file` |
| Ignore failure | `cmd \|\| true` |
| Retry command | `retry 5 2 "curl -sf url"` (see retry function above) |
| Lock file | `flock -n /var/run/lock cmd` |
| Default variable | `${VAR:-default}` |
| Required variable | `${VAR:?error message}` |
| Edit crontab | `crontab -e` |
| List crontab | `crontab -l` |
| Temp directory | `TMPDIR=$(mktemp -d)` |
