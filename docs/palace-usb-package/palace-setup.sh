#!/bin/bash
###############################################################################
#  THE PALACE — One-Command Setup Script
#  Stone AI | Agent Stone + Chaos + Computer Wiz
#
#  USAGE: Plug USB into OMEN 45L, open WSL2 terminal, run:
#    bash /mnt/USB_DRIVE_LETTER/palace-setup.sh
#
#  This script installs and configures EVERYTHING:
#  - OpenCode CLI (Claude Code experience)
#  - Qwen2.5-VL-7B vision model for image/video analysis
#  - faster-whisper for speech-to-text
#  - Open WebUI for web chat with image upload
#  - Palace Bridge for Android file/stream receiving
#  - KDE Connect + scrcpy for Android integration
###############################################################################

set -euo pipefail

# ============================================================================
# CONFIGURATION — Edit these if needed
# ============================================================================
PALACE_DIR="$HOME/palace"
VLLM_TEXT_PORT=8000          # Your existing vLLM text model port
VLLM_VISION_PORT=8001        # New vision model port
WHISPER_PORT=8002             # Whisper API port
BRIDGE_PORT=7777              # Android bridge port
WEBUI_PORT=3000               # Open WebUI port
TEXT_MODEL="Qwen/Qwen2.5-32B-Instruct-AWQ"
VISION_MODEL="Qwen/Qwen2.5-VL-7B-Instruct-AWQ"
WHISPER_MODEL="large-v3"
GPU_MEMORY_TEXT=0.62          # 62% of VRAM for text model (~20GB)
GPU_MEMORY_VISION=0.20        # 20% of VRAM for vision model (~6.4GB)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
banner() {
    echo -e "\n${CYAN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║  $1$(printf '%*s' $((54 - ${#1})) '')  ║${NC}"
    echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}\n"
}

step() {
    echo -e "${GREEN}${BOLD}[PALACE]${NC} ${BOLD}$1${NC}"
}

warn() {
    echo -e "${YELLOW}${BOLD}[WARNING]${NC} $1"
}

fail() {
    echo -e "${RED}${BOLD}[FAILED]${NC} $1"
    exit 1
}

check_command() {
    if command -v "$1" &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $1 found"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1 not found"
        return 1
    fi
}

# ============================================================================
# PHASE 0: PRE-FLIGHT CHECKS
# ============================================================================
banner "THE PALACE — Setup Beginning"

echo -e "${BOLD}Pre-flight checks...${NC}"

# Check we're in WSL2
if ! grep -qi microsoft /proc/version 2>/dev/null; then
    fail "This script must be run inside WSL2. Open Ubuntu from Windows Terminal."
fi
echo -e "  ${GREEN}✓${NC} Running in WSL2"

# Check GPU is accessible
if ! nvidia-smi &>/dev/null; then
    fail "NVIDIA GPU not accessible from WSL2. Ensure NVIDIA drivers are installed on Windows."
fi
GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader | head -1)
echo -e "  ${GREEN}✓${NC} GPU detected: ${GPU_NAME} (${GPU_MEM})"

# Check CUDA
if ! nvcc --version &>/dev/null 2>&1; then
    warn "CUDA toolkit not found in WSL2 — will install"
fi

# Check internet
if ! ping -c 1 huggingface.co &>/dev/null 2>&1; then
    if ! curl -s --max-time 5 https://huggingface.co > /dev/null 2>&1; then
        fail "No internet connection. Required for model downloads."
    fi
fi
echo -e "  ${GREEN}✓${NC} Internet connection verified"

# Check available disk space (need ~50GB for models + tools)
AVAIL_GB=$(df -BG "$HOME" | tail -1 | awk '{print $4}' | tr -d 'G')
if [ "$AVAIL_GB" -lt 50 ]; then
    fail "Need at least 50GB free disk space. Available: ${AVAIL_GB}GB"
fi
echo -e "  ${GREEN}✓${NC} Disk space: ${AVAIL_GB}GB available"

echo ""

# ============================================================================
# PHASE 1: SYSTEM DEPENDENCIES
# ============================================================================
banner "Phase 1: System Dependencies"

step "Updating package lists..."
sudo apt-get update -qq

step "Installing core packages..."
sudo apt-get install -y -qq \
    python3 python3-pip python3-venv \
    git curl wget unzip \
    ffmpeg \
    build-essential \
    libsndfile1 \
    portaudio19-dev \
    nodejs npm \
    adb \
    2>/dev/null

# Upgrade Node.js if too old
NODE_VER=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ "${NODE_VER:-0}" -lt 20 ]; then
    step "Upgrading Node.js to v20+..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"

# Ensure pip is up to date
python3 -m pip install --upgrade pip --quiet 2>/dev/null

echo ""

# ============================================================================
# PHASE 2: CREATE PALACE DIRECTORY STRUCTURE
# ============================================================================
banner "Phase 2: Palace Directory Structure"

step "Creating directory structure..."
mkdir -p "$PALACE_DIR"/{models,config,logs,bridge,inbox,scripts}
mkdir -p "$PALACE_DIR"/inbox/{images,audio,video,documents}

echo -e "  ${GREEN}✓${NC} $PALACE_DIR created"

# ============================================================================
# PHASE 3: PYTHON VIRTUAL ENVIRONMENT
# ============================================================================
banner "Phase 3: Python Environment"

