# Linux & WSL2 Administration — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Systemd Service Management

### Service Lifecycle

```bash
# Start a service
sudo systemctl start <service-name>

# Stop a service
sudo systemctl stop <service-name>

# Restart (stop + start)
sudo systemctl restart <service-name>

# Reload config without full restart (if service supports it)
sudo systemctl reload <service-name>

# Check status
sudo systemctl status <service-name>

# Enable on boot
sudo systemctl enable <service-name>

# Disable from boot
sudo systemctl disable <service-name>

# Check if service is active
systemctl is-active <service-name>
# Returns: active, inactive, failed

# Check if service is enabled
systemctl is-enabled <service-name>
# Returns: enabled, disabled, static, masked

# List all running services
systemctl list-units --type=service --state=running

# List failed services
systemctl list-units --type=service --state=failed
```

### Custom Service Units

```ini
# /etc/systemd/system/vllm.service
[Unit]
Description=vLLM Inference Server
After=network.target docker.service
Wants=network-online.target
# Only start after Docker is up (for DB dependency)
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/vllm-env
Environment=VLLM_FLASH_ATTN_VERSION=2
ExecStartPre=/usr/bin/nvidia-smi  # Verify GPU is accessible
ExecStart=/home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000 \
  --gpu-memory-utilization 0.90
ExecStop=/bin/kill -SIGTERM $MAINPID
Restart=on-failure
RestartSec=10
TimeoutStartSec=120
TimeoutStopSec=30
# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vllm

[Install]
WantedBy=multi-user.target
```

### Restart Policies

| Policy | Behavior | Use When |
|---|---|---|
| `no` | Never auto-restart | Manual control needed |
| `on-failure` | Restart only on non-zero exit | Standard for services |
| `on-abnormal` | Restart on signal/timeout/watchdog | Crash recovery only |
| `on-success` | Restart only on clean exit (0) | Rare |
| `always` | Restart no matter what | Critical services |

```ini
# Rate limiting restarts (prevent restart loops)
Restart=on-failure
RestartSec=10           # Wait 10s between restarts
StartLimitIntervalSec=300  # Within 5 minutes...
StartLimitBurst=5          # ...allow max 5 restarts
```

### Dependency Ordering

```ini
# Start AFTER these (soft dependency — won't fail if they're missing)
After=network.target docker.service

# Start AFTER these AND require them to be active (hard dependency)
Requires=docker.service
After=docker.service

# Want these started, but don't fail if they can't
Wants=redis.service

# Ordering without dependency
Before=nginx.service  # Start this unit before nginx
```

---

## 2. Memory Management

### Reading Memory Stats

```bash
# Human-readable memory overview
free -h
#               total    used    free   shared  buff/cache  available
# Mem:           31Gi    18Gi    2Gi    256Mi      11Gi       12Gi
# Swap:          8Gi     1Gi     7Gi

# Key: "available" is what matters, not "free"
# "available" = free + reclaimable cache
# Linux uses free RAM for disk cache, which is reclaimed on demand

# Detailed memory info
cat /proc/meminfo

# Per-process memory (top 10)
ps aux --sort=-%mem | head -11

# Specific process memory
ps -p <pid> -o pid,vsz,rss,comm
# VSZ = virtual (allocated), RSS = resident (actually in RAM)
```

### OOM Killer

When Linux runs out of memory, the OOM killer picks a process to terminate.

```bash
# Check if OOM killer has struck recently
dmesg | grep -i "out of memory\|oom-kill" | tail -10

# Check a process's OOM score (higher = more likely to be killed)
cat /proc/<pid>/oom_score

# Protect a process from OOM killer
# -1000 = never kill, 0 = normal, 1000 = kill first
echo -1000 | sudo tee /proc/<pid>/oom_score_adj

# Protect vLLM from OOM killer
# Add to systemd unit:
# [Service]
# OOMScoreAdjust=-500
```

### Swap Configuration

```bash
# Check swap
swapon --show

# Create swap file (if needed)
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Tune swappiness (0 = avoid swap, 100 = swap eagerly)
cat /proc/sys/vm/swappiness  # Default: 60
sudo sysctl vm.swappiness=10  # Prefer keeping things in RAM

# Make permanent
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

---

## 3. WSL2 Specifics

### .wslconfig (Windows-side Configuration)

Location: `C:\Users\stone\.wslconfig`

```ini
[wsl2]
memory=24GB          # Max RAM WSL2 can use (default: 50% of host)
swap=8GB             # Swap size
processors=8         # Max CPU cores
localhostForwarding=true  # Forward localhost ports to Windows

