# Incident Response & Digital Forensics
# Seed: SEC-5 | Category: Cybersecurity | Topic: DFIR
# RAG Tags: dfir, incident-response, memory-forensics, volatility, disk-forensics, timeline, evidence-preservation, post-incident

---

## Purpose
Complete DFIR (Digital Forensics and Incident Response) methodology. Memory forensics
with Volatility, disk forensics, timeline reconstruction, containment strategies,
evidence preservation, chain of custody, and post-incident review templates.
Every agent involved in security incidents must follow these procedures.

---

## 1. Incident Response Framework

### NIST Incident Response Lifecycle
```
Phase 1: PREPARATION
  → Before incidents happen
  → Policies, procedures, tools, training, communication plans

Phase 2: DETECTION & ANALYSIS
  → Identify that an incident occurred
  → Determine scope, impact, and severity
  → Collect initial indicators of compromise (IOCs)

Phase 3: CONTAINMENT, ERADICATION & RECOVERY
  → Stop the bleeding (contain)
  → Remove the threat (eradicate)
  → Restore normal operations (recover)

Phase 4: POST-INCIDENT ACTIVITY
  → Lessons learned
  → Process improvements
  → Evidence archival
  → Report generation
```

### Severity Classification
```
SEV-1 (CRITICAL):
  - Active data breach (customer data exfiltrated)
  - Complete service outage
  - Ransomware deployment
  - Compromised admin/root credentials
  - Active attacker in the environment
  Response time: IMMEDIATE (< 15 minutes)
  Communication: Founder + Legal + All hands

SEV-2 (HIGH):
  - Suspected breach (indicators but not confirmed)
  - Partial service degradation affecting >50% users
  - Compromised non-admin credentials
  - Malware detected on production system
  - Unauthorized access to sensitive data
  Response time: < 1 hour
  Communication: Founder + Security team

SEV-3 (MEDIUM):
  - Suspicious activity requiring investigation
  - Vulnerability exploited but no data access confirmed
  - Failed attack attempt with sophisticated indicators
  - Policy violation detected
  Response time: < 4 hours
  Communication: Security team

SEV-4 (LOW):
  - Routine security alerts
  - Failed brute force attempts (low volume)
  - Non-critical vulnerability discovered
  - Informational security events
  Response time: Next business day
  Communication: Security log
```

---

## 2. Detection & Initial Response

### Initial Response Checklist
```
FIRST 15 MINUTES:
  □ DOCUMENT the time of detection and who detected it
  □ DO NOT power off affected systems (preserves volatile evidence)
  □ DO NOT log into affected systems as root/admin (alters evidence)
  □ DO NOT run antivirus scans yet (can destroy forensic artifacts)
  □ ISOLATE the affected system from the network (but keep powered on)
  □ NOTIFY the incident commander
  □ START the incident timeline document

  Isolation methods (in order of preference):
    1. Network isolation: Remove from VLAN, disable switch port
    2. Firewall rules: Block all traffic to/from affected IP
    3. Security group: Restrict to forensics-only access
    4. Physical: Unplug network cable (last resort)

FIRST HOUR:
  □ Assess scope: How many systems affected?
  □ Identify attack vector: How did attacker get in?
  □ Collect volatile evidence (see Section 3)
  □ Check for lateral movement
  □ Begin IOC (Indicator of Compromise) collection
  □ Determine if data exfiltration occurred
  □ Decide on containment strategy
```

### IOC Collection
```
Network IOCs:
  - Suspicious IP addresses (check against threat intel feeds)
  - Unusual DNS queries (DGA domains, tunneling)
  - Connections to known C2 (Command & Control) servers
  - Large data transfers to external IPs
  - Beaconing patterns (regular interval connections)

Host IOCs:
  - Suspicious processes (unusual names, high CPU/memory)
  - Modified system files (timestamps, hashes)
  - New user accounts or privilege escalation
  - Scheduled tasks / cron jobs added
  - Registry modifications (Windows)
  - Unusual network connections from processes
  - Modified log files (gaps, truncation)

Application IOCs:
  - Failed login attempts (credential stuffing)
  - SQL injection patterns in logs
  - Unusual API call patterns
  - Authorization bypass attempts
  - Modified application files (webshells)
```

