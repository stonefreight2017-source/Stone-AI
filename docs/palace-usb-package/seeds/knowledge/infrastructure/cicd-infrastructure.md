# CI/CD Infrastructure — Palace Infrastructure Seed

## Chaos Directive: Build Pipelines and Deployment Automation

This seed covers GitHub Actions self-hosted runners on the OMEN 45L, build pipelines for Stone AI, artifact management, deployment automation to Vercel and self-hosted environments, and rollback procedures. The Palace ships code fast and never ships broken code.

---

## 1. GitHub Actions Self-Hosted Runners

### 1.1 Why Self-Hosted

GitHub-hosted runners are limited: 2-core, 7GB RAM, no GPU access, 6-hour job limit. The OMEN 45L can run its own runner with full hardware access — GPU for testing inference, fast NVMe for builds, 64GB RAM for heavy workloads.

### 1.2 Runner Installation on WSL2

```bash
# Create runner directory
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download latest runner
curl -o actions-runner-linux-x64-2.321.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.321.0.tar.gz

# Configure (get token from GitHub repo Settings > Actions > Runners)
./config.sh --url https://github.com/stonefreight2017-source/Stone-AI \
  --token YOUR_REGISTRATION_TOKEN \
  --name omen-45l \
  --labels self-hosted,linux,x64,gpu,omen \
  --work _work

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status

# Or run interactively
./run.sh
```

### 1.3 Runner Configuration

```bash
# Runner environment variables (~/.env file in runner directory)
RUNNER_TOOL_CACHE=/mnt/nvme/runner-cache/tools
AGENT_TOOLSDIRECTORY=/mnt/nvme/runner-cache/tools

# .path file — additional PATH entries
/usr/local/bin
/home/user/.local/bin
/usr/local/cuda/bin
```

### 1.4 Docker-Based Runner (Recommended)

```dockerfile
# Dockerfile.runner
FROM ubuntu:22.04

ARG RUNNER_VERSION=2.321.0
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl jq build-essential libssl-dev libffi-dev python3 python3-venv python3-pip \
    git docker.io nodejs npm sudo \
    && rm -rf /var/lib/apt/lists/*

# Install runner
RUN mkdir /runner
WORKDIR /runner

RUN curl -o actions-runner.tar.gz -L \
    https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
    && tar xzf actions-runner.tar.gz \
    && rm actions-runner.tar.gz \
    && ./bin/installdependencies.sh

# Non-root user
RUN useradd -m runner && echo "runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
USER runner

ENTRYPOINT ["./run.sh"]
```

```yaml
# docker-compose.runner.yml
services:
  github-runner:
    build:
      context: .
      dockerfile: Dockerfile.runner
    container_name: stoneai-runner
    restart: unless-stopped
    environment:
      RUNNER_NAME: omen-45l-docker
      RUNNER_TOKEN: ${RUNNER_TOKEN}
      RUNNER_REPOSITORY_URL: https://github.com/stonefreight2017-source/Stone-AI
      RUNNER_LABELS: self-hosted,linux,x64,docker
      RUNNER_WORK_FOLDER: /runner/_work
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner-work:/runner/_work
      - runner-cache:/runner/_cache
    deploy:
      resources:
        limits:
          cpus: "4.0"
          memory: 8G
    networks:
      - runner-net

volumes:
  runner-work:
  runner-cache:

networks:
  runner-net:
    driver: bridge
```

### 1.5 Multiple Runners for Parallel Jobs

```yaml
# Scale runners for parallel CI/CD
services:
  runner-build:
    build: { context: ., dockerfile: Dockerfile.runner }
    environment:
      RUNNER_NAME: omen-build
      RUNNER_LABELS: self-hosted,build
      RUNNER_TOKEN: ${RUNNER_TOKEN}
    deploy:
      resources:
        limits: { cpus: "8", memory: "16G" }

  runner-test:
    build: { context: ., dockerfile: Dockerfile.runner }
    environment:
      RUNNER_NAME: omen-test
      RUNNER_LABELS: self-hosted,test
      RUNNER_TOKEN: ${RUNNER_TOKEN}
    deploy:
      resources:
        limits: { cpus: "4", memory: "8G" }

  runner-gpu:
    build: { context: ., dockerfile: Dockerfile.runner.gpu }
    runtime: nvidia
    environment:
      RUNNER_NAME: omen-gpu
      RUNNER_LABELS: self-hosted,gpu
      RUNNER_TOKEN: ${RUNNER_TOKEN}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## 2. Build Pipelines

### 2.1 Stone AI Main Pipeline

```yaml
# .github/workflows/ci.yml
name: Stone AI CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "20"
  PNPM_VERSION: "9"

