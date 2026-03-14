#!/usr/bin/env python3
"""
Computer Wiz — Full OMEN Palace Inventory Scan
Scans everything relevant to vLLM deployment so Chaos can stop searching and start installing.
"""

import subprocess
import sys
import json

DIVIDER = "=" * 80
SECTION = "-" * 60

def run(cmd, shell=True, timeout=30):
    """Run a command and return stdout+stderr."""
    try:
        r = subprocess.run(cmd, shell=shell, capture_output=True, text=True, timeout=timeout)
        output = (r.stdout or "") + (r.stderr or "")
        return output.strip() if output.strip() else "(no output)"
    except subprocess.TimeoutExpired:
        return "(TIMEOUT after {}s)".format(timeout)
    except Exception as e:
        return f"(ERROR: {e})"

def wsl_cmd(distro, bash_cmd, timeout=30):
    """Run a command inside WSL distro."""
    return run(f'wsl -d {distro} -- bash -c "{bash_cmd}"', timeout=timeout)

def section(title):
    print(f"\n{DIVIDER}")
    print(f"  {title}")
    print(DIVIDER)

def check(label, result):
    print(f"\n{SECTION}")
    print(f"  [{label}]")
    print(SECTION)
    print(result)
    print()

def main():
    print(DIVIDER)
    print("  COMPUTER WIZ — FULL OMEN PALACE INVENTORY SCAN")
    print(f"  Target: OMEN 45L (RTX 5090 32GB, AMD Ryzen, 64GB DDR5)")
    print(DIVIDER)

    # =========================================================================
    # WSL
    # =========================================================================
    section("WSL DISTROS & STATE")
    check("wsl --list --verbose", run("wsl --list --verbose"))
    check("Ubuntu kernel (uname -a)", wsl_cmd("Ubuntu", "uname -a"))
    check("Ubuntu OS release", wsl_cmd("Ubuntu", "cat /etc/os-release"))
    check("Ubuntu whoami", wsl_cmd("Ubuntu", "whoami"))

    # =========================================================================
    # GPU IN WSL
    # =========================================================================
    section("GPU PASSTHROUGH IN WSL")
    check("nvidia-smi (full)", wsl_cmd("Ubuntu", "nvidia-smi", timeout=15))
    check("nvidia-smi (CSV summary)", wsl_cmd("Ubuntu", "nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv"))

    # =========================================================================
    # PYTHON IN WSL
    # =========================================================================
    section("PYTHON IN WSL")
    check("which python3 + version", wsl_cmd("Ubuntu", "which python3 && python3 --version"))
    check("which pip3 + version", wsl_cmd("Ubuntu", "which pip3 && pip3 --version"))
    check("pip3 list (installed packages)", wsl_cmd("Ubuntu", "pip3 list 2>/dev/null", timeout=15))
    check("ls /opt/ (existing venvs?)", wsl_cmd("Ubuntu", "ls -la /opt/ 2>/dev/null"))
    check("find vllm dirs", wsl_cmd("Ubuntu", "find / -name 'vllm' -type d 2>/dev/null | head -20", timeout=30))

    # =========================================================================
    # CUDA IN WSL
    # =========================================================================
    section("CUDA IN WSL")
    check("nvcc --version", wsl_cmd("Ubuntu", "nvcc --version 2>/dev/null || echo NO NVCC"))
    check("CUDA directories", wsl_cmd("Ubuntu", "ls -la /usr/local/cuda* 2>/dev/null || echo NO CUDA DIR"))
    check("dpkg cuda packages", wsl_cmd("Ubuntu", "dpkg -l 2>/dev/null | grep -i cuda | head -30"))
    check("PyTorch CUDA test", wsl_cmd("Ubuntu", "python3 -c 'import torch; print(\"CUDA available:\", torch.cuda.is_available(), \"| torch version:\", torch.__version__)' 2>/dev/null || echo NO TORCH"))

    # =========================================================================
    # NODE IN WSL
    # =========================================================================
    section("NODE.JS IN WSL")
    check("node", wsl_cmd("Ubuntu", "which node && node --version 2>/dev/null || echo NO NODE"))
    check("npm", wsl_cmd("Ubuntu", "which npm && npm --version 2>/dev/null || echo NO NPM"))

    # =========================================================================
    # MODELS
    # =========================================================================
    section("MODEL FILES (WSL ACCESS)")
    check("ls /mnt/c/models/", wsl_cmd("Ubuntu", "ls -la /mnt/c/models/ 2>/dev/null || echo NO /mnt/c/models/"))
    check("ls /mnt/c/models/qwen3-32b-awq/", wsl_cmd("Ubuntu", "ls -la /mnt/c/models/qwen3-32b-awq/ 2>/dev/null || echo NO qwen3-32b-awq DIR"))
    # Also check Windows side
    check("dir C:\\models (Windows side)", run("dir C:\\models /s /b 2>nul || echo NO C:\\models", timeout=15))

    # =========================================================================
    # DOCKER (Windows)
    # =========================================================================
    section("DOCKER")
    check("Docker processes (tasklist)", run("tasklist 2>nul | findstr /i docker || echo NO DOCKER PROCESSES"))
    check("docker ps", run("docker ps 2>nul || echo DOCKER NOT RUNNING"))
    check("docker images", run("docker images 2>nul || echo DOCKER NOT RUNNING"))
    check("docker info (version/runtime)", run('docker info 2>nul | findstr /i "Server Version runtime" || echo NO DOCKER INFO'))

    # =========================================================================
    # PORTS
    # =========================================================================
    section("PORT SCAN (8000, 8001, 7070, 11434)")
    check("netstat LISTEN", run('netstat -an | findstr "8000 8001 7070 11434" | findstr LISTEN || echo NO LISTENERS ON THESE PORTS'))

    # =========================================================================
    # OLLAMA
    # =========================================================================
    section("OLLAMA")
    check("Ollama API /api/tags", run("curl -s http://127.0.0.1:11434/api/tags 2>nul || echo OLLAMA NOT RESPONDING", timeout=10))
    check("Ollama process", run("tasklist 2>nul | findstr /i ollama || echo NO OLLAMA PROCESS"))

    # =========================================================================
    # EXISTING TOOLS IN WSL
    # =========================================================================
    section("EXISTING TOOLS IN WSL")
    check("opencode", wsl_cmd("Ubuntu", "which opencode 2>/dev/null || echo NO OPENCODE"))
    check("pip3 show vllm", wsl_cmd("Ubuntu", "pip3 show vllm 2>/dev/null || echo NO VLLM INSTALLED"))
    check("pip3 show transformers", wsl_cmd("Ubuntu", "pip3 show transformers 2>/dev/null || echo NO TRANSFORMERS"))
    check("pip3 show huggingface-hub", wsl_cmd("Ubuntu", "pip3 show huggingface-hub 2>/dev/null || echo NO HUGGINGFACE-HUB"))

    # =========================================================================
    # PALACE DIR
    # =========================================================================
    section("PALACE DIRECTORY (OMEN)")
    # Check via SSH what's on the OMEN at C:\Users\admin\Palace
    check("SSH to OMEN — Palace dir", run(
        'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 rush@169.254.26.30 "dir C:\\Users\\admin\\Palace /s /b 2>nul || echo NO PALACE DIR"',
        timeout=15
    ))
    # Also check if Palace exists locally (in case we're ON the OMEN)
    check("Local Palace dir check", run('dir "C:\\Users\\admin\\Palace" /s /b 2>nul || echo NO LOCAL PALACE DIR'))

    # =========================================================================
    # BONUS: DISK SPACE
    # =========================================================================
    section("DISK SPACE")
    check("Windows drives", run("wmic logicaldisk get caption,freespace,size /format:list 2>nul || echo WMIC UNAVAILABLE"))
    check("WSL disk usage", wsl_cmd("Ubuntu", "df -h / /mnt/c 2>/dev/null"))

    # =========================================================================
    # BONUS: MEMORY
    # =========================================================================
    section("SYSTEM MEMORY")
    check("Total physical memory", run('wmic computersystem get totalphysicalmemory /format:list 2>nul || echo WMIC UNAVAILABLE'))
    check("WSL free -h", wsl_cmd("Ubuntu", "free -h 2>/dev/null"))

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print(f"\n{'#' * 80}")
    print("  SCAN COMPLETE — Computer Wiz reporting to Chaos")
    print(f"{'#' * 80}")
    print("""
Review the output above. Key things Chaos needs to know:
1. Does WSL Ubuntu exist and start?
2. Does GPU passthrough work (nvidia-smi in WSL)?
3. Is CUDA toolkit installed in WSL?
4. Is Python3 + pip3 available in WSL?
5. Is PyTorch with CUDA already installed?
6. Is vLLM already installed anywhere?
7. Can WSL see model files at /mnt/c/models/?
8. Is Docker running? Any relevant images?
9. Is Ollama running? What models does it have?
10. What's at the Palace directory?
11. Disk space sufficient for model weights + vLLM?
12. System memory available?
""")

if __name__ == "__main__":
    main()