---

## 3. Memory Forensics

### Why Memory Forensics?
```
Memory contains evidence that doesn't exist on disk:
  - Running processes (including injected malware)
  - Network connections (active and recent)
  - Encryption keys (in cleartext in RAM)
  - Clipboard contents
  - Command history
  - Passwords and credentials
  - Registry hives (Windows)
  - Injected code (fileless malware)

Critical rule: MEMORY IS VOLATILE
  If you reboot, all memory evidence is lost forever.
  Capture memory BEFORE any other forensic action.
```

### Memory Acquisition
```bash
# Windows — WinPMEM (recommended)
winpmem_mini_x64.exe memdump.raw

# Windows — FTK Imager (GUI tool)
# AccessData FTK Imager → File → Capture Memory

# Linux — LiME (Linux Memory Extractor)
sudo insmod lime.ko "path=/tmp/memdump.lime format=lime"

# Linux — /proc/kcore (less reliable)
sudo dd if=/proc/kcore of=/tmp/memdump.raw bs=1M

# macOS — osxpmem
sudo ./osxpmem.app/osxpmem -o memdump.raw

# Remote acquisition (via SSH)
ssh target-host 'dd if=/dev/mem bs=1M 2>/dev/null' > memdump.raw

# Cloud instances:
# AWS: Create snapshot, mount on forensics instance
# GCP: Create machine image, extract memory if hibernation enabled
# Azure: Create snapshot, use forensics VM

# IMPORTANT: Write dump to EXTERNAL media or network share
# Never write to the system being investigated (destroys evidence)
```

### Volatility 3 Analysis
```bash
# Install Volatility 3
pip install volatility3

# Identify OS profile
vol -f memdump.raw banners.Banners

# Windows Analysis
# List running processes
vol -f memdump.raw windows.pslist.PsList
vol -f memdump.raw windows.pstree.PsTree    # Tree view (parent-child)

# Find hidden processes (rootkit detection)
vol -f memdump.raw windows.psscan.PsScan     # Scans for EPROCESS structures

# Compare pslist vs psscan — hidden processes show in psscan but not pslist

# Network connections
vol -f memdump.raw windows.netscan.NetScan

# DLL list per process (find injected DLLs)
vol -f memdump.raw windows.dlllist.DllList --pid 1234

# Detect code injection
vol -f memdump.raw windows.malfind.Malfind   # Finds injected code in process memory
# Look for: PAGE_EXECUTE_READWRITE memory regions with MZ headers

# Command history
vol -f memdump.raw windows.cmdline.CmdLine   # Command line arguments
vol -f memdump.raw windows.consoles.Consoles  # Console input/output history

# Registry analysis
vol -f memdump.raw windows.registry.hivelist.HiveList
vol -f memdump.raw windows.registry.printkey.PrintKey --key "Software\Microsoft\Windows\CurrentVersion\Run"

# Extract files from memory
vol -f memdump.raw windows.dumpfiles.DumpFiles --pid 1234 --dump-dir ./extracted/

# Detect rootkits
vol -f memdump.raw windows.ssdt.SSDT         # System Service Descriptor Table hooks
vol -f memdump.raw windows.callbacks.Callbacks # Kernel callbacks

# Linux Analysis
vol -f memdump.raw linux.pslist.PsList
vol -f memdump.raw linux.bash.Bash            # Bash history from memory
vol -f memdump.raw linux.check_idt.Check_idt  # Check interrupt descriptor table
vol -f memdump.raw linux.check_syscall.Check_syscall  # Detect syscall hooks
```

### Memory Forensics Cheatsheet
```
TRIAGE ORDER (most to least volatile):
  1. Network connections (netscan)     — Who is the system talking to RIGHT NOW?
  2. Running processes (pslist/pstree) — What's running?
  3. Hidden processes (psscan/malfind) — What's hiding?
  4. Command history (cmdline/bash)    — What commands were run?
  5. Loaded modules/DLLs (dlllist)     — What code is loaded?
  6. Registry (hivelist/printkey)      — What persistence mechanisms exist?
  7. File extraction (dumpfiles)       — Extract suspicious binaries for analysis

RED FLAGS:
  - Process name is common but PID/PPID is wrong
    (svchost.exe not parented by services.exe = suspicious)
  - Process with PAGE_EXECUTE_READWRITE and MZ header (code injection)
  - Connection to known-bad IP/domain
  - Process running from unusual directory (%TEMP%, %APPDATA%)
  - cmd.exe or powershell.exe spawned by unusual parent
  - Process with no associated binary on disk (fileless malware)
```

