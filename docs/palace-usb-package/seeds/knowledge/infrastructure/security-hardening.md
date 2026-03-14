# Security Hardening — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. SSH Hardening

### Key-Only Authentication

```bash
# Generate SSH key pair (on client machine)
ssh-keygen -t ed25519 -C "stone@omen"
# Saves to ~/.ssh/id_ed25519 (private) and ~/.ssh/id_ed25519.pub (public)

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server
# Or manually:
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Test key-based login works BEFORE disabling password auth
ssh -i ~/.ssh/id_ed25519 user@server
```

### sshd Configuration

```bash
# /etc/ssh/sshd_config
Port 2222                          # Non-standard port (security through obscurity, minor)
PermitRootLogin no                 # Never allow root SSH
PasswordAuthentication no          # Key-only
PubkeyAuthentication yes           # Enable key auth
ChallengeResponseAuthentication no # Disable keyboard-interactive
UsePAM yes                         # Keep PAM for session management
MaxAuthTries 3                     # Max failed attempts
ClientAliveInterval 300            # Disconnect idle after 5 min
ClientAliveCountMax 2              # 2 missed keepalives = disconnect
AllowUsers stone                   # Whitelist specific users

# Apply changes
sudo systemctl restart sshd
```

### SSH Key Permissions

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519        # Private key
chmod 644 ~/.ssh/id_ed25519.pub    # Public key
chmod 600 ~/.ssh/authorized_keys   # Authorized keys
chmod 644 ~/.ssh/config            # SSH client config
chmod 644 ~/.ssh/known_hosts       # Known hosts
```

### fail2ban

```bash
# Install
sudo apt install fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600        # Ban for 1 hour
findtime = 600        # Look at last 10 minutes
maxretry = 3          # 3 failures = ban
ignoreip = 127.0.0.1/8  # Never ban localhost

[sshd]
enabled = true
port = 2222           # Match your SSH port
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
```

```bash
# Start and enable
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status sshd

# Unban an IP
sudo fail2ban-client set sshd unbanip 192.168.1.100
```

---

## 2. Secrets Management

### The Rules

1. **Never in git.** Ever. Not even "temporarily."
2. **Never in Docker images.** Use env vars or secrets mounts.
3. **Never in logs.** Sanitize before logging.
4. **Never in URLs.** Query params get logged by proxies.

### .env File Security

```bash
# Set restrictive permissions
chmod 600 .env

# Verify
ls -la .env
# Should show: -rw------- 1 stone stone ... .env

# .gitignore (MUST include)
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore
```

### Environment Variable Hygiene

```bash
# DON'T pass secrets as command arguments (visible in ps)
# BAD:
vllm-server --api-key sk-abc123

# DO use environment variables
# GOOD:
export API_KEY=sk-abc123
vllm-server  # reads from env

# DON'T export secrets in .bashrc (persists in shell history)
# DO use a sourced env file
source /secure/path/.env
```

### Rotation Patterns

| Secret Type | Rotation Frequency | Method |
|---|---|---|
| Database passwords | Every 90 days | Generate new, update .env, restart services |
| API keys | Every 90 days or on suspected compromise | Regenerate in provider dashboard |
| JWT secrets | Every 90 days | Update secret, existing tokens expire naturally |
| SSL certificates | Auto (Let's Encrypt 90-day) | certbot auto-renew |
| SSH keys | Yearly or on personnel change | Generate new pair, update authorized_keys |

### Leak Detection

```bash
# Scan git history for secrets
# Install trufflehog or gitleaks
# trufflehog:
trufflehog git file://. --only-verified

# Manual check for common patterns
grep -rn "sk-\|password\|secret\|api_key\|PRIVATE KEY" --include="*.ts" --include="*.js" --include="*.env" .

# Check if .env is tracked by git
git ls-files .env
# If it returns ".env", it's tracked — remove it:
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env from tracking"
```

---

## 3. Encryption

### At-Rest Encryption (LUKS)

```bash
# Create an encrypted volume (for sensitive data)
sudo cryptsetup luksFormat /dev/sdX
sudo cryptsetup open /dev/sdX secure-data
sudo mkfs.ext4 /dev/mapper/secure-data
sudo mount /dev/mapper/secure-data /mnt/secure

# Close when done
sudo umount /mnt/secure
sudo cryptsetup close secure-data
```

### In-Transit Encryption (TLS)

All external communication must use TLS:
- HTTPS for web traffic (nginx with SSL)
- TLS for database connections (PostgreSQL ssl_mode)
- TLS for Redis (if exposed beyond localhost)

```bash
# Verify a server's TLS configuration
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net </dev/null 2>/dev/null | head -20

