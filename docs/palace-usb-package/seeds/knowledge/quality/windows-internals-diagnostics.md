# Windows Internals for Diagnostics — Wiz v3 Seed

> Computer Wiz (Royal Guard — The Diagnostician)
> Seed Class: Quality / Windows Internals
> Version: 3.0 — Full Software + Hardware Diagnostic Coverage
> Created: 2026-03-09

---

## 1. Philosophy: Windows Is a Black Box Until You Know Where to Look

Most developers treat Windows as "the thing that runs my code." Wiz treats it as a diagnostic instrument. Every crash, every slow boot, every mysterious service failure leaves traces — in the registry, in event logs, in WMI. This seed teaches you where to look and what to look for.

**Target Systems:** Windows 10 Pro (Stone AI dev), Windows 11 Pro (OMEN 45L)

---

## 2. Registry Deep Knowledge

### 2.1 Registry Hive Structure

```
HKEY_LOCAL_MACHINE (HKLM) — System-wide settings (all users)
├── HARDWARE     — Hardware descriptions (populated at boot, volatile)
├── SAM          — Security Account Manager (user accounts, locked)
├── SECURITY     — Security policies (locked)
├── SOFTWARE     — Installed software, system config
│   ├── Microsoft\Windows\CurrentVersion  — Windows config hub
│   ├── Microsoft\Windows NT\CurrentVersion — OS version info
│   └── Policies  — Group Policy settings
└── SYSTEM       — Boot config, drivers, services
    ├── CurrentControlSet  — Active hardware/driver config
    ├── Select    — Which ControlSet is active
    └── Setup     — Installation info

HKEY_CURRENT_USER (HKCU) — Current user's settings
├── SOFTWARE     — Per-user app settings
│   ├── Microsoft\Windows\CurrentVersion\Run  — User startup programs
│   └── Classes  — File associations for this user
├── Environment  — User environment variables
└── Control Panel — Display, mouse, keyboard preferences

HKEY_CLASSES_ROOT (HKCR) — Merged view of HKLM\SOFTWARE\Classes + HKCU\SOFTWARE\Classes
HKEY_USERS (HKU) — All loaded user profiles
HKEY_CURRENT_CONFIG (HKCC) — Current hardware profile (rarely useful)
```

### 2.2 Diagnostically Important Registry Keys

```powershell
# OS Version and Build
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" | Select-Object ProductName, DisplayVersion, CurrentBuild, UBR

# Installed Programs (64-bit)
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" | Select-Object DisplayName, DisplayVersion, InstallDate | Sort-Object DisplayName

# Installed Programs (32-bit on 64-bit OS)
Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" | Select-Object DisplayName, DisplayVersion, InstallDate | Sort-Object DisplayName

# Startup Programs (Machine-wide)
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Startup Programs (Current User)
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Last Shutdown Time
$bytes = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Windows").ShutdownTime
[DateTime]::FromFileTime([BitConverter]::ToInt64($bytes, 0))

# Environment Variables (System)
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment"

# Environment Variables (User)
Get-ItemProperty "HKCU:\Environment"

# Network Interfaces
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\*" | Select-Object PSChildName, IPAddress, SubnetMask, DefaultGateway, DhcpIPAddress

# USB Device History
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Enum\USB\*\*" | Select-Object DeviceDesc, Mfg, Service | Where-Object DeviceDesc

# Windows Defender Status
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows Defender" -ErrorAction SilentlyContinue

# Crash Dump Settings
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\CrashControl"
```

### 2.3 Registry Diagnostics Decision Tree

```
SYMPTOM: "App won't start and worked yesterday"
│
├─ Check if app was uninstalled or updated:
│  reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" /s /f "<appname>"
│
├─ Check if startup entry was removed:
│  reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
│
├─ Check if file association broke:
│  assoc .<ext>
│  ftype <type>
│
└─ Check if Group Policy blocked it:
   reg query "HKLM\SOFTWARE\Policies" /s /f "<appname>"
   gpresult /h gpresult.html && start gpresult.html

SYMPTOM: "Environment variable not persisting after reboot"
│
├─ Was it set as USER or SYSTEM?
│  reg query "HKCU\Environment" /v <VARNAME>
│  reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v <VARNAME>
│
├─ Is it being overwritten by login script or Group Policy?
│  Check: gpresult /h gpresult.html
│
└─ Was it set with setx (permanent) vs set (session only)?
   setx creates registry entry. set does not.
```

