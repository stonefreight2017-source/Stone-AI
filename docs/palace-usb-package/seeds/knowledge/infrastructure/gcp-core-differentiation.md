# GCP Core Differentiation
# Seed: INFRA-3 | Category: Cloud Architecture | Provider: Google Cloud Platform
# RAG Tags: gcp, bigquery, cloud-run, gke, pub-sub, compute-engine, cloud-functions, iam

---

## Purpose
Where GCP beats AWS, where it doesn't, and how to leverage GCP's unique strengths.
Focus on BigQuery (analytics powerhouse), Cloud Run (best serverless containers),
GKE (best managed Kubernetes), and GCP's data/ML ecosystem.

---

## 1. GCP vs. AWS — Honest Comparison

### Where GCP Wins
```
1. BigQuery           — No AWS equivalent at this price/performance. Athena is not close.
2. Cloud Run          — Serverless containers done right. Fargate is clunkier.
3. GKE                — Best managed Kubernetes. EKS requires more config.
4. Global Network     — Google's private backbone. Lower latency for global apps.
5. BigQuery ML        — ML directly in SQL. No SageMaker complexity.
6. Pub/Sub            — Simpler than SNS+SQS combo. Global by default.
7. Pricing Model      — Per-second billing, sustained use discounts (automatic).
8. Firebase           — Best mobile BaaS. AWS Amplify is catching up but not there.
9. Anthos             — Multi-cloud Kubernetes management.
10. Spanner           — Globally distributed relational DB. No AWS equivalent.
```

### Where AWS Wins
```
1. Market share       — ~32% vs GCP ~12%. More talent, more docs, more community.
2. Service breadth    — 200+ services vs GCP ~100. AWS has something for everything.
3. Enterprise adoption— More Fortune 500 companies run on AWS.
4. Marketplace        — Larger AMI/container marketplace.
5. IAM granularity    — AWS IAM is more granular (resource-level policies).
6. Lambda ecosystem   — More integrations, more triggers, more mature.
7. Documentation      — AWS docs are better organized overall.
```

---

## 2. Compute Engine

### Key Differences from EC2
```
Unique GCP advantages:
  - Live migration:    VMs migrate during maintenance with zero downtime (EC2 reboots)
  - Custom machine types: Pick exact vCPU/memory ratio (EC2 has fixed instance types)
  - Sustained use discounts: Automatic 30% discount for running 100% of month (no commitment)
  - Preemptible VMs:   Same as Spot, but fixed 80% discount (vs variable EC2 Spot pricing)
  - Sole-tenant nodes: Dedicated hardware without managing it

Machine type naming:
  e2-medium    = 2 vCPU, 4GB (economy, burstable)
  n2-standard-4 = 4 vCPU, 16GB (general purpose, Intel)
  n2d-standard-4 = 4 vCPU, 16GB (general purpose, AMD — cheaper)
  c2-standard-4 = 4 vCPU, 16GB (compute-optimized)
  m2-megamem-416 = 416 vCPU, 5.75TB RAM (memory-optimized, SAP HANA)
  a2-highgpu-1g = 12 vCPU, 85GB, 1x A100 GPU (ML training)
```

### Custom Machine Types
```bash
# Create a VM with exactly 6 vCPUs and 24GB RAM
gcloud compute instances create my-vm \
  --custom-cpu=6 \
  --custom-memory=24GB \
  --zone=us-central1-a \
  --image-family=debian-12 \
  --image-project=debian-cloud

# Save ~40% vs. next-size-up standard machine type
# EC2 would force you to use c5.2xlarge (8 vCPU, 16GB) — overpaying for CPU, underfitting memory
```

---

## 3. Cloud Functions

### Gen 2 (Built on Cloud Run)
```
Cloud Functions Gen 2 improvements:
  - Built on Cloud Run (container-based, not proprietary runtime)
  - Max timeout: 60 minutes (Gen 1: 9 minutes, Lambda: 15 minutes)
  - Max memory: 32GB (Gen 1: 8GB, Lambda: 10GB)
  - Concurrency: Multiple requests per instance (Lambda: 1 per container)
  - Min instances: Keep warm instances (like Lambda Provisioned Concurrency but cheaper)
  - Traffic splitting: Canary deployments built-in
  - Eventarc: Unified event routing (replaces Gen 1 triggers)

When to use Cloud Functions vs. Cloud Run:
  Cloud Functions: Simple event handlers, quick APIs, < 10 dependencies
  Cloud Run:       Complex apps, custom runtimes, need Dockerfile control, WebSocket
```

