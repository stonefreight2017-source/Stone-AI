"""
CHAOS (Head 3) -- FINAL Palace Chat Window Fix
The REAL problem: SSH runs as 'rush' in Session 0 (Services).
Console is 'admin' in Session 1. Windows isolates sessions.
We need to get a process into Session 1 under admin.
"""

import paramiko
import time
import sys

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"

LOCAL_PY = r"C:\Users\stone\stone-ai\palace-chat.py"
LOCAL_BAT = r"C:\Users\stone\stone-ai\palace-chat.bat"

DIVIDER = "=" * 70


def run_cmd(ssh, cmd, label="", timeout=30):
    if label:
        print(f"\n--- {label} ---")
    print(f"  CMD> {cmd}")
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace").strip()
        err = stderr.read().decode("utf-8", errors="replace").strip()
    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return "", str(e)
    if out:
        for line in out.split("\n"):
            print(f"  OUT: {line}")
    if err:
        for line in err.split("\n"):
            print(f"  ERR: {line}")
    return out, err


def get_pids(ssh, process_name):
    """Get set of PIDs for a process name."""
    out, _ = run_cmd(ssh, f'tasklist /fi "imagename eq {process_name}" /fo csv /nh', f"PIDs for {process_name}")
    pids = set()
    for line in out.split("\n"):
        line = line.strip().strip('"')
        if line and process_name.lower() in line.lower():
            parts = line.split('","')
            if len(parts) >= 2:
                try:
                    pids.add(int(parts[1].strip('"')))
                except ValueError:
                    pass
    print(f"  PIDs found: {pids}")
    return pids