### 2.4 Registry Safety Rules

1. **NEVER edit HKLM\SYSTEM or HKLM\SAM without a backup.** One wrong key = unbootable system.
2. **Always export before modifying:** `reg export "HKLM\SOFTWARE\KeyPath" backup.reg`
3. **HKCU is safer than HKLM** — worst case you break one user profile.
4. **WOW6432Node** — 32-bit apps on 64-bit Windows have their keys here. Always check both.
5. **Registry changes often need a reboot or service restart** to take effect.

---

## 3. Windows Services Architecture

### 3.1 Service Control Manager (SCM)

The SCM (services.exe) is the master process that starts, stops, and manages all Windows services. Understanding SCM is critical for diagnosing service failures.

```powershell
# All services with full details
Get-Service | Format-Table Name, Status, StartType, DisplayName -AutoSize

# Services in specific states
Get-Service | Where-Object Status -eq "Stopped" | Where-Object StartType -eq "Automatic"
# ^ These SHOULD be running but aren't — investigate!

# Service account information
Get-CimInstance Win32_Service | Select-Object Name, State, StartMode, StartName | Sort-Object State

# Service binary path (check for hijacking or misconfiguration)
Get-CimInstance Win32_Service | Select-Object Name, PathName | Where-Object { $_.Name -like "*postgres*" }

# Failed services (services that tried to start and failed)
Get-CimInstance Win32_Service | Where-Object { $_.State -eq "Stopped" -and $_.StartMode -eq "Auto" } | Select-Object Name, DisplayName, State, StartMode, StartName
```

### 3.2 Service Types

| Type | Description | Example |
|------|-------------|---------|
| Win32OwnProcess | Runs in its own process | PostgreSQL, Docker Desktop Service |
| Win32ShareProcess | Shares svchost.exe | Many Windows built-in services |
| KernelDriver | Kernel-mode driver | Disk drivers, network drivers |
| FileSystemDriver | File system filter | Antivirus real-time scanning |
| InteractiveProcess | Can interact with desktop | Deprecated in modern Windows |

### 3.3 Service Recovery Configuration

```powershell
# View recovery options for a service
sc qfailure "postgresql-x64-16"
# Output shows:
# RESET_PERIOD : 86400 (seconds before failure count resets)
# REBOOT_MSG : (message before reboot action)
# COMMAND_LINE : (command to run on failure)
# FAILURE_ACTIONS:
#   1st failure: RESTART (restart the service)
#   2nd failure: RESTART
#   3rd failure: RUN PROCESS (run a command) or NONE

# Set recovery options
sc failure "postgresql-x64-16" reset= 86400 actions= restart/60000/restart/60000/restart/60000
# Actions format: action/delay_ms  (restart after 60 seconds, 3 times)

# Stone AI recommended recovery for critical services:
# PostgreSQL: restart/30000/restart/60000/restart/120000 (30s, 60s, 120s)
# Docker: restart/10000/restart/30000/restart/60000
# Redis: restart/5000/restart/15000/restart/30000
```

### 3.4 Service Debugging

```powershell
# Service won't start — check error
Start-Service "postgresql-x64-16" -ErrorAction SilentlyContinue
$error[0] | Format-List *

# Check service events in Event Log
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'; Level=2} -MaxEvents 20 | Format-Table TimeCreated, Id, Message -Wrap

# Service dependency chain
sc enumdepend "postgresql-x64-16" 255

# Service is stuck in "Starting" or "Stopping"
# Find PID and kill it
$svc = Get-CimInstance Win32_Service | Where-Object { $_.Name -eq "ServiceName" }
Stop-Process -Id $svc.ProcessId -Force
# Then: sc config "ServiceName" start= demand  (set to manual to prevent restart loop)

# Service crashed — check for dump
dir "$env:LOCALAPPDATA\CrashDumps" -Recurse
dir "C:\Windows\Minidump"
```

---

