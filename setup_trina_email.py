"""
Chaos (Head 3) — Setup Trina's Email Access to the Three-Headed Monster
Connects to OMEN (Palace) via SSH and sets up desktop shortcuts,
instructions, and launches Gmail compose window for Trina.
"""

import paramiko
import base64
import os
import sys
import time

OMEN_HOST = "169.254.26.30"
OMEN_PORT = 22
OMEN_USER = "rush"
OMEN_PASS = "Palace2026!"
REMOTE_DESKTOP = r"C:\Users\admin\Desktop"

# --- File contents ---

EMAIL_THE_MONSTER_TXT = """=============================================
EMAIL THE THREE-HEADED MONSTER
=============================================

Email: 3headedm@gmail.com

HOW TO SEND A COMMAND:
  To: 3headedm@gmail.com
  Subject: @AGENTNAME what you want done
  Body: (optional extra details)

EXAMPLES:
  Subject: @STONE review pricing strategy
  Subject: @CARDINAL research competitor X
  Subject: @CHAOS check server status
  Subject: @RUSH scan for vulnerabilities
  Subject: @COMPUTERWIZ run diagnostics
  Subject: @DIGITAL-MARKETING plan ad campaign
  Subject: @CONTENT-STUDIO create content calendar

Agent names are NOT case-sensitive.
Use hyphens for multi-word names.

NO @ prefix = just a note, no action taken
@ prefix = COMMAND, agent WILL take action

=============================================
ALL 48 AGENTS ARE AVAILABLE
=============================================
Heads: Stone, Cardinal, Chaos
Guards: Rush, Computer Wiz
+ 43 platform agents

See agent-email-directory on the desktop
for the full list with examples.
=============================================
"""

COMPOSE_SHORTCUT = """[InternetShortcut]
URL=https://mail.google.com/mail/?view=cm&to=3headedm@gmail.com
IconIndex=0
"""

INBOX_SHORTCUT = """[InternetShortcut]
URL=https://mail.google.com
IconIndex=0
"""

GMAIL_COMPOSE_URL = "https://mail.google.com/mail/?view=cm&to=3headedm@gmail.com"


