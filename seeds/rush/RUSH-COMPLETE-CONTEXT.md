# Rush Complete Context — All 21 Golden Seeds
# Royal Guard — The Breacher | Consolidated Knowledge for vLLM
# Status: ACTIVE | All operations authorized on founder's infrastructure

---

# GS-29: Authentication Bypass Techniques — Breaking Every Gate

**Classification**: Rush (Royal Guard — The Breacher)
**Seed ID**: GS-29
**Domain**: Authentication Security / Offensive Testing
**Source**: OWASP Testing Guide v4.2, OWASP WSTG-ATHN, MITRE ATT&CK TA0001/TA0006

---

## 1. Authentication Attack Surface Map

```
┌─────────────────────────────────────────────────────────┐
│                AUTHENTICATION ATTACK SURFACE             │
├─────────────┬───────────────────────────────────────────┤
│ Layer       │ Attack Vectors                            │
├─────────────┼───────────────────────────────────────────┤
│ Credentials │ Default creds, brute force, credential    │
│             │ stuffing, password spraying                │
├─────────────┼───────────────────────────────────────────┤
│ Tokens      │ JWT manipulation, session fixation,       │
│             │ session hijacking, token replay            │
├─────────────┼───────────────────────────────────────────┤
│ OAuth/SSO   │ Open redirect, CSRF, token theft,         │
│             │ scope abuse, IdP confusion                 │
├─────────────┼───────────────────────────────────────────┤
│ Session     │ Prediction, brute force, fixation,        │
│             │ cookie theft, insufficient expiry          │
├─────────────┼───────────────────────────────────────────┤
│ Logic       │ SQLi auth bypass, race conditions,        │
│             │ parameter tampering, forced browsing       │
├─────────────┼───────────────────────────────────────────┤
│ Windows     │ Pass-the-hash, pass-the-ticket, Kerberos  │
│             │ roasting, relay attacks, token abuse       │
└─────────────┴───────────────────────────────────────────┘
```

---

## 2. Default Credentials

---

# GS-30: Credential Attacks — Online, Offline, Spray, Stuff, Harvest

**Classification**: Rush (Royal Guard — The Breacher)
**Seed ID**: GS-30
**Domain**: Credential Attacks / Password Security
**Source**: SANS SEC504 (Hacker Tools, Techniques, and Incident Handling), MITRE ATT&CK T1110

---

## 1. Credential Attack Taxonomy

```
┌─────────────────────────────────────────────────────────────┐
│                  CREDENTIAL ATTACK TYPES                     │
├──────────────────┬──────────────────────────────────────────┤
│ ONLINE           │ Hit the live service — brute force,      │
│                  │ dictionary, spray. Network-bound. Slow.  │
│                  │ Risk: lockout, detection.                │
├──────────────────┼──────────────────────────────────────────┤
│ OFFLINE          │ Crack captured hashes locally. GPU-bound.│
│                  │ Fast. No lockout risk. Need the hash.    │
├──────────────────┼──────────────────────────────────────────┤
│ SPRAY            │ One password against many accounts.      │
│                  │ Avoids per-account lockout. High success │
│                  │ against large organizations.             │
├──────────────────┼──────────────────────────────────────────┤
│ STUFFING         │ Use breached credential pairs. Login as  │
│                  │ real users with real passwords from other │
│                  │ sites. Terrifyingly effective.            │
├──────────────────┼──────────────────────────────────────────┤
│ HARVEST          │ Capture credentials in transit or at     │
│                  │ rest. Responder, MITM, keyloggers,       │
│                  │ memory dumping, file scraping.            │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 2. Online Attacks — Hydra


---

# GS-25: Cross-Shell Execution — Rush's Bridge Patterns

> **Classification**: Royal Guard Knowledge Seed
> **Author**: Rush (The Breacher — Network Penetration)
> **Source**: Offensive PowerShell, Python subprocess Documentation, Real-World Tooling
> **Directive**: GS-27 — Think every route. Bash to PowerShell. Python to cmd. Every bridge works.

---

## 1. The Problem: Shell Boundaries

In penetration testing and automation, you constantly cross shell boundaries:
- A Python exploit needs to run PowerShell on a Windows target
- A Bash script on Kali needs to generate PowerShell payloads
- A CI/CD pipeline (Bash) needs to execute Windows administration commands
- An implant written in Python needs to execute cmd.exe or PowerShell commands

Each crossing introduces escaping problems, encoding issues, and execution quirks. This seed documents every pattern with working examples.

---

## 2. Pattern A: Simple -Command Execution

### 2.1 From Bash to PowerShell

```bash
# Basic command
powershell.exe -Command "Get-Process"

