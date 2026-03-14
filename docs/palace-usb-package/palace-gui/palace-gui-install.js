#!/usr/bin/env node
// THE PALACE — GUI Installer
// Chaos (#44) — Infrastructure
// GS-5 Idempotent: safe to run multiple times

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const SOURCE_DIR = path.join(__dirname);
const TARGET_DIR = 'C:\\Users\\admin\\palace\\gui';
const BAT_NAME = 'start-palace-gui.bat';
const BAT_PATH = path.join(TARGET_DIR, BAT_NAME);

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip node_modules — we'll npm install fresh at target
    if (entry.name === 'node_modules') continue;
    // Skip the installer itself
    if (entry.name === 'palace-gui-install.js') continue;

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createDesktopShortcut() {
  const desktopDir = path.join('C:\\Users\\admin\\Desktop');
  if (!fs.existsSync(desktopDir)) {
    console.log('[WARN] Desktop folder not found at', desktopDir);
    return false;
  }

  const shortcutPath = path.join(desktopDir, 'Palace GUI.lnk');

  // Use PowerShell to create a proper .lnk shortcut
  const psScript = `
$ws = New-Object -ComObject WScript.Shell;
$s = $ws.CreateShortcut('${shortcutPath.replace(/\\/g, '\\\\')}');
$s.TargetPath = '${BAT_PATH.replace(/\\/g, '\\\\')}';
$s.WorkingDirectory = '${TARGET_DIR.replace(/\\/g, '\\\\')}';
$s.Description = 'Palace GUI Control Panel';
$s.WindowStyle = 1;
$s.Save();
`.trim();

  try {
    execSync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      stdio: 'pipe'
    });
    console.log('[OK] Desktop shortcut created:', shortcutPath);
    return true;
  } catch (e) {
    console.log('[WARN] Could not create desktop shortcut:', e.message);
    return false;
  }
}

function addToStartup() {
  const startupDir = path.join('C:\\Users\\admin\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup');

  if (!fs.existsSync(startupDir)) {
    console.log('[WARN] Startup folder not found at', startupDir);
    return false;
  }

  const shortcutPath = path.join(startupDir, 'Palace GUI.lnk');

  // Idempotent: overwrite if exists
  const psScript = `
$ws = New-Object -ComObject WScript.Shell;
$s = $ws.CreateShortcut('${shortcutPath.replace(/\\/g, '\\\\')}');
$s.TargetPath = '${BAT_PATH.replace(/\\/g, '\\\\')}';
$s.WorkingDirectory = '${TARGET_DIR.replace(/\\/g, '\\\\')}';
$s.Description = 'Palace GUI - Auto Start';
$s.WindowStyle = 7;
$s.Save();
`.trim();

  try {
    execSync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      stdio: 'pipe'
    });
    console.log('[OK] Startup shortcut created:', shortcutPath);
    return true;
  } catch (e) {
    console.log('[WARN] Could not create startup shortcut:', e.message);
    return false;
  }
}

function main() {
  console.log('');
  console.log('=== PALACE GUI INSTALLER ===');
  console.log('=== Chaos (#44) — Infrastructure ===');
  console.log('');

  // Step 1: Copy files
  console.log('[1/4] Copying Palace GUI to', TARGET_DIR);
  try {
    copyDirSync(SOURCE_DIR, TARGET_DIR);
    console.log('[OK] Files copied.');
  } catch (e) {
    console.error('[FAIL] Could not copy files:', e.message);
    return;
  }

  // Step 2: npm install at target
  console.log('[2/4] Installing dependencies...');
  try {
    execSync('npm install', {
      cwd: TARGET_DIR,
      stdio: 'inherit',
      shell: true
    });
    console.log('[OK] Dependencies installed.');
  } catch (e) {
    console.log('[WARN] npm install had issues:', e.message);
    console.log('[WARN] You may need to run "npm install" manually in', TARGET_DIR);
  }

  // Step 3: Desktop shortcut
  console.log('[3/4] Creating desktop shortcut...');
  createDesktopShortcut();

  // Step 4: Startup auto-launch
  console.log('[4/4] Adding to Windows Startup...');
  addToStartup();

  console.log('');
  console.log('=== PALACE GUI INSTALL COMPLETE ===');
  console.log('Location:', TARGET_DIR);
  console.log('Launch:  Double-click "Palace GUI" on Desktop');
  console.log('         Or run:', BAT_PATH);
  console.log('');
}

main();

module.exports = main;
