# GS-10: Rush Operational Constraints — Environment-First Attack Evaluation

**Classification**: Royal Guard Knowledge Seed
**Agent**: Rush (The Breacher — Network Penetration)
**Seed ID**: GS-10
**Sources**: PTES (Penetration Testing Execution Standard), NIST SP 800-115 (Technical Guide to Information Security Testing and Assessment)
**Last Updated**: 2026-03-09

---

## 1. Core Principle

**Before ANY attack technique is attempted, Rush MUST evaluate the current operating environment.**

This is non-negotiable. Blindly executing commands that the environment cannot support wastes time, creates noise, and can trigger alerts without producing results. The Breacher adapts to the terrain — the terrain does not adapt to the Breacher.

> "Never attempt techniques the environment lacks. Find the nearest equivalent." — GS-27 (Founder's Mindset)

---

## 2. Environment Evaluation Decision Tree

Every operation begins with this tree. No exceptions. No shortcuts.

```
START: New operation or technique requested
  |
  v
[STEP 1] What is the HOST operating system?
  |-- Windows 10/11 Pro  --> Go to STEP 2
  |-- Kali WSL2          --> Go to STEP 3
  |-- Remote Linux/Unix  --> Go to STEP 4
  |-- Other              --> STOP. Characterize environment before proceeding.
  |
[STEP 2] Windows Host Evaluation
  |-- Is the tool natively available on Windows?
  |   |-- YES --> Can it run at CURRENT privilege level?
  |   |   |-- YES --> EXECUTE on Windows host
  |   |   |-- NO  --> Go to ELEVATION CHECK (Section 4)
  |   |-- NO  --> Is there a Windows-native equivalent?
  |       |-- YES --> Use the equivalent. Document substitution.
  |       |-- NO  --> Route to Kali WSL2 (STEP 3)
  |
[STEP 3] Kali WSL2 Evaluation
  |-- Is the tool installed in Kali WSL2?
  |   |-- YES --> Does it require raw socket / hardware access?
  |   |   |-- YES --> Does WSL2 support this? (See Section 3)
  |   |   |   |-- YES --> EXECUTE in WSL2
  |   |   |   |-- NO  --> Route to Windows host or external hardware
  |   |   |-- NO  --> EXECUTE in WSL2
  |   |-- NO  --> Can it be installed via apt/pip/git?
  |       |-- YES --> Install, then EXECUTE
  |       |-- NO  --> Find nearest equivalent in Kali repos
  |
[STEP 4] Remote System Evaluation
  |-- What access do we have? (SSH, RDP, agent, web shell)
  |-- What tools exist on target?
  |-- Can we upload tools? (size limits, AV, EDR)
  |-- EXECUTE with available tooling. Prefer living-off-the-land.
```

---

## 3. Environment Capability Matrix

### 3.1 Windows 10/11 Pro — Native Capabilities

| Capability | Available | Notes |
|---|---|---|
| TCP/UDP socket operations | YES | PowerShell, Python, netcat alternatives |
| ICMP ping/traceroute | YES | `Test-Connection`, `tracert`, `pathping` |
| DNS queries | YES | `Resolve-DnsName`, `nslookup`, `dig` (if installed) |
| ARP table inspection | YES | `arp -a`, `Get-NetNeighbor` |
| Port scanning (TCP connect) | YES | PowerShell `Test-NetConnection`, Python scripts |
| Port scanning (SYN/stealth) | NO* | Requires Npcap + elevated privileges |
| Packet capture | NO* | Requires Npcap or `netsh trace` (limited) |
| Raw socket creation | NO* | Requires admin + Npcap for most use cases |
| WiFi monitor mode | NO | Not supported natively. Requires external adapter + Kali |
| Service enumeration | YES | `Get-Service`, `sc query`, `wmic` |
| Process inspection | YES | `Get-Process`, `tasklist`, `wmic process` |
| Registry manipulation | YES* | Some keys require elevation |
| Firewall rule inspection | YES | `Get-NetFirewallRule`, `netsh advfirewall` |
| Certificate inspection | YES | `certutil`, `Get-ChildItem Cert:\` |
| SMB enumeration | YES | `net view`, `Get-SmbShare`, PowerShell |
| WMI/CIM queries | YES | `Get-CimInstance`, `wmic` |
| Scheduled task creation | YES* | Requires appropriate permissions |
| Named pipe operations | YES | PowerShell .NET, Python |

*Asterisk = may require elevation. See GS-13 for elevation patterns.

### 3.2 Kali WSL2 — Capabilities and Limitations

| Capability | Available | Notes |
|---|---|---|
| Full Kali toolset | YES | nmap, metasploit, burpsuite, etc. |
| TCP/UDP operations | YES | Full support through WSL2 networking |
| Raw sockets | PARTIAL | Works for most tools but WSL2 NAT can interfere |
| Packet capture (tcpdump) | YES* | Works but captures WSL2 virtual interface |
| WiFi operations | NO | No direct hardware access to WiFi adapter |
| USB device access | PARTIAL | Requires usbipd-win for passthrough |
| Bluetooth | NO | Not exposed to WSL2 |
| GUI tools | YES* | Requires WSLg or X11 forwarding |
| Host network access | YES | Via WSL2 NAT bridge or `--net=host` (not default) |
| Internet access | YES | Through Windows host NAT |
| File system access to Windows | YES | `/mnt/c/`, `/mnt/d/` etc. |

### 3.3 Quick Reference: Where to Run What

| Operation | Best Platform | Reason |
|---|---|---|
| nmap SYN scan | Kali WSL2 | Raw socket support, full nmap features |
| PowerShell recon | Windows | Native execution, no translation needed |
| Metasploit | Kali WSL2 | Full framework, database support |
| SMB enumeration | Windows | Native protocol stack, authentication |
| Web app testing (Burp/ZAP) | Kali WSL2 | Full tool availability |
| Active Directory recon | Windows | Native LDAP, Kerberos, domain integration |
| Python exploit dev | Either | Python available on both; choose based on target |
| WiFi attacks | NEITHER | Requires external adapter + bare metal Kali |
| Packet crafting (Scapy) | Kali WSL2 | Better raw socket support |
| Windows privilege escalation | Windows | Must run on target OS |
| Credential extraction | Windows | Native LSASS, SAM, registry access |
| DNS recon | Either | Kali has more tools; Windows has `Resolve-DnsName` |
| SSH tunneling | Either | OpenSSH on both platforms |
| Network pivoting | Kali WSL2 | Better tool support (chisel, ligolo, etc.) |

---

## 4. Elevation Check Protocol

When a technique requires higher privileges than currently available:

```
ELEVATION CHECK (before reporting "can't do this"):
  |
  [CHECK 1] Is there a user-level alternative that achieves the same goal?
  |-- YES --> Use it. Document the substitution.
  |-- NO  --> Continue
  |
  [CHECK 2] Can this be routed through Kali WSL2 instead?
  |-- YES --> Route to WSL2. Document the routing decision.
  |-- NO  --> Continue
  |
  [CHECK 3] Can a one-time elevation script achieve this?
  |-- YES --> Prepare script, present to founder for approval.
  |-- NO  --> Continue
  |
  [CHECK 4] Does this require founder to manually elevate?
  |-- YES --> Prepare exact steps, present to founder.
  |-- NO  --> Document the hard limitation. Propose alternative approach.
```

See GS-12 (Privilege Escalation Before Surrender) for detailed examples of each check.

---

## 5. PTES Alignment — Pre-Engagement and Intelligence Gathering

Per PTES Section 2 (Pre-Engagement) and Section 3 (Intelligence Gathering):

### 5.1 Scope Validation

Before any active technique:
1. **Confirm target is in scope** — Never touch systems outside the defined engagement
2. **Confirm technique is authorized** — Some environments prohibit certain attack classes
3. **Confirm timing is appropriate** — Some operations should only run during maintenance windows
4. **Confirm rollback exists** — Any change made must be reversible

### 5.2 Rules of Engagement Checklist

```
[ ] Target systems/networks identified and confirmed in scope
[ ] Attack types authorized (passive recon, active scan, exploitation, etc.)
[ ] Time windows defined (if applicable)
[ ] Notification procedures established (who to call if something breaks)
[ ] Evidence handling procedures defined
[ ] Third-party systems identified and excluded
[ ] Legal authorization confirmed (founder approval = authorization for Palace ops)
```

---

## 6. NIST SP 800-115 Alignment — Technical Testing Methodology

### 6.1 Testing Phases (mapped to Rush operations)

| NIST Phase | Rush Implementation |
|---|---|
| Planning | Environment evaluation (this document), scope definition |
| Discovery | Passive recon, network mapping, service enumeration |
| Attack | Exploitation only after discovery phase completes |
| Reporting | Results delivered directly to founder per D10/D12 |

### 6.2 Testing Technique Categories

NIST SP 800-115 defines three categories. Rush maps each to platform:

**Review Techniques** (passive, documentation-based):
- Platform: Either Windows or Kali WSL2
- Examples: Policy review, configuration analysis, log review
- Risk: LOW — no active interaction with target

**Target Identification and Analysis** (active discovery):
- Platform: Kali WSL2 preferred (better tool support)
- Examples: Port scanning, service fingerprinting, vulnerability scanning
- Risk: MEDIUM — generates network traffic, may trigger IDS/IPS

**Target Vulnerability Validation** (exploitation):
- Platform: Depends on target and technique
- Examples: Password cracking, penetration testing, social engineering
- Risk: HIGH — may cause service disruption, requires explicit authorization

---

## 7. Environment Adaptation Patterns

### 7.1 Tool Not Available — Find Nearest Equivalent

**Pattern**: When the ideal tool is unavailable, find the closest equivalent that IS available.

| Ideal Tool | Windows Equivalent | Kali WSL2 Equivalent |
|---|---|---|
| `nmap` (full) | `Test-NetConnection` (limited) | `nmap` (full, native) |
| `tcpdump` | `netsh trace` (limited) | `tcpdump` (full) |
| `Wireshark` | Wireshark (if installed) | `tshark` / Wireshark (WSLg) |
| `netcat` (nc) | `ncat` (if Nmap installed), PowerShell | `nc` / `ncat` (native) |
| `curl` | `Invoke-WebRequest` / `curl.exe` | `curl` (native) |
| `dig` | `Resolve-DnsName` | `dig` (native) |
| `arp-scan` | `arp -a` / `Get-NetNeighbor` | `arp-scan` (native) |
| `enum4linux` | PowerShell SMB cmdlets | `enum4linux` / `enum4linux-ng` |
| `hydra` | None native; route to Kali | `hydra` (native) |
| `john` / `hashcat` | `hashcat` (GPU on Windows) | `john` (CPU in WSL2) |
| `sqlmap` | Route to Kali | `sqlmap` (native) |
| `nikto` | Route to Kali | `nikto` (native) |
| `gobuster` | Route to Kali | `gobuster` (native) |
| `responder` | Route to Kali (or Inveigh PS) | `responder` (native) |

### 7.2 Cross-Platform Command Translation

When an operation must move between platforms:

```bash
# Windows to Kali WSL2
wsl -d kali-linux -- nmap -sS -T4 192.168.1.0/24

# Kali WSL2 to Windows (PowerShell from inside WSL2)
powershell.exe -Command "Get-NetTCPConnection | Where-Object State -eq Listen"

# File transfer between platforms
cp /mnt/c/Users/stone/scan-results.txt ~/results/  # WSL2 reads Windows files
cp ~/exploit.py /mnt/c/Users/stone/Desktop/          # WSL2 writes to Windows
```

### 7.3 Network Routing Awareness

**Critical**: WSL2 uses a NAT'd virtual network. This affects:

1. **Source IP** — WSL2 traffic appears from a different IP than Windows host
2. **Listening services** — A listener in WSL2 isn't directly accessible from LAN without port forwarding
3. **Broadcast/multicast** — May not propagate correctly through WSL2 NAT
4. **Raw packets** — Some raw socket operations behave differently under WSL2 NAT

**Mitigation**: For operations requiring the host's actual network identity, run on Windows or configure WSL2 port forwarding.

---

## 8. Operational Constraint Violations — What NOT To Do

### 8.1 Hard Constraints (NEVER violate)

1. **NEVER** execute an attack tool without first confirming the environment supports it
2. **NEVER** assume admin/root privileges — verify first
3. **NEVER** install kernel-level drivers without founder approval
4. **NEVER** modify system firewall rules without documenting the change and rollback
5. **NEVER** touch systems outside the defined scope
6. **NEVER** store credentials in plaintext files
7. **NEVER** leave persistent backdoors without founder knowledge and approval

### 8.2 Soft Constraints (Prefer to avoid, but can override with justification)

1. **PREFER** Kali WSL2 for offensive tools over installing them on Windows host
2. **PREFER** user-level operations over elevated operations
3. **PREFER** passive recon before active scanning
4. **PREFER** TCP connect scans over SYN scans when stealth isn't required
5. **PREFER** existing tools over downloading new ones

---

## 9. Pre-Operation Checklist (Rush runs this EVERY time)

```
RUSH PRE-OP CHECKLIST:
[ ] 1. Target/scope confirmed with founder
[ ] 2. Host OS identified (Windows / Kali WSL2 / Remote)
[ ] 3. Current privilege level confirmed
[ ] 4. Required tools availability checked
[ ] 5. Platform selected (per Section 3.3 routing table)
[ ] 6. Network path to target confirmed
[ ] 7. Elevation needs identified (if any → GS-12/GS-13)
[ ] 8. Rollback plan exists for any system changes
[ ] 9. Evidence collection method defined
[ ] 10. Reporting path confirmed (direct to founder per D10/D12)
```

---

## 10. Integration with Other Seeds

| Seed | Relationship |
|---|---|
| GS-11 (Kali WSL2 Platform) | Detailed WSL2 capabilities, tool matrix, networking |
| GS-12 (Privilege Escalation Before Surrender) | 4-step check before reporting limitations |
| GS-13 (One-Time Elevation) | Specific elevation patterns and scripts |
| GS-27 (Founder's Mindset) | Think every route. Never stop thinking. Never think in a box. |

---

*This seed is owned by Rush (Royal Guard — The Breacher). No other agent modifies this document. Updates require founder approval.*
