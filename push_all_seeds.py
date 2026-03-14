#!/usr/bin/env python3
"""
Push ALL agent brains, souls, seeds, and identities to the Palace (OMEN).
Uses paramiko for SSH/SFTP with password authentication.
"""

import os
import sys
import paramiko
import stat

# Palace connection
HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASSWORD = "Palace2026!"

# Source base
LOCAL_BASE = r"C:\Users\stone\stone-ai\docs\palace-usb-package"

# Remote base
REMOTE_BASE = "C:/Users/admin/Palace"

# Additional file: prompt list
PROMPT_LIST_SRC = r"C:\Users\stone\Desktop\CHAOS_RUSH_PROMPT_LIST.txt"
PROMPT_LIST_DST = "C:/Users/admin/Desktop/CHAOS_RUSH_PROMPT_LIST.txt"

# Files/dirs to push from palace-usb-package to Palace
PUSH_MAP = {
    # Seeds (brains and souls)
    "seeds/stone-seeds.md": "seeds/stone-seeds.md",
    "seeds/cardinal-seeds.md": "seeds/cardinal-seeds.md",
    "seeds/chaos-seeds.md": "seeds/chaos-seeds.md",
    "seeds/computerwiz-seeds.md": "seeds/computerwiz-seeds.md",
    "seeds/shared-context.md": "seeds/shared-context.md",
    "seeds/agent-identities.json": "seeds/agent-identities.json",
    "seeds/business-knowledge.md": "seeds/business-knowledge.md",
    "seeds/palace-operations.md": "seeds/palace-operations.md",
    "seeds/infrastructure-roadmap.md": "seeds/infrastructure-roadmap.md",
    "seeds/technical-patterns.md": "seeds/technical-patterns.md",
    "seeds/troubleshooting-playbook.md": "seeds/troubleshooting-playbook.md",
    # Architecture docs
    "PALACE-ARCHITECTURE.md": "PALACE-ARCHITECTURE.md",
    "palace-setup.sh": "palace-setup.sh",
    # Extra docs
    "QUICK-REFERENCE.md": "QUICK-REFERENCE.md",
    "USB-INSTALL-GUIDE.md": "USB-INSTALL-GUIDE.md",
    "SPEC-palace-gui.md": "SPEC-palace-gui.md",
    "SPEC-palace-status-ui.md": "SPEC-palace-status-ui.md",
    # Installer scripts
    "install-palace-tools.js": "install-palace-tools.js",
    "palace-master-install.js": "palace-master-install.js",
    "palace-status-engine.js": "palace-status-engine.js",
    "patch-palace.js": "patch-palace.js",
}

# Directories to push recursively
PUSH_DIRS = [
    ("seeds/knowledge/reasoning", "seeds/knowledge/reasoning"),
    ("seeds/knowledge/infrastructure", "seeds/knowledge/infrastructure"),
    ("seeds/knowledge/quality", "seeds/knowledge/quality"),
    ("seeds/knowledge/business", "seeds/knowledge/business"),
    ("seeds/knowledge/experience-os", "seeds/knowledge/experience-os"),
    ("palace-gui", "palace-gui"),
]


def ensure_remote_dir(sftp, remote_path):
    """Recursively create remote directories."""
    dirs_to_create = []
    path = remote_path
    while True:
        try:
            sftp.stat(path)
            break
        except FileNotFoundError:
            dirs_to_create.append(path)
            parent = os.path.dirname(path).replace("\\", "/")
            if parent == path or not parent:
                break
            path = parent
    for d in reversed(dirs_to_create):
        try:
            sftp.mkdir(d)
            print(f"  [DIR]  Created: {d}")
        except Exception:
            pass  # May already exist from race


def push_file(sftp, local_path, remote_path):
    """Push a single file, creating parent dirs as needed."""
    remote_dir = os.path.dirname(remote_path).replace("\\", "/")
    ensure_remote_dir(sftp, remote_dir)
    size = os.path.getsize(local_path)
    sftp.put(local_path, remote_path)
    print(f"  [FILE] {os.path.basename(local_path):.<50s} {size:>8,} bytes -> {remote_path}")
    return size


def push_directory(sftp, local_dir, remote_dir):
    """Recursively push a directory."""
    total_files = 0
    total_bytes = 0
    for root, dirs, files in os.walk(local_dir):
        rel = os.path.relpath(root, local_dir).replace("\\", "/")
        if rel == ".":
            target = remote_dir
        else:
            target = f"{remote_dir}/{rel}"
        ensure_remote_dir(sftp, target)
        for f in files:
            if f == "__pycache__" or f.endswith(".pyc"):
                continue
            local_file = os.path.join(root, f)
            remote_file = f"{target}/{f}"
            sz = push_file(sftp, local_file, remote_file)
            total_files += 1
            total_bytes += sz
    return total_files, total_bytes