---

## 4. Disk Forensics

### Evidence Acquisition
```bash
# GOLDEN RULE: NEVER modify the original evidence
# Always work on a COPY (forensic image)

# Create forensic disk image (bit-for-bit copy)
# Linux: dd or dc3dd (enhanced dd with hashing)
dc3dd if=/dev/sda of=/evidence/disk.dd hash=sha256 log=/evidence/acquisition.log

# FTK Imager (Windows GUI — most common in practice)
# Creates E01 (Expert Witness Format) — compressed, split, hashed

# Verify integrity
sha256sum /evidence/disk.dd > /evidence/disk.dd.sha256
# Compare hash at every step of the chain of custody

# Mount forensic image (read-only)
mkdir /mnt/evidence
mount -o ro,noexec,nosuid /evidence/disk.dd /mnt/evidence

# For E01 format, use ewfmount:
ewfmount /evidence/disk.E01 /mnt/ewf
mount -o ro /mnt/ewf/ewf1 /mnt/evidence
```

### Key Forensic Artifacts (Windows)
```
FILE SYSTEM ARTIFACTS:
  $MFT (Master File Table):       Every file ever on the NTFS volume
  $LogFile:                        NTFS transaction log
  $UsnJrnl:                        Change journal (file modifications)
  Prefetch (C:\Windows\Prefetch):  Programs that have been executed
  Amcache.hve:                     Program execution history
  ShimCache (AppCompatCache):      Programs that have been run

REGISTRY ARTIFACTS:
  NTUSER.DAT:                      User-specific settings
  SAM:                             User accounts and password hashes
  SYSTEM:                          System configuration, services
  SOFTWARE:                        Installed software, autorun
  Run/RunOnce keys:                Persistence mechanisms
  UserAssist:                      Programs run from Explorer (ROT13 encoded)
  RecentDocs:                      Recently accessed documents
  TypedPaths/TypedURLs:            Explorer and IE typed paths

LOG ARTIFACTS:
  Security.evtx:                   Login/logout, privilege use
  System.evtx:                     Service start/stop, driver load
  Application.evtx:                Application errors and events
  PowerShell/Operational.evtx:     PowerShell execution logs
  Sysmon (if installed):           Detailed process/network/file monitoring

BROWSER ARTIFACTS:
  Chrome/Edge:  History, Downloads, Cookies, Login Data (SQLite)
  Firefox:      places.sqlite, cookies.sqlite, logins.json
  Location:     %APPDATA%\Local\Google\Chrome\User Data\Default\
```

### Key Forensic Artifacts (Linux)
```
SYSTEM LOGS:
  /var/log/auth.log:       Authentication events (SSH, sudo)
  /var/log/syslog:         General system events
  /var/log/kern.log:       Kernel events
  /var/log/secure:         Security events (RHEL/CentOS)
  /var/log/audit/audit.log: Auditd events (if configured)
  /var/log/wtmp:           Login records (use 'last' to read)
  /var/log/btmp:           Failed login records (use 'lastb')

USER ARTIFACTS:
  ~/.bash_history:         Command history
  ~/.ssh/known_hosts:      SSH connections made
  ~/.ssh/authorized_keys:  SSH keys authorized for login
  ~/.local/share/recently-used.xbel: Recent files
  /tmp/:                   Temporary files (often used by attackers)

PERSISTENCE MECHANISMS:
  /etc/crontab:            System cron jobs
  /var/spool/cron/:        User cron jobs
  /etc/systemd/system/:    Systemd service files
  /etc/init.d/:            Init scripts
  /etc/rc.local:           Startup script
  ~/.bashrc, ~/.profile:   Shell startup scripts (can contain malicious commands)
```

---

## 5. Timeline Reconstruction

