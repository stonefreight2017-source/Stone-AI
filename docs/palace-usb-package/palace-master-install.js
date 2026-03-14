#!/usr/bin/env node
// THE PALACE — Master Installer
// Stone (Head 1) + Chaos (#44) + Computer Wiz (#45)
// ONE COMMAND: node palace-master-install.js

const path = require('path');
const { execSync } = require('child_process');

const dir = __dirname; // USB directory where all files live

console.log('');
console.log('=== THE PALACE — MASTER INSTALLER ===');
console.log('=== Stone + Chaos + Computer Wiz ===');
console.log('');

// Phase 1: Patch palace.mjs
console.log('=== PHASE 1: Patching Palace Brain ===');
try {
  require(path.join(dir, 'patch-palace.js'));
} catch(e) {
  // patch-palace.js calls main() which runs inline, so if it throws we catch here
  console.log('[WARN] Phase 1 had issues:', e.message);
}

console.log('');
console.log('=== PHASE 2: Installing Tools ===');

// Phase 2: Install tools
try {
  require(path.join(dir, 'install-palace-tools.js'));
} catch(e) {
  console.log('[WARN] Phase 2 had issues:', e.message);
}

console.log('');
console.log('=== PHASE 3: Installing Palace GUI ===');

// Phase 3: Install GUI control panel
try {
  require(path.join(dir, 'palace-gui', 'palace-gui-install.js'));
} catch(e) {
  console.log('[WARN] Phase 3 had issues:', e.message);
  console.log('[WARN] You can install GUI manually: node palace-gui/palace-gui-install.js');
}

console.log('');
console.log('=== PHASE 4: Starting Palace ===');

// Phase 4: Auto-start the Palace
try {
  const { spawn } = require('child_process');
  spawn('node', ['C:\\Users\\admin\\palace\\palace.mjs'], {
    stdio: 'inherit',
    shell: true,
    detached: false
  });
} catch(e) {
  console.log('Run manually: node C:\\Users\\admin\\palace\\palace.mjs');
}
