# Container Orchestration Advanced — Palace Infrastructure Seed

## Chaos Directive: Production Docker Patterns for the OMEN 45L

This seed covers advanced Docker Compose patterns, multi-container application design, networking, volume management, health checks, and resource governance. The Palace already runs Docker containers (stoneai-db, MCP playwright/obsidian). This seed takes that foundation to production-grade orchestration.

---

## 1. Docker Compose Production Architecture

### 1.1 Multi-Stage Compose Files

Production deployments use layered compose files. Base services in one file, overrides for environment-specific configuration.

**docker-compose.yml (base):**

```yaml
version: "3.9"

x-common-env: &common-env
  NODE_ENV: production
  TZ: America/New_York

x-logging: &default-logging
  driver: json-file
  options:
    max-size: "50m"
    max-file: "5"
    tag: "{{.Name}}"

x-healthcheck-defaults: &healthcheck-defaults
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
      args:
        NODE_VERSION: "20"
    image: stone-ai/web:${VERSION:-latest}
    container_name: stone-ai-web
    restart: unless-stopped
    environment:
      <<: *common-env
      PORT: "3000"
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
    ports:
      - "${WEB_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "4.0"
          memory: 4G
        reservations:
          cpus: "1.0"
          memory: 1G
    networks:
      - frontend
      - backend
    volumes:
      - uploads:/app/uploads
    labels:
      com.stone-ai.service: "web"
      com.stone-ai.tier: "frontend"

  db:
    image: pgvector/pgvector:pg16
    container_name: stoneai-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      start_period: 30s
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "4.0"
          memory: 8G
        reservations:
          cpus: "2.0"
          memory: 4G
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    networks:
      - backend
    shm_size: '2gb'
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=2GB"
      - "-c"
      - "effective_cache_size=6GB"
      - "-c"
      - "work_mem=256MB"
      - "-c"
      - "maintenance_work_mem=512MB"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "random_page_cost=1.1"
      - "-c"
      - "effective_io_concurrency=200"
      - "-c"
      - "wal_buffers=64MB"
      - "-c"
      - "max_wal_size=4GB"
      - "-c"
      - "checkpoint_completion_target=0.9"

  redis:
    image: redis:7-alpine
    container_name: stoneai-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD", "redis-cli", "ping"]
      start_period: 10s
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 2G
        reservations:
          cpus: "0.25"
          memory: 256M
    volumes:
      - redis-data:/data
    networks:
      - backend
    command: >
      redis-server
      --maxmemory 1gb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --appendfsync everysec
      --save 900 1
      --save 300 10
      --save 60 10000

  vllm:
    image: vllm/vllm-openai:latest
    container_name: stoneai-vllm
    restart: unless-stopped
    runtime: nvidia
    environment:
      <<: *common-env
      NVIDIA_VISIBLE_DEVICES: all
      CUDA_VISIBLE_DEVICES: "0"
    ports:
      - "${VLLM_PORT:-8000}:8000"
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      start_period: 120s
      interval: 60s
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "8.0"
          memory: 48G
        reservations:
          cpus: "4.0"
          memory: 32G
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - models:/models
      - /dev/shm:/dev/shm
    networks:
      - backend
    command: >
      --model /models/qwen2.5-32b-awq
      --quantization awq
      --gpu-memory-utilization 0.90
      --max-model-len 32768
      --host 0.0.0.0
      --port 8000

volumes:
  pgdata:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/nvme/docker/pgdata
  redis-data:
    driver: local
  models:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/nvme/models
  uploads:
    driver: local

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/24
  backend:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.20.1.0/24
```

**docker-compose.override.yml (development):**

```yaml
version: "3.9"

services:
  web:
    build:
      target: development
    environment:
      NODE_ENV: development
      DEBUG: "stone-ai:*"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
      - "9229:9229"  # Node debugger
    command: npm run dev
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G

  db:
    ports:
      - "5432:5432"

  adminer:
    image: adminer:latest
    container_name: stoneai-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    networks:
      - backend
      - frontend
    depends_on:
      - db
```

**docker-compose.prod.yml (production overrides):**

