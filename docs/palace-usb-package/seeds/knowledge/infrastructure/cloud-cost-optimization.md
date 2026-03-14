# Cloud Cost Optimization
# Seed: INFRA-6 | Category: Cloud Architecture | Topic: FinOps & Cost Management
# RAG Tags: finops, cost-optimization, reserved-instances, spot-pricing, right-sizing, auto-scaling, tagging

---

## Purpose
Complete FinOps framework for cloud cost management. Reserved instances, spot/preemptible
pricing, right-sizing methodology, cost allocation tagging, commitment discounts,
auto-scaling policies, and waste detection. Every dollar saved is a dollar earned.

---

## 1. FinOps Framework

### The Three Phases
```
Phase 1: INFORM (Visibility)
  - What are we spending?
  - Who is spending it?
  - On what services?
  - Is it growing or shrinking?
  Tools: Cost Explorer, Billing Dashboard, Tagging

Phase 2: OPTIMIZE (Efficiency)
  - Are we right-sized?
  - Are we using commitments?
  - Are we leveraging spot/preemptible?
  - Are we paying for idle resources?
  Tools: Compute Optimizer, Trusted Advisor, Recommender

Phase 3: OPERATE (Governance)
  - Budgets and alerts
  - Chargeback/showback
  - Anomaly detection
  - Continuous optimization cadence
  Tools: Budgets, Cost Anomaly Detection, Org Policies
```

### The Cost Optimization Hierarchy
```
Priority 1: ELIMINATE WASTE (0 effort, 100% savings on waste)
  └── Turn off unused resources, delete unattached volumes, remove idle LBs

Priority 2: RIGHT-SIZE (low effort, 20-40% savings)
  └── Match resource size to actual utilization

Priority 3: PURCHASE COMMITMENTS (medium effort, 30-72% savings)
  └── Reserved Instances, Savings Plans, Committed Use Discounts

Priority 4: SPOT/PREEMPTIBLE (medium effort, 60-90% savings)
  └── Use for fault-tolerant, flexible workloads

Priority 5: ARCHITECTURE OPTIMIZATION (high effort, variable savings)
  └── Serverless, containers, caching, CDN, data transfer optimization
```

---

## 2. Waste Detection

### Common Waste Categories
```
1. IDLE COMPUTE
   Signal: CPU < 5% average over 14 days
   Action: Terminate or downsize
   Savings: 100% of idle instance cost

   AWS: Check CloudWatch CPUUtilization metric
   Script:
   aws cloudwatch get-metric-statistics \
     --namespace AWS/EC2 \
     --metric-name CPUUtilization \
     --dimensions Name=InstanceId,Value=i-1234567890 \
     --start-time $(date -d '14 days ago' -u +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 86400 \
     --statistics Average

2. UNATTACHED STORAGE
   Signal: EBS volumes with state 'available' (not attached to any instance)
   Action: Snapshot (if needed) then delete
   Savings: $0.08-0.125/GB/month for gp3/gp2

   AWS: aws ec2 describe-volumes --filters "Name=status,Values=available"

3. OLD SNAPSHOTS
   Signal: Snapshots older than 90 days with no AMI reference
   Action: Delete after verification
   Savings: $0.05/GB/month

4. IDLE LOAD BALANCERS
   Signal: ALB with 0 healthy targets for 7+ days
   Action: Delete
   Savings: $16+/month per ALB

5. UNUSED ELASTIC IPs
   Signal: EIP not associated with running instance
   Action: Release
   Savings: $3.60/month per idle EIP (plus $0.005/hr charge)

6. OVERSIZED RDS INSTANCES
   Signal: Average CPU < 20%, FreeableMemory > 70%
   Action: Downsize
   Savings: 50%+ per instance

7. NAT GATEWAY DATA PROCESSING
   Signal: High data processing charges through NAT
   Action: Use VPC endpoints for AWS service traffic
   Savings: $0.045/GB saved on AWS service traffic
```

