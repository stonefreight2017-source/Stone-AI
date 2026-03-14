# System Hardening Checklist — Palace Infrastructure Seed

## Chaos Directive: Lock Down Every Surface

The OMEN 45L is a production machine running AI inference, databases, and web services. It sits on a network accessible to the internet via Cloudflare. Every surface that isn't hardened is an attack surface. This seed covers Windows hardening, WSL2 hardening, firewall rules, service accounts, audit policies, and CIS benchmarks.

---

## 1. Windows 11 Pro Hardening

### 1.1 Account Security

```powershell
# Rename the built-in Administrator account
Rename-LocalUser -Name "Administrator" -NewName "SysRoot"

# Disable Guest account
Disable-LocalUser -Name "Guest"

# Set account lockout policy
net accounts /lockoutthreshold:5 /lockoutduration:30 /lockoutwindow:30

# Set password policy
net accounts /minpwlen:14 /maxpwage:90 /minpwage:1 /uniquepw:12

# Require Ctrl+Alt+Del for login
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name "DisableCAD" -Value 0

# Disable auto-login
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" -Name "AutoAdminLogon" -Value "0"
```

### 1.2 Windows Defender Configuration

```powershell
# Ensure Windows Defender is active
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -DisableBehaviorMonitoring $false
Set-MpPreference -DisableIOAVProtection $false
Set-MpPreference -DisableIntrusionPreventionSystem $false

# Enable cloud-delivered protection
Set-MpPreference -MAPSReporting Advanced
Set-MpPreference -SubmitSamplesConsent SendAllSamples

# Enable controlled folder access (ransomware protection)
Set-MpPreference -EnableControlledFolderAccess Enabled

# Add exclusions for development (only what's necessary)
Add-MpPreference -ExclusionPath "C:\Users\stone\stone-ai\node_modules"
Add-MpPreference -ExclusionPath "C:\Users\stone\stone-ai\.next"
Add-MpPreference -ExclusionProcess "node.exe"
Add-MpPreference -ExclusionProcess "docker.exe"

# Enable PUA protection
Set-MpPreference -PUAProtection Enabled

# Schedule full scan
Set-MpPreference -ScanScheduleDay 0 -ScanScheduleTime 02:00:00
```

### 1.3 Windows Firewall

```powershell
# Ensure firewall is enabled for all profiles
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# Set default policies (deny inbound, allow outbound)
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block -DefaultOutboundAction Allow

# Allow essential services only
# SSH (WSL2)
New-NetFirewallRule -DisplayName "SSH WSL2" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow -Profile Private

# PostgreSQL (local only)
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -Profile Private -RemoteAddress 127.0.0.1,172.16.0.0/12

# Redis (local only)
New-NetFirewallRule -DisplayName "Redis" -Direction Inbound -Protocol TCP -LocalPort 6379 -Action Allow -Profile Private -RemoteAddress 127.0.0.1,172.16.0.0/12

# Next.js dev server
New-NetFirewallRule -DisplayName "Next.js" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private

# vLLM inference
New-NetFirewallRule -DisplayName "vLLM" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Private

# Block all other inbound
New-NetFirewallRule -DisplayName "Block All Other Inbound" -Direction Inbound -Action Block -Profile Public

# Log dropped packets
Set-NetFirewallProfile -Profile Domain,Public,Private -LogBlocked True -LogMaxSizeKilobytes 4096
```

### 1.4 Windows Services Hardening

```powershell
# Disable unnecessary services
$disableServices = @(
    "RemoteRegistry",       # Remote Registry
    "WMPNetworkSvc",        # Windows Media Player Network Sharing
    "XblAuthManager",       # Xbox Live Auth Manager
    "XblGameSave",          # Xbox Live Game Save
    "XboxNetApiSvc",        # Xbox Live Networking Service
    "DiagTrack",            # Connected User Experiences and Telemetry
    "dmwappushservice",     # Device Management Push
    "MapsBroker",           # Downloaded Maps Manager
    "lfsvc",                # Geolocation Service
    "SharedAccess",         # Internet Connection Sharing
    "RetailDemo",           # Retail Demo Service
    "WpcMonSvc"             # Parental Controls
)

foreach ($svc in $disableServices) {
    if (Get-Service -Name $svc -ErrorAction SilentlyContinue) {
        Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
        Set-Service -Name $svc -StartupType Disabled
        Write-Host "Disabled: $svc"
    }
}

# Ensure critical services are running
$ensureServices = @(
    "EventLog",             # Windows Event Log
    "WinDefend",            # Windows Defender
    "mpssvc",               # Windows Firewall
    "BFE",                  # Base Filtering Engine
    "W32Time",              # Windows Time
    "Dnscache",             # DNS Client
    "wuauserv"              # Windows Update
)

foreach ($svc in $ensureServices) {
    Set-Service -Name $svc -StartupType Automatic
    Start-Service -Name $svc -ErrorAction SilentlyContinue
}
```