jobs:
  # ============================
  # Stage 1: Lint & Type Check
  # ============================
  lint:
    name: Lint & Type Check
    runs-on: [self-hosted, build]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm prisma generate

      - name: TypeScript check
        run: pnpm tsc --noEmit

      - name: ESLint
        run: pnpm lint

      - name: Prettier check
        run: pnpm format:check

  # ============================
  # Stage 2: Tests
  # ============================
  test:
    name: Tests
    runs-on: [self-hosted, test]
    needs: lint
    timeout-minutes: 20
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: stoneai_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm prisma generate

      - name: Run migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/stoneai_test

      - name: Run tests
        run: pnpm test --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/stoneai_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
          retention-days: 7

  # ============================
  # Stage 3: Build
  # ============================
  build:
    name: Build
    runs-on: [self-hosted, build]
    needs: [lint, test]
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm prisma generate

      - name: Build Next.js
        run: pnpm build
        env:
          NODE_ENV: production
          SKIP_ENV_VALIDATION: true

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ github.sha }}
          path: |
            .next/
            public/
            package.json
            next.config.ts
          retention-days: 14

  # ============================
  # Stage 4: Security Scan
  # ============================
  security:
    name: Security Scan
    runs-on: [self-hosted, build]
    needs: lint
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          extra_args: --only-verified

  # ============================
  # Stage 5: Deploy
  # ============================
  deploy-preview:
    name: Deploy Preview
    runs-on: [self-hosted, build]
    needs: build
    if: github.event_name == 'pull_request'
    timeout-minutes: 10
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}

  deploy-production:
    name: Deploy Production
    runs-on: [self-hosted, build]
    needs: [build, security]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    timeout-minutes: 15
    environment:
      name: production
      url: https://stone-ai.net
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Verify deployment
        run: |
          sleep 30
          STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://stone-ai.net/api/health)
          if [ "$STATUS" != "200" ]; then
            echo "Deployment verification failed: HTTP $STATUS"
            exit 1
          fi
          echo "Deployment verified: HTTP $STATUS"

      - name: Notify success
        if: success()
        run: |
          echo "Production deployment successful: $(date)"
          # Could trigger sendFounderAlert here
```

### 2.2 Database Migration Pipeline

```yaml
# .github/workflows/migration.yml
name: Database Migration

on:
  push:
    branches: [main]
    paths:
      - 'prisma/migrations/**'
      - 'prisma/schema.prisma'

jobs:
  migrate:
    name: Run Migrations
    runs-on: [self-hosted, build]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: "9"

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Create backup before migration
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          pg_dump $DATABASE_URL | gzip > /mnt/nvme/backups/pre-migration-${TIMESTAMP}.sql.gz
          echo "Backup created: pre-migration-${TIMESTAMP}.sql.gz"
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Run migration
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Verify migration
        run: pnpm prisma migrate status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Rollback on failure
        if: failure()
        run: |
          LATEST_BACKUP=$(ls -t /mnt/nvme/backups/pre-migration-*.sql.gz | head -1)
          echo "Rolling back using: $LATEST_BACKUP"
          gunzip -c "$LATEST_BACKUP" | psql $DATABASE_URL
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 2.3 Docker Build Pipeline

```yaml
# .github/workflows/docker.yml
name: Docker Build & Push

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      tag:
        description: 'Image tag'
        required: true
        default: 'latest'

jobs:
  build-push:
    name: Build & Push
    runs-on: [self-hosted, build]
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=tag
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == format('refs/tags/{0}', github.event.inputs.tag) }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          target: production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_VERSION=20
```

---

## 3. Artifact Management

### 3.1 GitHub Artifacts

```yaml
# Upload artifacts
- uses: actions/upload-artifact@v4
  with:
    name: build-artifacts-${{ github.sha }}
    path: |
      .next/standalone/
      .next/static/
      public/
    retention-days: 30
    compression-level: 6

# Download in another job
- uses: actions/download-artifact@v4
  with:
    name: build-artifacts-${{ github.sha }}
    path: ./deploy/
```

