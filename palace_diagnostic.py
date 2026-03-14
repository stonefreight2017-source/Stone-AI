"""
Palace System Diagnostic — Computer Wiz (Royal Guard)
Full read-only inventory of the OMEN Palace via SSH.
"""

import paramiko
import sys
import time

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"

# Each diagnostic section: (label, command)
DIAGNOSTICS = [
    # 1. SYSTEM
    ("SYSTEM — systeminfo (first 20 lines)", 'systeminfo | findstr /n "." | findstr "^[1-9]: ^1[0-9]: ^20:"'),
    ("SYSTEM — hostname", "hostname"),
    ("SYSTEM — whoami", "whoami"),
    ("SYSTEM — query user", "query user"),

    # 2. GPU
    ("GPU — nvidia-smi (full)", "nvidia-smi"),

    # 3. STORAGE
    ("STORAGE — logical disks", "wmic logicaldisk get caption,size,freespace"),

    # 4. MODELS
    ("MODELS — dir C:\\models /s", "dir C:\\models /s 2>nul || echo [No C:\\models directory found]"),

    # 5. RUNNING PROCESSES
    ("RUNNING PROCESSES", 'tasklist | findstr /i "ollama python docker vllm node"'),

    # 6. PORTS — LISTENING
    ("PORTS — LISTENING", "netstat -an | findstr LISTEN"),

    # 7. AUDIO DEVICES
    ("AUDIO DEVICES", 'powershell -Command "Get-CimInstance Win32_SoundDevice | Select-Object Name, Status | Format-Table -AutoSize"'),

    # 8. NETWORK — ipconfig
    ("NETWORK — ipconfig", "ipconfig"),
    ("NETWORK — ping 8.8.8.8", "ping 8.8.8.8 -n 1"),

    # 9. SOFTWARE VERSIONS
    ("SOFTWARE — python --version", "python --version 2>&1"),
    ("SOFTWARE — py --version", "py --version 2>&1"),
    ("SOFTWARE — python3 --version", "python3 --version 2>&1"),
    ("SOFTWARE — node --version", "node --version 2>&1"),
    ("SOFTWARE — git --version", "git --version 2>&1"),
    ("SOFTWARE — docker --version", "docker --version 2>&1"),

    # 10. DESKTOP
    ("DESKTOP — dir", 'dir "C:\\Users\\admin\\Desktop" 2>nul || dir "C:\\Users\\rush\\Desktop" 2>nul || echo [Desktop not found at expected paths]'),

    # 11. BUSINESS FOLDER
    ("BUSINESS FOLDER", 'dir "C:\\Users\\admin\\Desktop\\BUSINESS" /s 2>nul || dir "C:\\Users\\rush\\Desktop\\BUSINESS" /s 2>nul || echo [BUSINESS folder not found]'),

    # 12. USERS
    ("USERS — net user", "net user"),
    ("USERS — net localgroup Administrators", "net localgroup Administrators"),

    # 13. WSL
    ("WSL — list", "wsl --list --verbose 2>nul || echo [WSL not available]"),

    # 14. SSH SERVICE
    ("SSH SERVICE — sshd", "sc query sshd"),

    # 15. WALLPAPER
    ("WALLPAPER", 'reg query "HKCU\\Control Panel\\Desktop" /v Wallpaper 2>nul || echo [Wallpaper reg key not found]'),

    # 16. OLLAMA MODELS
    ("OLLAMA MODELS", 'powershell -Command "try { Invoke-RestMethod -Uri http://127.0.0.1:11434/api/tags -TimeoutSec 5 | ConvertTo-Json -Depth 5 } catch { Write-Output $_.Exception.Message }"'),
]


def run_diagnostic():
    print("=" * 80)
    print("  PALACE SYSTEM DIAGNOSTIC — Computer Wiz (Royal Guard)")
    print(f"  Target: {USER}@{HOST}:{PORT}")
    print("=" * 80)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"\n[*] Connecting to {HOST}:{PORT} as {USER}...")
        client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
        print("[+] Connected successfully.\n")
    except Exception as e:
        print(f"[!] SSH CONNECTION FAILED: {e}")
        sys.exit(1)

    for label, cmd in DIAGNOSTICS:
        print("-" * 80)
        print(f">>> {label}")
        print(f"    CMD: {cmd}")
        print("-" * 80)
        try:
            stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
            out = stdout.read().decode("utf-8", errors="replace")
            err = stderr.read().decode("utf-8", errors="replace")
            if out.strip():
                print(out)
            if err.strip():
                print(f"[STDERR] {err}")
            if not out.strip() and not err.strip():
                print("[No output]")
        except Exception as e:
            print(f"[ERROR] {e}")
        print()

    client.close()
    print("=" * 80)
    print("  DIAGNOSTIC COMPLETE — Computer Wiz signing off.")
    print("=" * 80)


if __name__ == "__main__":
    run_diagnostic()
