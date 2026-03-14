"""
Import Three-Headed Monster contacts into Google Contacts on the Palace (OMEN).
Connects via SSH/SFTP, deploys AHK v2 automation + PowerShell backup.
"""

import paramiko
import time
import os

# --- Connection ---
OMEN_HOST = "169.254.26.30"
OMEN_PORT = 22
OMEN_USER = "rush"
OMEN_PASS = "Palace2026!"

# --- Paths ---
LOCAL_CSV = r"C:\Users\stone\stone-ai\three-headed-monster-contacts.csv"
REMOTE_CSV = r"C:\Users\admin\Desktop\three-headed-monster-contacts.csv"
REMOTE_AHK = r"C:\Users\admin\Desktop\import-contacts.ahk"
REMOTE_PS1 = r"C:\Users\admin\Desktop\import-contacts.ps1"

# --- AutoHotkey v2 Script ---
AHK_SCRIPT = r'''#Requires AutoHotkey v2.0
#SingleInstance Force

; Tooltip notification
ToolTip("🔥 Three-Headed Monster Contact Import`n`nImporting 48 agent contacts...`nMake sure you're logged into 3headedm@gmail.com", 100, 100)
SetTimer(() => ToolTip(), -8000)

; Open Google Contacts Import page directly
Run("https://contacts.google.com/import")
Sleep(5000)

; Show persistent tooltip with instructions
ToolTip("📋 CONTACT IMPORT READY`n`n1. Click 'Select file' in the dialog`n2. Navigate to Desktop`n3. Select: three-headed-monster-contacts.csv`n4. Click 'Import'`n`nFile is on the Desktop!", 100, 100)
SetTimer(() => ToolTip(), -15000)

; Try to automate the file selection
; Wait for the import dialog to be ready
Sleep(3000)

; Send Tab to navigate to "Select file" button and Enter to click it
Send("{Tab}{Tab}{Enter}")
Sleep(2000)

; In the file dialog, type the path to the CSV
; The file dialog should now be open
SendText("C:\Users\admin\Desktop\three-headed-monster-contacts.csv")
Sleep(1000)
Send("{Enter}")
Sleep(2000)

; Now click the Import button - Tab to it and Enter
Send("{Tab}{Enter}")

; Final notification
Sleep(2000)
ToolTip("✅ Import sequence complete!`nCheck Google Contacts to verify.", 100, 100)
SetTimer(() => ToolTip(), -10000)

; Keep script alive briefly then exit
Sleep(12000)
ExitApp()
'''

# --- PowerShell Backup Script ---
PS1_SCRIPT = r'''# Three-Headed Monster Contact Import - Backup Script
# Opens Google Contacts import page and shows notification

# Open the import page
Start-Process "https://contacts.google.com/import"

# Show a message box with instructions
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create a notification form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Three-Headed Monster - Contact Import"
$form.Size = New-Object System.Drawing.Size(500, 300)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
$form.ForeColor = [System.Drawing.Color]::White
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

$label = New-Object System.Windows.Forms.Label
$label.Text = @"
THREE-HEADED MONSTER CONTACTS

48 agent contacts ready to import!

STEPS:
1. Make sure you're logged into 3headedm@gmail.com
2. Click 'Select file' on the import page
3. Navigate to Desktop
4. Select: three-headed-monster-contacts.csv
5. Click 'Import'

The CSV file is on the Desktop.
"@
$label.AutoSize = $false
$label.Size = New-Object System.Drawing.Size(460, 200)
$label.Location = New-Object System.Drawing.Point(15, 15)
$label.Font = New-Object System.Drawing.Font("Segoe UI", 11)

$button = New-Object System.Windows.Forms.Button
$button.Text = "GOT IT"
$button.Size = New-Object System.Drawing.Size(120, 40)
$button.Location = New-Object System.Drawing.Point(180, 220)
$button.BackColor = [System.Drawing.Color]::FromArgb(0, 120, 212)
$button.FlatStyle = "Flat"
$button.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$button.Add_Click({ $form.Close() })

$form.Controls.Add($label)
$form.Controls.Add($button)
$form.ShowDialog()
'''


