# DNS & SSL Management — Palace Infrastructure Seed

## Chaos Directive: DNS and Certificates for the Three-Headed Monster

Stone AI runs three businesses on one domain infrastructure: stone-ai.net, tools.stone-ai.net, and the mobile app backend. Cloudflare DNS with proxy enabled, SSL Full mode, and proper subdomain management. This seed covers all of it.

---

## 1. Cloudflare DNS Architecture

### 1.1 Current DNS Layout

```
stone-ai.net (Three-Headed Monster Domain)
─────────────────────────────────────────────────
RECORD    NAME                    VALUE                    PROXY    TTL
─────────────────────────────────────────────────
A         stone-ai.net            76.76.21.21 (Vercel)     ON       Auto
CNAME     www                     cname.vercel-dns.com     ON       Auto
CNAME     tools                   cname.vercel-dns.com     ON       Auto
A         api                     <OMEN public IP>         ON       Auto
A         omen                    <OMEN public IP>         ON       Auto
CNAME     _vercel                 cname.vercel-dns.com     OFF      Auto
TXT       _dmarc                  v=DMARC1;...             OFF      Auto
TXT       @                       v=spf1 ...               OFF      Auto
MX        @                       mx1.google.com           OFF      Auto
MX        @                       mx2.google.com           OFF      Auto
```

### 1.2 Cloudflare API Management

```bash
# Environment variables
export CF_API_TOKEN="your-cloudflare-api-token"
export CF_ZONE_ID="your-zone-id"

# List all DNS records
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result[] | {name, type, content, proxied}'

# Add DNS record
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "api",
    "content": "YOUR_IP",
    "ttl": 1,
    "proxied": true
  }'

# Update DNS record
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/RECORD_ID" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "content": "NEW_IP"
  }'

# Delete DNS record
curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/RECORD_ID" \
  -H "Authorization: Bearer $CF_API_TOKEN"
```

### 1.3 Subdomain Strategy for Three Products

```
stone-ai.net          → Vercel (Stone AI main app)
www.stone-ai.net      → Vercel (redirect to apex)
tools.stone-ai.net    → Vercel (Stone AI Tools)
api.stone-ai.net      → OMEN (self-hosted API/inference)
app.stone-ai.net      → Vercel (Best AI mobile backend)
status.stone-ai.net   → Status page (Uptime Kuma)
docs.stone-ai.net     → Documentation (future)
admin.stone-ai.net    → Admin panel (future)
```

### 1.4 Dynamic DNS for OMEN

The OMEN's public IP can change. Use dynamic DNS to keep records updated.

```bash
#!/bin/bash
# ddns-update.sh — Update Cloudflare DNS when IP changes
set -euo pipefail

CF_API_TOKEN="${CF_API_TOKEN}"
CF_ZONE_ID="${CF_ZONE_ID}"
RECORD_NAME="omen.stone-ai.net"
RECORD_ID="${CF_OMEN_RECORD_ID}"

# Get current public IP
CURRENT_IP=$(curl -s https://api.ipify.org)

# Get DNS record IP
DNS_IP=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq -r '.result.content')

if [ "$CURRENT_IP" != "$DNS_IP" ]; then
    echo "$(date): IP changed from $DNS_IP to $CURRENT_IP — updating DNS"

    curl -s -X PATCH \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"content\": \"$CURRENT_IP\"}"

    # Update API record too
    curl -s -X PATCH \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_API_RECORD_ID" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"content\": \"$CURRENT_IP\"}"

    echo "DNS records updated successfully"
else
    echo "$(date): IP unchanged ($CURRENT_IP)"
fi

# Run every 5 minutes via cron:
# */5 * * * * /opt/scripts/ddns-update.sh >> /var/log/ddns.log 2>&1
```

---

## 2. SSL/TLS Configuration

### 2.1 Cloudflare SSL Modes

```
Mode          │ Description                    │ Use Case
──────────────┼────────────────────────────────┼─────────────
Off           │ No encryption                  │ NEVER
Flexible      │ CF→User HTTPS, CF→Origin HTTP  │ NEVER (insecure)
Full          │ CF→User HTTPS, CF→Origin HTTPS │ Current setup ✓
Full (Strict) │ Full + validates origin cert   │ Recommended upgrade
```