step "Creating Python virtual environment..."
python3 -m venv "$PALACE_DIR/venv"
source "$PALACE_DIR/venv/bin/activate"

step "Installing Python packages..."
pip install --quiet --upgrade pip setuptools wheel

# Core AI packages
pip install --quiet \
    vllm \
    faster-whisper \
    openai \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    aiofiles \
    websockets \
    pillow \
    sounddevice \
    numpy \
    httpx \
    pydantic \
    jinja2

echo -e "  ${GREEN}✓${NC} Python environment ready"

echo ""

# ============================================================================
# PHASE 4: DOWNLOAD VISION MODEL
# ============================================================================
banner "Phase 4: Vision Model Download"

# Check if the model is already cached
if python3 -c "from huggingface_hub import try_to_load_from_cache; result = try_to_load_from_cache('$VISION_MODEL', 'config.json'); assert result is not None" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Vision model already cached"
else
    step "Downloading Qwen2.5-VL-7B-Instruct-AWQ (~4.5GB)..."
    step "This will take a few minutes depending on your connection..."
    python3 -c "
from huggingface_hub import snapshot_download
snapshot_download('$VISION_MODEL', cache_dir=None)
print('Download complete!')
"
    echo -e "  ${GREEN}✓${NC} Vision model downloaded"
fi

echo ""

# ============================================================================
# PHASE 5: DOWNLOAD WHISPER MODEL
# ============================================================================
banner "Phase 5: Whisper Model Download"

step "Pre-downloading faster-whisper large-v3 model..."
python3 -c "
from faster_whisper import WhisperModel
print('Downloading whisper $WHISPER_MODEL model...')
model = WhisperModel('$WHISPER_MODEL', device='cuda', compute_type='float16')
print('Model ready!')
del model
"
echo -e "  ${GREEN}✓${NC} Whisper model downloaded"

echo ""

# ============================================================================
# PHASE 6: INSTALL OPENCODE CLI
# ============================================================================
banner "Phase 6: OpenCode CLI"

step "Installing OpenCode..."
if command -v opencode &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} OpenCode already installed"
else
    npm install -g opencode 2>/dev/null || sudo npm install -g opencode
    echo -e "  ${GREEN}✓${NC} OpenCode installed"
fi

# Create global OpenCode config
step "Configuring OpenCode for Palace vLLM..."
mkdir -p "$HOME/.config/opencode"
cat > "$HOME/.config/opencode/opencode.json" << 'OPENCODE_CONFIG'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "palace-text": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Palace Text (Qwen 2.5 32B)",
      "options": {
        "baseURL": "http://localhost:8000/v1"
      },
      "models": {
        "Qwen/Qwen2.5-32B-Instruct-AWQ": {
          "name": "Qwen 2.5 32B AWQ (Palace)",
          "contextWindow": 32768,
          "maxTokens": 8192,
          "supportsToolUse": true
        }
      }
    },
    "palace-vision": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Palace Vision (Qwen2.5-VL-7B)",
      "options": {
        "baseURL": "http://localhost:8001/v1"
      },
      "models": {
        "Qwen/Qwen2.5-VL-7B-Instruct-AWQ": {
          "name": "Qwen2.5 VL 7B AWQ (Vision)",
          "contextWindow": 32768,
          "maxTokens": 4096
        }
      }
    }
  },
  "model": {
    "default": "palace-text/Qwen/Qwen2.5-32B-Instruct-AWQ",
    "small": "palace-text/Qwen/Qwen2.5-32B-Instruct-AWQ"
  }
}
OPENCODE_CONFIG

echo -e "  ${GREEN}✓${NC} OpenCode configured"

echo ""

# ============================================================================
# PHASE 7: PALACE BRIDGE (Android File/Stream Receiver)
# ============================================================================
banner "Phase 7: Palace Bridge Server"

step "Creating Palace Bridge server..."

cat > "$PALACE_DIR/bridge/server.py" << 'BRIDGE_SERVER'
"""
Palace Bridge — Android-to-Palace file and stream receiver.
Runs on port 7777. Access from phone browser at http://PALACE_IP:7777
"""
import asyncio
import base64
import io
import json
import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiofiles
import httpx
import numpy as np
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Configuration
INBOX_DIR = Path(os.environ.get("PALACE_INBOX", os.path.expanduser("~/palace/inbox")))
VLLM_TEXT_URL = os.environ.get("VLLM_TEXT_URL", "http://localhost:8000/v1")
VLLM_VISION_URL = os.environ.get("VLLM_VISION_URL", "http://localhost:8001/v1")
WHISPER_URL = os.environ.get("WHISPER_URL", "http://localhost:8002")
TEXT_MODEL = os.environ.get("TEXT_MODEL", "Qwen/Qwen2.5-32B-Instruct-AWQ")
VISION_MODEL = os.environ.get("VISION_MODEL", "Qwen/Qwen2.5-VL-7B-Instruct-AWQ")

