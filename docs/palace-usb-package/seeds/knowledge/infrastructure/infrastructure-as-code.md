# Infrastructure as Code — Palace Infrastructure Seed

## Chaos Directive: Version-Controlled Infrastructure

Infrastructure as Code (IaC) means every server, every service, every configuration exists as code in a repository. No manual clicking. No snowflake servers. If the OMEN burns down, we rebuild everything from code. This seed covers Terraform, Pulumi (TypeScript), infrastructure versioning, state management, and drift detection.

---

## 1. IaC Principles

```
1. DECLARATIVE: Describe the desired state, not the steps
2. VERSIONED: All infrastructure code lives in git
3. IDEMPOTENT: Running the same code twice = same result
4. IMMUTABLE: Replace, don't modify (when possible)
5. TESTED: Infrastructure code gets tested like app code
6. REVIEWED: Changes go through PR review before apply
```

---

## 2. Terraform Basics

### 2.1 Terraform Project Structure

```
infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── production/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   ├── terraform.tfvars
│   │   │   └── backend.tf
│   │   ├── staging/
│   │   │   └── ...
│   │   └── local/
│   │       └── ...
│   ├── modules/
│   │   ├── vercel-project/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── cloudflare-dns/
│   │   │   └── ...
│   │   ├── neon-database/
│   │   │   └── ...
│   │   └── monitoring/
│   │       └── ...
│   └── .terraform.lock.hcl
```

### 2.2 Vercel Project Configuration

```hcl
# modules/vercel-project/main.tf
terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

resource "vercel_project" "stone_ai" {
  name      = var.project_name
  framework = "nextjs"

  git_repository {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }

  build_command   = "pnpm build"
  install_command = "pnpm install --frozen-lockfile"
  output_directory = ".next"

  environment {
    key    = "DATABASE_URL"
    value  = var.database_url
    target = ["production"]
  }

  environment {
    key    = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    value  = var.clerk_publishable_key
    target = ["production", "preview"]
  }

  environment {
    key    = "CLERK_SECRET_KEY"
    value  = var.clerk_secret_key
    target = ["production"]
  }

  environment {
    key    = "STRIPE_SECRET_KEY"
    value  = var.stripe_secret_key
    target = ["production"]
  }

  serverless_function_region = "iad1"
}

resource "vercel_project_domain" "apex" {
  project_id = vercel_project.stone_ai.id
  domain     = var.domain
}

resource "vercel_project_domain" "www" {
  project_id = vercel_project.stone_ai.id
  domain     = "www.${var.domain}"

  redirect             = vercel_project_domain.apex.domain
  redirect_status_code = 301
}
```

### 2.3 Cloudflare DNS Configuration

```hcl
# modules/cloudflare-dns/main.tf
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_zone" "stone_ai" {
  account_id = var.cloudflare_account_id
  zone       = var.domain
  plan       = "free"
}

resource "cloudflare_record" "apex" {
  zone_id = cloudflare_zone.stone_ai.id
  name    = "@"
  value   = "76.76.21.21"
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = cloudflare_zone.stone_ai.id
  name    = "www"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "tools" {
  zone_id = cloudflare_zone.stone_ai.id
  name    = "tools"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = cloudflare_zone.stone_ai.id
  name    = "api"
  value   = var.omen_public_ip
  type    = "A"
  proxied = true
}

# SSL configuration
resource "cloudflare_zone_settings_override" "ssl" {
  zone_id = cloudflare_zone.stone_ai.id

  settings {
    ssl                      = "full"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    automatic_https_rewrites = "on"
    http3                    = "on"
    zero_rtt                 = "on"
    brotli                   = "on"
    websockets               = "on"
    security_level           = "medium"
  }
}

# Page rules
resource "cloudflare_page_rule" "api_no_cache" {
  zone_id  = cloudflare_zone.stone_ai.id
  target   = "${var.domain}/api/*"
  priority = 1

  actions {
    cache_level       = "bypass"
    security_level    = "high"
    browser_check     = "on"
  }
}
```

### 2.4 Neon Database Configuration

