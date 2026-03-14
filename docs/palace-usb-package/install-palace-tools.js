#!/usr/bin/env node
// install-palace-tools.js — Voice, Vision, Screen, Tools Installer
// Agents: Stone (Head 1), Chaos (#44), Computer Wiz (#45)
// Run: node install-palace-tools.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PALACE = 'C:\\Users\\admin\\palace';
const SCRIPTS = path.join(PALACE, 'scripts');
const INBOX = path.join(PALACE, 'inbox');

let ok = 0, fail = 0;

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 300000, ...opts }).trim();
  } catch (e) {
    return null;
  }
}

function writeFile(p, content) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content, 'utf8');
    console.log(`[OK] Written: ${p}`);
    ok++;
  } catch (e) {
    console.log(`[FAIL] ${p}: ${e.message}`);
    fail++;
  }
}

console.log('');
console.log('=== THE PALACE — Tools Installer ===');
console.log('=== Stone + Chaos + Computer Wiz ===');
console.log('');

// ─── CREATE DIRECTORIES ──────────────────────────────────────────────
console.log('--- Creating directories ---');
[
  SCRIPTS,
  path.join(INBOX, 'screenshots'),
  path.join(INBOX, 'audio'),
  path.join(INBOX, 'video'),
  path.join(INBOX, 'documents'),
  path.join(INBOX, 'images'),
].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
  console.log(`[OK] ${d}`);
});
ok += 6;

// ─── 1. VOICE INPUT — Speech to Text (Windows Native) ───────────────
console.log('');
console.log('--- 1. Voice Input (Speech-to-Text) ---');

// Windows native speech recognition — no WSL audio needed
writeFile(path.join(SCRIPTS, 'listen.ps1'), `
Add-Type -AssemblyName System.Speech
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$recognizer.SetInputToDefaultAudioDevice()

# Use dictation grammar for free-form speech
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$recognizer.LoadGrammar($grammar)

Write-Host "Listening... Speak now. (Press Ctrl+C to stop)" -ForegroundColor Cyan

while ($true) {
    try {
        $result = $recognizer.Recognize([TimeSpan]::FromSeconds(10))
        if ($result -and $result.Text) {
            Write-Host $result.Text
            # Write to file so Palace CLI can read it
            $result.Text | Out-File -FilePath "C:\\Users\\admin\\palace\\inbox\\audio\\latest-voice.txt" -Encoding UTF8
        }
    } catch {
        break
    }
}
$recognizer.Dispose()
`);

// Continuous listen mode — auto-sends to Palace
writeFile(path.join(SCRIPTS, 'voice-to-palace.ps1'), `
Add-Type -AssemblyName System.Speech
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$recognizer.SetInputToDefaultAudioDevice()
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$recognizer.LoadGrammar($grammar)

Write-Host ""
Write-Host "=== PALACE VOICE MODE ===" -ForegroundColor Gold
Write-Host "Speak naturally. Your words go directly to the Palace." -ForegroundColor Cyan
Write-Host "Say 'exit voice' to stop." -ForegroundColor Gray
Write-Host ""

while ($true) {
    $result = $recognizer.Recognize([TimeSpan]::FromSeconds(15))
    if ($result -and $result.Text) {
        $text = $result.Text.Trim()
        if ($text -match "exit voice|stop listening|quit voice") {
            Write-Host "Voice mode ended." -ForegroundColor Yellow
            break
        }
        Write-Host "[You said]: $text" -ForegroundColor Green
        $text | Out-File -FilePath "C:\\Users\\admin\\palace\\inbox\\audio\\latest-voice.txt" -Encoding UTF8 -Force
    }
}
$recognizer.Dispose()
`);

// Quick one-shot voice capture
writeFile(path.join(SCRIPTS, 'say.ps1'), `
param([int]$seconds = 5)
Add-Type -AssemblyName System.Speech
$r = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$r.SetInputToDefaultAudioDevice()
$r.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
Write-Host "Listening for $seconds seconds..." -ForegroundColor Cyan
$result = $r.Recognize([TimeSpan]::FromSeconds($seconds))
$r.Dispose()
if ($result -and $result.Text) {
    $result.Text | Out-File -FilePath "C:\\Users\\admin\\palace\\inbox\\audio\\latest-voice.txt" -Encoding UTF8
    Write-Host $result.Text
} else {
    Write-Host "No speech detected." -ForegroundColor Yellow
}
`);