### Cloud Functions Gen 2 Example
```typescript
import { HttpFunction } from '@google-cloud/functions-framework';
import { z } from 'zod';

const RequestSchema = z.object({
  query: z.string().min(1).max(500),
  agentId: z.number().int().min(1).max(44),
}).strict();

export const handleAgentQuery: HttpFunction = async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', 'https://stone-ai.net');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  try {
    const result = await processAgentQuery(parsed.data);
    res.status(200).json(result);
  } catch (error) {
    console.error('Agent query failed:', error);
    res.status(500).json({ error: 'Internal error' });
  }
};
```

---

## 4. BigQuery — The Analytics Powerhouse

### Why BigQuery Is Special
```
Architecture:
  - Serverless: No infrastructure to manage. No clusters. No indexes.
  - Columnar storage: Dremel engine scans only needed columns
  - Petabyte-scale: Query 1PB in seconds
  - Separation of storage and compute: Pay for storage ($0.02/GB/month) separately from queries ($5/TB scanned)
  - Slot-based execution: Automatic parallelism across thousands of workers

Pricing models:
  On-demand:  $5.00 per TB scanned (first 1TB/month free)
  Flat-rate:  $2,000/month for 100 slots (predictable cost)
  Editions:   Standard ($0.04/slot-hour), Enterprise ($0.06/slot-hour) — autoscaling

Cost optimization:
  - SELECT only needed columns (columnar = only scanned columns cost)
  - Use partitioned tables (date partitioning = scan only relevant dates)
  - Use clustered tables (co-locate related data for faster scans)
  - Cache query results (identical queries within 24h are free)
  - Use LIMIT with caution (doesn't reduce scanned data, just output)
```

### BigQuery Patterns
```sql
-- Partitioned + Clustered table for Stone AI analytics
CREATE TABLE `stone-ai.analytics.agent_interactions`
PARTITION BY DATE(created_at)
CLUSTER BY user_id, agent_id
AS SELECT
  interaction_id,
  user_id,
  agent_id,
  agent_name,
  query_text,
  response_text,
  tokens_used,
  latency_ms,
  model_used,
  created_at
FROM source_table;

-- Query scans only March 2026 data for agent #1
-- Without partitioning: scans entire table ($$$)
-- With partitioning: scans only March partition (pennies)
SELECT
  agent_name,
  COUNT(*) as interactions,
  AVG(latency_ms) as avg_latency,
  SUM(tokens_used) as total_tokens,
  APPROX_QUANTILES(latency_ms, 100)[OFFSET(95)] as p95_latency
FROM `stone-ai.analytics.agent_interactions`
WHERE created_at BETWEEN '2026-03-01' AND '2026-03-31'
  AND agent_id = 1
GROUP BY agent_name;

-- Federated query: Query data directly in Cloud Storage (no loading)
CREATE EXTERNAL TABLE `stone-ai.analytics.raw_logs`
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://stone-ai-logs/2026/03/*.parquet']
);
```

### BigQuery ML — ML in SQL
```sql
-- Train a model to predict user churn — NO Python, NO SageMaker, just SQL
CREATE OR REPLACE MODEL `stone-ai.ml.churn_prediction`
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['churned'],
  auto_class_weights = TRUE,
  data_split_method = 'AUTO_SPLIT'
) AS
SELECT
  days_since_last_login,
  total_interactions_30d,
  subscription_tier,
  agent_count_used,
  bestie_configured,
  referrals_sent,
  CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END AS churned
FROM `stone-ai.analytics.user_features`
WHERE created_at < '2026-03-01';

-- Predict churn for current users
SELECT
  user_id,
  predicted_churned,
  predicted_churned_probs[OFFSET(1)].prob AS churn_probability
FROM ML.PREDICT(
  MODEL `stone-ai.ml.churn_prediction`,
  (SELECT * FROM `stone-ai.analytics.user_features` WHERE status = 'ACTIVE')
)
WHERE predicted_churned_probs[OFFSET(1)].prob > 0.7
ORDER BY churn_probability DESC;

-- Supported model types:
-- LINEAR_REG, LOGISTIC_REG, KMEANS, BOOSTED_TREE_CLASSIFIER,
-- BOOSTED_TREE_REGRESSOR, DNN_CLASSIFIER, DNN_REGRESSOR,
-- AUTOML_CLASSIFIER, AUTOML_REGRESSOR, TRANSFORM, ARIMA_PLUS (time series)
```