[experimental]
autoMemoryReclaim=gradual  # Gradually reclaim unused memory
sparseVhd=true              # Shrink virtual disk when files deleted
```

After editing `.wslconfig`, restart WSL:
```powershell
# From PowerShell (Windows side)
wsl --shutdown
# Then relaunch your WSL terminal
```

### /etc/wsl.conf (Linux-side Configuration)

```ini
# /etc/wsl.conf
[automount]
enabled=true
root=/mnt/
options="metadata,umask=22,fmask=11"  # Enable chmod on NTFS mounts

[network]
generateResolvConf=true
hostname=omen-wsl

[boot]
systemd=true  # Enable systemd (required for systemctl)

[interop]
enabled=true  # Allow running Windows executables from WSL
appendWindowsPath=true
```

After editing `/etc/wsl.conf`, restart WSL:
```powershell
wsl --shutdown
```

### WSL2 Networking

```bash
# Get WSL2's IP address
ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
# This changes on every WSL restart!

# Windows can access WSL2 via localhost (if localhostForwarding=true)
# WSL2 can access Windows via:
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
# This IP is the Windows host from WSL2's perspective
```

### Port Forwarding (Windows to WSL2)

localhost forwarding handles most cases, but for external access:

```powershell
# From PowerShell (Admin) on Windows:
# Forward Windows port 8000 to WSL2 port 8000
netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=$(wsl hostname -I | ForEach-Object { $_.Trim() })

# List all port forwarding rules
netsh interface portproxy show all

# Remove a forwarding rule
netsh interface portproxy delete v4tov4 listenport=8000 listenaddress=0.0.0.0
```

### Filesystem Performance

**Critical**: File operations on `/mnt/c/` (NTFS) are 5-10x slower than on the ext4 filesystem inside WSL2.

| Path | Filesystem | Speed | Use For |
|---|---|---|---|
| `/home/`, `/opt/`, `/var/` | ext4 (WSL2 native) | Fast | Code, packages, temp files |
| `/mnt/c/` | NTFS (Windows mount) | Slow | Model files (read-once), shared files |
| `/tmp/` | tmpfs (RAM) | Fastest | Ephemeral temp files |

```bash
# Benchmark the difference
time dd if=/dev/zero of=/home/testfile bs=1M count=1000 oflag=dsync 2>&1 | tail -1
time dd if=/dev/zero of=/mnt/c/testfile bs=1M count=1000 oflag=dsync 2>&1 | tail -1
rm /home/testfile /mnt/c/testfile

# Model files on /mnt/c/ are OK because they're loaded once into VRAM
# But don't put node_modules, .git, or databases on /mnt/c/
```

### Clock Drift Fix

WSL2 can drift from the host clock after sleep/hibernate:

```bash
# Check if clock is drifted
date
# Compare with Windows: powershell.exe "Get-Date"

# Fix immediately
sudo hwclock -s

# Or sync with NTP
sudo ntpdate pool.ntp.org

# Permanent fix: Add to /etc/wsl.conf
# [boot]
# command="ntpdate pool.ntp.org"
```

---

## 4. Cron in WSL2

### The Problem

Cron doesn't auto-start in WSL2 (even with systemd enabled, it can be unreliable).

### Solution 1: Manual Start

```bash
# Start cron service
sudo service cron start

# Verify it's running
service cron status

# Edit crontab
crontab -e
```

### Solution 2: Auto-Start via /etc/wsl.conf

```ini
# /etc/wsl.conf
[boot]
command="service cron start"
```

### Solution 3: Windows Task Scheduler Workaround

Create a Windows scheduled task that runs on login:
```powershell
# PowerShell (Admin)
$action = New-ScheduledTaskAction -Execute "wsl" -Argument "-d Ubuntu -u root service cron start"
$trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "WSL-Cron" -Action $action -Trigger $trigger -RunLevel Highest
```

### Cron Examples for Stone AI

```bash
# Edit crontab
crontab -e

# Health check every 2 minutes
*/2 * * * * /usr/local/bin/vllm-healthcheck.sh >> /var/log/vllm-health.log 2>&1

# Database backup daily at 3 AM
0 3 * * * /usr/local/bin/backup-db.sh >> /var/log/db-backup.log 2>&1

