# Multi-Cloud Strategy
# Seed: INFRA-5 | Category: Cloud Architecture | Topic: Multi-Cloud & IaC
# RAG Tags: terraform, pulumi, cdk, multi-cloud, vendor-lock-in, data-residency, iac

---

## Purpose
Infrastructure as Code (IaC) deep-dive with Terraform as the primary tool, comparison with
alternatives, vendor lock-in avoidance strategies, cost arbitrage, and cloud-agnostic
application design patterns.

---

## 1. IaC Tool Comparison

### Decision Matrix
```
Tool        | Language     | State     | Multi-Cloud | Learning Curve | Ecosystem
------------|-------------|-----------|-------------|----------------|----------
Terraform   | HCL         | Remote    | Native      | Medium         | Largest (10K+ providers)
Pulumi      | TS/Python/Go| Remote    | Native      | Low (if you know the lang)| Growing
AWS CDK     | TS/Python   | CloudForm | AWS only    | Medium         | AWS only
CDKTF       | TS/Python   | Terraform | Native      | Medium         | Terraform providers
Bicep       | Bicep DSL   | Azure     | Azure only  | Low            | Azure only
CloudForm.  | YAML/JSON   | AWS       | AWS only    | High (verbose) | AWS only
Ansible     | YAML        | Stateless | Multi       | Low            | Broad but shallow
Crossplane  | K8s YAML    | K8s       | Native      | High           | Growing

RECOMMENDATION:
  Primary: Terraform — industry standard, most job postings, largest community
  Alternative: Pulumi — if your team hates HCL and prefers real languages
  Avoid: Vendor-specific tools unless 100% committed to single cloud
```

---

## 2. Terraform Deep Dive

### Project Structure
```
infrastructure/
├── modules/                          # Reusable modules
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf                   # Calls modules with dev values
│   │   ├── terraform.tfvars          # Dev-specific values
│   │   └── backend.tf                # Dev state backend
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── production/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
├── .terraform-version                # tfenv version pinning
└── .tflint.hcl                       # Linting config
```

### Module Pattern
```hcl
# modules/networking/main.tf

variable "environment" {
  type        = string
  description = "Environment name (dev, staging, production)"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR block for the VPC"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
}

locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "stone-ai"
  }
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "stone-ai-${var.environment}-vpc"
  })
}

# Public subnets
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "stone-ai-${var.environment}-public-${var.availability_zones[count.index]}"
    Type = "public"
  })
}

# Private subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "stone-ai-${var.environment}-private-${var.availability_zones[count.index]}"
    Type = "private"
  })
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}
```

### State Management
```hcl
# backend.tf — NEVER use local state in production
terraform {
  backend "s3" {
    bucket         = "stone-ai-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"    # State locking prevents conflicts
    kms_key_id     = "alias/terraform-state"   # Encrypt with KMS
  }
}

# State locking table
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name      = "Terraform State Lock"
    ManagedBy = "manual"  # This table manages itself, created once manually
  }
}
```

### Terraform Best Practices
```
1. VERSION PINNING — Always pin provider and module versions
   required_providers {
     aws = {
       source  = "hashicorp/aws"
       version = "~> 5.0"  # Allow patch updates, pin minor
     }
   }

2. WORKSPACES vs. DIRECTORIES
   Use separate directories per environment (not workspaces):
   - Workspaces share backend config → risk of applying dev changes to prod
   - Separate directories = separate state files = separate blast radius

3. PLAN BEFORE APPLY — Always
   terraform plan -out=plan.tfplan
   terraform apply plan.tfplan
   Never run 'terraform apply' without reviewing the plan

4. IMPORT BEFORE RECREATE
   If Terraform wants to destroy+recreate a resource:
   STOP. Check if 'terraform import' can adopt the existing resource.
   Accidental destruction of databases/DNS = catastrophic

5. USE DATA SOURCES for cross-stack references
   data "aws_vpc" "existing" { id = var.vpc_id }
   Don't hardcode IDs, ARNs, or names

6. SENSITIVE VALUES
   variable "db_password" {
     type      = string
     sensitive = true  # Won't show in plan output
   }
   But NEVER put secrets in .tfvars files committed to git
   Use: AWS Secrets Manager, Vault, or CI/CD variables

7. DRIFT DETECTION
   Run 'terraform plan' in CI nightly to detect manual changes
   Alert if plan shows changes (someone modified infra outside Terraform)
```

