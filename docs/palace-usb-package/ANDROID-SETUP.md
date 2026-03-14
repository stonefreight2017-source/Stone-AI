# The Palace — Android Phone Setup

## What to Install on Your Android Phone

### 1. KDE Connect (File Transfer + Clipboard Sync)
- **Play Store**: Search "KDE Connect" by KDE Community
- **Setup**:
  1. Install on phone
  2. Make sure phone and OMEN are on the same WiFi network
  3. Open KDE Connect on phone — it will auto-discover the OMEN
  4. Tap the OMEN device -> "Request Pairing"
  5. Accept the pairing on the Windows KDE Connect app
- **Usage**: Share files from any Android app using the share menu -> "Send to Device"

### 2. DroidCam (Camera as Webcam for Real-Time Vision)
- **Play Store**: Search "DroidCam Webcam" by Dev47Apps
- **Setup**:
  1. Install DroidCam on phone
  2. Install DroidCam Client on OMEN (Windows): https://droidcam.app/
  3. Open DroidCam on phone — note the IP address shown
  4. Open DroidCam Client on OMEN — enter the phone IP
  5. Click "Start" — phone camera is now a webcam on the OMEN
- **Usage**: Palace Bridge can capture this feed for real-time AI vision analysis

### 3. Chrome Browser (Palace Bridge Access)
- Already installed on most Android phones
- **Setup**: None needed
- **Usage**:
  1. Connect phone to same WiFi as the OMEN
  2. Open Chrome on phone
  3. Navigate to: `http://PALACE_IP:7777` (the IP shown when you run `palace-start`)
  4. You'll see the Palace Bridge interface
  5. Use it to: send photos, record voice, stream camera, upload files

## How It All Works Together

### Sending a Photo for AI Analysis
1. Open Chrome -> `http://PALACE_IP:7777`
2. Tap "Send Image" or "Take Photo"
3. AI analyzes the image and responds on screen
4. OR: Take photo in any app -> Share -> KDE Connect -> Send to OMEN

### Voice Input
1. Open Chrome -> `http://PALACE_IP:7777`
2. Tap "Voice Input" -> speak -> tap again to stop
3. Speech is transcribed locally by Whisper, then AI responds

### "See What I See" (Real-Time Camera)
1. Open Chrome -> `http://PALACE_IP:7777`
2. Tap "Live Vision"
3. Phone requests camera permission -> allow
4. Camera frames are sent to AI every 2 seconds
5. AI describes what it sees in real-time on the page
6. Tap again to stop

### "Hear What I Hear" (Live Mic)
1. Open Chrome -> `http://PALACE_IP:7777`
2. Tap "Live Listen"
3. Phone requests mic permission -> allow
4. Audio is recorded in 10-second chunks, transcribed, AI responds
5. Tap again to stop

### Screen Mirroring (scrcpy — optional)
1. Enable Developer Options on Android (Settings -> About Phone -> tap Build Number 7 times)
2. Enable USB Debugging in Developer Options
3. Connect phone to OMEN via USB cable
4. On OMEN, open terminal and run: `scrcpy`
5. Phone screen appears on OMEN display with keyboard/mouse control
6. For wireless after first USB setup: `scrcpy --tcpip`

## Network Requirements
- Phone and OMEN MUST be on the same local network (WiFi or ethernet)
- If using a separate WiFi network from the OMEN's ethernet, ensure they can reach each other
- The Palace Bridge runs on port 7777 — may need Windows Firewall exception (the setup script handles this)

## Troubleshooting
- **Can't reach Palace Bridge from phone**: Check `palace-status` on the OMEN. Verify same network. Try pinging the OMEN IP from the phone.
- **Camera/mic not working in browser**: Chrome requires HTTPS for camera/mic on non-localhost origins. If this is an issue, access via `http://localhost:7777` using scrcpy to control the phone from the OMEN, or use DroidCam instead for camera streaming.
- **KDE Connect not discovering OMEN**: Both devices must be on the same subnet. Restart KDE Connect on both. Check firewall isn't blocking UDP broadcast.