# Log rotation weekly
0 0 * * 0 /usr/local/bin/rotate-logs.sh >> /var/log/rotation.log 2>&1

# Docker cleanup weekly
0 4 * * 0 docker system prune -f >> /var/log/docker-cleanup.log 2>&1

# GPU thermal log every minute
* * * * * nvidia-smi --query-gpu=timestamp,temperature.gpu,power.draw --format=csv,noheader >> /var/log/gpu-thermal.csv

# Restart vLLM if health check fails (every 5 min)
*/5 * * * * /usr/local/bin/vllm-healthcheck.sh || /usr/local/bin/vllm-restart.sh >> /var/log/vllm-restart.log 2>&1
```

---

## 5. Networking

### IP Address Management

```bash
# WSL2 IP (changes on each restart)
ip addr show eth0 | grep "inet " | awk '{print $2}'

# All interfaces
ip addr show

# Windows host IP from WSL2
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'

# Listening ports
ss -tlnp
# t=TCP, l=listening, n=numeric, p=process

# Check if a specific port is in use
ss -tlnp | grep :8000
```

### DNS Configuration

```bash
# WSL2 auto-generates /etc/resolv.conf
cat /etc/resolv.conf

# If DNS breaks:
# Option 1: Use Google DNS
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Option 2: Prevent WSL2 from overwriting resolv.conf
# In /etc/wsl.conf:
# [network]
# generateResolvConf=false
# Then manually set /etc/resolv.conf
```

### Firewall (Inside WSL2)

```bash
# UFW (Uncomplicated Firewall)
sudo ufw status
sudo ufw enable
sudo ufw allow 8000/tcp    # Allow vLLM
sudo ufw allow 3000/tcp    # Allow Next.js
sudo ufw allow 5432/tcp    # Allow PostgreSQL
sudo ufw deny 22           # Block SSH if not needed

