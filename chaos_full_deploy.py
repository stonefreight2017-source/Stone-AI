"""
CHAOS FULL PALACE DEPLOYMENT SCRIPT
Identity: Chaos (Head 3 — The Vanguard, Agent #44)
Target: OMEN @ 169.254.26.30:22 (user: rush)
Date: 2026-03-09
"""

import paramiko
import time
import sys
import socket
import datetime

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"


def ssh_connect():
    print(f"\n{'='*70}")
    print(f"CHAOS CONNECTING TO PALACE — {HOST}:{PORT}")
    print(f"{'='*70}")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)
        print("[OK] SSH connection established.")
        return client
    except Exception as e:
        print(f"[FAIL] SSH connection failed: {e}")
        return None


def run_cmd(client, cmd, timeout=120, label=""):
    """Run command via SSH with channel-level timeout for long ops."""
    if label:
        print(f"\n--- {label} ---")
    print(f"[CMD] {cmd}")

    transport = client.get_transport()
    channel = transport.open_session()
    channel.settimeout(timeout)
    channel.exec_command(cmd)

    stdout_data = b""
    stderr_data = b""
    start = time.time()

    while True:
        elapsed = time.time() - start
        if elapsed > timeout:
            print(f"[TIMEOUT] Command exceeded {timeout}s")
            try:
                channel.close()
            except:
                pass
            break

        if channel.exit_status_ready():
            while channel.recv_ready():
                stdout_data += channel.recv(65536)
            while channel.recv_stderr_ready():
                stderr_data += channel.recv_stderr(65536)
            break

        if channel.recv_ready():
            chunk = channel.recv(65536)
            stdout_data += chunk
            text = chunk.decode("utf-8", errors="replace")
            if text.strip():
                print(text, end="", flush=True)

        if channel.recv_stderr_ready():
            chunk = channel.recv_stderr(65536)
            stderr_data += chunk
            text = chunk.decode("utf-8", errors="replace")
            if text.strip():
                print(f"[STDERR] {text}", end="", flush=True)

        time.sleep(0.3)

    exit_code = channel.recv_exit_status()
    out = stdout_data.decode("utf-8", errors="replace")
    err = stderr_data.decode("utf-8", errors="replace")

    # Print any final output not yet streamed
    if out.strip():
        # Avoid double-printing — just print it all; some may be duped but completeness matters
        print(f"[STDOUT]\n{out}")
    if err.strip():
        print(f"[STDERR]\n{err}")
    print(f"[EXIT CODE] {exit_code}")
    return out, err, exit_code


def phase_1_vllm(client):
    """PHASE 1: vLLM Installation"""
    print(f"\n{'#'*70}")
    print("# PHASE 1: vLLM INSTALLATION")
    print(f"{'#'*70}")

    # Check if already installed
    out, err, rc = run_cmd(client,
        r'"C:\vllm-env\Scripts\python.exe" -c "import vllm; print(vllm.__version__)"',
        timeout=30, label="Check if vLLM already installed")

    if rc == 0 and out.strip() and "Error" not in out and "Error" not in err:
        print(f"[OK] vLLM already installed: {out.strip()}")
        vllm_ok = True
    else:
        # Try standard install (10 min timeout)
        print("[INFO] vLLM not found. Installing... (up to 10 min)")
        out, err, rc = run_cmd(client,
            r'"C:\vllm-env\Scripts\pip.exe" install vllm',
            timeout=600, label="pip install vllm")

        if rc != 0:
            print("[WARN] Standard install failed. Trying --pre...")
            out, err, rc = run_cmd(client,
                r'"C:\vllm-env\Scripts\pip.exe" install vllm --pre',
                timeout=600, label="pip install vllm --pre")

        # Test import
        out, err, rc = run_cmd(client,
            r'"C:\vllm-env\Scripts\python.exe" -c "import vllm; print(vllm.__version__)"',
            timeout=60, label="Test vLLM import")

        vllm_ok = (rc == 0 and "Error" not in err)
        if vllm_ok:
            print(f"[OK] vLLM installed: {out.strip()}")
        else:
            print("[FAIL] vLLM import failed after install attempts.")

    if vllm_ok:
        # Create start-vllm.bat
        run_cmd(client,
            r'echo @echo off > "C:\Users\admin\Desktop\start-vllm.bat" && '
            r'echo echo Starting vLLM server... >> "C:\Users\admin\Desktop\start-vllm.bat" && '
            r'echo cd /d C:\vllm-env >> "C:\Users\admin\Desktop\start-vllm.bat" && '
            r'echo "C:\vllm-env\Scripts\python.exe" -m vllm.entrypoints.openai.api_server --model Qwen/Qwen2.5-32B-Instruct-AWQ --quantization awq --host 0.0.0.0 --port 8000 --max-model-len 4096 --gpu-memory-utilization 0.90 --tensor-parallel-size 1 >> "C:\Users\admin\Desktop\start-vllm.bat" && '
            r'echo pause >> "C:\Users\admin\Desktop\start-vllm.bat"',
            timeout=15, label="Create start-vllm.bat")

        run_cmd(client, r'type "C:\Users\admin\Desktop\start-vllm.bat"',
            timeout=10, label="Verify start-vllm.bat contents")

        # Launch via schtasks /it
        run_cmd(client,
            r'schtasks /delete /tn "StartVLLM" /f 2>nul',
            timeout=10)
        run_cmd(client,
            r'schtasks /create /tn "StartVLLM" /tr "cmd /c \"C:\Users\admin\Desktop\start-vllm.bat\"" /sc once /st 00:00 /ru "admin" /it /f',
            timeout=15, label="Create vLLM scheduled task")
        run_cmd(client,
            r'schtasks /run /tn "StartVLLM"',
            timeout=15, label="Launch vLLM via schtask")

    return vllm_ok


