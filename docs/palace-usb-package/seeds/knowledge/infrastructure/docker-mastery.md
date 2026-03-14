# Docker Mastery — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Docker Compose — Production Patterns

### Stone AI Docker Compose (Reference)

```yaml
# docker-compose.yml
version: "3.8"

services:
  db:
    image: pgvector/pgvector:pg16
    container_name: stoneai-db
    restart: unless-stopped
    ports:
      - "127.0.0.1:5432:5432"  # Localhost only — never expose to 0.0.0.0
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    container_name: stoneai-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    volumes:
      - redisdata:/data

volumes:
  pgdata:
    name: stoneai-pgdata
  redisdata:
    name: stoneai-redisdata
```

### depends_on with Health Checks

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    # API won't start until db AND redis are healthy
```

**WARNING**: `depends_on` without `condition` only waits for the container to START, not for the service inside to be READY. Always use health checks.

### Restart Policies

| Policy | Behavior | Use For |
|---|---|---|
| `no` | Never restart | One-off tasks |
| `always` | Always restart, even after `docker stop` | Critical services |
| `unless-stopped` | Restart unless manually stopped | Standard services (Stone AI default) |
| `on-failure` | Only restart on non-zero exit | Services with clean shutdown |
| `on-failure:5` | Restart on failure, max 5 attempts | Prevent restart loops |

### Environment Injection

```yaml
# Method 1: Inline (DON'T — secrets visible in docker inspect)
environment:
  DB_PASSWORD: "mysecret"

# Method 2: .env file (GOOD)
env_file:
  - .env

# Method 3: Host environment variables
environment:
  DB_PASSWORD: ${DB_PASSWORD}  # From host env or .env in same directory

# Method 4: Docker secrets (BEST for production)
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

---

## 2. Networking

### Network Types

| Type | Use Case | Inter-Container DNS |
|---|---|---|
| `bridge` (default) | Isolated container network | Yes, by container name |
| `host` | Container shares host network | No (same network) |
| Custom bridge | Named network for service groups | Yes, by service name |

### Custom Network Configuration

```yaml
services:
  db:
    networks:
      - backend

  api:
    networks:
      - backend
      - frontend

  nginx:
    networks:
      - frontend

networks:
  backend:
    driver: bridge
    internal: true  # No external access — db is isolated
  frontend:
    driver: bridge
```

### DNS Between Containers

Containers on the same Docker network can reach each other by service name:

```bash
# From the api container, reach the database:
psql -h db -U postgres  # "db" resolves to the db container's IP

# From any container on the same network:
ping redis  # Resolves to redis container
curl http://api:3000/health  # Resolves to api container
```

### Localhost-Only Port Exposure

```yaml
# CORRECT: Only accessible from the host machine
ports:
  - "127.0.0.1:5432:5432"

# DANGEROUS: Accessible from any network interface
ports:
  - "5432:5432"  # Same as "0.0.0.0:5432:5432"

# ALWAYS bind to 127.0.0.1 for database and internal services
```

---

## 3. Volume Management

### Named Volumes vs Bind Mounts

```yaml
# Named volume — Docker manages the storage location
volumes:
  - pgdata:/var/lib/postgresql/data
# Where it lives: /var/lib/docker/volumes/pgdata/_data
# Pros: Portable, Docker handles permissions, easy backup
# Cons: Less visible, harder to browse directly

# Bind mount — Maps a host directory into the container
volumes:
  - ./data/postgres:/var/lib/postgresql/data
# Pros: Visible on host, easy to inspect
# Cons: Permission issues, not portable, slower on WSL2 /mnt/c

# tmpfs — In-memory, ephemeral
tmpfs:
  - /tmp
# Pros: Fast, auto-cleaned
# Cons: Lost on restart, counts against RAM
```

### Volume Backup

```bash
# Backup a named volume using an alpine container
docker run --rm \
  -v stoneai-pgdata:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/pgdata-$(date +%Y%m%d).tar.gz -C /source .

# Restore a named volume
docker run --rm \
  -v stoneai-pgdata:/target \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/pgdata-20240101.tar.gz -C /target"
```

### Orphan Volume Cleanup