# With arguments
powershell.exe -Command "Get-Service | Where-Object { \$_.Status -eq 'Running' }"
# NOTE: $ must be escaped as \$ in bash to prevent bash variable expansion

# Multiple commands (semicolon-separated)
powershell.exe -Command "Get-Date; Get-ComputerInfo | Select-Object OsName"

# Store output in bash variable
RESULT=$(powershell.exe -Command "Get-NetFirewallProfile | Select-Object -ExpandProperty Enabled")
echo "$RESULT"


---

# GS-28: Exploit Development Foundations — From Vulnerability to Working Exploit

**Classification**: Rush (Royal Guard — The Breacher)
**Seed ID**: GS-28
**Domain**: Exploit Development / Offensive Research
**Source**: SANS SEC760 (Advanced Exploit Development), Corelan Exploit Writing Tutorials

---

## 1. Exploit Development Lifecycle

Every exploit follows the same fundamental pipeline. Skip a step and you waste hours. Rush doesn't waste hours.

```
┌─────────────────────────────────────────────────────────────┐
│  1. IDENTIFY  →  2. ANALYZE  →  3. BYPASS  →  4. PAYLOAD  │
│     vuln          protections     defenses      + deliver   │
│                                                             │
│  5. TEST     →  6. STABILIZE →  7. WEAPONIZE              │
│     in lab       reliability      operational use           │
└─────────────────────────────────────────────────────────────┘
```

### Vulnerability Classes That Lead to Exploitation

| Class | Description | Exploitability |
|---|---|---|
| **Stack Buffer Overflow** | Write past stack buffer bounds | High — classic, well-understood |
| **Heap Overflow** | Corrupt heap metadata/adjacent chunks | Medium — heap-specific techniques |
| **Use-After-Free (UAF)** | Reference freed memory | High — dominant in browsers/kernels |
| **Type Confusion** | Object treated as wrong type | High — common in JS engines |
| **Integer Overflow** | Arithmetic wraps around | Medium — leads to undersized buffers |
| **Format String** | User input as format specifier | High — direct memory read/write |
| **Double Free** | Free same allocation twice | Medium — heap corruption |
| **Race Condition** | TOCTOU or concurrent access | Medium — timing-dependent |
| **Null Pointer Deref** | Access address 0/near-zero | Low (userland), Medium (kernel) |
| **Command Injection** | Shell metacharacters in input | High — trivial exploitation |
| **Deserialization** | Untrusted data reconstructed as objects | High — RCE in many frameworks |

---

---

# GS-21: Firewall & Network Evasion — Rush (Royal Guard)

> **Classification**: Palace Security Knowledge Seed
> **Author**: Rush — The Breacher (Network Penetration)
> **Source**: SANS SEC560 (Network Penetration Testing), MITRE ATT&CK T1572, T1090, T1573
> **Last Updated**: 2026-03-09

---

## 1. Evasion Philosophy

Firewalls block ports. IDS inspects packets. Proxies filter URLs. Every network has controls.
But every network also has at least ONE path outbound that's allowed — HTTP, HTTPS, DNS, or
something else. Your job is to find that path and tunnel through it.

**GS-27 Mindset**: Think every route. WiFi, cellular, satellite, tunnel, mesh, Bluetooth,
physical, cloud relay. The Palace must be reachable from ANYWHERE on ANY network at ANY time.
That means we must understand every evasion technique — both to use them and to defend against them.