---

## 5. Cloud Run — Best Serverless Containers

### Why Cloud Run Wins
```
Cloud Run vs. AWS Fargate:
  - Scale to zero: Cloud Run scales to 0 instances (Fargate minimum: 1 task in many configs)
  - Simpler networking: No VPC required by default
  - Per-100ms billing: vs Fargate per-second (both are fine)
  - Built-in HTTPS: Automatic TLS, custom domains, no ALB needed
  - Revisions + Traffic splitting: Built-in canary/blue-green
  - Startup CPU boost: Extra CPU during cold start (faster startup)
  - Concurrency: Up to 1000 requests per container (Fargate: you manage)
```

### Cloud Run Deployment
```yaml
# service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: stone-ai-api
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"        # Keep 1 instance warm
        autoscaling.knative.dev/maxScale: "100"
        run.googleapis.com/cpu-throttling: "false"    # Always-on CPU
        run.googleapis.com/startup-cpu-boost: "true"  # Extra CPU on cold start
    spec:
      containerConcurrency: 80    # 80 concurrent requests per container
      timeoutSeconds: 300
      containers:
        - image: gcr.io/stone-ai/api:latest
          ports:
            - containerPort: 8080
          resources:
            limits:
              cpu: "2"
              memory: 2Gi
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: latest
```

```bash
# Deploy with traffic splitting (canary)
gcloud run deploy stone-ai-api \
  --image gcr.io/stone-ai/api:v2 \
  --region us-central1 \
  --tag canary \
  --no-traffic           # Deploy but don't route traffic

# Send 10% of traffic to canary
gcloud run services update-traffic stone-ai-api \
  --to-tags canary=10 \
  --region us-central1

# Looks good? Route 100%
gcloud run services update-traffic stone-ai-api \
  --to-latest \
  --region us-central1
```

---

## 6. GKE — Google Kubernetes Engine

### GKE Autopilot vs. Standard
```
GKE Autopilot (RECOMMENDED for most cases):
  - Google manages nodes, scaling, security patching, OS updates
  - Pay per pod resource requests (not per node)
  - Built-in security hardening (no SSH to nodes, no privileged containers)
  - Automatic bin-packing
  - No cluster autoscaler config needed
  - Cost: ~$0.0445/vCPU/hr + $0.0049/GB/hr

GKE Standard:
  - You manage node pools, scaling, OS patching
  - More flexibility (GPU nodes, custom machine types, privileged containers)
  - Pay per node (whether utilized or not)
  - Use when: need GPU, need privileged access, need specific node configurations
```

### GKE vs. EKS
```
Feature                  | GKE                    | EKS
-------------------------|------------------------|------------------------
Control plane cost       | Free (Autopilot)       | $0.10/hr ($73/month)
Node management          | Autopilot does it all  | Managed node groups
Upgrade strategy         | Auto-upgrade default   | Manual or managed
Release channels         | Rapid, Regular, Stable | Similar but newer
Istio/Service mesh       | Built-in (Anthos SM)   | App Mesh (separate)
Workload Identity        | Native GKE feature     | IRSA (more complex setup)
Multi-cluster            | Anthos                 | EKS Anywhere
GPU support              | T4, V100, A100, H100   | Same + Inferentia/Trainium
```

---

## 7. Pub/Sub Patterns

### Pub/Sub vs. SQS/SNS
```
GCP Pub/Sub = SNS + SQS combined in one service:
  - Topic (like SNS topic): Where publishers send messages
  - Subscription (like SQS queue): Where subscribers pull messages
  - One topic → many subscriptions (fan-out built in)
  - Push AND pull delivery modes
  - Global by default (no region config needed)
  - 7-day message retention (SQS: 14 days max)
  - Ordering: Optional with ordering keys
  - Exactly-once delivery: Available with exactly-once subscriptions

Pricing comparison (10M messages/month):
  GCP Pub/Sub: ~$4.00 (first 10GB free)
  AWS SNS+SQS: ~$5.50 (SNS: $0.50/1M + SQS: $0.40/1M + data: varies)
```