### Automated Waste Detection Script
```python
#!/usr/bin/env python3
"""Cloud waste detector — run weekly via cron or CI"""

import boto3
from datetime import datetime, timedelta

ec2 = boto3.client('ec2')
cw = boto3.client('cloudwatch')
ce = boto3.client('ce')

def find_idle_instances(cpu_threshold=5, days=14):
    """Find instances with avg CPU below threshold over N days."""
    instances = ec2.describe_instances(
        Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
    )

    idle = []
    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            instance_id = instance['InstanceId']
            instance_type = instance['InstanceType']

            stats = cw.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                StartTime=datetime.utcnow() - timedelta(days=days),
                EndTime=datetime.utcnow(),
                Period=86400,
                Statistics=['Average']
            )

            if stats['Datapoints']:
                avg_cpu = sum(d['Average'] for d in stats['Datapoints']) / len(stats['Datapoints'])
                if avg_cpu < cpu_threshold:
                    idle.append({
                        'InstanceId': instance_id,
                        'Type': instance_type,
                        'AvgCPU': round(avg_cpu, 2),
                        'Tags': {t['Key']: t['Value'] for t in instance.get('Tags', [])},
                    })

    return idle

def find_unattached_volumes():
    """Find EBS volumes not attached to any instance."""
    volumes = ec2.describe_volumes(
        Filters=[{'Name': 'status', 'Values': ['available']}]
    )

    return [{
        'VolumeId': v['VolumeId'],
        'Size': v['Size'],
        'Type': v['VolumeType'],
        'MonthlyCost': v['Size'] * 0.08 if v['VolumeType'] == 'gp3' else v['Size'] * 0.10,
        'CreateTime': v['CreateTime'].isoformat(),
    } for v in volumes['Volumes']]

def find_unused_eips():
    """Find Elastic IPs not associated with instances."""
    addresses = ec2.describe_addresses()
    return [
        {'AllocationId': a['AllocationId'], 'PublicIp': a['PublicIp']}
        for a in addresses['Addresses']
        if 'InstanceId' not in a and 'NetworkInterfaceId' not in a
    ]

def generate_report():
    idle = find_idle_instances()
    volumes = find_unattached_volumes()
    eips = find_unused_eips()

    total_savings = sum(v['MonthlyCost'] for v in volumes) + len(eips) * 3.60

    print(f"\n=== CLOUD WASTE REPORT ===")
    print(f"Idle instances: {len(idle)}")
    print(f"Unattached volumes: {len(volumes)} (${sum(v['MonthlyCost'] for v in volumes):.2f}/month)")
    print(f"Unused EIPs: {len(eips)} (${len(eips) * 3.60:.2f}/month)")
    print(f"Estimated monthly savings: ${total_savings:.2f}")

    return {'idle_instances': idle, 'unattached_volumes': volumes, 'unused_eips': eips}

if __name__ == '__main__':
    generate_report()
```

---

## 3. Right-Sizing Methodology

### The Right-Sizing Process
```
Step 1: COLLECT METRICS (14-30 days minimum)
  - CPU utilization (avg, p95, max)
  - Memory utilization (requires CloudWatch agent or similar)
  - Network I/O (throughput, packets)
  - Disk I/O (IOPS, throughput)
  - Application-specific metrics (request latency, queue depth)

Step 2: ANALYZE PATTERNS
  - Is the workload steady or spiky?
  - What's the peak-to-average ratio?
  - Are there time-of-day or day-of-week patterns?
  - Is memory the bottleneck or CPU?

Step 3: SELECT NEW SIZE
  Target utilization:
    CPU:    60-70% at P95 (leaves headroom for spikes)
    Memory: 70-80% at P95
    Disk:   60-70% IOPS utilization (avoid latency cliff)

Step 4: TEST
  - Deploy new size to staging/canary
  - Compare latency, error rates, throughput
  - Run for at least 1 week including peak periods

Step 5: IMPLEMENT
  - Rolling update (ASG) or blue-green deployment
  - Monitor closely for 48 hours post-change
  - Keep old instance type in launch template history (easy rollback)
```

### Right-Sizing Decision Table
```
Current         | CPU Avg | CPU P95 | Memory | Recommendation      | Savings
----------------|---------|---------|--------|---------------------|--------
m6i.2xlarge     | 15%     | 25%     | 30%    | m6i.large           | 75%
m6i.xlarge      | 45%     | 70%     | 60%    | Keep (well-sized)   | 0%
m6i.xlarge      | 80%     | 95%     | 85%    | m6i.2xlarge         | -100% (upsize needed)
r6i.2xlarge     | 10%     | 20%     | 80%    | r6i.xlarge          | 50%
c6i.4xlarge     | 60%     | 85%     | 20%    | c6i.2xlarge         | 50%
t3.medium       | 90%     | 100%    | 70%    | m6i.large (no burst)| Perf improvement

Rule of thumb: If avg CPU < 40% for 14 days → downsize
If P95 CPU > 80% → upsize or add auto-scaling
```

---

## 4. Commitment Discounts

