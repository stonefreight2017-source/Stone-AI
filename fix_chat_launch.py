"""
Chaos (Head 3) - Fix Palace Chat Window on OMEN
Connects via SSH, verifies files, launches visible CMD window for Trina.
"""

import paramiko
import os
import sys
import time

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"

LOCAL_PY = r"C:\Users\stone\stone-ai\palace-chat.py"
LOCAL_BAT = r"C:\Users\stone\stone-ai\palace-chat.bat"
REMOTE_PY = "C:\\Users\\admin\\Desktop\\palace-chat.py"
REMOTE_BAT = "C:\\Users\\admin\\Desktop\\palace-chat.bat"
REMOTE_VBS = "C:\\Users\\admin\\Desktop\\launch-chat.vbs"
REMOTE_HOW = "C:\\Users\\admin\\Desktop\\HOW-TO-CHAT.txt"

HOW_TO_TEXT = (
    "=============================================\n"
    "THREE-HEADED MONSTER - CHAT ACCESS\n"
    "=============================================\n"
    "\n"
    "OPTION 1: Double-click palace-chat.bat on Desktop\n"
    "\n"
    "OPTION 2: Open CMD and type:\n"
    "  cd C:\\Users\\admin\\Desktop\n"
    "  palace-chat.bat\n"
    "\n"
    "OPTION 3: Open CMD and type:\n"
    "  python C:\\Users\\admin\\Desktop\\palace-chat.py\n"
    "\n"
    "COMMANDS INSIDE CHAT:\n"
    "  Just type and press Enter to talk\n"
    "  /heads  - see all agents\n"
    "  /clear  - reset conversation\n"
    "  exit    - close chat\n"
    "=============================================\n"
)

VBS_CONTENT = (
    'Set WshShell = CreateObject("WScript.Shell")\n'
    'WshShell.Run "cmd /c start ""THREE-HEADED MONSTER"" '
    '""C:\\Users\\admin\\Desktop\\palace-chat.bat""", 1, False\n'
)


def run_cmd(ssh, cmd, label=""):
    """Run a command over SSH and print output."""
    if label:
        print(f"\n--- {label} ---")
    print(f"  CMD: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(f"  OUT: {out}")
    if err:
        print(f"  ERR: {err}")
    return out, err


def main():
    print("=" * 60)
    print("CHAOS - Palace Chat Launch Fix")
    print("=" * 60)

    # Connect
    print(f"\nConnecting to {HOST}:{PORT} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    except Exception as e:
        print(f"FATAL: SSH connection failed: {e}")
        sys.exit(1)
    print("Connected.")

    sftp = ssh.open_sftp()

    # Step 1: Verify/upload palace-chat files
    print("\n[1] Checking remote files...")
    for local, remote, name in [
        (LOCAL_PY, REMOTE_PY, "palace-chat.py"),
        (LOCAL_BAT, REMOTE_BAT, "palace-chat.bat"),
    ]:
        try:
            info = sftp.stat(remote)
            print(f"  {name} EXISTS on OMEN (size={info.st_size})")
        except (FileNotFoundError, IOError):
            print(f"  {name} NOT FOUND - uploading from local...")
            sftp.put(local, remote)
            print(f"  {name} uploaded.")

    # Step 2: Upload VBS launcher
    print("\n[2] Writing VBS launcher...")
    with sftp.open(REMOTE_VBS, "w") as f:
        f.write(VBS_CONTENT)
    print(f"  Written: {REMOTE_VBS}")

    # Step 3: Upload HOW-TO-CHAT.txt
    print("\n[3] Writing HOW-TO-CHAT.txt...")
    with sftp.open(REMOTE_HOW, "w") as f:
        f.write(HOW_TO_TEXT)
    print(f"  Written: {REMOTE_HOW}")

    sftp.close()

    # Step 4: Check Ollama
    run_cmd(ssh, "tasklist | findstr /i ollama", "Check Ollama")

    # Step 5: Kill old scheduled task
    run_cmd(ssh, 'schtasks /delete /tn "PalaceChat" /f', "Kill old PalaceChat task")

    # Step 6: METHOD 1 - schtasks with interactive flag
    print("\n[METHOD 1] schtasks create + run...")
    run_cmd(
        ssh,
        'schtasks /create /tn "PalaceChat" /tr "cmd /c start \\"THREE-HEADED MONSTER\\" C:\\Users\\admin\\Desktop\\palace-chat.bat" /sc once /st 00:00 /ru "admin" /it /f',
        "Create task",
    )
    out, err = run_cmd(ssh, 'schtasks /run /tn "PalaceChat"', "Run task")

    time.sleep(3)

    # Check if cmd.exe appeared
    out_check, _ = run_cmd(
        ssh, 'tasklist | findstr /i "cmd.exe python"', "Check for CMD/Python process"
    )

    if "cmd.exe" in out_check.lower() or "python" in out_check.lower():
        print("\n  METHOD 1 SUCCESS - process detected!")
    else:
        print("\n  METHOD 1 may not have opened visible window, trying METHOD 2...")

        # METHOD 2 - PowerShell Start-Process
        ps_cmd = "powershell -Command \"Start-Process cmd -ArgumentList '/c start \\\"THREE-HEADED MONSTER\\\" C:\\Users\\admin\\Desktop\\palace-chat.bat' -WindowStyle Normal\""
        run_cmd(ssh, ps_cmd, "METHOD 2 - PowerShell Start-Process")
        time.sleep(3)

        out_check2, _ = run_cmd(
            ssh,
            'tasklist | findstr /i "cmd.exe python"',
            "Check for CMD/Python process",
        )

        if "cmd.exe" in out_check2.lower() or "python" in out_check2.lower():
            print("\n  METHOD 2 SUCCESS - process detected!")
        else:
            print("\n  METHOD 2 uncertain, trying METHOD 3...")

            # METHOD 3 - VBS launcher via schtasks
            run_cmd(
                ssh, 'schtasks /delete /tn "PalaceChatVBS" /f', "Kill old VBS task"
            )
            run_cmd(
                ssh,
                'schtasks /create /tn "PalaceChatVBS" /tr "wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs" /sc once /st 00:00 /ru "admin" /it /f',
                "Create VBS task",
            )
            run_cmd(ssh, 'schtasks /run /tn "PalaceChatVBS"', "Run VBS task")
            time.sleep(3)

            out_check3, _ = run_cmd(
                ssh,
                'tasklist | findstr /i "cmd.exe python wscript"',
                "Check for processes",
            )
            if any(
                x in out_check3.lower()
                for x in ["cmd.exe", "python", "wscript"]
            ):
                print("\n  METHOD 3 SUCCESS - process detected!")
            else:
                print("\n  METHOD 3 - process not confirmed via tasklist.")
                print(
                    "  All 3 methods attempted. VBS launcher + BAT are on desktop for manual use."
                )

    # Final status
    print("\n" + "=" * 60)
    print("FINAL STATUS:")
    run_cmd(ssh, 'schtasks /query /tn "PalaceChat" 2>nul', "PalaceChat task status")
    run_cmd(
        ssh,
        "dir C:\\Users\\admin\\Desktop\\palace-chat.* C:\\Users\\admin\\Desktop\\launch-chat.vbs C:\\Users\\admin\\Desktop\\HOW-TO-CHAT.txt",
        "Desktop files",
    )
    print("=" * 60)

    ssh.close()
    print("\nChaos out. Connection closed.")


if __name__ == "__main__":
    main()
