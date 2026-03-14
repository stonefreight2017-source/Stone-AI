# Palace Troubleshooting Playbook

Quick-reference. Every section: symptom, diagnosis, fix. No fluff. Act on it.

---

## vLLM Won't Start

**Symptom:** You run the vLLM launch command and it crashes immediately or hangs without producing "Uvicorn running on..." message.

**Diagnosis steps (in order):**

1. **Check VRAM availability:**
   ```bash
   nvidia-smi
   ```
   Look at "Memory-Usage". If it's already high (>5GB with nothing running), something else is using the GPU. Kill it first.

2. **Check model path exists:**
   ```bash
   ls -la /mnt/c/models/qwen3-32b-awq/
   ```
   If the directory is empty or doesn't exist, the model files are missing. Re-download or check the mount.

3. **Check port conflict:**
   ```bash
   lsof -i :8000
   ```
   If another process owns port 8000, kill it (`kill <PID>`) or use a different port.

4. **Check the vLLM environment:**
   ```bash
   /home/vllm-env/bin/python --version
   ```
   If this fails, the venv is broken. Recreate it.

5. **Check CUDA availability:**
   ```bash
   /home/vllm-env/bin/python -c "import torch; print(torch.cuda.is_available())"
   ```
   Must print `True`. If `False`, NVIDIA drivers in WSL2 are broken. Reinstall the CUDA toolkit for WSL2.

**Common causes:**
- GPU driver mismatch after Windows Update — reinstall NVIDIA drivers
- WSL2 wasn't started properly — run `wsl --shutdown` then `wsl` fresh
- Model files corrupted — re-download

---

## GPU Temperature Too High

**Symptom:** `nvidia-smi` shows GPU temp above 85C. Performance throttling may occur above 83C. Shutdown risk above 93C.

**Diagnosis:**
```bash
nvidia-smi --query-gpu=temperature.gpu,fan.speed,power.draw --format=csv
```

**Fix (in order of likelihood):**
1. **Check fan curve:** Open OMEN Gaming Hub or MSI Afterburner. Fans should ramp to 100% above 80C. If fan curve is on "quiet" mode, switch to "performance".
2. **Reduce batch size:** If running heavy concurrent requests, reduce load. Each concurrent request adds heat.
3. **Check ambient temperature:** If the room is hot, the GPU will be hot. Improve airflow or reduce room temp.
4. **Check for dust:** If fans are running but temps are still high, dust buildup is likely. Compressed air, power off first.
5. **Reduce context length:** Lower `--max-model-len` from 32768 to 16384. Less VRAM usage = less heat.

**Normal operating range:** 60-80C under load. Below 60C at idle. Above 85C = investigate immediately.

---

## Palace GUI Won't Connect

**Symptom:** Palace GUI at :7070 loads but shows "disconnected" or can't send messages to the model.

**Diagnosis (follow the chain):**

1. **Is vLLM running?**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return `{"status":"ok"}` or similar. If it fails, vLLM is down. See "vLLM Won't Start" above.

2. **Is Palace Bridge running?**
   ```bash
   curl http://localhost:7777/health
   ```
   If this fails, Palace Bridge is down. Restart it.

3. **CORS issue?**
   Open browser DevTools (F12) → Console tab. Look for red errors mentioning "CORS" or "Access-Control-Allow-Origin". If present, Palace Bridge needs CORS headers configured to allow :7070.

4. **Port forwarding broken?**
   If vLLM is in WSL2 and Palace GUI is on Windows, verify WSL2 port forwarding:
   ```bash
   # From Windows PowerShell
   curl http://localhost:8000/health
   ```
   If this fails but it works from inside WSL2, port forwarding is broken. Restart WSL2.

**Fix order:** vLLM first → Palace Bridge second → check CORS third → restart WSL2 if port forwarding is dead.

---

## Model Responses Are Slow

**Symptom:** Responses take more than 5-10 seconds to start streaming, or tokens come out at less than 10 tokens/second.