```yaml
version: "3.9"

services:
  web:
    build:
      target: production
    environment:
      NODE_ENV: production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "4.0"
          memory: 4G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: start-first

  nginx:
    image: nginx:alpine
    container_name: stoneai-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - certs:/etc/nginx/certs:ro
    depends_on:
      - web
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  certs:
    external: true
```

### 1.2 Launching with Multiple Compose Files

```bash
# Development
docker compose up -d

# Production (base + prod overrides)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Build and launch
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View merged config
docker compose -f docker-compose.yml -f docker-compose.prod.yml config
```

---

## 2. Multi-Stage Dockerfiles

### 2.1 Next.js Production Dockerfile

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts
RUN npx prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# ============================================
# Stage 4: Development
# ============================================
FROM node:20-alpine AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development

EXPOSE 3000 9229

CMD ["npm", "run", "dev"]
```

### 2.2 Image Optimization

```bash
# Build with BuildKit for better caching
DOCKER_BUILDKIT=1 docker build \
  --target production \
  --cache-from stone-ai/web:latest \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t stone-ai/web:$(git rev-parse --short HEAD) \
  -t stone-ai/web:latest \
  .

# Inspect image layers
docker history stone-ai/web:latest --human --no-trunc

# Check image size
docker images stone-ai/web --format "{{.Repository}}:{{.Tag}} {{.Size}}"

# Scan for vulnerabilities
docker scout cves stone-ai/web:latest
```

**Image size comparison:**

| Image Type | Typical Size |
|-----------|-------------|
| node:20 (full) | ~1GB |
| node:20-slim | ~200MB |
| node:20-alpine | ~130MB |
| Next.js standalone (alpine) | ~150-200MB |
| Distroless | ~100-150MB |

---

## 3. Docker Networking Deep Dive

### 3.1 Network Isolation Architecture

```
┌─────────────────────────────────────────────┐
│                   HOST                       │
│                                              │
│  ┌──────────── frontend ─────────────────┐  │
│  │  172.20.0.0/24                        │  │
│  │  ┌───────┐  ┌───────┐  ┌───────────┐ │  │
│  │  │ nginx │  │  web  │  │  adminer   │ │  │
│  │  │ :80   │  │ :3000 │  │  :8080    │ │  │
│  │  └───┬───┘  └──┬────┘  └───────────┘ │  │
│  └──────┼─────────┼─────────────────────-┘  │
│         │         │                          │
│  ┌──────┼─────────┼── backend ───────────┐  │
│  │  172.20.1.0/24 (internal)             │  │
│  │         │         │                    │  │
│  │         ▼         ▼                    │  │
│  │  ┌───────┐  ┌───────┐  ┌───────────┐ │  │
│  │  │  db   │  │ redis │  │   vllm    │ │  │
│  │  │ :5432 │  │ :6379 │  │  :8000    │ │  │
│  │  └───────┘  └───────┘  └───────────┘ │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

The `backend` network is `internal: true` — no direct internet access from database or cache containers.

### 3.2 Custom Network Configuration

```yaml
networks:
  # Public-facing network
  frontend:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: br-frontend
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/24
          gateway: 172.20.0.1

  # Internal services (no external access)
  backend:
    driver: bridge
    internal: true
    driver_opts:
      com.docker.network.bridge.name: br-backend
    ipam:
      driver: default
      config:
        - subnet: 172.20.1.0/24
          gateway: 172.20.1.1

  # Monitoring network
  monitoring:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.20.2.0/24
```

### 3.3 DNS and Service Discovery

Docker Compose creates automatic DNS entries for each service. Containers resolve each other by service name.

```bash
# Inside any container on the same network:
ping db          # Resolves to db container IP
ping redis       # Resolves to redis container IP
ping vllm        # Resolves to vllm container IP

# Custom aliases
services:
  db:
    networks:
      backend:
        aliases:
          - postgres
          - database
          - stoneai-db
```

### 3.4 Cross-Container Communication Patterns

```yaml
# Wait-for pattern using depends_on conditions
services:
  web:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      vllm:
        condition: service_healthy

  # Migration runner (runs once, exits)
  migrate:
    build:
      context: .
      target: deps
    command: npx prisma migrate deploy
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
    networks:
      - backend
    profiles:
      - migration
```

---

## 4. Volume Management

