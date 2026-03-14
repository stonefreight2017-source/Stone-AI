#!/usr/bin/env python3
"""
Step 2: Diagnose why nohup didn't work and fix vLLM server launch on OMEN WSL2.
"""

import paramiko
import sys
import time

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"


def run_cmd(ssh, cmd, timeout=120, label=""):
    print(f"\n{'='*70}")
    print(f"[STEP] {label}")
    print(f"[CMD]  {cmd}")
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
    ssh.connect(HOST, port=PORT, username=USER, password=PASS,
                timeout=10, look_for_keys=False, allow_agent=False)
    print("Connected.\n")

    try:
        # Check what tools are available for daemonizing
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "which screen; which tmux; which systemctl; which setsid; dpkg -l | grep -E \'screen|tmux\' | head -5"',
                timeout=15,
                label="Check available daemon tools (screen/tmux/systemctl/setsid)")

        # Check if port 8000 already in use or vLLM already running
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "ss -tlnp | grep 8000 || echo PORT_8000_FREE"',
                timeout=15,
                label="Check if port 8000 is in use")

        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "ps aux | grep vllm | grep -v grep || echo NO_VLLM_RUNNING"',
                timeout=15,
                label="Check for running vLLM processes")

        # Install screen if needed, then use it to launch vLLM
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "sudo apt-get install -y screen 2>/dev/null; which screen"',
                timeout=60,
                label="Install screen")

        # Kill any existing vLLM first
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "pkill -f vllm.entrypoints 2>/dev/null; sleep 1; echo cleaned"',
                timeout=15,
                label="Kill any existing vLLM processes")

        # Launch vLLM inside a screen session so it survives
        # Using screen -dmS to create a detached session
        serve_cmd = (
            'wsl -d Ubuntu -- bash -c "'
            'screen -dmS vllm bash -c \\"/opt/vllm-env/bin/python -m vllm.entrypoints.openai.api_server '
            '--model /mnt/c/models/qwen3-32b-awq '
            '--quantization awq_marlin '
            '--host 0.0.0.0 '
            '--port 8000 '
            '--served-model-name qwen3-32b-awq '
            '--enable-auto-tool-choice '
            '--tool-call-parser hermes '
            '--max-model-len 32768 '
            '2>&1 | tee /tmp/vllm.log\\" && '
            'sleep 2 && screen -ls && echo SCREEN_LAUNCHED'
            '"'
        )
        run_cmd(ssh, serve_cmd, timeout=30,
                label="Launch vLLM in screen session")

        # Check if screen session exists
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "screen -ls; ps aux | grep vllm | grep -v grep"',
                timeout=15,
                label="Verify screen session and vLLM process")

        # Wait for server to start
        print("\n[INFO] Waiting 30 seconds for vLLM server to initialize...")
        time.sleep(30)

        # Check server
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "curl -s http://localhost:8000/v1/models || echo CURL_FAILED"',
                timeout=15,
                label="Check vLLM /v1/models endpoint")

        # Check log
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "cat /tmp/vllm.log 2>/dev/null | tail -50 || echo NO_LOG"',
                timeout=15,
                label="Check vLLM log")

        # If screen approach doesn't work, try alternative: keep WSL running
        # by using wsl -d Ubuntu -e which keeps a persistent process
        run_cmd(ssh,
                'wsl -d Ubuntu -- bash -c "ps aux | grep vllm | grep -v grep | wc -l"',
                timeout=15,
                label="Count vLLM processes")

        print(f"\n{'='*70}")
        print("DIAGNOSTIC COMPLETE")
        print(f"{'='*70}")

    finally:
        ssh.close()
        print("\nSSH connection closed.")


if __name__ == "__main__":
    main()
