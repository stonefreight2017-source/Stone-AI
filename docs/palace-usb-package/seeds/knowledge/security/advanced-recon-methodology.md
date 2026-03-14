# Advanced Reconnaissance Methodology

> Rush Seed — Palace Security Knowledge Base
> Classification: OFFENSIVE RECON — FOUNDER EYES ONLY
> Version: 1.0 | Created: 2026-03-09

---

## 1. Reconnaissance Philosophy

Reconnaissance is the foundation of every successful penetration test, red team engagement, and security assessment. The quality of your recon directly determines the quality of your attack surface understanding. Rush's principle: **never attack blind — know everything before the first packet flies.**

### 1.1 The Recon Mindset

- Every organization leaks information. Your job is to find where.
- Passive recon first. ALWAYS. Active recon leaves fingerprints.
- Build a complete picture before touching a single target system.
- Document everything — recon data has a shelf life but patterns persist.
- Think like the defender: what would YOU monitor? Avoid those channels first.

### 1.2 Recon Phases

| Phase | Type | Risk Level | Description |
|-------|------|-----------|-------------|
| Phase 0 | Passive OSINT | Zero | Public data, no target interaction |
| Phase 1 | Semi-Passive | Minimal | Normal browsing, DNS lookups |
| Phase 2 | Active Light | Low | Port scanning, banner grabbing |
| Phase 3 | Active Deep | Medium | Vulnerability scanning, fuzzing |
| Phase 4 | Targeted | High | Exploit-specific enumeration |

---

## 2. Open Source Intelligence (OSINT)

### 2.1 Domain Intelligence

**WHOIS Enumeration:**
```bash
# Basic WHOIS lookup
whois target.com

# Historical WHOIS (changes over time reveal infrastructure evolution)
# Use SecurityTrails, DomainTools, or WHOIS history APIs

# Reverse WHOIS — find all domains registered by same entity
# Search by registrant email, org name, phone number
amass intel -whois -d target.com

# Bulk WHOIS for discovered domains
for domain in $(cat domains.txt); do
  whois "$domain" | grep -E "Registrant|Admin|Tech|Name Server" >> whois_results.txt
  sleep 2  # Rate limiting
done
```

**Key WHOIS Data Points:**
- Registrant organization and email (often reveals parent companies)
- Name servers (shared hosting = shared attack surface)
- Creation/expiration dates (newly registered = potentially suspicious)
- Registrar (some registrars have weaker security)
- DNSSEC status

### 2.2 DNS Enumeration

DNS is the single richest source of infrastructure intelligence. Every subdomain is a potential attack vector.

**Passive DNS:**
```bash
# SecurityTrails API
curl -s "https://api.securitytrails.com/v1/domain/target.com/subdomains" \
  -H "APIKEY: YOUR_KEY" | jq '.subdomains[]'

# VirusTotal passive DNS
curl -s "https://www.virustotal.com/vtapi/v2/domain/report?apikey=KEY&domain=target.com"

# Certificate Transparency logs (massive subdomain source)
curl -s "https://crt.sh/?q=%.target.com&output=json" | jq -r '.[].name_value' | sort -u

# DNSDumpster (web-based but scriptable)
# Rapid7 Project Sonar — forward DNS dataset
```

**Active DNS Enumeration:**
```bash
# Subdomain brute-forcing with massdns
massdns -r resolvers.txt -t A -o S subdomains.txt -w results.txt

# DNSRecon comprehensive scan
dnsrecon -d target.com -t std,brt,axfr

# Amass — the gold standard for subdomain enumeration
amass enum -active -d target.com -brute -w /usr/share/wordlists/dns.txt -o amass_results.txt

# Zone transfer attempt (rarely works but always try)
dig axfr target.com @ns1.target.com

# DNS record types to enumerate
for type in A AAAA CNAME MX NS TXT SOA SRV PTR CAA; do
  echo "=== $type ===" >> dns_records.txt
  dig +short $type target.com >> dns_records.txt
done
```