// ─── 2. TEXT TO SPEECH — Palace Talks Back ───────────────────────────
console.log('');
console.log('--- 2. Text-to-Speech (Palace Voice Output) ---');

writeFile(path.join(SCRIPTS, 'speak.ps1'), `
param([string]$text)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male)
$synth.Rate = 1
$synth.Volume = 100
$synth.Speak($text)
$synth.Dispose()
`);

// ─── 3. SCREEN CAPTURE ──────────────────────────────────────────────
console.log('');
console.log('--- 3. Screen Capture ---');

writeFile(path.join(SCRIPTS, 'screenshot.ps1'), `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outPath = "C:\\Users\\admin\\palace\\inbox\\screenshots\\screen_$timestamp.png"
$bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()

Write-Host $outPath
`);

writeFile(path.join(SCRIPTS, 'clipboard.ps1'), `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $outPath = "C:\\Users\\admin\\palace\\inbox\\screenshots\\clip_$timestamp.png"
    $img.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host $outPath
} else {
    Write-Host "No image in clipboard. Use Win+Shift+S first."
}
`);

// ─── 4. WALLPAPER ───────────────────────────────────────────────────
console.log('');
console.log('--- 4. Palace Wallpaper ---');

// Copy wallpaper generator from USB package (too large to embed inline)
try {
  const usbDir = path.dirname(process.argv[1] || __filename);
  const wallpaperSrc = path.join(usbDir, 'make_wallpaper.py');
  const wallpaperDst = path.join(PALACE, 'make_wallpaper.py');
  if (fs.existsSync(wallpaperSrc)) {
    fs.copyFileSync(wallpaperSrc, wallpaperDst);
    console.log('[OK] Wallpaper generator copied from USB');
    ok++;
  } else {
    console.log('[WARN] make_wallpaper.py not found on USB — using fallback');
    fail++;
  }
} catch(e) {
  console.log('[WARN] Could not copy wallpaper generator: ' + e.message);
  fail++;
}

// ─── 5. TRINA SCREENSAVER ───────────────────────────────────────────
console.log('');
console.log('--- 5. Trina Screensaver ---');

