"""
restart_chat.py — Push updated palace-chat.py to OMEN and restart the chat window.
SSH via paramiko to 169.254.26.30.
"""

import paramiko
import time
import sys

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"

LOCAL_FILE = r"C:\Users\stone\stone-ai\palace-chat.py"
REMOTE_FILE = r"C:\Users\admin\Desktop\palace-chat.py"
REMOTE_BAT = r"C:\Users\admin\Desktop\run-chat.bat"
REMOTE_VBS = r"C:\Users\admin\Desktop\CLICK_ME_TO_CHAT.vbs"
PYTHON_PATH = r"C:\vllm-env\Scripts\python.exe"


def run_cmd(ssh, cmd, timeout=30):
    """Execute a command over SSH and return stdout/stderr."""
    print(f"  > {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(f"    stdout: {out}")
    if err:
        print(f"    stderr: {err}")
    return out, err


def main():
    print(f"[1] Connecting to {HOST}:{PORT} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    print("    Connected.\n")

    # Step 2: Kill existing python processes
    print("[2] Killing existing python.exe processes...")
    run_cmd(ssh, "taskkill /f /im python.exe")
    time.sleep(2)

    # Step 3: SFTP push palace-chat.py
    print(f"\n[3] Pushing {LOCAL_FILE} -> {REMOTE_FILE}...")
    sftp = ssh.open_sftp()
    sftp.put(LOCAL_FILE, REMOTE_FILE)
    sftp.close()
    print("    File transferred.\n")

    # Step 4: Verify compile
    print("[4] Verifying compile...")
    out, err = run_cmd(ssh, f'"{PYTHON_PATH}" -m py_compile "{REMOTE_FILE}"')
    if "Error" in err or "SyntaxError" in err:
        print("    COMPILE FAILED. Aborting.")
        ssh.close()
        sys.exit(1)
    print("    Compile OK.\n")

    # Step 5: Get scheduled time (now + 2 min)
    print("[5] Getting scheduled time...")
    out, err = run_cmd(ssh, 'powershell -Command "([DateTime]::Now.AddMinutes(2)).ToString(\'HH:mm\')"')
    sched_time = out.strip()
    print(f"    Scheduled time: {sched_time}\n")

    # Step 6: Delete old scheduled task
    print("[6] Deleting old PalaceChat task...")
    run_cmd(ssh, 'schtasks /delete /tn "PalaceChat" /f')
    print()

    # Step 7: Check/create BAT wrapper
    print("[7] Checking run-chat.bat...")
    out, err = run_cmd(ssh, f'if exist "{REMOTE_BAT}" (echo EXISTS) else (echo MISSING)')
    bat_exists = "EXISTS" in out

    if bat_exists:
        print("    run-chat.bat exists. Checking contents...")
        run_cmd(ssh, f'type "{REMOTE_BAT}"')
    else:
        print("    run-chat.bat missing. Creating...")
        # Create the bat file
        bat_content = f'@wscript.exe "{REMOTE_VBS}"'
        run_cmd(ssh, f'echo @wscript.exe "{REMOTE_VBS}" > "{REMOTE_BAT}"')
        print("    Created run-chat.bat.")

    # Verify VBS exists
    print("    Checking CLICK_ME_TO_CHAT.vbs...")
    out, err = run_cmd(ssh, f'if exist "{REMOTE_VBS}" (echo EXISTS) else (echo MISSING)')
    if "EXISTS" in out:
        print("    VBS exists. Contents:")
        run_cmd(ssh, f'type "{REMOTE_VBS}"')
    else:
        print("    WARNING: VBS file missing! Creating it...")
        # Create VBS that launches python directly
        vbs_line1 = f'Set ws = CreateObject("WScript.Shell")'
        vbs_line2 = f'ws.Run """{PYTHON_PATH}"" ""{REMOTE_FILE}""", 1, False'
        run_cmd(ssh, f'(echo Set ws = CreateObject^("WScript.Shell"^) & echo ws.Run """{PYTHON_PATH}"" ""{REMOTE_FILE}""", 1, False) > "{REMOTE_VBS}"')
        print("    Created VBS file.")
    print()

    # Step 8: Create scheduled task
    print(f"[8] Creating PalaceChat task at {sched_time}...")
    run_cmd(ssh, f'schtasks /create /tn "PalaceChat" /tr "{REMOTE_BAT}" /sc once /st {sched_time} /ru "admin" /it /f')
    print()

    # Step 9: Run the task immediately
    print("[9] Running PalaceChat task now...")
    run_cmd(ssh, 'schtasks /run /tn "PalaceChat"')
    print()

    # Step 10: Wait and verify
    print("[10] Waiting 8 seconds for process to start...")
    time.sleep(8)
    print("    Checking for python.exe...")
    out, err = run_cmd(ssh, "tasklist | findstr -i python")

    ssh.close()

    if "python" in out.lower():
        print("\n=== SUCCESS: python.exe is running on the OMEN. Chat restarted. ===")
    else:
        print("\n=== WARNING: python.exe not detected. May need manual check. ===")


if __name__ == "__main__":
    main()
