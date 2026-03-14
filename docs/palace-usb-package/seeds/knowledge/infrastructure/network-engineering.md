# Network Engineering — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Reverse Proxy — nginx

### Basic nginx Configuration for Stone AI

```nginx
# /etc/nginx/sites-available/stone-ai
server {
    listen 80;
    server_name stone-ai.local;

    # Redirect HTTP to HTTPS (when using SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3000;  # Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # vLLM API proxy (optional — if exposing externally)
    location /v1/ {
        proxy_pass http://127.0.0.1:8000/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Streaming support for SSE
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        # Long timeout for LLM inference
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_connect_timeout 10s;
    }
}
```

### WebSocket Support (for Chat Streaming)

```nginx
# WebSocket upgrade handling
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name stone-ai.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout for WebSocket connections
        proxy_read_timeout 86400s;  # 24 hours
        proxy_send_timeout 86400s;
    }
}
```

### Upstream Configuration (Load Balancing / Failover)

```nginx
# Multiple vLLM instances
upstream vllm_backend {
    server 127.0.0.1:8000 weight=3;  # Primary (higher weight)
    server 127.0.0.1:8001 weight=1;  # Secondary
    server 127.0.0.1:8002 backup;    # Only used when others are down
}

server {
    location /v1/ {
        proxy_pass http://vllm_backend/v1/;
        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_timeout 10s;
        proxy_next_upstream_tries 2;
    }
}
```

### Timeout Configuration

| Directive | Default | Recommendation | Purpose |
|---|---|---|---|
| `proxy_connect_timeout` | 60s | 10s | Time to establish connection to upstream |
| `proxy_send_timeout` | 60s | 60s | Time between successive writes to upstream |
| `proxy_read_timeout` | 60s | 300s | Time between successive reads from upstream |
| `client_max_body_size` | 1m | 10m | Max request body size |
| `keepalive_timeout` | 75s | 65s | Keep-alive connection timeout |

### nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload (no downtime)
sudo nginx -s reload

# Start/stop
sudo systemctl start nginx
sudo systemctl stop nginx

# View access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log

