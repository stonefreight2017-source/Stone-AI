# AWS Core Services Patterns
# Seed: INFRA-1 | Category: Cloud Architecture | Provider: AWS
# RAG Tags: aws, ec2, s3, lambda, iam, vpc, rds, dynamodb, architecture, cost-optimization

---

## Purpose
Comprehensive architectural patterns, anti-patterns, security hardening, and cost optimization
for the seven foundational AWS services. Every Stone AI agent that touches infrastructure
must internalize these patterns before making recommendations.

---

## 1. EC2 — Elastic Compute Cloud

### When to Use
- Long-running stateful workloads (databases, game servers, ML training)
- Applications requiring specific OS/kernel configurations
- Workloads needing GPU/FPGA acceleration
- Legacy applications that can't be containerized or serverless-ified

### When NOT to Use
- Short-lived request/response workloads (use Lambda)
- Stateless HTTP APIs (use Lambda + API Gateway or Fargate)
- Batch jobs under 15 minutes (use Lambda)

### Architectural Patterns

#### Pattern: Auto-Scaling Group Behind ALB
```
Internet → Route 53 → CloudFront → ALB → ASG (min:2, desired:3, max:10)
                                          ↓
                                    Target Group (health checks /health)
                                          ↓
                                    EC2 instances across 3 AZs
```

**Key configuration:**
```yaml
# Launch Template best practices
LaunchTemplate:
  InstanceType: m6i.xlarge        # Use current-gen (6th+) for price/perf
  MetadataOptions:
    HttpTokens: required           # FORCE IMDSv2 — blocks SSRF attacks
    HttpEndpoint: enabled
  BlockDeviceMappings:
    - Ebs:
        Encrypted: true            # ALWAYS encrypt EBS
        VolumeType: gp3            # gp3 > gp2 (20% cheaper, better baseline)
  SecurityGroupIds:
    - !Ref AppSG                   # Least-privilege SG, never default

# Auto-Scaling Policy
ScalingPolicy:
  PolicyType: TargetTrackingScaling
  TargetValue: 65                  # CPU target — 65% leaves headroom
  ScaleInCooldown: 300
  ScaleOutCooldown: 60             # Scale out fast, scale in slow
```

#### Anti-Pattern: Snowflake Instances
- NEVER configure instances manually via SSH
- Use Launch Templates + User Data or AMI baking (Packer)
- Treat instances as cattle, not pets
- If an instance needs special config, it's a bug in your automation

#### Cost Optimization
| Strategy | Savings | Risk |
|----------|---------|------|
| Reserved Instances (1yr, no upfront) | ~30% | Commitment |
| Reserved Instances (3yr, all upfront) | ~60% | High commitment |
| Savings Plans (Compute) | ~30% | Flexible across instance types |
| Spot Instances | ~70-90% | Can be interrupted with 2min warning |
| Right-sizing (CloudWatch metrics) | 20-40% | None if monitored |

**Spot Instance Pattern for Fault-Tolerant Workloads:**
```python
# Spot fleet with diversified allocation
spot_fleet_config = {
    'AllocationStrategy': 'capacityOptimizedPrioritized',
    'InstancePoolsToUseCount': 4,
    'LaunchTemplateOverrides': [
        {'InstanceType': 'm6i.xlarge'},
        {'InstanceType': 'm5.xlarge'},
        {'InstanceType': 'm5a.xlarge'},
        {'InstanceType': 'r6i.large'},    # Different family as fallback
    ],
    'TargetCapacity': 10,
    'OnDemandBaseCapacity': 2,             # 2 on-demand as baseline
    'OnDemandPercentageAboveBaseCapacity': 0  # Rest is spot
}
```

---

## 2. S3 — Simple Storage Service

