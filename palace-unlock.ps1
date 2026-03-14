# PALACE UNLOCK — ONE SHOT MASTER SCRIPT
# Run as Administrator on OMEN (192.168.1.113)
# This script fixes network profile, firewall rules, and verifies services.

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PALACE UNLOCK — BREACHING NOW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── STEP 1: FIX NETWORK PROFILE (Public → Private) ───
Write-Host "[STEP 1] Fixing network profile..." -ForegroundColor Yellow

# Get all connected network adapters and force them to Private
Get-NetConnectionProfile | ForEach-Object {
    $name = $_.Name
    $current = $_.NetworkCategory
    Write-Host "  Interface: $name — Current: $current"
    if ($current -ne "Private") {
        Set-NetConnectionProfile -InterfaceIndex $_.InterfaceIndex -NetworkCategory Private
        Write-Host "  -> CHANGED to Private" -ForegroundColor Green
    } else {
        Write-Host "  -> Already Private (OK)" -ForegroundColor Green
    }
}

Write-Host ""

# ─── STEP 2: FIREWALL RULES FOR ALL PALACE SERVICES ───
Write-Host "[STEP 2] Creating firewall rules..." -ForegroundColor Yellow

$rules = @(
    @{ Name="Palace-SSH-In";   Port=22;   Protocol="TCP"; Description="SSH Inbound" },
    @{ Name="Palace-RDP-In";   Port=3389; Protocol="TCP"; Description="RDP Inbound" },
    @{ Name="Palace-WinRM-In"; Port=5985; Protocol="TCP"; Description="WinRM HTTP Inbound" },
    @{ Name="Palace-WinRM-SSL";Port=5986; Protocol="TCP"; Description="WinRM HTTPS Inbound" },
    @{ Name="Palace-SMB-In";   Port=445;  Protocol="TCP"; Description="SMB Inbound" },
    @{ Name="Palace-vLLM-In";  Port=7070; Protocol="TCP"; Description="vLLM Inbound" },
    @{ Name="Palace-HTTP-In";  Port=3000; Protocol="TCP"; Description="Dev Server Inbound" },
    @{ Name="Palace-Custom-In";Port=7777; Protocol="TCP"; Description="Custom Service Inbound" }
)

foreach ($r in $rules) {
    # Remove existing rule if present (clean slate)
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Remove-NetFirewallRule -DisplayName $r.Name
        Write-Host "  Removed old rule: $($r.Name)"
    }

    # Create rule for ALL profiles (Domain, Private, Public)
    New-NetFirewallRule `
        -DisplayName $r.Name `
        -Direction Inbound `
        -Action Allow `
        -Protocol $r.Protocol `
        -LocalPort $r.Port `
        -Profile Any `
        -Description $r.Description `
        -Enabled True | Out-Null

    Write-Host "  CREATED: $($r.Name) — Port $($r.Port)/$($r.Protocol) — ALL profiles" -ForegroundColor Green
}

Write-Host ""

# ─── STEP 3: VERIFY SSH SERVICE ───
Write-Host "[STEP 3] Verifying SSH service..." -ForegroundColor Yellow

$sshd = Get-Service sshd -ErrorAction SilentlyContinue
if ($sshd) {
    Write-Host "  sshd status: $($sshd.Status)"
    if ($sshd.Status -ne "Running") {
        Start-Service sshd
        Write-Host "  -> Started sshd" -ForegroundColor Green
    } else {
        Write-Host "  -> Already running (OK)" -ForegroundColor Green
    }
    # Ensure auto-start
    Set-Service sshd -StartupType Automatic
    Write-Host "  -> Set to Automatic startup" -ForegroundColor Green
} else {
    Write-Host "  WARNING: sshd service not found!" -ForegroundColor Red
}

Write-Host ""

# ─── STEP 4: VERIFY LISTENING PORTS ───
Write-Host "[STEP 4] Verifying listening ports..." -ForegroundColor Yellow
$listening = netstat -an | Select-String "LISTENING"
$checkPorts = @(22, 3389, 445)
foreach ($p in $checkPorts) {
    $match = $listening | Where-Object { $_ -match ":${p}\s" }
    if ($match) {
        Write-Host "  Port ${p}: LISTENING" -ForegroundColor Green
    } else {
        Write-Host "  Port ${p}: NOT LISTENING" -ForegroundColor Red
    }
}

Write-Host ""

# ─── STEP 5: SHOW CURRENT STATE ───
Write-Host "[STEP 5] Final verification..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Network Profiles:" -ForegroundColor Cyan
Get-NetConnectionProfile | Format-Table Name, InterfaceAlias, NetworkCategory -AutoSize

Write-Host "Firewall Profile States:" -ForegroundColor Cyan
Get-NetFirewallProfile | Format-Table Name, Enabled -AutoSize

Write-Host "Palace Firewall Rules:" -ForegroundColor Cyan
Get-NetFirewallRule -DisplayName "Palace-*" | Format-Table DisplayName, Enabled, Action, Profile -AutoSize

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PALACE UNLOCK COMPLETE" -ForegroundColor Green
Write-Host "  Test from dev machine:" -ForegroundColor Green
Write-Host "    ssh admin@192.168.1.113" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
