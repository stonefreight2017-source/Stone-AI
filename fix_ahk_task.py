"""Fix and re-launch the AHK scheduled task on the Palace."""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("169.254.26.30", port=22, username="rush", password="Palace2026!", timeout=15)
print("Connected.")

# The issue is schtasks quoting. Use cmd /c with proper escaping.
# First, try launching AHK directly via cmd /c start (simpler approach)
# Use a batch file wrapper to avoid quoting hell

batch = '@echo off\r\n"C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe" "C:\\Users\\admin\\Desktop\\import-contacts.ahk"\r\n'
sftp = ssh.open_sftp()
with sftp.file(r"C:\Users\admin\Desktop\run-import.bat", 'w') as f:
    f.write(batch)
sftp.close()
print("Wrote batch wrapper.")

# Create task pointing to the batch file (no space issues)
cmds = [
    'schtasks /delete /tn "ImportContacts" /f',
    'schtasks /create /tn "ImportContacts" /tr "C:\\Users\\admin\\Desktop\\run-import.bat" /sc once /st 00:00 /ru "admin" /it /f',
    'schtasks /run /tn "ImportContacts"',
]

for cmd in cmds:
    print(f"\n> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"  {out}")
    if err: print(f"  {err}")

ssh.close()
print("\nDone. AHK automation should now be running on the Palace screen.")