---

## 3. Pulumi vs. Terraform

### When Pulumi Wins
```typescript
// Pulumi uses REAL programming languages — loops, conditions, functions, types

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Create subnets with a loop (Terraform: count or for_each, less intuitive)
const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

const subnets = azs.map((az, i) => new aws.ec2.Subnet(`subnet-${az}`, {
  vpcId: vpc.id,
  cidrBlock: `10.0.${i}.0/24`,
  availabilityZone: az,
  tags: { Name: `stone-ai-${az}` },
}));

// Conditional resources (Terraform: count = var.enabled ? 1 : 0, awkward)
if (config.requireBoolean('enableMonitoring')) {
  new aws.cloudwatch.Dashboard('main', {
    dashboardName: 'stone-ai',
    dashboardBody: JSON.stringify(buildDashboard(subnets)),
  });
}

// Unit testing with standard test frameworks
import { expect } from 'chai';

describe('Infrastructure', () => {
  it('should create 3 subnets across AZs', async () => {
    const result = await pulumi.runtime.testAsync(() => {
      return import('./index');
    });
    expect(subnets.length).to.equal(3);
  });
});
```

### Decision: Terraform vs. Pulumi
```
Choose Terraform when:
  ✓ Team includes dedicated infrastructure engineers
  ✓ Need widest provider ecosystem
  ✓ Company standardized on Terraform
  ✓ Hiring from general DevOps talent pool (most know Terraform)
  ✓ Need Terraform Cloud/Enterprise features

Choose Pulumi when:
  ✓ Team is primarily developers (TS/Python/Go proficient)
  ✓ Complex conditional logic in infrastructure
  ✓ Want to share code between app and infra (monorepo pattern)
  ✓ Need unit testing of infrastructure code
  ✓ TypeScript shop wanting type safety in IaC
```

---

## 4. Vendor Lock-in Avoidance

### Lock-in Spectrum
```
Level 0 (No lock-in):     Compute (VMs), Storage (S3-compatible), Networking
Level 1 (Low lock-in):    Containers (Docker), Kubernetes, PostgreSQL, Redis
Level 2 (Medium lock-in): Managed services (RDS, Cloud SQL) — portable with effort
Level 3 (High lock-in):   Serverless (Lambda, Cloud Functions) — rewrite needed
Level 4 (Maximum lock-in): Proprietary services (DynamoDB, Cosmos DB, BigQuery)

Strategy: Accept Level 2-3 lock-in for 80% of services. Abstract Level 4.
Total lock-in avoidance is expensive and slows you down.
```

### Abstraction Layer Pattern
```typescript
// Abstract cloud-specific services behind interfaces

// storage.interface.ts
interface CloudStorage {
  upload(bucket: string, key: string, data: Buffer): Promise<string>;
  download(bucket: string, key: string): Promise<Buffer>;
  delete(bucket: string, key: string): Promise<void>;
  getSignedUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
}

// storage.aws.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export class AWSS3Storage implements CloudStorage {
  private client = new S3Client({ region: process.env.AWS_REGION });

  async upload(bucket: string, key: string, data: Buffer): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: bucket, Key: key, Body: data,
      ServerSideEncryption: 'aws:kms',
    }));
    return `s3://${bucket}/${key}`;
  }
  // ... other methods
}

// storage.gcp.ts
import { Storage } from '@google-cloud/storage';

export class GCPCloudStorage implements CloudStorage {
  private storage = new Storage();

  async upload(bucket: string, key: string, data: Buffer): Promise<string> {
    const file = this.storage.bucket(bucket).file(key);
    await file.save(data, { resumable: false });
    return `gs://${bucket}/${key}`;
  }
  // ... other methods
}