**Current: Full mode.** Cloudflare terminates SSL and re-encrypts to origin. The origin (Vercel) has its own valid certificate.

**Upgrade to Full (Strict):**
- Requires valid certificate on origin server
- Vercel provides this automatically
- For OMEN self-hosted: use Cloudflare Origin CA certificate

### 2.2 Cloudflare Origin CA Certificate

For the OMEN (api.stone-ai.net, omen.stone-ai.net):

```bash
# Generate Origin CA certificate via Cloudflare dashboard
# Dashboard → SSL/TLS → Origin Server → Create Certificate

# Or via API:
curl -s -X POST "https://api.cloudflare.com/client/v4/certificates" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostnames": ["api.stone-ai.net", "omen.stone-ai.net", "*.stone-ai.net"],
    "requested_validity": 5475,
    "request_type": "origin-rsa",
    "csr": ""
  }' | jq '.result | {certificate, private_key}'

# Save certificate and key
# /etc/ssl/cloudflare/origin.pem
# /etc/ssl/cloudflare/origin-key.pem

# Nginx configuration with Origin CA cert
server {
    listen 443 ssl http2;
    server_name api.stone-ai.net;

    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin-key.pem;

    # Only accept connections from Cloudflare IPs
    # https://www.cloudflare.com/ips/
    allow 173.245.48.0/20;
    allow 103.21.244.0/22;
    allow 103.22.200.0/22;
    allow 103.31.4.0/22;
    allow 141.101.64.0/18;
    allow 108.162.192.0/18;
    allow 190.93.240.0/20;
    allow 188.114.96.0/20;
    allow 197.234.240.0/22;
    allow 198.41.128.0/17;
    allow 162.158.0.0/15;
    allow 104.16.0.0/13;
    allow 104.24.0.0/14;
    allow 172.64.0.0/13;
    allow 131.0.72.0/22;
    deny all;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2.3 Let's Encrypt Automation

For self-hosted services that don't go through Cloudflare:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.stone-ai.net -d omen.stone-ai.net

# DNS challenge (for wildcard certs, when Cloudflare proxy blocks HTTP challenge)
sudo certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
    -d "*.stone-ai.net" \
    -d "stone-ai.net"

# /etc/letsencrypt/cloudflare.ini
# dns_cloudflare_api_token = YOUR_CF_API_TOKEN

# Auto-renewal (certbot installs a systemd timer by default)
sudo certbot renew --dry-run

# Manual renewal check
sudo certbot certificates

# Certificate locations
# /etc/letsencrypt/live/stone-ai.net/fullchain.pem
# /etc/letsencrypt/live/stone-ai.net/privkey.pem
```

### 2.4 SSL Certificate Monitoring

```bash
#!/bin/bash
# check-ssl.sh — Monitor SSL certificate expiry
set -euo pipefail

DOMAINS=(
    "stone-ai.net"
    "www.stone-ai.net"
    "tools.stone-ai.net"
    "api.stone-ai.net"
)

WARN_DAYS=30

for domain in "${DOMAINS[@]}"; do
    EXPIRY=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -z "$EXPIRY" ]; then
        echo "FAIL: $domain — could not check certificate"
        continue
    fi

    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -lt "$WARN_DAYS" ]; then
        echo "WARN: $domain — expires in $DAYS_LEFT days ($EXPIRY)"
    else
        echo "OK:   $domain — expires in $DAYS_LEFT days ($EXPIRY)"
    fi
done

# Run weekly via cron:
# 0 9 * * 1 /opt/scripts/check-ssl.sh >> /var/log/ssl-check.log 2>&1
```

---

## 3. Cloudflare Security Settings

### 3.1 SSL/TLS Settings

```
Minimum TLS Version:   TLS 1.2
TLS 1.3:               Enabled
Automatic HTTPS Rewrites: Enabled
Always Use HTTPS:       Enabled
HSTS:                   Enabled
  - Max-Age:           12 months
  - Include subdomains: Yes
  - Preload:           Yes
  - No-Sniff:          Yes
Opportunistic Encryption: Enabled
Certificate Transparency: Enabled
```

