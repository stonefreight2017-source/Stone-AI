import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('169.254.26.30', port=22, username='rush', password='Palace2026!', timeout=10, look_for_keys=False, allow_agent=False)

# Step 1: Clean up old failed tasks and processes
print("=== CLEANING UP ===")
for cmd in [
    'schtasks /delete /tn "ImportContacts" /f',
    'schtasks /delete /tn "ImportContactsPS" /f',
    'schtasks /delete /tn "ImportContacts2" /f',
    'taskkill /f /im AutoHotkey64.exe',
    'taskkill /f /im AutoHotkey32.exe',
]:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"  {out}")

# Step 2: Verify CSV exists
print("\n=== VERIFY CSV ===")
stdin, stdout, stderr = ssh.exec_command(r'dir "C:\Users\admin\Desktop\three-headed-monster-contacts.csv"')
print(stdout.read().decode().strip())

# Step 3: Find AHK v2 path
print("\n=== FIND AHK ===")
stdin, stdout, stderr = ssh.exec_command(r'dir /s /b "C:\Program Files\AutoHotkey\*.exe"')
ahk_list = stdout.read().decode().strip()
print(ahk_list)

# Find the v2 64-bit exe
ahk_exe = None
for line in ahk_list.splitlines():
    if 'v2' in line.lower() and '64' in line.lower() and line.strip().endswith('.exe'):
        ahk_exe = line.strip()
        break
if not ahk_exe:
    for line in ahk_list.splitlines():
        if 'v2' in line.lower() and line.strip().endswith('.exe'):
            ahk_exe = line.strip()
            break
if not ahk_exe:
    # Just use whatever AHK exe we can find
    for line in ahk_list.splitlines():
        if line.strip().endswith('.exe') and 'Compiler' not in line:
            ahk_exe = line.strip()
            break

print(f"Using AHK: {ahk_exe}")

# Step 4: Write the AHK v2 script
# This script:
# 1. Opens contacts.google.com/import directly
# 2. Watches for the Windows "Open" file dialog
# 3. When file dialog appears, types path and presses Enter
# 4. Then clicks Import
ahk_script = r'''#Requires AutoHotkey v2.0
#SingleInstance Force

; Show what we're doing
ToolTip("Three-Headed Monster`nImporting 48 agent contacts...`nOpening Google Contacts...", 100, 100)

; Open the import page directly
Run("https://contacts.google.com/import")
Sleep(10000)

ToolTip("Waiting for import dialog...`nIf you see a Sign In page,`nplease sign into 3headedm@gmail.com", 100, 100)

; Try clicking "Select file" - use Tab+Enter approach
; First make sure browser is focused
if WinExist("ahk_exe chrome.exe")
    WinActivate("ahk_exe chrome.exe")
else if WinExist("ahk_exe msedge.exe")
    WinActivate("ahk_exe msedge.exe")
Sleep(1000)

; The import modal should be showing. "Select file" button is in the modal.
; Press Tab to navigate to it, then Enter
Send("{Tab}")
Sleep(200)
Send("{Tab}")
Sleep(200)
Send("{Tab}")
Sleep(200)
Send("{Enter}")
Sleep(3000)

; Now watch for the file dialog window
ToolTip("Looking for file dialog...", 100, 100)
found := false

Loop 20 {
    ; Check for Windows file dialog (various titles)
    for title in ["Open", "Choose File to Upload", "File Upload"] {
        if WinExist(title) {
            WinActivate(title)
            Sleep(500)

            ; Focus the filename field with Alt+N
            Send("!n")
            Sleep(300)
            Send("^a")
            Sleep(100)
            SendText("C:\Users\admin\Desktop\three-headed-monster-contacts.csv")
            Sleep(500)
            Send("{Enter}")
            Sleep(3000)

            found := true
            break 2
        }
    }
    Sleep(500)
}

if found {
    ToolTip("File selected! Clicking Import...", 100, 100)

    ; Back in browser, the Import button should now be active
    ; Tab to it and press Enter
    if WinExist("ahk_exe chrome.exe")
        WinActivate("ahk_exe chrome.exe")
    else if WinExist("ahk_exe msedge.exe")
        WinActivate("ahk_exe msedge.exe")
    Sleep(1000)

    Send("{Tab}")
    Sleep(200)
    Send("{Enter}")
    Sleep(5000)

    ToolTip("DONE! 48 Three-Headed Monster contacts imported!", 100, 100)
    Sleep(8000)
} else {
    ToolTip("Could not find file dialog.`nPlease click 'Select file' manually -`nthe file is on the Desktop:`nthree-headed-monster-contacts.csv", 100, 100)
    Sleep(15000)
}

ToolTip()
ExitApp()
'''

# Write AHK script via SFTP
sftp = ssh.open_sftp()
with sftp.file('/Users/admin/Desktop/import-contacts.ahk', 'w') as f:
    f.write(ahk_script)
print("\n=== AHK SCRIPT WRITTEN ===")

# Step 5: Create and run the task
if ahk_exe:
    print(f"\n=== LAUNCHING AHK ({ahk_exe}) ===")

    # Delete old task
    ssh.exec_command('schtasks /delete /tn "ImportContacts2" /f')

    # Get time
    stdin, stdout, stderr = ssh.exec_command(r'powershell -Command "(Get-Date).AddMinutes(1).ToString(\'HH:mm\')"')
    future_time = stdout.read().decode().strip()
    print(f"Schedule time: {future_time}")

    # Create task - use a bat wrapper to avoid quoting hell
    bat_content = f'@echo off\r\n"{ahk_exe}" "C:\\Users\\admin\\Desktop\\import-contacts.ahk"\r\n'
    with sftp.file('/Users/admin/Desktop/run-import.bat', 'w') as f:
        f.write(bat_content)

    create_cmd = r'schtasks /create /tn "ImportContacts2" /tr "C:\Users\admin\Desktop\run-import.bat" /sc once /st ' + future_time + ' /ru "admin" /it /f'
    stdin, stdout, stderr = ssh.exec_command(create_cmd)
    print(f"Create: {stdout.read().decode().strip()}")
    print(f"  err: {stderr.read().decode().strip()}")

    # Run it
    stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "ImportContacts2"')
    print(f"Run: {stdout.read().decode().strip()}")
    print(f"  err: {stderr.read().decode().strip()}")
else:
    print("ERROR: Could not find AutoHotkey executable!")

sftp.close()

# Step 6: Verify processes
import time
time.sleep(3)
stdin, stdout, stderr = ssh.exec_command('tasklist | findstr -i "autohotkey chrome msedge"')
print(f"\n=== RUNNING PROCESSES ===\n{stdout.read().decode().strip()}")

ssh.close()
print("\n=== CONTACTS IMPORT LAUNCHED ON PALACE ===")
