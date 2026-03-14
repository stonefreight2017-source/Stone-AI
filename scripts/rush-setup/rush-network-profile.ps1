# Rush Setup - Network Profile
# Run as Administrator for full functionality
<#
.SYNOPSIS
    Creates a scheduled task that lets Rush change network profiles via config file.
.DESCRIPTION
    A SYSTEM-level scheduled task reads a JSON config every 60 seconds and
    applies the specified network profile (Private/Public/Domain) to the
    specified interface. Rush can change profiles by editing the config file
    without needing admin elevation.
.PARAMETER Uninstall
    Removes the scheduled task and config files.
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
$TaskName = "Rush-NetworkProfile"
$ConfigPath = "C:\Users\$env:USERNAME\.rush\profile-config.json"
$LogPath = "C:\Users\$env:USERNAME\.rush\profile-changes.log"
$ScriptPath = "C:\Users\$env:USERNAME\.rush\profile-apply.ps1"

if ($Uninstall) {
    Write-Host '[RUSH] Removing network profile task...' -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Remove-Item $ConfigPath -Force -ErrorAction SilentlyContinue
    Remove-Item $ScriptPath -Force -ErrorAction SilentlyContinue
    Write-Host '[OK] Network profile task removed.' -ForegroundColor Green
    exit 0
}

# Create .rush directory
$rushDir = "C:\Users\$env:USERNAME\.rush"
if (-not (Test-Path $rushDir)) {
    New-Item -ItemType Directory -Path $rushDir -Force | Out-Null
}

# Detect current interface
$currentInterface = (Get-NetConnectionProfile | Select-Object -First 1).InterfaceAlias
$currentCategory = (Get-NetConnectionProfile -InterfaceAlias $currentInterface).NetworkCategory

Write-Host ('[RUSH] Current interface: ' + $currentInterface + ' (' + $currentCategory + ')') -ForegroundColor Cyan

# Create config file
if (-not (Test-Path $ConfigPath)) {
    @{interface=$currentInterface; profile=$currentCategory.ToString()} | ConvertTo-Json | Set-Content -Path $ConfigPath
    Write-Host ('[OK] Config created at ' + $ConfigPath) -ForegroundColor Green
} else {
    Write-Host '[SKIP] Config already exists.' -ForegroundColor Gray
}

# Write the apply script
$applyScript = @"
`$configPath = "$ConfigPath"
`$logPath = "$LogPath"

if (-not (Test-Path `$configPath)) { exit }

`$config = Get-Content `$configPath | ConvertFrom-Json
`$current = Get-NetConnectionProfile -InterfaceAlias `$config.interface -ErrorAction SilentlyContinue

if (`$current -and `$current.NetworkCategory -ne `$config.profile) {
    Set-NetConnectionProfile -InterfaceAlias `$config.interface -NetworkCategory `$config.profile
    `$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "`$ts Changed `$(`$config.interface) from `$(`$current.NetworkCategory) to `$(`$config.profile)" | Out-File -Append -FilePath `$logPath
}
"@
Set-Content -Path $ScriptPath -Value $applyScript
Write-Host '[OK] Apply script written.' -ForegroundColor Green

# Register scheduled task
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Seconds 60)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Rush network profile controller - reads config every 60s"
Write-Host '[OK] Scheduled task registered.' -ForegroundColor Green

Write-Host ""
Write-Host ('[OK] Rush can now change network profiles by editing ' + $ConfigPath) -ForegroundColor Green
Write-Host '     Format: {"interface": "Wi-Fi", "profile": "Private"}' -ForegroundColor Gray
Write-Host '     Valid profiles: Private, Public, DomainAuthenticated' -ForegroundColor Gray