**Diagnosis:**

1. **Check VRAM pressure:**
   ```bash
   nvidia-smi
   ```
   If VRAM usage is near 32GB, the model is swapping and everything is slow. Kill other GPU processes.

2. **Check context length of current request:**
   Long prompts (10K+ tokens) take longer to process. This is normal. The first token takes longer but streaming should be fast after.

3. **Check concurrent requests:**
   ```bash
   curl http://localhost:8000/metrics 2>/dev/null | grep running
   ```
   Multiple concurrent requests share GPU compute. If 5 people are hitting the model at once, each gets ~1/5 the speed.

4. **Check GPU clock speed:**
   ```bash
   nvidia-smi --query-gpu=clocks.current.graphics --format=csv
   ```
   If clock speed is low, the GPU may be throttling due to heat or power limits.

**Fixes:**
- Kill unnecessary GPU processes
- Reduce `--max-model-len` if you don't need 32K context
- Limit concurrent requests through Palace Bridge
- Check GPU temperature (see "GPU Temperature Too High")

---

## WSL2 Eating Too Much RAM

**Symptom:** Windows is slow or swapping. Task Manager shows "Vmmem" process using huge amounts of RAM.

**Diagnosis:**
```bash
# Inside WSL2
free -h

# From Windows PowerShell
tasklist | findstr vmmem
```

**Fix:**

1. **Immediate relief:**
   ```powershell
   # From Windows (kills all WSL2 instances)
   wsl --shutdown
   ```
   Then restart WSL2 and relaunch vLLM.

2. **Long-term fix — cap WSL2 memory:**
   Create or edit `C:\Users\stone\.wslconfig`:
   ```ini
   [wsl2]
   memory=32GB
   swap=8GB
   ```
   Then `wsl --shutdown` and restart.

3. **Kill zombie processes inside WSL2:**
   ```bash
   # Inside WSL2
   ps aux | sort -k4 -rn | head -20
   ```
   Kill anything that shouldn't be running: `kill <PID>`

**Root cause:** WSL2 uses a real Linux kernel in a lightweight VM. It claims RAM from Windows and doesn't always release it. The `.wslconfig` cap is the permanent fix.

---

## Docker Container Restart Loop

**Symptom:** `docker ps` shows a container with status "Restarting" or the uptime keeps resetting.

**Diagnosis:**

1. **Check logs:**
   ```bash
   docker logs <container-name> --tail 100
   ```
   The crash reason is almost always in the last 20 lines.

2. **Check resource usage:**
   ```bash
   docker stats --no-stream
   ```
   If a container is at its memory limit, it's being OOM-killed.

3. **Check dependencies:**
   Does the container need a database, API, or network service that isn't running? Dependency failures are the #1 cause of restart loops.

**Fixes:**
- **OOM:** Increase memory limit in docker-compose.yml or reduce the container's workload
- **Missing dependency:** Start the dependency first. Check docker-compose `depends_on` is correct.
- **Crashed init process:** `docker rm -f <container-name>` then recreate with `docker compose up -d <service-name>`
- **Corrupt state:** `docker rm -f <container-name>`, delete its volume if necessary (`docker volume rm <vol>`), recreate

---

## Can't Reach Palace from Phone

**Symptom:** Phone browser can't connect to Palace GUI or Palace Bridge on the local network.

**Diagnosis:**

1. **Are you on the same network?** Phone must be on the same Wi-Fi as the OMEN's network. Guest networks and VPNs will block this.

2. **Get the OMEN's local IP:**
   ```powershell
   # From Windows
   ipconfig | findstr "IPv4"
   ```
   Look for something like `192.168.x.x`. That's what you use on the phone.

3. **Check firewall:**
   Windows Firewall blocks inbound connections by default. You need inbound rules for ports 7070 (Palace GUI) and 7777 (Palace Bridge).
   - Windows Security → Firewall → Advanced Settings → Inbound Rules
   - Add rules allowing TCP on ports 7070 and 7777

