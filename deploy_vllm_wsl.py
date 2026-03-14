#!/usr/bin/env python3
"""
THE PALACE — vLLM WSL2 Deployment Script
=========================================
Cardinal (Head 2) — Execution Plan

Phases:
  1. SSH into OMEN, install WSL2 Ubuntu (may need reboot)
  2. Verify CUDA/GPU inside WSL2
  3. Install vLLM inside WSL2
  4. Launch vLLM server with Qwen3-32B-AWQ

Run from: Windows (this machine) — SSHes into OMEN 45L
"""

import paramiko
import sys
import time
import socket
import os

# Fix Windows console encoding issues
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ============================================================================
# CONFIGURATION
# ============================================================================
OMEN_HOST = "169.254.26.30"
OMEN_USER = "rush"
OMEN_PASS = "Palace2026!"
OMEN_PORT = 22

MODEL_PATH = "/mnt/c/models/qwen3-32b-awq"
VLLM_PORT = 8000
MAX_MODEL_LEN = 8192

# ============================================================================
# HELPERS
# ============================================================================
def create_ssh_client():
    """Create and return an SSH client connected to OMEN."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(OMEN_HOST, port=OMEN_PORT, username=OMEN_USER,
                       password=OMEN_PASS, timeout=15,
                       allow_agent=False, look_for_keys=False)
        return client
    except Exception as e:
        print(f"[FAIL] SSH connection failed: {e}")
        return None


def run_cmd(client, cmd, timeout=120, stream=True):
    """Run a command over SSH. Returns (exit_code, stdout, stderr)."""
    print(f"\n[CMD] {cmd}")
    print("-" * 60)

    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)

    out_lines = []
    err_lines = []

    if stream:
        # Stream stdout
        for line in stdout:
            line = line.rstrip('\n')
            out_lines.append(line)
            try:
                print(f"  {line}")
            except UnicodeEncodeError:
                print(f"  {line.encode('ascii', errors='replace').decode('ascii')}")
        for line in stderr:
            line = line.rstrip('\n')
            err_lines.append(line)
            # Don't print stderr lines that are just warnings
            if line.strip():
                try:
                    print(f"  [err] {line}")
                except UnicodeEncodeError:
                    print(f"  [err] {line.encode('ascii', errors='replace').decode('ascii')}")
    else:
        out_lines = stdout.read().decode('utf-8', errors='replace').splitlines()
        err_lines = stderr.read().decode('utf-8', errors='replace').splitlines()

    exit_code = stdout.channel.recv_exit_status()
    print(f"  [exit: {exit_code}]")
    return exit_code, out_lines, err_lines


def run_powershell(client, ps_cmd, timeout=300):
    """Run a PowerShell command on Windows via SSH."""
    # The OMEN SSH drops us in a cmd/powershell context
    cmd = f'powershell.exe -NoProfile -Command "{ps_cmd}"'
    return run_cmd(client, cmd, timeout=timeout)


# ============================================================================
# PHASE 1: WSL2 UBUNTU INSTALL
# ============================================================================
def phase1_wsl_install(client):
    """Install WSL2 with Ubuntu on the OMEN."""
    print("\n" + "=" * 60)
    print("PHASE 1: WSL2 Ubuntu Installation")
    print("=" * 60)

    # First check if WSL Ubuntu is already installed
    print("\n[CHECK] Checking if Ubuntu is already installed in WSL...")
    code, out, err = run_cmd(client, 'wsl -l -v', timeout=30)

    out_text = '\n'.join(out + err).lower()

    if 'ubuntu' in out_text and ('running' in out_text or 'stopped' in out_text):
        print("\n[OK] Ubuntu is already installed in WSL!")

        # Make sure it's running
        print("[ACTION] Starting WSL Ubuntu...")
        run_cmd(client, 'wsl -d Ubuntu -- echo "WSL Ubuntu is alive"', timeout=30)
        return True

    # Ubuntu not installed — install it
    print("\n[ACTION] Installing Ubuntu via WSL...")
    print("[NOTE] This may take 5-15 minutes for download + install.")
    print("[NOTE] If a reboot is required, the script will stop and report.")

    # Use --no-launch to avoid interactive first-time setup blocking us
    code, out, err = run_cmd(client,
        'wsl --install -d Ubuntu --no-launch',
        timeout=600)

    all_output = '\n'.join(out + err).lower()

    # Check if reboot is needed
    if 'reboot' in all_output or 'restart' in all_output:
        print("\n" + "!" * 60)
        print("REBOOT REQUIRED")
        print("!" * 60)
        print("WSL2 Ubuntu has been downloaded/installed but the OMEN")
        print("needs a reboot to complete the installation.")
        print("")
        print("NEXT STEPS:")
        print("  1. Have Trina reboot the OMEN (or run: shutdown /r /t 0)")
        print("  2. After reboot, SSH back in and run:")
        print("     wsl --install -d Ubuntu --no-launch")
        print("     (if needed, or it may auto-complete)")
        print("  3. Then set up the Ubuntu user:")
        print("     wsl -d Ubuntu")
        print("     (follow first-time username/password prompts)")
        print("  4. Re-run this script to continue from Phase 2.")
        print("!" * 60)
        return "REBOOT"

    if code != 0:
        print(f"\n[WARN] WSL install exited with code {code}")
        print("Output:", '\n'.join(out))
        print("Errors:", '\n'.join(err))
        # Try to continue anyway — might already be installed

    # Now launch Ubuntu to trigger first-time setup
    # We need to create a default user non-interactively
    print("\n[ACTION] Configuring Ubuntu default user...")

    # First try to just run a command in Ubuntu
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- echo "Ubuntu working"',
        timeout=60)

    if code == 0 and any('working' in line.lower() for line in out):
        print("[OK] Ubuntu is working!")
        return True

    # If Ubuntu needs user setup, create user non-interactively
    print("[ACTION] Setting up default user in Ubuntu...")
    # Run as root first to create user
    setup_cmds = (
        'wsl -d Ubuntu -u root -- bash -c "'
        'useradd -m -s /bin/bash palace 2>/dev/null; '
        'echo palace:Palace2026! | chpasswd; '
        'usermod -aG sudo palace; '
        'echo palace ALL=\\(ALL\\) NOPASSWD:ALL >> /etc/sudoers; '
        'echo [user] > /etc/wsl.conf; '
        'echo default=palace >> /etc/wsl.conf'
        '"'
    )
    code, out, err = run_cmd(client, setup_cmds, timeout=60)

    # Restart WSL to pick up the default user
    run_cmd(client, 'wsl --shutdown', timeout=30)
    time.sleep(3)

    # Verify
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- whoami',
        timeout=30)

    if code == 0:
        user = out[0].strip() if out else "unknown"
        print(f"[OK] Ubuntu ready. Default user: {user}")
        return True
    else:
        print("[WARN] Ubuntu may need manual first-time setup.")
        print("SSH into OMEN and run: wsl -d Ubuntu")
        print("Then re-run this script.")
        return False


# ============================================================================
# PHASE 2: VERIFY CUDA/GPU INSIDE WSL2
# ============================================================================
def phase2_cuda_verify(client):
    """Verify GPU access from inside WSL2."""
    print("\n" + "=" * 60)
    print("PHASE 2: CUDA / GPU Verification in WSL2")
    print("=" * 60)

    # Check nvidia-smi from inside WSL
    print("\n[CHECK] nvidia-smi inside WSL2...")
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- nvidia-smi',
        timeout=30)

    if code != 0:
        print("[FAIL] nvidia-smi not working inside WSL2.")
        print("The Windows NVIDIA driver should auto-expose GPU to WSL2.")
        print("Make sure NVIDIA driver 591.55+ is installed on Windows.")
        print("Try: wsl --update")

        # Try updating WSL
        print("\n[ACTION] Updating WSL...")
        run_cmd(client, 'wsl --update', timeout=120)

        # Try again
        code, out, err = run_cmd(client,
            'wsl -d Ubuntu -- nvidia-smi',
            timeout=30)
        if code != 0:
            return False

    print("[OK] GPU accessible from WSL2!")

    # Check CUDA version
    print("\n[CHECK] CUDA toolkit inside WSL2...")
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- bash -c "nvcc --version 2>/dev/null || echo NO_NVCC"',
        timeout=15)

    nvcc_output = '\n'.join(out)
    if 'NO_NVCC' in nvcc_output or code != 0:
        print("[INFO] nvcc not found — installing CUDA toolkit in WSL2...")
        print("[NOTE] vLLM pip package bundles its own CUDA, so this is optional.")
        print("[SKIP] Skipping CUDA toolkit install — vLLM handles it.")
    else:
        print(f"[OK] CUDA toolkit found: {nvcc_output}")

    return True


# ============================================================================
# PHASE 3: INSTALL vLLM INSIDE WSL2
# ============================================================================
def phase3_vllm_install(client):
    """Install vLLM and dependencies inside WSL2."""
    print("\n" + "=" * 60)
    print("PHASE 3: vLLM Installation in WSL2")
    print("=" * 60)

    # Install system deps
    print("\n[ACTION] Installing system dependencies...")
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- bash -c "'
        'sudo apt-get update -qq && '
        'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq '
        'python3 python3-pip python3-venv git curl wget build-essential'
        '"',
        timeout=300)

    if code != 0:
        print("[WARN] Some packages may have failed, continuing...")

    # Create Python venv
    print("\n[ACTION] Creating Python virtual environment...")
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- bash -c "'
        'python3 -m venv ~/palace-venv && '
        'source ~/palace-venv/bin/activate && '
        'pip install --upgrade pip setuptools wheel'
        '"',
        timeout=120)

    if code != 0:
        print("[WARN] Venv creation had issues, checking...")

    # Install vLLM (this is the big one — can take 10-20 minutes)
    print("\n[ACTION] Installing vLLM (this takes 10-20 minutes)...")
    print("[NOTE] vLLM is a large package with CUDA dependencies.")
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- bash -c "'
        'source ~/palace-venv/bin/activate && '
        'pip install vllm openai'
        '"',
        timeout=600, stream=True)

    if code != 0:
        print("[FAIL] vLLM installation failed!")
        print("Errors:", '\n'.join(err[-20:]))  # last 20 error lines
        return False

    # Verify vLLM import
    print("\n[CHECK] Verifying vLLM import...")
    verify_cmd = (
        "wsl -d Ubuntu -- bash -c "
        "'source ~/palace-venv/bin/activate && "
        "python3 -c \"import vllm; print(vllm.__version__)\"'"
    )
    code, out, err = run_cmd(client, verify_cmd, timeout=30)

    if code == 0:
        print("[OK] vLLM installed successfully!")
        return True
    else:
        print("[FAIL] vLLM import failed.")
        print("Errors:", '\n'.join(err))
        return False


# ============================================================================
# PHASE 4: LAUNCH vLLM SERVER
# ============================================================================
def phase4_launch_vllm(client):
    """Launch vLLM server with the Qwen model."""
    print("\n" + "=" * 60)
    print("PHASE 4: Launch vLLM Server")
    print("=" * 60)

    # Check if model directory is accessible
    print(f"\n[CHECK] Model at {MODEL_PATH}...")
    code, out, err = run_cmd(client,
        f'wsl -d Ubuntu -- bash -c "ls -la {MODEL_PATH}/ | head -10"',
        timeout=15)

    if code != 0:
        print(f"[FAIL] Model not found at {MODEL_PATH}")
        print("Check that C:\\models\\qwen3-32b-awq exists on the OMEN.")
        return False

    print("[OK] Model directory accessible.")

    # Check if something is already running on port 8000
    print(f"\n[CHECK] Port {VLLM_PORT}...")
    code, out, err = run_cmd(client,
        f'wsl -d Ubuntu -- bash -c "ss -tlnp 2>/dev/null | grep :{VLLM_PORT} || echo PORT_FREE"',
        timeout=10)

    port_output = '\n'.join(out)
    if 'PORT_FREE' not in port_output and str(VLLM_PORT) in port_output:
        print(f"[WARN] Port {VLLM_PORT} is already in use!")
        print("Kill existing process or use a different port.")

    # Create a launch script inside WSL
    launch_script = (
        'source ~/palace-venv/bin/activate && '
        'nohup python3 -m vllm.entrypoints.openai.api_server '
        f'--model {MODEL_PATH} '
        '--quantization awq '
        '--host 0.0.0.0 '
        f'--port {VLLM_PORT} '
        '--enable-auto-tool-choice '
        '--tool-call-parser hermes '
        f'--max-model-len {MAX_MODEL_LEN} '
        '> ~/palace-vllm.log 2>&1 &'
    )

    print(f"\n[ACTION] Starting vLLM server on port {VLLM_PORT}...")
    print(f"  Model: {MODEL_PATH}")
    print(f"  Quantization: AWQ")
    print(f"  Max context: {MAX_MODEL_LEN}")

    code, out, err = run_cmd(client,
        f'wsl -d Ubuntu -- bash -c "{launch_script}"',
        timeout=30)

    # Wait for server to start loading
    print("\n[WAIT] Waiting for vLLM to start loading model (30s)...")
    time.sleep(30)

    # Check logs
    code, out, err = run_cmd(client,
        'wsl -d Ubuntu -- bash -c "tail -30 ~/palace-vllm.log 2>/dev/null || echo NO_LOG"',
        timeout=15)

    log_text = '\n'.join(out)

    if 'error' in log_text.lower() and 'cuda' in log_text.lower():
        print("[FAIL] CUDA error in vLLM startup. Check ~/palace-vllm.log on OMEN.")
        return False

    if 'Uvicorn running' in log_text or 'Application startup complete' in log_text:
        print("[OK] vLLM server is running!")

        # Quick health check
        code, out, err = run_cmd(client,
            f'wsl -d Ubuntu -- bash -c "'
            f'curl -s http://localhost:{VLLM_PORT}/v1/models'
            '"',
            timeout=15)
        if code == 0:
            print("[OK] vLLM API responding!")
            print("Models:", '\n'.join(out))
        return True
    else:
        print("[INFO] vLLM is still loading the model (this can take 1-3 minutes).")
        print("Check progress with: ssh rush@169.254.26.30 'wsl -d Ubuntu -- tail -f ~/palace-vllm.log'")
        return "LOADING"


# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    print("=" * 60)
    print("THE PALACE — vLLM WSL2 Deployment")
    print("Cardinal (Head 2) — Execution Engine")
    print("=" * 60)
    print(f"Target: {OMEN_USER}@{OMEN_HOST}")
    print(f"Model: {MODEL_PATH}")
    print(f"Port: {VLLM_PORT}")
    print()

    # Connect to OMEN
    print("[CONNECT] SSHing into the OMEN...")
    client = create_ssh_client()
    if not client:
        print("[FAIL] Cannot connect to OMEN via SSH.")
        print(f"  Host: {OMEN_HOST}:{OMEN_PORT}")
        print(f"  User: {OMEN_USER}")
        print("  Ensure OpenSSH Server is running on the OMEN.")
        sys.exit(1)

    print("[OK] Connected to OMEN!\n")

    # Quick system check
    run_cmd(client, 'hostname && systeminfo | findstr /B /C:"OS Name" /C:"OS Version"', timeout=15)

    try:
        # PHASE 1: WSL2 Ubuntu
        result = phase1_wsl_install(client)
        if result == "REBOOT":
            client.close()
            sys.exit(0)  # Clean exit — reboot needed
        if not result:
            print("\n[STOP] Phase 1 failed. Fix WSL2 Ubuntu before continuing.")
            client.close()
            sys.exit(1)

        # PHASE 2: CUDA verification
        result = phase2_cuda_verify(client)
        if not result:
            print("\n[STOP] Phase 2 failed. GPU not accessible from WSL2.")
            print("This usually means the NVIDIA driver doesn't support WSL2 GPU passthrough.")
            client.close()
            sys.exit(1)

        # PHASE 3: vLLM install
        result = phase3_vllm_install(client)
        if not result:
            print("\n[STOP] Phase 3 failed. vLLM installation issues.")
            client.close()
            sys.exit(1)

        # PHASE 4: Launch vLLM
        result = phase4_launch_vllm(client)
        if result == "LOADING":
            print("\n" + "=" * 60)
            print("STATUS: vLLM is loading the model")
            print("=" * 60)
            print("The server is started but still loading weights.")
            print("This takes 1-3 minutes on RTX 5090.")
            print("")
            print("To check status:")
            print(f"  ssh {OMEN_USER}@{OMEN_HOST}")
            print("  wsl -d Ubuntu -- tail -f ~/palace-vllm.log")
            print("")
            print("Once loaded, test with:")
            print(f"  curl http://{OMEN_HOST}:{VLLM_PORT}/v1/models")
        elif result:
            print("\n" + "=" * 60)
            print("SUCCESS: vLLM is LIVE!")
            print("=" * 60)
            print(f"  API: http://{OMEN_HOST}:{VLLM_PORT}/v1")
            print(f"  Model: {MODEL_PATH}")
        else:
            print("\n[STOP] Phase 4 failed. Check logs on OMEN.")

    finally:
        client.close()
        print("\n[DONE] SSH connection closed.")


if __name__ == "__main__":
    main()