### AWS Savings Plans
```
Type                  | Flexibility        | Savings | Commitment
----------------------|--------------------|---------|------------------
Compute Savings Plan  | Any instance, any  | 20-40%  | $/hour for 1 or 3 years
                      | region, any OS,    |         |
                      | EC2/Fargate/Lambda |         |
EC2 Instance SP       | Specific family,   | 30-50%  | $/hour for 1 or 3 years
                      | specific region    |         |
SageMaker SP          | Any SageMaker      | 20-40%  | $/hour for 1 or 3 years

Payment options:
  No Upfront:    Smallest discount, no cash upfront
  Partial Upfront: Medium discount, 50% upfront
  All Upfront:   Largest discount, 100% upfront

RECOMMENDATION:
  Start with Compute Savings Plan (most flexible)
  Cover ~70% of steady-state with commitments
  Remaining 30% = on-demand for flexibility + spot for fault-tolerant
```

### Commitment Sizing Strategy
```
Month 1-3:  Run workloads, collect usage data
Month 4:    Analyze minimum baseline usage across all hours
Month 5:    Purchase commitment covering 60-70% of minimum baseline
Month 6-12: Monitor and adjust. Purchase additional commitments quarterly.

Never commit to 100% — you need room for optimization and downsizing.

Example:
  Steady-state compute: $10,000/month equivalent
  Minimum baseline:     $7,000/month (3am Sunday minimum)
  Commit to:            $4,900/month (70% of minimum)
  Savings:              $4,900 * 30% = $1,470/month saved
  Remaining $5,100:     On-demand + spot + auto-scaling
```

### GCP Committed Use Discounts
```
Committed Use Discounts (CUDs):
  - Resource-based: Commit to vCPUs and memory amounts
  - Spend-based: Commit to $/hour (like AWS Savings Plans)
  - 1-year: 37% discount
  - 3-year: 55% discount

Sustained Use Discounts (FREE — automatic):
  - No commitment required
  - Automatically applied when usage > 25% of month
  - Up to 30% discount at 100% usage
  - Stacks with CUDs up to max discount
```

---

## 5. Spot/Preemptible Instance Strategies

### When to Use Spot
```
IDEAL for spot:
  ✓ Batch processing (data pipelines, ETL)
  ✓ CI/CD build runners
  ✓ Test environments
  ✓ Stateless web workers (behind load balancer with on-demand baseline)
  ✓ Machine learning training (with checkpointing)
  ✓ Video encoding, image processing
  ✓ Big data processing (EMR, Dataproc)

NEVER use spot for:
  ✗ Databases
  ✗ Single-instance applications
  ✗ Stateful workloads without checkpointing
  ✗ Real-time user-facing services (without on-demand baseline)
```

### Spot Fleet Strategy
```python
# Diversified spot fleet for maximum availability
spot_fleet_config = {
    'IamFleetRole': 'arn:aws:iam::role/spot-fleet-role',
    'AllocationStrategy': 'capacityOptimizedPrioritized',  # Best for availability
    'TargetCapacity': 20,
    'OnDemandTargetCapacity': 4,        # 20% on-demand baseline
    'SpotTargetCapacity': 16,            # 80% spot
    'TerminateInstancesWithExpiration': True,

    # Diversify across instance types and AZs
    'LaunchTemplateConfigs': [{
        'LaunchTemplateSpecification': {'LaunchTemplateId': 'lt-xxx', 'Version': '$Latest'},
        'Overrides': [
            # Same generation, different sizes and families
            {'InstanceType': 'm6i.xlarge',  'AvailabilityZone': 'us-east-1a', 'WeightedCapacity': 1},
            {'InstanceType': 'm6i.xlarge',  'AvailabilityZone': 'us-east-1b', 'WeightedCapacity': 1},
            {'InstanceType': 'm5.xlarge',   'AvailabilityZone': 'us-east-1a', 'WeightedCapacity': 1},
            {'InstanceType': 'm5.xlarge',   'AvailabilityZone': 'us-east-1b', 'WeightedCapacity': 1},
            {'InstanceType': 'm5a.xlarge',  'AvailabilityZone': 'us-east-1a', 'WeightedCapacity': 1},
            {'InstanceType': 'm5a.xlarge',  'AvailabilityZone': 'us-east-1b', 'WeightedCapacity': 1},
            {'InstanceType': 'r6i.large',   'AvailabilityZone': 'us-east-1a', 'WeightedCapacity': 1},
            {'InstanceType': 'r6i.large',   'AvailabilityZone': 'us-east-1b', 'WeightedCapacity': 1},
            {'InstanceType': 'c6i.xlarge',  'AvailabilityZone': 'us-east-1a', 'WeightedCapacity': 1},
            {'InstanceType': 'c6i.xlarge',  'AvailabilityZone': 'us-east-1b', 'WeightedCapacity': 1},
        ],
    }],
}

# Key: More instance type diversity = less chance of ALL being interrupted simultaneously
# Minimum 4 different instance types across 2+ AZs
```