**Subdomain Discovery Techniques:**
1. Certificate Transparency (crt.sh, Censys, Google CT)
2. DNS brute-forcing (SecLists dns wordlists)
3. Virtual host discovery (different sites on same IP)
4. Google dorking (`site:*.target.com`)
5. GitHub/GitLab code search for hardcoded domains
6. Wayback Machine URL extraction
7. JavaScript file analysis for API endpoints
8. SPF/DMARC records (reveal mail infrastructure)
9. Reverse DNS on discovered IP ranges
10. ASN enumeration for IP blocks

### 2.3 Subdomain Takeover Detection

```bash
# Check for dangling DNS records
subjack -w subdomains.txt -t 100 -timeout 30 -ssl -c fingerprints.json -v

# Manual checks for common takeover patterns
# CNAME pointing to: *.s3.amazonaws.com, *.herokuapp.com,
# *.azurewebsites.net, *.cloudfront.net, *.github.io,
# *.shopify.com, *.fastly.net, *.pantheonsite.io

# Check if CNAME target is claimable
dig CNAME vuln-subdomain.target.com
# If CNAME points to unclaimed resource → takeover possible
```

**High-Risk Takeover Targets:**
| Service | CNAME Pattern | Takeover Method |
|---------|--------------|-----------------|
| AWS S3 | *.s3.amazonaws.com | Create bucket with same name |
| GitHub Pages | *.github.io | Create repo with matching CNAME |
| Heroku | *.herokuapp.com | Create app with same name |
| Azure | *.azurewebsites.net | Create web app with same name |
| Shopify | *.myshopify.com | Register shop with same name |
| Fastly | *.fastly.net | Claim domain in Fastly dashboard |

---

## 3. Technology Fingerprinting

### 3.1 Web Technology Stack

```bash
# Wappalyzer CLI (identifies frameworks, CMS, analytics, etc.)
wappalyzer https://target.com

# WhatWeb — comprehensive web fingerprinting
whatweb -a 3 https://target.com

# BuiltWith alternative (check response headers)
curl -sI https://target.com | grep -iE "server|x-powered|x-aspnet|x-generator|x-drupal"

# HTTP response header analysis
curl -sI https://target.com | head -30

# Cookie analysis (reveals backend technology)
curl -sI https://target.com | grep -i "set-cookie"
# PHPSESSID = PHP
# JSESSIONID = Java
# ASP.NET_SessionId = .NET
# connect.sid = Express.js
# _rails_session = Ruby on Rails
```

**Technology Indicators:**
```
# HTML source analysis
curl -s https://target.com | grep -iE "wp-content|drupal|joomla|magento|shopify"

# JavaScript framework detection
curl -s https://target.com | grep -iE "react|angular|vue|next|nuxt|gatsby"

# Generator meta tags
curl -s https://target.com | grep -i "generator"

# robots.txt analysis (reveals CMS paths)
curl -s https://target.com/robots.txt

# sitemap.xml (reveals URL structure)
curl -s https://target.com/sitemap.xml
```

### 3.2 Server and Infrastructure Fingerprinting

```bash
# Nmap service version detection
nmap -sV -sC -p- --open target.com -oA nmap_full

# OS fingerprinting
nmap -O target.com

# SSL/TLS analysis
sslscan target.com:443
testssl.sh target.com

# SSH version (if exposed)
nmap -sV -p 22 target.com
# or
nc -v target.com 22

# SMTP banner grabbing
nc -v target.com 25
```

### 3.3 WAF/CDN Detection

```bash
# wafw00f — WAF detection
wafw00f https://target.com

# Manual WAF detection
# Send malicious-looking request and check response
curl -s "https://target.com/?id=1' OR 1=1--" -o /dev/null -w "%{http_code}"

# CDN detection via headers
curl -sI https://target.com | grep -iE "cf-ray|x-cdn|x-cache|x-amz|x-akamai|via.*cloudflare"

# Multiple IP resolution check (CDN = multiple IPs)
for i in $(seq 1 10); do
  dig +short target.com @8.8.8.8
  sleep 1
done | sort -u
```

