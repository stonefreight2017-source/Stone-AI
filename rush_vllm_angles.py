"""
RUSH (Royal Guard — The Breacher)
vLLM Alternative Angles Investigation
Target: OMEN Palace (169.254.26.30)
Mission: Find every path to get local LLM inference operational
"""

import subprocess
import sys
import os
import json
import time

# Fix Windows console encoding
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8')

DIVIDER = "=" * 70
SUBDIV = "-" * 50

def run_ssh(cmd, timeout=30):
    """Run command on OMEN Palace via SSH."""
    ssh_cmd = [
        "ssh", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10",
        "-p", "22", "rush@169.254.26.30", cmd
    ]
    try:
        result = subprocess.run(
            ssh_cmd, capture_output=True, text=True, timeout=timeout,
            input="Palace2026!\n" if False else None
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT", -1
    except Exception as e:
        return "", str(e), -1

def run_ssh_sshpass(cmd, timeout=60):
    """Run command on OMEN Palace via sshpass + SSH."""
    ssh_cmd = f'sshpass -p "Palace2026!" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p 22 rush@169.254.26.30 "{cmd}"'
    try:
        result = subprocess.run(
            ssh_cmd, capture_output=True, text=True, timeout=timeout, shell=True
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT", -1
    except Exception as e:
        return "", str(e), -1

def run_local(cmd, timeout=30, shell=True):
    """Run command locally."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, shell=shell
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT", -1
    except Exception as e:
        return "", str(e), -1

def section(title):
    print(f"\n{DIVIDER}")
    print(f"  RUSH RECON: {title}")
    print(DIVIDER)

def finding(label, stdout, stderr, rc):
    status = "OK" if rc == 0 else "FAIL"
    print(f"\n  [{status}] {label}")
    if stdout:
        for line in stdout.split('\n')[:30]:
            print(f"    | {line}")
    if stderr and rc != 0:
        for line in stderr.split('\n')[:10]:
            print(f"    ! {line}")
    return rc == 0

# Determine which SSH method works
def pick_ssh():
    """Try sshpass first, fall back to plain ssh with key-based auth."""
    # Check if sshpass is available
    out, err, rc = run_local("where sshpass 2>nul || which sshpass 2>/dev/null")
    if rc == 0:
        print("  [INFO] sshpass available — using password auth")
        return run_ssh_sshpass

    # Try plain SSH (key-based)
    out, err, rc = run_ssh("echo CONNECTED")
    if rc == 0 and "CONNECTED" in out:
        print("  [INFO] SSH key auth working — using plain SSH")
        return run_ssh

    print("  [WARN] Neither sshpass nor key-based SSH succeeded.")
    print(f"    sshpass check: {out} | {err}")
    return None


print(DIVIDER)
print("  RUSH — THE BREACHER")
print("  Royal Guard Reconnaissance Report")
print("  Target: OMEN Palace | Mission: vLLM Alternative Angles")
print(f"  Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
print(DIVIDER)

# Pick SSH method
section("SSH CONNECTIVITY CHECK")
ssh_run = pick_ssh()

if ssh_run is None:
    print("\n  [CRITICAL] Cannot establish SSH to OMEN Palace.")
    print("  Falling back to LOCAL investigation only.")
    print("  Some checks will be skipped.\n")

angles = []
angle_details = {}

# ============================================================
# ANGLE 1: Docker Status & vLLM Docker Image
# ============================================================
section("ANGLE 1 — DOCKER + vLLM DOCKER IMAGE")

if ssh_run:
    print(f"\n{SUBDIV}")
    print("  1a. Is Docker running on OMEN?")
    out, err, rc = ssh_run("tasklist | findstr -i docker", timeout=15)
    docker_running = finding("Docker process check", out, err, rc)

    if not docker_running:
        # Try starting it
        print("\n  Attempting to check Docker Desktop...")
        out, err, rc = ssh_run("docker info 2>&1 | head -20", timeout=20)
        docker_running = finding("docker info", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  1b. Docker container status")
    out, err, rc = ssh_run("docker ps -a 2>&1", timeout=15)
    finding("docker ps -a", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  1c. GPU support in Docker")
    out, err, rc = ssh_run("docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu22.04 nvidia-smi 2>&1 | head -30", timeout=120)
    gpu_docker = finding("Docker GPU (nvidia-smi)", out, err, rc)

    if gpu_docker:
        angles.append("DOCKER_VLLM")
        angle_details["DOCKER_VLLM"] = "Docker has GPU support — vLLM Docker image is viable"
        print("\n  >>> VIABLE: Docker + GPU confirmed. vLLM Docker image is a GO path.")
        print("  >>> Command to deploy:")
        print('  docker pull vllm/vllm-openai:latest')
        print('  docker run -d --gpus all \\')
        print('    -v /path/to/models:/models \\')
        print('    -p 8000:8000 \\')
        print('    vllm/vllm-openai:latest \\')
        print('    --model /models/qwen3-32b-awq \\')
        print('    --quantization awq_marlin \\')
        print('    --served-model-name qwen3-32b-awq \\')
        print('    --port 8000')
    else:
        print("\n  >>> Docker GPU not confirmed yet. May need NVIDIA Container Toolkit.")

    # Check if vllm image already exists
    print(f"\n{SUBDIV}")
    print("  1d. Existing vLLM Docker images")
    out, err, rc = ssh_run("docker images 2>&1 | grep -i vllm", timeout=15)
    finding("vLLM images", out, err, rc)

    # Check NVIDIA Container Toolkit
    print(f"\n{SUBDIV}")
    print("  1e. NVIDIA Container Toolkit status")
    out, err, rc = ssh_run("nvidia-ctk --version 2>&1 || echo 'nvidia-ctk not found'", timeout=15)
    finding("nvidia-ctk", out, err, rc)

else:
    print("  [SKIP] No SSH — cannot check Docker on OMEN remotely.")

# ============================================================
# ANGLE 2: Ollama 32B Model
# ============================================================
section("ANGLE 2 — OLLAMA WITH 32B MODEL")

if ssh_run:
    print(f"\n{SUBDIV}")
    print("  2a. Ollama service status")
    out, err, rc = ssh_run("tasklist | findstr -i ollama", timeout=15)
    ollama_running = finding("Ollama process", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  2b. Ollama model list")
    out, err, rc = ssh_run("ollama list 2>&1", timeout=15)
    finding("ollama list", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  2c. Ollama API tags")
    out, err, rc = ssh_run("curl -s http://127.0.0.1:11434/api/tags 2>&1", timeout=15)
    if rc == 0 and out:
        try:
            tags = json.loads(out)
            models = [m.get('name', '') for m in tags.get('models', [])]
            print(f"  Models available: {models}")
            has_32b = any('32b' in m.lower() or '32B' in m for m in models)
            if has_32b:
                print("  >>> 32B model ALREADY available in Ollama!")
                angles.append("OLLAMA_32B")
                angle_details["OLLAMA_32B"] = "Ollama already has a 32B model loaded"
        except:
            finding("Ollama API", out, err, rc)
    else:
        finding("Ollama API", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  2d. Can Ollama pull qwen3:32b?")
    print("  [INFO] Checking Ollama registry for qwen3:32b availability...")
    out, err, rc = ssh_run("curl -s https://ollama.com/api/tags/qwen3 2>&1 | head -5", timeout=15)
    finding("Ollama registry check", out, err, rc)

    # Check available VRAM for 32B
    print(f"\n{SUBDIV}")
    print("  2e. GPU VRAM check (can it fit 32B AWQ?)")
    out, err, rc = ssh_run("nvidia-smi --query-gpu=name,memory.total,memory.free,memory.used --format=csv 2>&1", timeout=15)
    finding("GPU VRAM", out, err, rc)
    if rc == 0:
        # 32B AWQ needs ~18-20GB VRAM
        print("  [NOTE] Qwen 32B AWQ needs ~18-20GB VRAM.")
        print("  [NOTE] RTX 5090 has 32GB — should fit with room to spare.")
        angles.append("OLLAMA_PULL_32B")
        angle_details["OLLAMA_PULL_32B"] = "RTX 5090 32GB can fit 32B AWQ (~18-20GB)"

else:
    print("  [SKIP] No SSH — cannot check Ollama on OMEN remotely.")

# ============================================================
# ANGLE 3: AWQ to GGUF Conversion
# ============================================================
section("ANGLE 3 — AWQ TO GGUF CONVERSION (FOR OLLAMA)")

if ssh_run:
    print(f"\n{SUBDIV}")
    print("  3a. Python availability")
    out, err, rc = ssh_run("python --version 2>&1 || python3 --version 2>&1", timeout=15)
    finding("Python version", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  3b. llama.cpp / conversion tools")
    out, err, rc = ssh_run("where llama-cli 2>&1 || which llama-cli 2>&1 || echo 'not found'", timeout=15)
    finding("llama-cli", out, err, rc)

    out, err, rc = ssh_run("pip list 2>&1 | grep -iE 'llama|gguf|awq|transformers|auto-gptq' || echo 'no relevant packages'", timeout=15)
    finding("Python packages (llama/gguf/awq)", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  3c. Model files location")
    out, err, rc = ssh_run("dir /b \"C:\\models\" 2>&1 || ls /mnt/c/models 2>&1 || echo 'no models dir found'", timeout=15)
    finding("C:\\models directory", out, err, rc)

    # Check common model locations
    for path in ["C:\\Users\\admin\\.cache\\huggingface", "D:\\models", "C:\\AI\\models"]:
        out, err, rc = ssh_run(f'dir /b "{path}" 2>&1 || echo "not found"', timeout=10)
        if "not found" not in out and rc == 0:
            finding(f"Models at {path}", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  3d. Can we convert AWQ safetensors to GGUF?")
    print("  [INFO] Conversion path: AWQ safetensors → HF format → GGUF via llama.cpp")
    print("  [INFO] Tools needed: autoawq, transformers, llama-cpp-python or llama.cpp convert script")
    print("  [NOTE] Alternative: Use AutoAWQ to dequantize → then convert to GGUF")
    angles.append("AWQ_TO_GGUF")
    angle_details["AWQ_TO_GGUF"] = "Possible but multi-step: AWQ→dequant→GGUF. Needs tooling."

else:
    print("  [SKIP] No SSH — cannot check conversion tools on OMEN remotely.")

# ============================================================
# ANGLE 4: Windows-Native Alternatives
# ============================================================
section("ANGLE 4 — WINDOWS-NATIVE LLM SERVERS")

if ssh_run:
    alternatives = {
        "LM Studio": [
            'dir /b "C:\\Program Files\\LM Studio" 2>&1',
            'dir /b "C:\\Users\\admin\\AppData\\Local\\LM Studio" 2>&1',
            'dir /b "C:\\Users\\admin\\AppData\\Local\\Programs\\LM Studio" 2>&1',
        ],
        "text-generation-webui": [
            'dir /b "C:\\text-generation-webui" 2>&1',
            'dir /b "C:\\Users\\admin\\text-generation-webui" 2>&1',
        ],
        "koboldcpp": [
            'where koboldcpp 2>&1',
            'dir /b "C:\\koboldcpp" 2>&1',
        ],
        "LocalAI": [
            'where localai 2>&1',
            'dir /b "C:\\LocalAI" 2>&1',
        ],
        "llama.cpp server": [
            'where llama-server 2>&1',
            'where llama-cli 2>&1',
            'dir /b "C:\\llama.cpp" 2>&1',
        ],
        "TensorRT-LLM": [
            'dir /b "C:\\TensorRT-LLM" 2>&1',
            'pip show tensorrt-llm 2>&1 | head -3',
        ],
        "ExLlamaV2": [
            'pip show exllamav2 2>&1 | head -3',
        ],
    }

    for name, cmds in alternatives.items():
        print(f"\n{SUBDIV}")
        print(f"  4. Checking: {name}")
        found = False
        for cmd in cmds:
            out, err, rc = ssh_run(cmd, timeout=10)
            if rc == 0 and out and "not found" not in out.lower() and "cannot find" not in out.lower() and "not recognized" not in out.lower():
                finding(f"{name} found", out, err, rc)
                found = True
                angles.append(f"NATIVE_{name.upper().replace(' ', '_').replace('-', '_')}")
                angle_details[f"NATIVE_{name.upper().replace(' ', '_').replace('-', '_')}"] = f"{name} is installed on OMEN"
                break
        if not found:
            print(f"    Not installed.")

else:
    print("  [SKIP] No SSH — cannot check OMEN for native alternatives.")

# ============================================================
# ANGLE 5: WSL2 Status (what Chaos is working on)
# ============================================================
section("ANGLE 5 — WSL2 STATUS (CHAOS's CURRENT PATH)")

if ssh_run:
    print(f"\n{SUBDIV}")
    print("  5a. WSL distributions")
    out, err, rc = ssh_run("wsl --list --verbose 2>&1", timeout=15)
    finding("WSL distributions", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  5b. WSL GPU passthrough")
    out, err, rc = ssh_run("wsl -- nvidia-smi 2>&1 | head -20", timeout=20)
    wsl_gpu = finding("WSL nvidia-smi", out, err, rc)
    if wsl_gpu:
        angles.append("WSL2_VLLM")
        angle_details["WSL2_VLLM"] = "WSL2 has GPU passthrough — vLLM can run natively in WSL"

    print(f"\n{SUBDIV}")
    print("  5c. CUDA in WSL")
    out, err, rc = ssh_run("wsl -- nvcc --version 2>&1", timeout=15)
    finding("WSL CUDA (nvcc)", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  5d. Python in WSL")
    out, err, rc = ssh_run("wsl -- python3 --version 2>&1", timeout=15)
    finding("WSL Python", out, err, rc)

    print(f"\n{SUBDIV}")
    print("  5e. vLLM in WSL")
    out, err, rc = ssh_run("wsl -- pip show vllm 2>&1 | head -5", timeout=15)
    finding("WSL vLLM package", out, err, rc)

else:
    print("  [SKIP] No SSH — cannot check WSL2 on OMEN remotely.")

# ============================================================
# ANGLE 6: Docker GPU Deployment (Full Command)
# ============================================================
section("ANGLE 6 — DOCKER DIRECT DEPLOYMENT PLAN")

print("""
  If Docker Desktop is running with GPU support (NVIDIA Container Toolkit),
  the FASTEST path to vLLM is:

  STEP 1: Verify GPU in Docker
    docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu22.04 nvidia-smi

  STEP 2: Pull vLLM image
    docker pull vllm/vllm-openai:latest

  STEP 3: Find model path on OMEN (where are the safetensors?)
    Likely locations:
      C:\\models\\qwen3-32b-awq
      C:\\Users\\admin\\.cache\\huggingface\\hub\\
      D:\\models\\

  STEP 4: Run vLLM container
    docker run -d --gpus all \\
      --name vllm-qwen \\
      -v /path/to/models:/models \\
      -p 8000:8000 \\
      vllm/vllm-openai:latest \\
      --model /models/qwen3-32b-awq \\
      --quantization awq_marlin \\
      --served-model-name qwen3-32b-awq \\
      --port 8000 \\
      --max-model-len 8192 \\
      --gpu-memory-utilization 0.90

  STEP 5: Test
    curl http://localhost:8000/v1/models
    curl http://localhost:8000/v1/chat/completions \\
      -H "Content-Type: application/json" \\
      -d '{"model":"qwen3-32b-awq","messages":[{"role":"user","content":"test"}]}'

  NOTE: Docker on Windows mounts paths differently.
    Windows path C:\\models becomes /c/models or use Docker volume.
""")

# ============================================================
# ANGLE 7: Quick-Win Fallbacks
# ============================================================
section("ANGLE 7 — QUICK-WIN FALLBACKS")

print("""
  If all else fails, these are ranked fastest-to-deploy:

  1. OLLAMA PULL (5 min)
     ollama pull qwen3:32b
     → Uses GGUF format, auto-downloads, serves on :11434
     → OpenAI-compatible API at http://localhost:11434/v1
     → FASTEST PATH if Ollama is already running

  2. LM STUDIO (10 min)
     → Download from lmstudio.ai, load any GGUF model
     → GUI + API server built in
     → Supports AWQ via llama.cpp backend

  3. KOBOLDCPP (10 min)
     → Single executable, no install
     → Download from github.com/LostRuins/koboldcpp
     → Windows native, CUDA support, serves OpenAI-compatible API

  4. DOCKER VLLM (20 min if Docker+GPU working)
     → Most production-grade option
     → Matches current vLLM setup exactly

  5. WSL2 NATIVE VLLM (30-60 min)
     → What Chaos is building
     → Most complex but most flexible
""")

# ============================================================
# FINAL REPORT
# ============================================================
section("FINAL REPORT — ALL VIABLE ANGLES")

print(f"\n  Total angles identified: {len(angles)}")
print()

if angles:
    for i, angle in enumerate(angles, 1):
        detail = angle_details.get(angle, "No details")
        print(f"  {i}. [{angle}] — {detail}")
else:
    print("  No angles confirmed (SSH may have failed — see notes above)")
    print("  All 7 angles remain THEORETICALLY viable pending SSH access.")

print(f"""
{SUBDIV}
  RUSH'S RECOMMENDATION (Priority Order):
{SUBDIV}

  #1 FASTEST: 'ollama pull qwen3:32b'
      → If Ollama is running, this is 5 minutes to a working 32B server.
      → RTX 5090 32GB handles it easily.
      → OpenAI-compatible API works with Stone AI's existing code.

  #2 PRODUCTION: Docker + vLLM image
      → If Docker Desktop has GPU support (NVIDIA Container Toolkit),
        this gives us the EXACT same vLLM setup, containerized.
      → Most robust for production use.

  #3 FULL CONTROL: WSL2 + native vLLM (Chaos's path)
      → Most flexible, full Linux environment.
      → Takes longest to set up but best long-term.

  #4 BACKUP: LM Studio or koboldcpp
      → Windows-native, zero-config fallbacks.
      → Good for testing while primary path is being built.

{DIVIDER}
  RUSH OUT. Founder has all angles. Chaos proceed with your path —
  Rush has mapped the alternatives if WSL2 hits walls.
{DIVIDER}
""")