### Building the Timeline
```
A forensic timeline combines events from ALL sources into chronological order:
  - File system timestamps (MACB: Modified, Accessed, Changed, Born)
  - Event logs
  - Memory artifacts
  - Network logs
  - Application logs
  - Database audit logs

Tools:
  - Plaso/log2timeline: Automated timeline generation from disk images
  - Timeline Explorer: Eric Zimmerman's GUI timeline viewer
  - KAPE: Automated artifact collection
```

### Plaso Timeline Generation
```bash
# Extract all timeline artifacts from disk image
log2timeline.py /evidence/timeline.plaso /evidence/disk.dd

# Filter and export to CSV
psort.py /evidence/timeline.plaso -o l2tcsv -w /evidence/timeline.csv \
  "date > '2026-03-01' AND date < '2026-03-11'"

# Output columns: datetime, timestamp_desc, source, source_long, message, filename, ...

# Example timeline entries:
# 2026-03-09 14:23:01, File Created, FILE, NTFS $MFT, C:\Users\admin\Desktop\payload.exe
# 2026-03-09 14:23:05, Process Created, EVT, Security.evtx, New process: payload.exe PID:4532
# 2026-03-09 14:23:07, Network Connection, EVT, Sysmon, payload.exe connected to 185.x.x.x:443
# 2026-03-09 14:23:15, File Created, FILE, NTFS $MFT, C:\Windows\Temp\dump.zip
# 2026-03-09 14:25:30, Network Transfer, NET, Firewall, 50MB outbound to 185.x.x.x
```

### Timeline Analysis Methodology
```
Step 1: ANCHOR POINTS
  Identify known good timestamps:
  - First alert/detection time
  - Last known good state
  - User-reported events

Step 2: WORK BACKWARDS FROM DETECTION
  From the alert, trace backwards:
  - What process triggered the alert?
  - How was that process created?
  - What user account was used?
  - What network activity preceded it?

Step 3: IDENTIFY INITIAL ACCESS
  Look for:
  - First appearance of malicious file
  - First connection to C2 server
  - First unauthorized login
  - Phishing email delivery timestamp

Step 4: MAP LATERAL MOVEMENT
  After initial access, trace:
  - Which other systems were accessed?
  - What credentials were used?
  - What tools were deployed?
  - What data was accessed?

Step 5: DETERMINE DATA EXFILTRATION
  - Unusual outbound data transfers
  - Files staged for exfiltration
  - Compressed/encrypted archives created
  - Cloud storage uploads
```

---

## 6. Containment Strategies

### Containment Decision Matrix
```
Scenario                      | Strategy              | Risk
------------------------------|----------------------|------------------
Active data exfiltration      | Immediate isolation   | Attacker knows you know
Malware spreading laterally   | Network segmentation  | May miss some systems
Compromised credentials       | Credential reset      | Service disruption
Web shell on server           | Block network + patch  | Downtime
Insider threat (active)       | Covert monitoring     | Legal considerations
Ransomware (pre-encryption)   | Immediate isolation   | Partial encryption
Ransomware (post-encryption)  | Isolate + assess      | Data already encrypted

CONTAINMENT PRINCIPLES:
  1. Contain FAST — every minute an attacker has access, damage increases
  2. Preserve evidence — don't destroy forensic artifacts during containment
  3. Coordinate — containment actions should be simultaneous across all affected systems
  4. Document — every containment action logged with timestamp and justification
```

### Cloud-Specific Containment
```bash
# AWS: Isolate compromised EC2 instance
# 1. Create forensic security group (no inbound, no outbound)
aws ec2 create-security-group \
  --group-name forensic-isolation \
  --description "Forensic isolation - no traffic" \
  --vpc-id vpc-xxx

# 2. Remove all rules (default SG has no inbound but allows all outbound)
aws ec2 revoke-security-group-egress \
  --group-id sg-forensic \
  --ip-permissions '[{"IpProtocol": "-1", "FromPort": -1, "ToPort": -1, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}]'

# 3. Apply forensic SG to compromised instance
aws ec2 modify-instance-attribute \
  --instance-id i-compromised \
  --groups sg-forensic

# 4. Create snapshot for forensic analysis
aws ec2 create-snapshot --volume-id vol-xxx --description "Forensic - incident 2026-03-10"

# 5. Create memory dump (if available)
# Use SSM to run memory acquisition tool before isolation

# 6. Tag instance
aws ec2 create-tags --resources i-compromised \
  --tags Key=Incident,Value=INC-2026-0310 Key=Status,Value=Isolated

# NEVER terminate the instance — you need it for forensics
# NEVER modify the instance — preserve evidence
```