**Common WAF Signatures:**
| WAF | Detection Header/Behavior |
|-----|--------------------------|
| Cloudflare | cf-ray header, __cfduid cookie |
| AWS WAF | x-amzn-requestid, 403 with JSON |
| Akamai | X-Akamai-Transformed |
| Imperva/Incapsula | incap_ses cookie, visid_incap |
| ModSecurity | Server: Apache + 403/406 responses |
| F5 BIG-IP | BigipServer cookie, TS cookie |

---

## 4. Shodan and Censys Intelligence

### 4.1 Shodan Queries

```bash
# Basic host search
shodan host TARGET_IP

# Organization search
shodan search "org:Target Company"

# Specific service discovery
shodan search "hostname:target.com port:443"

# Find exposed databases
shodan search "org:Target Company" "port:3306,5432,27017,6379,9200"

# Find exposed admin panels
shodan search "hostname:target.com" "http.title:admin OR http.title:login OR http.title:dashboard"

# SSL certificate search (finds all IPs using target's certs)
shodan search "ssl.cert.subject.cn:target.com"

# Find development/staging servers
shodan search "hostname:target.com" "http.title:staging OR http.title:dev OR http.title:test"
```

**Advanced Shodan Dorks:**
```
# Exposed webcams
"Server: yawcam" "Mime-Type: text/html" org:"Target"

# Exposed Docker APIs
"Docker Containers:" port:2375 org:"Target"

# Exposed Kubernetes dashboards
"kubernetes" port:443,6443,8443 org:"Target"

# Exposed Jenkins
"X-Jenkins" "Set-Cookie: JSESSIONID" org:"Target"

# Exposed Elasticsearch
port:9200 json "name" "cluster_name" org:"Target"

# Exposed MongoDB
"MongoDB Server Information" port:27017 org:"Target"

# Industrial control systems
"Modbus" OR "Siemens" OR "SCADA" org:"Target"
```

### 4.2 Censys Queries

```bash
# Search by domain
censys search "services.tls.certificates.leaf.names: target.com"

# Search by organization
censys search "autonomous_system.organization: Target Company"

# Find all web servers
censys search "services.http.response.headers.server: *" AND "services.tls.certificates.leaf.names: target.com"

# Certificate search
censys search certificates "parsed.subject.common_name: target.com"
```

### 4.3 Other Search Engines

**Fofa:**
```
domain="target.com"
cert="target.com"
ip="TARGET_IP/24"
```

**ZoomEye:**
```
hostname:target.com
site:target.com
ip:"TARGET_IP/24"
```

**BinaryEdge:**
```
# API-based queries
curl "https://api.binaryedge.io/v2/query/domains/subdomain/target.com" -H "X-Key: API_KEY"
```

---

## 5. Google Dorking

### 5.1 Essential Dorks

```
# Find login pages
site:target.com inurl:login OR inurl:admin OR inurl:signin OR inurl:auth

# Find exposed files
site:target.com filetype:pdf OR filetype:doc OR filetype:xls OR filetype:csv

# Find configuration files
site:target.com filetype:xml OR filetype:conf OR filetype:env OR filetype:yml

# Find backup files
site:target.com filetype:bak OR filetype:sql OR filetype:old OR filetype:backup

# Find error messages (reveals technology)
site:target.com "error" OR "warning" OR "exception" OR "stack trace"

# Find directory listings
site:target.com intitle:"index of" OR intitle:"directory listing"

# Find exposed API documentation
site:target.com inurl:swagger OR inurl:api-docs OR inurl:graphql OR inurl:graphiql

# Find sensitive parameters
site:target.com inurl:password OR inurl:token OR inurl:secret OR inurl:api_key

# Find subdomains via Google
site:*.target.com -www

# Find cached/removed pages
cache:target.com
```

### 5.2 Advanced Dorks