app = FastAPI(title="Palace Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure inbox dirs exist
for subdir in ["images", "audio", "video", "documents"]:
    (INBOX_DIR / subdir).mkdir(parents=True, exist_ok=True)


# ─── Web UI ─────────────────────────────────────────────────────────────────
MOBILE_UI = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Palace Bridge</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: #0a0a0f;
    color: #e0e0e0;
    min-height: 100vh;
    padding: 16px;
  }
  .header {
    text-align: center;
    padding: 20px 0;
    border-bottom: 1px solid #1a1a2e;
    margin-bottom: 20px;
  }
  .header h1 {
    font-size: 24px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .header p { color: #888; font-size: 14px; margin-top: 4px; }
  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
    font-size: 13px;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #4ade80;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  .card {
    background: #12121a;
    border: 1px solid #1a1a2e;
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .card:hover, .card:active {
    border-color: #667eea;
    transform: scale(0.98);
  }
  .card.full { grid-column: 1 / -1; }
  .card .icon { font-size: 32px; margin-bottom: 8px; }
  .card .label { font-size: 14px; font-weight: 600; }
  .card .sublabel { font-size: 11px; color: #666; margin-top: 4px; }
  .card.recording {
    border-color: #ef4444;
    background: #1a0a0a;
  }
  .card.streaming {
    border-color: #4ade80;
    background: #0a1a0a;
  }
  .response-area {
    background: #12121a;
    border: 1px solid #1a1a2e;
    border-radius: 16px;
    padding: 16px;
    margin-top: 12px;
    min-height: 100px;
    max-height: 60vh;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .response-area .thinking {
    color: #667eea;
    font-style: italic;
  }
  .response-area .ai-response { color: #e0e0e0; }
  .response-area .error { color: #ef4444; }
  input[type="file"] { display: none; }
  .prompt-input {
    width: 100%;
    background: #12121a;
    border: 1px solid #1a1a2e;
    border-radius: 12px;
    color: #e0e0e0;
    padding: 12px 16px;
    font-size: 14px;
    margin-top: 12px;
    outline: none;
  }
  .prompt-input:focus { border-color: #667eea; }
</style>
</head>
<body>

<div class="header">
  <h1>THE PALACE</h1>
  <p>Bridge to your AI</p>
  <div class="status">
    <div class="status-dot"></div>
    <span id="statusText">Connected</span>
  </div>
</div>

<input type="text" class="prompt-input" id="promptInput"
  placeholder="Optional: Add context or question..." />

<div class="grid">
  <div class="card" onclick="uploadImage()">
    <div class="icon">📷</div>
    <div class="label">Send Image</div>
    <div class="sublabel">Photo, Screenshot, Document</div>
  </div>

  <div class="card" onclick="takePhoto()">
    <div class="icon">📸</div>
    <div class="label">Take Photo</div>
    <div class="sublabel">Camera capture</div>
  </div>

  <div class="card" id="micCard" onclick="toggleMicRecording()">
    <div class="icon">🎤</div>
    <div class="label">Voice Input</div>
    <div class="sublabel">Tap to record</div>
  </div>

  <div class="card" onclick="uploadFile()">
    <div class="icon">📄</div>
    <div class="label">Send File</div>
    <div class="sublabel">Any file type</div>
  </div>

  <div class="card full" id="liveCard" onclick="toggleLiveCamera()">
    <div class="icon">👁️</div>
    <div class="label">Live Vision</div>
    <div class="sublabel">Stream camera to AI (2 sec intervals)</div>
  </div>

  <div class="card full" id="liveMicCard" onclick="toggleLiveMic()">
    <div class="icon">👂</div>
    <div class="label">Live Listen</div>
    <div class="sublabel">Stream mic to AI continuously</div>
  </div>
</div>

<div class="response-area" id="responseArea">
  <span class="thinking">Waiting for input...</span>
</div>

<!-- Hidden file inputs -->
<input type="file" id="imageInput" accept="image/*" onchange="handleImageUpload(this)" />
<input type="file" id="cameraInput" accept="image/*" capture="environment" onchange="handleImageUpload(this)" />
<input type="file" id="fileInput" accept="*/*" onchange="handleFileUpload(this)" />

<!-- Hidden video element for live camera -->
<video id="liveVideo" style="display:none" autoplay playsinline></video>
<canvas id="liveCanvas" style="display:none"></canvas>

<script>
const API = window.location.origin;
const responseArea = document.getElementById('responseArea');
let mediaRecorder = null;
let audioChunks = [];
let isRecordingMic = false;
let isLiveCamera = false;
let isLiveMic = false;
let liveInterval = null;
let liveMicStream = null;

function getPrompt() {
  return document.getElementById('promptInput').value || '';
}

function setResponse(text, cls = 'ai-response') {
  responseArea.innerHTML = '<span class="' + cls + '">' + text + '</span>';
}

function addResponse(text, cls = 'ai-response') {
  responseArea.innerHTML += '<br><span class="' + cls + '">' + text + '</span>';
  responseArea.scrollTop = responseArea.scrollHeight;
}

// ─── Image Upload ─────────────────────────────────
function uploadImage() { document.getElementById('imageInput').click(); }
function takePhoto() { document.getElementById('cameraInput').click(); }

async function handleImageUpload(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  setResponse('Sending image to Palace...', 'thinking');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('prompt', getPrompt() || 'Describe this image in detail. What do you see?');

  try {
    const resp = await fetch(API + '/api/vision', { method: 'POST', body: formData });
    const data = await resp.json();
    setResponse(data.response || data.error || 'No response');
  } catch (e) {
    setResponse('Error: ' + e.message, 'error');
  }
  input.value = '';
}

// ─── File Upload ──────────────────────────────────
function uploadFile() { document.getElementById('fileInput').click(); }

async function handleFileUpload(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  setResponse('Uploading ' + file.name + '...', 'thinking');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('prompt', getPrompt());

  try {
    const resp = await fetch(API + '/api/upload', { method: 'POST', body: formData });
    const data = await resp.json();
    setResponse(data.message || data.response || 'File received');
  } catch (e) {
    setResponse('Error: ' + e.message, 'error');
  }
  input.value = '';
}

// ─── Voice Recording ──────────────────────────────
async function toggleMicRecording() {
  const card = document.getElementById('micCard');

  if (isRecordingMic) {
    // Stop recording
    isRecordingMic = false;
    card.classList.remove('recording');
    card.querySelector('.label').textContent = 'Voice Input';
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    return;
  }

  // Start recording
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => { audioChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      setResponse('Transcribing audio...', 'thinking');

      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      formData.append('prompt', getPrompt());

      try {
        const resp = await fetch(API + '/api/audio', { method: 'POST', body: formData });
        const data = await resp.json();
        let output = '';
        if (data.transcription) output += 'You said: "' + data.transcription + '"\n\n';
        if (data.response) output += 'AI: ' + data.response;
        setResponse(output || 'No response');
      } catch (e) {
        setResponse('Error: ' + e.message, 'error');
      }
    };

    mediaRecorder.start();
    isRecordingMic = true;
    card.classList.add('recording');
    card.querySelector('.label').textContent = 'Recording... Tap to stop';
    setResponse('Recording audio...', 'thinking');
  } catch (e) {
    setResponse('Mic access denied: ' + e.message, 'error');
  }
}

// ─── Live Camera ──────────────────────────────────
async function toggleLiveCamera() {
  const card = document.getElementById('liveCard');

  if (isLiveCamera) {
    isLiveCamera = false;
    card.classList.remove('streaming');
    card.querySelector('.label').textContent = 'Live Vision';
    if (liveInterval) clearInterval(liveInterval);
    const video = document.getElementById('liveVideo');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('liveVideo');
    video.srcObject = stream;
    await video.play();

    isLiveCamera = true;
    card.classList.add('streaming');
    card.querySelector('.label').textContent = 'Live Vision ON — Tap to stop';
    setResponse('Live vision active. Sending frames every 2 seconds...', 'thinking');

    const canvas = document.getElementById('liveCanvas');
    const ctx = canvas.getContext('2d');

    liveInterval = setInterval(async () => {
      if (!isLiveCamera) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

      try {
        const resp = await fetch(API + '/api/vision-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: dataUrl,
            prompt: getPrompt() || 'What do you see? Describe any changes or notable elements.'
          })
        });
        const data = await resp.json();
        if (data.response) {
          addResponse('[' + new Date().toLocaleTimeString() + '] ' + data.response);
        }
      } catch (e) {
        // Silent fail for live frames — don't spam errors
      }
    }, 2000);
  } catch (e) {
    setResponse('Camera access denied: ' + e.message, 'error');
  }
}

// ─── Live Mic ─────────────────────────────────────
async function toggleLiveMic() {
  const card = document.getElementById('liveMicCard');

  if (isLiveMic) {
    isLiveMic = false;
    card.classList.remove('streaming');
    card.querySelector('.label').textContent = 'Live Listen';
    if (liveMicStream) {
      liveMicStream.getTracks().forEach(t => t.stop());
      liveMicStream = null;
    }
    return;
  }

  try {
    liveMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    isLiveMic = true;
    card.classList.add('streaming');
    card.querySelector('.label').textContent = 'Listening... Tap to stop';
    setResponse('Live listening active. Recording 10-second chunks...', 'thinking');

    recordChunk();
  } catch (e) {
    setResponse('Mic access denied: ' + e.message, 'error');
  }
}

function recordChunk() {
  if (!isLiveMic || !liveMicStream) return;

  const recorder = new MediaRecorder(liveMicStream);
  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    if (blob.size > 1000) { // Skip near-empty chunks
      const formData = new FormData();
      formData.append('file', blob, 'live_chunk.webm');
      formData.append('prompt', getPrompt());
      try {
        const resp = await fetch(API + '/api/audio', { method: 'POST', body: formData });
        const data = await resp.json();
        if (data.transcription && data.transcription.trim()) {
          addResponse('[' + new Date().toLocaleTimeString() + '] You: "' + data.transcription + '"');
          if (data.response) addResponse('AI: ' + data.response);
        }
      } catch (e) { /* silent */ }
    }
    // Record next chunk
    if (isLiveMic) setTimeout(recordChunk, 100);
  };
  recorder.start();
  setTimeout(() => {
    if (recorder.state !== 'inactive') recorder.stop();
  }, 10000); // 10 second chunks
}

// Check Palace status on load
fetch(API + '/api/status').then(r => r.json()).then(d => {
  document.getElementById('statusText').textContent =
    'Connected — ' + (d.models_loaded || 0) + ' models ready';
}).catch(() => {
  document.getElementById('statusText').textContent = 'Connecting...';
  document.querySelector('.status-dot').style.background = '#fbbf24';
});
</script>

</body>
</html>
"""


# ─── API Endpoints ──────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def root():
    return MOBILE_UI


@app.get("/api/status")
async def status():
    """Health check and status"""
    models = 0
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{VLLM_TEXT_URL}/models")
            if r.status_code == 200:
                models += 1
    except:
        pass
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{VLLM_VISION_URL}/models")
            if r.status_code == 200:
                models += 1
    except:
        pass
    return {"status": "ok", "models_loaded": models, "timestamp": datetime.now().isoformat()}


@app.post("/api/vision")
async def vision_analyze(file: UploadFile = File(...), prompt: str = Form("Describe this image in detail.")):
    """Analyze an uploaded image with the vision model"""
    content = await file.read()
    b64 = base64.b64encode(content).decode()
    ext = file.filename.split(".")[-1].lower() if file.filename else "jpeg"
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "gif": "image/gif", "webp": "image/webp"}.get(ext, "image/jpeg")

    # Save to inbox
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"
    async with aiofiles.open(INBOX_DIR / "images" / filename, "wb") as f:
        await f.write(content)

    # Send to vision model
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(f"{VLLM_VISION_URL}/chat/completions", json={
                "model": VISION_MODEL,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
                    ]
                }],
                "max_tokens": 2048,
                "temperature": 0.3
            })
            data = resp.json()
            answer = data.get("choices", [{}])[0].get("message", {}).get("content", "No response from vision model")
            return {"response": answer, "saved_as": filename}
    except Exception as e:
        # Fallback: describe via text model
        return {"response": f"Vision model unavailable ({str(e)}). Image saved as {filename}. "
                           f"Start the vision model with: palace vision-start", "saved_as": filename}


@app.post("/api/vision-frame")
async def vision_frame(request: Request):
    """Analyze a live camera frame (base64 data URL)"""
    body = await request.json()
    image_data = body.get("image", "")
    prompt = body.get("prompt", "What do you see?")

    if not image_data:
        return {"error": "No image data"}

    # Extract base64 from data URL
    if "base64," in image_data:
        b64 = image_data.split("base64,")[1]
        mime = image_data.split(";")[0].split(":")[1] if ":" in image_data else "image/jpeg"
    else:
        b64 = image_data
        mime = "image/jpeg"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{VLLM_VISION_URL}/chat/completions", json={
                "model": VISION_MODEL,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
                    ]
                }],
                "max_tokens": 512,
                "temperature": 0.3
            })
            data = resp.json()
            answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return {"response": answer}
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/audio")
async def audio_transcribe(file: UploadFile = File(...), prompt: str = Form("")):
    """Transcribe audio and optionally get AI response"""
    content = await file.read()

    # Save to inbox
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.webm"
    filepath = INBOX_DIR / "audio" / filename
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    # Transcribe with whisper
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{WHISPER_URL}/transcribe", content=content,
                                     headers={"Content-Type": "audio/webm"})
            transcription = resp.json().get("text", "")
    except:
        # Fallback: use local faster-whisper directly
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            from faster_whisper import WhisperModel
            model = WhisperModel("large-v3", device="cuda", compute_type="float16")
            segments, _ = model.transcribe(tmp_path)
            transcription = " ".join(s.text for s in segments)
            os.unlink(tmp_path)
        except Exception as e:
            return {"error": f"Transcription failed: {str(e)}", "saved_as": filename}

    if not transcription.strip():
        return {"transcription": "", "response": "", "saved_as": filename}

    # Get AI response to the transcription
    full_prompt = transcription
    if prompt:
        full_prompt = f"Context: {prompt}\n\nUser said: {transcription}"

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(f"{VLLM_TEXT_URL}/chat/completions", json={
                "model": TEXT_MODEL,
                "messages": [{"role": "user", "content": full_prompt}],
                "max_tokens": 2048,
                "temperature": 0.7
            })
            data = resp.json()
            answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    except:
        answer = "(Text model unavailable — transcription only)"

    return {"transcription": transcription, "response": answer, "saved_as": filename}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), prompt: str = Form("")):
    """Upload any file to the Palace inbox"""
    content = await file.read()
    ext = file.filename.split(".")[-1].lower() if file.filename else "bin"

    # Route to correct inbox subfolder
    image_exts = {"png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"}
    audio_exts = {"mp3", "wav", "m4a", "ogg", "flac", "webm", "aac"}
    video_exts = {"mp4", "mkv", "avi", "mov", "webm"}

    if ext in image_exts:
        subdir = "images"
    elif ext in audio_exts:
        subdir = "audio"
    elif ext in video_exts:
        subdir = "video"
    else:
        subdir = "documents"

    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename or uuid.uuid4().hex[:8]}"
    filepath = INBOX_DIR / subdir / filename
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    # If it's an image, auto-analyze with vision
    if ext in image_exts:
        return await vision_analyze(file=file, prompt=prompt or "Describe this image.")

    return {
        "message": f"File saved to {subdir}/{filename} ({len(content)} bytes)",
        "path": str(filepath),
        "type": subdir
    }


if __name__ == "__main__":
    import uvicorn
    host = "0.0.0.0"
    port = int(os.environ.get("BRIDGE_PORT", 7777))
    print(f"\n  Palace Bridge starting on http://{host}:{port}")
    print(f"  Access from phone: http://YOUR_PALACE_IP:{port}\n")
    uvicorn.run(app, host=host, port=port, log_level="info")
BRIDGE_SERVER

echo -e "  ${GREEN}✓${NC} Palace Bridge server created"

echo ""

# ============================================================================
# PHASE 8: WHISPER API SERVER
# ============================================================================
banner "Phase 8: Whisper API Server"

step "Creating Whisper transcription server..."

cat > "$PALACE_DIR/bridge/whisper_server.py" << 'WHISPER_SERVER'
"""
Palace Whisper Server — Local speech-to-text API.
Uses faster-whisper with GPU acceleration.
"""
import io
import os
import tempfile
import time

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

app = FastAPI(title="Palace Whisper", version="1.0.0")

# Load model once at startup
print("Loading faster-whisper large-v3 model on GPU...")
model = WhisperModel(
    os.environ.get("WHISPER_MODEL", "large-v3"),
    device="cuda",
    compute_type="float16"
)
print("Whisper model ready!")


@app.get("/health")
async def health():
    return {"status": "ok", "model": "large-v3", "device": "cuda"}


@app.post("/transcribe")
async def transcribe(request: Request):
    """Transcribe audio from raw bytes"""
    content = await request.body()
    if not content:
        return JSONResponse({"error": "No audio data"}, status_code=400)

    # Write to temp file (faster-whisper needs a file path)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        start = time.time()
        segments, info = model.transcribe(
            tmp_path,
            beam_size=5,
            language="en",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )
        text = " ".join(segment.text.strip() for segment in segments)
        elapsed = time.time() - start

        return {
            "text": text,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration,
            "processing_time": round(elapsed, 2)
        }
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("WHISPER_PORT", 8002))
    print(f"\n  Palace Whisper starting on http://0.0.0.0:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
WHISPER_SERVER

echo -e "  ${GREEN}✓${NC} Whisper server created"

echo ""

# ============================================================================
# PHASE 9: MANAGEMENT SCRIPTS
# ============================================================================
banner "Phase 9: Management Scripts"

step "Creating Palace management commands..."

# ─── Main launcher ───
cat > "$PALACE_DIR/scripts/palace-start.sh" << 'PALACE_START'
#!/bin/bash
# THE PALACE — Start All Services
set -euo pipefail

PALACE_DIR="$HOME/palace"
source "$PALACE_DIR/venv/bin/activate"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║       THE PALACE — Starting Up        ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Get Palace IP for phone access
PALACE_IP=$(hostname -I | awk '{print $1}')

# Check if text vLLM is already running
if curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Text model (vLLM :8000) already running"
else
    echo -e "  ${RED}✗${NC} Text model not running on :8000"
    echo -e "    Start it with: ${BOLD}palace text-start${NC}"
fi

# Start Vision vLLM (background)
if curl -s http://localhost:8001/v1/models > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Vision model (vLLM :8001) already running"
else
    echo -e "  Starting vision model on :8001..."
    nohup vllm serve Qwen/Qwen2.5-VL-7B-Instruct-AWQ \
        --port 8001 \
        --gpu-memory-utilization 0.20 \
        --max-model-len 4096 \
        --dtype auto \
        --trust-remote-code \
        > "$PALACE_DIR/logs/vllm-vision.log" 2>&1 &
    echo $! > "$PALACE_DIR/logs/vllm-vision.pid"
    echo -e "  ${GREEN}✓${NC} Vision model starting (PID: $(cat $PALACE_DIR/logs/vllm-vision.pid))"
fi

# Start Whisper server (background)
if curl -s http://localhost:8002/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Whisper server (:8002) already running"
else
    echo -e "  Starting Whisper server on :8002..."
    nohup python3 "$PALACE_DIR/bridge/whisper_server.py" \
        > "$PALACE_DIR/logs/whisper.log" 2>&1 &
    echo $! > "$PALACE_DIR/logs/whisper.pid"
    echo -e "  ${GREEN}✓${NC} Whisper server starting (PID: $(cat $PALACE_DIR/logs/whisper.pid))"
fi

# Start Palace Bridge (background)
if curl -s http://localhost:7777/api/status > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Palace Bridge (:7777) already running"
else
    echo -e "  Starting Palace Bridge on :7777..."
    nohup python3 "$PALACE_DIR/bridge/server.py" \
        > "$PALACE_DIR/logs/bridge.log" 2>&1 &
    echo $! > "$PALACE_DIR/logs/bridge.pid"
    echo -e "  ${GREEN}✓${NC} Palace Bridge starting (PID: $(cat $PALACE_DIR/logs/bridge.pid))"
fi

echo ""
echo -e "${CYAN}${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}  Palace Services:${NC}"
echo -e "    OpenCode CLI:    ${GREEN}opencode${NC} (run in any project dir)"
echo -e "    Palace Bridge:   ${GREEN}http://${PALACE_IP}:7777${NC} (phone browser)"
echo -e "    Text Model API:  ${GREEN}http://localhost:8000${NC}"
echo -e "    Vision Model API:${GREEN}http://localhost:8001${NC}"
echo -e "    Whisper API:     ${GREEN}http://localhost:8002${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}From your Android phone:${NC}"
echo -e "  Open Chrome -> ${GREEN}http://${PALACE_IP}:7777${NC}"
echo ""
PALACE_START
chmod +x "$PALACE_DIR/scripts/palace-start.sh"

# ─── Stop all ───
cat > "$PALACE_DIR/scripts/palace-stop.sh" << 'PALACE_STOP'
#!/bin/bash
# THE PALACE — Stop All Services (except text vLLM)
PALACE_DIR="$HOME/palace"

echo "Stopping Palace services..."

for service in vllm-vision whisper bridge; do
    pidfile="$PALACE_DIR/logs/${service}.pid"
    if [ -f "$pidfile" ]; then
        pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "  Stopped $service (PID: $pid)"
        fi
        rm -f "$pidfile"
    fi
done

echo "Done. (Text vLLM on :8000 left running)"
PALACE_STOP
chmod +x "$PALACE_DIR/scripts/palace-stop.sh"

# ─── Status check ───
cat > "$PALACE_DIR/scripts/palace-status.sh" << 'PALACE_STATUS'
#!/bin/bash
# THE PALACE — Check all service status
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}Palace Service Status:${NC}\n"

check() {
    if curl -s --max-time 2 "$2" > /dev/null 2>&1; then
        echo -e "  ${GREEN}● RUNNING${NC}  $1  ($2)"
    else
        echo -e "  ${RED}● STOPPED${NC}  $1  ($2)"
    fi
}

check "Text Model (Qwen 32B)"    "http://localhost:8000/v1/models"
check "Vision Model (Qwen VL 7B)" "http://localhost:8001/v1/models"
check "Whisper (Speech-to-Text)"   "http://localhost:8002/health"
check "Palace Bridge (Android)"    "http://localhost:7777/api/status"

PALACE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo -e "\n  Phone access: ${BOLD}http://${PALACE_IP}:7777${NC}\n"
PALACE_STATUS
chmod +x "$PALACE_DIR/scripts/palace-status.sh"

# ─── Vision model start (separate, for on-demand use) ───
cat > "$PALACE_DIR/scripts/palace-vision-start.sh" << 'VISION_START'
#!/bin/bash
source "$HOME/palace/venv/bin/activate"
echo "Starting Qwen2.5-VL-7B vision model on port 8001..."
vllm serve Qwen/Qwen2.5-VL-7B-Instruct-AWQ \
    --port 8001 \
    --gpu-memory-utilization 0.20 \
    --max-model-len 4096 \
    --dtype auto \
    --trust-remote-code
VISION_START
chmod +x "$PALACE_DIR/scripts/palace-vision-start.sh"

# ─── Symlink commands to PATH ───
step "Creating command shortcuts..."
sudo ln -sf "$PALACE_DIR/scripts/palace-start.sh" /usr/local/bin/palace
sudo ln -sf "$PALACE_DIR/scripts/palace-start.sh" /usr/local/bin/palace-start
sudo ln -sf "$PALACE_DIR/scripts/palace-stop.sh" /usr/local/bin/palace-stop
sudo ln -sf "$PALACE_DIR/scripts/palace-status.sh" /usr/local/bin/palace-status
sudo ln -sf "$PALACE_DIR/scripts/palace-vision-start.sh" /usr/local/bin/palace-vision-start

echo -e "  ${GREEN}✓${NC} Commands available: palace, palace-start, palace-stop, palace-status"

echo ""

# ============================================================================
# PHASE 10: INSTALL OPEN WEBUI
# ============================================================================
banner "Phase 10: Open WebUI"

step "Installing Open WebUI..."

if command -v open-webui &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Open WebUI already installed"
else
    pip install --quiet open-webui
    echo -e "  ${GREEN}✓${NC} Open WebUI installed"
fi

# Create Open WebUI start script
cat > "$PALACE_DIR/scripts/palace-webui.sh" << 'WEBUI_START'
#!/bin/bash
source "$HOME/palace/venv/bin/activate"
export OPENAI_API_BASE_URLS="http://localhost:8000/v1;http://localhost:8001/v1"
export OPENAI_API_KEYS="not-needed;not-needed"
echo ""
echo "  Open WebUI starting on http://0.0.0.0:3000"
echo "  Access from any device: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
open-webui serve --host 0.0.0.0 --port 3000
WEBUI_START
chmod +x "$PALACE_DIR/scripts/palace-webui.sh"
sudo ln -sf "$PALACE_DIR/scripts/palace-webui.sh" /usr/local/bin/palace-webui

echo -e "  ${GREEN}✓${NC} Open WebUI configured (run: palace-webui)"

echo ""

# ============================================================================
# PHASE 11: WINDOWS-SIDE SETUP SCRIPT
# ============================================================================
banner "Phase 11: Windows-Side Installers"

step "Creating Windows setup script..."

cat > "$PALACE_DIR/scripts/windows-setup.ps1" << 'WIN_SETUP'
# THE PALACE — Windows-Side Setup
# Run this in PowerShell (Admin) on the OMEN

Write-Host ""
Write-Host "  THE PALACE — Windows Setup" -ForegroundColor Cyan
Write-Host "  Installing Windows-side tools..." -ForegroundColor Gray
Write-Host ""

# Install KDE Connect
Write-Host "  [1/3] Installing KDE Connect..." -ForegroundColor Yellow
try {
    winget install --id KDE.KDEConnect --accept-package-agreements --accept-source-agreements -h
    Write-Host "  KDE Connect installed" -ForegroundColor Green
} catch {
    Write-Host "  KDE Connect: Install from Microsoft Store manually" -ForegroundColor Red
}

# Install scrcpy
Write-Host "  [2/3] Installing scrcpy..." -ForegroundColor Yellow
try {
    winget install --id Genymobile.scrcpy --accept-package-agreements --accept-source-agreements -h
    Write-Host "  scrcpy installed" -ForegroundColor Green
} catch {
    Write-Host "  scrcpy: Download from https://github.com/Genymobile/scrcpy/releases" -ForegroundColor Red
}

# Install DroidCam Client
Write-Host "  [3/3] DroidCam..." -ForegroundColor Yellow
Write-Host "  Download DroidCam Client from: https://droidcam.app/" -ForegroundColor Yellow
Write-Host "  Install DroidCam app on your Android from Play Store" -ForegroundColor Yellow

Write-Host ""
Write-Host "  Windows setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  ANDROID APPS TO INSTALL:" -ForegroundColor Cyan
Write-Host "    1. KDE Connect    - Play Store" -ForegroundColor White
Write-Host "    2. DroidCam       - Play Store" -ForegroundColor White
Write-Host "    3. Chrome browser - Already installed" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEP: Open WSL2 and run 'palace-start'" -ForegroundColor Cyan
Write-Host ""
WIN_SETUP

echo -e "  ${GREEN}✓${NC} Windows setup script created"

echo ""

# ============================================================================
# PHASE 12: CREATE USB-READY PACKAGE
# ============================================================================
banner "Phase 12: USB Package"

step "Creating USB-ready launcher..."

# Main USB launcher that handles everything
cat > "$PALACE_DIR/PALACE-INSTALL.sh" << 'USB_LAUNCHER'
#!/bin/bash
###############################################################################
#  THE PALACE — USB PLUG-AND-PLAY INSTALLER
#
#  INSTRUCTIONS:
#  1. Plug this USB into the OMEN 45L
#  2. Open Windows Terminal -> Ubuntu (WSL2)
#  3. Run: bash /mnt/DRIVE_LETTER/PALACE-INSTALL.sh
#     (Replace DRIVE_LETTER with your USB drive letter, e.g., d, e, f)
#
#  That's it. Everything else is automatic.
###############################################################################

echo ""
echo "  ╔═══════════════════════════════════════════════════╗"
echo "  ║                                                   ║"
echo "  ║            THE PALACE — INSTALLER                 ║"
echo "  ║                                                   ║"
echo "  ║   Stone AI | Agent Stone + Chaos + Computer Wiz   ║"
echo "  ║                                                   ║"
echo "  ╚═══════════════════════════════════════════════════╝"
echo ""

# Detect where this script is running from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if palace-setup.sh exists alongside this file
if [ -f "$SCRIPT_DIR/palace-setup.sh" ]; then
    echo "  Found setup script at: $SCRIPT_DIR/palace-setup.sh"
    echo "  Starting full installation..."
    echo ""
    bash "$SCRIPT_DIR/palace-setup.sh"
elif [ -f "$HOME/palace/scripts/palace-start.sh" ]; then
    echo "  Palace already installed. Starting services..."
    echo ""
    bash "$HOME/palace/scripts/palace-start.sh"
else
    echo "  ERROR: palace-setup.sh not found alongside this installer."
    echo "  Make sure both files are on the USB drive."
    exit 1
fi
USB_LAUNCHER
chmod +x "$PALACE_DIR/PALACE-INSTALL.sh"

echo -e "  ${GREEN}✓${NC} USB launcher created"

echo ""

# ============================================================================
# PHASE 13: FINAL VERIFICATION
# ============================================================================
banner "Phase 13: Final Verification"

echo -e "${BOLD}Checking installation...${NC}"

check_command opencode
check_command python3
check_command node
check_command npm

echo ""
echo -e "${BOLD}Checking Python packages...${NC}"
source "$PALACE_DIR/venv/bin/activate"
python3 -c "import vllm; print('  ✓ vllm', vllm.__version__)" 2>/dev/null || echo "  ✗ vllm not found"
python3 -c "import faster_whisper; print('  ✓ faster-whisper')" 2>/dev/null || echo "  ✗ faster-whisper not found"
python3 -c "import fastapi; print('  ✓ fastapi')" 2>/dev/null || echo "  ✗ fastapi not found"
python3 -c "import httpx; print('  ✓ httpx')" 2>/dev/null || echo "  ✗ httpx not found"

echo ""
echo -e "${BOLD}Palace directory structure:${NC}"
ls -la "$PALACE_DIR/" 2>/dev/null
echo ""

# ============================================================================
# COMPLETE
# ============================================================================
PALACE_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_IP")

echo -e "${CYAN}${BOLD}"
echo "  ╔═══════════════════════════════════════════════════════════╗"
echo "  ║                                                           ║"
echo "  ║          THE PALACE — INSTALLATION COMPLETE               ║"
echo "  ║                                                           ║"
echo "  ╠═══════════════════════════════════════════════════════════╣"
echo "  ║                                                           ║"
echo "  ║  QUICK START:                                             ║"
echo "  ║                                                           ║"
echo "  ║  1. Start all services:     palace-start                  ║"
echo "  ║  2. Launch Claude Code UI:  opencode                     ║"
echo "  ║  3. Phone access:           http://${PALACE_IP}:7777      ║"
echo "  ║  4. Web chat:               palace-webui                  ║"
echo "  ║  5. Check status:           palace-status                 ║"
echo "  ║  6. Stop services:          palace-stop                   ║"
echo "  ║                                                           ║"
echo "  ║  WINDOWS (run once in PowerShell Admin):                  ║"
echo "  ║  powershell -File ~/palace/scripts/windows-setup.ps1      ║"
echo "  ║                                                           ║"
echo "  ║  ANDROID APPS TO INSTALL:                                 ║"
echo "  ║  - KDE Connect (Play Store)                               ║"
echo "  ║  - DroidCam (Play Store)                                  ║"
echo "  ║                                                           ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "  Want to start now? Run: palace-start"
echo ""