```hcl
# modules/neon-database/main.tf
terraform {
  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.4"
    }
  }
}

resource "neon_project" "stone_ai" {
  name                     = var.project_name
  region_id                = "aws-us-east-1"
  pg_version               = 16
  history_retention_seconds = 604800  # 7 days PITR
}

resource "neon_branch" "main" {
  project_id = neon_project.stone_ai.id
  name       = "main"
}

resource "neon_branch" "staging" {
  project_id = neon_project.stone_ai.id
  name       = "staging"
  parent_id  = neon_branch.main.id
}

resource "neon_endpoint" "main" {
  project_id       = neon_project.stone_ai.id
  branch_id        = neon_branch.main.id
  type             = "read_write"
  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 4
  suspend_timeout_seconds  = 300
}

resource "neon_database" "stoneai" {
  project_id = neon_project.stone_ai.id
  branch_id  = neon_branch.main.id
  name       = "stoneai"
  owner_name = neon_role.app.name
}

resource "neon_role" "app" {
  project_id = neon_project.stone_ai.id
  branch_id  = neon_branch.main.id
  name       = "stoneai_app"
}
```

### 2.5 Environment Configuration

```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.7"

  backend "s3" {
    bucket         = "stone-ai-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

module "dns" {
  source = "../../modules/cloudflare-dns"

  domain                 = "stone-ai.net"
  cloudflare_account_id  = var.cloudflare_account_id
  omen_public_ip         = var.omen_public_ip
}

module "vercel" {
  source = "../../modules/vercel-project"

  project_name         = "stone-ai"
  github_repo          = "stonefreight2017-source/Stone-AI"
  domain               = "stone-ai.net"
  database_url         = module.neon.connection_string
  clerk_publishable_key = var.clerk_publishable_key
  clerk_secret_key     = var.clerk_secret_key
  stripe_secret_key    = var.stripe_secret_key
}

module "neon" {
  source = "../../modules/neon-database"

  project_name = "stone-ai-production"
}

module "tools" {
  source = "../../modules/vercel-project"

  project_name = "stone-ai-tools"
  github_repo  = "stonefreight2017-source/Stone-AI-Tools"
  domain       = "tools.stone-ai.net"
}
```

### 2.6 Terraform Commands

```bash
# Initialize
cd infrastructure/terraform/environments/production
terraform init

# Plan (preview changes)
terraform plan -out=plan.tfplan

# Apply
terraform apply plan.tfplan

# Destroy (CAREFUL)
terraform plan -destroy -out=destroy.tfplan
terraform apply destroy.tfplan

# Import existing resources
terraform import module.dns.cloudflare_zone.stone_ai <zone-id>
terraform import module.vercel.vercel_project.stone_ai <project-id>

# State management
terraform state list
terraform state show module.dns.cloudflare_record.apex
terraform state mv <old> <new>
terraform state rm <resource>  # Remove from state without destroying

# Workspace management
terraform workspace list
terraform workspace new staging
terraform workspace select production
```

---

## 3. Pulumi (TypeScript)

### 3.1 Why Pulumi

Pulumi uses real programming languages instead of HCL. Since Stone AI is a TypeScript project, Pulumi keeps the entire stack in one language. Full IDE support, loops, conditionals, type checking.

### 3.2 Pulumi Project Setup

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Create new project
mkdir infrastructure/pulumi && cd infrastructure/pulumi
pulumi new typescript

# Install providers
npm install @pulumi/cloudflare @pulumi/vercel @pulumi/docker
```

### 3.3 Pulumi Infrastructure Code

```typescript
// index.ts
import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as docker from "@pulumi/docker";

const config = new pulumi.Config();
const domain = "stone-ai.net";

// =====================
// Cloudflare DNS
// =====================
const zone = new cloudflare.Zone("stone-ai-zone", {
  zone: domain,
  plan: "free",
  accountId: config.requireSecret("cloudflareAccountId"),
});

const dnsRecords = [
  { name: "@", type: "A", value: "76.76.21.21", proxied: true },
  { name: "www", type: "CNAME", value: "cname.vercel-dns.com", proxied: true },
  { name: "tools", type: "CNAME", value: "cname.vercel-dns.com", proxied: true },
  { name: "api", type: "A", value: config.require("omenPublicIp"), proxied: true },
];

