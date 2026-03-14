"""
CHAOS RECON — OMEN Palace vLLM Readiness Assessment
Target: 169.254.26.30:22 (user: rush)
Mission: READ-ONLY inventory of GPU, models, Python, Docker, CUDA, disk, ports
"""

import subprocess
import sys

# Ensure paramiko is available
try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

import time
from datetime import datetime

HOST = "169.254.26.30"
PORT = 22
USER = "rush"
PASS = "Palace2026!"
TIMEOUT = 30

def ssh_exec(client, cmd, timeout=30):
    """Execute a command via SSH and return stdout+stderr."""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace").strip()
        err = stderr.read().decode("utf-8", errors="replace").strip()
        return out, err
    except Exception as e:
        return "", f"[EXEC ERROR] {e}"

def run_recon():
    print("=" * 70)
    print("CHAOS RECON — OMEN Palace vLLM Readiness")
    print(f"Target: {USER}@{HOST}:{PORT}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 70)

    # Connect
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print("\n[CONNECT] Establishing SSH connection...")
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=TIMEOUT)
        print("[CONNECT] SUCCESS")
    except Exception as e:
        print(f"[CONNECT] FAILED: {e}")
        print("\nCannot proceed without SSH access. Aborting recon.")
        return

    # Define all recon commands — Windows commands (OMEN runs Windows)
    recon_sections = [
        ("1. SYSTEM INFO", [
            ("Hostname & OS", "hostname & ver"),
            ("System Info (brief)", "systeminfo | findstr /B /C:\"OS Name\" /C:\"OS Version\" /C:\"System Type\" /C:\"Total Physical Memory\" /C:\"Processor\""),
        ]),
        ("2. GPU & CUDA STATUS", [
            ("nvidia-smi", "nvidia-smi"),
            ("nvidia-smi (GPU details)", "nvidia-smi --query-gpu=name,memory.total,memory.free,memory.used,driver_version,cuda_version --format=csv"),
            ("CUDA toolkit (nvcc)", "nvcc --version 2>nul || echo nvcc not found"),
            ("CUDA toolkit directory", "dir /b \"C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\" 2>nul || echo No CUDA toolkit dir found"),
        ]),
        ("3. vLLM SEARCH", [
            ("Search for vllm files", "dir /s /b C:\\vllm* 2>nul || echo No vllm files found at C:\\"),
            ("vllm-env pip list", "C:\\vllm-env\\Scripts\\pip.exe list 2>nul || echo vllm-env not found"),
            ("vllm-env python version", "C:\\vllm-env\\Scripts\\python.exe --version 2>nul || echo vllm-env python not found"),
            ("System pip vllm check", "pip list 2>nul | findstr -i vllm || echo vllm not in system pip"),
            ("Conda environments", "conda env list 2>nul || echo conda not found"),
        ]),
        ("4. MODELS ON DISK", [
            ("Search for .gguf files (C:)", "dir /s /b C:\\*.gguf 2>nul || echo No .gguf files on C:"),
            ("Search for .safetensors (C:)", "dir /s /b C:\\*.safetensors 2>nul || echo No .safetensors on C:"),
            ("C:\\models directory", "dir /s /b C:\\models 2>nul || echo No C:\\models"),
            ("HuggingFace cache", "dir /s /b C:\\Users\\rush\\.cache\\huggingface\\hub 2>nul || echo No HF cache for rush"),
            ("HuggingFace cache (admin)", "dir /s /b C:\\Users\\admin\\.cache\\huggingface\\hub 2>nul || echo No HF cache for admin"),
            ("Ollama models", "dir /s /b C:\\Users\\rush\\.ollama\\models 2>nul || echo No Ollama models for rush"),
            ("Ollama models (admin)", "dir /s /b C:\\Users\\admin\\.ollama\\models 2>nul || echo No Ollama models for admin"),
            ("Ollama list", "ollama list 2>nul || echo ollama not found"),
            ("D: drive check", "dir /b D:\\ 2>nul || echo No D: drive or empty"),
            ("E: drive check", "dir /b E:\\ 2>nul || echo No E: drive or empty"),
        ]),
        ("5. DOCKER STATUS", [
            ("Docker version", "docker --version 2>nul || echo Docker not found"),
            ("Docker containers running", "docker ps 2>nul || echo Docker ps failed"),
            ("Docker all containers", "docker ps -a 2>nul || echo Docker ps -a failed"),
            ("Docker images", "docker images 2>nul || echo Docker images failed"),
            ("Docker Desktop process", "tasklist /FI \"IMAGENAME eq Docker Desktop.exe\" 2>nul || echo tasklist failed"),
        ]),
        ("6. PYTHON ENVIRONMENTS", [
            ("System Python", "python --version 2>nul || echo No system python"),
            ("Python3", "python3 --version 2>nul || echo No python3"),
            ("Py launcher", "py --list 2>nul || echo No py launcher"),
            ("Where python", "where python 2>nul || echo python not in PATH"),
            ("vllm-env full pip list", "C:\\vllm-env\\Scripts\\pip.exe list 2>nul || echo vllm-env not available"),
            ("Pip (system) list torch", "pip list 2>nul | findstr -i torch || echo No torch in system pip"),
        ]),
        ("7. WSL STATUS", [
            ("WSL distributions", "wsl --list --verbose 2>nul || echo WSL not available"),
            ("WSL status", "wsl --status 2>nul || echo WSL status not available"),
        ]),
        ("8. DISK SPACE", [
            ("Disk space (WMIC)", "wmic logicaldisk get caption,size,freespace /format:list 2>nul || echo wmic failed"),
            ("Disk space (PowerShell)", "powershell -Command \"Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{N='Used(GB)';E={[math]::Round($_.Used/1GB,2)}},@{N='Free(GB)';E={[math]::Round($_.Free/1GB,2)}} | Format-Table -AutoSize\" 2>nul || echo PowerShell disk check failed"),
        ]),
        ("9. LISTENING PORTS", [
            ("All listening ports", "netstat -an | findstr LISTEN"),
            ("Port 8000 (vLLM default)", "netstat -an | findstr :8000 || echo Port 8000 not in use"),
            ("Port 11434 (Ollama)", "netstat -an | findstr :11434 || echo Port 11434 not in use"),
            ("Port 8080", "netstat -an | findstr :8080 || echo Port 8080 not in use"),
        ]),
        ("10. RUNNING PROCESSES (AI/ML related)", [
            ("Python processes", "tasklist /FI \"IMAGENAME eq python.exe\" 2>nul || echo No python processes"),
            ("Ollama processes", "tasklist /FI \"IMAGENAME eq ollama.exe\" 2>nul || echo No ollama processes"),
            ("vllm processes", "tasklist 2>nul | findstr -i vllm || echo No vllm processes"),
        ]),
    ]

    results = {}

    for section_name, commands in recon_sections:
        print(f"\n{'=' * 60}")
        print(f"  {section_name}")
        print(f"{'=' * 60}")
        for label, cmd in commands:
            print(f"\n--- {label} ---")
            print(f"  CMD: {cmd}")
            out, err = ssh_exec(client, cmd)
            if out:
                print(f"  OUT:\n{out}")
            if err and err != out:
                print(f"  ERR: {err}")
            if not out and not err:
                print("  (no output)")
            results[label] = {"out": out, "err": err}

    # Close connection
    client.close()
    print("\n[CONNECT] SSH connection closed.")

    # Summary assessment
    print("\n" + "=" * 70)
    print("  CHAOS ASSESSMENT — vLLM READINESS SUMMARY")
    print("=" * 70)

    # GPU check
    gpu_info = results.get("nvidia-smi", {}).get("out", "")
    if "5090" in gpu_info:
        print("\n[GPU] RTX 5090 DETECTED — 32GB VRAM confirmed")
    elif gpu_info:
        print(f"\n[GPU] GPU detected but not 5090. Check nvidia-smi output above.")
    else:
        print("\n[GPU] WARNING: nvidia-smi returned no data. GPU driver issue?")

    # CUDA check
    cuda_info = results.get("CUDA toolkit (nvcc)", {}).get("out", "")
    if "nvcc" in cuda_info and "not found" not in cuda_info:
        print(f"[CUDA] CUDA toolkit found: {cuda_info.split(chr(10))[-1] if cuda_info else 'unknown version'}")
    else:
        print("[CUDA] CUDA toolkit (nvcc) NOT found — may need install")

    # vLLM check
    vllm_pip = results.get("vllm-env pip list", {}).get("out", "")
    if "vllm" in vllm_pip.lower():
        print("[vLLM] vLLM package FOUND in vllm-env")
    else:
        print("[vLLM] vLLM package NOT found — needs installation")

    # Docker check
    docker_ver = results.get("Docker version", {}).get("out", "")
    if "Docker" in docker_ver and "not found" not in docker_ver:
        print(f"[DOCKER] {docker_ver}")
    else:
        print("[DOCKER] Docker not available")

    # Ollama check
    ollama_list = results.get("Ollama list", {}).get("out", "")
    if ollama_list and "not found" not in ollama_list:
        print(f"[OLLAMA] Running. Models:\n{ollama_list}")
    else:
        print("[OLLAMA] Not detected")

    # Disk space
    disk_info = results.get("Disk space (PowerShell)", {}).get("out", "")
    if disk_info:
        print(f"[DISK]\n{disk_info}")

    print("\n" + "=" * 70)
    print("  END RECON — Chaos out.")
    print("=" * 70)


if __name__ == "__main__":
    run_recon()
