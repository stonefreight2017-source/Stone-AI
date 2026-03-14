# Load Balancing & Reverse Proxy — Palace Infrastructure Seed

## Chaos Directive: Traffic Management for the Palace

This seed covers Nginx and Caddy reverse proxy configuration, upstream management, health checks, SSL termination, WebSocket proxying, and load balancing patterns. The Palace routes traffic from Cloudflare to multiple backend services — the proxy layer is where security, performance, and reliability converge.

---

## 1. Nginx Reverse Proxy

### 1.1 Core Configuration

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;  # Match CPU cores
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

error_log /var/log/nginx/error.log warn;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;  # Hide nginx version
    client_max_body_size 50M;

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$request_time $upstream_response_time '
                    '$http_cf_connecting_ip';

    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$http_cf_connecting_ip",'
        '"method":"$request_method",'
        '"uri":"$request_uri",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_time":"$upstream_response_time",'
        '"user_agent":"$http_user_agent"'
    '}';

    access_log /var/log/nginx/access.log json;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript
               image/svg+xml;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting zones
    limit_req_zone $http_cf_connecting_ip zone=api:10m rate=30r/s;
    limit_req_zone $http_cf_connecting_ip zone=inference:10m rate=5r/s;
    limit_req_zone $http_cf_connecting_ip zone=general:10m rate=60r/s;
    limit_conn_zone $http_cf_connecting_ip zone=addr:10m;

    # Upstream definitions
    include /etc/nginx/conf.d/upstreams.conf;

    # Server blocks
    include /etc/nginx/conf.d/*.conf;
}
```

### 1.2 Upstream Configuration

```nginx
# /etc/nginx/conf.d/upstreams.conf

# Stone AI web application (Next.js)
upstream stone_ai_web {
    least_conn;
    server 127.0.0.1:3000 weight=5 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=5 max_fails=3 fail_timeout=30s backup;
    keepalive 32;
    keepalive_requests 100;
    keepalive_timeout 60s;
}

# vLLM inference server
upstream vllm_inference {
    server 127.0.0.1:8000 max_fails=2 fail_timeout=60s;
    keepalive 16;
    keepalive_timeout 120s;
}

# PostgreSQL pgBouncer (for connection pooling)
upstream pgbouncer {
    server 127.0.0.1:6432;
}

# Redis
upstream redis {
    server 127.0.0.1:6379;
}

# Monitoring
upstream grafana {
    server 127.0.0.1:3001;
}

upstream prometheus {
    server 127.0.0.1:9090;
}
```

### 1.3 Main Server Block

```nginx
# /etc/nginx/conf.d/stone-ai.conf

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name stone-ai.net *.stone-ai.net;
    return 301 https://$host$request_uri;
}

# Main application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name stone-ai.net;

    # Cloudflare Origin CA certificate
    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin-key.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS (via Cloudflare, but belt-and-suspenders)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Only accept Cloudflare IPs
    include /etc/nginx/cloudflare-ips.conf;
    deny all;

    # Real IP from Cloudflare
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;

    # Static files
    location /_next/static/ {
        proxy_pass http://stone_ai_web;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static/ {
        proxy_pass http://stone_ai_web;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        limit_conn addr 30;

        proxy_pass http://stone_ai_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 60s;

        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 16k;
    }

    # Inference API (vLLM)
    location /api/inference/ {
        limit_req zone=inference burst=10 nodelay;

        proxy_pass http://vllm_inference/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header Connection "";

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 300s;  # Long timeout for inference

        proxy_buffering off;  # Stream responses
    }

    # Health check
    location /api/health {
        proxy_pass http://stone_ai_web;
        access_log off;
    }

    # Default — proxy to Next.js
    location / {
        limit_req zone=general burst=100 nodelay;

        proxy_pass http://stone_ai_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Block sensitive paths
    location ~ /\. { deny all; }
    location ~ /\.env { deny all; }
    location ~ /\.git { deny all; }
}
```

### 1.4 WebSocket Proxying

```nginx
# WebSocket support for real-time features (chat, notifications)
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    # ... existing config ...

    # WebSocket endpoint
    location /ws/ {
        proxy_pass http://stone_ai_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;

        proxy_read_timeout 86400s;  # Keep WS connections alive for 24h
        proxy_send_timeout 86400s;

        proxy_buffering off;
        proxy_cache off;
    }

    # Server-Sent Events (SSE) for streaming inference
    location /api/chat/stream {
        proxy_pass http://stone_ai_web;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;

        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;

        # SSE-specific headers
        add_header Cache-Control "no-cache";
        add_header Content-Type "text/event-stream";
        chunked_transfer_encoding on;
    }
}
```

### 1.5 Nginx Health Checks

```nginx
# Active health checks (requires nginx-plus or third-party module)
# For open-source nginx, use passive health checks via max_fails

upstream stone_ai_web {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
}

# Custom health check endpoint
server {
    listen 8080;
    server_name localhost;

    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location /nginx-status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

### 1.6 External Health Check Script

```bash
#!/bin/bash
# nginx-health-check.sh — Active health checking for upstreams
set -euo pipefail

UPSTREAMS=(
    "http://127.0.0.1:3000/api/health"
    "http://127.0.0.1:3001/api/health"
    "http://127.0.0.1:8000/health"
)

for upstream in "${UPSTREAMS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$upstream" 2>/dev/null || echo "000")

    if [ "$STATUS" = "200" ]; then
        echo "OK: $upstream"
    else
        echo "FAIL: $upstream (HTTP $STATUS)"
        # Could dynamically update nginx config to remove failed upstream
    fi
done
```

---

## 2. Caddy Reverse Proxy

### 2.1 Why Caddy

Caddy is a modern alternative to Nginx with automatic HTTPS, simpler configuration, and built-in features. Good for rapid deployment and development environments.

### 2.2 Caddyfile Configuration

```caddyfile
# /etc/caddy/Caddyfile

{
    # Global options
    email admin@stone-ai.net
    admin localhost:2019
    log {
        output file /var/log/caddy/access.log
        format json
        level INFO
    }
}

# Stone AI main application
stone-ai.net {
    # TLS with Cloudflare Origin CA
    tls /etc/ssl/cloudflare/origin.pem /etc/ssl/cloudflare/origin-key.pem

    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        -Server
    }

    # Rate limiting
    rate_limit {
        zone api {
            key {http.request.header.CF-Connecting-IP}
            events 30
            window 1s
        }
    }

    # Static files with caching
    @static path /_next/static/* /static/*
    handle @static {
        header Cache-Control "public, max-age=31536000, immutable"
        reverse_proxy localhost:3000
    }

    # API routes
    handle /api/* {
        reverse_proxy localhost:3000 {
            header_up X-Real-IP {http.request.header.CF-Connecting-IP}
            header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}
            transport http {
                read_timeout 60s
            }
        }
    }

    # Inference API
    handle /api/inference/* {
        reverse_proxy localhost:8000 {
            header_up X-Real-IP {http.request.header.CF-Connecting-IP}
            transport http {
                read_timeout 300s
            }
            flush_interval -1  # Stream responses immediately
        }
    }

    # WebSocket
    @websocket {
        header Connection *upgrade*
        header Upgrade websocket
    }
    handle @websocket {
        reverse_proxy localhost:3000
    }

    # Health check
    handle /api/health {
        reverse_proxy localhost:3000
    }

    # Default
    handle {
        reverse_proxy localhost:3000 {
            header_up X-Real-IP {http.request.header.CF-Connecting-IP}
            header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}
        }
    }

    # Block sensitive paths
    @blocked path /.* /.env /.git/*
    respond @blocked 403
}

# Stone AI Tools
tools.stone-ai.net {
    tls /etc/ssl/cloudflare/origin.pem /etc/ssl/cloudflare/origin-key.pem

    reverse_proxy localhost:3002 {
        header_up X-Real-IP {http.request.header.CF-Connecting-IP}
    }
}

# API/Inference endpoint
api.stone-ai.net {
    tls /etc/ssl/cloudflare/origin.pem /etc/ssl/cloudflare/origin-key.pem

    reverse_proxy localhost:8000 {
        header_up X-Real-IP {http.request.header.CF-Connecting-IP}
        transport http {
            read_timeout 300s
        }
        flush_interval -1
    }
}

# Monitoring (internal only)
:9080 {
    # Grafana
    handle /grafana/* {
        uri strip_prefix /grafana
        reverse_proxy localhost:3001
    }

    # Prometheus
    handle /prometheus/* {
        uri strip_prefix /prometheus
        reverse_proxy localhost:9090
    }
}
```

### 2.3 Caddy as Docker Service

```yaml
services:
  caddy:
    image: caddy:2-alpine
    container_name: stoneai-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
      - certs:/etc/ssl/cloudflare:ro
    networks:
      - frontend
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 256M

volumes:
  caddy-data:
  caddy-config:
```

---

## 3. Load Balancing Algorithms

### 3.1 Algorithm Comparison

```
Round Robin (default):
  - Distributes requests evenly in order
  - Simple, no state needed
  - Best for: Homogeneous backends with similar response times

Least Connections:
  - Routes to backend with fewest active connections
  - Better for varying request durations
  - Best for: vLLM inference (long-running requests)

IP Hash:
  - Same client IP always goes to same backend
  - Session affinity without cookies
  - Best for: Stateful applications

Weighted:
  - Assign weights to backends
  - Higher weight = more requests
  - Best for: Mixed capacity servers

Random with Two Choices:
  - Pick 2 random backends, choose the one with fewer connections
  - Good balance of simplicity and performance
  - Best for: Large-scale deployments
```

### 3.2 Nginx Load Balancing Examples

```nginx
# Round Robin (default)
upstream web_rr {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

# Least Connections
upstream web_lc {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

# IP Hash (sticky sessions)
upstream web_ip {
    ip_hash;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

# Weighted
upstream web_weighted {
    server 127.0.0.1:3000 weight=3;  # 3x more traffic
    server 127.0.0.1:3001 weight=1;
}

# With backup and health
upstream web_ha {
    least_conn;
    server 127.0.0.1:3000 weight=5 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=3 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 backup;  # Only used when others are down
    keepalive 32;
}
```

---

## 4. SSL Termination Patterns

### 4.1 Pattern 1: Cloudflare → Proxy (SSL) → Backend (HTTP)

```
Client → HTTPS → Cloudflare → HTTPS → Nginx → HTTP → Next.js
                                                        ↘ HTTP → vLLM

Pros: Backend doesn't need TLS, simpler config
Cons: Unencrypted internal traffic
Use when: All services on same machine (OMEN)
```

### 4.2 Pattern 2: End-to-End Encryption

```
Client → HTTPS → Cloudflare → HTTPS → Nginx → HTTPS → Next.js

Pros: Traffic encrypted everywhere
Cons: More certificate management, slight overhead
Use when: Services on different machines/networks
```

### 4.3 Pattern 3: Mutual TLS (mTLS)

```nginx
# Client certificate verification
server {
    listen 443 ssl;

    ssl_certificate /etc/ssl/server.pem;
    ssl_certificate_key /etc/ssl/server-key.pem;

    # Require client certificate
    ssl_client_certificate /etc/ssl/ca.pem;
    ssl_verify_client on;

    location /internal-api/ {
        if ($ssl_client_verify != SUCCESS) {
            return 403;
        }
        proxy_pass http://internal_service;
    }
}
```

---

## 5. Caching at the Proxy Level

### 5.1 Nginx Proxy Cache

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=stone_cache:10m
                 max_size=1g inactive=60m use_temp_path=off;

server {
    # Cache static assets
    location /_next/static/ {
        proxy_cache stone_cache;
        proxy_cache_valid 200 365d;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        proxy_cache_revalidate on;
        proxy_cache_lock on;

        add_header X-Cache-Status $upstream_cache_status;

        proxy_pass http://stone_ai_web;
    }

    # Cache API responses selectively
    location /api/public/ {
        proxy_cache stone_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_valid 404 1m;
        proxy_cache_key $request_uri;
        proxy_cache_bypass $http_authorization;  # Don't cache authenticated requests

        add_header X-Cache-Status $upstream_cache_status;

        proxy_pass http://stone_ai_web;
    }

    # Never cache mutations
    location /api/ {
        proxy_cache off;
        proxy_pass http://stone_ai_web;
    }
}
```

---

## 6. Connection Management

### 6.1 Keepalive Optimization

```nginx
upstream stone_ai_web {
    server 127.0.0.1:3000;
    keepalive 32;           # Pool of keepalive connections
    keepalive_requests 1000; # Max requests per connection
    keepalive_time 1h;      # Max lifetime per connection
    keepalive_timeout 60s;  # Idle timeout
}

server {
    location / {
        proxy_http_version 1.1;           # Required for keepalive
        proxy_set_header Connection "";    # Clear upgrade header for keepalive
        proxy_pass http://stone_ai_web;
    }
}
```

### 6.2 Connection Limits

```nginx
# Limit concurrent connections per IP
limit_conn_zone $http_cf_connecting_ip zone=addr:10m;

server {
    location / {
        limit_conn addr 50;           # Max 50 concurrent connections per IP
        limit_conn_status 429;        # Return 429 Too Many Requests
        limit_conn_log_level warn;
    }

    location /api/inference/ {
        limit_conn addr 5;            # Stricter for inference
    }
}
```

### 6.3 Timeout Tuning

```nginx
# Different timeouts for different endpoints
location /api/ {
    proxy_connect_timeout 5s;     # Time to establish connection to upstream
    proxy_send_timeout 30s;       # Time to send request to upstream
    proxy_read_timeout 60s;       # Time to read response from upstream
}

location /api/inference/ {
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 300s;      # 5 minutes for inference
}

location /api/chat/stream {
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 600s;      # 10 minutes for streaming chat
}
```

---

## 7. Monitoring the Proxy Layer

### 7.1 Nginx Metrics

```nginx
# Enable stub_status
server {
    listen 8080;
    server_name localhost;

    location /nginx-status {
        stub_status on;
        allow 127.0.0.1;
        deny all;
    }
}
```

```bash
# Read nginx status
curl http://localhost:8080/nginx-status
# Active connections: 15
# server accepts handled requests
#  1234 1234 5678
# Reading: 2 Writing: 5 Waiting: 8
```

### 7.2 Nginx Prometheus Exporter

```yaml
services:
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: nginx-exporter
    restart: unless-stopped
    command:
      - '-nginx.scrape-uri=http://nginx:8080/nginx-status'
    ports:
      - "9113:9113"
    depends_on:
      - nginx
```

### 7.3 Access Log Analysis

```bash
# Top 10 IPs by request count
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# Response code distribution
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Slow requests (>2 seconds)
awk '$NF > 2.0 {print $0}' /var/log/nginx/access.log

# JSON log analysis with jq
cat /var/log/nginx/access.log | jq -s 'group_by(.status) | map({status: .[0].status, count: length})'

# Average response time by path
cat /var/log/nginx/access.log | jq -s 'group_by(.uri) | map({path: .[0].uri, avg_time: (map(.request_time) | add / length), count: length}) | sort_by(-.avg_time) | .[0:10]'
```

---

## 8. High Availability Patterns

### 8.1 Active-Passive Failover

```nginx
upstream stone_ai_web {
    server 127.0.0.1:3000;         # Primary
    server 127.0.0.1:3001 backup;  # Only used when primary is down
}
```

### 8.2 Active-Active with Health

```nginx
upstream stone_ai_web {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;

    # Passive health check: after 3 failures in 30s, mark as down
    # After 30s, try again
}
```

### 8.3 Circuit Breaker Pattern

```nginx
# Implement circuit breaker with error handling
upstream stone_ai_web {
    server 127.0.0.1:3000 max_fails=5 fail_timeout=60s;
    server 127.0.0.1:3001 max_fails=5 fail_timeout=60s;
}

server {
    location / {
        proxy_pass http://stone_ai_web;
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 10s;

        # Custom error pages when all upstreams are down
        error_page 502 503 504 /50x.html;
    }

    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
```

---

## 9. Performance Tuning

### 9.1 Nginx Performance Checklist

```nginx
# Kernel parameters (sysctl)
# net.core.somaxconn = 65535
# net.ipv4.tcp_max_syn_backlog = 65535
# net.ipv4.ip_local_port_range = 1024 65535
# net.ipv4.tcp_tw_reuse = 1
# net.core.netdev_max_backlog = 65535

# Nginx tuning
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # Open file cache
    open_file_cache max=10000 inactive=5m;
    open_file_cache_valid 2m;
    open_file_cache_min_uses 1;
    open_file_cache_errors on;

    # Buffer sizes
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;

    # Proxy buffers
    proxy_buffer_size 4k;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 32k;
}
```

### 9.2 Benchmarking

```bash
# Test with wrk
wrk -t12 -c400 -d30s https://stone-ai.net/
wrk -t12 -c400 -d30s -s post.lua https://stone-ai.net/api/chat

# Test with hey
hey -n 10000 -c 100 -m GET https://stone-ai.net/
hey -n 1000 -c 10 -m POST -H "Content-Type: application/json" -d '{"message":"test"}' https://stone-ai.net/api/chat

# Test with ab (Apache Bench)
ab -n 10000 -c 100 https://stone-ai.net/
```

---

## 10. Nginx vs Caddy Decision

```
Feature            │ Nginx              │ Caddy
───────────────────┼────────────────────┼────────────────
Auto HTTPS         │ No (manual/certbot)│ Yes (built-in)
Config format      │ Custom syntax      │ Caddyfile / JSON
Performance        │ Slightly faster    │ Very fast
WebSocket          │ Manual config      │ Automatic
HTTP/3             │ Experimental       │ Built-in
Reload             │ nginx -s reload    │ API hot reload
Plugins            │ Compile-time       │ Runtime (xcaddy)
Community          │ Massive            │ Growing
Docker image       │ ~24MB (alpine)     │ ~40MB (alpine)
Learning curve     │ Medium-High        │ Low
Production proven  │ Decades            │ Years
───────────────────┴────────────────────┴────────────────

Palace Recommendation:
  Production (stone-ai.net): Nginx — battle-tested, maximum control
  Development/Tools: Caddy — faster setup, auto-HTTPS
  Either works. Pick one and master it.
```

---

*Chaos Infrastructure Seed — Batch 14. The proxy is the gatekeeper. Every request passes through. Make it fast, make it secure, make it smart.*