### 4.1 Volume Types and Use Cases

```yaml
volumes:
  # Named volume (Docker-managed)
  pgdata:
    name: stoneai-pgdata
    labels:
      com.stone-ai.purpose: "database"
      com.stone-ai.backup: "required"

  # Bind mount to specific host path (NVMe)
  models:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/nvme/models

  # tmpfs (RAM-backed, ephemeral)
  cache:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
      o: size=2g,uid=1001
```

### 4.2 Backup and Restore Volumes

```bash
# Backup a named volume
docker run --rm \
  -v stoneai-pgdata:/source:ro \
  -v /mnt/nvme/backups:/backup \
  alpine tar czf /backup/pgdata-$(date +%Y%m%d_%H%M%S).tar.gz -C /source .

# Restore a volume
docker run --rm \
  -v stoneai-pgdata:/target \
  -v /mnt/nvme/backups:/backup:ro \
  alpine sh -c "cd /target && tar xzf /backup/pgdata-20260309_020000.tar.gz"

# Database-specific backup (preferred for Postgres)
docker exec stoneai-db pg_dump -U $DB_USER $DB_NAME | gzip > backup.sql.gz

# Full volume list with sizes
docker system df -v | head -40
```

### 4.3 Volume Lifecycle Management

```bash
# List volumes
docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Labels}}"

# Inspect volume
docker volume inspect stoneai-pgdata

# Prune unused volumes (CAREFUL)
docker volume prune --filter "label!=com.stone-ai.backup=required"

# Monitor volume disk usage
docker system df
docker system df -v
```

### 4.4 Shared Memory for vLLM

```yaml
services:
  vllm:
    shm_size: '16gb'  # Method 1: shm_size directive
    volumes:
      - type: tmpfs     # Method 2: tmpfs mount
        target: /dev/shm
        tmpfs:
          size: 17179869184  # 16GB in bytes
```

vLLM uses shared memory for inter-process communication during tensor operations. Insufficient `/dev/shm` causes NCCL errors and inference failures.

---

## 5. Health Checks

### 5.1 Health Check Strategies by Service Type

**HTTP endpoint (Next.js, vLLM):**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**TCP socket (database, Redis):**

```yaml
# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d stoneai"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# Redis
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 3s
  retries: 5
  start_period: 5s
```

**Custom script:**

```yaml
healthcheck:
  test: ["CMD", "/healthcheck.sh"]
  interval: 30s
  timeout: 15s
  retries: 3
  start_period: 60s
```

```bash
#!/bin/bash
# /healthcheck.sh
set -e

# Check if vLLM API responds
curl -sf http://localhost:8000/health || exit 1

# Check GPU memory isn't exhausted
GPU_MEM_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits)
GPU_MEM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits)
USAGE_PCT=$((GPU_MEM_USED * 100 / GPU_MEM_TOTAL))

if [ $USAGE_PCT -gt 98 ]; then
  echo "GPU memory critical: ${USAGE_PCT}%"
  exit 1
fi

exit 0
```

### 5.2 Dependency Health Chains

```yaml
services:
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 5s
      start_period: 30s

  migrate:
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  web:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully  # Waits for exit code 0
```

---

## 6. Resource Limits and Governance

### 6.1 CPU and Memory Limits

```yaml
deploy:
  resources:
    limits:
      cpus: "4.0"       # Hard cap
      memory: 4G         # OOM-killed if exceeded
      pids: 200          # Process limit
    reservations:
      cpus: "1.0"        # Guaranteed minimum
      memory: 1G         # Guaranteed minimum
```

### 6.2 GPU Resource Allocation

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1          # Number of GPUs
          capabilities: [gpu, compute, utility]
          # device_ids: ["0"]  # Specific GPU by ID
```

### 6.3 I/O Limits

```yaml
services:
  db:
    blkio_config:
      weight: 500
      device_read_bps:
        - path: /dev/nvme0n1
          rate: '500mb'
      device_write_bps:
        - path: /dev/nvme0n1
          rate: '200mb'
      device_read_iops:
        - path: /dev/nvme0n1
          rate: 10000
      device_write_iops:
        - path: /dev/nvme0n1
          rate: 5000
