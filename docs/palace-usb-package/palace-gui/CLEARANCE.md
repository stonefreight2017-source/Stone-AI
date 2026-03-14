# Palace GUI — Deployment Clearance Report

**Agent**: Computer Wiz (#45) — The Royal Guard
**Date**: 2026-03-08
**Directive**: D19 — Palace GUI Validation
**Target**: OMEN 45L (Win11 Pro, RTX 5090, 64GB DDR5)

---

## CLEARANCE CHECKLIST

### 1. Port 7070 — CLEARED

Known occupied ports on OMEN:
| Port | Service |
|------|---------|
| 8000 | vLLM Instance #1 (Qwen 2.5 32B AWQ — text) |
| 8001 | vLLM Instance #2 (Qwen2.5-VL-7B-AWQ — vision) |
| 3000 | Open WebUI |
| 7777 | Palace Bridge (FastAPI) |
| 5432 | PostgreSQL |
| 6379 | Redis |

**Port 7070 is free.** No conflict with any known service. No common software defaults to 7070. CLEARED.

---

### 2. Node.js on OMEN — CLEARED

Node.js v24.14.0 confirmed from prior error messages on OMEN. Express 4.21.x is compatible with Node 24. The `server.js` entry point in `package.json` is correct.

**Note**: Node 24 is a current/unstable release line. Express 4.x works fine on it. If any obscure compatibility issue surfaces, pinning to Node 22 LTS via `nvm` would be the fix, but this is not expected to be needed.

CLEARED.

---

### 3. npm Availability — CLEARED

npm ships bundled with every Node.js installation. Node 24.14.0 includes npm. The `start-palace-gui.bat` script correctly runs `npm install` on first launch if `node_modules/` is missing. No action needed.

CLEARED.

---

### 4. Browser — CLEARED

Windows 11 ships with Microsoft Edge (Chromium-based). Edge handles `localhost:7070` without issues. The `.bat` script uses `start http://localhost:7070` which opens the default browser — correct behavior.

CLEARED.

---

### 5. Firewall — CLEARED

`localhost` (127.0.0.1) traffic does not traverse the Windows Firewall. The Express server binding to `localhost:7070` or `0.0.0.0:7070` for local-only access requires zero firewall rules.

**Recommendation**: Bind to `127.0.0.1` explicitly in `server.js` (not `0.0.0.0`) unless you want other devices on the LAN (like the Android phone) to reach the GUI. If LAN access is needed, bind to `0.0.0.0` and Windows Firewall will prompt once on first run — click Allow.

CLEARED.

---

### 6. CORS — vLLM Proxy — FLAGGED (with fix)

**Status**: CLEARED IF the fix below is implemented.

**The issue**: If the Palace GUI frontend (browser JS on `localhost:7070`) makes direct `fetch()` calls to vLLM on `localhost:8000`, the browser will enforce CORS. vLLM's default CORS configuration may block cross-origin requests from port 7070.

**The fix (mandatory)**: The Express `server.js` backend MUST proxy all vLLM requests. The browser JS should NEVER call `localhost:8000` or `localhost:8001` directly. Instead:

```
Browser JS  -->  POST /api/chat  -->  Express (7070)  -->  vLLM (8000)
Browser JS  -->  POST /api/vision -->  Express (7070)  -->  vLLM (8001)
```

This eliminates CORS entirely because the browser only talks to its own origin (`localhost:7070`). The Express backend (server-side Node.js) is not subject to CORS when making HTTP requests to vLLM.

**For SSE streaming**: The Express proxy must forward the `Transfer-Encoding: chunked` / SSE stream from vLLM back to the browser. Use `res.writeHead(200, { 'Content-Type': 'text/event-stream', ... })` and pipe the vLLM response stream through.

CLEARED with proxy architecture. Do NOT hit vLLM from browser JS.

---

### 7. File Upload Size Limits — CLEARED

`multer` is already a dependency in `package.json`. Default multer has no file size limit, which means the OS/memory is the constraint.

**Recommendation**: Set an explicit limit in the multer config:

```javascript
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }  // 50MB
});
```

50MB is reasonable for video files sent to the vision model. Images will be well under this. Audio files for whisper transcription typically under 10MB.

For very large files, consider a streaming upload approach, but 50MB covers the Palace use case.

CLEARED.

---

### 8. vLLM SSE Streaming — CLEARED

vLLM's OpenAI-compatible `/v1/chat/completions` endpoint supports SSE streaming when `"stream": true` is set in the request body. The response format follows the OpenAI SSE spec:

```
data: {"id":"...","choices":[{"delta":{"content":"token"},...}],...}
data: {"id":"...","choices":[{"delta":{},"finish_reason":"stop",...}],...}
data: [DONE]
```

This is the same protocol used by OpenCode, Open WebUI, and the existing `palace.mjs` — all of which already stream from vLLM on OMEN successfully. The Palace GUI Express backend must:

1. Send the request to vLLM with `"stream": true`
2. Set response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
3. Pipe each `data:` chunk from vLLM to the browser as-is
4. Close the response when vLLM sends `data: [DONE]`

CLEARED.

---

## SUMMARY

| # | Check | Status |
|---|-------|--------|
| 1 | Port 7070 conflict | CLEARED |
| 2 | Node.js on OMEN | CLEARED |
| 3 | npm availability | CLEARED |
| 4 | Browser | CLEARED |
| 5 | Firewall | CLEARED |
| 6 | CORS / vLLM proxy | CLEARED (proxy required — no direct browser-to-vLLM calls) |
| 7 | File upload limits | CLEARED (set 50MB limit in multer config) |
| 8 | vLLM SSE streaming | CLEARED |

**OVERALL VERDICT: CLEARED FOR BUILD**

Zero blockers. One mandatory architectural requirement (item 6): all vLLM communication must go through the Express backend as a proxy. This is standard practice and already implied by the server.js architecture.

---

*Computer Wiz (#45) — The Royal Guard*
*Clearance validated. Build is green.*
