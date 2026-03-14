"""
Chaos Recon: vLLM Installation on OMEN
Mission: pip install vllm into C:\\vllm-env, test import, attempt server start
Uses paramiko for SSH with password auth.
"""
import paramiko
import sys
import time

OMEN_HOST = "169.254.26.30"
OMEN_USER = "rush"
OMEN_PASS = "Palace2026!"
OMEN_PORT = 22


def get_ssh_client():
    """Create and return a connected SSH client."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(OMEN_HOST, port=OMEN_PORT, username=OMEN_USER, password=OMEN_PASS, timeout=15)
    return client


def run_remote(client, cmd, timeout=600, description=""):
    """Run a command on the OMEN via SSH and return stdout, stderr, returncode."""
    print(f"\n{'='*60}")
    print(f"[CHAOS] {description}")
    print(f"[CMD] {cmd}")
    print(f"{'='*60}", flush=True)

    start = time.time()
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)

        # Read output
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        rc = stdout.channel.recv_exit_status()
        elapsed = time.time() - start

        if out:
            print(f"[STDOUT]\n{out}")
        if err:
            print(f"[STDERR]\n{err}")
        print(f"[EXIT CODE] {rc} (took {elapsed:.1f}s)", flush=True)

        return rc, out, err
    except Exception as e:
        elapsed = time.time() - start
        print(f"[ERROR] {e} (after {elapsed:.1f}s)", flush=True)
        return -1, "", str(e)


def main():
    print("[CHAOS] vLLM Installation Mission — OMEN target")
    print(f"[CHAOS] Target: {OMEN_USER}@{OMEN_HOST}")
    print(f"[CHAOS] Connecting via paramiko...", flush=True)

    try:
        client = get_ssh_client()
    except Exception as e:
        print(f"\n[CHAOS] FAILED: Cannot connect to OMEN: {e}")
        sys.exit(1)

    print("[CHAOS] Connected to OMEN.", flush=True)

    # Step 0: Connectivity check
    rc, out, err = run_remote(client, "echo CONNECTION_OK", timeout=10, description="Step 0: Connectivity check")
    if rc != 0 or "CONNECTION_OK" not in out:
        print("\n[CHAOS] FAILED: Connection test failed. Aborting.")
        client.close()
        sys.exit(1)

    # Step 1: Pre-flight — confirm environment
    rc, out, err = run_remote(
        client,
        r'"C:\vllm-env\Scripts\python.exe" --version & "C:\vllm-env\Scripts\pip.exe" --version',
        timeout=30,
        description="Step 1: Pre-flight — Python and pip versions"
    )
    if rc != 0:
        print("\n[CHAOS] FAILED: vllm-env not responding. Aborting.")
        client.close()
        sys.exit(1)

    # Check what's already installed
    run_remote(
        client,
        r'"C:\vllm-env\Scripts\pip.exe" list 2>&1 | findstr -i "vllm torch"',
        timeout=30,
        description="Step 1b: Check existing packages (vllm, torch)"
    )

    # Step 2: Install vLLM via pip
    print("\n[CHAOS] Starting vLLM installation. This may take several minutes...", flush=True)
    rc, out, err = run_remote(
        client,
        r'"C:\vllm-env\Scripts\pip.exe" install vllm --no-cache-dir 2>&1',
        timeout=600,
        description="Step 2: pip install vllm (timeout: 10 min)"
    )

    combined = (out + err).lower()
    if rc != 0:
        print("\n" + "="*60)
        print("[CHAOS] RESULT: vLLM pip install FAILED")
        print("="*60)

        full = out + err
        if "no matching distribution" in combined:
            print("[DIAGNOSIS] No wheel available for this Python/OS/CUDA combo.")
            print("[DETAIL] vLLM may not publish Windows wheels. Linux-only is common.")
        elif "error: subprocess-exited-with-error" in combined or "building wheel" in combined:
            print("[DIAGNOSIS] Tried to build from source — likely missing CUDA toolkit (nvcc).")
        elif "timeout" in combined:
            print("[DIAGNOSIS] Installation timed out.")
        elif "could not find a version" in combined:
            print("[DIAGNOSIS] No compatible version found for this platform.")
        else:
            print("[DIAGNOSIS] Unknown failure. Review full output above.")

        # Check if partial install happened
        run_remote(
            client,
            r'"C:\vllm-env\Scripts\pip.exe" list 2>&1 | findstr -i vllm',
            timeout=15,
            description="Check if vllm partially installed"
        )

        print("\n[CHAOS] Stopping here per mission rules. No workarounds attempted.")
        print("[CHAOS] Founder decision needed on next steps.")
        print("\n[CHAOS] POTENTIAL OPTIONS (for founder review):")
        print("  Option B: Docker with NVIDIA Container Toolkit (WSL2 needed)")
        print("  Option C: WSL2 Ubuntu + native Linux vLLM install")
        print("  Option D: Build vLLM from source with CUDA toolkit installed")
        client.close()
        return

    print("\n[CHAOS] pip install completed successfully. Proceeding to import test.", flush=True)

    # Step 3: Import test
    rc, out, err = run_remote(
        client,
        r'"C:\vllm-env\Scripts\python.exe" -c "import vllm; print(vllm.__version__)"',
        timeout=60,
        description="Step 3: Import test — import vllm"
    )

    if rc != 0:
        print("\n" + "="*60)
        print("[CHAOS] RESULT: vLLM installed but IMPORT FAILED")
        print("="*60)
        print("[DIAGNOSIS] Package installed but can't load. Likely missing runtime deps or DLLs.")
        print("[CHAOS] Founder decision needed.")
        client.close()
        return

    vllm_version = out.strip()
    print(f"\n[CHAOS] Import test PASSED. vLLM version: {vllm_version}", flush=True)

    # Step 4: Start vLLM server in background
    # On Windows via SSH, we use 'start /b' inside cmd to background it
    server_cmd = (
        'cmd /c "start /b "" '
        r'"C:\vllm-env\Scripts\python.exe" -m vllm.entrypoints.openai.api_server '
        r'--model C:\models\qwen3-32b-awq --quantization awq --host 0.0.0.0 --port 8000 '
        r'> C:\vllm-server.log 2>&1"'
    )
    rc, out, err = run_remote(
        client,
        server_cmd,
        timeout=15,
        description="Step 4: Launch vLLM server in background"
    )

    print("[CHAOS] Server launch command issued. Waiting 10s for startup...", flush=True)
    time.sleep(10)

    # Check if process is running
    rc2, out2, err2 = run_remote(
        client,
        'tasklist /FI "IMAGENAME eq python.exe" 2>nul',
        timeout=15,
        description="Step 4b: Check if python.exe process is running"
    )

    if "python.exe" in out2.lower():
        print("[CHAOS] python.exe process confirmed running on OMEN.")
    else:
        print("[CHAOS] WARNING: python.exe not found. Checking log...")

    # Grab log regardless
    run_remote(
        client,
        r'type C:\vllm-server.log 2>nul',
        timeout=15,
        description="Step 4c: Server startup log"
    )

    # Final report
    print("\n" + "="*60)
    print("[CHAOS] MISSION REPORT")
    print("="*60)
    print(f"  pip install vllm: SUCCESS")
    print(f"  vLLM version: {vllm_version}")
    print(f"  import vllm: PASSED")
    print(f"  Server launch: ATTEMPTED — check log at C:\\vllm-server.log")
    print(f"  Verify: http://169.254.26.30:8000/v1/models")
    print("="*60)

    client.close()


if __name__ == "__main__":
    main()