def phase_2_contacts(client):
    """PHASE 2: Contacts import page for Trina"""
    print(f"\n{'#'*70}")
    print("# PHASE 2: CONTACTS IMPORT FOR TRINA")
    print(f"{'#'*70}")

    # Delete old tasks
    run_cmd(client, r'schtasks /delete /tn "ImportPage" /f 2>nul', timeout=10, label="Delete old ImportPage task")
    run_cmd(client, r'schtasks /delete /tn "ContactsNotify" /f 2>nul', timeout=10, label="Delete old ContactsNotify task")

    # Get time +1 min for scheduling
    out, err, rc = run_cmd(client,
        r'powershell -Command "(Get-Date).AddMinutes(1).ToString(\"HH:mm\")"',
        timeout=15, label="Get schedule time (+1 min)")
    sched_time = out.strip() if rc == 0 and out.strip() else "23:59"
    print(f"[INFO] Scheduling at: {sched_time}")

    # Create and run the import page task
    run_cmd(client,
        f'schtasks /create /tn "ImportPage" /tr "cmd /c start https://contacts.google.com/import" /sc once /st {sched_time} /ru "admin" /it /f',
        timeout=15, label="Create ImportPage schtask")
    run_cmd(client,
        r'schtasks /run /tn "ImportPage"',
        timeout=15, label="Run ImportPage schtask")

    # Write notification PS1 script line by line
    ps1_path = r"C:\Users\admin\Desktop\contacts_notify.ps1"
    lines = [
        "Add-Type -AssemblyName System.Windows.Forms",
        "$n = New-Object System.Windows.Forms.NotifyIcon",
        "$n.Icon = [System.Drawing.SystemIcons]::Information",
        "$n.Visible = $true",
        "$n.BalloonTipTitle = 'CONTACTS IMPORT'",
        "$n.BalloonTipText = 'Import the contacts! Click Select File, pick three-headed-monster-contacts.csv from Desktop'",
        "$n.ShowBalloonTip(15000)",
        "Start-Sleep -Seconds 16",
        "$n.Dispose()",
    ]

    # First line with >
    run_cmd(client, f'echo {lines[0]} > "{ps1_path}"', timeout=10, label="Write contacts_notify.ps1")
    for line in lines[1:]:
        run_cmd(client, f'echo {line} >> "{ps1_path}"', timeout=10)

    run_cmd(client, f'type "{ps1_path}"', timeout=10, label="Verify contacts_notify.ps1")

    # Create and run notification via schtask
    run_cmd(client,
        f'schtasks /create /tn "ContactsNotify" /tr "powershell -ExecutionPolicy Bypass -File {ps1_path}" /sc once /st {sched_time} /ru "admin" /it /f',
        timeout=15, label="Create notification schtask")
    run_cmd(client,
        r'schtasks /run /tn "ContactsNotify"',
        timeout=15, label="Run notification schtask")