## 4. Event Viewer Mastery

### 4.1 Event Log Structure

```
Windows Logs/
├── Application    — App crashes, errors, Prisma/Node failures
├── Security       — Login attempts, privilege escalation, audit
├── System         — Driver failures, service events, hardware
├── Setup          — Windows Update, feature installations
└── Forwarded Events — Events forwarded from other machines

Applications and Services Logs/
├── Microsoft/Windows/
│   ├── TaskScheduler    — Scheduled task runs/failures
│   ├── WindowsUpdateClient — Update status
│   ├── PowerShell       — PS script execution
│   ├── Hyper-V*         — WSL2/Docker backend
│   └── DNS Client Events
└── Docker                — Docker Desktop events
```

### 4.2 Critical Event IDs to Monitor

| Event ID | Log | Source | Meaning |
|----------|-----|--------|---------|
| 1000 | Application | Application Error | Application crash |
| 1001 | Application | Windows Error Reporting | Crash bucket details |
| 1002 | Application | Application Hang | Application stopped responding |
| 7000 | System | Service Control Manager | Service failed to start |
| 7001 | System | Service Control Manager | Service dependency failed |
| 7009 | System | Service Control Manager | Service timeout on start |
| 7022 | System | Service Control Manager | Service hung on start |
| 7023 | System | Service Control Manager | Service terminated with error |
| 7031 | System | Service Control Manager | Service crashed unexpectedly |
| 7034 | System | Service Control Manager | Service crashed unexpectedly (no recovery) |
| 7036 | System | Service Control Manager | Service entered running/stopped state |
| 41 | System | Kernel-Power | Unexpected shutdown (power loss/crash) |
| 1074 | System | User32 | Clean shutdown/restart initiated |
| 6008 | System | EventLog | Unexpected shutdown (previous) |
| 4624 | Security | Microsoft-Windows-Security-Auditing | Successful login |
| 4625 | Security | Microsoft-Windows-Security-Auditing | Failed login |
| 4648 | Security | Microsoft-Windows-Security-Auditing | Login with explicit credentials |
| 4672 | Security | Microsoft-Windows-Security-Auditing | Admin privileges assigned |
| 1 | System | BugCheck | BSOD occurred |
| 6013 | System | EventLog | System uptime |

### 4.3 PowerShell Event Log Queries

```powershell
# Recent application errors
Get-WinEvent -FilterHashtable @{LogName='Application'; Level=2} -MaxEvents 20 | Format-Table TimeCreated, Id, ProviderName, Message -Wrap

# Recent system errors
Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 20 | Format-Table TimeCreated, Id, ProviderName, Message -Wrap

# Application crashes in last 24 hours
Get-WinEvent -FilterHashtable @{LogName='Application'; Id=1000; StartTime=(Get-Date).AddDays(-1)} | Format-Table TimeCreated, Message -Wrap

# Service failures in last 24 hours
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'; Level=2; StartTime=(Get-Date).AddDays(-1)} | Format-Table TimeCreated, Id, Message -Wrap

# Failed login attempts
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 10 | Format-Table TimeCreated, Message -Wrap

# BSOD events
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-WER-SystemErrorReporting'} -MaxEvents 5 | Format-Table TimeCreated, Message -Wrap

# Search events by keyword
Get-WinEvent -FilterHashtable @{LogName='Application'} -MaxEvents 1000 | Where-Object { $_.Message -like "*postgres*" } | Format-Table TimeCreated, Id, Message -Wrap

# Export events to CSV for analysis
Get-WinEvent -FilterHashtable @{LogName='Application'; Level=2; StartTime=(Get-Date).AddDays(-7)} | Export-Csv "app-errors-7days.csv" -NoTypeInformation

# Critical + Error events across all main logs
$logs = @('Application','System','Security')
foreach ($log in $logs) {
    Write-Host "=== $log ===" -ForegroundColor Yellow
    Get-WinEvent -FilterHashtable @{LogName=$log; Level=1,2; StartTime=(Get-Date).AddHours(-6)} -MaxEvents 10 -ErrorAction SilentlyContinue | Format-Table TimeCreated, Id, LevelDisplayName, Message -Wrap
}
```