```
# Find exposed source code
site:target.com ext:php OR ext:asp OR ext:jsp intitle:"index of"

# Find database dumps
site:target.com filetype:sql "INSERT INTO" OR "CREATE TABLE"

# Find email addresses
site:target.com "@target.com" filetype:csv OR filetype:xls OR filetype:txt

# Find internal documentation
site:target.com inurl:wiki OR inurl:confluence OR inurl:docs filetype:pdf

# Find WordPress specific
site:target.com inurl:wp-content OR inurl:wp-admin OR inurl:wp-includes

# Find exposed Git repositories
site:target.com inurl:.git

# Find CI/CD configs
site:target.com filetype:yml "deploy" OR "pipeline" OR "github" OR "gitlab"

# Find cloud storage references
site:target.com "s3.amazonaws.com" OR "blob.core.windows.net" OR "storage.googleapis.com"
```

### 5.3 GitHub Dorking

```
# Search for target's leaked secrets
"target.com" password OR secret OR api_key OR token

# Search for config files
"target.com" filename:.env OR filename:config.json OR filename:.htaccess

# Search for private keys
"target.com" filename:id_rsa OR filename:id_dsa OR "BEGIN RSA PRIVATE KEY"

# Search for database credentials
"target.com" "DB_PASSWORD" OR "DATABASE_URL" OR "POSTGRES_PASSWORD"

# Search for API keys
"target.com" "AKIA" OR "AIza" OR "sk-" OR "pk_live"

# Search for AWS credentials
org:target-org "aws_access_key_id" OR "aws_secret_access_key"

# Search for internal URLs
"target.com" "staging" OR "dev" OR "internal" OR "vpn" OR "admin"

# Search for Slack/Discord webhooks
"target.com" "hooks.slack.com" OR "discord.com/api/webhooks"
```

---

## 6. Email Intelligence

### 6.1 Email Harvesting

```bash
# theHarvester — comprehensive email gathering
theHarvester -d target.com -b all -l 500

# Hunter.io API
curl "https://api.hunter.io/v2/domain-search?domain=target.com&api_key=KEY"

# Phonebook.cz (free email search)
# Search: @target.com

# Email pattern detection
# Common patterns:
# first.last@target.com
# firstlast@target.com
# first@target.com
# flast@target.com
# first_last@target.com
```

### 6.2 Email Verification

```bash
# Verify email exists via SMTP
# Connect to MX record
dig MX target.com +short
nc -v mx.target.com 25

# SMTP verification sequence
HELO test.com
MAIL FROM: <test@test.com>
RCPT TO: <victim@target.com>
# 250 = exists, 550 = doesn't exist

# Automated verification
emailharvester -d target.com -e all
```

### 6.3 Breach Data Analysis

```
# Check for breached credentials
# haveibeenpwned.com API
curl "https://haveibeenpwned.com/api/v3/breachedaccount/user@target.com" \
  -H "hibp-api-key: KEY"

# Check domain-wide breaches
curl "https://haveibeenpwned.com/api/v3/breaches" | jq '.[] | select(.Domain == "target.com")'

# Dehashed API (paid — comprehensive breach search)
curl "https://api.dehashed.com/search?query=domain:target.com" \
  -H "Authorization: Basic BASE64"
```

---

## 7. Network Intelligence

### 7.1 ASN and IP Range Discovery

```bash
# Find organization's ASN
whois -h whois.radb.net -- '-i origin AS$ASN'

# BGP toolkit
curl -s "https://api.bgpview.io/search?query_term=Target+Company" | jq

# Find all IP prefixes for ASN
curl -s "https://api.bgpview.io/asn/AS12345/prefixes" | jq '.data.ipv4_prefixes[].prefix'

# Hurricane Electric BGP toolkit
# https://bgp.he.net/search?search%5Bsearch%5D=target+company

# ARIN/RIPE WHOIS for IP blocks
whois -h whois.arin.net "n Target Company"
whois -h whois.ripe.net "Target Company"

# Reverse DNS on discovered ranges
for ip in $(seq 1 254); do
  host 192.168.1.$ip | grep "target.com"
done
```

### 7.2 Cloud Infrastructure Discovery

