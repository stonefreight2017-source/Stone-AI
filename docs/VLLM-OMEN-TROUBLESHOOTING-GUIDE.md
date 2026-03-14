# OMEN 45L vLLM Rescue Guide
## RTX 5090 + WSL2 + Qwen 2.5 32B AWQ

**Last updated: March 8, 2026**
**Machine: OMEN 45L — Windows 11 Pro, RTX 5090 32GB, AMD Ryzen, 64GB DDR5**

---

## IMPORTANT: READ THIS FIRST

The RTX 5090 uses NVIDIA's **Blackwell architecture (sm_120)**. This is a newer GPU architecture. A standard `pip install vllm` **WILL NOT WORK** because the pre-built wheels don't include Blackwell support yet. You have **two paths**:

- **PATH A (Recommended, Easier):** Use a pre-built Docker container made specifically for RTX 5090
- **PATH B (What you had before):** Run vLLM directly in WSL2 — requires building from source

**If vLLM was working before on this machine, someone already did PATH B.** So we start by trying to restart what was already there. If that fails, we go to Docker (PATH A) as the nuclear option.

---

## PHASE 1: TRY TO RESTART WHAT YOU HAD (5 minutes)

### Step 1: Open WSL

1. Press the **Windows key** on your keyboard
2. Type **Ubuntu** (or whatever your WSL distro is called)
3. Click on it to open it
4. You should see a terminal window with a blinking cursor

**What you should see:** Something like `username@OMEN:~$`

**If you don't see this:** Press Windows key, type **cmd**, open Command Prompt, then type:
```
wsl
```
Press Enter.

---

### Step 2: Check if the GPU is visible

Type this and press Enter:
```bash
nvidia-smi
```

**What you SHOULD see:** A table showing your RTX 5090 with 32GB memory, driver version, CUDA version, temperature, etc.

**If you see an ERROR or "command not found":**
- Close WSL completely
- Open **Command Prompt** (not WSL) on Windows
- Type: `wsl --update --web-download` and press Enter
- Wait for it to finish
- Type: `wsl --shutdown` and press Enter
- Wait 10 seconds
- Open WSL again
- Try `nvidia-smi` again
- If it STILL fails: Your Windows NVIDIA driver may need updating. Go to https://www.nvidia.com/drivers and download the latest driver for RTX 5090, install it, restart the computer, then try again.

**IMPORTANT:** Do NOT install NVIDIA drivers INSIDE WSL. The Windows driver is what WSL uses. Installing a Linux driver inside WSL will BREAK things.

---

### Step 3: Kill ALL old vLLM processes (zombies)

Type each of these one at a time, pressing Enter after each:

```bash
pkill -9 -f vllm
```
```bash
pkill -9 -f "python.*serve"
```
```bash
pkill -9 -f "python.*qwen"
```

These kill any stuck/zombie vLLM processes. You might see "no process found" — that is FINE. It means nothing was stuck.

Now check if port 8000 is free:
```bash
lsof -i :8000
```

**What you should see:** Nothing (blank output = port is free, which is good)

**If you see a process listed:** Look at the number in the PID column and kill it:
```bash
kill -9 <PUT_THE_PID_NUMBER_HERE>
```

If `lsof` is not found, use this instead:
```bash
ss -tlnp | grep 8000
```

---

### Step 4: Check if tmux still exists

```bash
tmux ls
```

**If you see "vllm" in the list:** The old session exists. Kill it to start fresh:
```bash
tmux kill-session -t vllm
```

**If you see "no server running":** That is fine. No old session to worry about.

---

### Step 5: Check if vLLM is installed

```bash
python3 -c "import vllm; print(vllm.__version__)"
```

**What you should see:** A version number like `0.7.4` or `0.14.1` or similar.

**If you see "ModuleNotFoundError":** vLLM is NOT installed. Skip to **PHASE 3** (Docker method).

**If you see "CUDA capability sm_120 is not compatible":** Your vLLM install doesn't support the RTX 5090. Skip to **PHASE 3** (Docker method).

---

### Step 6: Check if the model is downloaded

```bash
ls -la ~/.cache/huggingface/hub/ | grep -i qwen
```

**What you should see:** A folder with "Qwen" in the name.

If you see nothing, check other common locations:
```bash
find / -name "*.safetensors" -path "*qwen*" 2>/dev/null | head -5
```

