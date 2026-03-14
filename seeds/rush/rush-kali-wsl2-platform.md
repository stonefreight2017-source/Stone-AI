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
```

Key architecture facts:
- WSL2 runs a REAL Linux kernel inside a lightweight Hyper-V VM
- The VM gets its own IP address on a virtual NAT network (typically 172.x.x.x)
- Windows host and WSL2 can communicate via this virtual network
- WSL2 accesses the internet through Windows host NAT
- File systems are cross-accessible but with performance implications
- WSL2 does NOT have direct access to hardware (WiFi, Bluetooth, USB without passthrough)

### 2.2 Networking Model

```
Internet
    |
[Router/Gateway 192.168.1.1]
    |
[Windows Host - 192.168.1.x] ← Physical NIC (Ethernet/WiFi)
    |
[Hyper-V Virtual Switch]
    |
[WSL2 VM - 172.x.x.x] ← Virtual NIC (NAT'd)
```

**Critical implications for Rush**:
1. WSL2 source IP is NOT the same as Windows host IP on the LAN
2. Inbound connections to WSL2 require port forwarding from Windows
3. Broadcast/multicast traffic may not reach WSL2
4. ARP operations are on the virtual network, not the physical LAN
5. mDNS/LLMNR poisoning from WSL2 requires special configuration

---

## 3. Command Execution Patterns

### 3.1 Primary Pattern: Windows Calls Kali

The standard dispatch pattern — run Kali tools from a Windows terminal:

```bash
# Basic command execution
wsl -d kali-linux -- <command>

# With arguments
wsl -d kali-linux -- nmap -sS -T4 -p- 192.168.1.0/24

# With pipes
wsl -d kali-linux -- nmap -sS 192.168.1.1 -oG - | wsl -d kali-linux -- grep "open"

# As root (for tools requiring root)
wsl -d kali-linux -u root -- nmap -sS 192.168.1.0/24

# With environment variables
wsl -d kali-linux -- bash -c "export RHOST=192.168.1.100 && msfconsole -q -x 'use exploit/multi/handler; run'"

# Long-running in background
wsl -d kali-linux -- bash -c "nohup responder -I eth0 > /tmp/responder.log 2>&1 &"
```

### 3.2 Secondary Pattern: Inside WSL2 Session

When working interactively inside a Kali session:

```bash
# Enter Kali WSL2
wsl -d kali-linux

# Or as root
wsl -d kali-linux -u root

# Call Windows tools FROM inside WSL2
powershell.exe -Command "Get-NetTCPConnection"
cmd.exe /c "netstat -ano"
ipconfig.exe  # Note: .exe extension required from WSL2

# Access Windows files from WSL2
ls /mnt/c/Users/stone/Desktop/
cat /mnt/c/Users/stone/stone-ai/.env
```

### 3.3 Cross-Platform Piping

```bash
# Kali tool output → Windows processing
wsl -d kali-linux -- nmap -oX - 192.168.1.0/24 | powershell.exe -Command "[xml]$x = Get-Content -Raw -; $x.nmaprun.host"

# Windows output → Kali tool processing
powershell.exe -Command "Get-Content targets.txt" | wsl -d kali-linux -- xargs -I{} nmap -sV {}

# Bidirectional file sharing
wsl -d kali-linux -- cp /home/kali/results.txt /mnt/c/Users/stone/Desktop/
```

---

## 4. Tool Availability Matrix

### 4.1 Reconnaissance Tools

| Tool | Installed by Default | Category | Typical Usage |
|---|---|---|---|
| `nmap` | YES | Network scanner | Port/service/OS discovery |
| `masscan` | YES | Fast port scanner | Rapid large-network scanning |
| `netdiscover` | YES | ARP scanner | Host discovery on local network |
| `arp-scan` | YES | ARP scanner | Layer 2 host discovery |
| `recon-ng` | YES | OSINT framework | Automated reconnaissance |
| `theHarvester` | YES | OSINT email/domain | Email and subdomain harvesting |
| `dmitry` | YES | Deepmagic recon | Whois, subdomain, email, port |
| `enum4linux` | YES | SMB enumeration | Windows/Samba share enumeration |
| `enum4linux-ng` | Install via pip | SMB enumeration | Modern replacement for enum4linux |
| `dnsrecon` | YES | DNS enumeration | DNS record discovery |
| `dnsenum` | YES | DNS enumeration | DNS brute force and zone transfer |
| `fierce` | YES | DNS recon | DNS reconnaissance |
| `sublist3r` | Install via apt | Subdomain enum | Subdomain discovery |
| `amass` | Install via apt | Attack surface | Comprehensive subdomain mapping |
| `whatweb` | YES | Web fingerprint | Web technology identification |
| `wafw00f` | YES | WAF detection | Web application firewall detection |

### 4.2 Vulnerability Assessment

| Tool | Installed by Default | Category | Typical Usage |
|---|---|---|---|
| `nikto` | YES | Web vuln scanner | Web server vulnerability scanning |
| `wpscan` | YES | WordPress scanner | WordPress vulnerability assessment |
| `sqlmap` | YES | SQL injection | Automated SQL injection testing |
| `searchsploit` | YES | Exploit database | Local ExploitDB search |
| `nmap --script vuln` | YES | NSE scripts | Nmap vulnerability scripts |
| `legion` | YES | Auto recon/vuln | Automated network pentesting |

### 4.3 Exploitation Tools

| Tool | Installed by Default | Category | Typical Usage |
|---|---|---|---|
| `metasploit-framework` | YES | Exploit framework | Full exploitation framework |
| `msfvenom` | YES (with msf) | Payload generator | Shellcode and payload generation |
| `exploitdb` | YES | Exploit database | Local exploit database |
| `crackmapexec` / `netexec` | YES | AD/SMB exploitation | Active Directory attack tool |
| `impacket-scripts` | YES | Network protocols | SMB, Kerberos, LDAP attacks |
| `evil-winrm` | YES | WinRM shell | Windows Remote Management shell |
| `smbclient` | YES | SMB client | SMB file access and enumeration |

### 4.4 Password Attacks

| Tool | Installed by Default | Category | Typical Usage |
|---|---|---|---|
| `john` | YES | Password cracker | John the Ripper — CPU cracking |
| `hashcat` | WINDOWS PREFERRED | Password cracker | GPU-accelerated cracking |
| `hydra` | YES | Online brute force | Network service brute forcing |
| `medusa` | YES | Online brute force | Parallel login brute forcer |
| `cewl` | YES | Wordlist generator | Custom wordlist from website |
| `crunch` | YES | Wordlist generator | Pattern-based wordlist generation |
| `wordlists` | YES | Wordlists | `/usr/share/wordlists/` (rockyou, etc.) |

### 4.5 Wireless Tools (WSL2 LIMITATIONS APPLY)

| Tool | Installed by Default | WSL2 Status | Notes |
|---|---|---|---|
| `aircrack-ng` | YES | NO HARDWARE ACCESS | Cannot access WiFi adapter from WSL2 |
| `wifite` | YES | NO HARDWARE ACCESS | Requires monitor mode — not in WSL2 |
| `reaver` | YES | NO HARDWARE ACCESS | WPS attacks need WiFi hardware |
| `bettercap` | Install via apt | PARTIAL | Network attacks work, WiFi does not |
| `kismet` | Install via apt | NO HARDWARE ACCESS | Requires WiFi monitor mode |

**WiFi operations require**: Bare-metal Kali on USB boot or external WiFi adapter with usbipd passthrough (see Section 6).

### 4.6 Post-Exploitation

| Tool | Installed by Default | Category | Typical Usage |
|---|---|---|---|
| `mimikatz` | Via impacket | Credential extraction | Windows credential dumping |
| `bloodhound` | Install via apt | AD mapping | Active Directory relationship graphing |
| `empire` | Install via apt | Post-exploit framework | PowerShell/Python post-exploitation |
| `chisel` | Install via apt/go | Tunneling | TCP/UDP tunnel over HTTP |
| `ligolo-ng` | Install manually | Tunneling | Advanced network pivoting |
| `proxychains` | YES | Proxy routing | Route tools through proxy/tunnel |
| `socat` | YES | Relay | Multipurpose relay tool |
| `sshuttle` | YES | VPN over SSH | Transparent proxy over SSH |

### 4.7 Web Application Testing

| Tool | Installed by Default | Category | Typical Usage |
|---|---|---|---|
| `burpsuite` | YES (Community) | Web proxy | HTTP/HTTPS interception and testing |
| `zaproxy` | YES | Web proxy | OWASP ZAP — automated web testing |
| `gobuster` | YES | Dir brute force | Directory and file brute forcing |
| `dirb` | YES | Dir brute force | Web directory scanner |
| `ffuf` | Install via apt | Fuzzer | Fast web fuzzer |
| `wfuzz` | YES | Fuzzer | Web application fuzzer |
| `commix` | YES | Command injection | Automated command injection testing |
| `xsser` | YES | XSS testing | Cross-site scripting scanner |

---

## 5. WSL2 Networking Deep Dive

### 5.1 IP Address Discovery

```bash
# Get WSL2 IP
wsl -d kali-linux -- hostname -I

# Get Windows host IP (from inside WSL2)
wsl -d kali-linux -- cat /etc/resolv.conf | grep nameserver | awk '{print $2}'

# Full network info
wsl -d kali-linux -- ip addr show eth0
```

### 5.2 Port Forwarding (Windows → WSL2)

When a service in WSL2 needs to be accessible from the LAN:

```powershell
# Forward Windows port 4444 to WSL2 port 4444
$wslIP = (wsl -d kali-linux -- hostname -I).Trim()
netsh interface portproxy add v4tov4 listenport=4444 listenaddress=0.0.0.0 connectport=4444 connectaddress=$wslIP

# Verify port forwarding rules
netsh interface portproxy show v4tov4

# Remove port forwarding when done
netsh interface portproxy delete v4tov4 listenport=4444 listenaddress=0.0.0.0

# Also open Windows Firewall for the port
New-NetFirewallRule -DisplayName "WSL2 Forward 4444" -Direction Inbound -LocalPort 4444 -Protocol TCP -Action Allow
```

### 5.3 Listening for Reverse Shells

```bash
# Option 1: Listen in WSL2, forward port from Windows (recommended)
# Step 1 (PowerShell): Forward port
# Step 2 (Kali): nc -lvnp 4444

# Option 2: Listen on Windows directly using ncat
ncat.exe -lvnp 4444

# Option 3: Metasploit handler in WSL2
wsl -d kali-linux -u root -- msfconsole -q -x "use exploit/multi/handler; set PAYLOAD windows/x64/meterpreter/reverse_tcp; set LHOST 0.0.0.0; set LPORT 4444; run"
```

### 5.4 DNS and Name Resolution

```bash
# WSL2 uses Windows DNS by default via /etc/resolv.conf
# To use custom DNS (e.g., for DNS tunneling tests):

# Temporary override
wsl -d kali-linux -- bash -c "echo 'nameserver 8.8.8.8' > /etc/resolv.conf"

# Persistent (prevent auto-generation) - add to /etc/wsl.conf:
# [network]
# generateResolvConf = false
```

### 5.5 Traffic Capture Considerations

```bash
# tcpdump in WSL2 captures the VIRTUAL interface traffic
wsl -d kali-linux -u root -- tcpdump -i eth0 -w /tmp/capture.pcap

# For capturing PHYSICAL interface traffic, use Windows:
# Option 1: Wireshark on Windows
# Option 2: netsh trace (limited but built-in)
netsh trace start capture=yes tracefile=C:\Users\stone\capture.etl
netsh trace stop
# Convert .etl to .pcap with etl2pcapng tool

# Option 3: pktmon (Windows 10 2004+)
pktmon start --capture --pkt-size 0
pktmon stop
pktmon pcapng pktmon.etl -o capture.pcapng
```

---

## 6. USB Passthrough with usbipd-win

### 6.1 Setup

```powershell
# Install usbipd-win (Windows side)
winget install usbipd

# Install USB/IP tools in Kali WSL2
wsl -d kali-linux -u root -- apt install linux-tools-generic hwdata
```

### 6.2 Device Passthrough

```powershell
# List available USB devices
usbipd list

# Bind a device (one-time, requires admin)
usbipd bind --busid <BUSID>

# Attach device to WSL2
usbipd attach --wsl --busid <BUSID>

# Verify in Kali
wsl -d kali-linux -- lsusb

# Detach when done
usbipd detach --busid <BUSID>
```

### 6.3 Use Cases for USB Passthrough

| Device | Purpose | Notes |
|---|---|---|
| WiFi adapter (monitor mode capable) | Wireless attacks | Alfa AWUS036ACH, TP-Link TL-WN722N v1 |
| Rubber Ducky / USB Armory | HID attacks | Keystroke injection, network implant |
| Proxmark3 | RFID/NFC | Access card cloning and analysis |
| Bus Pirate / Logic Analyzer | Hardware hacking | Serial, SPI, I2C analysis |
| SDR (RTL-SDR, HackRF) | Radio frequency | Signal analysis and transmission |
| Yubikey | Authentication | FIDO2/U2F from WSL2 |

---

## 7. Platform Routing Decision Guide

### 7.1 Route to Windows When:

1. The operation requires **native Windows API access** (registry, services, WMI, COM)
2. The target is a **Windows domain** and you need Kerberos/NTLM from a domain-joined machine
3. You need the **physical network identity** (real LAN IP, MAC address)
4. **GPU-accelerated** operations (hashcat with AMD Radeon RX 550)
5. **PowerShell-specific** operations that don't translate to Linux
6. **Firewall manipulation** of the Windows host itself
7. **Credential extraction** from the Windows host (SAM, LSASS, DPAPI)

### 7.2 Route to Kali WSL2 When:

1. The tool is a **standard offensive security tool** (nmap, metasploit, burpsuite, etc.)
2. You need **Python exploitation frameworks** with complex dependencies
3. The operation involves **Linux-native protocols** or tools
4. You need **wordlists** (`/usr/share/wordlists/`)
5. You're running **web application testing** suites
6. **Scripting complex attack chains** — bash scripting is more natural in Kali
7. You need **impacket** or similar Python-based protocol implementations

### 7.3 Route to BOTH When:

1. **Pivot operations** — Windows provides initial access, Kali provides exploitation tools
2. **Password cracking** — Kali extracts hashes, Windows runs hashcat with GPU
3. **Network analysis** — Windows captures physical traffic, Kali analyzes with tshark
4. **Active Directory attacks** — Windows provides domain context, Kali runs BloodHound/impacket

---

## 8. Kali WSL2 Maintenance

### 8.1 Keep Tools Updated

```bash
# Full system update
wsl -d kali-linux -u root -- bash -c "apt update && apt full-upgrade -y"

# Update specific toolsets
wsl -d kali-linux -u root -- apt install -y kali-tools-top10

# Update Metasploit database
wsl -d kali-linux -- msfdb init
wsl -d kali-linux -- msfdb reinit  # If corrupted
```

### 8.2 Workspace Organization

```bash
# Standard Rush workspace layout in Kali
/home/kali/
├── engagements/          # Per-engagement directories
│   └── YYYY-MM-DD-name/
│       ├── recon/        # Reconnaissance output
│       ├── scans/        # Scan results
│       ├── exploits/     # Custom exploits
│       ├── loot/         # Extracted data
│       └── notes.md      # Engagement notes
├── tools/                # Custom tools not in repos
├── wordlists/            # Custom wordlists
└── scripts/              # Rush automation scripts
```

### 8.3 WSL2 Configuration (/etc/wsl.conf)

```ini
[boot]
systemd=true              # Enable systemd (Win11+ or updated Win10)

[network]
generateResolvConf=true    # Auto DNS config
hostname=kali-rush         # Custom hostname

[automount]
enabled=true
root=/mnt/
options="metadata,umask=22,fmask=11"

[interop]
enabled=true               # Allow calling Windows executables
appendWindowsPath=true     # Include Windows PATH
```

### 8.4 Performance Tips

1. **Store project files inside WSL2 filesystem** (`/home/kali/`) not on `/mnt/c/` — 5-10x faster I/O
2. **Limit WSL2 memory** if needed via `.wslconfig`:
   ```
   [wsl2]
   memory=8GB
   processors=4
   swap=4GB
   ```
3. **Use `wsl --shutdown`** to reclaim memory after heavy operations
4. **Compact the WSL2 VHDX** periodically to reclaim disk space

---

## 9. Troubleshooting Common WSL2 Issues

| Issue | Symptom | Fix |
|---|---|---|
| No network in WSL2 | `ping` fails, DNS timeout | `wsl --shutdown` then restart; check Windows firewall |
| WSL2 IP changed | Port forwarding broke | Re-run port forwarding script (IP changes on restart) |
| DNS not resolving | `nslookup` fails | Check `/etc/resolv.conf`; restart WSL2 |
| Tool not found | `command not found` | `apt update && apt install <package>` |
| Permission denied | Raw socket operations fail | Run as root: `wsl -d kali-linux -u root` |
| Metasploit DB error | `msf` can't connect to DB | `msfdb reinit` |
| Slow file access | Operations on `/mnt/c/` lag | Move files to WSL2 native filesystem |
| WSL2 won't start | Error on `wsl -d kali-linux` | `wsl --update`; ensure Hyper-V enabled |
| USB device not seen | `lsusb` empty after attach | Reinstall `usbipd` client in Kali; check `usbipd list` |

---

## 10. Integration with Other Seeds

| Seed | Relationship |
|---|---|
| GS-10 (Operational Constraints) | Decision tree routes operations to Kali WSL2 |
| GS-12 (Privilege Escalation Before Surrender) | Step 2 checks Kali WSL2 as alternative |
| GS-13 (One-Time Elevation) | Some elevation scripts interact with WSL2 |
| GS-27 (Founder's Mindset) | Every route includes Kali WSL2 as an option |

---

*This seed is owned by Rush (Royal Guard — The Breacher). No other agent modifies this document. Updates require founder approval.*