```bash
# Find cloud provider for IP
whois TARGET_IP | grep -iE "amazon|microsoft|google|digitalocean|linode"

# AWS IP ranges
curl -s https://ip-ranges.amazonaws.com/ip-ranges.json | \
  jq '.prefixes[] | select(.region == "us-east-1")'

# Azure IP ranges
# Download from Microsoft's published ranges

# GCP IP ranges
dig TXT _cloud-netblocks.googleusercontent.com

# Check if IP belongs to known CDN
curl -s "https://api.ipinfo.io/TARGET_IP?token=TOKEN" | jq
```

### 7.3 Network Topology Mapping

```bash
# Traceroute to discover network path
traceroute -I target.com

# MTR for continuous monitoring
mtr target.com

# Visual traceroute mapping
# Use tools like: VisualRoute, Open Visual Traceroute

# DNS-based network mapping
fierce --domain target.com --subdomains subdomains.txt

# Discover load balancers
halberd target.com

# Identify reverse proxies
curl -sI https://target.com | grep -iE "via|x-forwarded|x-proxy"
```

---

## 8. Wayback Machine Intelligence

### 8.1 Historical Analysis

```bash
# Wayback URLs extraction
waybackurls target.com > wayback_urls.txt

# Filter for interesting files
cat wayback_urls.txt | grep -iE "\.js$|\.json$|\.xml$|\.conf$|\.env$|\.bak$"

# Find removed pages (might still be on staging/dev)
cat wayback_urls.txt | grep -iE "admin|internal|staging|dev|test|debug"

# Find old API endpoints
cat wayback_urls.txt | grep -iE "/api/|/v1/|/v2/|/graphql|/rest/"

# Historical screenshot comparison
# Use Wayback Machine's screenshot feature to see UI changes

# Find old JavaScript files (may contain removed but still-valid API keys)
cat wayback_urls.txt | grep "\.js$" | sort -u > old_js_files.txt
```

### 8.2 Content Diff Analysis

```bash
# Download current and archived versions of key pages
wget -q "https://web.archive.org/web/2024/https://target.com/robots.txt" -O robots_old.txt
wget -q "https://target.com/robots.txt" -O robots_new.txt
diff robots_old.txt robots_new.txt

# Compare sitemaps over time
wget -q "https://web.archive.org/web/2024/https://target.com/sitemap.xml" -O sitemap_old.xml
wget -q "https://target.com/sitemap.xml" -O sitemap_new.xml
diff sitemap_old.xml sitemap_new.xml

# Removed paths in robots.txt = paths that EXISTED (possible attack surface)
```

---

## 9. Social Media Intelligence

### 9.1 Employee Discovery

```
# LinkedIn search operators
site:linkedin.com "target company" "current"
site:linkedin.com/in "target company" "engineer" OR "developer" OR "admin"

# Twitter/X search
from:@targetcompany
"target company" password OR hack OR breach OR vulnerability

# GitHub organization members
# https://github.com/orgs/target-org/people

# Glassdoor (reveals internal technology stack)
site:glassdoor.com "target company" "tech stack" OR "tools" OR "technology"
```

### 9.2 Technology Stack from Job Postings

```
# Job postings reveal technology stack
site:target.com/careers
site:greenhouse.io "target company"
site:lever.co "target company"

# Common reveals:
# "Experience with Kubernetes" = They use K8s
# "AWS certified preferred" = AWS infrastructure
# "PostgreSQL" = Database technology
# "React/Next.js" = Frontend stack
# "Terraform" = Infrastructure as Code
```

---

## 10. Automated Recon Frameworks

### 10.1 Amass (Comprehensive)

```bash
# Full enumeration with all sources
amass enum -active -brute -d target.com -o amass_output.txt -config amass_config.ini

# Config file (amass_config.ini):
# [scope]
# [data_sources]
# [data_sources.SecurityTrails]
# [data_sources.SecurityTrails.Credentials]
# apikey = YOUR_KEY
# [data_sources.Censys]
# [data_sources.Censys.Credentials]
# apikey = YOUR_KEY
# secret = YOUR_SECRET

# Amass visualization
amass viz -d3 -d target.com
```

### 10.2 Recon-ng