---

## 7. Evidence Preservation & Chain of Custody

### Chain of Custody Document
```
EVIDENCE CHAIN OF CUSTODY FORM

Case Number: INC-2026-0310
Evidence Item: Memory dump from server prod-api-01
Description: RAM dump acquired via WinPMEM, 32GB raw format

SHA-256 Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

Acquisition Details:
  Date/Time:    2026-03-10 14:35:00 UTC
  Acquired by:  [Name]
  Tool used:    WinPMEM 4.0
  Method:       Live acquisition, written to external USB drive
  Write blocker: Yes (Tableau T35u)

Chain of Custody:
  Date/Time          | Action           | From          | To            | Notes
  -------------------|------------------|---------------|---------------|--------
  2026-03-10 14:35   | Created          | —             | [Analyst]     | Original acquisition
  2026-03-10 15:00   | Verified hash    | —             | —             | Hash matches
  2026-03-10 15:30   | Copied to        | [Analyst]     | Evidence Locker| Working copy created
  2026-03-10 16:00   | Analysis started | Evidence Locker| [Analyst]    | Working copy only

  Hash verified at each transfer: ☑

Storage:
  Original: Evidence locker, Room 203, encrypted drive
  Working copy: Forensic workstation DFIR-01
  Backup: Cloud evidence storage (encrypted, access-logged)
```

### Evidence Handling Rules
```
1. NEVER modify original evidence
   - Work on copies only
   - Verify hash before and after analysis

2. WRITE-PROTECT original media
   - Use hardware write blockers for disk evidence
   - Mount forensic images read-only

3. DOCUMENT EVERYTHING
   - Every action taken on evidence
   - Every tool used and version
   - Every person who handles evidence
   - Every location evidence is stored

4. SECURE STORAGE
   - Encrypted storage
   - Access logging
   - Physical security (locked room/safe)
   - Tamper-evident packaging

5. TIME SYNCHRONIZATION
   - Note timezone of all evidence
   - Convert to UTC for timeline
   - Document clock skew if known
```

---

## 8. Post-Incident Review Template

```markdown
# Post-Incident Review: [Incident Title]

## Metadata
- **Incident ID**: INC-2026-0310
- **Severity**: SEV-[1/2/3/4]
- **Detection time**: YYYY-MM-DD HH:MM UTC
- **Resolution time**: YYYY-MM-DD HH:MM UTC
- **Duration**: X hours Y minutes
- **Impact**: [What was affected, how many users, data involved]
- **Review date**: YYYY-MM-DD
- **Participants**: [Names of review participants]

## Executive Summary
[2-3 sentences describing what happened, impact, and resolution]

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | First indicator detected |
| HH:MM | Incident declared |
| HH:MM | Containment action taken |
| HH:MM | Root cause identified |
| HH:MM | Remediation started |
| HH:MM | Service restored |
| HH:MM | Incident closed |

## Root Cause Analysis
### What happened?
[Detailed technical description]

### Why did it happen?
[Root cause, not just proximate cause — use 5 Whys]

### Why wasn't it detected sooner?
[Gaps in detection, monitoring, alerting]

## Impact Assessment
- **Users affected**: [Number, percentage]
- **Data exposed**: [Types, volume]
- **Financial impact**: [Estimated cost]
- **Regulatory implications**: [GDPR, HIPAA, etc.]
- **Reputation impact**: [Customer trust, media]

## What Went Well
- [Things that worked during response]
- [Effective processes, tools, people]

## What Didn't Go Well
- [Things that failed or were missing]
- [Delays, confusion, gaps]

## Action Items
| # | Action | Owner | Priority | Due Date | Status |
|---|--------|-------|----------|----------|--------|
| 1 | [Specific remediation action] | [Name] | P1 | YYYY-MM-DD | Open |
| 2 | [Detection improvement] | [Name] | P2 | YYYY-MM-DD | Open |
| 3 | [Process improvement] | [Name] | P2 | YYYY-MM-DD | Open |

## Lessons Learned
1. [Key takeaway with specific recommendation]
2. [Key takeaway with specific recommendation]
3. [Key takeaway with specific recommendation]

## Appendix
- [Link to evidence]
- [Link to communication logs]
- [Link to forensic report]
```