**Write down the full path** to wherever the model files are. You will need it. The model path will look something like:
- `~/.cache/huggingface/hub/models--Qwen--Qwen2.5-32B-Instruct-AWQ/` or
- `/home/username/models/Qwen2.5-32B-Instruct-AWQ/` or
- `Qwen/Qwen2.5-32B-Instruct-AWQ` (this means it downloads from HuggingFace automatically)

---

### Step 7: Create a fresh tmux session and start vLLM

```bash
tmux new-session -s vllm
```

You are now INSIDE tmux. Now start vLLM with this command:

```bash
VLLM_FLASH_ATTN_VERSION=2 python3 -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --port 8000 \
  --host 0.0.0.0 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.85 \
  --enforce-eager \
  --trust-remote-code \
  --dtype float16 \
  --quantization awq
```

**Now WAIT.** It can take 2-5 minutes to load the model. You will see log messages scrolling by.

**What you should eventually see:** Something like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```
or
```
INFO: Application startup complete.
```

**That means it is RUNNING!** Jump to **Step 8** to verify.

---

### Step 7b: If Step 7 fails, try with LESS memory

If you see "CUDA out of memory" or "not enough KV cache", try a shorter context:

```bash
VLLM_FLASH_ATTN_VERSION=2 python3 -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --port 8000 \
  --host 0.0.0.0 \
  --max-model-len 16384 \
  --gpu-memory-utilization 0.90 \
  --enforce-eager \
  --trust-remote-code \
  --dtype float16 \
  --quantization awq
```

Changes: `max-model-len` went from 32768 to 16384, and `gpu-memory-utilization` went from 0.85 to 0.90.

If it STILL fails with OOM, go even lower:

```bash
VLLM_FLASH_ATTN_VERSION=2 python3 -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --port 8000 \
  --host 0.0.0.0 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.92 \
  --enforce-eager \
  --trust-remote-code \
  --dtype float16 \
  --quantization awq
```

---

### Step 8: Verify it is running (open a NEW terminal)

**Do NOT close the tmux window.** Instead:
- Press `Ctrl+B`, then press `D` (this detaches from tmux without closing it)
- Or open a new WSL terminal window

Then type:
```bash
curl http://localhost:8000/v1/models
```

**What you should see:** A JSON response listing the Qwen model. Something like:
```json
{"data":[{"id":"Qwen/Qwen2.5-32B-Instruct-AWQ",...}]}
```

**If you see this: YOU ARE DONE! vLLM is running!**

To test a chat completion:
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2.5-32B-Instruct-AWQ",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
```

---

## PHASE 2: COMMON ERRORS AND FIXES

### Error: "Address already in use"
```bash
# Find what is using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
# OR just use a different port
# Change --port 8000 to --port 8001 in the vllm command
# Then access it at http://localhost:8001
```

### Error: "CUDA capability sm_120 is not compatible"
Your PyTorch or vLLM doesn't support RTX 5090. You need to either:
- Build from source with PyTorch 2.9.0+cu128 (hard)
- Use Docker (easier) — go to **PHASE 3**

### Error: "CUDA out of memory" or "Cannot allocate KV cache"
Lower `--max-model-len` step by step: 32768 → 16384 → 8192 → 4096
Also try lowering `--gpu-memory-utilization` to 0.80 or 0.75

### Error: "torch.cuda.OutOfMemoryError" during startup
Add this environment variable before the command:
```bash
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512 VLLM_FLASH_ATTN_VERSION=2 python3 -m vllm.entrypoints.openai.api_server ...
```

### Error: "No module named vllm"
vLLM is not installed. Go to **PHASE 3** (Docker).

### Error: "EngineCore failed to start"
Try adding `--enforce-eager` if you don't already have it. This disables CUDA graphs which can cause issues on newer GPUs.

### Error: "Connection refused" when testing with curl
- vLLM might still be loading (wait longer — can take 5 minutes)
- Check the tmux window: `tmux attach -t vllm` and see if there are errors
- Make sure you used `--host 0.0.0.0` in the command

### Error: "FlashAttention" related errors
Make sure you have `VLLM_FLASH_ATTN_VERSION=2` at the start of the command. Flash Attention 3 does NOT work on RTX 5090 (Blackwell) yet.

### Error: Model downloading stuck or slow
If the model needs to download from HuggingFace and it seems stuck:
```bash
# Check if huggingface-cli is available
huggingface-cli download Qwen/Qwen2.5-32B-Instruct-AWQ
```

