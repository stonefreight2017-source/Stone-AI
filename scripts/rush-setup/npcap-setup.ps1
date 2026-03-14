# Rush Setup - Npcap
# Run as Administrator for full functionality
<#
.SYNOPSIS
    Installs Npcap with non-admin capture enabled for Rush operations.
.DESCRIPTION
    Downloads and silently installs Npcap with /admin_only=no flag,
    enabling user-level packet capture without elevation.
.PARAMETER Uninstall
    Removes Npcap silently.
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
$NpcapUrl = "https://npcap.com/dist/npcap-1.80.exe"
$InstallerPath = "$env:TEMP\npcap-installer.exe"

if ($Uninstall) {
    Write-Host '[RUSH] Uninstalling Npcap...' -ForegroundColor Yellow
    $uninstPath = "C:\Program Files\Npcap\Uninstall.exe"
    if (Test-Path $uninstPath) {
        Start-Process -FilePath $uninstPath -ArgumentList "/S" -Wait
        Write-Host '[OK] Npcap uninstalled.' -ForegroundColor Green
    } else {
        Write-Host '[SKIP] Npcap not found - nothing to uninstall.' -ForegroundColor Gray
    }
    exit 0
}

# Check if already installed (check both registry paths and filesystem)
$npcapReg = Get-ItemProperty "HKLM:\SOFTWARE\Npcap" -ErrorAction SilentlyContinue
if (-not $npcapReg) {
    $npcapReg = Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Npcap" -ErrorAction SilentlyContinue
}
$npcapDir = Test-Path "C:\Program Files\Npcap"
if ($npcapReg -or $npcapDir) {
    Write-Host '[OK] Npcap already installed.' -ForegroundColor Green
    if ($npcapReg) {
        $ver = $npcapReg.PSObject.Properties['(default)']
        if ($ver) { Write-Host ('     Version: ' + $ver.Value) -ForegroundColor Green }
    }
    Write-Host '[SKIP] Re-run with -Uninstall first to reinstall.' -ForegroundColor Gray
    exit 0
}

# Download
Write-Host '[RUSH] Downloading Npcap...' -ForegroundColor Cyan
Invoke-WebRequest -Uri $NpcapUrl -OutFile $InstallerPath -UseBasicParsing

# Silent install with non-admin capture
Write-Host '[RUSH] Installing Npcap (admin_only=no, winpcap_mode=yes, loopback=yes)...' -ForegroundColor Cyan
Start-Process -FilePath $InstallerPath -ArgumentList "/S /winpcap_mode=yes /loopback_support=yes /admin_only=no" -Wait

# Verify
$npcapReg = Get-ItemProperty "HKLM:\SOFTWARE\Npcap" -ErrorAction SilentlyContinue
if (-not $npcapReg) {
    $npcapReg = Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Npcap" -ErrorAction SilentlyContinue
}
$npcapDir = Test-Path "C:\Program Files\Npcap"
if ($npcapReg -or $npcapDir) {
    Write-Host '[OK] Npcap installed successfully with non-admin capture enabled.' -ForegroundColor Green
} else {
    Write-Host '[FAIL] Npcap installation could not be verified.' -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item $InstallerPath -Force -ErrorAction SilentlyContinue
Write-Host '[OK] Installer cleaned up.' -ForegroundColor Green