**Techniques covered:**
1. SSH Tunneling (Local, Remote, Dynamic)
2. Chisel (TCP over HTTP)
3. dnscat2 (C2 over DNS)
4. ICMP Tunneling
5. HTTP CONNECT Proxy Abuse
6. WebSocket Tunneling
7. IP Fragmentation & Protocol Manipulation
8. Application Layer Smuggling
9. Encrypted Channel Techniques
10. Cloud Service Relay

---

## 2. SSH Tunneling

### 2.1 Local Port Forward

Forward a port from your machine through the SSH server to a target behind the firewall.

```bash

---

# GS-11: Rush Kali WSL2 Platform — Primary Attack Platform Operations

**Classification**: Royal Guard Knowledge Seed
**Agent**: Rush (The Breacher — Network Penetration)
**Seed ID**: GS-11
**Sources**: Kali Linux Documentation, Microsoft WSL2 Documentation, Offensive Security Best Practices
**Last Updated**: 2026-03-09

---

## 1. Core Principle

**Kali WSL2 is Rush's primary attack platform for all offensive security operations.**

Windows is the host. Kali is the weapon. The two work together — Rush must know exactly what each can do, where the seams are, and how to route operations across the boundary without friction.

> "Think every route: WiFi, cellular, satellite, tunnel, mesh, Bluetooth, physical, cloud relay. The Palace must be reachable from ANYWHERE on ANY network at ANY time." — GS-27

---

## 2. Platform Architecture

### 2.1 WSL2 Under the Hood

```
┌─────────────────────────────────────────────┐
│              Windows 10/11 Host              │
│  ┌────────────────────────────────────────┐  │
│  │         Hyper-V Lightweight VM         │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │         Kali Linux WSL2          │  │  │
│  │  │  - Full Linux kernel (MS-built)  │  │  │
│  │  │  - ext4 filesystem               │  │  │
│  │  │  - systemd support (Win11+)      │  │  │
│  │  │  - /mnt/c → Windows C: drive     │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │  Virtual Network: 172.x.x.x/20 (NAT) │  │
│  └────────────────────────────────────────┘  │
│  Physical Network: 192.168.x.x (LAN)        │
└─────────────────────────────────────────────┘

---

# GS-16: Four-Layer Man-in-the-Middle Framework

**Classification:** Rush — Royal Guard (The Breacher)
**Domain:** Man-in-the-Middle Attack Architecture
**Source:** SANS SEC560, PNPT, real-world engagement patterns
**Platform:** Kali WSL2 + bridged/NAT networking

---

## Architecture Overview

MITM attacks operate at every layer of the network stack. Each layer offers different capabilities, detection risks, and persistence characteristics. Rush's framework covers all four:

```
Layer 7 — Application    mitmproxy, Burp Suite, custom proxies
Layer 4 — Transport      TCP hijack, session injection
Layer 3 — Network        ICMP redirect, routing manipulation
Layer 2 — Data Link      ARP spoofing, VLAN hopping, STP manipulation
```

**Principle:** Start at L2 (foundation), establish position, then layer L3/L4/L7 capabilities on top. L2 gives you the traffic flow. Upper layers give you visibility and control over that traffic.

---

## Layer 2: ARP-Based MITM

### Theory

ARP (Address Resolution Protocol) maps IP addresses to MAC addresses. ARP has NO authentication — any device can claim to be any IP. By sending gratuitous ARP replies, we convince the victim that OUR MAC address belongs to the gateway, and the gateway that OUR MAC address belongs to the victim. All traffic flows through us.

### Ettercap — Classic ARP Poisoning

```bash
# Enable IP forwarding first (otherwise traffic dies at our machine)
sudo sysctl -w net.ipv4.ip_forward=1

# Ettercap — text mode, ARP poisoning between target and gateway
# -T = text mode
# -q = quiet (less output noise)
# -i = interface

---

# GS-17: Windows Network Profile Exploitation

**Classification:** Rush — Royal Guard (The Breacher)
**Domain:** Windows Network Profile Security, Enumeration, Exploitation
**Source:** CIS Benchmarks for Windows 10/11, SANS SEC505, Microsoft Security Baselines
**Platform:** Windows 10/11, PowerShell 5.1+, Active Directory environments

---

## 0. Windows Network Profile Architecture

### What Network Profiles Are

Windows assigns every network connection to one of three profile categories. Each profile controls firewall rules, service exposure, discovery protocols, and sharing behavior. A misconfigured profile is an open door.

```
PROFILE          TRUST LEVEL    DEFAULT BEHAVIOR
─────────────────────────────────────────────────────────────────
Domain           High           Applied when machine authenticates to AD domain controller.
                                Most permissive. File sharing ON. Discovery ON.
                                Remote management ON. WinRM may be enabled.

