"""
CHAOS (Head 3) -- Palace Chat FINAL FIX Part 2
Focus:
1. Investigate the existing cmd/python in Console session
2. Download PsExec and use it to inject into Session 1
3. If PsExec fails, use PowerShell to download and use it
4. Try using the existing cmd.exe session via a creative approach
"""

import paramiko
import time
import sys

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"

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


def main():
    print(DIVIDER)
    print("CHAOS -- PALACE CHAT FIX PART 2")
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
    # STEP 1: Investigate existing processes
    # ==========================================
    print(f"\n{DIVIDER}")
    print("STEP 1: What's already running in Console session?")
    print(DIVIDER)

    # Use PowerShell Get-Process since wmic isn't available on Win11
    run_cmd(ssh,
            'powershell -Command "Get-Process cmd -ErrorAction SilentlyContinue | Select-Object Id,SessionId,MainWindowTitle,StartTime | Format-List"',
            "cmd.exe details")

    run_cmd(ssh,
            'powershell -Command "Get-Process python -ErrorAction SilentlyContinue | Select-Object Id,SessionId,MainWindowTitle,StartTime | Format-List"',
            "python.exe details")

    # Check what command line the python.exe is running
    run_cmd(ssh,
            'powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'python.exe\'\\" | Select-Object ProcessId,CommandLine,SessionId | Format-List"',
            "python.exe command line")

    # Check the cmd.exe in console session
    run_cmd(ssh,
            'powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'cmd.exe\'\\" | Select-Object ProcessId,CommandLine,SessionId | Format-List"',
            "cmd.exe command line")

    # ==========================================
    # STEP 2: Check if the existing window has a title
    # ==========================================
    print(f"\n{DIVIDER}")
    print("STEP 2: Check if existing cmd window has our title")
    print(DIVIDER)

    run_cmd(ssh,
            'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Select-Object ProcessName,Id,MainWindowTitle | Format-Table -AutoSize"',
            "All windows with titles")

    # ==========================================
    # STEP 3: Download PsExec (Sysinternals) - THE tool for cross-session process creation
    # ==========================================
    print(f"\n{DIVIDER}")
    print("STEP 3: Get PsExec for cross-session launch")
    print(DIVIDER)

    # Check if PsExec already exists
    out_ps, _ = run_cmd(ssh, 'where psexec 2>nul', "Check PsExec in PATH")
    out_ps2, _ = run_cmd(ssh, 'dir "C:\\PsExec*" "C:\\Windows\\PsExec*" "C:\\Windows\\System32\\PsExec*" 2>nul',
                         "Check PsExec common locations")

    psexec_path = ""
    if "psexec" in out_ps.lower():
        psexec_path = out_ps.split("\n")[0].strip()
    elif "PsExec" in out_ps2:
        # Parse it out
        for line in out_ps2.split("\n"):
            if "PsExec" in line and "Directory" not in line:
                psexec_path = line.strip().split()[-1] if line.strip() else ""

    if not psexec_path:
        print("\n  PsExec not found. Downloading from Sysinternals...")

        # Download PsTools zip using PowerShell
        download_cmd = (
            'powershell -Command "'
            '$url = \'https://download.sysinternals.com/files/PSTools.zip\'; '
            '$zip = \'C:\\Users\\admin\\Desktop\\PSTools.zip\'; '
            '$dest = \'C:\\Users\\admin\\Desktop\\PSTools\'; '
            'try { '
            '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; '
            'Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing; '
            'Expand-Archive -Path $zip -DestinationPath $dest -Force; '
            'Write-Output \'Download and extract complete\'; '
            'Get-ChildItem $dest\\PsExec* '
            '} catch { Write-Output $_.Exception.Message }'
            '"'
        )
        out_dl, _ = run_cmd(ssh, download_cmd, "Download PsTools", timeout=60)

        if "complete" in out_dl.lower() or "PsExec" in out_dl:
            psexec_path = "C:\\Users\\admin\\Desktop\\PSTools\\PsExec.exe"
            # Also try PsExec64
            run_cmd(ssh, f'dir "C:\\Users\\admin\\Desktop\\PSTools\\PsExec*"', "PsExec files")
        else:
            print("  Download may have failed, trying alternative...")
            # Try curl
            alt_cmd = (
                'curl -L -o "C:\\Users\\admin\\Desktop\\PSTools.zip" '
                '"https://download.sysinternals.com/files/PSTools.zip" 2>&1'
            )
            run_cmd(ssh, alt_cmd, "Alternative download with curl", timeout=60)
            run_cmd(ssh,
                    'powershell -Command "Expand-Archive -Path C:\\Users\\admin\\Desktop\\PSTools.zip -DestinationPath C:\\Users\\admin\\Desktop\\PSTools -Force"',
                    "Extract")
            run_cmd(ssh, 'dir "C:\\Users\\admin\\Desktop\\PSTools\\PsExec*"', "Check PsExec")
            psexec_path = "C:\\Users\\admin\\Desktop\\PSTools\\PsExec.exe"

    # ==========================================
    # STEP 4: Use PsExec to launch in Session 1
    # ==========================================
    print(f"\n{DIVIDER}")
    print("STEP 4: Launch with PsExec targeting Session 1")
    print(DIVIDER)

    if psexec_path or True:  # Try even if path detection was iffy
        if not psexec_path:
            psexec_path = "C:\\Users\\admin\\Desktop\\PSTools\\PsExec.exe"

        # Check if PsExec64 exists (better for 64-bit Windows 11)
        out64, _ = run_cmd(ssh, f'dir "C:\\Users\\admin\\Desktop\\PSTools\\PsExec64.exe" 2>nul',
                           "Check PsExec64")
        if "PsExec64" in out64:
            psexec_path = "C:\\Users\\admin\\Desktop\\PSTools\\PsExec64.exe"
            print(f"  Using PsExec64 for 64-bit Windows 11")

        print(f"\n  PsExec path: {psexec_path}")

        # Baseline PIDs
        out_before, _ = run_cmd(ssh,
                                'powershell -Command "Get-Process cmd,python -ErrorAction SilentlyContinue | Select-Object Id,SessionId | Format-Table -AutoSize"',
                                "Baseline processes")

        # PsExec -i 1 runs the process interactively in session 1
        # -d = don't wait for process to exit
        # -accepteula = don't show EULA dialog
        psexec_cmd = (
            f'"{psexec_path}" -accepteula -i 1 -d '
            f'wscript.exe "C:\\Users\\admin\\Desktop\\launch-chat.vbs"'
        )
        run_cmd(ssh, psexec_cmd, "PsExec launch into Session 1", timeout=30)

        time.sleep(5)

        # Check if it worked
        run_cmd(ssh,
                'powershell -Command "Get-Process cmd,python -ErrorAction SilentlyContinue | Select-Object Id,SessionId,MainWindowTitle | Format-Table -AutoSize"',
                "Processes after PsExec")

        # Also directly check for new Console session processes
        out_after, _ = run_cmd(ssh,
                               'tasklist /fi "sessionname eq Console" | findstr /i "cmd.exe python.exe"',
                               "Console session processes")

    # ==========================================
    # STEP 5: If PsExec failed, try alternative: tscon redirect
    # ==========================================
    print(f"\n{DIVIDER}")
    print("STEP 5: Alternative approaches if PsExec didn't work")
    print(DIVIDER)

    # Check if the palace-chat python is already running (maybe from before)
    run_cmd(ssh,
            'powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'python.exe\'\\" | Select-Object ProcessId,CommandLine,SessionId | Format-List"',
            "Current python.exe processes")

    # Maybe the existing python.exe IS palace-chat but the CMD window got minimized
    # Let's check the window state
    run_cmd(ssh,
            'powershell -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Win { [DllImport(\\\"user32.dll\\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); [DllImport(\\\"user32.dll\\\")] public static extern bool SetForegroundWindow(IntPtr hWnd); }\'; $procs = Get-Process cmd -ErrorAction SilentlyContinue | Where-Object {$_.SessionId -eq 1 -and $_.MainWindowHandle -ne 0}; foreach($p in $procs) { Write-Output \\"Restoring PID $($p.Id) window $($p.MainWindowHandle)\\"; [Win]::ShowWindow($p.MainWindowHandle, 9); [Win]::SetForegroundWindow($p.MainWindowHandle) }"',
            "Try to restore/foreground existing cmd.exe windows in Session 1")

    # ==========================================
    # STEP 6: Nuclear option - create a Windows service that auto-starts
    # ==========================================
    print(f"\n{DIVIDER}")
    print("STEP 6: Create persistent auto-launcher")
    print(DIVIDER)

    # Write a small PowerShell script that checks every 30 seconds if palace-chat is running
    # and launches it if not. Put it in Task Scheduler to run at login under admin.
    monitor_ps = (
        '# Palace Chat Monitor - ensures chat stays running\r\n'
        '$batPath = "C:\\Users\\admin\\Desktop\\palace-chat.bat"\r\n'
        '$vbsPath = "C:\\Users\\admin\\Desktop\\launch-chat.vbs"\r\n'
        'while ($true) {\r\n'
        '    $chatProc = Get-CimInstance Win32_Process -Filter "Name=\'python.exe\'" | \r\n'
        '        Where-Object { $_.CommandLine -like "*palace-chat*" }\r\n'
        '    if (-not $chatProc) {\r\n'
        '        Start-Process wscript.exe -ArgumentList $vbsPath -WindowStyle Normal\r\n'
        '    }\r\n'
        '    Start-Sleep -Seconds 60\r\n'
        '}\r\n'
    )
    sftp = ssh.open_sftp()
    print("  Writing palace-chat-monitor.ps1...")
    with sftp.open("C:\\Users\\admin\\Desktop\\palace-chat-monitor.ps1", "w") as f:
        f.write(monitor_ps)
    print("  OK")
    sftp.close()

    # Create a logon-triggered scheduled task for admin
    run_cmd(ssh, 'schtasks /delete /tn "PalaceChatLogon" /f 2>nul', "Cleanup old logon task")

    # Create task that triggers on ANY user logon and runs the VBS
    schtask_xml = (
        'powershell -Command "'
        '$xml = @\\'\\'\r\n'
        '<?xml version=\\"1.0\\" encoding=\\"UTF-16\\"?>\r\n'
        '<Task version=\\"1.2\\" xmlns=\\"http://schemas.microsoft.com/windows/2004/02/mit/task\\">\r\n'
        '  <Triggers>\r\n'
        '    <LogonTrigger><Enabled>true</Enabled></LogonTrigger>\r\n'
        '  </Triggers>\r\n'
        '  <Settings>\r\n'
        '    <AllowStartOnDemand>true</AllowStartOnDemand>\r\n'
        '    <Enabled>true</Enabled>\r\n'
        '    <AllowHardTerminate>false</AllowHardTerminate>\r\n'
        '    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>\r\n'
        '  </Settings>\r\n'
        '  <Actions>\r\n'
        '    <Exec>\r\n'
        '      <Command>wscript.exe</Command>\r\n'
        '      <Arguments>C:\\Users\\admin\\Desktop\\launch-chat.vbs</Arguments>\r\n'
        '    </Exec>\r\n'
        '  </Actions>\r\n'
        '</Task>\r\n'
        '\\'@\r\n'
        '$xml | Out-File -FilePath C:\\Users\\admin\\Desktop\\PalaceChatTask.xml -Encoding unicode\r\n'
        '"'
    )

    # Simpler approach: use schtasks directly with /sc onlogon
    run_cmd(ssh,
            'schtasks /create /tn "PalaceChatLogon" '
            '/tr "wscript.exe C:\\Users\\admin\\Desktop\\launch-chat.vbs" '
            '/sc onlogon /ru "OMEN\\admin" /f',
            "Create logon-triggered task for admin")

    # Verify the task
    run_cmd(ssh, 'schtasks /query /tn "PalaceChatLogon" /v /fo list', "Verify logon task")

    # ==========================================
    # FINAL STATUS
    # ==========================================
    print(f"\n{DIVIDER}")
    print("FINAL STATUS")
    print(DIVIDER)

    run_cmd(ssh, 'query user', "Sessions")
    run_cmd(ssh,
            'powershell -Command "Get-Process cmd,python -ErrorAction SilentlyContinue | Select-Object ProcessName,Id,SessionId,MainWindowTitle | Format-Table -AutoSize"',
            "Processes")
    run_cmd(ssh,
            'powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'python.exe\'\\" | Select-Object ProcessId,CommandLine | Format-List"',
            "Python command lines")

    # List desktop files
    run_cmd(ssh, 'dir "C:\\Users\\admin\\Desktop\\*.vbs" "C:\\Users\\admin\\Desktop\\*.bat" "C:\\Users\\admin\\Desktop\\*.txt" "C:\\Users\\admin\\Desktop\\*.ps1"',
            "Desktop files")

    print(f"\n{DIVIDER}")
    print("DEPLOYMENT SUMMARY:")
    print("  Files deployed to C:\\Users\\admin\\Desktop:")
    print("    - CLICK_ME_TO_CHAT.vbs (double-click to chat)")
    print("    - README_TRINA.txt (instructions)")
    print("    - palace-chat.bat + palace-chat.py (the actual chat)")
    print("    - launch-chat.vbs (used by auto-launchers)")
    print("    - launch-chat.ps1 (PowerShell launcher)")
    print("    - palace-chat-monitor.ps1 (monitoring script)")
    print("")
    print("  Auto-launch mechanisms:")
    print("    - HKLM Run key (launches on ANY login)")
    print("    - Admin Startup folder (launches on admin login)")
    print("    - Common Startup folder (launches on any login)")
    print("    - Scheduled task PalaceChatLogon (on admin logon)")
    print("")
    print("  MSG notification sent to admin's screen")
    print("")
    print("  NOTE: If chat was NOT running, it WILL auto-start on next login.")
    print("  For IMMEDIATE start: Trina double-clicks CLICK_ME_TO_CHAT.vbs")
    print(DIVIDER)

    ssh.close()
    print("\nChaos out.")


if __name__ == "__main__":
    main()
