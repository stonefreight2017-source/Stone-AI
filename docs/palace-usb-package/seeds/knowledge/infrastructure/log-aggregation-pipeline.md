# Log Aggregation Pipeline — Palace Infrastructure Seed

## Chaos Directive: Centralized Logging for the Palace

Every service in the Palace produces logs — Next.js, vLLM, PostgreSQL, Redis, Nginx, Docker, system events. Without centralized logging, troubleshooting means SSH-ing into boxes and grepping files. This seed covers the Loki/Grafana stack, log rotation, parsing, alerting on patterns, and making logs useful.

---

## 1. Logging Architecture

```
┌─────────────────────────────────────────────────────┐
│                    OMEN 45L                          │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Next.js  │  │  vLLM    │  │ Postgres │          │
│  │ stdout   │  │ stdout   │  │ pg_log   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │                 │
│  ┌────┴──────────────┴──────────────┴─────┐         │
│  │            Promtail / Alloy            │         │
│  │     (Log collector & label injector)    │         │
│  └────────────────┬───────────────────────┘         │
│                   │                                  │
│  ┌────────────────┴───────────────────────┐         │
│  │              Grafana Loki              │         │
│  │        (Log storage & indexing)         │         │
│  └────────────────┬───────────────────────┘         │
│                   │                                  │
│  ┌────────────────┴───────────────────────┐         │
│  │             Grafana                    │         │
│  │      (Visualization & alerting)        │         │
│  └────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

---

## 2. Grafana Loki Setup

### 2.1 Loki Configuration

```yaml
# loki-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096
  log_level: info

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

storage_config:
  filesystem:
    directory: /loki/storage
  tsdb_shipper:
    active_index_directory: /loki/tsdb-index
    cache_location: /loki/tsdb-cache

limits_config:
  reject_old_samples: true
  reject_old_samples_max_age: 168h  # 7 days
  max_cache_freshness_per_query: 10m
  split_queries_by_interval: 15m
  max_query_series: 500
  max_query_parallelism: 16
  ingestion_rate_mb: 16
  ingestion_burst_size_mb: 32
  per_stream_rate_limit: 5MB
  per_stream_rate_limit_burst: 15MB

compactor:
  working_directory: /loki/compactor
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h  # 30 days

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

analytics:
  reporting_enabled: false
```

### 2.2 Loki Docker Deployment

```yaml
# docker-compose.logging.yml
services:
  loki:
    image: grafana/loki:3.0.0
    container_name: stoneai-loki
    restart: unless-stopped
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/config.yaml:ro
      - loki-data:/loki
    command: -config.file=/etc/loki/config.yaml
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3100/ready || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
    networks:
      - monitoring

volumes:
  loki-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/nvme/loki