writeFile(path.join(PALACE, 'trina.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trina</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;cursor:none;font-family:'Playfair Display',serif}
body{background:#0a0a12}
.bg{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;background:radial-gradient(ellipse at 30% 50%,#1a0a1a 0%,#0a0a12 50%,#060612 100%);animation:bgShift 30s ease-in-out infinite alternate}
@keyframes bgShift{0%{background:radial-gradient(ellipse at 30% 50%,#1a0a1a 0%,#0a0a12 50%,#060612 100%)}33%{background:radial-gradient(ellipse at 70% 40%,#1a0e18 0%,#0c0812 50%,#060612 100%)}66%{background:radial-gradient(ellipse at 40% 60%,#180a16 0%,#0a0a14 50%,#060612 100%)}100%{background:radial-gradient(ellipse at 60% 50%,#1c0c1a 0%,#0a0812 50%,#060612 100%)}}
.vignette{position:fixed;top:0;left:0;width:100%;height:100%;z-index:1;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%);pointer-events:none}
.heart-layer{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden}
.layer-back{z-index:2}
.layer-mid{z-index:3}
.layer-front{z-index:4}
.fireflies{position:fixed;top:0;left:0;width:100%;height:100%;z-index:5;pointer-events:none;overflow:hidden}
.firefly{position:absolute;border-radius:50%;pointer-events:none}
.center{position:fixed;top:0;left:0;width:100%;height:100%;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.name{font-family:'Playfair Display',serif;font-size:8vw;font-weight:600;color:transparent;background:linear-gradient(135deg,#f4e0c7 0%,#e8c9a0 30%,#d4a870 60%,#c49660 100%);-webkit-background-clip:text;background-clip:text;letter-spacing:0.18em;animation:nameBreath 8s cubic-bezier(0.37,0,0.63,1) infinite alternate;user-select:none;filter:drop-shadow(0 0 30px rgba(212,168,112,0.2)) drop-shadow(0 0 60px rgba(183,110,121,0.1))}
@keyframes nameBreath{0%{filter:drop-shadow(0 0 25px rgba(212,168,112,0.15)) drop-shadow(0 0 50px rgba(183,110,121,0.08));letter-spacing:0.18em}100%{filter:drop-shadow(0 0 40px rgba(212,168,112,0.35)) drop-shadow(0 0 80px rgba(183,110,121,0.15)) drop-shadow(0 0 120px rgba(200,155,155,0.08));letter-spacing:0.20em}}
.subtitle{font-family:'Playfair Display',serif;font-style:italic;font-size:2vw;color:rgba(200,155,155,0.7);letter-spacing:0.3em;margin-top:2.5vh;animation:subFade 10s cubic-bezier(0.37,0,0.63,1) infinite alternate;user-select:none}
@keyframes subFade{0%{opacity:0.4;letter-spacing:0.3em}100%{opacity:0.8;letter-spacing:0.35em}}
.divider{display:flex;align-items:center;gap:2vw;margin-top:2vh;animation:divFade 10s ease-in-out infinite alternate}
.div-line{width:8vw;height:1px;background:linear-gradient(90deg,transparent,rgba(183,110,121,0.5),transparent)}
.div-heart{font-size:1.2vw;color:rgba(183,110,121,0.4);animation:divHeartPulse 4s ease-in-out infinite}
@keyframes divFade{0%{opacity:0.3}100%{opacity:0.7}}
@keyframes divHeartPulse{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(1.2);opacity:0.7}}
.concept-e{position:fixed;bottom:3vh;right:3vw;font-family:'Playfair Display',serif;font-size:2.5vw;color:rgba(212,168,112,0.08);z-index:10;user-select:none;pointer-events:none;letter-spacing:0.1em}
.exit-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:999;background:#000;opacity:0;pointer-events:none;transition:opacity 2s cubic-bezier(0.37,0,0.63,1)}
.exit-overlay.active{opacity:1;pointer-events:all}
</style>
</head><body>
<div class="bg"></div>
<div class="vignette"></div>
<div class="heart-layer layer-back" id="layerBack"></div>
<div class="heart-layer layer-mid" id="layerMid"></div>
<div class="heart-layer layer-front" id="layerFront"></div>
<div class="fireflies" id="fireflies"></div>
<div class="center">
<div class="name">Trina</div>
<div class="divider"><span class="div-line"></span><span class="div-heart">&#9829;</span><span class="div-line"></span></div>
<div class="subtitle">you are loved</div>
</div>
<div class="concept-e">E</div>
<div class="exit-overlay" id="exitOverlay"></div>
<script>
(function(){
/* ── Heart SVG generator ── */
function heartSVG(color,opacity,glow){
var g=glow?'<filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>':'';
var f=glow?' filter="url(#glow)"':'';
return 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'+g+'<path d="M50 88 C25 65 5 50 5 30 A22 22 0 0 1 50 18 A22 22 0 0 1 95 30 C95 50 75 65 50 88Z" fill="'+color+'" opacity="'+opacity+'"'+f+'/></svg>');
}
var palette=[
{c:'#c94068',o:'0.6'},{c:'#d4567a',o:'0.5'},{c:'#e87a9a',o:'0.4'},
{c:'#b7465e',o:'0.55'},{c:'#d4a847',o:'0.3'},{c:'#c89090',o:'0.45'},
{c:'#e8a0b0',o:'0.35'},{c:'#f0c0d0',o:'0.25'},{c:'#a03050',o:'0.5'}
];
/* ── Spawn hearts into a layer ── */
function spawnHearts(containerId,count,sizeMin,sizeMax,speedMin,speedMax,blurMin,blurMax,glowChance){
var container=document.getElementById(containerId);
var styleEl=document.createElement('style');
var css='';
for(var i=0;i<count;i++){
var p=palette[Math.floor(Math.random()*palette.length)];
var hasGlow=Math.random()<glowChance;
var size=Math.random()*(sizeMax-sizeMin)+sizeMin;
var left=Math.random()*110-5;
var dur=Math.random()*(speedMax-speedMin)+speedMin;
var delay=Math.random()*-dur;
var drift=Math.random()*8-4;
var rot=Math.random()*40-20;
var rotEnd=Math.random()*40-20;
var blur=Math.random()*(blurMax-blurMin)+blurMin;
var animName=containerId+'H'+i;
var el=document.createElement('div');
el.style.cssText='position:absolute;width:'+size+'px;height:'+size+'px;left:'+left+'%;bottom:-'+size+'px;background-image:url(\"'+heartSVG(p.c,p.o,hasGlow)+'\");background-size:contain;background-repeat:no-repeat;filter:blur('+blur+'px);animation:'+animName+' '+dur+'s linear '+delay+'s infinite;will-change:transform;';
css+='@keyframes '+animName+'{0%{transform:translateY(0) translateX(0) rotate('+rot+'deg);opacity:0}5%{opacity:1}90%{opacity:1}100%{transform:translateY(-120vh) translateX('+drift+'vw) rotate('+rotEnd+'deg);opacity:0}}';
container.appendChild(el);
}
styleEl.textContent=css;
document.head.appendChild(styleEl);
}
/* Back layer: small, blurry, slow — depth */
spawnHearts('layerBack',25,15,35,25,40,2,4,0.2);
/* Mid layer: medium, some glow */
spawnHearts('layerMid',18,30,60,18,30,0.5,2,0.4);
/* Front layer: large, crisp, some with glow halos */
spawnHearts('layerFront',10,50,90,15,25,0,0.5,0.6);
/* ── Firefly particles ── */
var ffContainer=document.getElementById('fireflies');
var ffStyle=document.createElement('style');
var ffCss='';
var ffColors=['#d4a847','#e8d5b7','#f0dcc0','#c89b9b','#e8b0c0'];
for(var f=0;f<35;f++){
var fc=ffColors[Math.floor(Math.random()*ffColors.length)];
var fs=Math.random()*4+2;
var fl=Math.random()*100;
var ft=Math.random()*100;
var fd=Math.random()*15+10;
var fDelay=Math.random()*-20;
var dX=Math.random()*10-5;
var dY=Math.random()*10-5;
var an='ff'+f;
var ff=document.createElement('div');
ff.className='firefly';
ff.style.cssText='width:'+fs+'px;height:'+fs+'px;left:'+fl+'%;top:'+ft+'%;background:radial-gradient(circle,'+fc+' 0%,transparent 70%);box-shadow:0 0 '+(fs*3)+'px '+fc+'80,0 0 '+(fs*6)+'px '+fc+'30;animation:'+an+' '+fd+'s ease-in-out '+fDelay+'s infinite alternate;will-change:transform,opacity;';
ffCss+='@keyframes '+an+'{0%{transform:translate(0,0);opacity:0.1}25%{opacity:0.7}50%{transform:translate('+dX+'vw,'+dY+'vh);opacity:0.3}75%{opacity:0.8}100%{transform:translate('+(dX*-0.7)+'vw,'+(dY*-0.5)+'vh);opacity:0.15}}';
ffContainer.appendChild(ff);
}
ffStyle.textContent=ffCss;
document.head.appendChild(ffStyle);
/* ── Sparkle overlay (subtle shimmer on random hearts) ── */
var sparkStyle=document.createElement('style');
sparkStyle.textContent='@keyframes sparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}.spark{position:absolute;width:4px;height:4px;background:radial-gradient(circle,#fff 0%,#f0dcc0 40%,transparent 70%);border-radius:50%;pointer-events:none;z-index:6}';
document.head.appendChild(sparkStyle);
var sparkContainer=document.createElement('div');
sparkContainer.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:6;overflow:hidden';
document.body.appendChild(sparkContainer);
function spawnSparkle(){
var s=document.createElement('div');
s.className='spark';
var x=Math.random()*100;
var y=Math.random()*100;
var dur=Math.random()*2+1;
s.style.cssText+='left:'+x+'%;top:'+y+'%;animation:sparkle '+dur+'s ease-in-out forwards;';
sparkContainer.appendChild(s);
setTimeout(function(){if(s.parentNode)s.parentNode.removeChild(s);},dur*1000+100);
}
setInterval(function(){if(Math.random()<0.6){spawnSparkle();}},400);
/* ── Exit handling ── */
var exited=false;
function doExit(){
if(exited)return;
exited=true;
document.getElementById('exitOverlay').classList.add('active');
setTimeout(function(){try{window.close();}catch(e){}},2200);
}
document.addEventListener('keydown',doExit);
document.addEventListener('mousemove',doExit);
document.addEventListener('click',doExit);
document.addEventListener('touchstart',doExit);
})();
</script>
</body></html>`);

writeFile(path.join(PALACE, 'trina-screensaver.bat'), `@echo off\nstart msedge --kiosk "file:///C:/Users/admin/palace/trina.html" --edge-kiosk-type=fullscreen`);

// ─── 6. CHAOS'S OPTIONAL TOOLS (SKIPPED — install later if needed) ───
console.log('');
console.log('--- 6. Chaos Optional Tools ---');
console.log('[SKIP] Ollama, Portainer, Uptime Kuma, Cloudflare — not needed for Palace');
console.log('[INFO] Palace uses vLLM directly. These can be added later if wanted.');
let r;

// ─── 7. SET WALLPAPER ───────────────────────────────────────────────
console.log('');
console.log('--- 7. Setting Wallpaper ---');
r = run('pip install Pillow 2>&1');
r = run(`python "${path.join(PALACE, 'make_wallpaper.py')}" 2>&1`);
if (r && r.includes('saved')) {
  console.log('[OK] Wallpaper created');
  // Set via API
  run(`powershell -Command "Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class W { [DllImport(\\"user32.dll\\", CharSet=CharSet.Auto)] public static extern int SystemParametersInfo(int a, int b, string c, int d); }'; [W]::SystemParametersInfo(0x0014, 0, 'C:\\Users\\admin\\palace\\wallpaper.png', 3)"`);
  // Persist via registry so it survives reboot
  run('reg add "HKCU\\Control Panel\\Desktop" /v Wallpaper /t REG_SZ /d "C:\\Users\\admin\\palace\\wallpaper.png" /f');
  run('reg add "HKCU\\Control Panel\\Desktop" /v WallpaperStyle /t REG_SZ /d "10" /f');
  run('reg add "HKCU\\Control Panel\\Desktop" /v TileWallpaper /t REG_SZ /d "0" /f');
  run('RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters');
  console.log('[OK] Wallpaper set + persisted in registry');
  ok += 2;
} else {
  console.log('[WARN] Wallpaper creation failed — Pillow may not be installed');
  fail++;
}

// ─── 7b. TRINA SCREENSAVER ACTIVATION ──────────────────────────────
console.log('');
console.log('--- 7b. Trina Screensaver Activation ---');
// Enable screensaver in registry (5 min = 300 sec)
run('reg add "HKCU\\Control Panel\\Desktop" /v ScreenSaveActive /t REG_SZ /d "1" /f');
run('reg add "HKCU\\Control Panel\\Desktop" /v ScreenSaveTimeOut /t REG_SZ /d "300" /f');
// Create scheduled task for screensaver on idle
r = run('powershell -Command "Register-ScheduledTask -TaskName PalaceScreensaver -Action (New-ScheduledTaskAction -Execute cmd.exe -Argument \\"/c start msedge --kiosk file:///C:/Users/admin/palace/trina.html --edge-kiosk-type=fullscreen\\") -Settings (New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0)) -Trigger (New-ScheduledTaskTrigger -AtLogOn) -Description \\"Trina screensaver\\" -Force" 2>&1');
if (r) { console.log('[OK] Trina screensaver scheduled'); ok++; }
else { console.log('[WARN] Screensaver task may need admin'); fail++; }

// ─── 7c. POWER SETTINGS — PALACE NEVER SLEEPS ─────────────────────
console.log('');
console.log('--- 7c. Power Settings (Never Sleep) ---');
run('powercfg /change standby-timeout-ac 0');
run('powercfg /change hibernate-timeout-ac 0');
run('powercfg /change monitor-timeout-ac 15');
console.log('[OK] Power: never sleep, never hibernate, display off after 15 min');
ok++;

// ─── 8. FIREWALL ────────────────────────────────────────────────────
console.log('');
console.log('--- 8. Firewall Rules ---');
r = run('powershell -Command "New-NetFirewallRule -DisplayName Palace-Allow -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000,8001,3001,3002,9443,7777 -ErrorAction SilentlyContinue" 2>&1');
if (r) { console.log('[OK] Firewall rules set'); ok++; }
else { console.log('[WARN] Firewall rules may need admin'); fail++; }

// ─── 9. CARDINAL INTELLIGENCE INFRASTRUCTURE ────────────────────────
console.log('');
console.log('--- 9. Cardinal Intelligence Infrastructure ---');

// Create Cardinal directory structure
[
  path.join(PALACE, 'cardinal', 'journal'),
  path.join(PALACE, 'cardinal', 'assessments'),
  path.join(PALACE, 'cardinal', 'feeds', 'competitors'),
  path.join(PALACE, 'cardinal', 'feeds', 'hn'),
  path.join(PALACE, 'cardinal', 'feeds', 'reddit'),
  path.join(PALACE, 'cardinal', 'feeds', 'news'),
  path.join(PALACE, 'cardinal', 'feeds', 'models'),
  path.join(PALACE, 'cardinal', 'briefings'),
  path.join(PALACE, 'cardinal', 'protocols'),
].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
  console.log(`[OK] ${d}`);
});
ok += 9;

// Session start protocol
writeFile(path.join(PALACE, 'cardinal', 'protocols', 'session-start.md'), `# Cardinal — Session Start Brief

## Current State
- Last updated: NOT YET INITIALIZED
- Palace status: Fresh install
- Active projects: Stone AI (live), Best AI (mobile, ~18wk post-launch), Stone AI Tools (pre-launch)

## Top 3 Priorities
1. Establish intelligence baseline — run first collection pass on all three businesses
2. Build initial competitive landscape assessment
3. Identify top blind spots across the Three-Headed Monster

## Open Questions
- No prior session data. First session should focus on establishing baselines.

## Running Threads
(None yet — Cardinal will populate as intelligence accumulates)

---
*Update this file at the END of every session per C-22 protocol.*
`);

// Session end protocol
writeFile(path.join(PALACE, 'cardinal', 'protocols', 'session-end.md'), `# Cardinal — Session End Protocol

Run this checklist at the END of every session. No exceptions.

## Steps
1. **Write Journal Entry**
   - File: cardinal/journal/YYYY-MM-DD.md
   - Include: date, key findings, decisions made, open questions, next session priorities
   - Format: Use C-23 compressed briefing format for each finding

2. **Update Session Start**
   - File: cardinal/protocols/session-start.md
   - Update: current state, top 3 priorities, open questions, running threads
   - Remove anything resolved. Add anything new.

3. **Update Running Assessments**
   - Check: competitive-landscape.md, threat-model.md, technology-radar.md, blind-spots.md
   - Only update if new intelligence was gathered this session
   - Append with date stamp — never overwrite history

4. **Staleness Sweep**
   - Flag any intelligence older than 7 days as AGING
   - Flag any intelligence older than 30 days as STALE
   - Recommend refresh targets for next session

5. **Feed Check**
   - Note any new data in cardinal/feeds/ that was NOT processed this session
   - Queue unprocessed feeds for next session start

---
*This protocol is MANDATORY per seed C-22. Skipping it breaks cross-session continuity.*
`);

// Initial competitive landscape assessment
writeFile(path.join(PALACE, 'cardinal', 'assessments', 'competitive-landscape.md'), `# Competitive Landscape — Running Assessment

## Last Updated: NOT YET INITIALIZED

## BLUF
No competitive analysis has been performed yet. This document will be populated during Cardinal's first intelligence collection session.

## Stone AI — Competitors
| Competitor | Threat Level | Key Differentiator | Last Assessed |
|---|---|---|---|
| (pending first collection) | - | - | - |

## Best AI (Mobile) — Competitors
| Competitor | Threat Level | Key Differentiator | Last Assessed |
|---|---|---|---|
| (pending first collection) | - | - | - |

## Stone AI Tools — Competitors
| Competitor | Threat Level | Key Differentiator | Last Assessed |
|---|---|---|---|
| (pending first collection) | - | - | - |

## Key Trends
(Pending first collection)

## Strategic Implications
(Pending first collection)

---
*Updated incrementally per C-22. Each update appended with date stamp.*
`);

// Initial threat model
writeFile(path.join(PALACE, 'cardinal', 'assessments', 'threat-model.md'), `# Threat Model — Running Assessment

## Last Updated: NOT YET INITIALIZED

## BLUF
No threat modeling has been performed yet. This document will be populated during Cardinal's first intelligence collection session.

## Threat Categories

### Technical Threats
| Threat | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|
| (pending first assessment) | - | - | - | - |

### Business Threats
| Threat | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|
| (pending first assessment) | - | - | - | - |

### Operational Threats
| Threat | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|
| (pending first assessment) | - | - | - | - |

## Assumptions (UNTESTED)
- All assumptions will be logged here per C-20 protocol
- Each marked TESTED or UNTESTED

## Risk Register
(Pending first assessment)

---
*Updated incrementally per C-22. Each update appended with date stamp.*
`);

// Initial technology radar
writeFile(path.join(PALACE, 'cardinal', 'assessments', 'technology-radar.md'), `# Technology Radar — Running Assessment

## Last Updated: NOT YET INITIALIZED

## BLUF
No technology assessment has been performed yet. This document tracks technologies relevant to the Three-Headed Monster across four rings.

## Adopt (use now)
- Next.js 16 — production proven in Stone AI
- Prisma 7 + PostgreSQL 16 + pgvector — current stack
- Tailwind + shadcn/ui — UI layer
- Clerk — auth (dev mode, prod migration pending)
- Stripe — payments (test mode, live migration pending)
- vLLM + Qwen 2.5 32B AWQ — local inference

## Trial (evaluate actively)
(Pending first assessment)

## Assess (watch closely)
(Pending first assessment)

## Hold (do not adopt)
(Pending first assessment)

## Emerging Technologies to Track
(Pending first assessment)

---
*Updated incrementally per C-22. Each update appended with date stamp.*
`);

// Initial blind spots document
writeFile(path.join(PALACE, 'cardinal', 'assessments', 'blind-spots.md'), `# Blind Spots — Running Assessment

## Last Updated: NOT YET INITIALIZED

## BLUF
This is Cardinal's most important document. It tracks what the Three-Headed Monster is NOT seeing.

## Active Blind Spots
| # | Blind Spot | Severity | First Identified | Status |
|---|---|---|---|---|
| 1 | No competitive intelligence baseline exists | HIGH | Install day | OPEN |
| 2 | No automated feed collection — all intel is manual | MEDIUM | Install day | OPEN |
| 3 | Production credentials migration not yet scheduled (Clerk, Stripe) | HIGH | Install day | OPEN |

## Resolved Blind Spots
| # | Blind Spot | Resolution | Date Resolved |
|---|---|---|---|
| (none yet) | - | - | - |

## Blind Spot Discovery Method
Per GS-3 and GS-6: After every analysis, ask:
1. "What am I missing?"
2. "What would disprove this?"
3. "What would the founder see that I'm not seeing?"

---
*Updated incrementally per C-22. Each update appended with date stamp.*
`);

console.log('[OK] Cardinal intelligence infrastructure initialized');

// ─── 10. WALLPAPER PERSISTENCE (REGISTRY) ──────────────────────────
console.log('');
console.log('--- 10. Wallpaper Persistence (Registry) ---');
r = run('reg add "HKCU\\Control Panel\\Desktop" /v Wallpaper /t REG_SZ /d "C:\\Users\\admin\\palace\\wallpaper.png" /f 2>&1');
if (r) { console.log('[OK] Registry wallpaper path set'); ok++; }
else { console.log('[FAIL] Registry wallpaper path'); fail++; }

r = run('reg add "HKCU\\Control Panel\\Desktop" /v WallpaperStyle /t REG_SZ /d "10" /f 2>&1');
if (r) { console.log('[OK] Registry wallpaper style set (fill)'); ok++; }
else { console.log('[FAIL] Registry wallpaper style'); fail++; }

r = run('reg add "HKCU\\Control Panel\\Desktop" /v TileWallpaper /t REG_SZ /d "0" /f 2>&1');
if (r) { console.log('[OK] Registry tile wallpaper disabled'); ok++; }
else { console.log('[FAIL] Registry tile wallpaper'); fail++; }

r = run('RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters 2>&1');
if (r !== null) { console.log('[OK] System parameters refreshed'); ok++; }
else { console.log('[WARN] System parameters refresh — may need logoff'); fail++; }

// ─── 11. TRINA SCREENSAVER ON IDLE ─────────────────────────────────
console.log('');
console.log('--- 11. Trina Screensaver on Idle ---');

// Enable screensaver via registry
r = run('reg add "HKCU\\Control Panel\\Desktop" /v ScreenSaveActive /t REG_SZ /d "1" /f 2>&1');
if (r) { console.log('[OK] Screensaver enabled in registry'); ok++; }
else { console.log('[FAIL] Screensaver registry enable'); fail++; }

r = run('reg add "HKCU\\Control Panel\\Desktop" /v ScreenSaveTimeOut /t REG_SZ /d "300" /f 2>&1');
if (r) { console.log('[OK] Screensaver timeout set (5 min)'); ok++; }
else { console.log('[FAIL] Screensaver timeout'); fail++; }

r = run('reg add "HKCU\\Control Panel\\Desktop" /v SCRNSAVE.EXE /t REG_SZ /d "C:\\Users\\admin\\palace\\trina-screensaver.bat" /f 2>&1');
if (r) { console.log('[OK] Screensaver exe set to Trina'); ok++; }
else { console.log('[FAIL] Screensaver exe registry key'); fail++; }

// Create scheduled task for Trina screensaver on idle
r = run(`powershell -Command "$action = New-ScheduledTaskAction -Execute 'C:\\Users\\admin\\palace\\trina-screensaver.bat'; $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -IdleDuration (New-TimeSpan -Minutes 5) -WaitTimeout (New-TimeSpan -Minutes 30) -StartWhenAvailable -IdleStop; $trigger = New-ScheduledTaskTrigger -AtLogOn; Register-ScheduledTask -TaskName 'PalaceScreensaver' -Action $action -Settings $settings -Trigger $trigger -Description 'Trina screensaver on idle' -Force" 2>&1`);
if (r) { console.log('[OK] PalaceScreensaver scheduled task created'); ok++; }
else { console.log('[FAIL] PalaceScreensaver task — may need admin'); fail++; }

// ─── 12. NEVER SLEEP POWER SETTINGS ────────────────────────────────
console.log('');
console.log('--- 12. Never Sleep Power Settings (vLLM Server) ---');

r = run('powercfg /change standby-timeout-ac 0 2>&1');
if (r !== null) { console.log('[OK] Sleep disabled (standby-timeout-ac 0)'); ok++; }
else { console.log('[FAIL] Could not disable sleep'); fail++; }

r = run('powercfg /change hibernate-timeout-ac 0 2>&1');
if (r !== null) { console.log('[OK] Hibernate disabled (hibernate-timeout-ac 0)'); ok++; }
else { console.log('[FAIL] Could not disable hibernate'); fail++; }

r = run('powercfg /change monitor-timeout-ac 15 2>&1');
if (r !== null) { console.log('[OK] Display off after 15 min (screensaver at 5 min first)'); ok++; }
else { console.log('[FAIL] Could not set monitor timeout'); fail++; }

// ─── SUMMARY ────────────────────────────────────────────────────────
console.log('');
console.log('========================================');
console.log(`  PALACE TOOLS INSTALLED`);
console.log(`  Success: ${ok} | Warnings: ${fail}`);
console.log('========================================');
console.log('');
console.log('VOICE COMMANDS (in PowerShell):');
console.log('  powershell C:\\Users\\admin\\palace\\scripts\\listen.ps1     — Continuous listen');
console.log('  powershell C:\\Users\\admin\\palace\\scripts\\say.ps1        — Quick 5-sec voice capture');
console.log('  powershell C:\\Users\\admin\\palace\\scripts\\speak.ps1 "hi" — Palace speaks');
console.log('');
console.log('SCREEN COMMANDS (in Palace CLI):');
console.log('  /screen  — Capture full screen');
console.log('  /clip    — Read clipboard image (use Win+Shift+S first)');
console.log('');
console.log('TOOLS:');
console.log('  Portainer:  https://localhost:9443');
console.log('  Uptime Kuma: http://localhost:3001');
console.log('  Trina screensaver: double-click trina-screensaver.bat');
console.log('');
console.log('Run the Palace: node C:\\Users\\admin\\palace\\palace.mjs');
