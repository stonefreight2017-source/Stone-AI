# Palace USB Install Guide — Plug and Play

This guide walks you through installing the Palace on the OMEN. Eight sections. Numbered steps. Just follow them in order and you're golden.

---

## 1. BEFORE YOU START

1. Make sure the OMEN is powered on and you're logged in.
2. Check that Node.js is installed:
   - Right-click the Start button and pick **Terminal** (or **PowerShell**).
   - Type this and press Enter:
     ```
     node --version
     ```
   - You should see something like `v24.x.x`. If you see an error, jump to the Troubleshooting section at the bottom.
3. Plug the USB drive into the OMEN.
4. Open **File Explorer** and note what letter the USB drive got assigned (usually **D:** or **E:**). You'll need this in the next section.

---

## 2. COPY FILES TO THE OMEN

1. Open PowerShell if it isn't already open (right-click Start button, pick **Terminal**).
2. Type these two commands, pressing Enter after each one. **Replace `D:` with whatever letter your USB drive actually is.**

   ```powershell
   mkdir C:\palace -Force
   ```

   ```powershell
   Copy-Item -Path "D:\palace-usb-package\*" -Destination "C:\palace\" -Recurse -Force
   ```

3. That's it. Everything from the USB is now sitting in `C:\palace` on the OMEN.

---

## 3. RUN THE MASTER INSTALLER

1. In the same PowerShell window, type:

   ```powershell
   cd C:\palace
   node palace-master-install.js
   ```

2. The installer handles everything: patches the Palace CLI, installs tools, sets up the GUI, and creates all the directories it needs.
3. As it runs, watch the output:
   - **Green checkmarks** mean that step succeeded. You're good.
   - **Yellow warnings** are non-critical. Note them but don't panic.
   - **Red errors** need attention. Take a screenshot and report back.

---

## 4. START THE PALACE GUI

1. After the installer finishes, stay in PowerShell and type:

   ```powershell
   cd C:\palace\palace-gui
   npm install
   node server.js
   ```

2. Open **Chrome** or **Edge** and go to:

   ```
   http://localhost:7070
   ```

3. You should see the Palace interface with the agent sidebar on screen. If you do, the GUI is live.

---

## 5. START vLLM (THE AI BRAIN)

This is the local AI model that powers the agents. It runs inside WSL (the Linux layer on Windows).

1. Open a **new** PowerShell window (keep the GUI one running).
2. Type `wsl` and press Enter. You're now inside the Linux terminal.
3. Paste this whole command and press Enter:

   ```bash
   VLLM_FLASH_ATTN_VERSION=2 /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server --model /mnt/c/models/qwen3-32b-awq --quantization awq_marlin --max-model-len 32768 --port 8000
   ```

4. Wait. It takes a minute or two to load the model into the GPU.
5. When you see a line that says **"Uvicorn running on http://0.0.0.0:8000"**, the AI brain is online.
6. **Leave this window open.** Closing it kills the AI.

---

## 6. VERIFY EVERYTHING WORKS

1. Go back to the Palace GUI in your browser (`http://localhost:7070`).
2. Type this and press Enter:

   ```
   Stone what's up
   ```

3. You should get a response from Agent Stone.
4. Now try:

   ```
   Cardinal status
   ```

5. And then:

   ```
   Chaos check in
   ```

6. If all three respond, the Palace is fully operational. You're done.

---

## 7. FOR FUTURE USB UPDATES (Batch 2, 3, etc.)

Same exact process every time:

1. Plug in the USB.
2. Copy the files (Section 2).
3. Run the installer (Section 3).

That's it. The installer is **additive** — it layers new knowledge on top of what's already there. Nothing gets removed or overwritten unless it's meant to be updated.

Both USBs use identical commands. Plug either one in and follow the same steps.

---

## 8. TROUBLESHOOTING

| Problem | What to do |
|---|---|
| **"node is not recognized"** | Node.js isn't installed. Download it from [nodejs.org](https://nodejs.org) and install it. Then close and reopen PowerShell. |
| **"palace-master-install.js not found"** | Double-check your USB drive letter. Open File Explorer, see what letter the USB has, and redo the copy command from Section 2 with the right letter. |
| **vLLM won't start** | In the WSL terminal, type `nvidia-smi` and press Enter. You should see the RTX 5090 listed. If not, the GPU drivers need attention. Also make sure the model folder exists — type `ls /mnt/c/models/` and confirm `qwen3-32b-awq` is there. |
| **Palace GUI shows a blank page** | Make sure vLLM is running first (Section 5). The GUI needs the AI brain to be online before it can do anything. |
| **An agent isn't responding** | Check that `agent-identities.json` was copied correctly. In PowerShell: `dir C:\palace\seeds\` — you should see the file listed. If it's missing, redo the copy from Section 2. |
| **Something else entirely** | Screenshot the error and report it. Include which section you were on and what you typed. |
