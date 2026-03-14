import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('169.254.26.30', port=22, username='rush', password='Palace2026!', timeout=10, look_for_keys=False, allow_agent=False)

# Get actual time that works
stdin, stdout, stderr = ssh.exec_command('powershell -Command "(Get-Date).AddMinutes(2).ToString(\'HH:mm\')"')
time_val = stdout.read().decode().strip()
print(f"Time from PowerShell: '{time_val}'")

# Fallback: get time via cmd
if not time_val:
    stdin, stdout, stderr = ssh.exec_command('powershell -Command "[DateTime]::Now.AddMinutes(2).ToString(\'HH:mm\')"')
    time_val = stdout.read().decode().strip()
    print(f"Time fallback 1: '{time_val}'")

if not time_val:
    stdin, stdout, stderr = ssh.exec_command('time /t')
    raw_time = stdout.read().decode().strip()
    print(f"Raw time: '{raw_time}'")
    # Parse and add 2 min manually
    parts = raw_time.replace(' AM','').replace(' PM','').split(':')
    if len(parts) >= 2:
        h, m = int(parts[0]), int(parts[1]) + 2
        if 'PM' in raw_time and h != 12: h += 12
        if m >= 60: m -= 60; h += 1
        if h >= 24: h -= 24
        time_val = f"{h:02d}:{m:02d}"
        print(f"Computed time: '{time_val}'")

# Delete old task
ssh.exec_command('schtasks /delete /tn "ImportContacts2" /f')
time.sleep(1)

# Create with the time we got
create_cmd = f'schtasks /create /tn "ImportContacts2" /tr "C:\\Users\\admin\\Desktop\\run-import.bat" /sc once /st {time_val} /ru "admin" /it /f'
print(f"\nCommand: {create_cmd}")
stdin, stdout, stderr = ssh.exec_command(create_cmd)
print(f"Create: {stdout.read().decode().strip()}")
err = stderr.read().decode().strip()
if err: print(f"  err: {err}")

# Run immediately
stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "ImportContacts2"')
print(f"Run: {stdout.read().decode().strip()}")
err = stderr.read().decode().strip()
if err: print(f"  err: {err}")

# Wait and check
time.sleep(5)
stdin, stdout, stderr = ssh.exec_command('tasklist | findstr -i "autohotkey"')
ahk_procs = stdout.read().decode().strip()
print(f"\nAHK processes: {ahk_procs if ahk_procs else 'NONE'}")

# If no AHK, try direct approach - just run it via schtasks with a simpler task
if not ahk_procs:
    print("\nAHK not running via schtask. Trying alternative launch...")
    # Try creating a simpler task that runs cmd which runs the bat
    ssh.exec_command('schtasks /delete /tn "ImportContacts3" /f')
    time.sleep(1)

    alt_cmd = f'schtasks /create /tn "ImportContacts3" /tr "cmd /c start C:\\Users\\admin\\Desktop\\run-import.bat" /sc once /st {time_val} /ru "admin" /it /f'
    stdin, stdout, stderr = ssh.exec_command(alt_cmd)
    print(f"Alt create: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  err: {err}")

    stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "ImportContacts3"')
    print(f"Alt run: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  err: {err}")

    time.sleep(5)
    stdin, stdout, stderr = ssh.exec_command('tasklist | findstr -i "autohotkey"')
    ahk_procs = stdout.read().decode().strip()
    print(f"\nAHK processes after alt: {ahk_procs if ahk_procs else 'NONE'}")

# Also check what browser tabs are open
stdin, stdout, stderr = ssh.exec_command('tasklist | findstr -i "msedge.exe chrome.exe" | find /c /v ""')
browser_count = stdout.read().decode().strip()
print(f"Browser processes: {browser_count}")

ssh.close()
print("\n=== IMPORT LAUNCH COMPLETE ===")
