import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('169.254.26.30', port=22, username='rush', password='Palace2026!', timeout=10, look_for_keys=False, allow_agent=False)

# Push fixed file
sftp = ssh.open_sftp()
with open(r'C:\Users\stone\stone-ai\palace-chat.py', 'r', encoding='utf-8') as f:
    content = f.read()
with sftp.file('/Users/admin/Desktop/palace-chat.py', 'w') as remote:
    remote.write(content)
print(f"Pushed palace-chat.py ({len(content)} bytes)")
sftp.close()

# Verify syntax on OMEN
stdin, stdout, stderr = ssh.exec_command(r'"C:\vllm-env\Scripts\python.exe" -m py_compile "C:\Users\admin\Desktop\palace-chat.py"')
err = stderr.read().decode().strip()
print(f"Compile check on OMEN: {'PASS' if not err else err}")

# Verify Ollama is running
stdin, stdout, stderr = ssh.exec_command('tasklist | findstr ollama')
print(f"Ollama: {stdout.read().decode().strip()}")

# Test Ollama responds
stdin, stdout, stderr = ssh.exec_command(r'"C:\vllm-env\Scripts\python.exe" -c "import urllib.request; r=urllib.request.urlopen(\"http://127.0.0.1:11434/api/tags\", timeout=5); print(r.read().decode()[:200])"')
print(f"Ollama API: {stdout.read().decode().strip()}")
err = stderr.read().decode().strip()
if err: print(f"  err: {err}")

# Kill any old chat processes
ssh.exec_command('schtasks /delete /tn "PalaceChat" /f 2>nul')
time.sleep(1)

# Launch using wscript.exe with the VBS — get time first
stdin, stdout, stderr = ssh.exec_command('powershell -Command "([DateTime]::Now.AddMinutes(2)).ToString(\'HH:mm\')"')
future_time = stdout.read().decode().strip()
print(f"Time: {future_time}")

if future_time:
    create = f'schtasks /create /tn "PalaceChat" /tr "wscript.exe \\"C:\\Users\\admin\\Desktop\\CLICK_ME_TO_CHAT.vbs\\"" /sc once /st {future_time} /ru "admin" /it /f'
    stdin, stdout, stderr = ssh.exec_command(create)
    print(f"Create: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  create err: {err}")

    stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "PalaceChat"')
    print(f"Run: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  run err: {err}")

    time.sleep(6)

    # Check task result
    stdin, stdout, stderr = ssh.exec_command('schtasks /query /tn "PalaceChat" /fo list /v')
    info = stdout.read().decode().strip()
    for line in info.splitlines():
        if any(k in line for k in ['Status', 'Last Result', 'Last Run']):
            print(f"  {line.strip()}")

# Check if python or cmd appeared
stdin, stdout, stderr = ssh.exec_command('tasklist | findstr -i "python.exe wscript"')
procs = stdout.read().decode().strip()
print(f"\nProcesses: {procs if procs else 'NONE'}")

# If wscript/python not running, try direct approach
if 'python' not in procs.lower():
    print("\nWscript approach failed. Trying direct cmd launch...")
    # Try with cmd /c start directly
    ssh.exec_command('schtasks /delete /tn "PalaceChat2" /f 2>nul')
    time.sleep(1)

    bat_cmd = f'schtasks /create /tn "PalaceChat2" /tr "cmd /c start \\"MONSTER\\" cmd /k \\"cd /d C:\\Users\\admin\\Desktop && C:\\vllm-env\\Scripts\\python.exe palace-chat.py\\"" /sc once /st {future_time} /ru "admin" /it /f'
    stdin, stdout, stderr = ssh.exec_command(bat_cmd)
    print(f"Create2: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  err: {err}")

    stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "PalaceChat2"')
    print(f"Run2: {stdout.read().decode().strip()}")
    err = stderr.read().decode().strip()
    if err: print(f"  err: {err}")

    time.sleep(6)
    stdin, stdout, stderr = ssh.exec_command('tasklist | findstr -i "python.exe"')
    procs2 = stdout.read().decode().strip()
    print(f"Python procs: {procs2 if procs2 else 'NONE'}")

ssh.close()
print("\n=== DONE ===")