### 3.2 Cloudflare Page Rules

```
Rule 1: stone-ai.net/*
  → Always Use HTTPS

Rule 2: www.stone-ai.net/*
  → Forwarding URL (301) → https://stone-ai.net/$1

Rule 3: *.stone-ai.net/api/*
  → Cache Level: Bypass
  → Security Level: High
  → Browser Integrity Check: On
```

### 3.3 Cloudflare WAF Rules

```json
// Block known bad patterns
{
  "description": "Block SQL injection attempts",
  "expression": "(http.request.uri.query contains \"UNION SELECT\" or http.request.uri.query contains \"DROP TABLE\" or http.request.uri.query contains \"1=1\")",
  "action": "block"
}

// Rate limit API
{
  "description": "Rate limit API endpoints",
  "expression": "(http.request.uri.path matches \"^/api/\" and not http.request.uri.path matches \"^/api/health\")",
  "action": "rate_limit",
  "ratelimit": {
    "characteristics": ["cf.colo.id", "ip.src"],
    "period": 60,
    "requests_per_period": 100,
    "mitigation_timeout": 300,
    "action": "block"
  }
}

// Challenge suspicious traffic
{
  "description": "Challenge high-threat score visitors",
  "expression": "(cf.threat_score gt 25)",
  "action": "managed_challenge"
}
```

---

## 4. DNS Failover

### 4.1 Health Checks

```bash
# Cloudflare Load Balancing health checks
# Dashboard → Traffic → Load Balancing → Create Pool

# Pool: stone-ai-origins
# Origins:
#   - vercel-primary: cname.vercel-dns.com (weight: 1)
#   - fallback: stone-ai-sooty.vercel.app (weight: 0, failover only)

# Health Check:
#   - Type: HTTPS
#   - Path: /api/health
#   - Interval: 60s
#   - Retries: 2
#   - Timeout: 5s
#   - Expected codes: 200
```

### 4.2 DNS Failover Script

```bash
#!/bin/bash
# dns-failover.sh — Manual DNS failover
set -euo pipefail

PRIMARY="76.76.21.21"  # Vercel
FAILOVER="stone-ai-sooty.vercel.app"

# Check primary health
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "https://stone-ai.net/api/health" --max-time 10)

if [ "$HTTP_CODE" != "200" ]; then
    echo "$(date): Primary down (HTTP $HTTP_CODE). Switching to failover..."

    # Update DNS to CNAME (fallback Vercel deployment)
    curl -s -X PATCH \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_A_RECORD_ID" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"type\": \"CNAME\", \"content\": \"$FAILOVER\"}"

    echo "Failover activated: $FAILOVER"
    # sendFounderAlert "DNS FAILOVER ACTIVATED"
else
    echo "$(date): Primary healthy (HTTP $HTTP_CODE)"
fi
```

### 4.3 Multi-Region DNS Strategy

```
Primary Path (normal):
  User → Cloudflare → Vercel (iad1 region) → Neon (us-east)

Failover Path 1 (Vercel down):
  User → Cloudflare → Vercel fallback URL

Failover Path 2 (Full cloud down):
  User → Cloudflare → OMEN direct (api.stone-ai.net)

The Palace is always reachable. Per GS-27: Never solve only
the problem in front of you. Think every route.
```

---

## 5. Email DNS Records

### 5.1 SPF, DKIM, DMARC

```
# SPF — who can send email for stone-ai.net
TXT  @  "v=spf1 include:_spf.google.com include:amazonses.com ~all"

# DKIM — email authentication (provided by email service)
TXT  google._domainkey  "v=DKIM1; k=rsa; p=<public_key>"

# DMARC — policy for failed SPF/DKIM
TXT  _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@stone-ai.net; pct=100; adkim=s; aspf=s"
```

### 5.2 Gmail SMTP Configuration

```
Used by 3headedm@gmail.com (Three-Headed Monster alert system):
- Nodemailer + Gmail SMTP
- App Password configured
- Not using stone-ai.net domain for email (using Gmail directly)
- Future: Custom domain email via Google Workspace or Fastmail
```

---