const records = dnsRecords.map((record, i) =>
  new cloudflare.Record(`dns-${record.name}-${record.type}`, {
    zoneId: zone.id,
    name: record.name,
    type: record.type,
    value: record.value,
    proxied: record.proxied,
  })
);

// SSL settings
const sslSettings = new cloudflare.ZoneSettingsOverride("ssl-settings", {
  zoneId: zone.id,
  settings: {
    ssl: "full",
    alwaysUseHttps: "on",
    minTlsVersion: "1.2",
    tls13: "on",
    automaticHttpsRewrites: "on",
    http3: "on",
    brotli: "on",
    websockets: "on",
  },
});

// =====================
// Docker Services
// =====================
const network = new docker.Network("palace-network", {
  name: "palace-backend",
  driver: "bridge",
  internal: true,
});

const pgVolume = new docker.Volume("pg-data", {
  name: "stoneai-pgdata",
  labels: [{ label: "com.stone-ai.backup", value: "required" }],
});

const db = new docker.Container("postgres", {
  name: "stoneai-db",
  image: "pgvector/pgvector:pg16",
  restart: "unless-stopped",
  envs: [
    `POSTGRES_USER=${config.require("dbUser")}`,
    `POSTGRES_PASSWORD=${config.requireSecret("dbPassword")}`,
    `POSTGRES_DB=stoneai`,
  ],
  ports: [{ internal: 5432, external: 5432 }],
  volumes: [{ volumeName: pgVolume.name, containerPath: "/var/lib/postgresql/data" }],
  networksAdvanced: [{ name: network.name }],
  healthcheck: {
    tests: ["CMD-SHELL", "pg_isready -U postgres"],
    interval: "10s",
    timeout: "5s",
    retries: 5,
  },
  memory: 8 * 1024,  // 8GB
  cpuShares: 400,
  shmSize: 2 * 1024,  // 2GB
});

const redis = new docker.Container("redis", {
  name: "stoneai-redis",
  image: "redis:7-alpine",
  restart: "unless-stopped",
  command: [
    "redis-server",
    "--maxmemory", "1gb",
    "--maxmemory-policy", "allkeys-lru",
    "--appendonly", "yes",
  ],
  ports: [{ internal: 6379, external: 6379 }],
  networksAdvanced: [{ name: network.name }],
  healthcheck: {
    tests: ["CMD", "redis-cli", "ping"],
    interval: "10s",
    timeout: "3s",
    retries: 5,
  },
  memory: 2 * 1024,  // 2GB
});

// =====================
// Exports
// =====================
export const zoneId = zone.id;
export const dnsRecordIds = records.map(r => r.id);
export const dbContainerId = db.id;
export const redisContainerId = redis.id;
```

### 3.4 Pulumi Commands

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up

# Destroy
pulumi destroy

# View stack outputs
pulumi stack output

# Import existing resources
pulumi import docker:index/container:Container postgres <container-id>

# Stack management
pulumi stack ls
pulumi stack select production
pulumi stack export > backup.json
pulumi stack import < backup.json
```

---

## 4. State Management

### 4.1 Terraform State

```hcl
# Remote state with S3
terraform {
  backend "s3" {
    bucket         = "stone-ai-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # State locking
  }
}

# State locking prevents concurrent modifications
# DynamoDB table for locking:
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### 4.2 Pulumi State

```bash
# Pulumi Cloud (default, managed)
pulumi login

# Self-hosted state (S3)
pulumi login s3://stone-ai-pulumi-state

# Local state (development only)
pulumi login --local

# State backup
pulumi stack export --stack production > state-backup.json

# State recovery
pulumi stack import --stack production < state-backup.json
```

### 4.3 State Security

```
NEVER commit state files to git.

State files contain:
- Resource IDs and ARNs
- Connection strings
- Secret values (unless encrypted)
- IP addresses and endpoints

State file protection:
1. Encrypt at rest (S3 server-side encryption)
2. Encrypt in transit (HTTPS)
3. Access control (IAM policies)
4. State locking (DynamoDB)
5. Versioning (S3 bucket versioning)
6. Regular backups
```

---

## 5. Drift Detection

### 5.1 Terraform Drift Detection

```bash
# Detect drift (compare state to actual resources)
terraform plan -detailed-exitcode
# Exit code 0: No changes
# Exit code 1: Error
# Exit code 2: Changes detected (drift!)