### 1.5 Registry Hardening

```powershell
# Disable remote desktop (unless explicitly needed)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -Value 1

# Disable AutoRun/AutoPlay
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" -Name "NoDriveTypeAutoRun" -Value 255

# Disable Windows Script Host
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings" -Name "Enabled" -Value 0

# Enable DEP (Data Execution Prevention)
bcdedit /set nx AlwaysOn

# Disable LLMNR (Link-Local Multicast Name Resolution)
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" -Name "EnableMulticast" -Value 0

# Disable NetBIOS over TCP/IP
Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | ForEach-Object { $_.SetTcpipNetbios(2) }

# Disable SMBv1
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart

# Enable SMB signing
Set-SmbServerConfiguration -RequireSecuritySignature $true -Force
Set-SmbClientConfiguration -RequireSecuritySignature $true -Force
```

---

## 2. WSL2 (Kali) Hardening

### 2.1 System Updates

```bash
# Keep system updated
sudo apt update && sudo apt upgrade -y
sudo apt dist-upgrade -y
sudo apt autoremove -y

# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2.2 SSH Hardening

```bash
# /etc/ssh/sshd_config
cat << 'EOF' | sudo tee /etc/ssh/sshd_config.d/hardening.conf
# Protocol
Protocol 2

# Authentication
PermitRootLogin no
MaxAuthTries 3
MaxSessions 5
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Key exchange and ciphers
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Timeouts
LoginGraceTime 60
ClientAliveInterval 300
ClientAliveCountMax 2

# Logging
LogLevel VERBOSE
SyslogFacility AUTH

# Access control
AllowUsers stone
DenyUsers root

# Port (non-standard)
Port 2222

# Misc
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PrintMotd no
TCPKeepAlive no
Compression no
EOF

sudo systemctl restart sshd
```

### 2.3 UFW Firewall in WSL2

```bash
# Install and enable UFW
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (custom port)
sudo ufw allow 2222/tcp comment "SSH"

# Allow from localhost/Docker only for services
sudo ufw allow from 127.0.0.0/8 to any port 5432 comment "PostgreSQL local"
sudo ufw allow from 172.16.0.0/12 to any port 5432 comment "PostgreSQL Docker"
sudo ufw allow from 127.0.0.0/8 to any port 6379 comment "Redis local"
sudo ufw allow from 172.16.0.0/12 to any port 6379 comment "Redis Docker"

# Enable
sudo ufw enable
sudo ufw status verbose
```

### 2.4 User and Permission Hardening

```bash
# Set proper umask
echo "umask 027" | sudo tee -a /etc/profile.d/umask.sh

# Restrict cron access
echo "stone" | sudo tee /etc/cron.allow
echo "" | sudo tee /etc/cron.deny

# Restrict su access
sudo groupadd sugroup
sudo usermod -aG sugroup stone
echo "auth required pam_wheel.so group=sugroup" | sudo tee -a /etc/pam.d/su

# Set ownership on sensitive directories
sudo chmod 700 /root
sudo chmod 700 /home/stone/.ssh
sudo chmod 600 /home/stone/.ssh/authorized_keys

# Disable unused shells
sudo usermod -s /usr/sbin/nologin daemon
sudo usermod -s /usr/sbin/nologin bin
sudo usermod -s /usr/sbin/nologin sys
sudo usermod -s /usr/sbin/nologin sync

# Password aging
sudo chage -M 90 -m 7 -W 14 stone
```

### 2.5 Kernel Hardening (sysctl)

```bash
# /etc/sysctl.d/99-palace-hardening.conf
cat << 'EOF' | sudo tee /etc/sysctl.d/99-palace-hardening.conf
# Network hardening
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# IPv6 (disable if not needed)
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1

# Kernel hardening
kernel.randomize_va_space = 2
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.yama.ptrace_scope = 1
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
EOF