# Check TLS version and cipher
curl -v https://stone-ai.net 2>&1 | grep -E "TLS|SSL|cipher"
```

### AES-256-GCM (Stone AI Application Pattern)

Stone AI uses AES-256-GCM for encrypting sensitive data in the database:

```
Key derivation: PBKDF2 or direct 256-bit key
IV: Random 12 bytes per encryption (NEVER reuse)
Auth tag: 16 bytes (included in ciphertext)
Format: IV (12 bytes) + ciphertext + auth tag (16 bytes)
```

Key management rules:
- Encryption key in env var (`ENCRYPTION_KEY`), never in code
- Key must be 32 bytes (256 bits) of cryptographic randomness
- Generate: `openssl rand -hex 32`
- Rotate: decrypt with old key, re-encrypt with new key, update env

---

## 4. Audit Logging

### What to Log

| Category | Events | Priority |
|---|---|---|
| **Authentication** | Login, logout, failed login, password change | MUST |
| **Authorization** | Permission denied, role change, admin actions | MUST |
| **Data access** | Sensitive data read, bulk export, API key usage | SHOULD |
| **Data mutation** | Create, update, delete on critical tables | MUST |
| **System events** | Service start/stop, config change, deployment | MUST |
| **Security events** | Rate limit hit, blocked request, suspicious pattern | MUST |

### Audit Log Format

```json
{
  "timestamp": "2024-01-15T12:30:45.123Z",
  "event": "user.login",
  "actor": {
    "id": "user_abc123",
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  },
  "resource": {
    "type": "session",
    "id": "sess_xyz789"
  },
  "result": "success",
  "metadata": {
    "method": "clerk_oauth",
    "mfa_used": false
  }
}
```

### Tamper-Resistant Storage

```bash
# Option 1: Append-only log file
sudo chattr +a /var/log/stone-ai/audit.log
# Now the file can only be appended to, not modified or deleted
# Even root can't modify (must remove attribute first: chattr -a)

# Option 2: Separate logging server/service
# Send audit logs to a different system via syslog or HTTP

# Option 3: Database with no DELETE permission
# CREATE ROLE audit_writer;
# GRANT INSERT ON audit_log TO audit_writer;
# -- No UPDATE or DELETE granted
```

### Retention Policies

| Log Type | Retention | Reason |
|---|---|---|
| Security audit | 1 year | Compliance, incident investigation |
| Access logs | 90 days | Usage analysis, debugging |
| Application logs | 30 days | Debugging |
| Debug logs | 7 days | Immediate troubleshooting only |

---

## 5. Container Security

### Non-Root Containers

```dockerfile
# Create a non-root user in Dockerfile
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser
CMD ["node", "server.js"]
```

```yaml
# In docker-compose.yml
services:
  api:
    user: "1001:1001"  # Run as specific UID:GID
```

### Read-Only Root Filesystem

```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    volumes:
      - app-data:/app/data  # Only specific dirs are writable
```

### Capability Limiting

```yaml
services:
  api:
    cap_drop:
      - ALL  # Drop ALL Linux capabilities
    cap_add:
      - NET_BIND_SERVICE  # Only add what's absolutely needed
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation
```

### Image Scanning with Trivy

```bash
# Install trivy
sudo apt install trivy

# Scan an image
trivy image node:20-alpine

# Scan with severity filter
trivy image --severity HIGH,CRITICAL myapp:latest

# Scan local filesystem
trivy fs --security-checks vuln,config /path/to/project

# Exit with error if vulnerabilities found (for CI)
trivy image --exit-code 1 --severity CRITICAL myapp:latest
```

---

## 6. Dependency Security

### npm Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (patch/minor updates)
npm audit fix

# Fix including major version updates (REVIEW CHANGES)
npm audit fix --force

# Generate report
npm audit --json > audit-report.json

# Check specific package
npm ls <package-name>
```

### pip Audit (Python/vLLM)

```bash
# Install pip-audit
pip install pip-audit

# Scan installed packages
pip-audit

# Scan requirements file
pip-audit -r requirements.txt
```

### Update Strategies

| Strategy | Risk | Speed | Use When |
|---|---|---|---|
| **Pin exact versions** | Lowest | Slowest updates | Production dependencies |
| **Allow patch updates** | Low | Moderate | `"package": "~1.2.3"` |
| **Allow minor updates** | Medium | Fast | `"package": "^1.2.3"` |
| **Latest** | High | Fastest | Development only |

### CVE Monitoring

```bash
# Subscribe to GitHub security advisories for your repos
# GitHub → Settings → Code security and analysis → Dependabot alerts

# Manual check
# https://nvd.nist.gov/vuln/search — search by package name
# https://snyk.io/vuln — search by ecosystem + package
```

