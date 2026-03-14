"""
Deploy palace-chat.py to OMEN and launch it in Console Session 1.
"""
import paramiko
import time
import sys

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"
REMOTE_CHAT = r"C:\Users\admin\Desktop\palace-chat.py"
REMOTE_VBS = r"C:\Users\admin\Desktop\CLICK_ME_TO_CHAT.vbs"
REMOTE_BAT = r"C:\Users\admin\Desktop\run-chat.bat"
LOCAL_CHAT = r"C:\Users\stone\stone-ai\palace-chat.py"
PYTHON = r"C:\vllm-env\Scripts\python.exe"


def run_cmd(ssh, cmd, timeout=15):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(f"  STDOUT: {out}")
    if err:
        print(f"  STDERR: {err}")
    code = stdout.channel.recv_exit_status()
    print(f"  EXIT: {code}")
    return out, err, code


def main():
    print("=" * 60)
    print("PALACE CHAT DEPLOYMENT")
    print("=" * 60)

    # --- Connect ---
    print(f"\n[1] Connecting to {HOST}:{PORT} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=10)
    print("  Connected.")

    # --- SFTP the file ---
    print(f"\n[2] SFTP: {LOCAL_CHAT} -> {REMOTE_CHAT}")
    sftp = ssh.open_sftp()
    sftp.put(LOCAL_CHAT, REMOTE_CHAT)
    stat = sftp.stat(REMOTE_CHAT)
    print(f"  Uploaded. Remote size: {stat.st_size} bytes")
    sftp.close()

    # --- Compile check ---
    print("\n[3] Compile check on OMEN...")
    _, _, code = run_cmd(ssh, f'"{PYTHON}" -m py_compile "{REMOTE_CHAT}"')
    if code != 0:
        print("  *** COMPILE FAILED — aborting ***")
        ssh.close()
        sys.exit(1)
    print("  Compiles clean.")

    # --- Ollama check ---
    print("\n[4] Checking Ollama...")
    out, _, _ = run_cmd(ssh, 'tasklist | findstr /i ollama')
    if "ollama" not in out.lower():
        print("  WARNING: Ollama not found in tasklist. Chat may fail to connect.")
    else:
        print("  Ollama is running.")

    # --- Write VBS launcher ---
    print("\n[5] Writing VBS launcher...")
    vbs_content = (
        'Set WshShell = CreateObject("WScript.Shell")\r\n'
        f'WshShell.Run "cmd /k cd /d ""C:\\Users\\admin\\Desktop"" && ""{PYTHON}"" palace-chat.py", 1, False\r\n'
    )
    sftp = ssh.open_sftp()
    with sftp.file(REMOTE_VBS, "w") as f:
        f.write(vbs_content)
    vstat = sftp.stat(REMOTE_VBS)
    print(f"  Written. Size: {vstat.st_size} bytes")
    sftp.close()

    # --- Write BAT wrapper (for fallback) ---
    print("\n[5b] Writing BAT wrapper (fallback)...")
    bat_content = f'@wscript.exe "C:\\Users\\admin\\Desktop\\CLICK_ME_TO_CHAT.vbs"\r\n'
    sftp = ssh.open_sftp()
    with sftp.file(REMOTE_BAT, "w") as f:
        f.write(bat_content)
    sftp.close()
    print("  Written.")

    # --- Get scheduled time ---
    print("\n[6] Getting schedule time (now + 2 min)...")
    time_out, _, _ = run_cmd(ssh, 'powershell -Command "([DateTime]::Now.AddMinutes(2)).ToString(\'HH:mm\')"')
    sched_time = time_out.strip()
    print(f"  Scheduled time: {sched_time}")

    # --- Kill old task if exists ---
    run_cmd(ssh, 'schtasks /delete /tn "PalaceChat" /f')

    # ============================================================
    # ATTEMPT 1: schtasks with wscript.exe -> VBS
    # ============================================================
    print("\n[7] ATTEMPT 1: schtasks with wscript -> VBS")
    create_cmd = (
        f'schtasks /create /tn "PalaceChat" '
        f'/tr "wscript.exe {REMOTE_VBS}" '
        f'/sc once /st {sched_time} /ru "admin" /it /f'
    )
    _, _, code1 = run_cmd(ssh, create_cmd)

    print("\n[8] Force-running task...")
    _, _, run_code = run_cmd(ssh, 'schtasks /run /tn "PalaceChat"')

    print("\n[9] Waiting 8 seconds...")
    time.sleep(8)

    print("\n[10] Checking processes...")
    out_ps, _, _ = run_cmd(ssh, 'tasklist | findstr /i "python wscript"')

    print("\n[10b] Task status...")
    run_cmd(ssh, 'schtasks /query /tn "PalaceChat" /fo list /v | findstr /i "status result run"')

    if "python" in out_ps.lower():
        print("\n*** SUCCESS: python.exe is running on the OMEN! ***")
        ssh.close()
        return

    # ============================================================
    # ATTEMPT 2: schtasks with BAT -> VBS
    # ============================================================
    print("\n" + "=" * 60)
    print("ATTEMPT 1 did not show python. Trying ATTEMPT 2: BAT wrapper")
    print("=" * 60)

    run_cmd(ssh, 'schtasks /delete /tn "PalaceChat" /f')

    # Recalc time
    time_out2, _, _ = run_cmd(ssh, 'powershell -Command "([DateTime]::Now.AddMinutes(2)).ToString(\'HH:mm\')"')
    sched_time2 = time_out2.strip()

    create_cmd2 = (
        f'schtasks /create /tn "PalaceChat" '
        f'/tr "{REMOTE_BAT}" '
        f'/sc once /st {sched_time2} /ru "admin" /it /f'
    )
    _, _, code2 = run_cmd(ssh, create_cmd2)
    _, _, run_code2 = run_cmd(ssh, 'schtasks /run /tn "PalaceChat"')

    print("\n  Waiting 8 seconds...")
    time.sleep(8)

    out_ps2, _, _ = run_cmd(ssh, 'tasklist | findstr /i "python wscript"')
    run_cmd(ssh, 'schtasks /query /tn "PalaceChat" /fo list /v | findstr /i "status result run"')

    if "python" in out_ps2.lower():
        print("\n*** SUCCESS (ATTEMPT 2): python.exe is running on the OMEN! ***")
        ssh.close()
        return

    # ============================================================
    # ATTEMPT 3: schtasks with explorer.exe -> VBS
    # ============================================================
    print("\n" + "=" * 60)
    print("ATTEMPT 2 did not show python. Trying ATTEMPT 3: explorer.exe")
    print("=" * 60)

    run_cmd(ssh, 'schtasks /delete /tn "PalaceChat" /f')

    time_out3, _, _ = run_cmd(ssh, 'powershell -Command "([DateTime]::Now.AddMinutes(2)).ToString(\'HH:mm\')"')
    sched_time3 = time_out3.strip()

    create_cmd3 = (
        f'schtasks /create /tn "PalaceChat" '
        f'/tr "explorer.exe {REMOTE_VBS}" '
        f'/sc once /st {sched_time3} /ru "admin" /it /f'
    )
    _, _, code3 = run_cmd(ssh, create_cmd3)
    _, _, run_code3 = run_cmd(ssh, 'schtasks /run /tn "PalaceChat"')

    print("\n  Waiting 8 seconds...")
    time.sleep(8)

    out_ps3, _, _ = run_cmd(ssh, 'tasklist | findstr /i "python wscript"')
    run_cmd(ssh, 'schtasks /query /tn "PalaceChat" /fo list /v | findstr /i "status result run"')

    if "python" in out_ps3.lower():
        print("\n*** SUCCESS (ATTEMPT 3): python.exe is running on the OMEN! ***")
        ssh.close()
        return

    # ============================================================
    # ATTEMPT 4: Direct cmd.exe via schtasks
    # ============================================================
    print("\n" + "=" * 60)
    print("ATTEMPT 3 did not show python. Trying ATTEMPT 4: direct cmd.exe")
    print("=" * 60)

    run_cmd(ssh, 'schtasks /delete /tn "PalaceChat" /f')

    time_out4, _, _ = run_cmd(ssh, 'powershell -Command "([DateTime]::Now.AddMinutes(2)).ToString(\'HH:mm\')"')
    sched_time4 = time_out4.strip()

    direct_tr = f'cmd.exe /c start "PalaceChat" /d "C:\\Users\\admin\\Desktop" "{PYTHON}" palace-chat.py'
    create_cmd4 = (
        f'schtasks /create /tn "PalaceChat" '
        f'/tr "{direct_tr}" '
        f'/sc once /st {sched_time4} /ru "admin" /it /f'
    )
    _, _, code4 = run_cmd(ssh, create_cmd4)
    _, _, run_code4 = run_cmd(ssh, 'schtasks /run /tn "PalaceChat"')

    print("\n  Waiting 8 seconds...")
    time.sleep(8)

    out_ps4, _, _ = run_cmd(ssh, 'tasklist | findstr /i "python wscript cmd"')
    run_cmd(ssh, 'schtasks /query /tn "PalaceChat" /fo list /v | findstr /i "status result run"')

    if "python" in out_ps4.lower():
        print("\n*** SUCCESS (ATTEMPT 4): python.exe is running on the OMEN! ***")
    else:
        print("\n*** ALL ATTEMPTS EXHAUSTED ***")
        print("Files are in place on the OMEN desktop:")
        print(f"  - {REMOTE_CHAT}")
        print(f"  - {REMOTE_VBS} (double-click to launch)")
        print(f"  - {REMOTE_BAT} (double-click to launch)")
        print("Trina can double-click CLICK_ME_TO_CHAT.vbs on the desktop.")

    ssh.close()


if __name__ == "__main__":
    main()
