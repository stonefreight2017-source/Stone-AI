# The Palace — Complete Architecture & USB Package Blueprint

## Agent Stone (Head 1) + Chaos (Head 3, #44) + Computer Wiz (#45) — Joint Deliverable
## Date: 2026-03-08

---

## 1. ARCHITECTURE DIAGRAM

```
+==========================================+
|          THE PALACE (OMEN 45L)           |
|  Win11 Pro | RTX 5090 32GB | 64GB DDR5  |
+==========================================+
|                                          |
|  +------------------------------------+  |
|  |          WSL2 (Ubuntu)             |  |
|  |                                    |  |
|  |  +------------------------------+ |  |
|  |  |  vLLM Instance #1 (port 8000)| |  |
|  |  |  Qwen 2.5 32B AWQ (TEXT)     | |  |
|  |  |  --enable-auto-tool-choice   | |  |
|  |  |  --tool-call-parser hermes   | |  |
|  |  |  ~18-20GB VRAM               | |  |
|  |  +------------------------------+ |  |
|  |                                    |  |
|  |  +------------------------------+ |  |
|  |  |  vLLM Instance #2 (port 8001)| |  |
|  |  |  Qwen2.5-VL-7B-AWQ (VISION) | |  |
|  |  |  ~5-6GB VRAM (on-demand)     | |  |
|  |  |  Sleep Mode when not in use  | |  |
|  |  +------------------------------+ |  |
|  |                                    |  |
|  |  +------------------------------+ |  |
|  |  |  faster-whisper (AUDIO STT)  | |  |
|  |  |  large-v3 model              | |  |
|  |  |  Real-time transcription     | |  |
|  |  +------------------------------+ |  |
|  |                                    |  |
|  |  +------------------------------+ |  |
|  |  |  OpenCode CLI (TERMINAL UI)  | |  |
|  |  |  Connected to vLLM #1        | |  |
|  |  |  Tool use: file/edit/bash    | |  |
|  |  +------------------------------+ |  |
|  |                                    |  |
|  |  +------------------------------+ |  |
|  |  |  Open WebUI (port 3000)      | |  |
|  |  |  Web chat + image upload     | |  |
|  |  |  Connected to both vLLMs     | |  |
|  |  +------------------------------+ |  |
|  |                                    |  |
|  |  +------------------------------+ |  |
|  |  |  Palace Bridge (port 7777)   | |  |
|  |  |  File upload from Android    | |  |
|  |  |  Camera/mic streaming        | |  |
|  |  |  Web interface for phone     | |  |
|  |  +------------------------------+ |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
+==========================================+
          |              |
     Local WiFi     USB Cable (optional)
          |              |
  +================+  +================+
  | Android Phone  |  |  scrcpy mirror |
  | (on same WiFi) |  |  (wired ctrl)  |
  +================+  +================+
  | - KDE Connect  |
  | - DroidCam     |
  | - Browser ->   |
  |   Palace Bridge|
  |   :7777        |
  +================+
```

## 2. VRAM BUDGET (RTX 5090 — 32GB GDDR7)

| Component | VRAM Usage | Notes |
|---|---|---|
| Qwen 2.5 32B AWQ (text, always on) | ~18-20 GB | Primary model, tool calling enabled |
| Qwen2.5-VL-7B-AWQ (vision, on-demand) | ~5-6 GB | Loaded via vLLM sleep mode swap |
| faster-whisper large-v3 | ~2 GB | Audio transcription |
| System/CUDA overhead | ~1-2 GB | Driver, context |
| **Total when text active** | **~21 GB** | Vision model sleeping |
| **Total when vision active** | **~26 GB** | Text model sleeping |
| **Headroom** | **6-11 GB** | Comfortable margin |

**Strategy**: vLLM Sleep Mode (Level 1) keeps the inactive model's weights in CPU RAM (64GB available). Swap takes 1-3 seconds. The text model stays active by default. Vision model wakes on-demand when images/video are sent.

## 3. COMPLETE SOFTWARE STACK