```bash
# List all volumes
docker volume ls

# List dangling (unused) volumes
docker volume ls -f dangling=true

# Remove dangling volumes
docker volume prune

# Remove a specific volume (container must be stopped/removed first)
docker volume rm stoneai-pgdata

# WARNING: docker volume prune is DESTRUCTIVE. Double-check before running.
```

---

## 4. GPU Passthrough

### NVIDIA Container Toolkit Setup

```bash
# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# Verify
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
```

### Docker Run with GPU

```bash
# All GPUs
docker run --gpus all myimage

# Specific GPU
docker run --gpus '"device=0"' myimage

# Specific GPU count
docker run --gpus 2 myimage
```

### Docker Compose with GPU

```yaml
services:
  vllm:
    image: vllm/vllm-openai:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1  # or "all"
              capabilities: [gpu]
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - /mnt/c/models:/models:ro
    command: >
      --model /models/qwen3-32b-awq
      --quantization awq_marlin
      --max-model-len 32768
      --gpu-memory-utilization 0.90
```

---

## 5. Health Checks

### PostgreSQL

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s  # Grace period for initial startup
```

### Redis

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 3s
  retries: 5
```

### vLLM

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 120s  # vLLM takes time to load model
```

### Generic HTTP Service

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
  interval: 15s
  timeout: 5s
  retries: 3
  start_period: 30s
```

### Health Check Parameters

| Parameter | Purpose | Recommendation |
|---|---|---|
| `test` | Command to run | Use `CMD-SHELL` for pipes/redirects, `CMD` for simple commands |
| `interval` | Time between checks | 10-30s for production |
| `timeout` | Max time for check to complete | 3-10s |
| `retries` | Failures before "unhealthy" | 3-5 |
| `start_period` | Grace period after start | Set to expected startup time |

---

## 6. Security

### Non-Root Users

```dockerfile
# In Dockerfile
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

# Copy files with correct ownership
COPY --chown=appuser:appgroup . /app

USER appuser
```

### Read-Only Root Filesystem

```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    # Only /tmp and /var/run are writable
```

### Capability Dropping

```yaml
services:
  api:
    cap_drop:
      - ALL  # Drop everything
    cap_add:
      - NET_BIND_SERVICE  # Only add what's needed
    security_opt:
      - no-new-privileges:true
```

### Secrets Management

```yaml
# docker-compose.yml
services:
  api:
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt
```

Inside the container, secrets appear at `/run/secrets/<name>`:
```bash
# In application code or entrypoint script
DB_PASSWORD=$(cat /run/secrets/db_password)
```

---

## 7. Troubleshooting

### Container Logs

```bash
# Follow logs (last 100 lines)
docker logs -f --tail 100 stoneai-db

# Logs since a timestamp
docker logs --since 2024-01-01T12:00:00 stoneai-db

# All logs (can be huge)
docker logs stoneai-db 2>&1 | less
```

### Interactive Debugging

```bash
# Shell into a running container
docker exec -it stoneai-db bash
# Or for alpine-based images:
docker exec -it stoneai-redis sh

# Run a one-off command in a container
docker exec stoneai-db pg_isready

# Start a container with shell override (for debugging startup issues)
docker run -it --entrypoint /bin/bash myimage
```

### Resource Monitoring

```bash
# Live resource usage
docker stats
# Shows: CPU %, MEM USAGE/LIMIT, NET I/O, BLOCK I/O

# Specific container
docker stats stoneai-db

# One-shot (for scripts)
docker stats --no-stream --format "{{.Name}}: CPU={{.CPUPerc}} MEM={{.MemUsage}}"
```

### Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes (CAREFUL — data loss possible)
docker volume prune

# Remove everything unused (containers, images, networks, volumes)
docker system prune -a --volumes
# WARNING: This removes ALL unused resources. Be very sure.

# See what's using disk space
docker system df
docker system df -v  # Verbose
```

### Common Issues

**Symptom**: Container exits immediately
```bash
# Check exit code and logs
docker ps -a | grep <container>  # Look at STATUS column
docker logs <container>
# Exit code 0 = clean exit (command finished)
# Exit code 1 = error
# Exit code 137 = killed (OOM or docker kill)
# Exit code 139 = segfault
```

**Symptom**: "port is already allocated"
```bash
# Find what's using the port
ss -tlnp | grep :<port>
# Or on the Docker side:
docker ps --format "{{.Names}}: {{.Ports}}" | grep <port>
```

**Symptom**: Container can't resolve DNS
```bash
# Check Docker's DNS config
docker exec <container> cat /etc/resolv.conf
# If it shows 127.0.0.11, Docker's embedded DNS is active (normal)