---

## 7. Application Security Checklist (Stone AI)

### Input Validation

- [ ] Zod `.strict()` on ALL mutation schemas (rejects unknown fields)
- [ ] No raw `req.body` access — always validate through Zod first
- [ ] File upload: validate type, size, and content (not just extension)
- [ ] SQL: Prisma handles parameterization — never use raw SQL with string concatenation

### Authentication & Authorization

- [ ] Clerk handles auth (don't roll your own)
- [ ] Every API route checks auth before processing
- [ ] Admin routes check role/permission explicitly
- [ ] Rate limiting on auth endpoints (prevent brute force)

### Headers & CORS

```typescript
// Next.js middleware security headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; ...",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
};
```

### Known Vulnerability Patterns (Stone AI Specific)

| Pattern | Protection | Status |
|---|---|---|
| SVG XSS in avatars | Block SVG data URIs, allow only png/jpeg/webp/gif base64 | Fixed |
| Easter egg replay | Claims on User model (survives bestie deletion) | Fixed |
| Badge manipulation | Server-side only, no direct write endpoints | Protected |
| Referral abuse | `@@unique` enforced on referral codes | Protected |

---

## 8. Network Security

### Principle of Least Exposure

```
Internet → Cloudflare (DDoS + WAF) → Vercel (Next.js) → Neon (DB)
                                                        ↘ vLLM (OMEN, localhost only)
```

- Only Cloudflare faces the internet
- Vercel is behind Cloudflare
- Database (Neon) accepts connections only from Vercel's IP range
- vLLM on OMEN is localhost-only — never exposed to the internet

### Docker Network Isolation

```yaml
networks:
  backend:
    driver: bridge
    internal: true  # No internet access for backend network
  frontend:
    driver: bridge  # Internet access for frontend network

services:
  db:
    networks:
      - backend  # Only accessible from backend network
  api:
    networks:
      - backend   # Can reach DB
      - frontend  # Can reach internet
  nginx:
    networks:
      - frontend  # Faces the internet
```

---

## 9. Security Incident Response

### If You Suspect a Breach

```bash
# 1. CAPTURE EVIDENCE FIRST (before changing anything)
# Snapshot current state
docker ps -a > /tmp/incident-docker-$(date +%s).txt
ss -tlnp > /tmp/incident-ports-$(date +%s).txt
ps aux > /tmp/incident-processes-$(date +%s).txt
last > /tmp/incident-logins-$(date +%s).txt
cat /var/log/auth.log > /tmp/incident-auth-$(date +%s).txt

# 2. CONTAIN
# Block suspicious IPs
sudo ufw deny from <suspicious-ip>
# Rotate exposed credentials immediately
# Kill suspicious processes

# 3. INVESTIGATE
# Check auth logs for unauthorized access
grep "Failed password\|Accepted" /var/log/auth.log | tail -50
# Check for unexpected processes
ps aux | grep -v "expected-process"
# Check for unexpected network connections
ss -tuanp | grep ESTABLISHED
# Check for modified files
find /app -newer /app/package.json -type f  # Files modified after deploy

# 4. REMEDIATE
# Rotate ALL credentials (assume everything is compromised)
# Patch the vulnerability
# Restore from known-good backup if data was modified

# 5. REPORT TO FOUNDER
# Use sendFounderAlert() or direct communication
# Include: what happened, when, what data was affected, what was done
```

### Credential Rotation Checklist

- [ ] Database password
- [ ] Clerk API keys
- [ ] Stripe API keys
- [ ] Anthropic API key
- [ ] JWT/session secrets
- [ ] Encryption key (re-encrypt data)
- [ ] SSH keys (if compromised)
- [ ] GitHub tokens

---

## 10. Quick Reference Card

| Task | Command |
|---|---|
| Check SSH config | `sudo sshd -t` |
| Restart SSH | `sudo systemctl restart sshd` |
| fail2ban status | `sudo fail2ban-client status sshd` |
| Unban IP | `sudo fail2ban-client set sshd unbanip <ip>` |
| File permissions | `chmod 600 .env && chmod 700 ~/.ssh` |
| Generate secret | `openssl rand -hex 32` |
| Scan for secrets in git | `grep -rn "sk-\|password\|secret" --include="*.ts" .` |
| npm audit | `npm audit` |
| Scan Docker image | `trivy image myapp:latest` |
| Make file append-only | `sudo chattr +a /var/log/audit.log` |
| Check TLS config | `openssl s_client -connect host:443 </dev/null` |
| Check cert expiry | `sudo certbot certificates` |
| UFW status | `sudo ufw status verbose` |
| Block IP | `sudo ufw deny from <ip>` |