### 4.4 Event Log Analysis Strategy

```
DIAGNOSTIC SCENARIO: "Something broke, when and why?"
│
├─ 1. Establish timeline
│  ├─ When did it last work? When did it break?
│  ├─ Get-WinEvent with StartTime/EndTime to bracket the window
│  └─ Look for the FIRST error in the sequence (root cause, not cascade)
│
├─ 2. Correlate across logs
│  ├─ Application error at 14:05 → check System log at 14:04-14:06
│  ├─ Service crash → check if driver failed first
│  ├─ Security audit failure → check if user account changed
│  └─ Multiple applications crashing → system-level issue (driver, memory, disk)
│
├─ 3. Identify patterns
│  ├─ Same error repeating on a schedule → scheduled task or cron job
│  ├─ Errors every morning → related to login/startup
│  ├─ Errors under load → resource exhaustion
│  └─ Errors random → hardware (intermittent), race condition, or external dependency
│
└─ 4. Resolution
   ├─ Google the Event ID + Source (Microsoft docs are comprehensive)
   ├─ Check the "Details" tab (XML view has more info than "General")
   └─ Event ID 1000: the faulting module name tells you what crashed
```

---

## 5. WMI Queries for System Information

### 5.1 Essential WMI Queries

```powershell
# Full system summary
Get-CimInstance Win32_ComputerSystem | Select-Object Name, Manufacturer, Model, TotalPhysicalMemory, NumberOfProcessors, NumberOfLogicalProcessors

# OS details
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber, OSArchitecture, LastBootUpTime, FreePhysicalMemory, TotalVisibleMemorySize

# CPU details
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed, CurrentClockSpeed, LoadPercentage

# GPU details
Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion, DriverDate, VideoProcessor, Status

# Disk drives (physical)
Get-CimInstance Win32_DiskDrive | Select-Object Model, Size, MediaType, Status, InterfaceType

# Disk partitions with free space
Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, FileSystem, @{N='SizeGB';E={[math]::Round($_.Size/1GB,1)}}, @{N='FreeGB';E={[math]::Round($_.FreeSpace/1GB,1)}}, @{N='%Free';E={[math]::Round($_.FreeSpace/$_.Size*100,1)}}

# Network adapters (active only)
Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object IPEnabled | Select-Object Description, IPAddress, IPSubnet, DefaultIPGateway, DNSServerSearchOrder, DHCPEnabled

# RAM modules (for upgrade planning)
Get-CimInstance Win32_PhysicalMemory | Select-Object BankLabel, Capacity, Speed, Manufacturer, PartNumber

# System temperatures (if WMI supports it)
Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" -ErrorAction SilentlyContinue | Select-Object InstanceName, @{N='TempC';E={($_.CurrentTemperature / 10) - 273.15}}

# Battery status (laptops)
Get-CimInstance Win32_Battery | Select-Object Name, EstimatedChargeRemaining, BatteryStatus

# Startup programs
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location, User

# BIOS info
Get-CimInstance Win32_BIOS | Select-Object Manufacturer, Name, Version, ReleaseDate, SerialNumber

# Motherboard info
Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer, Product, SerialNumber

# Uptime
$os = Get-CimInstance Win32_OperatingSystem
$uptime = (Get-Date) - $os.LastBootUpTime
"Uptime: $($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"
```

### 5.2 WMI for Process Diagnostics

```powershell
# Processes with their command lines and memory usage
Get-CimInstance Win32_Process | Select-Object Name, ProcessId, ParentProcessId, CommandLine, @{N='MB';E={[math]::Round($_.WorkingSetSize/1MB,1)}} | Sort-Object MB -Descending | Select-Object -First 20

# Find processes by parent (process tree)
$parentId = (Get-Process -Name "node").Id[0]
Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $parentId } | Select-Object Name, ProcessId, CommandLine

# Process creation events (real-time monitoring)
# Requires admin
Register-CimIndicationEvent -Query "SELECT * FROM Win32_ProcessStartTrace" -Action { Write-Host "Process started: $($event.SourceEventArgs.NewEvent.ProcessName) (PID: $($event.SourceEventArgs.NewEvent.ProcessID))" }
```

---