Private          Medium         Applied when user manually marks network as "trusted."
                                Home/work networks. Discovery ON. File sharing available.
                                Less permissive than Domain but still exposes services.

Public           Low            Default for unknown/new networks. Most restrictive.
                                Discovery OFF. File sharing OFF. Inbound connections blocked.
                                This is the safe default — and the one attackers want to bypass.
```

### Why This Matters for Penetration Testing

```
1. A machine on a "Public" profile blocks inbound SMB, WinRM, RDP by default.
   The SAME machine on "Private" or "Domain" profile ALLOWS these services.

2. If we can force a profile change (Public → Private/Domain), we gain access
   to services that were previously firewalled.


---

# GS-13: Rush One-Time Elevation — Patterns and PowerShell Scripts

**Classification**: Royal Guard Knowledge Seed
**Agent**: Rush (The Breacher — Network Penetration)
**Seed ID**: GS-13
**Sources**: Microsoft Documentation, PTES, Windows Internals
**Last Updated**: 2026-03-09

---

## 1. Core Principle

**One-time elevation is a precise, documented, reversible admin action that unlocks user-level capability permanently (or for the engagement duration).**

Rush does not ask for persistent admin access. Rush asks for a single elevation that changes system configuration so that subsequent operations work at user level. Every script is:
- **Self-contained** — one file, one execution, done
- **Documented** — the founder knows exactly what it does before approving
- **Reversible** — every script has a matching cleanup script
- **Minimal** — changes only what's necessary, nothing more

---

## 2. Pattern 1: Scheduled Task as SYSTEM

### 2.1 When to Use

- Need to run a process with SYSTEM-level privileges
- Need a persistent listener that survives logoff
- Need to execute operations that require LocalSystem context
- Need a service-like capability without creating an actual service

### 2.2 Reverse Shell Listener (SYSTEM Context)

```powershell
# ============================================================
# RUSH ONE-TIME ELEVATION: Scheduled Task — Reverse Shell Listener
# PURPOSE: Creates a SYSTEM-level TCP listener on port 4444
# ELEVATION: Requires one-time admin execution
# PERSISTENCE: Runs at startup until removed
# ROLLBACK: Unregister-ScheduledTask -TaskName "RushListener" -Confirm:$false

---

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

---

# GS-15: Packet Crafting & Protocol Manipulation with Scapy

**Classification:** Rush — Royal Guard (The Breacher)
**Domain:** Network Packet Crafting, Evasion, Fuzzing, Covert Channels
**Source:** SANS SEC560 (Network Penetration Testing), Scapy documentation, real-world engagement patterns
**Platform:** Kali WSL2 / Python 3.x + Scapy 2.5+

---

## 0. Scapy Fundamentals

### Installation and Setup

```bash
# Install Scapy on Kali WSL2
sudo apt install python3-scapy -y

# Or via pip (latest version)
pip3 install scapy

# Launch interactive Scapy shell
sudo scapy

# Scapy requires root/sudo for raw socket access
# On WSL2, ensure you have proper network access:
sudo sysctl -w net.ipv4.ip_forward=1
```

### Core Scapy Concepts

```python
from scapy.all import *

# Scapy builds packets by layering protocols with the / operator
# Each layer is an object with configurable fields

# View all fields for a protocol
ls(IP)      # Show all IP header fields
ls(TCP)     # Show all TCP header fields
ls(UDP)     # Show all UDP header fields

---

# GS-22: Pivoting & Tunneling — Rush's Breach Patterns

> **Classification**: Royal Guard Knowledge Seed
> **Author**: Rush (The Breacher — Network Penetration)
> **Source**: OSCP Methodology, Real-World Engagement Patterns
> **Directive**: GS-27 — Never solve only the problem in front of you. Solve every version of it.