def main():
    print("=" * 60)
    print("PALACE CONTACT IMPORT - Three-Headed Monster")
    print("=" * 60)

    # Connect
    print(f"\n[1/6] Connecting to Palace ({OMEN_HOST})...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(OMEN_HOST, port=OMEN_PORT, username=OMEN_USER, password=OMEN_PASS, timeout=15)
    print("  Connected.")

    # SFTP the CSV
    print("\n[2/6] Uploading CSV to Desktop...")
    sftp = ssh.open_sftp()
    sftp.put(LOCAL_CSV, REMOTE_CSV)
    print(f"  Uploaded: {REMOTE_CSV}")

    # Write AHK script
    print("\n[3/6] Writing AutoHotkey v2 script...")
    with sftp.file(REMOTE_AHK, 'w') as f:
        f.write(AHK_SCRIPT)
    print(f"  Written: {REMOTE_AHK}")

    # Write PowerShell script
    print("\n[4/6] Writing PowerShell backup script...")
    with sftp.file(REMOTE_PS1, 'w') as f:
        f.write(PS1_SCRIPT)
    print(f"  Written: {REMOTE_PS1}")

    sftp.close()

    # Find AHK v2 executable
    print("\n[5/6] Locating AutoHotkey v2 and launching automation...")

    # Check for AHK v2 executable
    stdin, stdout, stderr = ssh.exec_command(
        'dir /b "C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe" 2>nul || '
        'dir /b "C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey32.exe" 2>nul || '
        'dir /b "C:\\Program Files\\AutoHotkey\\AutoHotkey64.exe" 2>nul || '
        'echo NOT_FOUND'
    )
    ahk_check = stdout.read().decode().strip()
    print(f"  AHK check result: {ahk_check}")

    # Create scheduled task for AHK (runs in interactive session)
    ahk_exe = r"C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"
    task_cmd = (
        f'schtasks /create /tn "ImportContacts" '
        f'/tr "\"{ahk_exe}\" \"{REMOTE_AHK}\"" '
        f'/sc once /st 00:00 /ru "admin" /it /f'
    )
    print(f"  Creating scheduled task...")
    stdin, stdout, stderr = ssh.exec_command(task_cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"  Task create: {out} {err}")

    # Run the scheduled task
    print("  Running AHK task...")
    stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "ImportContacts"')
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"  Task run: {out} {err}")

    # Launch PowerShell backup script via schtasks too
    print("\n[6/6] Launching PowerShell backup...")
    ps_task_cmd = (
        'schtasks /create /tn "ImportContactsPS" '
        f'/tr "powershell.exe -ExecutionPolicy Bypass -File \"{REMOTE_PS1}\"" '
        '/sc once /st 00:00 /ru "admin" /it /f'
    )
    stdin, stdout, stderr = ssh.exec_command(ps_task_cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"  PS task create: {out} {err}")

    stdin, stdout, stderr = ssh.exec_command('schtasks /run /tn "ImportContactsPS"')
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"  PS task run: {out} {err}")

    # Verify files are on the Desktop
    print("\n[VERIFY] Checking Desktop files...")
    stdin, stdout, stderr = ssh.exec_command(
        f'dir "C:\\Users\\admin\\Desktop\\three-headed-monster-contacts.csv" '
        f'"C:\\Users\\admin\\Desktop\\import-contacts.ahk" '
        f'"C:\\Users\\admin\\Desktop\\import-contacts.ps1"'
    )
    out = stdout.read().decode().strip()
    print(f"  {out}")

    ssh.close()

    print("\n" + "=" * 60)
    print("DONE. On the Palace screen, Trina should see:")
    print("  1. Browser opening Google Contacts import page")
    print("  2. AHK tooltip notifications about the import")
    print("  3. PowerShell dialog with import instructions")
    print("  4. The CSV file is on the Desktop for manual import if needed")
    print("=" * 60)


if __name__ == "__main__":
    main()
