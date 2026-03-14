import paramiko
import time

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"

LOCAL_PY = r"C:\Users\stone\stone-ai\palace-chat.py"
LOCAL_BAT = r"C:\Users\stone\stone-ai\palace-chat.bat"
REMOTE_PY = r"C:\Users\admin\Desktop\palace-chat.py"
REMOTE_BAT = r"C:\Users\admin\Desktop\palace-chat.bat"

def run_cmd(ssh, cmd, label=""):
    if label:
        print(f"\n--- {label} ---")
    print(f"CMD: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(f"OUT: {out}")
    if err:
        print(f"ERR: {err}")
    return out

def main():
    print(f"Connecting to {HOST}:{PORT} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    print("SSH connected.")

    # SFTP transfer
    print("\nOpening SFTP...")
    sftp = ssh.open_sftp()

    for local, remote in [(LOCAL_PY, REMOTE_PY), (LOCAL_BAT, REMOTE_BAT)]:
        print(f"Uploading {local} -> {remote}")
        with open(local, "rb") as f:
            data = f.read()
        with sftp.file(remote, "wb") as rf:
            rf.write(data)
        print(f"  Uploaded ({len(data)} bytes)")

    sftp.close()
    print("SFTP closed.")

    # Verify files landed
    run_cmd(ssh, f'dir "C:\\Users\\admin\\Desktop\\palace-chat.*"', "Verify files on desktop")

    # Delete old scheduled task (ignore errors)
    run_cmd(ssh, 'schtasks /delete /tn "PalaceChat" /f', "Delete old task")

    # Get time 1 minute ahead
    future_time = run_cmd(
        ssh,
        'powershell -Command "(Get-Date).AddMinutes(1).ToString(\'HH:mm\')"',
        "Get scheduled time"
    )
    if not future_time:
        print("ERROR: Could not get future time. Aborting.")
        ssh.close()
        return

    print(f"Scheduling for: {future_time}")

    # Create scheduled task
    create_cmd = (
        f'schtasks /create /tn "PalaceChat" '
        f'/tr "cmd /c start C:\\Users\\admin\\Desktop\\palace-chat.bat" '
        f'/sc once /st {future_time} /ru "admin" /it /f'
    )
    run_cmd(ssh, create_cmd, "Create scheduled task")

    # Force-run the task immediately
    time.sleep(2)
    run_cmd(ssh, 'schtasks /run /tn "PalaceChat"', "Run task now")

    # Check task status
    time.sleep(3)
    run_cmd(ssh, 'schtasks /query /tn "PalaceChat" /v /fo list', "Task status")

    ssh.close()
    print("\nSSH closed. Done.")

if __name__ == "__main__":
    main()