4. **Check Palace Bridge status:**
   From the OMEN: `curl http://localhost:7777/health`
   From the phone: try `http://<OMEN-IP>:7777/health` in the browser.

5. **Check that services bind to 0.0.0.0, not 127.0.0.1:**
   If a service binds to `127.0.0.1`, it only accepts connections from localhost. It must bind to `0.0.0.0` to accept LAN connections.

**Fix order:** Same network → get IP → check firewall → check service binding → check Palace Bridge health.

---

## Disk Space Low

**Symptom:** Docker won't start containers, model downloads fail, or general "no space left on device" errors.

**Diagnosis:**
```powershell
# Windows
wmic logicaldisk get size,freespace,caption
```
```bash
# WSL2
df -h
```

**Fixes (in order of impact):**

1. **Docker cleanup (biggest win):**
   ```bash
   docker system prune -a
   ```
   WARNING: Removes all stopped containers and unused images. Make sure nothing important is stopped.

2. **Log rotation:**
   Docker logs can grow unbounded. Check sizes:
   ```bash
   docker inspect --format='{{.LogPath}}' <container-name>
   ```
   Truncate if huge: `truncate -s 0 <logpath>`

3. **Temp file cleanup:**
   ```powershell
   # Windows
   del /q/f/s %TEMP%\*
   ```

4. **Model cache check:**
   HuggingFace caches models at `~/.cache/huggingface/`. If you've downloaded multiple models, old ones may still be cached.
   ```bash
   du -sh ~/.cache/huggingface/
   ```
   Delete old model caches you don't need.

5. **WSL2 disk reclaim:**
   WSL2's virtual disk grows but doesn't auto-shrink. To reclaim:
   ```powershell
   wsl --shutdown
   diskpart
   # select the WSL2 .vhdx file and compact it
   ```

---

## Think Tokens Leaking Through

**Symptom:** Model responses include `<think>...</think>` tags or raw reasoning tokens that should be filtered out.

**Diagnosis:**

1. **Check the think filter injection (Step 7 of the response pipeline).**
   The think filter should strip `<think>` blocks from streamed output before they reach the user.

2. **Check the IIFE closure:**
   The filter runs inside an Immediately Invoked Function Expression. If the closure is broken, the filter state (tracking whether we're inside a think block) resets between chunks and tokens leak.

3. **Check follow-up `streamChat` calls:**
   If a conversation has multiple turns, each `streamChat` call needs its own fresh think filter. Shared state between calls will cause leaks.

**Fix:**
- Verify the think filter is injected on every response stream, not just the first
- Verify the IIFE creates a new closure each time (not reusing state)
- Test with a prompt that triggers heavy reasoning (math problems work well)
- Check that the filter handles split chunks — a `<think>` tag might be split across two data chunks

---

## Agent Not Responding with Full Identity

**Symptom:** Agent responses come back as generic/default instead of using the agent's personality, name, and specialized knowledge.

**Diagnosis:**

1. **Check `agent-identities.json` is loaded:**
   The file must be read at startup and its contents available to the prompt builder.
   ```bash
   ls -la /path/to/agent-identities.json
   cat /path/to/agent-identities.json | python3 -m json.tool | head -20
   ```

2. **Check seed file path:**
   Each agent type references a seed file. Verify the seed file exists at the expected path and isn't empty.

3. **Check `shared-context.md`:**
   This file provides cross-agent context. If it's missing or empty, agents lose their grounding.

4. **Check the system prompt construction:**
   The agent identity must be injected into the system prompt BEFORE the user's message. If it's appended after, some models ignore it.

**Fix:**
- Verify file paths are correct (remember Windows `\` vs Unix `/` issues)
- Verify JSON is valid (no trailing commas, proper encoding)
- Verify the system prompt template includes the identity block
- Test with a direct API call to vLLM with the full system prompt to isolate whether it's a prompt issue or a routing issue