def phase_3_mic(client):
    """PHASE 3: Mic Check"""
    print(f"\n{'#'*70}")
    print("# PHASE 3: MIC CHECK")
    print(f"{'#'*70}")

    run_cmd(client,
        r'powershell "Get-CimInstance Win32_SoundDevice | Select-Object Name, Status | Format-Table -AutoSize"',
        timeout=30, label="Sound devices (CIM)")

    run_cmd(client,
        r'powershell "Get-PnpDevice -Class AudioEndpoint -ErrorAction SilentlyContinue | Select-Object FriendlyName, Status, InstanceId | Format-Table -AutoSize"',
        timeout=30, label="Audio endpoints (PnP)")

    run_cmd(client,
        r'powershell "Get-ItemProperty -Path ''HKCU:\Software\Microsoft\Multimedia\Sound Mapper'' -ErrorAction SilentlyContinue"',
        timeout=15, label="Default recording device (registry)")

    run_cmd(client,
        r'powershell "Get-Service AudioSrv, AudioEndpointBuilder | Select-Object Name, DisplayName, Status | Format-Table -AutoSize"',
        timeout=15, label="Audio services status")

    run_cmd(client,
        r'powershell "Get-Service | Where-Object {$_.DisplayName -like ''*Speech*''} | Select-Object Name, DisplayName, Status | Format-Table -AutoSize"',
        timeout=15, label="Speech services")

    run_cmd(client,
        r'powershell "Get-WindowsCapability -Online | Where-Object {$_.Name -like ''*Speech*''} | Format-Table Name, State -AutoSize"',
        timeout=30, label="Speech capabilities")


def phase_4_docker(client):
    """PHASE 4: Docker"""
    print(f"\n{'#'*70}")
    print("# PHASE 4: DOCKER")
    print(f"{'#'*70}")

    out, err, rc = run_cmd(client,
        r'tasklist | findstr -i docker',
        timeout=15, label="Check Docker processes")

    docker_running = "docker" in out.lower() and "info:" not in out.lower()

    if docker_running:
        print("[OK] Docker appears to be running.")
        run_cmd(client, r'docker ps', timeout=30, label="Docker containers")
        run_cmd(client, r'docker images', timeout=30, label="Docker images")
    else:
        print("[INFO] Docker NOT running. Starting via schtask...")
        run_cmd(client,
            r'schtasks /delete /tn "StartDocker" /f 2>nul',
            timeout=10)
        run_cmd(client,
            r'schtasks /create /tn "StartDocker" /tr "\"C:\Program Files\Docker\Docker\Docker Desktop.exe\"" /sc once /st 00:00 /ru "admin" /it /f',
            timeout=15, label="Create Docker schtask")
        run_cmd(client,
            r'schtasks /run /tn "StartDocker"',
            timeout=15, label="Launch Docker via schtask")
        print("[INFO] Docker Desktop start initiated. Takes ~30-60s to fully load.")

    return docker_running