### Storage Classes Decision Tree
```
Is it accessed frequently (>1x/month)?
  YES → S3 Standard
  NO → Is access pattern unpredictable?
    YES → S3 Intelligent-Tiering (auto-manages, $0.0025/1000 objects/month monitoring)
    NO → Is it accessed quarterly?
      YES → S3 Standard-IA (min 30-day, 128KB minimum charge)
      NO → Is it accessed yearly?
        YES → S3 Glacier Instant Retrieval
        NO → Is sub-12hr retrieval OK?
          YES → S3 Glacier Flexible Retrieval
          NO → S3 Glacier Deep Archive (12-48hr retrieval, $0.00099/GB)
```

### Security Best Practices
```json
// Bucket policy — enforce encryption and HTTPS
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    },
    {
      "Sid": "DenyHTTP",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"],
      "Condition": {
        "Bool": { "aws:SecureTransport": "false" }
      }
    }
  ]
}
```

**Critical S3 Settings (non-negotiable):**
- `BlockPublicAccess`: ALL FOUR settings ON at account level
- `BucketVersioning`: Enabled for any data you can't recreate
- `ServerSideEncryption`: SSE-KMS with customer-managed key for sensitive data
- `ObjectLockMode`: COMPLIANCE for audit/legal data (cannot be deleted even by root)
- `AccessLogging`: Enabled, logs to separate bucket

### Anti-Patterns
- Storing secrets in S3 without KMS encryption (use Secrets Manager instead)
- Using path-style URLs (deprecated, use virtual-hosted style)
- Not setting lifecycle policies (storage costs grow silently)
- Granting `s3:*` to IAM roles (always least-privilege)

---

## 3. Lambda

### When to Use
- Event-driven processing (S3 triggers, SQS, DynamoDB streams)
- API backends under 29 seconds response time
- Scheduled tasks (cron via EventBridge)
- Data transformation pipelines

### Cold Start Mitigation
```
Cold start impact by runtime:
  Java/C#:    800ms - 3s    (JVM startup)
  Python:     200ms - 800ms (interpreter init)
  Node.js:    100ms - 500ms (V8 init)
  Rust/Go:    <100ms        (compiled, minimal runtime)

Mitigation strategies (in order of effectiveness):
  1. Use ARM64 (Graviton2) — 20% cheaper, often faster cold starts
  2. Minimize package size — fewer dependencies = faster init
  3. Use Lambda Layers for shared dependencies
  4. Provisioned Concurrency for latency-critical paths ($$$)
  5. Keep functions warm with scheduled pings (anti-pattern, use PC instead)
```

### Memory/CPU Relationship
```
Lambda allocates CPU proportional to memory:
  128MB  = ~7% of a vCPU   (slowest, cheapest per-invocation)
  1769MB = 1 full vCPU      (sweet spot for compute-bound)
  3538MB = 2 vCPUs
  10240MB = 6 vCPUs         (max)

Cost optimization:
  - Profile with AWS Lambda Power Tuning tool
  - Often 1024MB is cheaper than 256MB because it finishes 4x faster
  - Duration is billed per-ms, so faster = cheaper even at higher memory
```

---

## 4. IAM — Identity and Access Management

### The Golden Rules
1. **NEVER use root account** for anything. MFA on root. Lock it in a safe.
2. **NEVER use long-term credentials** (access keys) if you can avoid them. Use IAM Roles everywhere.
3. **Least privilege always.** Start with zero permissions, add what's needed.
4. **Use permission boundaries** on all IAM entities created by automation.
5. **Enable AWS Organizations SCPs** to enforce guardrails account-wide.

