import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('169.254.26.30', port=22, username='rush', password='Palace2026!', timeout=10, look_for_keys=False, allow_agent=False)

# Write the portal directly to admin desktop using SFTP
sftp = ssh.open_sftp()

with open(r'C:\Users\stone\stone-ai\three-headed-monster-portal.html', 'r', encoding='utf-8') as f:
    html = f.read()

with sftp.file('/Users/admin/Desktop/THREE_HEADED_MONSTER_PORTAL.html', 'w') as remote:
    remote.write(html)
print(f"Written portal ({len(html)} bytes) to admin desktop")
sftp.close()

# Verify
stdin, stdout, stderr = ssh.exec_command('dir "C:\\Users\\admin\\Desktop\\THREE_HEADED_MONSTER_PORTAL.html"')
print(stdout.read().decode().strip())

# Delete old task
ssh.exec_command('schtasks /delete /tn "OpenPortal" /f')

# Get time
stdin, stdout, stderr = ssh.exec_command('powershell -Command "(Get-Date).AddMinutes(1).ToString(\'HH:mm\')"')
future_time = stdout.read().decode().strip()
print(f"Scheduling for: {future_time}")

# Create and run task
create_cmd = 'schtasks /create /tn "OpenPortal" /tr "cmd /c start C:\\Users\\admin\\Desktop\\THREE_HEADED_MONSTER_PORTAL.html" /sc once /st ' + future_time + ' /ru "admin" /it /f'
stdin, stdout, stderr = ssh.exec_command(create_cmd)
print(stdout.read().decode().strip())
print(stderr.read().decode().strip())

stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "OpenPortal"')
print(stdout.read().decode().strip())
print(stderr.read().decode().strip())

ssh.close()
print("\n=== PORTAL DEPLOYED AND LAUNCHED ===")