### vLLM starts but is extremely slow (4096 context only)
The old config was probably missing `--max-model-len`. Add `--max-model-len 32768` (or lower if OOM).

### WSL runs out of RAM
WSL2 by default can use up to 50% of your system RAM. With 64GB system RAM, that is 32GB for WSL. You can increase it:

1. Open **Notepad** on Windows
2. Paste this:
```
[wsl2]
memory=48GB
swap=8GB
```
3. Save as: `C:\Users\stone\.wslconfig` (make sure it is NOT `.wslconfig.txt`)
4. Open Command Prompt and run: `wsl --shutdown`
5. Restart WSL

---

## PHASE 3: NUCLEAR OPTION — DOCKER (if nothing else works)

If vLLM isn't installed, or the installed version doesn't support RTX 5090, the easiest fix is Docker. Docker gives you a pre-configured container where everything already works.

### Step 1: Make sure Docker is installed in WSL

```bash
docker --version
```

**If you see a version number:** Docker is installed, skip to Step 2.

**If "command not found":** Install Docker:
```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```
Then close and reopen WSL.

### Step 2: Make sure NVIDIA Container Toolkit is installed

```bash
nvidia-ctk --version
```

**If "command not found":**
```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Step 3: Test that Docker can see your GPU

```bash
docker run --rm --gpus all nvidia/cuda:12.8.0-base-ubuntu22.04 nvidia-smi
```

**What you should see:** The same nvidia-smi table showing your RTX 5090, but from inside Docker.

**If this fails:** The NVIDIA Container Toolkit is not set up correctly. Re-run Step 2.

### Step 4: Pull and run the vLLM-5090 container

**Option A — Use the community RTX 5090 container (RECOMMENDED):**

```bash
# Clone the project
git clone https://github.com/BoltzmannEntropy/vLLM-5090.git
cd vLLM-5090

# Build the container (takes 15-20 minutes)
docker build -t lmcache-vllm:latest --target image-build -f docker/Dockerfile .

# Run it
docker run --gpus all --rm -it \
  --shm-size=8gb --ipc=host \
  --ulimit memlock=-1 --ulimit stack=67108864 \
  --memory=48g \
  -p 8000:8000 \
  -v ~/cache:/root/.cache \
  lmcache/vllm-openai:build-latest
```

Inside the container, start vLLM:
```bash
VLLM_FLASH_ATTN_VERSION=2 vllm serve Qwen/Qwen2.5-32B-Instruct-AWQ \
  --port 8000 \
  --host 0.0.0.0 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.85 \
  --enforce-eager \
  --trust-remote-code \
  --dtype float16 \
  --quantization awq
```

**Option B — Use the NVIDIA NGC base container and build vLLM from source:**

```bash
# Start the container
docker run --gpus all --ipc=host \
  --ulimit memlock=-1 --ulimit stack=67108864 \
  -p 8000:8000 \
  -v ~/cache:/root/.cache \
  -it nvcr.io/nvidia/pytorch:25.02-py3 /bin/bash

# Inside the container:
git clone https://github.com/vllm-project/vllm.git && cd vllm
python use_existing_torch.py
pip install -r requirements/build.txt
pip install setuptools_scm
MAX_JOBS=10 python setup.py develop

# After build completes (10-30 minutes), start serving:
VLLM_FLASH_ATTN_VERSION=2 vllm serve Qwen/Qwen2.5-32B-Instruct-AWQ \
  --port 8000 \
  --host 0.0.0.0 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.85 \
  --enforce-eager \
  --trust-remote-code \
  --dtype float16 \
  --quantization awq
```

### Step 5: Verify from Windows

Open a NEW WSL terminal (outside Docker) and test:
```bash
curl http://localhost:8000/v1/models
```

Or open a web browser on Windows and go to: `http://localhost:8000/v1/models`

---

## PHASE 4: MAKING IT SURVIVE REBOOTS

Once vLLM is running (from any method above), here is how to make sure it comes back after a reboot.

### For direct WSL (non-Docker) method:

Create a startup script:
```bash
cat > ~/start-vllm.sh << 'SCRIPT'
#!/bin/bash
# Kill any old vLLM
pkill -9 -f vllm 2>/dev/null
sleep 2

# Start in tmux
tmux new-session -d -s vllm "VLLM_FLASH_ATTN_VERSION=2 python3 -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --port 8000 \
  --host 0.0.0.0 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.85 \
  --enforce-eager \
  --trust-remote-code \
  --dtype float16 \
  --quantization awq"

echo "vLLM starting in tmux session 'vllm'"
echo "To see it: tmux attach -t vllm"
echo "To check: curl http://localhost:8000/v1/models"
SCRIPT
chmod +x ~/start-vllm.sh
```

Then any time you reboot, just:
1. Open WSL
2. Type: `~/start-vllm.sh`
3. Wait 2-5 minutes
4. Test: `curl http://localhost:8000/v1/models`

---

## QUICK REFERENCE CARD

| What | Command |
|---|---|
| Open WSL | Windows key → type "Ubuntu" → click it |
| Check GPU | `nvidia-smi` |
| Kill zombie vLLM | `pkill -9 -f vllm` |
| Check port 8000 | `lsof -i :8000` |
| List tmux sessions | `tmux ls` |
| Attach to vLLM tmux | `tmux attach -t vllm` |
| Detach from tmux | `Ctrl+B` then `D` |
| Start vLLM | `~/start-vllm.sh` (after creating it above) |
| Test vLLM | `curl http://localhost:8000/v1/models` |
| Kill tmux session | `tmux kill-session -t vllm` |
| Shutdown WSL | (from Windows CMD) `wsl --shutdown` |
| Update WSL | (from Windows CMD) `wsl --update --web-download` |

---

## KEY FLAGS EXPLAINED

| Flag | What it does | Why you need it |
|---|---|---|
| `VLLM_FLASH_ATTN_VERSION=2` | Uses Flash Attention v2 | v3 does NOT work on RTX 5090 yet |
| `--model` | Which AI model to load | Points to Qwen 2.5 32B AWQ |
| `--port 8000` | What port to listen on | Stone AI connects to this port |
| `--host 0.0.0.0` | Listen on all network interfaces | Needed so Windows can reach WSL |
| `--max-model-len 32768` | Max conversation length in tokens | 32K tokens. Lower if OOM. |
| `--gpu-memory-utilization 0.85` | How much VRAM to use | 85% of 32GB. Lower if OOM. |
| `--enforce-eager` | Disable CUDA graphs | Avoids compatibility issues on Blackwell |
| `--trust-remote-code` | Allow model's custom code | Qwen needs this |
| `--dtype float16` | Math precision | Good balance of speed and quality |
| `--quantization awq` | Tell vLLM this is a quantized model | AWQ = 4-bit quantized, fits in 32GB |

---

## Sources

- [vLLM RTX 5090 Docker Project](https://github.com/BoltzmannEntropy/vLLM-5090)
- [Steps to run vLLM on RTX 5080/5090 (GitHub Issue #14452)](https://github.com/vllm-project/vllm/issues/14452)
- [vLLM on RTX 5090: Working GPU setup with torch 2.9.0 cu128](https://discuss.vllm.ai/t/vllm-on-rtx5090-working-gpu-setup-with-torch-2-9-0-cu128/1492)
- [Running Qwen3.5-35B on RTX 5090 with vLLM: Practical Guide](https://joshua8.ai/qwen35-35b-rtx-5090-vllm-practical-guide/)
- [RTX 5090 CUDA 12.8 Support Request (GitHub Issue #13306)](https://github.com/vllm-project/vllm/issues/13306)
- [vLLM Blackwell Docker (jvadura fork)](https://github.com/jvadura/vLLM-Blackwell)
- [Address Already in Use Bug (GitHub Issue #7514)](https://github.com/vllm-project/vllm/issues/7514)
- [Unable to get vLLM working with RTX 5090 (GitHub Issue #18995)](https://github.com/vllm-project/vllm/issues/18995)
- [NVIDIA CUDA on WSL User Guide](https://docs.nvidia.com/cuda/wsl-user-guide/index.html)
- [Microsoft: Enable NVIDIA CUDA on WSL2](https://learn.microsoft.com/en-us/windows/ai/directml/gpu-cuda-in-wsl)
- [RTX 5090 + WSL2 + Docker AI Stack (Medium)](https://medium.com/@genelab_999/im-finally-revealing-how-i-did-it-the-complete-rtx-5090-wsl2-docker-ai-stack-74b337815904)
- [Qwen vLLM Deployment Docs](https://qwen.readthedocs.io/en/latest/deployment/vllm.html)