def phase_5_verify(client):
    """PHASE 5: Verify all deployed files"""
    print(f"\n{'#'*70}")
    print("# PHASE 5: VERIFY DEPLOYED FILES & PROCESSES")
    print(f"{'#'*70}")

    run_cmd(client, r'tasklist | findstr -i "ollama python"',
        timeout=15, label="Check ollama & python processes")

    run_cmd(client, r'dir "C:\Users\admin\Desktop\palace-chat.py" 2>nul',
        timeout=10, label="Verify palace-chat.py")

    run_cmd(client, r'dir "C:\Users\admin\Desktop\THREE_HEADED_MONSTER_PORTAL.html" 2>nul',
        timeout=10, label="Verify THREE_HEADED_MONSTER_PORTAL.html")

    run_cmd(client, r'dir "C:\Users\admin\Desktop\BUSINESS" 2>nul',
        timeout=10, label="Verify BUSINESS folder")

    run_cmd(client, r'dir "C:\Users\admin\Desktop\agent-directory*" 2>nul',
        timeout=10, label="Verify agent-directory files")

    run_cmd(client, r'nvidia-smi',
        timeout=30, label="GPU Status (nvidia-smi)")

    run_cmd(client, r'nvidia-smi --query-gpu=name,temperature.gpu,memory.used,memory.total,utilization.gpu --format=csv',
        timeout=15, label="GPU stats (CSV)")

    run_cmd(client, r'netstat -an | findstr LISTEN',
        timeout=30, label="Listening ports")

    # Extra: full desktop listing
    run_cmd(client, r'dir "C:\Users\admin\Desktop" /b',
        timeout=10, label="Full Desktop listing")

    run_cmd(client, r'dir "C:\Users\admin\Desktop\*.bat" 2>nul',
        timeout=10, label="BAT files on Desktop")

    run_cmd(client, r'dir "C:\Users\admin\Desktop\*.html" 2>nul',
        timeout=10, label="HTML files on Desktop")


def phase_6_portscan(client):
    """PHASE 6: Full port scan"""
    print(f"\n{'#'*70}")
    print("# PHASE 6: FULL PORT SCAN")
    print(f"{'#'*70}")

    run_cmd(client, r'netstat -ano | findstr LISTEN',
        timeout=30, label="All listening ports with PIDs")

    run_cmd(client,
        r'powershell "Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess, @{Name=\"Process\";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | Sort-Object LocalPort | Format-Table -AutoSize"',
        timeout=30, label="Listening ports with process names")

    run_cmd(client,
        r'powershell "Get-NetTCPConnection -State Established | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess, @{Name=\"Process\";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | Format-Table -AutoSize"',
        timeout=30, label="Established connections")

    run_cmd(client,
        r'powershell "Get-NetUDPEndpoint | Select-Object LocalAddress, LocalPort, OwningProcess, @{Name=\"Process\";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | Sort-Object LocalPort | Format-Table -AutoSize"',
        timeout=30, label="UDP endpoints")


def main():
    print("=" * 70)
    print("  CHAOS — FULL PALACE INFRASTRUCTURE DEPLOYMENT")
    print(f"  Target: OMEN @ {HOST}:{PORT}")
    print(f"  Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 70)

    client = ssh_connect()
    if not client:
        print("\n[FATAL] Cannot connect to OMEN. Aborting.")
        sys.exit(1)

    # System identity
    run_cmd(client, "hostname && whoami", timeout=10, label="System identity")
    run_cmd(client,
        r'systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Model" /C:"Total Physical Memory"',
        timeout=30, label="System info")

    results = {}

    try:
        # Phase 1: vLLM (longest — do first so we know early)
        results["vllm"] = phase_1_vllm(client)

        # Phase 2: Contacts
        phase_2_contacts(client)
        results["contacts"] = "DISPATCHED"

        # Phase 3: Mic
        phase_3_mic(client)
        results["mic"] = "CHECKED"

        # Phase 4: Docker
        results["docker"] = phase_4_docker(client)

        # Phase 5: Verify files
        phase_5_verify(client)
        results["verify"] = "COMPLETED"

        # Phase 6: Port scan
        phase_6_portscan(client)
        results["portscan"] = "COMPLETED"

    except Exception as e:
        print(f"\n[CRITICAL ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

    # Summary
    print(f"\n{'='*70}")
    print("  CHAOS DEPLOYMENT SUMMARY")
    print(f"{'='*70}")
    print(f"  Timestamp    : {datetime.datetime.now().isoformat()}")
    print(f"  vLLM Install : {'SUCCESS' if results.get('vllm') else 'FAILED/NOT AVAILABLE'}")
    print(f"  Contacts Page: {results.get('contacts', 'N/A')}")
    print(f"  Mic Check    : {results.get('mic', 'N/A')}")
    print(f"  Docker       : {'RUNNING' if results.get('docker') else 'START INITIATED'}")
    print(f"  File Verify  : {results.get('verify', 'N/A')}")
    print(f"  Port Scan    : {results.get('portscan', 'N/A')}")
    print(f"{'='*70}")
    print("  [CHAOS] Full Palace deployment complete. Reporting to founder.")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