### Pub/Sub Patterns
```typescript
// Publisher
import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({ projectId: 'stone-ai' });

async function publishAgentEvent(event: AgentEvent) {
  const topic = pubsub.topic('agent-events');
  const data = Buffer.from(JSON.stringify(event));

  await topic.publishMessage({
    data,
    attributes: {
      eventType: event.type,       // For filtering
      agentId: String(event.agentId),
      priority: event.priority,
    },
    orderingKey: event.userId,      // Ensures ordering per user
  });
}

// Subscriber with flow control
const subscription = pubsub.subscription('agent-events-analytics', {
  flowControl: {
    maxMessages: 100,               // Process max 100 messages concurrently
    allowExcessMessages: false,
  },
});

subscription.on('message', async (message) => {
  try {
    const event = JSON.parse(message.data.toString());
    await processAnalytics(event);
    message.ack();
  } catch (error) {
    console.error('Failed to process:', error);
    message.nack();  // Will be redelivered after ackDeadline
  }
});

subscription.on('error', (error) => {
  console.error('Subscription error:', error);
});
```

---

## 8. GCP IAM Differences from AWS

### Key Differences
```
Concept                | AWS                        | GCP
-----------------------|----------------------------|---------------------------
Identity               | IAM Users, Roles           | Google accounts, Service accounts
Policy attachment      | Attach to user/role/group  | Bind to resource (project/folder/org)
Granularity            | Resource-level policies     | Project-level (broader scope)
Service accounts       | IAM Roles assumed by svc    | First-class identity with keys
Cross-service auth     | IAM Roles + Trust policies  | Workload Identity Federation
Hierarchy              | Account → OU → SCP          | Org → Folder → Project → Resource
```

### GCP IAM Best Practices
```bash
# Principle of least privilege with custom roles
gcloud iam roles create stoneAiApiRole \
  --project=stone-ai \
  --title="Stone AI API Service Role" \
  --description="Minimum permissions for API service" \
  --permissions=\
bigquery.datasets.get,\
bigquery.tables.getData,\
pubsub.topics.publish,\
secretmanager.versions.access,\
storage.objects.get

# Bind to service account
gcloud projects add-iam-policy-binding stone-ai \
  --member="serviceAccount:api-service@stone-ai.iam.gserviceaccount.com" \
  --role="projects/stone-ai/roles/stoneAiApiRole" \
  --condition='expression=resource.name.startsWith("projects/stone-ai/topics/agent-"),title=agent-topics-only'

# Workload Identity Federation — NO service account keys
# Allows GKE pods to authenticate as service accounts without key files
gcloud iam service-accounts add-iam-policy-binding \
  api-service@stone-ai.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:stone-ai.svc.id.goog[production/api-service]"
```

---

## 9. When to Choose GCP

### Decision Framework
```
Choose GCP when:
  ✓ Data analytics is core to your product (BigQuery is unmatched)
  ✓ You need ML without ML engineering (BigQuery ML, Vertex AI AutoML)
  ✓ Kubernetes is your compute platform (GKE is the best managed K8s)
  ✓ You want serverless containers (Cloud Run > Fargate for simplicity)
  ✓ You need global real-time data (Spanner, Bigtable)
  ✓ Your team prefers simplicity over breadth of services
  ✓ You're a Google Workspace shop (SSO, identity integration)
  ✓ Mobile-first product (Firebase is best-in-class)

Choose AWS when:
  ✓ You need the broadest service catalog
  ✓ Enterprise compliance requirements (most certifications)
  ✓ Largest community and talent pool
  ✓ Specific AWS services (e.g., Aurora, Redshift, Lambda ecosystem)
  ✓ Government cloud (GovCloud maturity)

Choose both when:
  ✓ Use GCP for analytics (BigQuery) + AWS for everything else
  ✓ Multi-cloud resilience requirements
  ✓ Best-of-breed strategy with Terraform managing both
```

---

*This seed is maintained by the Cloud Architecture team. Last validated: 2026-03.*