sudo sysctl -p /etc/sysctl.d/99-palace-hardening.conf
```

---

## 3. Docker Hardening

### 3.1 Docker Daemon Configuration

```json
// /etc/docker/daemon.json
{
    "icc": false,
    "userns-remap": "default",
    "no-new-privileges": true,
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "50m",
        "max-file": "3"
    },
    "live-restore": true,
    "storage-driver": "overlay2",
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 64000,
            "Soft": 64000
        },
        "nproc": {
            "Name": "nproc",
            "Hard": 4096,
            "Soft": 4096
        }
    },
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```

### 3.2 Container Security

```yaml
# Docker Compose security settings per container
services:
  web:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    user: "1001:1001"
    pids_limit: 100
    mem_limit: 4g
    cpus: 4.0

  db:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
      - DAC_OVERRIDE
      - FOWNER
    pids_limit: 200
```

### 3.3 Docker Bench Security

```bash
# Run Docker Bench Security audit
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /usr/bin/containerd:/usr/bin/containerd:ro \
    -v /usr/bin/runc:/usr/bin/runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security
```

---

## 4. Service Accounts

### 4.1 Principle of Least Privilege

```bash
# Create dedicated service accounts for each service
# PostgreSQL
sudo useradd -r -s /usr/sbin/nologin -d /var/lib/postgresql postgres_svc

# Redis
sudo useradd -r -s /usr/sbin/nologin -d /var/lib/redis redis_svc

# vLLM
sudo useradd -r -s /usr/sbin/nologin -d /opt/vllm vllm_svc

# Next.js
sudo useradd -r -s /usr/sbin/nologin -d /opt/stone-ai nextjs_svc

# Nginx
sudo useradd -r -s /usr/sbin/nologin -d /var/cache/nginx nginx_svc

# Set ownership
sudo chown -R postgres_svc:postgres_svc /var/lib/postgresql
sudo chown -R redis_svc:redis_svc /var/lib/redis
sudo chown -R vllm_svc:vllm_svc /opt/vllm
sudo chown -R nextjs_svc:nextjs_svc /opt/stone-ai
```

### 4.2 sudoers Configuration

```bash
# /etc/sudoers.d/stone-ai
# Only allow specific commands
stone ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
stone ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart docker
stone ALL=(ALL) NOPASSWD: /usr/bin/docker compose *
stone ALL=(ALL) NOPASSWD: /opt/scripts/palace-backup.sh
stone ALL=(ALL) NOPASSWD: /usr/bin/nvidia-smi
```

---

## 5. Audit Policies

### 5.1 Windows Audit Configuration

```powershell
# Enable comprehensive auditing
# Account Logon Events
auditpol /set /category:"Account Logon" /success:enable /failure:enable

# Account Management
auditpol /set /category:"Account Management" /success:enable /failure:enable

# Logon/Logoff
auditpol /set /category:"Logon/Logoff" /success:enable /failure:enable

# Object Access
auditpol /set /category:"Object Access" /success:enable /failure:enable

# Policy Change
auditpol /set /category:"Policy Change" /success:enable /failure:enable

# Privilege Use
auditpol /set /category:"Privilege Use" /success:enable /failure:enable

# Process Tracking
auditpol /set /category:"Detailed Tracking" /success:enable /failure:enable

# System Events
auditpol /set /category:"System" /success:enable /failure:enable

# View current audit policy
auditpol /get /category:*
```

### 5.2 Linux Audit (auditd)

```bash
# Install auditd
sudo apt install auditd audispd-plugins

# /etc/audit/rules.d/palace.rules
cat << 'EOF' | sudo tee /etc/audit/rules.d/palace.rules
# Delete all existing rules
-D

# Buffer Size
-b 8192

# Failure Mode (1 = printk, 2 = panic)
-f 1

# Monitor authentication
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers

# Monitor SSH
-w /etc/ssh/sshd_config -p wa -k sshd
-w /home/stone/.ssh/ -p wa -k ssh_keys

# Monitor Docker
-w /etc/docker/ -p wa -k docker
-w /var/run/docker.sock -p wa -k docker

# Monitor backup scripts
-w /opt/scripts/ -p wa -k scripts

# Monitor stone-ai config
-w /opt/stone-ai/.env.local -p wa -k stoneai_config
-w /opt/stone-ai/prisma/schema.prisma -p wa -k stoneai_schema

# Monitor system binaries
-w /usr/bin/ -p wa -k binaries
-w /usr/sbin/ -p wa -k binaries

# Log all commands run as root
-a always,exit -F arch=b64 -F euid=0 -S execve -k root_commands

# Log failed access attempts
-a always,exit -F arch=b64 -S open -F exit=-EACCES -k access_denied
-a always,exit -F arch=b64 -S open -F exit=-EPERM -k access_denied

# Make rules immutable (requires reboot to change)
-e 2
EOF