```bash
# Load Recon-ng
recon-ng

# Set workspace
workspace create target

# Install modules
marketplace install all

# Set target domain
db insert domains target.com

# Run recon modules
modules load recon/domains-hosts/google_site_web
run
modules load recon/domains-hosts/brute_hosts
run
modules load recon/hosts-hosts/resolve
run

# Export results
modules load reporting/csv
run
```

### 10.3 Custom Recon Pipeline

```bash
#!/bin/bash
# Rush's Automated Recon Pipeline
TARGET=$1
OUTPUT_DIR="recon_$TARGET"
mkdir -p "$OUTPUT_DIR"

echo "[*] Starting recon on $TARGET"

# Phase 1: Passive
echo "[*] Phase 1: Passive Recon"
subfinder -d "$TARGET" -o "$OUTPUT_DIR/subfinder.txt" &
assetfinder --subs-only "$TARGET" > "$OUTPUT_DIR/assetfinder.txt" &
amass enum -passive -d "$TARGET" -o "$OUTPUT_DIR/amass_passive.txt" &
curl -s "https://crt.sh/?q=%.$TARGET&output=json" | jq -r '.[].name_value' | sort -u > "$OUTPUT_DIR/crt.txt" &
wait

# Combine and deduplicate
cat "$OUTPUT_DIR"/*.txt | sort -u > "$OUTPUT_DIR/all_subdomains.txt"
echo "[+] Found $(wc -l < "$OUTPUT_DIR/all_subdomains.txt") unique subdomains"

# Phase 2: Resolution
echo "[*] Phase 2: DNS Resolution"
massdns -r resolvers.txt -t A -o S "$OUTPUT_DIR/all_subdomains.txt" -w "$OUTPUT_DIR/resolved.txt"

# Phase 3: Port Scanning
echo "[*] Phase 3: Port Scanning"
cat "$OUTPUT_DIR/resolved.txt" | awk '{print $3}' | sort -u > "$OUTPUT_DIR/ips.txt"
nmap -sV -sC -iL "$OUTPUT_DIR/ips.txt" -oA "$OUTPUT_DIR/nmap_results"

# Phase 4: Web Probing
echo "[*] Phase 4: Web Probing"
cat "$OUTPUT_DIR/all_subdomains.txt" | httpx -silent -status-code -title -tech-detect -o "$OUTPUT_DIR/web_alive.txt"

# Phase 5: Screenshot
echo "[*] Phase 5: Screenshots"
cat "$OUTPUT_DIR/web_alive.txt" | awk '{print $1}' | gowitness file -f - -P "$OUTPUT_DIR/screenshots/"

echo "[+] Recon complete. Results in $OUTPUT_DIR/"
```

---

## 11. Infrastructure Mapping and Visualization

### 11.1 Building the Attack Surface Map

```
Target: target.com
├── DNS Records
│   ├── A: 203.0.113.10 (Web Server - Cloudflare)
│   ├── MX: mail.target.com → 203.0.113.20 (Mail Server)
│   ├── NS: ns1.cloudflare.com, ns2.cloudflare.com
│   └── TXT: "v=spf1 include:_spf.google.com ~all" (Uses Google Workspace)
├── Subdomains (247 found)
│   ├── www.target.com → 203.0.113.10
│   ├── api.target.com → 203.0.113.11
│   ├── staging.target.com → 10.0.1.5 (INTERNAL - DNS leak!)
│   ├── jenkins.target.com → 203.0.113.30 (CI/CD)
│   ├── grafana.target.com → 203.0.113.31 (Monitoring)
│   └── dev.target.com → CNAME to herokuapp (TAKEOVER CANDIDATE)
├── IP Ranges (ASN: AS12345)
│   ├── 203.0.113.0/24 (Primary)
│   └── 198.51.100.0/24 (Secondary - DR)
├── Technology Stack
│   ├── Frontend: React 18, Next.js 14
│   ├── Backend: Node.js, Express
│   ├── Database: PostgreSQL (port 5432 open on 203.0.113.15)
│   ├── Cache: Redis (port 6379 open on 203.0.113.16)
│   ├── CDN: Cloudflare
│   └── WAF: Cloudflare WAF
├── Cloud Assets
│   ├── AWS S3: target-assets.s3.amazonaws.com
│   ├── AWS EC2: us-east-1
│   └── Google Workspace (email)
└── People (23 technical staff found)
    ├── CTO: John Smith (GitHub: jsmith-target)
    ├── Lead Dev: Jane Doe (GitHub: jdoe-dev)
    └── SysAdmin: Bob Wilson (LinkedIn profile reveals internal tools)
```

