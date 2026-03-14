# Palace Operations Manual

This is the complete operations reference for the Palace — Stone AI's local inference infrastructure running on the OMEN 45L workstation. If you're an agent running on vLLM at the OMEN, this is your ground truth.

---

## OMEN 45L Hardware Specs

| Component | Spec |
|---|---|
| GPU | NVIDIA RTX 5090 — 32GB GDDR7 |
| CPU | AMD Ryzen (high-core desktop) |
| RAM | 64GB DDR5 |
| Storage | 4TB NVMe |
| OS | Windows 11 Pro |
| Network | Wired Ethernet (primary), Wi-Fi (backup) |

**What this means for you:** 32GB VRAM is the hard ceiling. 64GB system RAM means WSL2 can be generous but must be capped. 4TB NVMe means disk pressure is rare but Docker images and model files add up.

---

## VRAM Budget

Total available: 32GB GDDR7. This is a hard physical limit. Exceeding it causes OOM crashes, not graceful degradation.

| Service | VRAM Allocation | Status |
|---|---|---|
| Text model (Qwen 2.5 32B AWQ) | 18-20GB | Always-on |
| Vision model | 5-6GB | On-demand (not yet auto-start) |
| Whisper (speech-to-text) | 2GB | On-demand |
| **Remaining headroom** | **4-7GB** | Buffer / OS overhead |

**Rules:**
- Text model runs 24/7. It is the primary workload. Never kill it to free VRAM for something else unless the founder says so.
- Vision and Whisper start on demand and should release VRAM when idle.
- If you're seeing VRAM pressure, check `nvidia-smi` first. The number that matters is "Memory-Usage" — if it's above 30GB, something is wrong.
- VRAM overflow symptoms: responses stop mid-sentence, vLLM process crashes, `nvidia-smi` shows 32GB/32GB usage, CUDA out-of-memory errors in logs.
- Recovery from VRAM overflow: kill the vLLM process, wait 10 seconds for VRAM to release, verify with `nvidia-smi` that usage dropped, then restart vLLM.

---

## Service Map

Every service, its port, and what it does.

| Service | Port | Purpose | How to Check |
|---|---|---|---|
| vLLM (text) | :8000 | Main text inference (Qwen 2.5 32B AWQ) | `curl http://localhost:8000/health` |
| vLLM (vision) | :8001 | Vision model inference (on-demand) | `curl http://localhost:8001/health` |
| Palace Bridge | :7777 | Routes requests between Palace GUI and vLLM | `curl http://localhost:7777/health` |
| Open WebUI | :3000 | Web interface for direct model interaction | Open `http://localhost:3000` in browser |
| Palace GUI | :7070 | Custom Palace interface with agent identities | Open `http://localhost:7070` in browser |

**Dependency chain:** vLLM must be running before Palace Bridge. Palace Bridge must be running before Palace GUI connects. Open WebUI is independent.

---

## WSL2 Setup

The OMEN runs Windows 11 Pro. vLLM runs inside WSL2 (Ubuntu). This is because vLLM's CUDA support works best on Linux.

**Key paths:**
- vLLM Python environment: `/home/vllm-env/`
- Model files: `/mnt/c/models/qwen3-32b-awq` (this is `C:\models\qwen3-32b-awq` mounted into WSL2)
- vLLM logs: check the terminal where vLLM was launched, or redirect to a log file

**vLLM Launch Command (copy-paste ready):**

```bash
VLLM_FLASH_ATTN_VERSION=2 /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000
```

**What each flag does:**
- `VLLM_FLASH_ATTN_VERSION=2` — Uses Flash Attention v2 for faster inference
- `--model` — Path to the quantized model weights
- `--quantization awq_marlin` — Tells vLLM the model is AWQ-quantized, use Marlin kernels for speed
- `--max-model-len 32768` — Maximum context window (32K tokens). Increasing this eats more VRAM.
- `--port 8000` — Listen on port 8000

**Starting WSL2:**
1. Open PowerShell or Windows Terminal
2. Run `wsl` to enter the Ubuntu environment
3. Run the vLLM launch command above
4. Wait for "Uvicorn running on http://0.0.0.0:8000" — that means it's ready

**WSL2 Memory Management:**
- Check if `.wslconfig` exists at `C:\Users\stone\.wslconfig`
- If WSL2 is eating too much system RAM, add or edit `.wslconfig`:
  ```
  [wsl2]
  memory=32GB
  swap=8GB
  ```
- After editing, restart WSL2: `wsl --shutdown` then `wsl`

---

## Docker Containers

Docker Desktop runs on Windows. Containers that are part of the Palace ecosystem:

**What runs:**
- MCP Playwright (browser automation for testing)
- MCP Obsidian (knowledge management bridge)
- stoneai-db (PostgreSQL 16 + pgvector on port 5432 — this is for Stone AI development, not Palace inference)