sudo systemctl restart auditd
```

### 5.3 Log Monitoring

```bash
#!/bin/bash
# audit-monitor.sh — Check for suspicious activity
set -euo pipefail

echo "===== Palace Security Audit ====="
echo "Date: $(date)"

# Failed login attempts (last 24h)
echo -e "\n--- Failed Logins ---"
ausearch -m USER_LOGIN --success no -ts yesterday 2>/dev/null | head -20

# Sudo usage
echo -e "\n--- Sudo Activity ---"
ausearch -m USER_CMD -ts yesterday 2>/dev/null | head -20

# File modifications to sensitive files
echo -e "\n--- Config Changes ---"
ausearch -k stoneai_config -ts yesterday 2>/dev/null | head -20
ausearch -k identity -ts yesterday 2>/dev/null | head -20

# Docker events
echo -e "\n--- Docker Events ---"
ausearch -k docker -ts yesterday 2>/dev/null | head -20

# SSH connections
echo -e "\n--- SSH Connections ---"
journalctl -u sshd --since yesterday --no-pager | grep -E "Accepted|Failed" | tail -20

echo -e "\n===== Audit Complete ====="
```

---

## 6. CIS Benchmark Compliance

### 6.1 CIS Windows 11 Key Controls

```
CATEGORY                           STATUS   ACTION
────────────────────────────────────────────────────
Account Lockout Policy             [  ]     Set via net accounts
Password Policy                    [  ]     Enforce complexity + length
Windows Defender                   [  ]     Enable all protections
Firewall Enabled (All Profiles)    [  ]     Set-NetFirewallProfile
Remote Desktop Disabled            [  ]     Registry + GPO
SMBv1 Disabled                     [  ]     Disable-WindowsOptionalFeature
BitLocker Enabled                  [  ]     Enable for OS drive
Windows Update Automatic           [  ]     Group Policy
Audit Policies Configured          [  ]     auditpol
UAC Enabled                        [  ]     Registry
Screen Lock Timeout                [  ]     5 minutes
Guest Account Disabled             [  ]     Disable-LocalUser
```

### 6.2 CIS Linux Key Controls

```
CATEGORY                           STATUS   ACTION
────────────────────────────────────────────────────
Filesystem Hardening               [  ]     noexec on /tmp, /dev/shm
SSH Key-Only Auth                  [  ]     sshd_config
Root Login Disabled                [  ]     PermitRootLogin no
Firewall Active                    [  ]     ufw enable
Kernel Hardening (sysctl)          [  ]     /etc/sysctl.d/
Audit Logging                      [  ]     auditd configured
Password Quality                   [  ]     pam_pwquality
File Permissions                   [  ]     /etc/passwd 644, /etc/shadow 600
SUID/SGID Review                   [  ]     find / -perm /6000
Cron Restrictions                  [  ]     /etc/cron.allow
USB Storage Disabled               [  ]     blacklist usb-storage
Unattended Upgrades               [  ]     apt install unattended-upgrades
NTP Configured                     [  ]     systemd-timesyncd or chrony
```

### 6.3 Automated CIS Scan

```bash
# Using Lynis for CIS-style auditing
sudo apt install lynis

# Run full system audit
sudo lynis audit system

# Run specific checks
sudo lynis audit system --tests-from-group "firewalls"
sudo lynis audit system --tests-from-group "authentication"
sudo lynis audit system --tests-from-group "networking"

# Generate report
sudo lynis audit system --report-file /var/log/lynis-report.dat --log-file /var/log/lynis.log
```

---

## 7. Network Security

### 7.1 Port Exposure Audit

```bash
#!/bin/bash
# port-audit.sh — Check what's listening
echo "===== Open Ports ====="
ss -tlnp | grep LISTEN

echo -e "\n===== Expected Ports ====="
echo "22/2222  - SSH"
echo "80/443   - Nginx (HTTP/HTTPS)"
echo "3000     - Next.js"
echo "5432     - PostgreSQL"
echo "6379     - Redis"
echo "8000     - vLLM"
echo "9090     - Prometheus"
echo "3001     - Grafana"

echo -e "\n===== Unexpected Ports ====="
ss -tlnp | grep LISTEN | grep -v -E ":(22|2222|80|443|3000|5432|6379|8000|9090|3001) "
```

### 7.2 Fail2Ban Configuration

```bash
# Install fail2ban
sudo apt install fail2ban

# /etc/fail2ban/jail.local
cat << 'EOF' | sudo tee /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd
banaction = ufw

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## 8. Encryption at Rest

### 8.1 BitLocker (Windows)