## 6. Scheduled Tasks Analysis

```powershell
# List all scheduled tasks (non-Microsoft)
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike "\Microsoft\*" } | Select-Object TaskName, State, TaskPath | Format-Table -AutoSize

# Task details with last run result
Get-ScheduledTask | Where-Object { $_.State -ne "Disabled" } | Get-ScheduledTaskInfo | Select-Object TaskName, LastRunTime, LastTaskResult, NextRunTime, NumberOfMissedRuns | Sort-Object LastRunTime -Descending

# LastTaskResult codes:
# 0 (0x0)     = Success
# 1 (0x1)     = Incorrect function (often means wrong executable path)
# 2 (0x2)     = File not found
# 267009      = Task is running
# 267011      = Task has not run yet
# 2147750687  = Task was terminated by user
# -2147024891 = Access denied

# Task history (Event Log)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-TaskScheduler/Operational'} -MaxEvents 50 | Format-Table TimeCreated, Id, Message -Wrap

# Find tasks running as SYSTEM (potential security concern)
Get-ScheduledTask | ForEach-Object {
    $principal = $_.Principal
    if ($principal.UserId -eq "SYSTEM" -or $principal.UserId -eq "S-1-5-18") {
        [PSCustomObject]@{
            Name = $_.TaskName
            Path = $_.TaskPath
            User = $principal.UserId
            State = $_.State
        }
    }
}

# Create a diagnostic task (useful for testing)
# $action = New-ScheduledTaskAction -Execute "PowerShell" -Argument "-Command 'Get-Date >> C:\temp\tasktest.txt'"
# $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)
# Register-ScheduledTask -TaskName "WizDiagTest" -Action $action -Trigger $trigger -RunLevel Highest
```

---

## 7. Driver Analysis

### 7.1 Driver Enumeration and Status

```powershell
# All drivers with status
driverquery /v /fo csv | ConvertFrom-Csv | Select-Object "Display Name", "Start Mode", State, Status, "Link Date" | Sort-Object State

# Only running drivers
driverquery /v /fo csv | ConvertFrom-Csv | Where-Object { $_.State -eq "Running" } | Select-Object "Display Name", "Start Mode", "Link Date"

# Problem devices (devices with issues)
Get-CimInstance Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 } | Select-Object Name, DeviceID, ConfigManagerErrorCode

# ConfigManagerErrorCode meanings:
# 0  = Working properly
# 1  = Not configured correctly
# 3  = Driver might be corrupted
# 10 = Device cannot start
# 12 = Not enough resources
# 14 = Need restart
# 22 = Disabled
# 28 = Drivers not installed
# 31 = Not working properly (Windows can't load needed drivers)

# GPU driver details (critical for Stone AI OMEN with RTX 5090)
Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion, DriverDate, Status, AdapterRAM, VideoProcessor

# Network driver details
Get-NetAdapter | Select-Object Name, InterfaceDescription, DriverVersion, DriverDate, Status, LinkSpeed

# Disk driver info
Get-Disk | Select-Object Number, FriendlyName, OperationalStatus, HealthStatus, Size

# Driver files for a specific device
Get-WindowsDriver -Online | Where-Object { $_.OriginalFileName -like "*nvidia*" } | Select-Object Driver, OriginalFileName, Date, Version
```

### 7.2 Driver Troubleshooting Decision Tree

```
SYMPTOM: Device not working / Yellow triangle in Device Manager
│
├─ Check error code:
│  Get-CimInstance Win32_PnPEntity | Where-Object { $_.Name -like "*device*" }
│  └─ .ConfigManagerErrorCode tells you exactly what's wrong
│
├─ Code 28 (No driver installed)
│  ├─ Windows Update: Settings → Update → Check for Updates
│  ├─ Manufacturer website: download driver
│  └─ Device ID: use it to search for driver
│     Get-CimInstance Win32_PnPEntity | Select DeviceID | Where-Object { ... }
│
├─ Code 10 (Device cannot start)
│  ├─ Driver conflict: check Event Viewer System log
│  ├─ Try: Disable → Enable device
│  ├─ Try: Uninstall driver → Scan for hardware changes
│  └─ Try: Roll back driver (if recent update)
│
├─ Code 31 (Not working properly)
│  ├─ Usually driver corruption
│  ├─ Uninstall completely → reinstall
│  └─ Check for conflicting software (multiple GPU drivers, etc.)
│
└─ Driver crash (BSOD)
   ├─ Check minidump for faulting driver name
   ├─ Update to latest driver from manufacturer (NOT Windows Update)
   └─ If latest driver crashes: roll back to previous version
```