```

---

## 3. Promtail Log Collector

### 3.1 Promtail Configuration

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push
    batchwait: 1s
    batchsize: 1048576
    timeout: 10s
    backoff_config:
      min_period: 500ms
      max_period: 5m
      max_retries: 10

scrape_configs:
  # Docker container logs
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/?(.*)'
        target_label: container
      - source_labels: ['__meta_docker_container_label_com_stone_ai_service']
        target_label: service
      - source_labels: ['__meta_docker_container_label_com_stone_ai_tier']
        target_label: tier
    pipeline_stages:
      - docker: {}
      - timestamp:
          source: time
          format: RFC3339Nano

  # Next.js application logs
  - job_name: nextjs
    static_configs:
      - targets: [localhost]
        labels:
          job: nextjs
          service: stone-ai-web
          __path__: /var/log/stone-ai/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: msg
            timestamp: time
            method: method
            url: url
            status: status
            duration: duration
      - labels:
          level:
          method:
          status:
      - timestamp:
          source: timestamp
          format: RFC3339

  # vLLM logs
  - job_name: vllm
    static_configs:
      - targets: [localhost]
        labels:
          job: vllm
          service: inference
          __path__: /var/log/vllm/*.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<level>\w+) (?P<message>.*)$'
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: "2006-01-02 15:04:05,000"

  # PostgreSQL logs
  - job_name: postgresql
    static_configs:
      - targets: [localhost]
        labels:
          job: postgresql
          service: database
          __path__: /var/log/postgresql/*.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w+) \[(?P<pid>\d+)\] (?P<level>\w+):  (?P<message>.*)$'
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: "2006-01-02 15:04:05.000 MST"

  # Nginx access logs (JSON format)
  - job_name: nginx-access
    static_configs:
      - targets: [localhost]
        labels:
          job: nginx
          service: proxy
          log_type: access
          __path__: /var/log/nginx/access.log
    pipeline_stages:
      - json:
          expressions:
            remote_addr: remote_addr
            method: method
            uri: uri
            status: status
            request_time: request_time
            upstream_time: upstream_time
      - labels:
          method:
          status:
      - metrics:
          request_duration:
            type: histogram
            description: "Request duration in seconds"
            source: request_time
            config:
              buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

  # Nginx error logs
  - job_name: nginx-error
    static_configs:
      - targets: [localhost]
        labels:
          job: nginx
          service: proxy
          log_type: error
          __path__: /var/log/nginx/error.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[(?P<level>\w+)\] (?P<message>.*)$'
      - labels:
          level:

  # System logs
  - job_name: syslog
    journal:
      max_age: 12h
      labels:
        job: syslog
    relabel_configs:
      - source_labels: ['__journal__systemd_unit']
        target_label: unit
      - source_labels: ['__journal_priority_keyword']
        target_label: level
```

### 3.2 Promtail Docker Deployment

```yaml
services:
  promtail:
    image: grafana/promtail:3.0.0
    container_name: stoneai-promtail
    restart: unless-stopped
    volumes:
      - ./promtail-config.yaml:/etc/promtail/config.yaml:ro
      - /var/log:/var/log:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - promtail-positions:/tmp
    command: -config.file=/etc/promtail/config.yaml
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
    networks:
      - monitoring
    depends_on:
      - loki
```

---

## 4. Log Rotation

### 4.1 Logrotate Configuration

```bash
# /etc/logrotate.d/stone-ai
/var/log/stone-ai/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 100M
    dateext
    dateformat -%Y%m%d
}

# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 640 nginx adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
    maxsize 200M
}

# /etc/logrotate.d/vllm
/var/log/vllm/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 500M
}

# /etc/logrotate.d/postgresql
/var/log/postgresql/*.log {
    weekly
    rotate 12
    compress
    delaycompress
    missingok
    notifempty
    create 640 postgres postgres
    maxsize 500M
}
```

### 4.2 Docker Log Rotation

```json
// /etc/docker/daemon.json (log section)
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "50m",
        "max-file": "5",
        "compress": "true",
        "tag": "{{.Name}}"
    }
}
```

### 4.3 Log Size Monitoring

```bash
#!/bin/bash
# log-size-monitor.sh
echo "===== Log Disk Usage ====="
du -sh /var/log/stone-ai/ 2>/dev/null
du -sh /var/log/nginx/ 2>/dev/null
du -sh /var/log/vllm/ 2>/dev/null
du -sh /var/log/postgresql/ 2>/dev/null
du -sh /mnt/nvme/loki/ 2>/dev/null

echo -e "\n===== Docker Log Sizes ====="
for container in $(docker ps --format '{{.Names}}'); do
    LOG_FILE=$(docker inspect --format='{{.LogPath}}' "$container")
    if [ -f "$LOG_FILE" ]; then
        SIZE=$(du -sh "$LOG_FILE" | cut -f1)
        echo "$container: $SIZE"
    fi
done

TOTAL=$(du -sh /var/log/ 2>/dev/null | cut -f1)
echo -e "\nTotal /var/log: $TOTAL"
```

---

## 5. Log Parsing and Enrichment

### 5.1 Structured Logging in Next.js

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'stone-ai-web',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || 'unknown',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'secret',
      'token',
      'apiKey',
    ],
    censor: '[REDACTED]',
  },
});

// Usage in API routes
export function apiLogger(req: Request, context: string) {
  return logger.child({
    requestId: crypto.randomUUID(),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
    context,
  });
}
```

### 5.2 vLLM Request Logging

```python
# Custom vLLM logging middleware
import logging
import time
import json

