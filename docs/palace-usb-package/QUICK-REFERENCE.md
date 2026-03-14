# The Palace — Quick Reference Card

## Daily Commands (WSL2 Terminal)

| Command | What It Does |
|---|---|
| `palace-start` | Start all Palace services (vision, whisper, bridge) |
| `palace-stop` | Stop all Palace services (keeps text model running) |
| `palace-status` | Check what's running |
| `opencode` | Launch Claude Code-style terminal AI |
| `palace-webui` | Start web chat interface on port 3000 |
| `palace-vision-start` | Start vision model separately |

## Access Points

| Service | URL | From Phone? |
|---|---|---|
| OpenCode CLI | Terminal command | No (WSL2 only) |
| Palace Bridge | http://PALACE_IP:7777 | Yes |
| Open WebUI | http://PALACE_IP:3000 | Yes |
| Text Model API | http://localhost:8000 | No |
| Vision Model API | http://localhost:8001 | No |
| Whisper API | http://localhost:8002 | No |

## Typical Workflow

### Code Work (Claude Code Experience)
```bash
cd ~/my-project
opencode
# Now you're in the Claude Code-style interface
# Ask questions, edit files, run commands — all through Qwen 2.5 32B
```

### Analyze an Image from Phone
1. Phone browser -> http://PALACE_IP:7777
2. Tap "Send Image" -> select or take photo
3. AI response appears on screen

### Voice Question from Phone
1. Phone browser -> http://PALACE_IP:7777
2. Tap "Voice Input" -> speak -> tap to stop
3. Transcription + AI response appears

### Real-Time "Eyes and Ears"
1. Phone browser -> http://PALACE_IP:7777
2. Tap "Live Vision" for camera stream
3. Tap "Live Listen" for continuous mic
4. AI processes in real-time

## File Locations

| Path | Contents |
|---|---|
| `~/palace/` | Main Palace directory |
| `~/palace/inbox/images/` | Images received from phone |
| `~/palace/inbox/audio/` | Audio recordings from phone |
| `~/palace/inbox/video/` | Videos from phone |
| `~/palace/inbox/documents/` | Documents from phone |
| `~/palace/logs/` | Service logs |
| `~/palace/bridge/` | Bridge server code |
| `~/palace/scripts/` | Management scripts |
| `~/.config/opencode/opencode.json` | OpenCode config |

## Logs (for troubleshooting)

```bash
tail -f ~/palace/logs/vllm-vision.log    # Vision model logs
tail -f ~/palace/logs/whisper.log         # Whisper logs
tail -f ~/palace/logs/bridge.log          # Palace Bridge logs
```

## VRAM Budget (RTX 5090 — 32GB)

| Component | VRAM | Status |
|---|---|---|
| Qwen 2.5 32B AWQ (text) | ~18-20 GB | Always on |
| Qwen2.5-VL-7B AWQ (vision) | ~5-6 GB | On-demand |
| faster-whisper large-v3 | ~2 GB | On-demand |
| Available headroom | ~6-11 GB | Varies by active models |