---

## 1. Core Concept: Why Pivoting Matters

A compromised host is not the destination — it is the doorway. Pivoting turns a single foothold into full network traversal. Every internal subnet, every segmented VLAN, every "air-gapped" network is reachable once you understand tunneling.

**Rush's Rule**: If you can reach one host, you can reach every host. The question is how many hops it takes.

---

## 2. SSH Tunneling — The Foundation

SSH is the Swiss Army knife of pivoting. It is present on nearly every Linux host and increasingly on Windows (OpenSSH). Master these three forwarding types before touching any other tool.

### 2.1 Local Port Forwarding (-L)

**Use case**: You have SSH access to a pivot host. You want to reach a service on an internal network that your attack box cannot directly contact.

**Pattern**: Traffic flows from YOUR machine, through the SSH tunnel, to the target.

```
Attacker (10.10.14.5) --> Pivot (10.10.10.50) --> Target (172.16.1.100:445)
```

**Command**:
```bash
# Forward local port 4445 through pivot to target's SMB
ssh -L 4445:172.16.1.100:445 user@10.10.10.50 -N -f

# Now access the target's SMB from your machine
smbclient //127.0.0.1/share -p 4445 -U admin
```


---

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

---

# GS-23: Protocol Exploitation — Rush's Attack Patterns

> **Classification**: Royal Guard Knowledge Seed
> **Author**: Rush (The Breacher — Network Penetration)
> **Source**: MITRE ATT&CK Framework, Impacket Documentation, Real-World Engagement Patterns
> **Directive**: GS-27 — Think every route. The Palace must be reachable from ANYWHERE.

---

## 1. SMB Relay Attacks

### 1.1 Understanding NTLM Relay

NTLM authentication is a challenge-response protocol. When a client authenticates to a server, an attacker positioned in the middle can relay that authentication to a DIFFERENT server. The attacker never cracks the hash — they simply forward the authentication in real-time.

**MITRE ATT&CK**: T1557.001 (LLMNR/NBT-NS Poisoning and SMB Relay)

**Prerequisites**:
- SMB signing is NOT required on the target (default for workstations)
- The relayed user has admin rights on the target
- You are on the same network segment

### 1.2 Checking SMB Signing

```bash
# CrackMapExec — fastest way to check entire subnet
crackmapexec smb 172.16.1.0/24 --gen-relay-list relay-targets.txt

# Nmap
nmap --script smb2-security-mode -p 445 172.16.1.0/24

# Output to look for:
# "Message signing enabled but not required" = VULNERABLE
# "Message signing enabled and required" = NOT vulnerable (usually DCs)
```

### 1.3 ntlmrelayx — The Primary Relay Tool

**Basic relay to SMB (command execution)**:
```bash

---

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


---

# GS-27: Windows Service Exploitation — Privilege Escalation via Misconfigured Services

**Classification**: Rush (Royal Guard — The Breacher)
**Seed ID**: GS-27
**Domain**: Privilege Escalation / Windows Services
**Source**: MITRE ATT&CK T1543.003 (Create or Modify System Process: Windows Service)

---

## 1. Why Services Are Gold

Windows services run under specific accounts — often `LocalSystem`, `NT AUTHORITY\SYSTEM`, `LocalService`, or `NetworkService`. When a service is misconfigured, an attacker with low-privilege access can hijack the service's execution path and escalate to SYSTEM. This is one of the most reliable privilege escalation vectors on Windows.

### Service Architecture Fundamentals

```
Service Control Manager (SCM) — services.exe
    ├── Reads service configuration from HKLM\SYSTEM\CurrentControlSet\Services\
    ├── Starts/stops services based on StartType
    ├── Manages service process lifecycle
    └── Enforces security descriptors (who can start/stop/configure)

Each service entry contains:
    ImagePath    — Full path to the executable (THIS IS WHAT WE ATTACK)
    ObjectName   — Account the service runs as (LocalSystem = jackpot)
    Start        — 2=Auto, 3=Manual, 4=Disabled
    Type         — 0x10=Own process, 0x20=Shared process
    Description  — Human-readable description