### Spot Interruption Handling
```bash
#!/bin/bash
# spot-interrupt-handler.sh — Run as systemd service on spot instances

# Poll for interruption notice (2-minute warning)
METADATA_URL="http://169.254.169.254/latest/meta-data/spot/instance-action"
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

while true; do
  RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/spot-action \
    -H "X-aws-ec2-metadata-token: $TOKEN" \
    "$METADATA_URL")

  if [ "$RESPONSE" == "200" ]; then
    echo "SPOT INTERRUPTION DETECTED — initiating graceful shutdown"

    # 1. Deregister from load balancer
    aws elbv2 deregister-targets \
      --target-group-arn "$TARGET_GROUP_ARN" \
      --targets Id="$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)"

    # 2. Finish in-flight requests (drain)
    sleep 30

    # 3. Checkpoint state (if applicable)
    # save_checkpoint_to_s3

    # 4. Signal ASG to launch replacement
    aws autoscaling complete-lifecycle-action \
      --lifecycle-action-result CONTINUE \
      --instance-id "$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)" \
      --lifecycle-hook-name spot-termination \
      --auto-scaling-group-name "$ASG_NAME"

    exit 0
  fi

  sleep 5
done
```

---

## 6. Auto-Scaling Policies

### Auto-Scaling Strategy
```yaml
# Target Tracking — simplest and most effective
AutoScalingPolicy:
  PolicyType: TargetTrackingScaling

  # CPU-based (most common)
  TargetValue: 65           # Target 65% CPU
  PredefinedMetricSpecification:
    PredefinedMetricType: ASGAverageCPUUtilization

  # Request count per target (for web apps)
  # TargetValue: 1000       # 1000 requests per instance
  # PredefinedMetricSpecification:
  #   PredefinedMetricType: ALBRequestCountPerTarget
  #   ResourceLabel: "app/my-alb/..."

  # Custom metric (e.g., queue depth)
  # CustomizedMetricSpecification:
  #   MetricName: ApproximateNumberOfMessagesVisible
  #   Namespace: AWS/SQS
  #   Dimensions:
  #     - Name: QueueName
  #       Value: order-queue
  #   Statistic: Average
  # TargetValue: 10          # 10 messages per instance

  ScaleInCooldown: 300       # Wait 5min before scaling in (prevent flapping)
  ScaleOutCooldown: 60       # Scale out quickly (respond to spikes)

AutoScalingGroup:
  MinSize: 2                 # Always minimum 2 for HA
  MaxSize: 20                # Cap to prevent runaway costs
  DesiredCapacity: 3         # Starting point

  # Mixed instances — combine on-demand baseline + spot for cost
  MixedInstancesPolicy:
    InstancesDistribution:
      OnDemandBaseCapacity: 2           # 2 on-demand always
      OnDemandPercentageAboveBaseCapacity: 0  # Rest is spot
      SpotAllocationStrategy: capacity-optimized-prioritized
```

### Predictive Scaling
```yaml
# AWS Predictive Scaling — ML-based, learns traffic patterns
PredictiveScalingPolicy:
  MetricSpecifications:
    - TargetValue: 65
      PredefinedMetricPairSpecification:
        PredefinedMetricType: ASGCPUUtilization
  Mode: ForecastAndScale      # Both predict and act
  SchedulingBufferTime: 300   # Scale up 5min before predicted demand
  MaxCapacityBreachBehavior: HonorMaxCapacity

# Best for: Workloads with predictable daily/weekly patterns
# Example: E-commerce site with 9am-5pm spike pattern
# Predictive scaling pre-provisions instances before the spike
```

---

## 7. Cost Allocation Tagging

### Mandatory Tag Schema
```
Tag Key              | Purpose                    | Example Values
---------------------|----------------------------|------------------
Environment          | Cost per environment        | dev, staging, production
Project              | Cost per project            | stone-ai, best-ai, tools
Team                 | Cost per team               | backend, frontend, data
Owner                | Who to contact              | stone@stone-ai.net
CostCenter           | Financial tracking          | CC-001, CC-002
ManagedBy            | How provisioned             | terraform, manual, cdk
Service              | Logical service name        | api, web, worker, db
Tier                 | Criticality                 | critical, standard, dev

Enforcement:
  - AWS: SCP to deny resource creation without required tags
  - GCP: Organization Policy to require labels
  - Azure: Azure Policy to enforce tagging
```