# Check connections
ss -tlnp | grep nginx
```

---

## 2. Caddy Alternative

Caddy is simpler than nginx and handles SSL automatically.

```
# /etc/caddy/Caddyfile
stone-ai.local {
    reverse_proxy localhost:3000

    handle_path /v1/* {
        reverse_proxy localhost:8000 {
            flush_interval -1  # Streaming support
            transport http {
                read_timeout 300s
            }
        }
    }
}
```

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Start
sudo systemctl start caddy

# Reload config
sudo systemctl reload caddy
```

---

## 3. SSL/TLS

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (nginx plugin handles config automatically)
sudo certbot --nginx -d stone-ai.net -d www.stone-ai.net

# Get certificate (standalone — for when nginx isn't running)
sudo certbot certonly --standalone -d stone-ai.net

# Certificate location
# /etc/letsencrypt/live/stone-ai.net/fullchain.pem  (certificate + chain)
# /etc/letsencrypt/live/stone-ai.net/privkey.pem    (private key)
```

### Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Actual renewal
sudo certbot renew

# Auto-renewal cron (certbot usually sets this up)
# 0 0,12 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"

# Check certificate expiry
sudo certbot certificates
# Or:
echo | openssl s_client -servername stone-ai.net -connect stone-ai.net:443 2>/dev/null | openssl x509 -noout -dates
```

### nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name stone-ai.net;

    ssl_certificate /etc/letsencrypt/live/stone-ai.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stone-ai.net/privkey.pem;

    # Modern SSL config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... rest of proxy config
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name stone-ai.net;
    return 301 https://$server_name$request_uri;
}
```

### Chain Verification

```bash
# Verify the full chain
openssl verify -CAfile /etc/letsencrypt/live/stone-ai.net/chain.pem \
  /etc/letsencrypt/live/stone-ai.net/cert.pem

# Check what's served
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net </dev/null 2>/dev/null | openssl x509 -text -noout | head -20

# Common error: "unable to get local issuer certificate"
# Fix: Use fullchain.pem (cert + intermediate) not just cert.pem
```

### Common SSL Errors

**Symptom**: `ERR_CERT_AUTHORITY_INVALID`
**Fix**: Use `fullchain.pem` not `cert.pem` for `ssl_certificate`

**Symptom**: `ERR_SSL_PROTOCOL_ERROR`
**Fix**: Check `ssl_protocols` includes TLSv1.2 or TLSv1.3

**Symptom**: Certificate expired
**Fix**: `sudo certbot renew --force-renewal && sudo systemctl reload nginx`

---

## 4. DNS

### Record Types

| Type | Purpose | Example |
|---|---|---|
| **A** | Domain to IPv4 | `stone-ai.net → 104.21.x.x` |
| **AAAA** | Domain to IPv6 | `stone-ai.net → 2606:4700::xxxx` |
| **CNAME** | Alias to another domain | `www → stone-ai.net` |
| **MX** | Mail server | `stone-ai.net → mail.provider.com` |
| **TXT** | Verification, SPF, DKIM | SPF records, domain verification |

### TTL Strategy

| Situation | TTL | Why |
|---|---|---|
| Normal operation | 3600 (1 hour) | Balanced cache/freshness |
| Before migration | 300 (5 min) | Quick propagation for IP change |
| During migration | 60 (1 min) | Fastest possible propagation |
| After migration stable | 86400 (24 hours) | Maximum caching |

### Cloudflare Proxy Mode (Stone AI Production)

Stone AI uses Cloudflare with proxy ON (orange cloud):

```
Browser → Cloudflare (CDN + DDoS protection) → Origin server (Vercel)
```

| Setting | Value | Why |
|---|---|---|
| Proxy | ON (orange cloud) | DDoS protection, CDN, SSL termination |
| SSL mode | Full (Strict) | End-to-end encryption with valid cert |
| Always Use HTTPS | ON | Force HTTPS |
| Min TLS Version | 1.2 | Block old insecure clients |

**Gotcha**: With Cloudflare proxy ON, `A` records point to Cloudflare IPs, not your origin. This is normal and expected.

### DNS Debugging

```bash
# Lookup A record
dig stone-ai.net A +short

# Lookup with full info
dig stone-ai.net ANY

# Check specific nameserver
dig @8.8.8.8 stone-ai.net A

# Trace propagation
dig +trace stone-ai.net

# Check from inside WSL2
nslookup stone-ai.net

# If DNS is wrong, check TTL
dig stone-ai.net A | grep -A1 "ANSWER SECTION"
# The number is the remaining TTL in seconds
```

### Split-Horizon DNS

For local development, override DNS locally:

```bash
# /etc/hosts (Linux/WSL2)
127.0.0.1 stone-ai.local
127.0.0.1 api.stone-ai.local

# C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 stone-ai.local
```

---

## 5. Firewall

### UFW (Uncomplicated Firewall)

```bash
# Enable
sudo ufw enable

# Status
sudo ufw status verbose

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow specific ports
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 22/tcp      # SSH (if needed)

# Allow from specific IP
sudo ufw allow from 192.168.1.100 to any port 8000

# Allow from subnet
sudo ufw allow from 192.168.1.0/24 to any port 5432

# Deny a port
sudo ufw deny 5432/tcp

# Remove a rule
sudo ufw delete allow 80/tcp

# Rate limiting (basic brute-force protection)
sudo ufw limit 22/tcp  # Max 6 connections in 30 seconds
```

### iptables (Lower Level)

```bash
# List current rules
sudo iptables -L -n -v

# Allow port 8000 from localhost only
sudo iptables -A INPUT -p tcp --dport 8000 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8000 -j DROP

# Save rules (Ubuntu)
sudo iptables-save > /etc/iptables.rules
# Restore on boot:
# Add to /etc/rc.local: iptables-restore < /etc/iptables.rules
```

### Docker Bypasses UFW (CRITICAL GOTCHA)

Docker adds its own iptables rules that bypass UFW entirely.

```bash
# Even with this:
sudo ufw deny 5432

# Docker will still expose port 5432 if you use:
ports:
  - "5432:5432"

# FIX: Always bind to 127.0.0.1 in docker-compose.yml
ports:
  - "127.0.0.1:5432:5432"
```

### Rate Limiting with nginx

```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        # Allows 10 req/s steady, burst of 20, no delay
        proxy_pass http://127.0.0.1:3000;
    }

    location /v1/ {
        limit_req zone=api burst=5;
        # Stricter for LLM API — 10 req/s, burst of 5
        proxy_pass http://127.0.0.1:8000;
    }
}
```

---

## 6. Port Management

### Stone AI Standard Port Assignments

| Port | Service | Binding |
|---|---|---|
| 3000 | Next.js (dev/local) | `127.0.0.1` |
| 5432 | PostgreSQL (stoneai-db) | `127.0.0.1` |
| 6379 | Redis | `127.0.0.1` |
| 8000 | vLLM (primary chat model) | `127.0.0.1` |
| 8001 | vLLM (vision model, when active) | `127.0.0.1` |
| 80 | nginx HTTP | `0.0.0.0` (if exposed) |
| 443 | nginx HTTPS | `0.0.0.0` (if exposed) |

### Port Conflict Detection

```bash
# Find what's using a specific port
ss -tlnp | grep :8000

# Find all listening ports
ss -tlnp

# From the Windows side (PowerShell):
# netstat -ano | findstr :8000

# Kill process on a port (careful!)
kill $(ss -tlnp | grep :8000 | awk '{print $NF}' | grep -o 'pid=[0-9]*' | cut -d= -f2)
```

### 0.0.0.0 vs 127.0.0.1

| Binding | Accessible From | Use For |
|---|---|---|
| `127.0.0.1:8000` | Only the local machine | Internal services (DB, Redis, vLLM) |
| `0.0.0.0:8000` | Any network interface | Public-facing services (nginx) |
| `localhost:8000` | Usually same as 127.0.0.1 | Development |

**Rule**: Everything except the reverse proxy (nginx) should bind to `127.0.0.1`.

---

## 7. Network Debugging

### Common Tools

```bash
# Test connectivity
ping -c 3 google.com

# Test specific port
nc -zv localhost 8000
# or
timeout 3 bash -c "echo > /dev/tcp/localhost/8000" && echo "Open" || echo "Closed"

# Trace route
traceroute google.com

# DNS lookup
dig stone-ai.net
nslookup stone-ai.net

# HTTP request with details
curl -v http://localhost:8000/health

# HTTP timing breakdown
curl -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nFirst byte: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null -s http://localhost:8000/health

# Continuous connectivity test
while true; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8000/health)
  echo "$(date '+%H:%M:%S') - HTTP $code"
  sleep 5
done
```

### WSL2-Specific Network Issues

**Symptom**: WSL2 can't reach the internet but Windows can.

**Fix**:
```bash
# Check DNS
cat /etc/resolv.conf
# If it's pointing to a Windows IP that's not responding:
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

**Symptom**: Windows can't reach WSL2 services on localhost.

**Fix**:
```bash
# Check if localhostForwarding is enabled
# In C:\Users\stone\.wslconfig:
# [wsl2]
# localhostForwarding=true

# Restart WSL after changing
# wsl --shutdown (from PowerShell)
```

**Symptom**: External machines can't reach services in WSL2.

**Fix**: Use Windows port forwarding:
```powershell
# PowerShell (Admin)
netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=127.0.0.1
# Also ensure Windows Firewall allows the port
netsh advfirewall firewall add rule name="WSL2 vLLM" dir=in action=allow protocol=tcp localport=8000
```

---

## 8. Quick Reference Card

| Task | Command |
|---|---|
| Test nginx config | `sudo nginx -t` |
| Reload nginx | `sudo nginx -s reload` |
| Check SSL cert expiry | `sudo certbot certificates` |
| Renew SSL certs | `sudo certbot renew` |
| DNS lookup | `dig stone-ai.net A +short` |
| Check listening ports | `ss -tlnp` |
| Check who's on a port | `ss -tlnp \| grep :<port>` |
| UFW status | `sudo ufw status verbose` |
| Allow port | `sudo ufw allow <port>/tcp` |
| Test connectivity | `nc -zv <host> <port>` |
| HTTP timing | `curl -w "Total: %{time_total}s\n" -o /dev/null -s <url>` |
| Port forward (Windows) | `netsh interface portproxy add v4tov4 ...` |
| List port forwards | `netsh interface portproxy show all` |