// factory.ts
export function createStorage(): CloudStorage {
  switch (process.env.CLOUD_PROVIDER) {
    case 'aws': return new AWSS3Storage();
    case 'gcp': return new GCPCloudStorage();
    case 'azure': return new AzureBlobStorage();
    default: throw new Error(`Unknown cloud provider: ${process.env.CLOUD_PROVIDER}`);
  }
}
```

### What to Abstract vs. What to Accept
```
ABSTRACT (worth the effort):
  - Object storage (S3/GCS/Blob — very similar APIs)
  - Message queues (SQS/Pub-Sub/Service Bus — similar patterns)
  - Secret management (Secrets Manager/Secret Manager/Key Vault)
  - Monitoring/metrics (use OpenTelemetry — cloud-agnostic by design)

ACCEPT LOCK-IN (not worth abstracting):
  - Databases: Just use PostgreSQL on any cloud's managed service
  - Kubernetes: K8s API is the abstraction layer — GKE/EKS/AKS all compatible
  - IAM: Too different across clouds, must be cloud-specific
  - Serverless: Fundamentally different across clouds, don't abstract
  - CDN: CloudFront/Cloud CDN/Azure CDN — just configure per cloud
```

---

## 5. Cost Arbitrage

### Cross-Cloud Price Comparison (2026 Q1 Estimates)
```
Service: 4 vCPU, 16GB RAM VM (monthly, on-demand, us-east)
  AWS (m6i.xlarge):     $138/month
  GCP (n2-standard-4):  $131/month (+ sustained discount → ~$92)
  Azure (D4s v5):       $140/month

Service: 1TB Object Storage (monthly)
  AWS S3 Standard:      $23.00
  GCP Cloud Storage:    $20.00
  Azure Blob Hot:       $18.40

Service: Managed PostgreSQL (4 vCPU, 16GB, 100GB, multi-AZ)
  AWS RDS:              ~$400/month
  GCP Cloud SQL:        ~$370/month
  Azure Database:       ~$390/month

Service: Serverless function (1M invocations, 256MB, 200ms avg)
  AWS Lambda:           $2.08
  GCP Cloud Functions:  $2.40
  Azure Functions:      $1.80

Insight: Differences are 10-30%. Operational cost (team expertise) matters more.
Don't multi-cloud for cost arbitrage alone unless savings exceed migration/management cost.
```

### Effective Cost Strategies
```
1. COMMITTED USE DISCOUNTS
   AWS: Savings Plans (Compute or EC2) — 30-72% savings
   GCP: Committed Use Discounts — 37-55% savings
   Azure: Reserved Instances — 40-72% savings
   → Commit for 1-year minimum on stable workloads

2. SPOT/PREEMPTIBLE INSTANCES
   AWS Spot:           Up to 90% off, variable pricing, 2-min warning
   GCP Preemptible:    80% off, fixed pricing, 30-sec warning, 24h max
   GCP Spot VMs:       Up to 91% off, no max duration (replacing preemptible)
   Azure Spot:         Up to 90% off, variable pricing

3. AUTOSCALING
   All clouds support autoscaling. Use it.
   Target: 60-70% CPU utilization during peak
   Scale-out aggressively, scale-in conservatively

4. RIGHT-SIZING
   Run tools monthly:
   AWS: Compute Optimizer, Cost Explorer right-sizing
   GCP: Recommender Hub
   Azure: Azure Advisor
```

---

## 6. Data Residency Strategies

### Regulatory Landscape
```
GDPR (EU):      Personal data of EU residents must be processable within EU.
                 Transfer outside EU requires adequacy decision or SCCs.
                 Regions: eu-west-1 (Ireland), eu-central-1 (Frankfurt)

CCPA (California): Less restrictive than GDPR, but growing.
                    No specific data residency requirement yet.

LGPD (Brazil):  Similar to GDPR. Consider sa-east-1 (São Paulo).

PIPL (China):   Strict data localization. Must use local provider (Alibaba, Tencent).
                 Foreign clouds can partner but data must stay in-country.

PDPA (Singapore): Moderate. Use ap-southeast-1.

General strategy:
  1. Identify data classifications (PII, financial, health, public)
  2. Map classifications to regulatory requirements
  3. Choose regions per data classification
  4. Use infrastructure-as-code to enforce region constraints
  5. Encrypt with customer-managed keys in each region