---

## 9. Incident Response Toolkit

### Essential Tools
```
MEMORY ACQUISITION:
  - WinPMEM (Windows)
  - LiME (Linux)
  - osxpmem (macOS)

MEMORY ANALYSIS:
  - Volatility 3 (open source, Python)
  - Rekall (Google, alternative to Volatility)

DISK FORENSICS:
  - Autopsy (open source, GUI)
  - Sleuthkit (CLI tools)
  - FTK Imager (free, acquisition)
  - X-Ways Forensics (commercial, powerful)

TIMELINE:
  - Plaso/log2timeline (automated timeline)
  - Timeline Explorer (GUI viewer)
  - KAPE (artifact collection)

NETWORK FORENSICS:
  - Wireshark (packet analysis)
  - tcpdump (CLI packet capture)
  - NetworkMiner (network forensics)
  - Zeek/Bro (network security monitoring)

MALWARE ANALYSIS:
  - YARA rules (pattern matching)
  - VirusTotal (multi-engine scanning)
  - ANY.RUN (interactive sandbox)
  - Cuckoo Sandbox (automated analysis)

THREAT INTELLIGENCE:
  - MISP (Threat Intelligence Platform)
  - AlienVault OTX (Open Threat Exchange)
  - VirusTotal Intelligence
  - Shodan (internet-connected device search)
```

### Go-Bag Script (Pre-incident Preparation)
```bash
#!/bin/bash
# incident-go-bag.sh — Prepare forensic toolkit
# Run periodically to keep tools updated

FORENSICS_DIR="/opt/forensics"
mkdir -p "$FORENSICS_DIR"/{tools,evidence,scripts}

# Download latest tools
echo "Downloading forensic tools..."
pip install volatility3 --upgrade
pip install plaso --upgrade

# Verify tool versions
echo "Tool versions:"
vol --version
log2timeline.py --version

# Pre-build Volatility symbol tables
echo "Building symbol tables..."
vol -f /dev/null windows.info 2>/dev/null  # Triggers symbol download

# Create evidence collection script
cat > "$FORENSICS_DIR/scripts/collect-linux.sh" << 'SCRIPT'
#!/bin/bash
# Run on compromised Linux system to collect volatile evidence
OUTDIR="/tmp/evidence-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTDIR"

date -u > "$OUTDIR/collection-time.txt"
uname -a > "$OUTDIR/system-info.txt"
ps auxf > "$OUTDIR/processes.txt"
netstat -tulpn > "$OUTDIR/network-connections.txt"
ss -tupan > "$OUTDIR/socket-stats.txt"
last -a > "$OUTDIR/login-history.txt"
lastb -a > "$OUTDIR/failed-logins.txt" 2>/dev/null
cat /etc/passwd > "$OUTDIR/passwd.txt"
crontab -l > "$OUTDIR/crontab-root.txt" 2>/dev/null
find /tmp -type f -mtime -7 -ls > "$OUTDIR/recent-tmp-files.txt"
find / -name "*.sh" -mtime -7 -ls > "$OUTDIR/recent-scripts.txt" 2>/dev/null
iptables -L -n -v > "$OUTDIR/firewall-rules.txt" 2>/dev/null
cat /var/log/auth.log > "$OUTDIR/auth-log.txt" 2>/dev/null

echo "Evidence collected in $OUTDIR"
sha256sum "$OUTDIR"/* > "$OUTDIR/hashes.txt"
SCRIPT
chmod +x "$FORENSICS_DIR/scripts/collect-linux.sh"

echo "Go-bag ready at $FORENSICS_DIR"
```

---

*This seed is maintained by the Security team. Last validated: 2026-03.*
