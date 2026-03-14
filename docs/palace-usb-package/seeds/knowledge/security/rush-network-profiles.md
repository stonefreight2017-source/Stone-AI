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

3. Many corporate laptops roam between networks. If profile detection is
   misconfigured, a hotel WiFi might get "Domain" profile treatment.

4. VPN connections often trigger "Domain" profile (NLA detects the DC),
   but the underlying physical network might be hostile.

5. Profile misclassification is one of the most underexploited attack vectors
   in Windows environments.
```

---

## 1. PowerShell Enumeration Scripts

### Basic Network Profile Enumeration

```powershell
# === Run these on the target (post-exploitation) or during assessment ===

# Get all network connection profiles
Get-NetConnectionProfile

# Output:
# Name             : Ethernet
# InterfaceAlias   : Ethernet
# InterfaceIndex   : 6
# NetworkCategory  : DomainAuthenticated  (or Private, Public)
# DomainAuthenticationKind : Ldap
# IPv4Connectivity : Internet
# IPv6Connectivity : LocalNetwork

# Get profile for specific interface
Get-NetConnectionProfile -InterfaceAlias "Wi-Fi"

# List ALL network adapters and their profile assignment
Get-NetAdapter | ForEach-Object {
    $profile = Get-NetConnectionProfile -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
    [PSCustomObject]@{
        Adapter      = $_.Name
        Status       = $_.Status
        MacAddress   = $_.MacAddress
        Speed        = $_.LinkSpeed
        Profile      = $profile.NetworkCategory
        NetworkName  = $profile.Name
    }
} | Format-Table -AutoSize
```

### Comprehensive Security Audit Script

```powershell
function Get-NetworkProfileAudit {
    <#
    .SYNOPSIS
        Complete network profile security audit.
        Checks profile assignments, firewall rules, exposed services,
        and CIS Benchmark compliance.
    #>

    Write-Host "`n=== NETWORK PROFILE SECURITY AUDIT ===" -ForegroundColor Cyan
    Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Computer: $env:COMPUTERNAME"
    Write-Host "User: $env:USERNAME"

    # --- Section 1: Profile Assignments ---
    Write-Host "`n[1] ACTIVE NETWORK PROFILES" -ForegroundColor Yellow
    $profiles = Get-NetConnectionProfile
    foreach ($p in $profiles) {
        $color = switch ($p.NetworkCategory) {
            "Public" { "Green" }
            "Private" { "Yellow" }
            "DomainAuthenticated" { "Red" }
            default { "White" }
        }
        Write-Host "  Interface: $($p.InterfaceAlias)" -ForegroundColor $color
        Write-Host "    Network Name: $($p.Name)"
        Write-Host "    Category: $($p.NetworkCategory)"
        Write-Host "    IPv4: $($p.IPv4Connectivity)"
        Write-Host "    IPv6: $($p.IPv6Connectivity)"
    }

    # --- Section 2: Firewall Profile Status ---
    Write-Host "`n[2] FIREWALL PROFILE STATUS" -ForegroundColor Yellow
    $fwProfiles = Get-NetFirewallProfile
    foreach ($fw in $fwProfiles) {
        $enabled = if ($fw.Enabled) { "ENABLED" } else { "DISABLED (CRITICAL!)" }
        $color = if ($fw.Enabled) { "Green" } else { "Red" }
        Write-Host "  $($fw.Name): $enabled" -ForegroundColor $color
        Write-Host "    Default Inbound: $($fw.DefaultInboundAction)"
        Write-Host "    Default Outbound: $($fw.DefaultOutboundAction)"
        Write-Host "    Log Allowed: $($fw.LogAllowed)"
        Write-Host "    Log Blocked: $($fw.LogBlocked)"
        Write-Host "    Log File: $($fw.LogFileName)"
    }

    # --- Section 3: Inbound Allow Rules Per Profile ---
    Write-Host "`n[3] INBOUND ALLOW RULES (per profile)" -ForegroundColor Yellow
    foreach ($profileName in @("Domain", "Private", "Public")) {
        $rules = Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True |
            Where-Object { $_.Profile -match $profileName -or $_.Profile -eq "Any" }
        Write-Host "  $profileName profile: $($rules.Count) inbound allow rules" -ForegroundColor White

        # Show high-risk rules
        $highRisk = $rules | Where-Object {
            $_.DisplayName -match "Remote Desktop|SMB|WinRM|SSH|RPC|NetBIOS|SNMP|Telnet|WMI"
        }
        foreach ($rule in $highRisk) {
            Write-Host "    [HIGH RISK] $($rule.DisplayName)" -ForegroundColor Red
            $portFilter = $rule | Get-NetFirewallPortFilter
            Write-Host "      Protocol: $($portFilter.Protocol), Port: $($portFilter.LocalPort)"
        }
    }

    # --- Section 4: Listening Services ---
    Write-Host "`n[4] LISTENING SERVICES" -ForegroundColor Yellow
    $listeners = Get-NetTCPConnection -State Listen | Sort-Object LocalPort
    foreach ($l in $listeners) {
        $process = Get-Process -Id $l.OwningProcess -ErrorAction SilentlyContinue
        $svcName = if ($process) { $process.ProcessName } else { "Unknown" }
        Write-Host "  :$($l.LocalPort) ($svcName) — Bound to: $($l.LocalAddress)"
    }

    # --- Section 5: Network Discovery Status ---
    Write-Host "`n[5] NETWORK DISCOVERY & SHARING" -ForegroundColor Yellow
    $ndService = Get-Service -Name "FDResPub" -ErrorAction SilentlyContinue
    $ssdpService = Get-Service -Name "SSDPSRV" -ErrorAction SilentlyContinue
    $upnpService = Get-Service -Name "upnphost" -ErrorAction SilentlyContinue
    $browserService = Get-Service -Name "Browser" -ErrorAction SilentlyContinue

    Write-Host "  Function Discovery (FDResPub): $($ndService.Status)"
    Write-Host "  SSDP Discovery: $($ssdpService.Status)"
    Write-Host "  UPnP Host: $($upnpService.Status)"
    Write-Host "  Computer Browser: $(if ($browserService) { $browserService.Status } else { 'Not Installed' })"

    # SMB status
    $smbConfig = Get-SmbServerConfiguration
    Write-Host "  SMB1 Protocol: $(if ($smbConfig.EnableSMB1Protocol) { 'ENABLED (CRITICAL!)' } else { 'Disabled' })"
    Write-Host "  SMB2 Protocol: $(if ($smbConfig.EnableSMB2Protocol) { 'Enabled' } else { 'Disabled' })"

    # --- Section 6: Registry Profile Settings ---
    Write-Host "`n[6] REGISTRY — NETWORK PROFILE SETTINGS" -ForegroundColor Yellow
    $regPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Profiles"
    if (Test-Path $regPath) {
        $profileKeys = Get-ChildItem $regPath
        foreach ($key in $profileKeys) {
            $props = Get-ItemProperty $key.PSPath
            Write-Host "  Profile GUID: $($key.PSChildName)"
            Write-Host "    Name: $($props.ProfileName)"
            Write-Host "    Category: $(switch ($props.Category) { 0 {'Public'} 1 {'Private'} 2 {'Domain'} default {'Unknown'} })"
            Write-Host "    CategoryType: $(switch ($props.CategoryType) { 0 {'Manual'} 1 {'Automatic'} default {'Unknown'} })"
            Write-Host "    Managed: $($props.Managed)"
        }
    }
}