```

### Multi-Region Architecture
```hcl
# Terraform: Enforce data residency via provider configuration

provider "aws" {
  alias  = "eu"
  region = "eu-central-1"  # Frankfurt — GDPR
}

provider "aws" {
  alias  = "us"
  region = "us-east-1"     # Virginia — default
}

# PII data goes to EU region
resource "aws_s3_bucket" "pii_data" {
  provider = aws.eu
  bucket   = "stone-ai-pii-eu"

  # Block replication to non-EU regions
  # Enforce with SCP at org level
}

# Non-PII analytics can stay in US
resource "aws_s3_bucket" "analytics_data" {
  provider = aws.us
  bucket   = "stone-ai-analytics-us"
}

# SCP to prevent creating resources in non-approved regions
# Applied at AWS Organization level
resource "aws_organizations_policy" "region_restriction" {
  name    = "restrict-regions"
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyNonApprovedRegions"
      Effect    = "Deny"
      Action    = "*"
      Resource  = "*"
      Condition = {
        StringNotEquals = {
          "aws:RequestedRegion" = ["us-east-1", "us-west-2", "eu-central-1", "eu-west-1"]
        }
      }
    }]
  })
}
```

---

## 7. Cloud-Agnostic Application Patterns

### The Twelve-Factor App (Cloud Edition)
```
Factor              | Cloud Implementation
--------------------|-----------------------------------------------------
I.   Codebase       | Git (GitHub/GitLab). One repo per deployable service.
II.  Dependencies   | Package manager (npm, pip). Lockfiles committed. SBOM generated.
III. Config         | Environment variables. Cloud secret managers. NEVER in code.
IV.  Backing Svcs   | Treat DB, cache, queue as attached resources via URLs.
V.   Build/Release  | CI/CD pipeline. Immutable artifacts (containers/AMIs).
VI.  Processes      | Stateless. Session state in external store (Redis).
VII. Port Binding   | App listens on port from $PORT env var.
VIII.Concurrency    | Scale horizontally via process model (containers/instances).
IX.  Disposability  | Fast startup, graceful shutdown. SIGTERM handling.
X.   Dev/Prod Parity| Same container, same config structure, different values.
XI.  Logs           | Write to stdout. Cloud captures (CloudWatch, Stackdriver).
XII. Admin Processes| Run as one-off containers/tasks, same codebase.
```

### Container-First Architecture
```dockerfile
# Multi-stage build for minimal production image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
WORKDIR /app
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:8080/health || exit 1

CMD ["node", "dist/server.js"]
```

---

## 8. Migration Playbook

### Cloud-to-Cloud Migration Steps
```
Phase 1: Assessment (2-4 weeks)
  □ Inventory all services, dependencies, data stores
  □ Map current architecture to target cloud equivalents
  □ Identify lock-in points requiring rewrite
  □ Estimate cost comparison (current vs. target, including migration)
  □ Risk assessment: what breaks during migration?

Phase 2: Foundation (2-4 weeks)
  □ Set up target cloud account/project structure
  □ Configure IAM, networking, security baselines
  □ Deploy IaC (Terraform) for target infrastructure
  □ Set up CI/CD pipeline for target cloud
  □ Configure monitoring and alerting

Phase 3: Data Migration (2-8 weeks)
  □ Set up database replication (source → target)
  □ Migrate object storage (aws s3 sync, gsutil rsync)
  □ Verify data integrity (checksums, row counts)
  □ Test application against migrated data
  □ Plan cutover window

Phase 4: Application Migration (2-6 weeks)
  □ Deploy application to target cloud
  □ Run parallel (both clouds serving traffic)
  □ Gradual traffic shift (10% → 25% → 50% → 100%)
  □ Monitor error rates, latency, costs
  □ Rollback plan tested and ready

Phase 5: Cutover (1-2 weeks)
  □ Final data sync
  □ DNS cutover
  □ Monitor 24/7 for 1 week
  □ Decommission source cloud resources
  □ Update documentation and runbooks
```

---

*This seed is maintained by the Cloud Architecture team. Last validated: 2026-03.*