def list_remote_dir(sftp, path, indent=0):
    """Recursively list remote directory for verification."""
    try:
        items = sftp.listdir_attr(path)
    except Exception as e:
        print(f"{'  ' * indent}[ERROR] Cannot list {path}: {e}")
        return 0, 0

    files = 0
    total_size = 0
    for item in sorted(items, key=lambda x: x.filename):
        full = f"{path}/{item.filename}"
        if stat.S_ISDIR(item.st_mode):
            print(f"{'  ' * indent}[DIR]  {item.filename}/")
            f, s = list_remote_dir(sftp, full, indent + 1)
            files += f
            total_size += s
        else:
            print(f"{'  ' * indent}[FILE] {item.filename} ({item.st_size:,} bytes)")
            files += 1
            total_size += item.st_size
    return files, total_size


def main():
    print("=" * 70)
    print("PALACE SEED PUSH — All Agent Brains, Souls, Seeds & Identities")
    print("=" * 70)
    print(f"Target: {USER}@{HOST}:{PORT}")
    print(f"Remote base: {REMOTE_BASE}")
    print()

    # Connect
    print("[1/4] Connecting to Palace...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
    except Exception as e:
        print(f"FATAL: Cannot connect to Palace: {e}")
        sys.exit(1)
    print("  Connected!")

    sftp = ssh.open_sftp()

    # Check what exists
    print("\n[2/4] Checking existing Palace files...")
    try:
        existing = sftp.listdir(REMOTE_BASE)
        print(f"  Palace directory exists with {len(existing)} items: {existing}")
    except FileNotFoundError:
        print(f"  Palace directory does not exist. Will create {REMOTE_BASE}")
        ensure_remote_dir(sftp, REMOTE_BASE)

    # Push everything
    print("\n[3/4] Pushing all files...")
    total_files = 0
    total_bytes = 0

    # Push individual files
    print("\n--- Individual Files ---")
    for local_rel, remote_rel in PUSH_MAP.items():
        local_path = os.path.join(LOCAL_BASE, local_rel)
        remote_path = f"{REMOTE_BASE}/{remote_rel}"
        if os.path.exists(local_path):
            sz = push_file(sftp, local_path, remote_path)
            total_files += 1
            total_bytes += sz
        else:
            print(f"  [SKIP] Not found locally: {local_path}")

    # Push directories recursively
    for local_rel, remote_rel in PUSH_DIRS:
        local_dir = os.path.join(LOCAL_BASE, local_rel)
        remote_dir = f"{REMOTE_BASE}/{remote_rel}"
        if os.path.isdir(local_dir):
            print(f"\n--- Directory: {local_rel} ---")
            f, s = push_directory(sftp, local_dir, remote_dir)
            total_files += f
            total_bytes += s
        else:
            print(f"  [SKIP] Dir not found: {local_dir}")

    # Push prompt list to Desktop
    print("\n--- Prompt List ---")
    if os.path.exists(PROMPT_LIST_SRC):
        sz = push_file(sftp, PROMPT_LIST_SRC, PROMPT_LIST_DST)
        total_files += 1
        total_bytes += sz
    else:
        print(f"  [SKIP] Not found: {PROMPT_LIST_SRC}")

    print(f"\n{'=' * 70}")
    print(f"PUSH COMPLETE: {total_files} files, {total_bytes:,} bytes total")
    print(f"{'=' * 70}")

    # Verify
    print("\n[4/4] Verifying Palace contents...")
    print(f"\n--- {REMOTE_BASE} ---")
    v_files, v_bytes = list_remote_dir(sftp, REMOTE_BASE)
    print(f"\nVerification: {v_files} files, {v_bytes:,} bytes on Palace")

    # Also verify prompt list
    print(f"\n--- Desktop prompt list ---")
    try:
        info = sftp.stat(PROMPT_LIST_DST)
        print(f"  [OK] CHAOS_RUSH_PROMPT_LIST.txt ({info.st_size:,} bytes)")
    except FileNotFoundError:
        print(f"  [MISSING] CHAOS_RUSH_PROMPT_LIST.txt")

    sftp.close()
    ssh.close()

    print(f"\n{'=' * 70}")
    print("ALL DONE. Every brain, soul, seed, and identity is on the Palace.")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
