"""
WSL2 Pre-Flight Diagnostic — Computer Wiz (Royal Guard)
Connects to OMEN via SSH, runs 10 checks for WSL2/vLLM readiness.
Feeds findings to Chaos for Ubuntu + vLLM install.
"""

import paramiko
import sys
import time

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"

CHECKS = [
    (
        "1. WSL Feature Enabled",
        'powershell -NoProfile -Command "Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux | Format-List FeatureName,State"',
    ),
    (
        "2. Virtual Machine Platform Enabled",
        'powershell -NoProfile -Command "Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform | Format-List FeatureName,State"',
    ),
    (
        "3. WSL Default Version / Status",
        "wsl --status",
    ),
    (
        "4. Existing WSL Distros",
        "wsl --list --verbose",
    ),
    (
        "5. Hyper-V Compute Service (vmcompute)",
        'powershell -NoProfile -Command "Get-Service vmcompute -ErrorAction SilentlyContinue | Select-Object -Property Name,Status | Format-List"',
    ),
    (
        "6. Internet Connectivity (aka.ms:443)",
        'powershell -NoProfile -Command "Test-NetConnection -ComputerName aka.ms -Port 443 | Select-Object -Property ComputerName,TcpTestSucceeded,PingSucceeded | Format-List"',
    ),
    (
        "7. Windows Update — Pending Updates",
        'powershell -NoProfile -Command "try { $searcher = (New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher(); $results = $searcher.Search(\'IsInstalled=0\'); if ($results.Updates.Count -eq 0) { Write-Output \'No pending updates.\' } else { $results.Updates | ForEach-Object { $_.Title } } } catch { Write-Output \'Could not query Windows Update: $_\' }"',
    ),
    (
        "8. Disk Space on C:",
        'powershell -NoProfile -Command "Get-PSDrive C | Select-Object Used,Free | Format-List"',
    ),
    (
        "9. Developer Mode",
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock" 2>&1',
    ),
    (
        "10. BIOS Virtualization (CPU)",
        'powershell -NoProfile -Command "Get-CimInstance Win32_Processor | Select-Object -Property Name,VirtualizationFirmwareEnabled | Format-List"',
    ),
]


def run_check(ssh, name, cmd, timeout=30):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace").strip()
        err = stderr.read().decode("utf-8", errors="replace").strip()
        if out:
            print(out)
        if err:
            print(f"[stderr] {err}")
        if not out and not err:
            print("[no output]")
    except Exception as e:
        print(f"[ERROR] {e}")


def main():
    print("=" * 60)
    print("  COMPUTER WIZ — WSL2 PRE-FLIGHT DIAGNOSTIC")
    print(f"  Target: {USER}@{HOST}:{PORT}")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"\nConnecting to {HOST}:{PORT}...")
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
        print("SSH connected.")
    except Exception as e:
        print(f"FAILED to connect: {e}")
        sys.exit(1)

    for name, cmd in CHECKS:
        run_check(ssh, name, cmd)

    ssh.close()

    print(f"\n{'='*60}")
    print("  DIAGNOSTIC COMPLETE — Feed to Chaos.")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