class InferenceLogger:
    def __init__(self):
        self.logger = logging.getLogger('vllm.inference')
        handler = logging.FileHandler('/var/log/vllm/inference.log')
        handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_request(self, request_id, model, prompt_tokens, max_tokens, start_time):
        self.logger.info(json.dumps({
            'type': 'request',
            'request_id': request_id,
            'model': model,
            'prompt_tokens': prompt_tokens,
            'max_tokens': max_tokens,
            'timestamp': time.time(),
        }))

    def log_response(self, request_id, completion_tokens, total_time, ttft):
        self.logger.info(json.dumps({
            'type': 'response',
            'request_id': request_id,
            'completion_tokens': completion_tokens,
            'total_time_ms': round(total_time * 1000, 2),
            'time_to_first_token_ms': round(ttft * 1000, 2),
            'tokens_per_second': round(completion_tokens / total_time, 2) if total_time > 0 else 0,
            'timestamp': time.time(),
        }))
```

---

## 6. Alerting on Log Patterns

### 6.1 Loki Alerting Rules

```yaml
# /etc/loki/rules/stone-ai-alerts.yaml
groups:
  - name: stone-ai-log-alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate({service="stone-ai-web"} |= "ERROR" [5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in Stone AI web"
          description: "More than 10 errors per second in the last 5 minutes"

      # vLLM inference failures
      - alert: InferenceFailures
        expr: |
          sum(rate({service="inference"} |= "error" |= "CUDA" [5m])) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "CUDA errors detected in vLLM"

      # Database connection errors
      - alert: DatabaseConnectionError
        expr: |
          count_over_time({service="stone-ai-web"} |= "ECONNREFUSED" |= "5432" [5m]) > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failures detected"

      # Slow queries
      - alert: SlowDatabaseQueries
        expr: |
          count_over_time({service="database"} |= "duration:" | regexp "duration: (?P<duration>\\d+\\.\\d+) ms" | duration > 5000 [5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Multiple slow database queries detected"

      # Out of memory
      - alert: OutOfMemory
        expr: |
          count_over_time({job=~".+"} |~ "(?i)(out of memory|oom|killed process)" [5m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "OOM event detected"

      # Auth failures
      - alert: AuthenticationFailures
        expr: |
          sum(rate({service="stone-ai-web"} |= "401" [5m])) > 20
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate of authentication failures"

      # Nginx 5xx errors
      - alert: NginxServerErrors
        expr: |
          sum(rate({job="nginx", log_type="access"} | json | status >= 500 [5m])) > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High rate of Nginx 5xx errors"
```

### 6.2 Grafana Alert Notifications

```yaml
# Grafana alerting contact point configuration
# Settings → Alerting → Contact Points

# Email notification
- name: founder-email
  type: email
  settings:
    addresses: "3headedm@gmail.com"
    singleEmail: true
    message: |
      {{ range .Alerts }}
      **{{ .Labels.alertname }}** ({{ .Labels.severity }})
      {{ .Annotations.summary }}
      {{ .Annotations.description }}
      {{ end }}

# Webhook (for custom integrations)
- name: palace-webhook
  type: webhook
  settings:
    url: "http://localhost:3000/api/internal/alerts"
    httpMethod: POST
```

---

## 7. LogQL Query Reference

### 7.1 Basic Queries

```logql
# All logs from a service
{service="stone-ai-web"}

# Filter by level
{service="stone-ai-web"} |= "ERROR"
{service="stone-ai-web"} | json | level="error"

# Multiple filters
{service="stone-ai-web"} |= "api" |= "500" != "health"

# Regex filter
{service="stone-ai-web"} |~ "(?i)timeout|connection refused"

# Time-based
{service="stone-ai-web"} | json | duration > 1000

# Count errors per service
sum by (service) (rate({job=~".+"} |= "error" [5m]))

# Top 10 error messages
topk(10, sum by (message) (count_over_time({service="stone-ai-web"} | json | level="error" [1h])))
```

### 7.2 Advanced Queries

```logql
# Request duration distribution
quantile_over_time(0.95, {job="nginx"} | json | unwrap request_time [5m]) by (uri)

# Error rate as percentage
sum(rate({service="stone-ai-web"} |= "ERROR" [5m])) /
sum(rate({service="stone-ai-web"} [5m])) * 100

# Inference throughput (tokens/sec)
avg_over_time({service="inference"} | json | type="response" | unwrap tokens_per_second [5m])

# Log volume by service (bytes/sec)
sum by (service) (bytes_rate({job=~".+"} [5m]))

# Unique error types in last hour
count(sum by (message) (count_over_time({service="stone-ai-web"} | json | level="error" [1h])))
```

---

## 8. Grafana Dashboards

### 8.1 Palace Log Dashboard

```json
{
  "dashboard": {
    "title": "Palace Logs — Central Dashboard",
    "panels": [
      {
        "title": "Log Volume by Service",
        "type": "timeseries",
        "targets": [{
          "expr": "sum by (service) (rate({job=~\".+\"} [5m]))",
          "legendFormat": "{{service}}"
        }]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [{
          "expr": "sum(rate({job=~\".+\"} |= \"error\" [5m]))"
        }],
        "thresholds": [
          {"color": "green", "value": 0},
          {"color": "yellow", "value": 1},
          {"color": "red", "value": 5}
        ]
      },
      {
        "title": "Recent Errors",
        "type": "logs",
        "targets": [{
          "expr": "{job=~\".+\"} |~ \"(?i)error|fatal|panic|crash\""
        }]
      },
      {
        "title": "HTTP Status Codes",
        "type": "piechart",
        "targets": [{
          "expr": "sum by (status) (count_over_time({job=\"nginx\"} | json [1h]))"
        }]
      },
      {
        "title": "Slowest Endpoints (P95)",
        "type": "table",
        "targets": [{
          "expr": "topk(10, quantile_over_time(0.95, {job=\"nginx\"} | json | unwrap request_time [1h]) by (uri))"
        }]
      }
    ]
  }
}
```

---

## 9. Log Retention and Storage Planning

```
Service          │ Volume/Day │ Retention │ Total Storage
─────────────────┼────────────┼───────────┼──────────────
Next.js          │ ~100MB     │ 30 days   │ ~3GB
vLLM             │ ~200MB     │ 30 days   │ ~6GB
PostgreSQL       │ ~50MB      │ 30 days   │ ~1.5GB
Nginx access     │ ~500MB     │ 30 days   │ ~15GB
Nginx error      │ ~10MB      │ 30 days   │ ~300MB
System (journal) │ ~50MB      │ 14 days   │ ~700MB
Docker           │ ~100MB     │ 14 days   │ ~1.4GB
──────────────────────────────────────────────────────
TOTAL            │ ~1GB/day   │ —         │ ~28GB
Loki overhead    │ —          │ —         │ ~5GB (index)
──────────────────────────────────────────────────────
GRAND TOTAL      │ —          │ —         │ ~33GB

With Loki compression: ~10-15GB actual disk usage
NVMe has plenty of room.
```

---

## 10. Troubleshooting Logging Issues

```
Issue: Promtail not sending logs
  1. Check Promtail targets: curl http://localhost:9080/targets
  2. Check Promtail ready: curl http://localhost:9080/ready
  3. Verify log file permissions
  4. Check Loki is accepting: curl http://localhost:3100/ready

Issue: Loki query timeout
  1. Narrow time range
  2. Add more specific label matchers
  3. Increase query timeout in Loki config
  4. Check Loki resource usage

Issue: Missing logs
  1. Check Promtail positions file
  2. Verify scrape config path matches actual log location
  3. Check for log rotation race conditions
  4. Verify Docker logging driver configuration

Issue: High Loki disk usage
  1. Check retention settings
  2. Run compaction manually: POST /loki/api/v1/compactor/ring/forget
  3. Reduce retention period
  4. Check for label cardinality explosion
```

---

*Chaos Infrastructure Seed — Batch 14. If it happened and nobody logged it, it didn't happen. Log everything. Query fast. Alert early.*