### 3.2 Container Registry Management

```bash
# GitHub Container Registry (ghcr.io)
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag and push
docker tag stone-ai/web:latest ghcr.io/stonefreight2017-source/stone-ai:latest
docker push ghcr.io/stonefreight2017-source/stone-ai:latest

# List images
gh api user/packages/container/stone-ai/versions

# Cleanup old images (keep last 10)
VERSIONS=$(gh api user/packages/container/stone-ai/versions --jq '.[10:] | .[].id')
for v in $VERSIONS; do
  gh api -X DELETE user/packages/container/stone-ai/versions/$v
done
```

### 3.3 Local Artifact Cache

```bash
# Cache directory structure on NVMe
/mnt/nvme/ci-cache/
├── npm/              # npm/pnpm cache
├── docker/           # Docker build cache
│   ├── layers/
│   └── buildkit/
├── tools/            # Runner tool cache
├── artifacts/        # Build artifacts
│   ├── builds/       # Build outputs
│   └── test-reports/ # Test results
└── backups/          # Pre-deployment backups

# GitHub Actions cache configuration
- uses: actions/cache@v4
  with:
    path: |
      ~/.pnpm-store
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

---

## 4. Deployment Automation

### 4.1 Vercel Deployment Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/inference/:path*", "destination": "https://omen.stone-ai.net/v1/:path*" }
  ]
}
```

### 4.2 Self-Hosted Deployment Script

```bash
#!/bin/bash
# deploy.sh — Deploy Stone AI to self-hosted environment
set -euo pipefail

DEPLOY_DIR="/opt/stone-ai"
BACKUP_DIR="/mnt/nvme/backups/deploys"
REPO="https://github.com/stonefreight2017-source/Stone-AI.git"
BRANCH="${1:-main}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "===== Stone AI Deploy: $BRANCH at $TIMESTAMP ====="

# 1. Backup current deployment
echo "[1/7] Creating backup..."
if [ -d "$DEPLOY_DIR" ]; then
    tar czf "$BACKUP_DIR/deploy-${TIMESTAMP}.tar.gz" -C "$DEPLOY_DIR" . 2>/dev/null || true
fi

# 2. Pull latest code
echo "[2/7] Pulling latest code..."
cd "$DEPLOY_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 3. Install dependencies
echo "[3/7] Installing dependencies..."
pnpm install --frozen-lockfile

# 4. Generate Prisma client
echo "[4/7] Generating Prisma client..."
pnpm prisma generate

# 5. Run migrations
echo "[5/7] Running migrations..."
pnpm prisma migrate deploy

# 6. Build
echo "[6/7] Building..."
pnpm build

# 7. Restart services
echo "[7/7] Restarting services..."
pm2 restart stone-ai --update-env || pm2 start ecosystem.config.js

# Verify
sleep 5
STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health)
if [ "$STATUS" = "200" ]; then
    echo "Deploy successful! Health check: HTTP $STATUS"
else
    echo "Deploy FAILED! Health check: HTTP $STATUS"
    echo "Rolling back..."
    tar xzf "$BACKUP_DIR/deploy-${TIMESTAMP}.tar.gz" -C "$DEPLOY_DIR"
    pm2 restart stone-ai
    exit 1
fi
```

### 4.3 PM2 Process Management

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'stone-ai',
      script: '.next/standalone/server.js',
      cwd: '/opt/stone-ai',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '2G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/stone-ai/error.log',
      out_file: '/var/log/stone-ai/out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
    },
  ],
};
```

### 4.4 Zero-Downtime Deployment

```bash
#!/bin/bash
# zero-downtime-deploy.sh

# Blue-green with PM2
CURRENT_PORT=$(pm2 jlist | jq -r '.[0].pm2_env.PORT // 3000')
NEW_PORT=$((CURRENT_PORT == 3000 ? 3001 : 3000))

echo "Current: :$CURRENT_PORT, New: :$NEW_PORT"

# Start new version on alternate port
PORT=$NEW_PORT pm2 start ecosystem.config.js --name stone-ai-new --env production

# Wait for health
for i in $(seq 1 30); do
    if curl -sf "http://localhost:$NEW_PORT/api/health" > /dev/null; then
        echo "New instance healthy on :$NEW_PORT"
        break
    fi
    sleep 2
done