### Core AI Engine
| Software | Purpose | Install Method |
|---|---|---|
| vLLM (latest) | LLM inference server | pip in WSL2 |
| Qwen2.5-32B-Instruct-AWQ | Text/code model | HuggingFace download |
| Qwen2.5-VL-7B-Instruct-AWQ | Vision model | HuggingFace download |
| faster-whisper | Speech-to-text | pip in WSL2 |
| whisper large-v3 | STT model | Auto-download |

### User Interfaces
| Software | Purpose | Install Method |
|---|---|---|
| OpenCode CLI | Claude Code-style terminal | npm install (global) |
| Open WebUI | Web chat with image upload | Docker or pip |
| Palace Bridge | Android file/stream receiver | Python FastAPI (custom) |

### Android-to-Palace Bridge
| Software | Purpose | Install Location |
|---|---|---|
| KDE Connect | File transfer, clipboard sync | Windows Store + Play Store |
| DroidCam | Camera as webcam stream | Play Store + Windows client |
| scrcpy | Screen mirror + control | Windows (winget/choco) |
| Browser (Chrome) | Access Palace Bridge web UI | Android (already installed) |

### Infrastructure
| Software | Purpose | Install Method |
|---|---|---|
| WSL2 + Ubuntu | Linux runtime | Already installed |
| Docker Desktop | Container runtime | winget |
| NVIDIA Container Toolkit | GPU in Docker | apt in WSL2 |
| Node.js 20+ | OpenCode runtime | winget |
| Python 3.11+ | AI stack runtime | WSL2 apt |
| CUDA 12.x | GPU compute | Already with drivers |

## 4. HOW EACH COMPONENT WORKS

### A. OpenCode CLI (Claude Code Experience)
OpenCode is an open-source terminal AI coding agent. It provides:
- Beautiful TUI (Terminal User Interface) built with Bubble Tea
- File read/write/edit operations
- Bash command execution
- Code search across projects
- Vim-like editor integration
- Connects to any OpenAI-compatible API (which vLLM provides)

Configuration (`.opencode.json` in project root or `~/.config/opencode/opencode.json`):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "palace": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Palace vLLM",
      "options": {
        "baseURL": "http://localhost:8000/v1"
      },
      "models": {
        "Qwen/Qwen2.5-32B-Instruct-AWQ": {
          "name": "Qwen 2.5 32B (The Palace)",
          "contextWindow": 32768,
          "maxTokens": 8192,
          "supportsToolUse": true
        }
      }
    }
  },
  "model": {
    "default": "palace/Qwen/Qwen2.5-32B-Instruct-AWQ",
    "small": "palace/Qwen/Qwen2.5-32B-Instruct-AWQ"
  }
}
```

### B. Vision Pipeline (Images/Video/Documents)
- **Qwen2.5-VL-7B-Instruct-AWQ** served on port 8001
- Accepts images via OpenAI Vision API format
- Open WebUI connects to it for drag-and-drop image upload
- Palace Bridge sends phone photos/screenshots to the vision endpoint
- Supports: PNG, JPG, WebP, GIF, PDF (rendered to images), video frames

### C. Audio Pipeline (Speech-to-Text)
- **faster-whisper** with large-v3 model runs locally
- On RTX 5090: processes audio ~30-50x faster than real-time
- Palace Bridge captures mic stream from Android, pipes to faster-whisper
- Transcribed text is sent to the text model for processing
- Supports: WAV, MP3, M4A, OGG, FLAC, real-time mic stream

### D. Android-to-Palace Bridge (Custom)
A lightweight Python FastAPI server running on port 7777 that provides:
1. **Web Upload UI** — Phone browser visits `http://PALACE_IP:7777`
   - Drag-and-drop file upload (any type)
   - Camera capture button (takes photo, sends to vision model)
   - Mic record button (records audio, sends to whisper -> text model)
   - Live camera stream toggle (continuous frames to vision model)
   - Live mic stream toggle (continuous audio to whisper)
2. **REST API** — For programmatic uploads from KDE Connect or scripts
3. **WebRTC** — For real-time camera/mic streaming with low latency

### E. KDE Connect (Seamless File Sharing)
- Install on both Windows and Android
- Same WiFi network = auto-discover
- Share files from any Android app directly to Palace
- Clipboard sync between phone and PC
- Phone notifications on PC