# Test DNS
docker exec <container> nslookup google.com

# Fix: specify DNS in docker-compose
services:
  api:
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

**Symptom**: Permission denied on volume mount
```bash
# Check file ownership
ls -la /path/on/host

# Fix: match UID/GID in container
docker run -u $(id -u):$(id -g) ...

# Or fix host permissions
sudo chown -R 1001:1001 /path/on/host  # Match container user
```

---

## 8. Multi-Stage Builds

### Reducing Image Size

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
# Only copy what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./

USER node
EXPOSE 3000
CMD ["npm", "start"]
```

### Layer Caching Strategy

```dockerfile
# GOOD: Dependencies change less often than code
# Install deps first (cached if package.json unchanged)
COPY package.json package-lock.json ./
RUN npm ci

# Then copy code (this layer changes frequently)
COPY . .
RUN npm run build

# BAD: Copying everything first busts cache on ANY file change
COPY . .
RUN npm ci && npm run build
```

### Image Size Comparison

| Base Image | Size | Use For |
|---|---|---|
| `node:20` | ~1GB | Never in production |
| `node:20-slim` | ~200MB | When you need apt |
| `node:20-alpine` | ~130MB | Production standard |
| `distroless/nodejs20` | ~120MB | Maximum security (no shell) |

---

## 9. Docker Compose Operations

### Common Commands

```bash
# Start all services (detached)
docker compose up -d

# Start specific service
docker compose up -d db

# Stop all services
docker compose down

# Stop and remove volumes (DESTROYS DATA)
docker compose down -v

# Rebuild images
docker compose build --no-cache

# Pull latest images
docker compose pull

# View running services
docker compose ps

# View logs
docker compose logs -f --tail 50

# Restart a specific service
docker compose restart db

# Scale a service (if not using container_name)
docker compose up -d --scale worker=3

# Execute command in running service
docker compose exec db psql -U postgres
```

### Environment File Precedence

Docker Compose reads `.env` from the same directory as `docker-compose.yml`.

```bash
# .env
DB_USER=stoneai
DB_PASSWORD=changeme
DB_NAME=stoneai_dev

# Override for production
# docker compose --env-file .env.production up -d
```

---

## 10. Docker + UFW Gotcha (CRITICAL)

**Docker bypasses UFW firewall rules by default.** This is the #1 Docker security mistake.

```bash
# You set this:
sudo ufw deny 5432
# Thinking PostgreSQL is blocked from external access

# But Docker adds its own iptables rules that BYPASS UFW
# Port 5432 is still accessible from outside!
```

### Fix: Always Bind to 127.0.0.1

```yaml
# SAFE
ports:
  - "127.0.0.1:5432:5432"

# UNSAFE (even with UFW blocking 5432)
ports:
  - "5432:5432"
```

### Alternative Fix: Disable Docker's iptables Management

```json
// /etc/docker/daemon.json
{
  "iptables": false
}
```

Then restart Docker: `sudo systemctl restart docker`

**Warning**: This means Docker can't create its own network rules. You'll need to manage iptables manually for container networking.

---

## 11. Quick Reference Card

| Task | Command |
|---|---|
| Start services | `docker compose up -d` |
| Stop services | `docker compose down` |
| View logs | `docker compose logs -f --tail 50` |
| Container shell | `docker exec -it <name> bash` |
| Resource usage | `docker stats` |
| Disk usage | `docker system df` |
| Clean everything | `docker system prune -a` |
| List containers | `docker ps -a` |
| List volumes | `docker volume ls` |
| List networks | `docker network ls` |
| Inspect container | `docker inspect <name>` |
| Copy file from container | `docker cp <name>:/path /host/path` |
| Build image | `docker build -t myimage .` |
| Build no cache | `docker build --no-cache -t myimage .` |