# Note: Windows Firewall also applies for external access
# Both must allow the port for external connections
```

---

## 6. File Permissions

### WSL2 Metadata for NTFS

By default, all files on `/mnt/c/` appear as mode 777. To get proper permissions:

```ini
# /etc/wsl.conf
[automount]
options="metadata,umask=22,fmask=11"
```

After restart:
```bash
# Now chmod works on /mnt/c/ files
chmod 600 /mnt/c/Users/stone/.env
chmod 755 /mnt/c/scripts/deploy.sh
```

### Permission Essentials

```bash
# Key permissions for Stone AI
chmod 600 .env              # Owner read/write only (secrets)
chmod 644 config.json       # Owner read/write, others read
chmod 755 scripts/*.sh      # Owner rwx, others rx (executables)
chmod 700 ~/.ssh             # SSH directory (owner only)
chmod 600 ~/.ssh/id_rsa      # Private key (owner read/write only)

# Check permissions
ls -la file
stat file

# Change ownership
sudo chown stone:stone file
sudo chown -R stone:stone /var/log/vllm/
```

---

## 7. Log Management

### journalctl (Systemd Logs)

```bash
# Follow logs for a service
sudo journalctl -u vllm -f --no-pager

# Last 100 lines
sudo journalctl -u vllm -n 100 --no-pager

# Since a time
sudo journalctl -u vllm --since "2024-01-01 12:00:00" --no-pager

# Since boot
sudo journalctl -u vllm -b --no-pager

# Kernel messages (hardware issues)
sudo journalctl -k --no-pager | tail -50

# Disk usage of journal
sudo journalctl --disk-usage

# Trim journal to 500MB
sudo journalctl --vacuum-size=500M

# Trim journal older than 7 days
sudo journalctl --vacuum-time=7d
```

### logrotate Configuration

```bash
# /etc/logrotate.d/stone-ai
/var/log/vllm/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        # Signal vLLM to reopen log files if using file logging
        kill -USR1 $(cat /var/run/vllm.pid 2>/dev/null) 2>/dev/null || true
    endscript
}

/var/log/stone-ai/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

```bash
# Test logrotate config
sudo logrotate -d /etc/logrotate.d/stone-ai  # Dry run
sudo logrotate -f /etc/logrotate.d/stone-ai  # Force run
```

### Manual Log Rotation Script

```bash
#!/bin/bash
# rotate-logs.sh — Simple log rotation for services without logrotate
set -euo pipefail

LOG_DIR="/var/log/vllm"
MAX_SIZE_MB=100
KEEP_COUNT=5

for logfile in "$LOG_DIR"/*.log; do
  [ -f "$logfile" ] || continue

  size_mb=$(du -m "$logfile" | cut -f1)
  if [ "$size_mb" -gt "$MAX_SIZE_MB" ]; then
    echo "Rotating $logfile (${size_mb}MB)"

    # Shift old logs
    for i in $(seq $((KEEP_COUNT - 1)) -1 1); do
      [ -f "${logfile}.$i.gz" ] && mv "${logfile}.$i.gz" "${logfile}.$((i + 1)).gz"
    done

    # Compress current
    cp "$logfile" "${logfile}.1"
    gzip "${logfile}.1"

    # Truncate (don't remove — process has file handle open)
    > "$logfile"

    echo "Rotated $logfile"
  fi
done
```

---

## 8. System Monitoring One-Liners

```bash
# CPU usage (top 5 processes)
ps aux --sort=-%cpu | head -6

# Memory usage (top 5 processes)
ps aux --sort=-%mem | head -6

# Disk usage
df -h

# Disk usage by directory
du -sh /var/log/* | sort -rh | head -10

# IO stats
iostat -x 1 3

# Network connections
ss -tuanp

# Open files by process
lsof -p <pid> | wc -l

# System uptime and load
uptime
# Load average: 1-min, 5-min, 15-min
# Rule of thumb: load > number of CPUs = overloaded

# Check for zombie processes
ps aux | grep Z

# WSL2-specific: total memory available
grep MemTotal /proc/meminfo
```

---

## 9. Troubleshooting Playbooks

### WSL2 Won't Start

**Symptom**: `wsl` command hangs or errors in PowerShell.

**Diagnosis**:
```powershell
# PowerShell
wsl --status
wsl --list --verbose
```

**Fix**:
```powershell
# Shutdown and restart
wsl --shutdown
# Wait 5 seconds
wsl

# If that fails, restart the WSL service
net stop LxssManager
net start LxssManager
wsl
```

### WSL2 Networking Broken

**Symptom**: Can't `apt update`, DNS fails, but Windows internet works.

**Fix**:
```bash
# Quick fix: manually set DNS
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Permanent fix: disable auto-generation
# /etc/wsl.conf:
# [network]
# generateResolvConf=false

# Then create static resolv.conf
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
sudo chattr +i /etc/resolv.conf  # Prevent overwriting
```

### WSL2 Using Too Much Memory

**Symptom**: Windows host running low on RAM.

**Fix**:
```ini
# C:\Users\stone\.wslconfig
[wsl2]
memory=16GB  # Cap WSL2 memory

[experimental]
autoMemoryReclaim=gradual
```
```powershell
wsl --shutdown
# Relaunch
```

### Port Conflict

**Symptom**: Service can't bind to port. "Address already in use."

**Diagnosis**:
```bash
# Find what's using the port
ss -tlnp | grep :8000

# Or from Windows side:
# netstat -ano | findstr :8000
```

**Fix**:
```bash
# Kill the process using the port
kill $(ss -tlnp | grep :8000 | awk '{print $NF}' | grep -o '[0-9]*')

# Or use a different port
--port 8001
```

---

## 10. Quick Reference Card

| Task | Command |
|---|---|
| Service status | `sudo systemctl status <service>` |
| Start service | `sudo systemctl start <service>` |
| Enable on boot | `sudo systemctl enable <service>` |
| View service logs | `sudo journalctl -u <service> -f --no-pager` |
| Memory overview | `free -h` |
| Disk space | `df -h` |
| Directory sizes | `du -sh /path/* \| sort -rh \| head` |
| WSL2 IP | `ip addr show eth0 \| grep "inet "` |
| Listening ports | `ss -tlnp` |
| Process by port | `ss -tlnp \| grep :<port>` |
| Top CPU processes | `ps aux --sort=-%cpu \| head -6` |
| Top RAM processes | `ps aux --sort=-%mem \| head -6` |
| Kill process | `kill -SIGTERM <pid>` or `kill -9 <pid>` |
| Start cron | `sudo service cron start` |
| Edit crontab | `crontab -e` |
| WSL restart | `wsl --shutdown` (from PowerShell) |
| Fix DNS | `echo "nameserver 8.8.8.8" \| sudo tee /etc/resolv.conf` |
| Fix clock drift | `sudo hwclock -s` |