### 11.2 Priority Attack Surface Ranking

| Priority | Target | Reason | Risk |
|----------|--------|--------|------|
| P0 | staging.target.com (internal IP leak) | Internal DNS exposed | Critical |
| P0 | dev.target.com (CNAME takeover) | Subdomain takeover | Critical |
| P1 | jenkins.target.com | CI/CD = code execution | High |
| P1 | PostgreSQL 203.0.113.15:5432 | Direct DB exposure | High |
| P2 | Redis 203.0.113.16:6379 | Unauthenticated cache | High |
| P2 | grafana.target.com | Monitoring data leak | Medium |
| P3 | api.target.com | API attack surface | Medium |
| P3 | S3 bucket enumeration | Data exposure | Medium |

---

## 12. Operational Security During Recon

### 12.1 Staying Invisible

- **Use VPNs/Tor for all active scanning** — never scan from your real IP
- **Rotate user agents** — don't use default tool signatures
- **Respect rate limits** — aggressive scanning triggers alerts
- **Use multiple DNS resolvers** — don't flood one resolver
- **Time your scans** — off-hours reduce detection chance
- **Fragment your recon** — don't do everything from one source IP

### 12.2 Legal Considerations

- Passive OSINT is generally legal (public information)
- Active scanning MAY violate computer fraud laws without authorization
- Always have a signed scope document before active recon
- Document your methodology for legal defensibility
- Screenshot everything — timestamps matter

### 12.3 Anti-Detection Techniques

```bash
# Nmap stealth scanning
nmap -sS -T2 --randomize-hosts --data-length 50 -D RND:10 target.com

# Rotate source IPs (if you have multiple)
proxychains nmap -sV target.com

# Use legitimate-looking user agents
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" https://target.com

# DNS over HTTPS for queries
curl -s "https://dns.google/resolve?name=target.com&type=A"

# Slow and low approach
nmap -sS -T1 --scan-delay 15s target.com
```

---

## 13. Recon Reporting Template

### 13.1 Executive Summary
- Target organization overview
- Total attack surface discovered
- Critical findings requiring immediate attention
- Recommended next phases

### 13.2 Technical Findings
- Complete subdomain inventory
- IP range mapping
- Technology stack analysis
- Exposed services catalog
- Cloud asset inventory
- People and email intelligence
- Historical change analysis

### 13.3 Risk Assessment
- Critical: Immediately exploitable (subdomain takeovers, exposed databases)
- High: Requires minimal effort to exploit (exposed CI/CD, weak auth)
- Medium: Requires moderate skill (API vulnerabilities, misconfigurations)
- Low: Informational findings (version disclosure, technology detection)

---

## 14. Rush's Recon Checklist

```
[ ] WHOIS and domain intelligence
[ ] DNS enumeration (all record types)
[ ] Subdomain discovery (passive + active)
[ ] Subdomain takeover checks
[ ] Certificate Transparency analysis
[ ] Technology fingerprinting
[ ] WAF/CDN detection
[ ] Shodan/Censys/Fofa search
[ ] Google dorking
[ ] GitHub dorking
[ ] Email harvesting
[ ] Breach data check
[ ] ASN and IP range discovery
[ ] Cloud asset enumeration
[ ] Wayback Machine analysis
[ ] Social media intelligence
[ ] Job posting analysis
[ ] Port scanning
[ ] Service version detection
[ ] Web probing and screenshots
[ ] Attack surface map creation
[ ] Priority ranking
[ ] Report generation
```

---

*Rush doesn't guess. Rush knows. Every target has a story written in DNS records, certificates, and forgotten subdomains. Read the story before you write the exploit.*
