# Rush Setup - RDP
# Run as Administrator for full functionality
<#
.SYNOPSIS
    Enables RDP on a non-standard port (33389) with NLA and session timeout.
.DESCRIPTION
    Enables Remote Desktop, changes the listening port to 33389, enables
    Network Level Authentication, adds a firewall exception, and sets an
    8-hour session timeout. Uses a non-standard port to reduce scan noise.
.PARAMETER Uninstall
    Disables RDP, resets port to 3389, removes firewall rule.
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
$RdpPort = 33389
$DefaultPort = 3389
$RuleName = "Rush-RDP-33389"

if ($Uninstall) {
    Write-Host '[RUSH] Reverting RDP configuration...' -ForegroundColor Yellow

    # Disable RDP
    Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -Value 1
    Write-Host '[OK] RDP disabled.' -ForegroundColor Green

    # Reset port to default
    Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" -Name "PortNumber" -Value $DefaultPort
    Write-Host ('[OK] RDP port reset to ' + $DefaultPort + '.') -ForegroundColor Green

    # Remove firewall rule
    Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    Write-Host '[OK] Firewall rule removed.' -ForegroundColor Green

    # Restart Terminal Services
    Restart-Service -Name "TermService" -Force
    Write-Host '[OK] Terminal Services restarted.' -ForegroundColor Green
    exit 0
}

# Enable RDP
Write-Host '[RUSH] Enabling Remote Desktop...' -ForegroundColor Cyan
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -Value 0
Write-Host '[OK] RDP enabled.' -ForegroundColor Green

# Change port to 33389
Write-Host ('[RUSH] Setting RDP port to ' + $RdpPort + '...') -ForegroundColor Cyan
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" -Name "PortNumber" -Value $RdpPort
Write-Host ('[OK] RDP port set to ' + $RdpPort + '.') -ForegroundColor Green

# Enable NLA
Write-Host '[RUSH] Enabling Network Level Authentication...' -ForegroundColor Cyan
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" -Name "UserAuthentication" -Value 1
Write-Host '[OK] NLA enabled.' -ForegroundColor Green

# Firewall rule
Write-Host ('[RUSH] Adding firewall exception for port ' + $RdpPort + '...') -ForegroundColor Cyan
$existingRule = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if (-not $existingRule) {
    New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -LocalPort $RdpPort -Protocol TCP -Action Allow -Group "Rush-Pentest"
    Write-Host '[OK] Firewall rule added.' -ForegroundColor Green
} else {
    Write-Host '[SKIP] Firewall rule already exists.' -ForegroundColor Gray
}

# Session timeout (8 hours = 480 minutes = 28800000 ms)
Write-Host '[RUSH] Setting session timeout to 8 hours...' -ForegroundColor Cyan
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" -Name "MaxIdleTime" -Value 28800000 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" -Name "MaxDisconnectionTime" -Value 28800000 -Type DWord -Force
Write-Host '[OK] Session timeout set to 8 hours.' -ForegroundColor Green

# Restart Terminal Services
Write-Host '[RUSH] Restarting Terminal Services...' -ForegroundColor Cyan
Restart-Service -Name "TermService" -Force
Write-Host '[OK] Terminal Services restarted.' -ForegroundColor Green

Write-Host ""
Write-Host ('[OK] RDP ready on port ' + $RdpPort + ' with NLA.') -ForegroundColor Green
Write-Host ('     Connect: mstsc /v:' + $env:COMPUTERNAME + ':' + $RdpPort) -ForegroundColor Gray