### IAM Policy Pattern: Scoped Service Access
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSpecificDynamoDBTable",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789:table/users",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${aws:PrincipalTag/tenant_id}"]
        }
      }
    }
  ]
}
```
This pattern: specific actions + specific resource + condition-based row-level access.

### Anti-Patterns (CRITICAL)
- `"Effect": "Allow", "Action": "*", "Resource": "*"` — NEVER. Period.
- Sharing access keys between services
- Not rotating credentials (90-day max for any human access keys)
- Using inline policies (use managed policies for auditability)
- Not using IAM Access Analyzer (free, finds overly permissive policies)

---

## 5. VPC — Virtual Private Cloud

### Reference Architecture
```
VPC: 10.0.0.0/16 (65,536 IPs)
├── Public Subnets (Internet-facing)
│   ├── 10.0.1.0/24 (AZ-a) — ALB, NAT Gateway, Bastion
│   ├── 10.0.2.0/24 (AZ-b) — ALB, NAT Gateway
│   └── 10.0.3.0/24 (AZ-c) — ALB, NAT Gateway
├── Private Subnets (Application tier)
│   ├── 10.0.11.0/24 (AZ-a) — EC2/ECS/Lambda
│   ├── 10.0.12.0/24 (AZ-b)
│   └── 10.0.13.0/24 (AZ-c)
├── Data Subnets (Database tier — NO internet access)
│   ├── 10.0.21.0/24 (AZ-a) — RDS, ElastiCache
│   ├── 10.0.22.0/24 (AZ-b)
│   └── 10.0.23.0/24 (AZ-c)
└── VPC Endpoints (PrivateLink)
    ├── S3 Gateway Endpoint (free)
    ├── DynamoDB Gateway Endpoint (free)
    ├── ECR Interface Endpoint
    ├── Secrets Manager Interface Endpoint
    └── CloudWatch Interface Endpoint
```

### Security Group Rules
```
ALB SG:        Inbound 443 from 0.0.0.0/0
App SG:        Inbound 8080 from ALB SG only
DB SG:         Inbound 5432 from App SG only
Management SG: Inbound 22 from VPN CIDR only (NEVER 0.0.0.0/0)
```

### Cost Trap: NAT Gateway
- $0.045/hr + $0.045/GB processed = $32/month MINIMUM per AZ
- Three AZs = $96/month just for NAT
- Alternative: NAT instances on t4g.nano ($3/month) for dev environments
- Alternative: VPC endpoints eliminate NAT need for AWS service traffic

---

## 6. RDS — Relational Database Service

### Engine Selection
| Need | Engine | Why |
|------|--------|-----|
| General purpose, PostgreSQL compat | Aurora PostgreSQL | 3x throughput, auto-scaling storage, 6-way replication |
| Strict MySQL compat | Aurora MySQL | Same benefits, MySQL wire protocol |
| Maximum open-source compat | RDS PostgreSQL | No Aurora lock-in, same engine as self-managed |
| Enterprise Oracle migration | RDS Oracle | License-included or BYOL |
| Cost-sensitive dev/test | RDS PostgreSQL t4g.medium | ~$50/month, good enough for dev |

### Production Configuration Checklist
```yaml
RDSInstance:
  Engine: aurora-postgresql
  EngineVersion: "15.4"
  MultiAZ: true                    # ALWAYS in production
  StorageEncrypted: true           # ALWAYS
  KmsKeyId: !Ref DBKmsKey          # Customer-managed key
  DeletionProtection: true         # Prevent accidental deletion
  BackupRetentionPeriod: 35        # Max for automated backups
  EnablePerformanceInsights: true   # Free for 7 days retention
  MonitoringInterval: 60           # Enhanced monitoring
  AutoMinorVersionUpgrade: true
  PubliclyAccessible: false        # NEVER public in production
  DBSubnetGroupName: !Ref DataSubnetGroup
  VPCSecurityGroups:
    - !Ref DBSG                    # Only app tier can connect
```

### Anti-Patterns
- Public RDS instances (even with security groups — defense in depth)
- Not using connection pooling (RDS Proxy or PgBouncer)
- Single-AZ in production
- Not monitoring `FreeableMemory` and `CPUUtilization`
- Using `db.t` instances in production (burstable = unpredictable)

---

## 7. DynamoDB

### When to Use vs. RDS
```
DynamoDB when:
  - Access patterns are known and won't change frequently
  - Need single-digit millisecond latency at any scale
  - Key-value or simple document lookups
  - Serverless architecture (pay-per-request)
  - Global replication needed (Global Tables)

