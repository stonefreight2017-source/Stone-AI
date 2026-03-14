# Rush Setup - WinRM
# Run as Administrator for full functionality
<#
.SYNOPSIS
    Enables WinRM/PS Remoting with HTTPS listener for Rush operations.
.DESCRIPTION
    Enables PSRemoting, sets TrustedHosts to wildcard, creates a self-signed
    certificate, configures an HTTPS WinRM listener, and opens firewall ports
    5985 (HTTP) and 5986 (HTTPS).
.PARAMETER Uninstall
    Disables PSRemoting, removes listeners, removes firewall rules.
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

if ($Uninstall) {
    Write-Host '[RUSH] Removing WinRM configuration...' -ForegroundColor Yellow

    # Remove HTTPS listener
    try {
        $httpsListener = Get-WSManInstance winrm/config/Listener -SelectorSet @{Address="*";Transport="HTTPS"}
        if ($httpsListener) {
            Remove-WSManInstance winrm/config/Listener -SelectorSet @{Address="*";Transport="HTTPS"}
            Write-Host '[OK] HTTPS listener removed.' -ForegroundColor Green
        }
    } catch {
        Write-Host '[SKIP] No HTTPS listener to remove.' -ForegroundColor Gray
    }

    # Remove firewall rules
    Remove-NetFirewallRule -DisplayName "Rush-WinRM-HTTP" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Rush-WinRM-HTTPS" -ErrorAction SilentlyContinue
    Write-Host '[OK] Firewall rules removed.' -ForegroundColor Green

    # Disable PSRemoting
    Disable-PSRemoting -Force -ErrorAction SilentlyContinue
    Write-Host '[OK] PSRemoting disabled.' -ForegroundColor Green
    exit 0
}

# Enable PSRemoting
Write-Host '[RUSH] Enabling PSRemoting...' -ForegroundColor Cyan
Enable-PSRemoting -Force -SkipNetworkProfileCheck

# Set TrustedHosts
Write-Host '[RUSH] Setting TrustedHosts to wildcard...' -ForegroundColor Cyan
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force

# Create self-signed certificate
Write-Host '[RUSH] Creating self-signed certificate...' -ForegroundColor Cyan
$existingCert = Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*$env:COMPUTERNAME*" } | Select-Object -First 1
if ($existingCert) {
    $cert = $existingCert
    Write-Host ('[SKIP] Certificate already exists (thumbprint: ' + $cert.Thumbprint + ')') -ForegroundColor Gray
} else {
    $cert = New-SelfSignedCertificate -DnsName $env:COMPUTERNAME -CertStoreLocation Cert:\LocalMachine\My
    Write-Host ('[OK] Certificate created (thumbprint: ' + $cert.Thumbprint + ')') -ForegroundColor Green
}

# Create HTTPS listener (remove existing first if any)
try {
    $existingListener = Get-WSManInstance winrm/config/Listener -SelectorSet @{Address="*";Transport="HTTPS"}
    if ($existingListener) {
        Remove-WSManInstance winrm/config/Listener -SelectorSet @{Address="*";Transport="HTTPS"}
        Write-Host '[OK] Removed existing HTTPS listener.' -ForegroundColor Yellow
    }
} catch {
    # No existing HTTPS listener - that is fine
}
Write-Host '[RUSH] Creating HTTPS WinRM listener...' -ForegroundColor Cyan
New-WSManInstance winrm/config/Listener -SelectorSet @{Address="*";Transport="HTTPS"} -ValueSet @{CertificateThumbprint=$cert.Thumbprint}
Write-Host '[OK] HTTPS listener created on port 5986.' -ForegroundColor Green

# Firewall rules
Write-Host '[RUSH] Opening firewall ports 5985, 5986...' -ForegroundColor Cyan
$httpRule = Get-NetFirewallRule -DisplayName "Rush-WinRM-HTTP" -ErrorAction SilentlyContinue
if (-not $httpRule) {
    New-NetFirewallRule -DisplayName "Rush-WinRM-HTTP" -Direction Inbound -LocalPort 5985 -Protocol TCP -Action Allow -Group "Rush-Pentest"
}
$httpsRule = Get-NetFirewallRule -DisplayName "Rush-WinRM-HTTPS" -ErrorAction SilentlyContinue
if (-not $httpsRule) {
    New-NetFirewallRule -DisplayName "Rush-WinRM-HTTPS" -Direction Inbound -LocalPort 5986 -Protocol TCP -Action Allow -Group "Rush-Pentest"
}
Write-Host '[OK] Firewall rules configured.' -ForegroundColor Green

Write-Host ""
Write-Host ('[OK] WinRM setup complete. Test with: Enter-PSSession -ComputerName ' + $env:COMPUTERNAME + ' -UseSSL -Credential (Get-Credential)') -ForegroundColor Green