### F. DroidCam (Camera as Webcam)
- Install DroidCam app on Android + DroidCam client on Windows
- Phone camera appears as a webcam device on Windows
- Palace Bridge can capture this feed for real-time vision AI analysis
- Supports WiFi and USB connections
- Up to 1080p video stream

### G. scrcpy (Screen Mirror)
- Mirror Android screen on Palace display
- Control Android from Palace keyboard/mouse
- Audio forwarding (Android 11+)
- Wireless after initial USB setup
- Low latency, high quality

## 5. LIMITATIONS & GAPS vs FULL VISION

### What Works Great
- Text/code AI assistant with full tool use (OpenCode) -- closest to Claude Code experience
- Image analysis via Qwen2.5-VL (drag-and-drop in Open WebUI or phone upload)
- Speech-to-text via faster-whisper (near real-time on RTX 5090)
- File transfer from Android via KDE Connect + Palace Bridge
- Screen mirroring via scrcpy

### Known Limitations
1. **Model Quality Gap**: Qwen 2.5 32B AWQ is strong but not Claude Sonnet-level. Tool calling works but may need prompt tuning for complex multi-step operations. OpenCode has an optimized prompt for Qwen models.

2. **Vision Model Size**: The 7B vision model is capable but the 32B version would be better. Running both 32B text + 32B vision simultaneously exceeds 32GB VRAM. The sleep-mode swap (1-3 sec) is the compromise.

3. **Real-Time Video Analysis**: Continuous frame analysis is possible but resource-intensive. Practical approach: capture frames every 1-3 seconds rather than full 30fps analysis. True real-time video understanding at high FPS requires dedicated hardware.

4. **Audio Generation**: Qwen2.5-Omni can generate speech, but the Omni model is separate from the text/vision models. Adding TTS would require a third model (like Bark or XTTS) or switching to Qwen2.5-Omni-7B as the primary model (which handles text+vision+audio but is only 7B parameters).

5. **Android App**: No custom app — uses browser + KDE Connect + DroidCam. A native app could be built later for a more seamless experience.

6. **WebRTC Complexity**: Real-time camera streaming from phone to AI requires WebRTC setup which can be finicky across networks. Falls back to periodic frame capture if WebRTC fails.

### Future Upgrades (Post-Launch)
- **Qwen3-VL** (newer, better vision model when available in AWQ)
- **Qwen2.5-Omni-7B-AWQ** as a unified model handling text+vision+audio in one
- **Custom Android app** with direct integration
- **NVIDIA Live VLM WebUI** for optimized real-time vision (pip installable)
- **Multi-GPU** if the founder adds a second GPU — run both models simultaneously

## 6. USAGE GUIDE (After Setup)

### Daily Workflow — Text/Code (Claude Code Experience)
```bash
# Open Windows Terminal / Git Bash
# Navigate to any project
cd ~/my-project

# Launch OpenCode (exact same workflow as Claude Code)
opencode
```
That's it. You're in the Claude Code-style interface. Ask questions, edit files, run commands.

### Sending Images from Phone
1. Open phone browser -> `http://192.168.X.X:7777` (Palace IP)
2. Tap "Upload Image" or "Take Photo"
3. Image is analyzed by Qwen2.5-VL, response appears on the web page
4. OR: Use KDE Connect share -> file lands in Palace inbox folder

### Voice Input from Phone
1. Open phone browser -> `http://192.168.X.X:7777`
2. Tap and hold "Record Voice"
3. Audio is transcribed by faster-whisper, text sent to Qwen for response

### Real-Time "See What I See"
1. Open DroidCam on phone
2. Palace Bridge captures the feed
3. Frames sent to vision model every 2 seconds
4. AI narrates what it sees in real-time on the web interface

### Real-Time "Hear What I Hear"
1. Open phone browser -> `http://192.168.X.X:7777`
2. Toggle "Live Mic"
3. Audio streams to Palace, whisper transcribes, AI processes continuously

### Web Chat with Images (Open WebUI)
1. Open browser on any device -> `http://192.168.X.X:3000`
2. Full ChatGPT-like interface
3. Drag and drop images for vision analysis
4. Switch between text and vision models in the UI
