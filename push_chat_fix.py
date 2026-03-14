import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('169.254.26.30', port=22, username='rush', password='Palace2026!', timeout=10, look_for_keys=False, allow_agent=False)

# Step 1: Who is logged in?
print("=== WHO IS AT THE CONSOLE ===")
stdin, stdout, stderr = ssh.exec_command('query user')
users = stdout.read().decode().strip()
print(users)

# Step 2: Kill any existing chat windows
print("\n=== KILLING OLD CHAT PROCESSES ===")
ssh.exec_command('taskkill /f /im python.exe 2>nul')
ssh.exec_command('schtasks /delete /tn "PalaceChat" /f 2>nul')
time.sleep(1)

# Step 3: Push fixed palace-chat.py
print("\n=== PUSHING FIXED PALACE-CHAT.PY ===")
sftp = ssh.open_sftp()
with open(r'C:\Users\stone\stone-ai\palace-chat.py', 'r', encoding='utf-8') as f:
    content = f.read()
with sftp.file('/Users/admin/Desktop/palace-chat.py', 'w') as remote:
    remote.write(content)
print(f"Pushed palace-chat.py ({len(content)} bytes)")

# Step 4: Also create the VBS fallback launcher
vbs_content = '''Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /k cd /d ""C:\\Users\\admin\\Desktop"" && palace-chat.bat", 1, False
'''
with sftp.file('/Users/admin/Desktop/CLICK_ME_TO_CHAT.vbs', 'w') as remote:
    remote.write(vbs_content)
print("Pushed CLICK_ME_TO_CHAT.vbs")

# Step 5: Write README for Trina
readme = """==============================================
TRINA - TO TALK TO THE THREE-HEADED MONSTER:

  Double-click "CLICK_ME_TO_CHAT.vbs" on Desktop
  OR Double-click "palace-chat.bat" on Desktop

  If nothing happens, open CMD and type:
    cd C:\\Users\\admin\\Desktop
    palace-chat.bat

  COMMANDS INSIDE CHAT:
    Just type and press Enter to talk
    /heads  - see all agents
    /clear  - reset conversation
    exit    - close chat
==============================================
"""
with sftp.file('/Users/admin/Desktop/README_TRINA.txt', 'w') as remote:
    remote.write(readme)
print("Pushed README_TRINA.txt")
sftp.close()

# Step 6: Test Python works
print("\n=== TESTING PYTHON ===")
for pypath in [
    r'C:\vllm-env\Scripts\python.exe',
    r'C:\Users\admin\AppData\Local\Programs\Python\Python311\python.exe',
]:
    stdin, stdout, stderr = ssh.exec_command(f'"{pypath}" --version')
    ver = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"  {pypath}: {ver if ver else err if err else 'NOT FOUND'}")

# Step 7: Test the chat script doesn't crash on import
print("\n=== TESTING CHAT SCRIPT SYNTAX ===")
stdin, stdout, stderr = ssh.exec_command(r'"C:\vllm-env\Scripts\python.exe" -c "exec(open(r\"C:\\Users\\admin\\Desktop\\palace-chat.py\").read().split(\"if __name__\")[0]); print(\"SYNTAX OK\")"')
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
print(f"  Result: {out}")
if err: print(f"  Error: {err}")

# Also compile-check
stdin, stdout, stderr = ssh.exec_command(r'"C:\vllm-env\Scripts\python.exe" -m py_compile "C:\Users\admin\Desktop\palace-chat.py"')
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
print(f"  Compile check: {'PASS' if not err else err}")

# Step 8: Launch via schtasks — use VBS for reliable visible window
print("\n=== LAUNCHING CHAT WINDOW ===")

# Method: schtasks with VBS launcher
stdin, stdout, stderr = ssh.exec_command('powershell -Command "[DateTime]::Now.AddMinutes(2).ToString(\'HH:mm\')"')
future_time = stdout.read().decode().strip()
print(f"  Schedule time: '{future_time}'")

if future_time:
    # Create task pointing to the VBS
    create_cmd = f'schtasks /create /tn "PalaceChat" /tr "wscript.exe C:\\Users\\admin\\Desktop\\CLICK_ME_TO_CHAT.vbs" /sc once /st {future_time} /ru "admin" /it /f'
    stdin, stdout, stderr = ssh.exec_command(create_cmd)
    print(f"  Create: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  err: {err}")

    stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "PalaceChat"')
    print(f"  Run: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  err: {err}")
else:
    print("  Time failed, trying alternative...")
    # Fallback: use cmd time
    stdin, stdout, stderr = ssh.exec_command('time /t')
    raw = stdout.read().decode().strip()
    print(f"  Raw time: {raw}")

# Step 9: Wait and verify
time.sleep(5)
print("\n=== VERIFICATION ===")
stdin, stdout, stderr = ssh.exec_command('tasklist | findstr -i "python wscript cmd"')
procs = stdout.read().decode().strip()
print(f"  Processes: {procs if procs else 'NONE FOUND'}")

stdin, stdout, stderr = ssh.exec_command('schtasks /query /tn "PalaceChat" /fo list /v')
task_info = stdout.read().decode().strip()
for line in task_info.splitlines():
    if any(k in line for k in ['Status', 'Last Result', 'Last Run']):
        print(f"  {line.strip()}")

ssh.close()
print("\n=== CHAT FIX DEPLOYED ===")