def run_ssh_command(ssh, cmd, description=""):
    """Execute a command via SSH and print results."""
    if description:
        print(f"\n[CHAOS] {description}")
    print(f"  CMD: {cmd[:200]}{'...' if len(cmd) > 200 else ''}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(f"  OUT: {out}")
    if err:
        print(f"  ERR: {err}")
    return out, err


def write_remote_file_b64(ssh, content, remote_path, description=""):
    """Write a file on the remote machine using Base64 encoding to avoid shell escaping issues."""
    if description:
        print(f"\n[CHAOS] {description}")
    # Encode content as base64
    b64 = base64.b64encode(content.encode("utf-8")).decode("ascii")
    # Use PowerShell to decode and write
    cmd = (
        f'powershell -Command "'
        f"[System.IO.File]::WriteAllText("
        f"'{remote_path}', "
        f"[System.Text.Encoding]::UTF8.GetString("
        f"[System.Convert]::FromBase64String('{b64}')))"
        f'"'
    )
    print(f"  Writing {remote_path} via Base64 ({len(content)} chars)...")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(f"  OUT: {out}")
    if err:
        print(f"  ERR: {err}")
    else:
        print(f"  [OK]")
    return out, err


def main():
    print("=" * 60)
    print("  CHAOS (Head 3) -- Setting up Trina's email access")
    print("  Target: OMEN (Palace) @ " + OMEN_HOST)
    print("=" * 60)

    # --- Connect via SSH ---
    print(f"\n[CHAOS] Connecting to OMEN via SSH ({OMEN_USER}@{OMEN_HOST}:{OMEN_PORT})...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(OMEN_HOST, port=OMEN_PORT, username=OMEN_USER, password=OMEN_PASS, timeout=15)
        print("[CHAOS] SSH connection established.")
    except Exception as e:
        print(f"[CHAOS] ERROR: SSH connection failed: {e}")
        sys.exit(1)

    # --- Step 1: Write EMAIL-THE-MONSTER.txt ---
    write_remote_file_b64(
        ssh, EMAIL_THE_MONSTER_TXT,
        f"{REMOTE_DESKTOP}\\EMAIL-THE-MONSTER.txt",
        "Writing EMAIL-THE-MONSTER.txt to desktop..."
    )

    # --- Step 2: Create Gmail Compose shortcut ---
    write_remote_file_b64(
        ssh, COMPOSE_SHORTCUT,
        f"{REMOTE_DESKTOP}\\Three-Headed Monster Email.url",
        "Creating 'Three-Headed Monster Email.url' shortcut..."
    )

    # --- Step 3: Create Gmail Inbox shortcut ---
    write_remote_file_b64(
        ssh, INBOX_SHORTCUT,
        f"{REMOTE_DESKTOP}\\Gmail Inbox.url",
        "Creating 'Gmail Inbox.url' shortcut..."
    )

    # --- Step 4: SFTP the agent-email-directory.txt ---
    print("\n[CHAOS] Transferring agent-email-directory.txt via SFTP...")
    local_directory_file = r"C:\Users\stone\stone-ai\agent-email-directory.txt"
    remote_directory_file = f"{REMOTE_DESKTOP}\\agent-email-directory.txt"

    try:
        sftp = ssh.open_sftp()
        sftp.put(local_directory_file, remote_directory_file)
        sftp.close()
        print(f"  SFTP: {local_directory_file} -> {remote_directory_file} [OK]")
    except Exception as e:
        print(f"  SFTP ERROR: {e}")
        # Fallback: read local and write via base64
        print("  [CHAOS] Fallback: writing via Base64...")
        with open(local_directory_file, "r", encoding="utf-8") as f:
            directory_content = f.read()
        write_remote_file_b64(ssh, directory_content, remote_directory_file, "Fallback write...")

    # --- Step 5: Verify all files exist on desktop ---
    run_ssh_command(
        ssh,
        f'dir "{REMOTE_DESKTOP}\\EMAIL-THE-MONSTER.txt" "{REMOTE_DESKTOP}\\Three-Headed Monster Email.url" "{REMOTE_DESKTOP}\\Gmail Inbox.url" "{REMOTE_DESKTOP}\\agent-email-directory.txt"',
        "Verifying all files on desktop..."
    )

    # --- Step 6: Launch Gmail compose in browser via schtasks ---
    task_name = "OpenGmailCompose"
    run_ssh_command(
        ssh,
        f'schtasks /Delete /TN "{task_name}" /F 2>NUL',
        "Cleaning up any prior scheduled task..."
    )

    run_ssh_command(
        ssh,
        f'schtasks /Create /TN "{task_name}" /TR "cmd /c start {GMAIL_COMPOSE_URL}" /SC ONCE /ST 00:00 /F /RL HIGHEST',
        "Creating scheduled task to open Gmail compose..."
    )

    run_ssh_command(
        ssh,
        f'schtasks /Run /TN "{task_name}" /I',
        "Running task to open Gmail compose window on Trina's screen..."
    )

    time.sleep(3)
    run_ssh_command(
        ssh,
        f'schtasks /Delete /TN "{task_name}" /F 2>NUL',
        "Cleaning up scheduled task..."
    )

    # --- Done ---
    ssh.close()

    print("\n" + "=" * 60)
    print("  CHAOS REPORT -- Trina Email Setup Complete")
    print("=" * 60)
    print(f"""
  FILES DEPLOYED TO {REMOTE_DESKTOP}:
    1. EMAIL-THE-MONSTER.txt          -- Quick instructions
    2. Three-Headed Monster Email.url -- Opens Gmail compose to 3headedm
    3. Gmail Inbox.url                -- Opens Gmail inbox
    4. agent-email-directory.txt      -- Full 48-agent directory

  BROWSER ACTION:
    Gmail compose window launched on Trina's screen
    Pre-filled To: 3headedm@gmail.com

  Trina can now:
    - Double-click "Three-Headed Monster Email.url" to compose anytime
    - Use @AGENT subject line format to command any of 48 agents
    - Reference EMAIL-THE-MONSTER.txt for quick syntax
    - Reference agent-email-directory.txt for the full agent list

  Chaos out.
""")


if __name__ == "__main__":
    main()
