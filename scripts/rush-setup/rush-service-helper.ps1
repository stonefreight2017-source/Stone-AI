# Rush Setup - Service Helper
# Run as Administrator for full functionality
<#
.SYNOPSIS
    Creates a lightweight service helper that lets Rush start/stop/query services
    without admin elevation, via a named pipe.
.DESCRIPTION
    Registers a PowerShell script as a Windows service (via nssm if available,
    or as a scheduled task running as SYSTEM). The script listens on a named pipe
    and executes service management commands on behalf of the caller.
.PARAMETER Uninstall
    Stops and removes the service helper.
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
$ServiceName = "RushServiceHelper"
$PipeName = "rush-cmd"
$ScriptPath = "C:\Users\$env:USERNAME\.rush\service-helper-worker.ps1"
$LogPath = "C:\Users\$env:USERNAME\.rush\service-helper.log"

if ($Uninstall) {
    Write-Host '[RUSH] Removing service helper...' -ForegroundColor Yellow

    # Stop and remove scheduled task
    Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host '[OK] Scheduled task removed.' -ForegroundColor Green

    # Try nssm removal
    $nssm = Get-Command nssm -ErrorAction SilentlyContinue
    if ($nssm) {
        & nssm stop $ServiceName 2>$null
        & nssm remove $ServiceName confirm 2>$null
    }

    # Cleanup files
    Remove-Item $ScriptPath -Force -ErrorAction SilentlyContinue
    Write-Host '[OK] Service helper removed.' -ForegroundColor Green
    exit 0
}

# Create .rush directory
$rushDir = "C:\Users\$env:USERNAME\.rush"
if (-not (Test-Path $rushDir)) {
    New-Item -ItemType Directory -Path $rushDir -Force | Out-Null
}

# Write the worker script
Write-Host '[RUSH] Writing service helper worker script...' -ForegroundColor Cyan
$workerScript = @'
# Rush Service Helper Worker
# Listens on named pipe \\.\pipe\rush-cmd for JSON commands
# Format: {"action": "start|stop|query", "service": "serviceName"}

$PipeName = "rush-cmd"
$LogPath = "C:\Users\{USERNAME}\.rush\service-helper.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts $msg" | Out-File -Append -FilePath $LogPath
}

Write-Log "Rush Service Helper started."

while ($true) {
    try {
        $pipe = New-Object System.IO.Pipes.NamedPipeServerStream($PipeName, [System.IO.Pipes.PipeDirection]::InOut)
        $pipe.WaitForConnection()

        $reader = New-Object System.IO.StreamReader($pipe)
        $writer = New-Object System.IO.StreamWriter($pipe)
        $writer.AutoFlush = $true

        $input = $reader.ReadLine()
        Write-Log "Received: $input"

        try {
            $cmd = $input | ConvertFrom-Json
            $result = switch ($cmd.action) {
                "start" {
                    Start-Service $cmd.service -ErrorAction Stop
                    @{status="ok"; message="Service $($cmd.service) started"} | ConvertTo-Json -Compress
                }
                "stop" {
                    Stop-Service $cmd.service -Force -ErrorAction Stop
                    @{status="ok"; message="Service $($cmd.service) stopped"} | ConvertTo-Json -Compress
                }
                "query" {
                    $svc = Get-Service $cmd.service -ErrorAction Stop
                    @{status="ok"; service=$svc.Name; state=$svc.Status.ToString(); startType=$svc.StartType.ToString()} | ConvertTo-Json -Compress
                }
                default {
                    @{status="error"; message="Unknown action: $($cmd.action)"} | ConvertTo-Json -Compress
                }
            }
            $writer.WriteLine($result)
            Write-Log "Response: $result"
        } catch {
            $errMsg = @{status="error"; message=$_.Exception.Message} | ConvertTo-Json -Compress
            $writer.WriteLine($errMsg)
            Write-Log "Error: $($_.Exception.Message)"
        }

        $pipe.Disconnect()
        $pipe.Dispose()
    } catch {
        Write-Log "Pipe error: $($_.Exception.Message)"
        Start-Sleep -Seconds 1
    }
}
'@
$workerScript = $workerScript.Replace("{USERNAME}", $env:USERNAME)
Set-Content -Path $ScriptPath -Value $workerScript -Force
Write-Host ('[OK] Worker script written to ' + $ScriptPath) -ForegroundColor Green

# Register as scheduled task running as SYSTEM
Write-Host '[RUSH] Registering as scheduled task (SYSTEM)...' -ForegroundColor Cyan
$existingTask = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 365)

Register-ScheduledTask -TaskName $ServiceName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Rush service helper - named pipe command proxy"
Start-ScheduledTask -TaskName $ServiceName
Write-Host '[OK] Service helper registered and started.' -ForegroundColor Green

Write-Host ""
Write-Host '[OK] Rush can now manage services via: \\.\pipe\rush-cmd' -ForegroundColor Green
Write-Host '     Send JSON: {"action": "query", "service": "wuauserv"}' -ForegroundColor Gray