```powershell
# Check BitLocker status
Get-BitLockerVolume

# Enable BitLocker on OS drive
Enable-BitLocker -MountPoint "C:" -EncryptionMethod XtsAes256 -RecoveryPasswordProtector

# Store recovery key securely
(Get-BitLockerVolume -MountPoint C:).KeyProtector | Where-Object { $_.KeyProtectorType -eq 'RecoveryPassword' } | Select-Object -ExpandProperty RecoveryPassword

# Enable for data drives
Enable-BitLocker -MountPoint "D:" -EncryptionMethod XtsAes256 -PasswordProtector
```

### 8.2 LUKS Encryption (Linux)

```bash
# Encrypt a partition
sudo cryptsetup luksFormat /dev/nvme0n1p3
sudo cryptsetup luksOpen /dev/nvme0n1p3 encrypted-data
sudo mkfs.ext4 /dev/mapper/encrypted-data
sudo mount /dev/mapper/encrypted-data /mnt/encrypted

# Auto-mount via /etc/crypttab (with keyfile)
# encrypted-data /dev/nvme0n1p3 /root/.keyfile luks
```

---

## 9. Hardening Verification Script

```bash
#!/bin/bash
# palace-hardening-check.sh — Verify all hardening measures
set -euo pipefail

PASS=0
FAIL=0
WARN=0

check() {
    local desc="$1"
    local result="$2"
    if [ "$result" = "PASS" ]; then
        echo "[PASS] $desc"
        PASS=$((PASS + 1))
    elif [ "$result" = "WARN" ]; then
        echo "[WARN] $desc"
        WARN=$((WARN + 1))
    else
        echo "[FAIL] $desc"
        FAIL=$((FAIL + 1))
    fi
}

echo "===== Palace Hardening Verification ====="

# SSH
check "SSH password auth disabled" "$(grep -c 'PasswordAuthentication no' /etc/ssh/sshd_config.d/hardening.conf > /dev/null 2>&1 && echo PASS || echo FAIL)"
check "SSH root login disabled" "$(grep -c 'PermitRootLogin no' /etc/ssh/sshd_config.d/hardening.conf > /dev/null 2>&1 && echo PASS || echo FAIL)"

# Firewall
check "UFW active" "$(sudo ufw status | grep -c 'Status: active' > /dev/null 2>&1 && echo PASS || echo FAIL)"

# Kernel
check "ASLR enabled" "$([ $(cat /proc/sys/kernel/randomize_va_space) -eq 2 ] && echo PASS || echo FAIL)"
check "SYN cookies enabled" "$([ $(cat /proc/sys/net/ipv4/tcp_syncookies) -eq 1 ] && echo PASS || echo FAIL)"
check "IP forwarding disabled" "$([ $(cat /proc/sys/net/ipv4/ip_forward) -eq 0 ] && echo PASS || echo FAIL)"

# Docker
check "Docker no-new-privileges" "$(grep -c 'no-new-privileges' /etc/docker/daemon.json > /dev/null 2>&1 && echo PASS || echo FAIL)"

# Audit
check "Auditd running" "$(systemctl is-active auditd > /dev/null 2>&1 && echo PASS || echo FAIL)"

# Fail2ban
check "Fail2ban running" "$(systemctl is-active fail2ban > /dev/null 2>&1 && echo PASS || echo FAIL)"

# Permissions
check "/etc/shadow permissions" "$([ $(stat -c %a /etc/shadow) = "640" ] && echo PASS || echo FAIL)"
check "/etc/passwd permissions" "$([ $(stat -c %a /etc/passwd) = "644" ] && echo PASS || echo FAIL)"

echo -e "\n===== Results ====="
echo "PASS: $PASS | WARN: $WARN | FAIL: $FAIL"
echo "Score: $((PASS * 100 / (PASS + FAIL + WARN)))%"
```

---

## 10. Hardening Schedule

```
Daily:
  - Review auth logs for failed logins
  - Check fail2ban banned IPs
  - Verify critical services running

Weekly:
  - Run port audit
  - Check for new CVEs on installed software
  - Review Docker container security
  - Run Lynis scan

Monthly:
  - Full CIS benchmark check
  - Update all packages
  - Rotate SSH keys (if policy requires)
  - Review firewall rules
  - Audit user accounts and permissions
  - Review and rotate service credentials

Quarterly:
  - Penetration test (use Kali tools)
  - Review and update hardening policies
  - Disaster recovery drill with security focus
```

---

*Chaos Infrastructure Seed — Batch 14. Every unlocked door is an invitation. Lock them all.*