---

## 8. Windows Update Troubleshooting

### 8.1 Update Status and History

```powershell
# Check update status
Get-WindowsUpdate -ErrorAction SilentlyContinue
# If module not available:
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 20 Description, HotFixID, InstalledOn

# Pending updates
Get-CimInstance -ClassName Win32_QuickFixEngineering | Sort-Object InstalledOn -Descending | Select-Object -First 10

# Windows Update log (Win10+, generates from ETL traces)
Get-WindowsUpdateLog
# Output: ~/Desktop/WindowsUpdate.log

# Update service status
Get-Service wuauserv, bits, cryptsvc, msiserver | Select-Object Name, Status, StartType

# Check if restart is pending
$pendingReboot = @(
    Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending"
    Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired"
    (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" -Name PendingFileRenameOperations -ErrorAction SilentlyContinue) -ne $null
)
if ($pendingReboot -contains $true) { "REBOOT PENDING" } else { "No reboot pending" }
```

### 8.2 Common Update Fixes

```powershell
# Reset Windows Update components (admin required)
# Stop services
Stop-Service wuauserv, bits, cryptsvc, msiserver -Force

# Clear update cache
Remove-Item "C:\Windows\SoftwareDistribution\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Windows\System32\catroot2\*" -Recurse -Force -ErrorAction SilentlyContinue

# Re-register DLLs
regsvr32 /s wuaueng.dll
regsvr32 /s wuapi.dll
regsvr32 /s wups.dll
regsvr32 /s wups2.dll

# Restart services
Start-Service wuauserv, bits, cryptsvc, msiserver

# DISM repair (fixes component store corruption)
DISM /Online /Cleanup-Image /RestoreHealth

# System file checker
sfc /scannow
```

---

## 9. BSOD Analysis

### 9.1 Minidump Reading

```powershell
# Check for recent crash dumps
dir C:\Windows\Minidump\ -ErrorAction SilentlyContinue
dir C:\Windows\MEMORY.DMP -ErrorAction SilentlyContinue

# Quick BSOD history from Event Log
Get-WinEvent -FilterHashtable @{LogName='System'; Id=1001; ProviderName='Microsoft-Windows-WER-SystemErrorReporting'} -MaxEvents 10 -ErrorAction SilentlyContinue | ForEach-Object {
    [PSCustomObject]@{
        Time = $_.TimeCreated
        BugCheck = ($_.Properties[0].Value)
        Parameter1 = ($_.Properties[1].Value)
        Parameter2 = ($_.Properties[2].Value)
        Parameter3 = ($_.Properties[3].Value)
        Parameter4 = ($_.Properties[4].Value)
    }
}

# Alternative: BugCheck events
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-WER-SystemErrorReporting'} -MaxEvents 5 | Format-Table TimeCreated, Message -Wrap

# For detailed analysis, use WinDbg (Windows Debugging Tools):
# windbg -z C:\Windows\Minidump\MMDDYY-XXXXX-01.dmp
# In WinDbg: !analyze -v
```

### 9.2 Common BSOD Stop Codes