# Switch nginx upstream
sed -i "s/localhost:$CURRENT_PORT/localhost:$NEW_PORT/" /etc/nginx/conf.d/stone-ai.conf
nginx -s reload

# Stop old version
pm2 delete stone-ai
pm2 rename stone-ai-new stone-ai

echo "Zero-downtime deploy complete. Now serving on :$NEW_PORT"
```

---

## 5. Rollback Procedures

### 5.1 Vercel Rollback

```bash
# List recent deployments
vercel ls stone-ai --limit 10

# Rollback to specific deployment
vercel rollback <deployment-url>

# Or via GitHub
# Revert the commit and push:
git revert HEAD
git push origin main
# Vercel auto-deploys the revert
```

### 5.2 Self-Hosted Rollback

```bash
#!/bin/bash
# rollback.sh — Rollback to previous deployment

BACKUP_DIR="/mnt/nvme/backups/deploys"
DEPLOY_DIR="/opt/stone-ai"

# List available backups
echo "Available backups:"
ls -la "$BACKUP_DIR"/deploy-*.tar.gz | tail -10

# Use latest or specify
BACKUP="${1:-$(ls -t $BACKUP_DIR/deploy-*.tar.gz | head -1)}"
echo "Rolling back to: $BACKUP"

# Stop services
pm2 stop stone-ai

# Restore
cd "$DEPLOY_DIR"
tar xzf "$BACKUP"

# Regenerate Prisma client (schema might differ)
pnpm prisma generate

# Restart
pm2 restart stone-ai

# Verify
sleep 5
curl -sf http://localhost:3000/api/health && echo "Rollback successful!" || echo "Rollback FAILED!"
```

### 5.3 Database Rollback

```bash
# Prisma doesn't support down migrations natively.
# Manual rollback process:

# 1. Identify the migration to rollback
pnpm prisma migrate status

# 2. Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back MIGRATION_NAME

# 3. Apply manual SQL to undo changes
psql $DATABASE_URL < rollback-scripts/undo-MIGRATION_NAME.sql

# 4. Or restore from backup
BACKUP=$(ls -t /mnt/nvme/backups/pre-migration-*.sql.gz | head -1)
gunzip -c "$BACKUP" | psql $DATABASE_URL
```

### 5.4 Git-Based Rollback

```bash
# Revert last commit (creates new commit)
git revert HEAD --no-edit
git push origin main

# Revert multiple commits
git revert HEAD~3..HEAD --no-edit
git push origin main

# Hard rollback to specific tag (DESTRUCTIVE)
git reset --hard v1.2.0
git push --force-with-lease origin main

# Create rollback tag
git tag -a rollback-$(date +%Y%m%d) -m "Rollback due to [reason]"
git push origin --tags
```

---

## 6. Advanced Pipeline Patterns

### 6.1 Matrix Builds

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, self-hosted]
        include:
          - node-version: 20
            os: self-hosted
            gpu-test: true
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: pnpm test
      - name: GPU inference tests
        if: matrix.gpu-test
        run: pnpm test:inference
```

### 6.2 Conditional Workflows

```yaml
jobs:
  changes:
    runs-on: [self-hosted]
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      database: ${{ steps.filter.outputs.database }}
    steps:
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            frontend:
              - 'src/app/**'
              - 'src/components/**'
              - 'tailwind.config.*'
            backend:
              - 'src/app/api/**'
              - 'src/lib/**'
            database:
              - 'prisma/**'

  test-frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: [self-hosted, test]
    steps:
      - run: pnpm test:frontend

  test-backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: [self-hosted, test]
    steps:
      - run: pnpm test:backend

  migrate:
    needs: changes
    if: needs.changes.outputs.database == 'true'
    runs-on: [self-hosted, build]
    steps:
      - run: pnpm prisma migrate deploy
```

### 6.3 Scheduled Workflows