RDS when:
  - Complex queries with JOINs
  - Ad-hoc reporting
  - Strong consistency requirements across multiple tables
  - Schema will evolve significantly
  - Full-text search needed
```

### Single-Table Design Pattern
```
PK              | SK                    | Data
USER#123        | PROFILE               | {name, email, tier}
USER#123        | ORDER#2024-001        | {total, status, items}
USER#123        | ORDER#2024-002        | {total, status, items}
USER#123        | BESTIE#CONFIG         | {style, traits, name}
ORG#456         | MEMBER#USER#123       | {role, joinedAt}
ORG#456         | MEMBER#USER#789       | {role, joinedAt}

GSI1:
GSI1PK          | GSI1SK                | (projected attributes)
ORDER#2024-001  | USER#123              | {total, status}
ORDER#2024-002  | USER#123              | {total, status}
```

### Capacity Mode Decision
```
On-Demand:
  - Unpredictable traffic
  - New tables (don't know patterns yet)
  - Spiky workloads
  - Cost: ~$1.25 per million write request units

Provisioned + Auto-Scaling:
  - Steady, predictable traffic
  - Cost: ~$0.25 per WCU/month (5x cheaper at steady state)
  - Set auto-scaling target utilization to 70%
  - Always set auto-scaling — never static provisioned
```

---

## Cross-Service Security Checklist

1. **Encryption**: Everything encrypted at rest (KMS) and in transit (TLS 1.2+)
2. **Logging**: CloudTrail enabled in all regions, S3 access logging, VPC Flow Logs
3. **Monitoring**: CloudWatch alarms on all critical metrics
4. **Access**: IAM roles (not keys), least privilege, MFA for console
5. **Network**: Private subnets for compute/data, VPC endpoints for AWS services
6. **Compliance**: AWS Config rules for drift detection, Security Hub for posture
7. **Backup**: Automated backups tested with regular restore drills

---

## Cost Optimization Framework

### Monthly Review Checklist
1. Check AWS Cost Explorer for top 5 cost drivers
2. Run Trusted Advisor cost optimization checks
3. Review Compute Optimizer recommendations
4. Check for unattached EBS volumes and Elastic IPs
5. Verify Reserved Instance / Savings Plan coverage
6. Review data transfer costs (often #2 cost driver behind compute)
7. Check for idle resources (EC2, RDS, NAT Gateways, Load Balancers)

### The 80/20 Rule for AWS Costs
```
Typical cost distribution:
  EC2/ECS/EKS (compute):    40-50%
  RDS/DynamoDB (data):       15-25%
  Data Transfer:             10-15%
  S3/EBS (storage):          5-10%
  Everything else:           10-20%

Optimize compute first. Always.
```

---

## Decision Matrix: Which AWS Compute to Use

```
Stateless HTTP request?
  YES → Duration < 29s?
    YES → Lambda + API Gateway
    NO  → Fargate or App Runner
  NO → Stateful?
    YES → Long-running process?
      YES → EC2 with ASG
      NO  → ECS/EKS on Fargate
    NO → Container-based?
      YES → ECS/EKS (Fargate for simplicity, EC2 for cost at scale)
      NO  → EC2

Batch processing?
  Duration < 15min → Lambda
  Duration < 24hr → AWS Batch (Fargate or Spot EC2)
  Duration > 24hr → EC2 Spot fleet with checkpointing

ML Training?
  → EC2 p4d/p5 instances (Spot with checkpointing)
  → Or SageMaker Training Jobs (managed spot)
```

---

*This seed is maintained by the Cloud Architecture team. Last validated against AWS documentation: 2026-03.*
