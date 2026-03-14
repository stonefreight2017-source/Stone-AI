#!/usr/bin/env python3
"""
Install vLLM on OMEN Palace WSL2 Ubuntu (already installed, just needs starting).
Connects via SSH (paramiko) to 169.254.26.30:22 as user 'rush'.

Steps:
  1. Start Ubuntu WSL2 and verify
  2. Check GPU passthrough (nvidia-smi)
  3. Check Python availability
  4. Check if vLLM already installed
  5. If not, install pip/venv and vLLM
  6. Test vLLM import
  7. Check model directory
  8. Start vLLM server
  9. Verify server is running
"""

import paramiko
import sys
import time

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"


def run_cmd(ssh, cmd, timeout=120, label=""):
    """Run a command over SSH using channel for incremental output. Returns (exit_code, stdout, stderr)."""
    print(f"\n{'='*70}")
    print(f"[STEP] {label}")
    print(f"[CMD]  {cmd}")
    print(f"[TIMEOUT] {timeout}s")
    print(f"{'='*70}")

    transport = ssh.get_transport()
    channel = transport.open_session()
    channel.settimeout(float(timeout))
    channel.exec_command(cmd)

    stdout_data = b""
    stderr_data = b""

    while True:
        if channel.recv_ready():
            chunk = channel.recv(4096)
            stdout_data += chunk
            sys.stdout.write(chunk.decode('utf-8', errors='replace'))
            sys.stdout.flush()
        if channel.recv_stderr_ready():
            chunk = channel.recv_stderr(4096)
            stderr_data += chunk
            sys.stdout.write(chunk.decode('utf-8', errors='replace'))
            sys.stdout.flush()

        if channel.exit_status_ready():
            # Drain remaining data
            while channel.recv_ready():
                chunk = channel.recv(4096)
                stdout_data += chunk
                sys.stdout.write(chunk.decode('utf-8', errors='replace'))
                sys.stdout.flush()
            while channel.recv_stderr_ready():
                chunk = channel.recv_stderr(4096)
                stderr_data += chunk
                sys.stdout.write(chunk.decode('utf-8', errors='replace'))
                sys.stdout.flush()
            break

        time.sleep(0.3)

    exit_code = channel.recv_exit_status()
    out = stdout_data.decode('utf-8', errors='replace')
    err = stderr_data.decode('utf-8', errors='replace')
    print(f"\n[EXIT CODE] {exit_code}")
    return exit_code, out, err


def main():
    print(f"Connecting to {USER}@{HOST}:{PORT} ...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASS,
                    timeout=10, look_for_keys=False, allow_agent=False)
    except Exception as e:
        print(f"SSH connection FAILED: {e}")
        sys.exit(1)

    print("Connected successfully.\n")

    try:
        # === Step 1: Start Ubuntu and check ===
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "uname -a"',
                timeout=30,
                label="1. Start Ubuntu WSL2 and check")

        # === Step 2: Check GPU passthrough ===
        code, out, err = run_cmd(ssh,
                                 'wsl -d Ubuntu -- bash -c "nvidia-smi"',
                                 timeout=30,
                                 label="2. Check GPU passthrough (nvidia-smi)")
        if code != 0:
            print("\n[WARNING] nvidia-smi failed. GPU passthrough may not be working.")
            print("Continuing anyway to gather more info...")

        # === Step 3: Check Python ===
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "which python3 && python3 --version"',
                timeout=15,
                label="3. Check Python availability")

        # === Step 4: Check if vLLM already installed ===
        code4a, out4a, err4a = run_cmd(ssh,
                                       'wsl -d Ubuntu -- bash -c "pip3 list 2>/dev/null | grep -i vllm || echo NOT_INSTALLED"',
                                       timeout=15,
                                       label="4a. Check vLLM (system pip)")

        code4b, out4b, err4b = run_cmd(ssh,
                                       'wsl -d Ubuntu -- bash -c "/opt/vllm-env/bin/pip list 2>/dev/null | grep -i vllm || echo NOT_INSTALLED"',
                                       timeout=15,
                                       label="4b. Check vLLM (/opt/vllm-env)")

        vllm_installed = "NOT_INSTALLED" not in out4b

        if not vllm_installed:
            # === Step 5a: Install prerequisites ===
            run_cmd(ssh,
                    'wsl -d Ubuntu -- bash -c "sudo apt-get update -y && sudo apt-get install -y python3-pip python3-venv"',
                    timeout=120,
                    label="5a. Install python3-pip and python3-venv")

            # === Step 5b: Create venv ===
            run_cmd(ssh,
                    'wsl -d Ubuntu -- bash -c "sudo python3 -m venv /opt/vllm-env"',
                    timeout=30,
                    label="5b. Create venv at /opt/vllm-env")

            # === Step 5c: Install vLLM (long operation) ===
            print("\n[INFO] Installing vLLM via pip — this may take several minutes...")
            code5c, out5c, err5c = run_cmd(ssh,
                                           'wsl -d Ubuntu -- bash -c "/opt/vllm-env/bin/pip install vllm"',
                                           timeout=600,
                                           label="5c. pip install vllm (up to 600s)")
            if code5c != 0:
                print("[ERROR] vLLM installation failed!")
                print("STDOUT:", out5c[-500:] if len(out5c) > 500 else out5c)
                print("STDERR:", err5c[-500:] if len(err5c) > 500 else err5c)
        else:
            print("\n[INFO] vLLM already installed in /opt/vllm-env. Skipping installation.")

        # === Step 6: Test vLLM import ===
        code6, out6, err6 = run_cmd(ssh,
                                    'wsl -d Ubuntu -- bash -c "/opt/vllm-env/bin/python -c \\"import vllm; print(vllm.__version__)\\""',
                                    timeout=60,
                                    label="6. Test vLLM import")
        if code6 != 0:
            print("\n[ERROR] vLLM import failed. Check installation above.")
            # Don't exit — continue to gather info

        # === Step 7: Check model directory ===
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "ls -la /mnt/c/models/qwen3-32b-awq/ 2>/dev/null || echo MODEL_DIR_NOT_FOUND"',
                timeout=15,
                label="7. Check model directory on OMEN")

        # === Step 8: Start vLLM server in background ===
        serve_cmd = (
            'wsl -d Ubuntu -- bash -c "'
            'nohup /opt/vllm-env/bin/python -m vllm.entrypoints.openai.api_server '
            '--model /mnt/c/models/qwen3-32b-awq '
            '--quantization awq_marlin '
            '--host 0.0.0.0 '
            '--port 8000 '
            '--served-model-name qwen3-32b-awq '
            '--enable-auto-tool-choice '
            '--tool-call-parser hermes '
            '--max-model-len 32768 '
            '> /tmp/vllm.log 2>&1 & '
            'echo PID=$!"'
        )
        code8, out8, err8 = run_cmd(ssh, serve_cmd, timeout=15,
                                    label="8. Start vLLM server in background")

        if "PID=" in out8:
            pid = out8.strip().split("PID=")[-1].strip()
            print(f"\n[INFO] vLLM server launched with PID: {pid}")

        # === Step 9: Wait 30s and check ===
        print("\n[INFO] Waiting 30 seconds for vLLM server to initialize...")
        time.sleep(30)

        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "curl -s http://localhost:8000/v1/models || (echo NOT_READY_checking_log && tail -30 /tmp/vllm.log)"',
                timeout=30,
                label="9. Check vLLM server status")

        print(f"\n{'='*70}")
        print("ALL STEPS COMPLETE")
        print(f"{'='*70}")

    finally:
        ssh.close()
        print("\nSSH connection closed.")


if __name__ == "__main__":
    main()