```yaml
# .github/workflows/scheduled.yml
name: Scheduled Maintenance

on:
  schedule:
    - cron: '0 2 * * *'   # Daily at 2 AM
    - cron: '0 0 * * 0'   # Weekly Sunday midnight

jobs:
  daily-tasks:
    if: github.event.schedule == '0 2 * * *'
    runs-on: [self-hosted]
    steps:
      - name: Dependency audit
        run: pnpm audit --audit-level=high

      - name: Docker image cleanup
        run: docker system prune -af --filter "until=168h"

      - name: Verify backups
        run: |
          LATEST=$(ls -t /mnt/nvme/backups/daily-*.sql.gz | head -1)
          SIZE=$(stat -f%z "$LATEST" 2>/dev/null || stat -c%s "$LATEST")
          if [ "$SIZE" -lt 1000 ]; then
            echo "ALERT: Backup suspiciously small: $SIZE bytes"
            exit 1
          fi

  weekly-tasks:
    if: github.event.schedule == '0 0 * * 0'
    runs-on: [self-hosted]
    steps:
      - name: Full security scan
        run: |
          pnpm audit
          docker scout cves stone-ai/web:latest

      - name: Runner maintenance
        run: |
          # Clear old work directories
          find ~/actions-runner/_work -maxdepth 2 -type d -mtime +7 -exec rm -rf {} +
          # Update runner if needed
          ~/actions-runner/bin/Runner.Listener --check
```

---

## 7. Secrets and Environment Management

### 7.1 GitHub Secrets Hierarchy

```
Organization Secrets (shared across repos):
├── VERCEL_TOKEN
├── SNYK_TOKEN
└── DOCKER_REGISTRY_TOKEN

Repository Secrets:
├── DATABASE_URL
├── CLERK_SECRET_KEY
├── STRIPE_SECRET_KEY
├── ANTHROPIC_API_KEY
└── RUNNER_TOKEN

Environment Secrets:
├── production/
│   ├── DATABASE_URL (Neon prod)
│   └── CLERK_SECRET_KEY (prod)
├── preview/
│   ├── DATABASE_URL (Neon preview branch)
│   └── CLERK_SECRET_KEY (dev)
└── staging/
    └── DATABASE_URL (local)
```

### 7.2 Environment Protection Rules

```yaml
# In GitHub repo Settings > Environments

# production environment:
#   - Required reviewers: stonefreight2017-source
#   - Wait timer: 5 minutes
#   - Deployment branches: main only
#   - Required status checks: lint, test, build, security

# preview environment:
#   - No protection rules
#   - All branches
```

---

## 8. Monitoring CI/CD Performance

### 8.1 Workflow Metrics

```bash
# Get workflow run times
gh run list --workflow=ci.yml --limit=20 --json databaseId,conclusion,createdAt,updatedAt \
  | jq '.[] | {id: .databaseId, result: .conclusion, duration: ((.updatedAt | fromdate) - (.createdAt | fromdate))}'

# Average build time
gh run list --workflow=ci.yml --limit=50 --json createdAt,updatedAt \
  | jq '[.[] | ((.updatedAt | fromdate) - (.createdAt | fromdate))] | add/length | . / 60 | round'
```

### 8.2 Build Performance Targets

```
Target Pipeline Durations:
──────────────────────────
Lint + Type Check:     < 2 min
Unit Tests:            < 5 min
Integration Tests:     < 10 min
Build:                 < 5 min
Security Scan:         < 3 min
Deploy (preview):      < 3 min
Deploy (production):   < 5 min
──────────────────────────
TOTAL (sequential):    < 20 min
TOTAL (parallel):      < 12 min
```

---

## 9. Disaster Recovery for CI/CD

### 9.1 Runner Failure Recovery

```bash
# Runner health check
systemctl status actions.runner.stonefreight2017-source-Stone-AI.omen-45l

# Restart runner
sudo ./svc.sh stop && sudo ./svc.sh start

# Re-register runner (if token expired)
./config.sh remove --token OLD_TOKEN
./config.sh --url https://github.com/stonefreight2017-source/Stone-AI --token NEW_TOKEN

# Fallback to GitHub-hosted runners
# In workflow: runs-on: ubuntu-latest (instead of self-hosted)
```

### 9.2 Pipeline Recovery Checklist

```
If pipeline is broken:
1. Check runner status: systemctl status actions.runner.*
2. Check runner logs: ~/actions-runner/_diag/Runner_*.log
3. Check Docker: docker ps, docker logs
4. Check disk space: df -h /mnt/nvme
5. Check network: ping github.com, ping registry.npmjs.org
6. Clear caches: rm -rf ~/.pnpm-store, docker system prune
7. Re-register runner if needed
8. Fall back to GitHub-hosted if self-hosted is down
```

---

*Chaos Infrastructure Seed — Batch 14. The pipeline never sleeps. Code ships or flags. No middle ground.*