| Stop Code | Name | Common Cause | Fix |
|-----------|------|-------------|-----|
| 0x0000000A | IRQL_NOT_LESS_OR_EQUAL | Driver accessing invalid memory | Update/rollback driver |
| 0x0000001E | KMODE_EXCEPTION_NOT_HANDLED | Driver crash | Identify faulting driver from dump |
| 0x00000024 | NTFS_FILE_SYSTEM | NTFS driver error, disk corruption | `chkdsk /f /r`, check disk health |
| 0x0000003B | SYSTEM_SERVICE_EXCEPTION | System service fault | Usually driver. Check minidump |
| 0x00000050 | PAGE_FAULT_IN_NONPAGED_AREA | Bad RAM or driver | Run memtest86, update drivers |
| 0x0000007E | SYSTEM_THREAD_EXCEPTION_NOT_HANDLED | Driver exception | Update/remove faulting driver |
| 0x0000009F | DRIVER_POWER_STATE_FAILURE | Driver can't handle power state change | Update power management drivers |
| 0x000000C2 | BAD_POOL_CALLER | Driver pool allocation error | Update/remove faulting driver |
| 0x000000D1 | DRIVER_IRQL_NOT_LESS_OR_EQUAL | Driver accessing paged memory at high IRQL | Update/rollback network or storage driver |
| 0x000000EF | CRITICAL_PROCESS_DIED | Critical system process crashed | sfc /scannow, DISM repair |
| 0x00000116 | VIDEO_TDR_FAILURE | GPU driver timed out | Update GPU driver, check thermals |
| 0x00000133 | DPC_WATCHDOG_VIOLATION | DPC routine took too long | Usually storage driver. Update firmware |
| 0x0000013A | KERNEL_MODE_HEAP_CORRUPTION | Kernel heap corruption | Usually driver bug. Update all |
| 0x000001CA | SYNTHETIC_WATCHDOG_TIMEOUT | Watchdog timeout | Often VM/hypervisor related |
| 0xC0000221 | STATUS_IMAGE_CHECKSUM_MISMATCH | Corrupt system file | sfc /scannow, DISM repair |

### 9.3 BSOD Diagnostic Decision Tree

```
BSOD OCCURRED
│
├─ 1. Frequency?
│  ├─ Once → Note it, monitor. Could be cosmic ray (seriously).
│  ├─ Occasional (weekly) → Start investigating
│  └─ Frequent (daily+) → Critical. Investigate immediately.
│
├─ 2. When does it happen?
│  ├─ At boot → Driver loaded early in boot. Safe Mode test.
│  ├─ Under load → Thermal, PSU, or driver under stress
│  ├─ During sleep/wake → Power management driver
│  ├─ During specific app → App's kernel driver (antivirus, VM)
│  └─ Random → RAM (run memtest86), SSD (check SMART), driver
│
├─ 3. Read the dump:
│  ├─ Get stop code and parameters from Event Viewer
│  ├─ Look up stop code in table above
│  ├─ If dump mentions a .sys file → that's the faulting driver
│  │  ├─ Google: "<filename>.sys BSOD" for specific guidance
│  │  └─ Update or rollback that driver
│  └─ If dump mentions ntoskrnl.exe → usually means the REAL culprit passed
│     a bad value to the kernel. Look at stack trace for the actual driver.
│
├─ 4. Quick fixes to try:
│  ├─ sfc /scannow (repair system files)
│  ├─ DISM /Online /Cleanup-Image /RestoreHealth
│  ├─ Update ALL drivers (especially GPU, NIC, storage)
│  ├─ Check RAM: mdsched.exe (Windows Memory Diagnostic) or memtest86
│  ├─ Check disk: chkdsk /f /r
│  └─ Check thermals: HWMonitor or HWiNFO64
│
└─ 5. Nuclear options:
   ├─ Driver Verifier (verifier.exe) — stresses drivers to find bugs
   │  WARNING: This WILL cause BSODs on buggy drivers. That's the point.
   │  Only enable on suspected drivers, not all.
   ├─ Clean boot: msconfig → Diagnostic startup
   └─ In-place upgrade (repair install): preserves apps and data
```

---

## 10. PowerShell Diagnostic Toolkit

### 10.1 System Health Quick Check Script