**Restart procedures:**
- Single container: `docker restart <container-name>`
- All containers: `docker compose down && docker compose up -d`
- Nuclear option (if containers won't stop): `docker kill <container-name>` then `docker rm <container-name>` then restart

**Container in a restart loop? Do this:**
1. Check logs: `docker logs <container-name> --tail 50`
2. Check resource limits: `docker stats`
3. Check dependencies: Is the container waiting for a service that isn't running?
4. If logs show OOM: increase memory limit in docker-compose or reduce other container usage

**Cleanup when disk space is tight:**
- `docker system prune -a` — removes all stopped containers, unused images, build cache
- WARNING: This deletes everything not currently running. Only do this if you're sure.

---

## Network Configuration

**Port forwarding (WSL2 to Windows):**
- WSL2 services bind to `0.0.0.0` inside the Linux environment
- Windows can access them via `localhost:<port>` — WSL2 handles the forwarding automatically in most cases
- If localhost forwarding breaks (it does sometimes after Windows updates), use the WSL2 IP instead: run `hostname -I` inside WSL2 to get it

**Firewall rules:**
- Windows Firewall must allow inbound on ports 8000, 8001, 7777, 7070, 3000
- If "can't reach Palace from phone" — the firewall is the first suspect
- Check: Windows Security → Firewall → Advanced Settings → Inbound Rules
- The OMEN's local IP must be reachable from other devices on the same network

**Localhost routing:**
- All services bind to `0.0.0.0` (all interfaces), not `127.0.0.1` (localhost only)
- This means they're accessible from other devices on the LAN, not just the OMEN itself
- Palace Bridge at :7777 is the single entry point for external access to vLLM

---

## Power Settings

The OMEN is a server. It runs 24/7.

- **Sleep:** NEVER. Disabled in Power Settings.
- **Hibernate:** NEVER. Disabled in Power Settings.
- **Display off:** After 15 minutes of idle.
- **Screensaver:** Trina screensaver activates at idle. This is cosmetic, not functional.
- **After power loss:** BIOS should be set to "restore previous state" or "power on" so the OMEN boots itself after an outage.

**If the OMEN reboots unexpectedly:**
1. vLLM will NOT auto-start. You must manually launch it in WSL2.
2. Docker Desktop may or may not auto-start depending on settings. Check `docker ps`.
3. Palace Bridge and GUI need manual restart.
4. Priority order: vLLM first → Palace Bridge second → everything else third.

---

## Backup Strategy

**What to back up:**
- Model files (`C:\models\`) — these are large (tens of GB) and painful to re-download
- Palace source code and config — the USB package itself
- Agent identity files and seed files
- `.wslconfig` and any WSL2 configuration
- Docker compose files and container configs

**What NOT to back up:**
- Docker images (re-pull them, they're in registries)
- vLLM Python environment (re-create from requirements, it's faster than restoring)
- Node modules (re-install from package.json)

**Where:**
- USB drives (the Palace USB package IS a backup)
- Cloud backup for critical config files
- Model files: keep the download URLs documented so you can re-download if needed

**How often:**
- After every significant change to Palace infrastructure
- Before any major upgrade (GPU driver, Windows update, WSL2 update)
- The USB package should be refreshed whenever new seeds or operational knowledge is added

---

## Common Failure Modes and Fixes

These are real failures from 8 deployment attempts. Every one of these has bitten us.

### 1. `const` vs `let` in ESM

**What happens:** Code uses `const` for a variable that gets reassigned later. Works in CommonJS sometimes, hard fails in ESM.
**Fix:** If a variable is reassigned anywhere, use `let`. If it's never reassigned, use `const`. When converting CJS to ESM, audit every variable declaration.

### 2. `require()` in ESM modules

**What happens:** Code uses `require()` but the file is an ES module (has `"type": "module"` in package.json or uses `.mjs` extension). Node throws `ReferenceError: require is not defined`.
**Fix:** Replace `require('x')` with `import x from 'x'`. For dynamic imports, use `await import('x')`. There is no `require()` in ESM. Period.

### 3. PowerShell quote escaping

**What happens:** Commands that work in Bash fail in PowerShell because of different quote escaping rules. Single quotes, double quotes, and backticks all behave differently.
**Fix:** Use Git Bash or WSL2 for complex commands. If you must use PowerShell, test quote escaping carefully. When in doubt, put the command in a `.ps1` script file instead of inline.

### 4. Scope mismatch in injected code

**What happens:** Code injected into a response stream or middleware can't access variables from the outer scope because it runs in a different context.
**Fix:** Pass all needed values explicitly. Don't rely on closure over outer scope variables when code is serialized/injected. Use IIFEs to create clean scope boundaries.

### 5. Path separator issues (Windows `\` vs Unix `/`)

**What happens:** Hardcoded paths with `\` break in WSL2/Linux. Paths with `/` sometimes break in Windows PowerShell.
**Fix:** Use `path.join()` or `path.resolve()` in Node.js. In shell scripts, use `/` (works everywhere including Git Bash on Windows). Never hardcode `\` in paths that might run cross-platform.

### 6. Node `--check` passing but runtime failing

**What happens:** `node --check file.js` says syntax is fine, but the file crashes at runtime. `--check` only validates syntax, not imports, not runtime errors, not missing modules.
**Fix:** Don't trust `--check` alone. Always do a real test run. Missing imports, wrong module types, and runtime errors are invisible to syntax checking.

### 7. VRAM overflow symptoms and recovery

**What happens:** vLLM process crashes, responses cut off, `nvidia-smi` shows 32GB/32GB. Could be caused by too many concurrent requests, context length too high, or multiple models loaded.
**Fix:**
1. Kill vLLM: `pkill -f vllm` (in WSL2)
2. Wait 10 seconds
3. Verify VRAM released: `nvidia-smi` should show low usage
4. Restart vLLM with the standard launch command
5. If it keeps happening: reduce `--max-model-len`, limit concurrent requests, or check if another process is using the GPU

### 8. WSL2 memory allocation issues

**What happens:** WSL2 grabs system RAM and doesn't give it back. Windows starts swapping. Everything gets slow.
**Fix:**
1. Check current usage: `free -h` inside WSL2
2. If WSL2 is using too much: `wsl --shutdown` from Windows, then restart
3. Long-term fix: Set memory limit in `C:\Users\stone\.wslconfig`
4. The `memory=32GB` setting caps WSL2 at half the system RAM, which is a good default for a 64GB machine