```

### 6.4 OMEN Resource Budget

```
Total: 64GB RAM, RTX 5090 32GB VRAM, ~24 cores (Ryzen)

┌─────────────────────────────────────────────┐
│ Service        │ CPU │ RAM   │ GPU VRAM     │
├────────────────┼─────┼───────┼──────────────┤
│ PostgreSQL     │ 4   │ 8GB   │ —            │
│ Redis          │ 1   │ 2GB   │ —            │
│ vLLM           │ 8   │ 48GB* │ 28GB         │
│ Next.js (×2)   │ 4   │ 4GB   │ —            │
│ Nginx          │ 0.5 │ 256MB │ —            │
│ Monitoring     │ 2   │ 2GB   │ —            │
│ System/WSL2    │ 4   │ 8GB   │ —            │
│ ────────────── │ ──  │ ────  │ ──────       │
│ TOTAL          │ ~24 │ ~64GB │ ~28GB        │
│ Headroom       │ ~0  │ ~0GB  │ ~4GB         │
└─────────────────────────────────────────────┘

* vLLM 48GB includes shared memory + model loading overhead
```

This is tight. If running all services simultaneously, the OMEN is near capacity. Consider:
- Reducing vLLM memory reservation when not actively serving
- Using swap for non-critical services
- Shutting down monitoring in dev mode

---

## 7. Container Security

### 7.1 Security Best Practices

```yaml
services:
  web:
    security_opt:
      - no-new-privileges:true
    read_only: true           # Read-only root filesystem
    tmpfs:
      - /tmp
      - /var/run
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE      # Only if binding to port <1024
    user: "1001:1001"
```

### 7.2 Secrets Management

```yaml
# Docker secrets (compose v3.9+)
secrets:
  db_password:
    file: ./secrets/db_password.txt
  clerk_secret:
    environment: CLERK_SECRET_KEY

services:
  web:
    secrets:
      - db_password
      - clerk_secret
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
```

### 7.3 Image Security Scanning

```bash
# Scan with Docker Scout
docker scout cves stone-ai/web:latest
docker scout recommendations stone-ai/web:latest

# Scan with Trivy
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image stone-ai/web:latest

# Scan with Grype
grype stone-ai/web:latest
```

---

## 8. Logging and Monitoring

### 8.1 Log Drivers

```yaml
services:
  web:
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
        tag: "{{.Name}}/{{.ID}}"
        compress: "true"

  # Send logs to Loki
  vllm:
    logging:
      driver: loki
      options:
        loki-url: "http://localhost:3100/loki/api/v1/push"
        loki-batch-size: "400"
        loki-retries: "3"
        loki-external-labels: "job=vllm,environment=production"
```

### 8.2 Container Metrics

```bash
# Real-time stats
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# cAdvisor for Prometheus metrics
docker run -d \
  --name cadvisor \
  --restart unless-stopped \
  -v /:/rootfs:ro \
  -v /var/run:/var/run:ro \
  -v /sys:/sys:ro \
  -v /var/lib/docker/:/var/lib/docker:ro \
  -p 8081:8080 \
  gcr.io/cadvisor/cadvisor:latest
```

### 8.3 Monitoring Stack (Compose)

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: stoneai-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 2G

  grafana:
    image: grafana/grafana:latest
    container_name: stoneai-grafana
    restart: unless-stopped
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-clock-panel,grafana-piechart-panel
    networks:
      - monitoring
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

  node-exporter:
    image: prom/node-exporter:latest
    container_name: stoneai-node-exporter
    restart: unless-stopped
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring
    deploy:
      resources:
        limits:
          cpus: "0.25"
          memory: 128M

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    internal: true
```

---

## 9. Operational Patterns

### 9.1 Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh

CURRENT=$(docker inspect --format '{{.Config.Labels.deployment}}' stoneai-web-active 2>/dev/null || echo "blue")
NEXT=$( [ "$CURRENT" = "blue" ] && echo "green" || echo "blue" )

echo "Current: $CURRENT, Deploying: $NEXT"

# Start new version
docker compose -f docker-compose.yml -f docker-compose.$NEXT.yml up -d --build web