```powershell
# Stone AI Wiz — System Health Quick Check
Write-Host "=== SYSTEM HEALTH CHECK ===" -ForegroundColor Cyan

# Uptime
$os = Get-CimInstance Win32_OperatingSystem
$uptime = (Get-Date) - $os.LastBootUpTime
Write-Host "`nUptime: $($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m" -ForegroundColor $(if ($uptime.Days -gt 7) { "Yellow" } else { "Green" })

# Memory
$totalMB = [math]::Round($os.TotalVisibleMemorySize/1KB)
$freeMB = [math]::Round($os.FreePhysicalMemory/1KB)
$usedPct = [math]::Round(($totalMB - $freeMB) / $totalMB * 100)
Write-Host "Memory: ${usedPct}% used (${freeMB}MB free of ${totalMB}MB)" -ForegroundColor $(if ($usedPct -gt 90) { "Red" } elseif ($usedPct -gt 75) { "Yellow" } else { "Green" })

# Disk
Get-CimInstance Win32_LogicalDisk | Where-Object DriveType -eq 3 | ForEach-Object {
    $pctFree = [math]::Round($_.FreeSpace/$_.Size*100,1)
    Write-Host "Disk $($_.DeviceID): ${pctFree}% free ($([math]::Round($_.FreeSpace/1GB,1))GB / $([math]::Round($_.Size/1GB,1))GB)" -ForegroundColor $(if ($pctFree -lt 10) { "Red" } elseif ($pctFree -lt 20) { "Yellow" } else { "Green" })
}

# CPU
$cpu = Get-CimInstance Win32_Processor
Write-Host "CPU: $($cpu.LoadPercentage)% load ($($cpu.Name))" -ForegroundColor $(if ($cpu.LoadPercentage -gt 90) { "Red" } elseif ($cpu.LoadPercentage -gt 70) { "Yellow" } else { "Green" })

# Top processes by memory
Write-Host "`nTop 5 by Memory:" -ForegroundColor Cyan
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $($_.Name): $([math]::Round($_.WorkingSet64/1MB))MB"
}

# Critical services
Write-Host "`nCritical Services:" -ForegroundColor Cyan
$services = @("postgresql*","docker*","Redis","wuauserv")
foreach ($svc in $services) {
    Get-Service -Name $svc -ErrorAction SilentlyContinue | ForEach-Object {
        $color = if ($_.Status -eq "Running") { "Green" } else { "Red" }
        Write-Host "  $($_.DisplayName): $($_.Status)" -ForegroundColor $color
    }
}

# Recent errors (last 2 hours)
$recentErrors = Get-WinEvent -FilterHashtable @{LogName='Application','System'; Level=1,2; StartTime=(Get-Date).AddHours(-2)} -MaxEvents 5 -ErrorAction SilentlyContinue
if ($recentErrors) {
    Write-Host "`nRecent Errors (2h):" -ForegroundColor Red
    $recentErrors | ForEach-Object { Write-Host "  [$($_.TimeCreated)] $($_.ProviderName): $($_.Message.Substring(0, [Math]::Min(100, $_.Message.Length)))..." }
} else {
    Write-Host "`nNo recent errors (2h)" -ForegroundColor Green
}

# Pending reboot
$reboot = (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending") -or (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired")
Write-Host "`nReboot Pending: $reboot" -ForegroundColor $(if ($reboot) { "Yellow" } else { "Green" })
```

### 10.2 Essential One-Liners for Wiz

```powershell
# Who's using the most CPU right now?
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, Id

# What crashed recently?
Get-WinEvent -FilterHashtable @{LogName='Application'; Id=1000} -MaxEvents 5 | Format-List TimeCreated, Message

# Is my disk dying? (SMART status)
Get-Disk | Select-Object Number, FriendlyName, HealthStatus, OperationalStatus

# What's my IP?
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object InterfaceAlias, IPAddress

# What's listening on what port?
Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess, @{N='Process';E={(Get-Process -Id $_.OwningProcess).Name}} | Sort-Object LocalPort

# Am I running as admin?
([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# System file integrity check (quick)
sfc /verifyonly

# Firewall status
Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction
```

---

## 11. Wiz Internal Note

This seed is the backbone of Windows diagnostics for the Palace. Every service failure, every crash, every "it was working yesterday" comes through these tools. The Event Viewer alone solves 60% of Windows mysteries — if you know what event IDs to look for. The registry tells you what changed. WMI tells you what the system looks like right now. Together, they give Wiz eyes into every layer of the Windows stack.

Pair this with `hardware-diagnostics.md` for the physical layer and `software-diagnostics-methodology.md` for the application layer. Full stack coverage.

---

*This seed gives Wiz mastery over the Windows operating system as a diagnostic platform. Every log, every registry key, every service state is evidence.*