# Refresh state from actual resources
terraform refresh

# Automated drift detection (GitHub Actions)
```

```yaml
# .github/workflows/drift-detection.yml
name: Infrastructure Drift Detection

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  detect-drift:
    runs-on: [self-hosted]
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure/terraform/environments/production

      - name: Detect Drift
        id: drift
        run: |
          terraform plan -detailed-exitcode -no-color 2>&1 | tee plan.txt
          echo "exitcode=$?" >> $GITHUB_OUTPUT
        working-directory: infrastructure/terraform/environments/production
        continue-on-error: true

      - name: Alert on Drift
        if: steps.drift.outputs.exitcode == '2'
        run: |
          echo "DRIFT DETECTED in production infrastructure!"
          # sendFounderAlert "Infrastructure drift detected"
```

### 5.2 Pulumi Drift Detection

```bash
# Preview shows drift
pulumi preview --diff

# Refresh state
pulumi refresh

# Automated detection
pulumi preview --expect-no-changes
# Returns non-zero exit code if changes detected
```

---

## 6. Testing Infrastructure Code

### 6.1 Terraform Validation

```bash
# Format check
terraform fmt -check -recursive

# Validate configuration
terraform validate

# Security scanning
tfsec .
checkov -d .

# Cost estimation
infracost breakdown --path .
```

### 6.2 Pulumi Testing

```typescript
// __tests__/infrastructure.test.ts
import * as pulumi from "@pulumi/pulumi/automation";

describe("Palace Infrastructure", () => {
  let stack: pulumi.Stack;

  beforeAll(async () => {
    stack = await pulumi.LocalWorkspace.createOrSelectStack({
      stackName: "test",
      workDir: ".",
    });
    await stack.setConfig("cloudflareAccountId", { value: "test", secret: true });
  });

  test("should create DNS records", async () => {
    const preview = await stack.preview();
    expect(preview.changeSummary.create).toBeGreaterThan(0);
  });

  test("should not destroy existing resources", async () => {
    const preview = await stack.preview();
    expect(preview.changeSummary.delete || 0).toBe(0);
  });

  afterAll(async () => {
    await stack.destroy();
  });
});
```

---

## 7. IaC for the Palace — What to Codify

```
CODIFY NOW (high value, low risk):
  ✓ Cloudflare DNS records and settings
  ✓ Docker Compose configurations
  ✓ Nginx/Caddy configurations
  ✓ Monitoring stack (Prometheus, Grafana, Loki)
  ✓ Backup scripts and schedules
  ✓ Firewall rules

CODIFY NEXT (medium value):
  - Vercel project configuration
  - Neon database setup
  - GitHub Actions runner setup
  - SSL certificate management

CODIFY LATER (when scaling):
  - Kubernetes cluster configuration
  - Multi-node networking
  - Load balancer configuration
  - Auto-scaling policies

DON'T CODIFY (manual is fine):
  - One-time setup tasks
  - Hardware configuration
  - Developer workstation setup
  - Emergency recovery (scripts, not IaC)
```

---

## 8. Terraform vs Pulumi Decision

```
Factor          │ Terraform              │ Pulumi
────────────────┼────────────────────────┼──────────────────
Language        │ HCL (custom)           │ TypeScript/Python/Go
Learning curve  │ Low (simple syntax)    │ Low (if you know TS)
IDE support     │ Good (HCL plugins)     │ Excellent (full TS)
State           │ File-based (S3/remote) │ Cloud or self-hosted
Community       │ Massive                │ Growing fast
Providers       │ 3000+                  │ Uses TF providers
Testing         │ Limited (terratest)    │ Native unit tests
Logic           │ Limited (count, for)   │ Full programming
Cost            │ Free (open source)     │ Free tier + paid
────────────────┴────────────────────────┴──────────────────

Palace Recommendation:
  Pulumi — Stone AI is TypeScript. Keep one language.
  But Terraform knowledge is essential for the industry.
  Learn both, use Pulumi for Palace operations.
```

---

*Chaos Infrastructure Seed — Batch 14. Infrastructure that isn't code is infrastructure that will be lost.*