```

---

## 2. Unquoted Service Paths

### The Vulnerability

When a service path contains spaces and is NOT enclosed in quotes, Windows resolves the path ambiguously. The SCM uses the `CreateProcess` API, which parses unquoted paths left-to-right, testing each space as a potential filename boundary.

### How Windows Resolves Unquoted Paths


---

# GS-19: Network Traffic Analysis & C2 Detection — Rush (Royal Guard)

> **Classification**: Palace Security Knowledge Seed
> **Author**: Rush — The Breacher (Network Penetration)
> **Source**: SANS SEC503 (Intrusion Detection In-Depth), SANS SEC511, MITRE ATT&CK TA0011
> **Last Updated**: 2026-03-09

---

## 1. Traffic Analysis Philosophy

Network traffic never lies. Users lie. Logs can be tampered with. Endpoints can be compromised.
But the packets on the wire tell the truth. The Palace must see EVERYTHING that crosses its
network boundary and understand what it means.

**What this seed covers:**
1. C2 Beacon Identification
2. DNS Tunneling Detection
3. JA3/JA4 TLS Fingerprinting
4. Lateral Movement Pattern Recognition
5. tshark Filters for Threat Hunting
6. pyshark Scripted Analysis
7. Zeek (formerly Bro) Network Monitoring

**Mindset (GS-27)**: A C2 channel can ride on ANY protocol — HTTP, HTTPS, DNS, ICMP, WebSocket,
raw TCP, legitimate cloud services. Never assume a protocol is "safe" because it's common.
Think every route.

---

## 2. C2 Beacon Identification

### 2.1 What Is a Beacon?

A beacon is a periodic callback from a compromised host to a C2 server. The implant "phones home"
at regular intervals, checks for commands, executes them, and sends results back.

**Beacon characteristics to detect:**
- **Regularity**: Fixed or jittered intervals (e.g., every 60s +/- 10%)
- **Low volume**: Small packets, minimal data until tasked

---

# GS-24: Windows Firewall Analysis — Rush's Audit Playbook

> **Classification**: Royal Guard Knowledge Seed
> **Author**: Rush (The Breacher — Network Penetration)
> **Source**: CIS Benchmarks for Windows, Microsoft Security Baselines, NIST SP 800-41
> **Directive**: GS-27 — Every firewall has gaps. Find them all.

---

## 1. Windows Firewall Architecture

Windows Defender Firewall with Advanced Security (WFAS) operates on three profiles:

| Profile | When Active | Default Inbound | Default Outbound |
|---|---|---|---|
| **Domain** | Machine is connected to a domain network | Block | Allow |
| **Private** | User marks network as trusted (Home/Work) | Block | Allow |
| **Public** | Unknown/untrusted networks | Block | Allow |

**Critical default weakness**: Outbound traffic is ALLOWED by default on all profiles. This means any malware, reverse shell, or data exfiltration tool can call home without restriction unless outbound rules are explicitly configured.

---

## 2. Firewall Enumeration — Get-NetFirewallRule

### 2.1 Basic Enumeration

```powershell
# List ALL firewall rules (warning: hundreds of rules)
Get-NetFirewallRule | Format-Table Name, DisplayName, Enabled, Direction, Action -AutoSize

# Count rules by direction and action
Get-NetFirewallRule | Group-Object Direction, Action |
  Select-Object Name, Count | Format-Table -AutoSize

# List only ENABLED rules
Get-NetFirewallRule -Enabled True |
  Format-Table Name, DisplayName, Direction, Action, Profile -AutoSize

# List enabled INBOUND ALLOW rules (attack surface)

---

# GS-20: Windows Privilege Escalation — Every Vector — Rush (Royal Guard)

> **Classification**: Palace Security Knowledge Seed
> **Author**: Rush — The Breacher (Network Penetration)
> **Source**: MITRE ATT&CK TA0004 (Privilege Escalation), PayloadsAllTheThings, HackTricks, OSCP
> **Last Updated**: 2026-03-09

---

## 1. Privilege Escalation Philosophy