## 6. DNS Performance Optimization

### 6.1 Cloudflare Settings for Speed

```
Caching:
  - Cache Level: Standard
  - Browser Cache TTL: 4 hours (static), Respect Existing Headers (API)
  - Edge Cache TTL: 2 hours (pages), Bypass (API)
  - Tiered Cache: Enabled (Smart)

Speed:
  - Auto Minify: JS, CSS, HTML
  - Brotli: Enabled
  - Early Hints: Enabled
  - HTTP/2: Enabled
  - HTTP/3 (QUIC): Enabled
  - 0-RTT: Enabled

Network:
  - WebSockets: Enabled (for real-time chat)
  - Pseudo IPv4: Off
  - IP Geolocation: Enabled
  - Maximum Upload Size: 100MB
```

### 6.2 DNS Propagation Checking

```bash
# Check DNS propagation worldwide
dig +short stone-ai.net @1.1.1.1
dig +short stone-ai.net @8.8.8.8
dig +short stone-ai.net @9.9.9.9
dig +short stone-ai.net @208.67.222.222

# Full DNS lookup
dig stone-ai.net ANY +noall +answer

# Check CNAME chain
dig +trace tools.stone-ai.net

# Check from multiple locations
# Use: https://dnschecker.org/ or
curl -s "https://dns.google/resolve?name=stone-ai.net&type=A" | jq
```

---

## 7. Certificate Best Practices

### 7.1 Certificate Types

```
Domain Validation (DV):
  - Validates domain ownership only
  - Cheapest / free (Let's Encrypt, Cloudflare)
  - Used by: Stone AI currently
  - Sufficient for most applications

Organization Validation (OV):
  - Validates organization identity
  - $50-200/year
  - Shows org name in certificate details
  - Consider for: stone-ai.net main site (future)

Extended Validation (EV):
  - Highest validation level
  - $200-500/year
  - Green bar (deprecated in most browsers)
  - Skip: Not worth it for current stage
```

### 7.2 Certificate Pinning (Advanced)

```
NOT recommended for stone-ai.net at current stage.
Certificate pinning can cause outages if certificates rotate.
Cloudflare handles certificate rotation automatically.

If implemented in the future:
- Pin to intermediate CA, not leaf certificate
- Always have backup pins
- Use Report-Only mode first
- Set reasonable max-age (30 days)
```

---

## 8. Troubleshooting DNS/SSL Issues

### 8.1 Common Issues

```
Issue: ERR_TOO_MANY_REDIRECTS
  Cause: SSL mode set to "Flexible" while origin forces HTTPS
  Fix: Set Cloudflare SSL to "Full" or "Full (Strict)"

Issue: SSL_ERROR_NO_CYPHER_OVERLAP
  Cause: TLS version mismatch
  Fix: Ensure minimum TLS 1.2 on both Cloudflare and origin

Issue: DNS not resolving
  Cause: Propagation delay or misconfigured record
  Fix: Check with dig, wait up to 48 hours, verify record

Issue: Mixed content warnings
  Cause: HTTP resources loaded on HTTPS page
  Fix: Enable "Automatic HTTPS Rewrites" in Cloudflare

Issue: Origin certificate error (525)
  Cause: Invalid or expired origin certificate
  Fix: Install valid cert or use Cloudflare Origin CA

Issue: 522 Connection timed out
  Cause: Origin server unreachable
  Fix: Check OMEN firewall, verify port forwarding, check ISP
```

### 8.2 Diagnostic Commands

```bash
# Full certificate chain
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net

# Check certificate details
echo | openssl s_client -servername stone-ai.net -connect stone-ai.net:443 2>/dev/null | \
  openssl x509 -noout -text

# Test specific TLS version
openssl s_client -connect stone-ai.net:443 -tls1_2
openssl s_client -connect stone-ai.net:443 -tls1_3

# Check HSTS header
curl -sI https://stone-ai.net | grep -i strict

# Test SSL configuration
# Use: https://www.ssllabs.com/ssltest/analyze.html?d=stone-ai.net
```

---

*Chaos Infrastructure Seed — Batch 14. DNS is the first door. SSL is the first lock. Get them right or nothing else matters.*