# Run the audit
Get-NetworkProfileAudit
```

### Remote Enumeration Script (For Lateral Movement)

```powershell
function Get-RemoteNetworkProfiles {
    <#
    .SYNOPSIS
        Enumerate network profiles on remote machines.
        Requires WinRM access or admin credentials.
    #>
    param(
        [Parameter(Mandatory)]
        [string[]]$ComputerNames,

        [PSCredential]$Credential
    )

    $results = @()

    foreach ($computer in $ComputerNames) {
        try {
            $session = if ($Credential) {
                New-PSSession -ComputerName $computer -Credential $Credential -ErrorAction Stop
            } else {
                New-PSSession -ComputerName $computer -ErrorAction Stop
            }

            $profileData = Invoke-Command -Session $session -ScriptBlock {
                $profiles = Get-NetConnectionProfile
                $firewall = Get-NetFirewallProfile
                $listeners = Get-NetTCPConnection -State Listen |
                    Select-Object LocalPort, LocalAddress, OwningProcess

                [PSCustomObject]@{
                    Hostname  = $env:COMPUTERNAME
                    Profiles  = $profiles | Select-Object InterfaceAlias, NetworkCategory, Name
                    Firewall  = $firewall | Select-Object Name, Enabled, DefaultInboundAction
                    Listeners = $listeners
                }
            }

            $results += $profileData
            Remove-PSSession $session

            Write-Host "[+] $computer — Profile: $($profileData.Profiles.NetworkCategory -join ', ')" -ForegroundColor Green

        } catch {
            Write-Host "[-] $computer — Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    return $results
}

# Usage:
# $targets = @("WS01", "WS02", "WS03", "DC01")
# $cred = Get-Credential
# $audit = Get-RemoteNetworkProfiles -ComputerNames $targets -Credential $cred
# $audit | Where-Object { $_.Profiles.NetworkCategory -contains "Public" }
```

---

## 2. Profile Misclassification Vulnerabilities

### NLA (Network Location Awareness) Exploitation

```
Windows uses NLA (Network Location Awareness) to determine the profile:

DOMAIN DETECTION:
  1. Machine authenticates to a Domain Controller via LDAP/Kerberos
  2. NLA verifies the DC is on the expected network
  3. If successful → DomainAuthenticated profile

PRIVATE/PUBLIC:
  1. New network → Public by default
  2. User or GPO marks it as Private
  3. Profile is stored by network signature (gateway MAC + SSID + ...)

VULNERABILITY: NLA Domain Detection Race Condition
  - On boot, the network interface comes up BEFORE the DC is reachable
  - Brief window where the connection is "Public" or "Private"
  - Some firewall rules flicker on/off during this window
  - VPN split-tunneling can cause the physical adapter to stay Public
    while the VPN adapter gets Domain — but physical adapter services
    are exposed on the hostile local network

VULNERABILITY: Network Signature Spoofing
  - If an attacker clones the gateway MAC address and SSID of a known
    "Private" network, Windows may automatically assign the Private profile
  - This is especially effective for WiFi networks the target has connected
    to previously (home network, coffee shop, etc.)
```

### Forcing Profile Change via DHCP/DNS

```bash
# From attacker's machine (after MITM position established):

# 1. Clone the gateway MAC of a network the victim trusts
sudo macchanger --mac=AA:BB:CC:DD:EE:FF eth0

# 2. Set up DHCP with matching parameters
# If the victim's "Home" network uses 192.168.1.0/24 with gateway .1:
sudo dnsmasq --interface=eth0 \
  --dhcp-range=192.168.1.100,192.168.1.200,12h \
  --dhcp-option=3,192.168.1.1 \
  --dhcp-option=6,192.168.1.1 \
  --dhcp-option=15,home.local \
  --no-daemon

# 3. If targeting Domain profile, set up a fake DC:
# Responder's LDAP server can respond to NLA domain detection queries
sudo responder -I eth0 -dwPv

# The victim's machine may reclassify the network, opening services
```

### VPN Split-Tunnel Profile Confusion

```
SCENARIO:
  User connects to corporate VPN from hotel WiFi
  - Physical adapter (WiFi): Public profile — good
  - VPN adapter: Domain profile — expected

  BUT: If split-tunneling is enabled:
  - Local traffic goes through physical adapter (Public)
  - Corporate traffic goes through VPN (Domain)

  VULNERABILITY: Some applications bind to 0.0.0.0 (all interfaces)
  and check only the Domain profile's firewall rules. This means:
  - WinRM might be accessible on the hotel WiFi side
  - File shares might be accessible locally
  - RDP might be exposed

ENUMERATION (from attacker on same hotel WiFi):
  nmap -sV -p 445,5985,3389 <victim_ip>
  # If these respond, the victim has services leaking through split-tunnel
```

---

## 3. Registry Paths — Deep Dive

### Network Profile Storage

```
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Profiles\{GUID}
  ProfileName     (REG_SZ)     — Display name of the network
  Category        (REG_DWORD)  — 0=Public, 1=Private, 2=Domain
  CategoryType    (REG_DWORD)  — 0=Manual, 1=Automatic
  Managed         (REG_DWORD)  — 0=No, 1=Yes (GPO managed)
  NameType        (REG_DWORD)  — 6=Wired, 71=Wireless, 243=VPN
  DateCreated     (REG_BINARY) — When the profile was first created
  DateLastConnected (REG_BINARY) — Last connection timestamp

HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Signatures\Unmanaged\{GUID}
  DefaultGatewayMac  (REG_BINARY) — Gateway MAC used for network identification
  DnsSuffix          (REG_SZ)     — DNS suffix at time of connection
  FirstNetwork       (REG_SZ)     — SSID or network name
  ProfileGuid        (REG_SZ)     — Links to the Profiles key above
```

### PowerShell: Read and Modify Profile Registry

```powershell
# READ all stored network profiles
$regPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Profiles"
Get-ChildItem $regPath | ForEach-Object {
    $p = Get-ItemProperty $_.PSPath
    [PSCustomObject]@{
        GUID     = $_.PSChildName
        Name     = $p.ProfileName
        Category = switch ($p.Category) { 0 {"Public"} 1 {"Private"} 2 {"Domain"} }
        Type     = switch ($p.CategoryType) { 0 {"Manual"} 1 {"Automatic"} }
        Managed  = [bool]$p.Managed
    }
} | Format-Table -AutoSize

# CHANGE a profile from Public to Private (requires admin)
# WARNING: This weakens security. Document this as a finding.
$targetGuid = "{12345678-1234-1234-1234-123456789012}"  # Replace with actual GUID
Set-ItemProperty -Path "$regPath\$targetGuid" -Name "Category" -Value 1  # 1 = Private

# Verify the change took effect
Get-NetConnectionProfile

# PowerShell method (preferred over registry for active connections):
Set-NetConnectionProfile -InterfaceAlias "Ethernet" -NetworkCategory Private
# or
Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Public
```

### Firewall Profile Registry

```
HKLM\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy

Subkeys:
  DomainProfile\
    EnableFirewall     (REG_DWORD) — 0=Disabled, 1=Enabled
    DefaultInboundAction  (REG_DWORD) — 0=Allow, 1=Block
    DefaultOutboundAction (REG_DWORD) — 0=Allow, 1=Block
    DisableNotifications  (REG_DWORD) — 0=Show, 1=Hide

  StandardProfile\    (Private)
    [Same subkeys as Domain]

  PublicProfile\
    [Same subkeys as Domain]
```

```powershell
# Check if firewall is enabled for each profile via registry
$fwPath = "HKLM:\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy"
foreach ($profile in @("DomainProfile", "StandardProfile", "PublicProfile")) {
    $enabled = (Get-ItemProperty "$fwPath\$profile").EnableFirewall
    $name = switch ($profile) {
        "DomainProfile" { "Domain" }
        "StandardProfile" { "Private" }
        "PublicProfile" { "Public" }
    }
    $status = if ($enabled -eq 1) { "Enabled" } else { "DISABLED" }
    Write-Host "$name firewall: $status"
}
```

### Network Signature Registry (For Spoofing Research)

```powershell
# Read network signatures — this is what Windows uses to identify known networks
$sigPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Signatures\Unmanaged"
Get-ChildItem $sigPath | ForEach-Object {
    $s = Get-ItemProperty $_.PSPath
    $gwMac = if ($s.DefaultGatewayMac) {
        ($s.DefaultGatewayMac | ForEach-Object { $_.ToString("X2") }) -join ":"
    } else { "N/A" }

    [PSCustomObject]@{
        Network      = $s.FirstNetwork
        GatewayMAC   = $gwMac
        DnsSuffix    = $s.DnsSuffix
        ProfileGuid  = $s.ProfileGuid
    }
} | Format-Table -AutoSize

# OUTPUT reveals what gateway MACs + SSIDs are trusted as "Private"
# An attacker can clone these to trigger automatic Private profile assignment
```

---

## 4. Service Exposure Per Profile

### Default Service Exposure Matrix

```
SERVICE               PORT(S)     DOMAIN    PRIVATE   PUBLIC
──────────────────────────────────────────────────────────────
SMB (File Sharing)    445         ALLOW     ALLOW*    BLOCK
NetBIOS              137-139      ALLOW     ALLOW*    BLOCK
RDP                   3389        ALLOW*    BLOCK     BLOCK
WinRM (HTTP)          5985        ALLOW*    BLOCK     BLOCK
WinRM (HTTPS)         5986        ALLOW*    BLOCK     BLOCK
WMI                   135+dyn     ALLOW     ALLOW*    BLOCK
SNMP                  161         BLOCK     BLOCK     BLOCK
SSH (if installed)    22          ALLOW*    ALLOW*    BLOCK
mDNS                  5353        ALLOW     ALLOW     BLOCK
LLMNR                 5355        ALLOW     ALLOW     ALLOW**
NetBIOS Name Svc      137/UDP     ALLOW     ALLOW     ALLOW**
ICMPv4 Echo          ICMP         ALLOW     ALLOW     BLOCK
Network Discovery    Various      ALLOW     ALLOW     BLOCK

* = If enabled/configured (not all are on by default)
** = LLMNR and NBT-NS respond on ALL profiles by default — Responder works everywhere
```

### Detailed Service Audit Script

```powershell
function Get-ServiceExposureByProfile {
    <#
    .SYNOPSIS
        Maps which services are exposed under each firewall profile.
        Identifies services that would become accessible if profile changes.
    #>

    $criticalPorts = @{
        "SMB"        = @(445)
        "NetBIOS"    = @(137, 138, 139)
        "RDP"        = @(3389)
        "WinRM"      = @(5985, 5986)
        "WMI/RPC"    = @(135)
        "SSH"        = @(22)
        "SNMP"       = @(161, 162)
        "LDAP"       = @(389, 636)
        "DNS"        = @(53)
        "HTTP/HTTPS" = @(80, 443)
        "MSSQL"      = @(1433, 1434)
        "MySQL"      = @(3306)
        "PostgreSQL"  = @(5432)
        "Redis"      = @(6379)
    }

    Write-Host "`n=== SERVICE EXPOSURE ANALYSIS ===" -ForegroundColor Cyan

    foreach ($profileName in @("Domain", "Private", "Public")) {
        Write-Host "`n--- $profileName Profile ---" -ForegroundColor Yellow

        foreach ($svc in $criticalPorts.GetEnumerator()) {
            foreach ($port in $svc.Value) {
                # Check if there's an inbound allow rule for this port on this profile
                $rules = Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True |
                    Where-Object { $_.Profile -match $profileName -or $_.Profile -eq "Any" } |
                    ForEach-Object {
                        $portFilter = $_ | Get-NetFirewallPortFilter
                        if ($portFilter.LocalPort -eq $port -or $portFilter.LocalPort -eq "Any") {
                            $_
                        }
                    }

                # Check if service is actually listening
                $listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

                if ($rules -and $listening) {
                    Write-Host "  [EXPOSED] $($svc.Key) (:$port) — Listening AND allowed" -ForegroundColor Red
                } elseif ($rules) {
                    Write-Host "  [ALLOWED] $($svc.Key) (:$port) — Rule exists, not listening" -ForegroundColor Yellow
                } elseif ($listening) {
                    Write-Host "  [BLOCKED] $($svc.Key) (:$port) — Listening but firewalled" -ForegroundColor Green
                }
            }
        }
    }

    # Show what CHANGES if profile switches from Public to Private
    Write-Host "`n--- IMPACT: Public → Private Profile Change ---" -ForegroundColor Magenta
    $publicRules = Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True |
        Where-Object { $_.Profile -match "Public" -or $_.Profile -eq "Any" }
    $privateRules = Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True |
        Where-Object { $_.Profile -match "Private" -or $_.Profile -eq "Any" }

    $newlyExposed = $privateRules | Where-Object {
        $_.InstanceID -notin $publicRules.InstanceID
    }

    Write-Host "  Rules that ACTIVATE when switching Public → Private: $($newlyExposed.Count)"
    foreach ($rule in $newlyExposed) {
        $pf = $rule | Get-NetFirewallPortFilter
        Write-Host "    $($rule.DisplayName) — $($pf.Protocol):$($pf.LocalPort)" -ForegroundColor Red
    }
}

Get-ServiceExposureByProfile
```

---

## 5. CIS Benchmark Compliance Checks

### CIS Windows 10/11 — Network Profile Security Controls

```powershell
function Test-CISNetworkCompliance {
    <#
    .SYNOPSIS
        Check compliance against CIS Benchmark recommendations
        for Windows network profile security.
    #>

    $findings = @()

    # CIS 9.1.1 — Domain Profile: Ensure firewall is ON
    $domainFW = (Get-NetFirewallProfile -Name Domain).Enabled
    $findings += [PSCustomObject]@{
        CIS_ID   = "9.1.1"
        Check    = "Domain Profile Firewall Enabled"
        Status   = if ($domainFW) { "PASS" } else { "FAIL" }
        Current  = $domainFW
        Required = $true
        Severity = "Critical"
    }

    # CIS 9.1.2 — Domain Profile: Default inbound = Block
    $domainInbound = (Get-NetFirewallProfile -Name Domain).DefaultInboundAction
    $findings += [PSCustomObject]@{
        CIS_ID   = "9.1.2"
        Check    = "Domain Profile Default Inbound Action"
        Status   = if ($domainInbound -eq "Block") { "PASS" } else { "FAIL" }
        Current  = $domainInbound
        Required = "Block"
        Severity = "Critical"
    }

    # CIS 9.2.1 — Private Profile: Ensure firewall is ON
    $privateFW = (Get-NetFirewallProfile -Name Private).Enabled
    $findings += [PSCustomObject]@{
        CIS_ID   = "9.2.1"
        Check    = "Private Profile Firewall Enabled"
        Status   = if ($privateFW) { "PASS" } else { "FAIL" }
        Current  = $privateFW
        Required = $true
        Severity = "Critical"
    }

    # CIS 9.2.2 — Private Profile: Default inbound = Block
    $privateInbound = (Get-NetFirewallProfile -Name Private).DefaultInboundAction
    $findings += [PSCustomObject]@{
        CIS_ID   = "9.2.2"
        Check    = "Private Profile Default Inbound Action"
        Status   = if ($privateInbound -eq "Block") { "PASS" } else { "FAIL" }
        Current  = $privateInbound
        Required = "Block"
        Severity = "Critical"
    }

    # CIS 9.3.1 — Public Profile: Ensure firewall is ON
    $publicFW = (Get-NetFirewallProfile -Name Public).Enabled
    $findings += [PSCustomObject]@{
        CIS_ID   = "9.3.1"
        Check    = "Public Profile Firewall Enabled"
        Status   = if ($publicFW) { "PASS" } else { "FAIL" }
        Current  = $publicFW
        Required = $true
        Severity = "Critical"
    }

    # CIS 9.3.2 — Public Profile: Default inbound = Block
    $publicInbound = (Get-NetFirewallProfile -Name Public).DefaultInboundAction
    $findings += [PSCustomObject]@{
        CIS_ID   = "9.3.2"
        Check    = "Public Profile Default Inbound Action"
        Status   = if ($publicInbound -eq "Block") { "PASS" } else { "FAIL" }
        Current  = $publicInbound
        Required = "Block"
        Severity = "Critical"
    }

    # CIS 9.3.7 — Public Profile: Apply local firewall rules = No
    # Prevents users from creating exceptions in Public profile
    $publicLocalRules = (Get-NetFirewallProfile -Name Public).AllowLocalFirewallRules
    $findings += [PSCustomObject]@{
        CIS_ID   = "9.3.7"
        Check    = "Public Profile Local Firewall Rules"
        Status   = if (-not $publicLocalRules) { "PASS" } else { "FAIL" }
        Current  = $publicLocalRules
        Required = $false
        Severity = "High"
    }

    # CIS 18.4.4 — Disable LLMNR
    $llmnrPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient"
    $llmnr = (Get-ItemProperty $llmnrPath -Name EnableMulticast -ErrorAction SilentlyContinue).EnableMulticast
    $findings += [PSCustomObject]@{
        CIS_ID   = "18.4.4"
        Check    = "LLMNR Disabled"
        Status   = if ($llmnr -eq 0) { "PASS" } else { "FAIL" }
        Current  = if ($null -eq $llmnr) { "Not Set (Enabled)" } else { $llmnr }
        Required = 0
        Severity = "High"
    }

    # CIS 18.4.6 — Disable NBT-NS (NetBIOS over TCP/IP)
    $adapters = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter "IPEnabled=True"
    $nbtStatus = @()
    foreach ($adapter in $adapters) {
        $nbtSetting = $adapter.TcpipNetbios
        $nbtStatus += [PSCustomObject]@{
            Adapter = $adapter.Description
            NBT     = switch ($nbtSetting) { 0 {"Default"} 1 {"Enabled"} 2 {"Disabled"} }
        }
    }
    $nbtEnabled = $nbtStatus | Where-Object { $_.NBT -ne "Disabled" }
    $findings += [PSCustomObject]@{
        CIS_ID   = "18.4.6"
        Check    = "NetBIOS over TCP/IP Disabled"
        Status   = if ($nbtEnabled.Count -eq 0) { "PASS" } else { "FAIL" }
        Current  = "$($nbtEnabled.Count) adapters with NBT enabled"
        Required = "0 adapters"
        Severity = "High"
    }

    # CIS 18.5.21.1 — Disable WPAD (Web Proxy Auto-Discovery)
    $wpadPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\Wpad"
    $wpad = (Get-ItemProperty $wpadPath -Name WpadOverride -ErrorAction SilentlyContinue).WpadOverride
    $winhttpPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings"
    $autoDetect = (Get-ItemProperty $winhttpPath -Name AutoDetect -ErrorAction SilentlyContinue).AutoDetect
    $findings += [PSCustomObject]@{
        CIS_ID   = "18.5.21.1"
        Check    = "WPAD Auto-Detect Disabled"
        Status   = if ($autoDetect -eq 0) { "PASS" } else { "FAIL" }
        Current  = if ($null -eq $autoDetect) { "Not Set (Enabled)" } else { $autoDetect }
        Required = 0
        Severity = "High"
    }

    # SMB1 disabled check
    $smb1 = (Get-SmbServerConfiguration).EnableSMB1Protocol
    $findings += [PSCustomObject]@{
        CIS_ID   = "Custom"
        Check    = "SMB1 Protocol Disabled"
        Status   = if (-not $smb1) { "PASS" } else { "FAIL" }
        Current  = $smb1
        Required = $false
        Severity = "Critical"
    }

    # Print results
    Write-Host "`n=== CIS BENCHMARK COMPLIANCE REPORT ===" -ForegroundColor Cyan
    $findings | Format-Table CIS_ID, Check, Status, Current, Required, Severity -AutoSize

    $failCount = ($findings | Where-Object { $_.Status -eq "FAIL" }).Count
    $totalCount = $findings.Count
    Write-Host "`nScore: $($totalCount - $failCount)/$totalCount passed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

    if ($failCount -gt 0) {
        Write-Host "`nFailed checks require remediation:" -ForegroundColor Yellow
        $findings | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
            Write-Host "  [$($_.Severity)] $($_.CIS_ID) — $($_.Check)" -ForegroundColor Red
        }
    }

    return $findings
}

Test-CISNetworkCompliance
```

---

## 6. Remediation Script (For Hardening Reports)

```powershell
function Set-NetworkProfileHardening {
    <#
    .SYNOPSIS
        Apply CIS-recommended network profile hardening.
        Requires administrator privileges.
        RUN ONLY WITH EXPLICIT AUTHORIZATION — this changes firewall rules.
    #>
    param(
        [switch]$WhatIf
    )

    $prefix = if ($WhatIf) { "[WHATIF] Would" } else { "[APPLY]" }

    # 1. Ensure all firewall profiles are enabled
    foreach ($profile in @("Domain", "Private", "Public")) {
        Write-Host "$prefix enable $profile firewall, set inbound=Block, outbound=Allow"
        if (-not $WhatIf) {
            Set-NetFirewallProfile -Name $profile -Enabled True `
                -DefaultInboundAction Block -DefaultOutboundAction Allow
        }
    }

    # 2. Disable LLMNR
    Write-Host "$prefix disable LLMNR (EnableMulticast=0)"
    if (-not $WhatIf) {
        $path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient"
        if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
        Set-ItemProperty -Path $path -Name "EnableMulticast" -Value 0
    }

    # 3. Disable NBT-NS on all adapters
    Write-Host "$prefix disable NetBIOS over TCP/IP on all adapters"
    if (-not $WhatIf) {
        $adapters = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter "IPEnabled=True"
        foreach ($adapter in $adapters) {
            $adapter.SetTcpipNetbios(2)  # 2 = Disabled
        }
    }

    # 4. Disable SMB1
    Write-Host "$prefix disable SMB1 protocol"
    if (-not $WhatIf) {
        Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
    }

    # 5. Disable WPAD auto-detect
    Write-Host "$prefix disable WPAD auto-detection"
    if (-not $WhatIf) {
        $path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings"
        Set-ItemProperty -Path $path -Name "AutoDetect" -Value 0
    }

    # 6. Block local firewall rule creation on Public profile
    Write-Host "$prefix block local firewall rules on Public profile"
    if (-not $WhatIf) {
        Set-NetFirewallProfile -Name Public -AllowLocalFirewallRules False
    }

    # 7. Enable firewall logging for all profiles
    foreach ($profile in @("Domain", "Private", "Public")) {
        Write-Host "$prefix enable firewall logging for $profile"
        if (-not $WhatIf) {
            $logFile = "%SystemRoot%\System32\LogFiles\Firewall\pfirewall.log"
            Set-NetFirewallProfile -Name $profile `
                -LogFileName $logFile `
                -LogMaxSizeKilobytes 16384 `
                -LogAllowed True `
                -LogBlocked True
        }
    }

    Write-Host "`nHardening complete. Re-run Test-CISNetworkCompliance to verify." -ForegroundColor Green
}

# Dry run first:
# Set-NetworkProfileHardening -WhatIf

# Apply:
# Set-NetworkProfileHardening
```

---

## 7. Quick Reference — Attack Opportunities by Profile

```
CURRENT PROFILE    ATTACK OPPORTUNITY
──────────────────────────────────────────────────────────────────
Public             Most restricted. Focus on:
                   - LLMNR/NBT-NS poisoning (works on ALL profiles)
                   - WPAD hijack (if auto-detect enabled)
                   - Force profile change via gateway MAC cloning
                   - IPv6 RA attack (often unmonitored)

Private            Medium restriction. Gains:
                   - SMB access (enumerate shares, relay attacks)
                   - Network Discovery (find all hosts)
                   - WMI remote access (lateral movement)
                   - ICMPv4 Echo (host discovery)

Domain             Most permissive. Gains:
                   - WinRM (remote PowerShell execution)
                   - RDP (if enabled by GPO)
                   - Full SMB + named pipes
                   - Remote registry access
                   - DCOM/WMI unrestricted
                   - RPC endpoint mapper
```

---

*The network profile is the gate. Know which gate is open, and you know which castle to enter. — Rush, GS-17*