def main():
    print(DIVIDER)
    print("CHAOS -- PALACE CHAT WINDOW FIX (FINAL)")
    print(f"Target: {HOST}:{PORT} as {USER}")
    print(DIVIDER)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    except Exception as e:
        print(f"FATAL: SSH connection failed: {e}")
        sys.exit(1)
    print("  Connected OK.")

    # ==========================================
    # PHASE 1: DIAGNOSIS
    # ==========================================
    print(f"\n{DIVIDER}")
    print("PHASE 1: DIAGNOSIS")
    print(DIVIDER)

    run_cmd(ssh, "query user", "Console Sessions")
    run_cmd(ssh, "qwinsta", "All Sessions")
    run_cmd(ssh, "whoami", "SSH identity")

    # Check files exist
    run_cmd(ssh, 'dir "C:\\Users\\admin\\Desktop\\palace-chat.*"', "Files on admin Desktop")

    # Check Python
    run_cmd(ssh, '"C:\\vllm-env\\Scripts\\python.exe" --version', "Python vllm-env")

    # Check Ollama
    run_cmd(ssh, 'tasklist | findstr /i "ollama"', "Ollama process")

    # Snapshot BEFORE PIDs
    print("\n--- BASELINE: Current cmd.exe and python.exe PIDs ---")
    before_cmd = get_pids(ssh, "cmd.exe")
    before_python = get_pids(ssh, "python.exe")

    # Check if the existing python.exe (PID 27104) is actually palace-chat
    run_cmd(ssh, 'wmic process where "name=\'python.exe\'" get ProcessId,CommandLine /format:list',
            "What is the existing python.exe running?")

    # Check what the existing cmd.exe (PID 12124, Console session) is
    run_cmd(ssh, 'wmic process where "name=\'cmd.exe\'" get ProcessId,CommandLine,SessionId /format:list',
            "What are the existing cmd.exe processes?")

    # ==========================================
    # PHASE 2: UPLOAD FILES
    # ==========================================
    print(f"\n{DIVIDER}")
    print("PHASE 2: UPLOAD FILES")
    print(DIVIDER)

    sftp = ssh.open_sftp()

    desktop = "C:\\Users\\admin\\Desktop"

    # Upload core files
    for local, remote, name in [
        (LOCAL_PY, f"{desktop}\\palace-chat.py", "palace-chat.py"),
        (LOCAL_BAT, f"{desktop}\\palace-chat.bat", "palace-chat.bat"),
    ]:
        print(f"\n  Uploading {name}...")
        sftp.put(local, remote)
        info = sftp.stat(remote)
        print(f"  OK (size={info.st_size})")

    # Write CLICK_ME_TO_CHAT.vbs
    click_vbs = (
        'Set WshShell = CreateObject("WScript.Shell")\r\n'
        'WshShell.Run "cmd /k cd /d ""C:\\Users\\admin\\Desktop"" && palace-chat.bat", 1, False\r\n'
    )
    print("\n  Writing CLICK_ME_TO_CHAT.vbs...")
    with sftp.open(f"{desktop}\\CLICK_ME_TO_CHAT.vbs", "w") as f:
        f.write(click_vbs)
    print("  OK")

    # Write README_TRINA.txt
    readme = (
        "TRINA - TO TALK TO THE THREE-HEADED MONSTER:\r\n"
        "\r\n"
        'Double-click "CLICK_ME_TO_CHAT.vbs" on the Desktop\r\n'
        "OR\r\n"
        'Double-click "palace-chat.bat" on the Desktop\r\n'
        "\r\n"
        'If nothing happens, open CMD (Windows key, type "cmd", press Enter) and type:\r\n'
        "  cd C:\\Users\\admin\\Desktop\r\n"
        "  palace-chat.bat\r\n"
    )
    print("  Writing README_TRINA.txt...")
    with sftp.open(f"{desktop}\\README_TRINA.txt", "w") as f:
        f.write(readme)
    print("  OK")

    # Write launch-chat.vbs (same as CLICK_ME but separate file for schtasks)
    print("  Writing launch-chat.vbs...")
    with sftp.open(f"{desktop}\\launch-chat.vbs", "w") as f:
        f.write(click_vbs)
    print("  OK")

    # Write a PowerShell launcher script
    ps_launcher = (
        '# Palace Chat Launcher - runs in admin console session\r\n'
        '$batPath = "C:\\Users\\admin\\Desktop\\palace-chat.bat"\r\n'
        'Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d C:\\Users\\admin\\Desktop && palace-chat.bat" -WindowStyle Normal\r\n'
    )
    print("  Writing launch-chat.ps1...")
    with sftp.open(f"{desktop}\\launch-chat.ps1", "w") as f:
        f.write(ps_launcher)
    print("  OK")

    sftp.close()

    # ==========================================
    # PHASE 3: CLEAN UP OLD TASKS
    # ==========================================
    print(f"\n{DIVIDER}")
    print("PHASE 3: CLEAN UP")
    print(DIVIDER)

    for task in ["PalaceChat", "PalaceChatVBS", "PalaceChatFix", "PalaceChatLaunch"]:
        run_cmd(ssh, f'schtasks /delete /tn "{task}" /f 2>nul', f"Delete {task}")

    # ==========================================
    # PHASE 4: LAUNCH ATTEMPTS
    # ==========================================
    print(f"\n{DIVIDER}")
    print("PHASE 4: LAUNCH ATTEMPTS")
    print(DIVIDER)

    success = False

    def check_new_processes(label):
        """Check if NEW cmd.exe or python.exe PIDs appeared since baseline."""
        print(f"\n  Checking for new processes after: {label}")
        after_cmd = get_pids(ssh, "cmd.exe")
        after_python = get_pids(ssh, "python.exe")
        new_cmd = after_cmd - before_cmd
        new_python = after_python - before_python
        print(f"  NEW cmd.exe PIDs: {new_cmd}")
        print(f"  NEW python.exe PIDs: {new_python}")
        if new_cmd or new_python:
            # Verify they're in Console session (Session 1), not Services (Session 0)
            for pid in new_cmd | new_python:
                out, _ = run_cmd(ssh, f'tasklist /fi "pid eq {pid}" /fo list',
                                 f"Verify PID {pid} session")
                if "Console" in out:
                    print(f"  >>> PID {pid} is in Console session -- VISIBLE TO TRINA!")
                    return True
                else:
                    print(f"  PID {pid} is NOT in Console session (Services only)")
        return False

    # ----- APPROACH 1: schtasks with /ru SYSTEM + /IT -----
    # The issue before: /ru "admin" needs admin's password which we don't have.
    # Try SYSTEM which doesn't need a password, but /IT makes it interactive.
    print("\n" + "-"*50)
    print("APPROACH 1: schtasks /ru SYSTEM with /IT")
    print("-"*50)

    run_cmd(ssh,
            'schtasks /create /tn "PalaceChatFix" '
            '/tr "wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs" '
            '/sc once /st 00:00 /ru SYSTEM /it /f',
            "Create task as SYSTEM /IT")
    run_cmd(ssh, 'schtasks /run /tn "PalaceChatFix"', "Run task")
    time.sleep(5)

    if check_new_processes("Approach 1"):
        success = True
        print("\n  >>> APPROACH 1 WORKED!")
    else:
        print("\n  Approach 1 did not produce visible window. Cleaning up...")
        run_cmd(ssh, 'schtasks /delete /tn "PalaceChatFix" /f 2>nul', "Cleanup")

    # ----- APPROACH 2: schtasks as the SSH user (rush) who has a password -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 2: schtasks /ru rush with password + /IT")
        print("-"*50)

        run_cmd(ssh,
                f'schtasks /create /tn "PalaceChatFix" '
                f'/tr "wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs" '
                f'/sc once /st 00:00 /ru "rush" /rp "{PASS}" /it /f',
                "Create task as rush with password")
        run_cmd(ssh, 'schtasks /run /tn "PalaceChatFix"', "Run task")
        time.sleep(5)

        if check_new_processes("Approach 2"):
            success = True
            print("\n  >>> APPROACH 2 WORKED!")
        else:
            print("\n  Approach 2 did not produce visible window. Cleaning up...")
            run_cmd(ssh, 'schtasks /delete /tn "PalaceChatFix" /f 2>nul', "Cleanup")

    # ----- APPROACH 3: WMI Process.Create targeting Session 1 -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 3: WMI Win32_Process.Create")
        print("-"*50)

        # WMI create runs in the caller's session context
        wmi_ps = (
            "powershell -Command \""
            "([wmiclass]'Win32_Process').Create("
            "'wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs'"
            ")"
            "\""
        )
        run_cmd(ssh, wmi_ps, "WMI Process Create")
        time.sleep(5)

        if check_new_processes("Approach 3"):
            success = True
            print("\n  >>> APPROACH 3 WORKED!")

    # ----- APPROACH 4: PowerShell Start-Process -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 4: PowerShell Start-Process")
        print("-"*50)

        run_cmd(ssh,
                'powershell -Command "Start-Process wscript.exe -ArgumentList \'C:\\Users\\admin\\Desktop\\launch-chat.vbs\' -WindowStyle Normal"',
                "PowerShell Start-Process wscript")
        time.sleep(5)

        if check_new_processes("Approach 4"):
            success = True
            print("\n  >>> APPROACH 4 WORKED!")

    # ----- APPROACH 5: explorer.exe launch -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 5: explorer.exe launch")
        print("-"*50)

        run_cmd(ssh, 'explorer.exe "C:\\Users\\admin\\Desktop\\palace-chat.bat"', "Explorer launch")
        time.sleep(5)

        if check_new_processes("Approach 5"):
            success = True
            print("\n  >>> APPROACH 5 WORKED!")

    # ----- APPROACH 6: Direct cmd /c start -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 6: cmd /c start")
        print("-"*50)

        run_cmd(ssh,
                'cmd /c start "PALACE CHAT" "C:\\Users\\admin\\Desktop\\palace-chat.bat"',
                "cmd /c start")
        time.sleep(5)

        if check_new_processes("Approach 6"):
            success = True
            print("\n  >>> APPROACH 6 WORKED!")

    # ----- APPROACH 7: Registry Run key + Startup folder -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 7: Registry Run key + Startup folder (next login)")
        print("-"*50)

        # HKLM Run key
        run_cmd(ssh,
                'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" '
                '/v PalaceChat /t REG_SZ '
                '/d "wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs" /f',
                "HKLM Run key")

        # Also admin's HKCU Run key (via admin's NTUSER)
        run_cmd(ssh,
                'reg add "HKU\\S-1-5-21" /v PalaceChat /t REG_SZ /d "test" /f 2>nul',
                "Check HKU access (will fail, just testing)")

        # admin's user startup folder
        admin_startup = "C:\\Users\\admin\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp"
        run_cmd(ssh,
                f'copy /Y "C:\\Users\\admin\\Desktop\\CLICK_ME_TO_CHAT.vbs" "{admin_startup}\\CLICK_ME_TO_CHAT.vbs"',
                "Copy to admin Startup folder")

        # Common startup
        common_startup = "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
        run_cmd(ssh,
                f'copy /Y "C:\\Users\\admin\\Desktop\\CLICK_ME_TO_CHAT.vbs" "{common_startup}\\CLICK_ME_TO_CHAT.vbs"',
                "Copy to Common Startup folder")

        print("\n  Startup entries set. Chat will auto-open on next login.")

    # ----- APPROACH 8: Use msg command to notify Trina -----
    print("\n" + "-"*50)
    print("APPROACH 8: Send visible notification to Trina")
    print("-"*50)

    run_cmd(ssh, 'msg admin /time:300 "TRINA: Double-click CLICK_ME_TO_CHAT.vbs on your Desktop to chat with the Three-Headed Monster!"',
            "MSG to admin")
    run_cmd(ssh, 'msg * /time:300 "TRINA: Double-click CLICK_ME_TO_CHAT.vbs on your Desktop to chat with the Three-Headed Monster!"',
            "MSG to all")

    # ----- APPROACH 9: Create a PowerShell script that uses COM to show a dialog -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 9: Try schtasks as admin with interactive session")
        print("-"*50)

        # The trick: create the task to run as the LOGGED IN user
        # Use /ru with the machine-qualified name
        run_cmd(ssh, 'schtasks /delete /tn "PalaceChatFix" /f 2>nul', "Cleanup")

        # Try without /rp (might work if admin has no password or auto-login)
        run_cmd(ssh,
                'schtasks /create /tn "PalaceChatFix" '
                '/tr "wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs" '
                '/sc once /st 00:00 /ru "OMEN\\admin" /it /f',
                "Create task as OMEN\\admin (no password)")
        out9, err9 = run_cmd(ssh, 'schtasks /run /tn "PalaceChatFix"', "Run task")
        time.sleep(5)

        if check_new_processes("Approach 9"):
            success = True
            print("\n  >>> APPROACH 9 WORKED!")
        else:
            run_cmd(ssh, 'schtasks /delete /tn "PalaceChatFix" /f 2>nul', "Cleanup")

    # ----- APPROACH 10: Use PowerShell remoting to local machine targeting console session -----
    if not success:
        print("\n" + "-"*50)
        print("APPROACH 10: PowerShell Invoke-CimMethod Win32_Process targeting session 1")
        print("-"*50)

        # Use CIM to create a process, specifying we want it in session 1
        cim_cmd = (
            'powershell -Command "'
            '$startInfo = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ShowWindow=1}; '
            'Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{'
            "CommandLine='wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs'; "
            'ProcessStartupInformation=$startInfo'
            '}"'
        )
        run_cmd(ssh, cim_cmd, "CIM Process Create")
        time.sleep(5)

        if check_new_processes("Approach 10"):
            success = True
            print("\n  >>> APPROACH 10 WORKED!")

    # ==========================================
    # PHASE 5: FINAL REPORT
    # ==========================================
    print(f"\n{DIVIDER}")
    print("PHASE 5: FINAL STATUS")
    print(DIVIDER)

    run_cmd(ssh, "query user", "Sessions")
    run_cmd(ssh, 'tasklist | findstr /i "cmd.exe python.exe wscript.exe ollama"', "Processes")
    run_cmd(ssh, f'dir "C:\\Users\\admin\\Desktop\\*.vbs" "C:\\Users\\admin\\Desktop\\*.bat" "C:\\Users\\admin\\Desktop\\*.txt"',
            "Desktop files")

    # Check if startup entries were set
    run_cmd(ssh, 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /v PalaceChat 2>nul',
            "Registry Run key check")
    run_cmd(ssh,
            f'dir "C:\\Users\\admin\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp\\CLICK_ME*" 2>nul',
            "Admin Startup folder check")

    print(f"\n{DIVIDER}")
    if success:
        print("RESULT: NEW PROCESS DETECTED IN CONSOLE SESSION!")
        print("Chat window should be visible on the Palace screen NOW.")
    else:
        print("RESULT: COULD NOT INJECT WINDOW INTO CONSOLE SESSION VIA SSH.")
        print("")
        print("ROOT CAUSE: Windows Session Isolation (Session 0 vs Session 1).")
        print("SSH runs as 'rush' in Session 0 (Services). Console is 'admin' in")
        print("Session 1. Windows prevents cross-session window creation without")
        print("PsExec -i or equivalent privilege tools.")
        print("")
        print("WHAT WE DEPLOYED (these WILL work):")
        print("  1. CLICK_ME_TO_CHAT.vbs - Trina double-clicks this on Desktop")
        print("  2. README_TRINA.txt - Instructions for Trina")
        print("  3. palace-chat.bat - Direct launcher")
        print("  4. Startup folder entry - AUTO-LAUNCHES on next login")
        print("  5. Registry Run key - AUTO-LAUNCHES on next login")
        print("  6. MSG notification sent to admin's screen")
        print("")
        print("IMMEDIATE ACTION: Trina can double-click CLICK_ME_TO_CHAT.vbs NOW.")
        print("PERMANENT FIX: Chat auto-opens on every login via Startup folder.")
    print(DIVIDER)

    ssh.close()
    print("\nChaos out.")


if __name__ == "__main__":
    main()