# Wait for health
echo "Waiting for $NEXT to become healthy..."
for i in {1..30}; do
  if docker inspect --format '{{.State.Health.Status}}' stoneai-web-$NEXT 2>/dev/null | grep -q healthy; then
    echo "$NEXT is healthy!"
    break
  fi
  sleep 2
done

# Switch traffic
docker exec stoneai-nginx nginx -s reload

# Stop old version
docker compose -f docker-compose.$CURRENT.yml stop web

echo "Deployed $NEXT successfully"
```

### 9.2 Rolling Updates

```bash
# Scale up, then scale down
docker compose up -d --scale web=3 --no-recreate
sleep 10
docker compose up -d --scale web=2 --force-recreate
```

### 9.3 Maintenance Scripts

```bash
# Full system cleanup
docker system prune -af --volumes --filter "until=168h"  # 7 days

# Rotate logs
docker compose logs --no-log-prefix web > /mnt/nvme/logs/web-$(date +%Y%m%d).log
truncate -s 0 $(docker inspect --format='{{.LogPath}}' stoneai-web)

# Health check all services
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Resource snapshot
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

### 9.4 Automated Restarts and Watchdog

```bash
#!/bin/bash
# watchdog.sh — run via cron every 5 minutes

SERVICES=("stoneai-web" "stoneai-db" "stoneai-redis" "stoneai-vllm")

for svc in "${SERVICES[@]}"; do
  STATUS=$(docker inspect --format '{{.State.Status}}' "$svc" 2>/dev/null)
  HEALTH=$(docker inspect --format '{{.State.Health.Status}}' "$svc" 2>/dev/null)

  if [ "$STATUS" != "running" ]; then
    echo "$(date): $svc is $STATUS — restarting"
    docker start "$svc"
  elif [ "$HEALTH" = "unhealthy" ]; then
    echo "$(date): $svc is unhealthy — restarting"
    docker restart "$svc"
  fi
done
```

---

## 10. Docker Compose CLI Reference

```bash
# Lifecycle
docker compose up -d                     # Start all
docker compose up -d --build             # Rebuild and start
docker compose down                      # Stop and remove
docker compose down -v                   # Stop, remove, and delete volumes
docker compose restart web               # Restart specific service
docker compose stop                      # Stop without removing

# Scaling
docker compose up -d --scale web=3       # Run 3 web instances

# Debugging
docker compose logs -f web               # Follow web logs
docker compose logs --tail=100 vllm      # Last 100 lines
docker compose exec db psql -U postgres  # Execute in running container
docker compose run --rm web npm test     # Run one-off command

# Information
docker compose ps                        # Service status
docker compose top                       # Running processes
docker compose config                    # Validate and view merged config
docker compose images                    # List images used

# Profiles
docker compose --profile migration up -d # Include migration profile
docker compose --profile debug up -d     # Include debug tools
```

---

## 11. Troubleshooting Common Issues

### 11.1 Container Won't Start

```bash
# Check logs
docker compose logs web --tail=50

# Check events
docker events --filter container=stoneai-web --since 10m

# Inspect container state
docker inspect stoneai-web | jq '.[0].State'

# Check resource availability
docker system info | grep -E "Memory|CPUs"
```

### 11.2 Network Connectivity Issues

```bash
# Test DNS resolution between containers
docker exec stoneai-web nslookup db
docker exec stoneai-web ping -c 3 db

# Check network configuration
docker network inspect stone-ai_backend

# Verify port mappings
docker port stoneai-web
```

### 11.3 Volume Permission Issues

```bash
# Check volume ownership
docker exec stoneai-db ls -la /var/lib/postgresql/data

# Fix permissions
docker run --rm -v stoneai-pgdata:/data alpine chown -R 999:999 /data

# Check volume mount
docker inspect stoneai-db | jq '.[0].Mounts'
```

### 11.4 GPU Not Available

```bash
# Verify NVIDIA runtime
docker info | grep -i nvidia
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# Check Docker daemon config
cat /etc/docker/daemon.json
# Should contain:
# {
#   "runtimes": {
#     "nvidia": {
#       "path": "nvidia-container-runtime",
#       "runtimeArgs": []
#     }
#   }
# }
```

---

*Chaos Infrastructure Seed — Batch 14. Containers are the Palace walls. Build them right.*