You have a shell. It's low-privilege. The target is SYSTEM or Administrator. Between you and
that target are dozens of possible misconfigurations, each one a stepping stone. This seed
covers EVERY major Windows privesc vector with PowerShell enumeration commands for each.

**MITRE ATT&CK TA0004 Techniques Covered:**
- T1574.001 — DLL Search Order Hijacking
- T1574.002 — DLL Side-Loading
- T1574.009 — Unquoted Service Paths
- T1134 — Access Token Manipulation
- T1053 — Scheduled Task/Job Abuse
- T1546 — Event Triggered Execution (Autorun)
- T1547 — Boot/Logon Autostart Execution
- T1055 — Process Injection
- T1548.002 — Bypass UAC
- T1552 — Unsecured Credentials

---

## 2. Initial Enumeration

### 2.1 System Information

```powershell
# Basic system info
systeminfo
whoami /all
hostname
[System.Environment]::OSVersion


---

# GS-26: WinRM Remoting — Windows Remote Management Deep Dive

**Classification**: Rush (Royal Guard — The Breacher)
**Seed ID**: GS-26
**Domain**: Remote Access / Windows Infrastructure
**Source**: Microsoft WinRM Documentation, MITRE ATT&CK T1021.006

---

## 1. WinRM Architecture Overview

Windows Remote Management (WinRM) is Microsoft's implementation of the WS-Management protocol — a SOAP-based, firewall-friendly protocol for managing systems remotely. It is the backbone of PowerShell Remoting, and one of the most powerful lateral movement vectors in any Windows environment.

### Core Components

| Component | Role |
|---|---|
| **WinRM Service** | Listener daemon on the target (winrm.exe / svchost.exe) |
| **WSMan Provider** | PowerShell provider that interfaces with WinRM |
| **WMI Plugin** | Allows WMI queries over WinRM |
| **HTTP.sys** | Kernel-mode HTTP driver that handles transport |
| **WinRS** | Windows Remote Shell — cmd-level remote execution |

### Transport Ports

| Port | Protocol | Encryption | Default State |
|---|---|---|---|
| **5985** | HTTP | Message-level encryption (not TLS) | Enabled on servers |
| **5986** | HTTPS | TLS + message-level encryption | Disabled by default |
| **80** | HTTP (compatibility) | Message-level | Legacy, rarely used |
| **443** | HTTPS (compatibility) | TLS | Legacy, rarely used |

**Critical understanding**: HTTP on 5985 does NOT mean unencrypted. WinRM encrypts the SOAP payload by default using Kerberos or NTLM session keys. The wire traffic is encrypted even over HTTP. HTTPS adds TLS on top — certificate validation, transport-level encryption, and protection against MITM downgrade attacks.

### How a WinRM Session Works

```
Client                          Target (5985/5986)
  |                                    |
  |--- HTTP POST /wsman ------------->|  (SOAP envelope)

---

# GS-14: Complete Wireless Attack Chain

**Classification:** Rush — Royal Guard (The Breacher)
**Domain:** Wireless Network Penetration
**Source:** Offensive Security (OSWP), SANS SEC617, real-world engagement patterns
**Hardware Required:** Alfa AWUS036ACH (RTL8812AU), Alfa AWUS1900 (RTL8814AU), or Panda PAU09
**Host Bridge:** usbipd-win (USB/IP for WSL2 passthrough)

---

## 0. Hardware Provisioning — usbipd-win Bridge

The Palace runs Kali on WSL2. Wireless adapters cannot be passed through natively.
usbipd-win solves this by binding USB devices from Windows to the WSL2 kernel.

### Installation (Windows Side)

```powershell
# Install usbipd-win (run as Administrator)
winget install usbipd

# List connected USB devices
usbipd list

# Expected output includes something like:
#   BUSID  VID:PID    DEVICE
#   2-4    0bda:8812  Realtek 802.11ac WLAN Adapter
```

### Binding and Attaching to WSL2

```powershell
# Bind the device (one-time, persists across reboots)
usbipd bind --busid 2-4

# Attach to WSL2 (must be done each time after reboot/reconnect)
usbipd attach --wsl --busid 2-4
```

### Verification (Kali WSL2 Side)

