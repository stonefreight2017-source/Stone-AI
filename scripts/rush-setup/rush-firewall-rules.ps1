# Rush Setup - Firewall Rules
# Run as Administrator for full functionality
<#
.SYNOPSIS
    Creates the Rush-Pentest firewall rule group with common pentest ports.
.DESCRIPTION
    Creates inbound and outbound allow rules for common pentest ports,
    all tied to the "Rush-Pentest" group for easy toggle. A scheduled task
    reads a config file every 60s to enable/disable the group.
.PARAMETER Uninstall
    Removes all Rush-Pentest rules and the scheduled task.
#>
param([switch]$Uninstall)

# Self-elevate if not admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    $args = @('-ExecutionPolicy', 'Bypass', '-File', $MyInvocation.MyCommand.Path)
    if ($Uninstall) { $args += '-Uninstall' }
    Start-Process powershell.exe -ArgumentList $args -Verb RunAs -Wait
    exit $LASTEXITCODE
}

$ErrorActionPreference = "Stop"
$GroupName = "Rush-Pentest"
$ConfigPath = "C:\Users\$env:USERNAME\.rush\firewall-config.json"
$TaskName = "Rush-FirewallToggle"
$Ports = @(4444, 8080, 8443, 9090, 1080, 1234, 5555, 6666, 7777, 9999)

if ($Uninstall) {
    Write-Host '[RUSH] Removing Rush-Pentest firewall rules...' -ForegroundColor Yellow

    Get-NetFirewallRule -Group $GroupName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    Write-Host '[OK] Firewall rules removed.' -ForegroundColor Green

    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host '[OK] Scheduled task removed.' -ForegroundColor Green

    Remove-Item $ConfigPath -Force -ErrorAction SilentlyContinue
    Write-Host '[OK] Config file removed.' -ForegroundColor Green
    exit 0
}

# Create .rush directory
$rushDir = "C:\Users\$env:USERNAME\.rush"
if (-not (Test-Path $rushDir)) {
    New-Item -ItemType Directory -Path $rushDir -Force | Out-Null
}

# Create firewall rules
Write-Host '[RUSH] Creating Rush-Pentest firewall rules...' -ForegroundColor Cyan
$portsStr = $Ports -join ","

# Check if rules already exist
$existing = Get-NetFirewallRule -Group $GroupName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host ('[SKIP] Rush-Pentest rules already exist (' + $existing.Count + ' rules).') -ForegroundColor Gray
} else {
    # Inbound rules
    New-NetFirewallRule -DisplayName "Rush-Pentest-Inbound-TCP" -Direction Inbound -LocalPort $Ports -Protocol TCP -Action Allow -Group $GroupName -Enabled True
    New-NetFirewallRule -DisplayName "Rush-Pentest-Inbound-UDP" -Direction Inbound -LocalPort $Ports -Protocol UDP -Action Allow -Group $GroupName -Enabled True

    # Outbound rules
    New-NetFirewallRule -DisplayName "Rush-Pentest-Outbound-TCP" -Direction Outbound -LocalPort $Ports -Protocol TCP -Action Allow -Group $GroupName -Enabled True
    New-NetFirewallRule -DisplayName "Rush-Pentest-Outbound-UDP" -Direction Outbound -LocalPort $Ports -Protocol UDP -Action Allow -Group $GroupName -Enabled True

    Write-Host ('[OK] 4 firewall rules created (inbound/outbound TCP/UDP on ports ' + $portsStr + ').') -ForegroundColor Green
}

# Create config file (default: enabled)
if (-not (Test-Path $ConfigPath)) {
    @{enabled=$true} | ConvertTo-Json | Set-Content -Path $ConfigPath
    Write-Host ('[OK] Config file created at ' + $ConfigPath + ' (enabled=true).') -ForegroundColor Green
} else {
    Write-Host '[SKIP] Config file already exists.' -ForegroundColor Gray
}

# Create toggle script
$toggleScript = @"
`$config = Get-Content "$ConfigPath" | ConvertFrom-Json
`$rules = Get-NetFirewallRule -Group "$GroupName" -ErrorAction SilentlyContinue
if (`$rules) {
    if (`$config.enabled) {
        `$rules | Enable-NetFirewallRule
    } else {
        `$rules | Disable-NetFirewallRule
    }
}
"@
$togglePath = "$rushDir\firewall-toggle.ps1"
Set-Content -Path $togglePath -Value $toggleScript
Write-Host '[OK] Toggle script written.' -ForegroundColor Green

# Register scheduled task
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$togglePath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Seconds 60)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Rush firewall toggle - reads config every 60s"
Write-Host '[OK] Scheduled task registered (checks every 60s).' -ForegroundColor Green

Write-Host ""
Write-Host '[OK] Rush-Pentest firewall group ready.' -ForegroundColor Green
Write-Host ('     Toggle: Edit ' + $ConfigPath + ' and set enabled to true/false') -ForegroundColor Gray