### Tag Enforcement via SCP
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUntaggedResources",
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances",
        "rds:CreateDBInstance",
        "s3:CreateBucket",
        "lambda:CreateFunction",
        "ecs:CreateService"
      ],
      "Resource": "*",
      "Condition": {
        "Null": {
          "aws:RequestTag/Environment": "true",
          "aws:RequestTag/Project": "true",
          "aws:RequestTag/Owner": "true"
        }
      }
    }
  ]
}
```

---

## 8. Data Transfer Cost Optimization

### Data Transfer Pricing (AWS)
```
Transfer Type                    | Cost/GB    | Optimization
---------------------------------|------------|----------------------------
Within AZ                       | $0.00      | Keep services in same AZ
Cross-AZ (same region)          | $0.01      | Use AZ-aware routing
Internet egress (first 10TB)    | $0.09      | Use CloudFront ($0.085)
Internet egress (>150TB)        | $0.05      | Negotiate with AWS
To other AWS regions            | $0.02      | Minimize cross-region replication
To CloudFront                   | $0.00      | Always use CF for static content
VPC Peering (same region)       | $0.01      | Same as cross-AZ
NAT Gateway processing          | $0.045     | Use VPC endpoints for AWS services
VPC Endpoint (interface)        | $0.01      | Cheaper than NAT for AWS services

Top strategies:
  1. Use VPC endpoints for S3, DynamoDB (free gateway endpoints)
  2. CloudFront for all internet-facing content
  3. Compress data before transfer (gzip API responses)
  4. Cache aggressively (Redis, CloudFront, application cache)
  5. Keep compute and data in same AZ when possible
  6. Batch data transfers (fewer large transfers > many small ones)
```

---

## 9. Budget and Alerting

### AWS Budget Setup
```bash
# Create monthly budget with alerts
aws budgets create-budget \
  --account-id 123456789012 \
  --budget '{
    "BudgetName": "stone-ai-monthly",
    "BudgetLimit": {"Amount": "500", "Unit": "USD"},
    "BudgetType": "COST",
    "TimeUnit": "MONTHLY",
    "CostFilters": {
      "TagKeyValue": ["user:Project$stone-ai"]
    }
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80,
        "ThresholdType": "PERCENTAGE"
      },
      "Subscribers": [
        {"SubscriptionType": "EMAIL", "Address": "3headedm@gmail.com"},
        {"SubscriptionType": "SNS", "Address": "arn:aws:sns:us-east-1:123456:billing-alerts"}
      ]
    },
    {
      "Notification": {
        "NotificationType": "FORECASTED",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 100,
        "ThresholdType": "PERCENTAGE"
      },
      "Subscribers": [
        {"SubscriptionType": "EMAIL", "Address": "3headedm@gmail.com"}
      ]
    }
  ]'
```

### Cost Anomaly Detection
```
AWS Cost Anomaly Detection (free):
  - ML-based detection of unusual spending patterns
  - Alert via SNS/email when anomaly detected
  - Shows root cause (which service, region, usage type)

Setup:
  1. Console → Cost Management → Cost Anomaly Detection
  2. Create monitor: By AWS Service (covers all services)
  3. Create subscription: Email + SNS
  4. Threshold: Alert when anomaly > $10/day impact

Common catches:
  - Developer left GPU instance running over weekend ($50/day)
  - DDoS attack causing CloudFront data transfer spike
  - Runaway Lambda recursion (function triggering itself)
  - Forgotten test environment with production-sized resources
```

---

## 10. Monthly Optimization Checklist

```
Week 1: WASTE AUDIT
  □ Run waste detection script
  □ Delete unattached EBS volumes (after snapshot)
  □ Release unused Elastic IPs
  □ Terminate idle instances (CPU < 5% for 14 days)
  □ Delete old snapshots (> 90 days, no AMI reference)
  □ Check for idle NAT Gateways, Load Balancers

Week 2: RIGHT-SIZING
  □ Review Compute Optimizer recommendations
  □ Check RDS instance utilization
  □ Review ElastiCache node utilization
  □ Verify auto-scaling policies are active and tuned

Week 3: COMMITMENT REVIEW
  □ Check Savings Plan/RI coverage percentage (target: 60-70%)
  □ Review expiring commitments
  □ Analyze purchasing recommendations
  □ Verify spot instance utilization for eligible workloads

Week 4: ARCHITECTURE REVIEW
  □ Review data transfer costs (cross-AZ, internet egress)
  □ Check storage class optimization (S3 Intelligent-Tiering)
  □ Review CloudFront cache hit ratio
  □ Validate tagging compliance
  □ Generate monthly cost report for stakeholders
```

---

*This seed is maintained by the FinOps team. Last validated: 2026-03.*
