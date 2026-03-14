# Azure Enterprise Patterns
# Seed: INFRA-4 | Category: Cloud Architecture | Provider: Microsoft Azure
# RAG Tags: azure, app-service, functions, cosmos-db, entra-id, arc, devops, enterprise, hybrid-cloud

---

## Purpose
Azure's enterprise integration strengths, hybrid cloud capabilities, and
where Azure is the RIGHT choice. Focus on Active Directory/Entra ID integration,
Cosmos DB global distribution, and Azure's unique enterprise compliance features.

---

## 1. Where Azure Wins

### The Enterprise Edge
```
1. Active Directory / Entra ID  — Every enterprise has AD. Azure integrates natively.
2. Hybrid Cloud (Azure Arc)     — Manage on-prem + cloud from one control plane.
3. Microsoft 365 Integration    — Teams, Office, Outlook, SharePoint native hooks.
4. Government Cloud             — Azure Gov has more FedRAMP certifications than AWS GovCloud.
5. .NET Ecosystem               — Best-in-class .NET/C# support across all services.
6. Enterprise Agreements        — Existing Microsoft EAs = significant Azure discounts.
7. Compliance Coverage          — 100+ compliance certifications (most of any cloud).
8. Azure DevOps                 — Integrated CI/CD + project management + artifacts.
9. Power Platform               — Low-code automation (Power Automate, Power BI) native integration.
10. SQL Server Migration        — Azure SQL Managed Instance = lift-and-shift with zero code changes.
```

### Honest Weaknesses
```
- Portal UX: More complex than AWS/GCP consoles
- Naming: Frequent service renames create confusion (AAD → Entra ID)
- Documentation: Inconsistent quality, sometimes outdated
- Open source: Historically weaker OSS community (improving)
- Serverless: Azure Functions has more cold start issues than Lambda
- Pricing: More complex pricing models, harder to predict costs
```

---

## 2. App Service — Managed Web Hosting

### When to Use
- Web apps that need managed hosting without containers
- .NET, Java, Node.js, Python, PHP, Ruby web apps
- Apps needing deployment slots (blue-green)
- Quick time-to-market, managed infrastructure

### App Service Plans
```
Tier          | vCPU | RAM    | Storage | Price/month | Use Case
--------------|------|--------|---------|-------------|------------------
Free (F1)     | Shared| 1GB   | 1GB     | $0          | Dev/testing
Basic (B1)    | 1    | 1.75GB | 10GB    | ~$13        | Dev, low traffic
Standard (S1) | 1    | 1.75GB | 50GB    | ~$73        | Production (slots, autoscale)
Premium (P1v3)| 2    | 8GB    | 250GB   | ~$138       | High-perf production
Isolated (I1) | 1    | 3.5GB  | 1TB     | ~$298       | Compliance, network isolation

Key feature differences:
  Standard+: Deployment slots, auto-scale, VNet integration, custom domains + SSL
  Premium:   Private endpoints, more scaling, better hardware
  Isolated:  Dedicated environment (App Service Environment), fully isolated VNet
```

### Deployment Slots Pattern
```bash
# Create staging slot
az webapp deployment slot create \
  --name stone-ai-web \
  --resource-group stone-ai-rg \
  --slot staging

# Deploy to staging
az webapp deployment source config-zip \
  --name stone-ai-web \
  --resource-group stone-ai-rg \
  --slot staging \
  --src ./build.zip

# Test staging: stone-ai-web-staging.azurewebsites.net

# Swap when ready (zero-downtime)
az webapp deployment slot swap \
  --name stone-ai-web \
  --resource-group stone-ai-rg \
  --slot staging \
  --target-slot production

# Swap warms up the staging slot before routing traffic
# If issues: swap back immediately (instant rollback)
```

---

## 3. Azure Functions

### Hosting Plans
```
Consumption Plan:
  - Scale to zero (like Lambda)
  - Pay per execution ($0.20/million executions + $0.000016/GB-s)
  - Cold starts: 1-10 seconds (worse than Lambda)
  - Timeout: 10 minutes (default 5)
  - Best for: Sporadic, event-driven workloads

Premium Plan (Flex Consumption — new):
  - Pre-warmed instances (no cold starts)
  - VNet integration
  - Unlimited execution duration
  - Instance-based pricing: ~$0.173/hour per instance
  - Best for: Latency-sensitive, VNet-required workloads

Dedicated Plan (App Service Plan):
  - Always running on App Service infrastructure
  - No cold starts, no scaling limits from Functions runtime
  - Pay for the App Service Plan regardless of usage
  - Best for: Already have App Service Plan, need predictable cost
```

### Durable Functions — Stateful Orchestration
```typescript
// Durable Functions = Azure's answer to Step Functions (but code-first)
import * as df from 'durable-functions';

// Orchestrator function (defines workflow)
const orchestrator = df.orchestrator(function* (context) {
  // Sequential steps with automatic state persistence
  const inventoryResult = yield context.df.callActivity('ReserveInventory', context.df.input);

  const paymentResult = yield context.df.callActivity('ProcessPayment', {
    ...context.df.input,
    reservationId: inventoryResult.reservationId,
  });

  // Fan-out/fan-in pattern
  const notifications = [
    context.df.callActivity('SendEmail', { to: context.df.input.email }),
    context.df.callActivity('SendSMS', { to: context.df.input.phone }),
    context.df.callActivity('UpdateAnalytics', paymentResult),
  ];
  yield context.df.Task.all(notifications);

  // Human approval with timeout
  const approvalEvent = context.df.waitForExternalEvent('ApprovalReceived');
  const timeout = context.df.createTimer(
    new Date(context.df.currentUtcDateTime.getTime() + 72 * 60 * 60 * 1000) // 72 hours
  );

  const winner = yield context.df.Task.any([approvalEvent, timeout]);

  if (winner === approvalEvent) {
    yield context.df.callActivity('FulfillOrder', paymentResult);
  } else {
    yield context.df.callActivity('CancelOrder', paymentResult);
  }

  return { status: 'completed', orderId: paymentResult.orderId };
});

export default orchestrator;

// Activity function (one step)
const reserveInventory = df.activity('ReserveInventory', {
  handler: async (input: OrderInput) => {
    // Actual business logic
    const reservation = await inventoryService.reserve(input.items);
    return { reservationId: reservation.id };
  },
});
```

### Durable Functions Patterns
```
1. Function Chaining:    A → B → C → D (sequential)
2. Fan-out/Fan-in:       A → [B1, B2, B3] → C (parallel then aggregate)
3. Async HTTP API:       Start → Poll status → Get result (long-running API)
4. Monitor:              Poll external system periodically until condition met
5. Human Interaction:    Pause workflow, wait for external event, timeout
6. Aggregator (Entity):  Stateful entity that accumulates data over time
```

---

## 4. Cosmos DB — Global Distribution

### When Cosmos DB Shines
```
Use Cosmos DB when:
  ✓ Global distribution with single-digit ms reads in any region
  ✓ Multi-model (document, key-value, graph, column-family, table)
  ✓ Guaranteed SLAs (99.999% for multi-region)
  ✓ Turnkey global replication (click to add regions)
  ✓ Need multiple consistency levels (not just strong or eventual)

Don't use Cosmos DB when:
  ✗ Complex relational queries with JOINs (use Azure SQL)
  ✗ Full-text search primary use case (use Azure Cognitive Search)
  ✗ Simple key-value store at low scale (use Table Storage, much cheaper)
  ✗ Cost-sensitive workloads (Cosmos DB is expensive at scale)
```

### Consistency Levels (Unique to Cosmos DB)
```
Level              | Latency | Availability | Consistency Guarantee
-------------------|---------|--------------|------------------------
Strong             | Highest | Lowest       | Linearizable reads (global)
Bounded Staleness  | High    | Medium       | Reads lag writes by ≤K versions or ≤T time
Session            | Medium  | High         | Read-your-own-writes within session
Consistent Prefix  | Low     | High         | Reads never see out-of-order writes
Eventual           | Lowest  | Highest      | No ordering guarantees

RECOMMENDATION: Session consistency for most apps
  - User always sees their own writes (good UX)
  - Other users see updates within milliseconds (good enough)
  - ~50% cheaper in RU consumption vs. Strong
```

### Partition Key Strategy
```
// CRITICAL: Partition key determines data distribution and query performance
// Bad partition key = hot partitions = throttling + cost explosion

// GOOD partition key properties:
// 1. High cardinality (many distinct values)
// 2. Even distribution of data
// 3. Used in most queries (avoids cross-partition queries)

// Stone AI example:
{
  "id": "chat_abc123",
  "userId": "clerk_xyz",        // ← PARTITION KEY
  "agentId": 1,
  "messages": [...],
  "createdAt": "2026-03-10T00:00:00Z"
}

// With userId as partition key:
// ✓ Each user's data co-located → fast single-partition queries
// ✓ Even distribution (no one user dominates)
// ✓ Most queries filter by userId anyway
// ✗ Cross-user analytics queries are expensive (cross-partition)
//   → Use Change Feed → Materialized View for analytics

// Request Unit (RU) cost reference:
// Point read (1KB document by id + partition key):  1 RU
// Query returning 5 documents (in same partition):  ~3 RUs
// Write (1KB document):                             ~5 RUs
// Cross-partition query (fan-out to all partitions): 5-50+ RUs
```

### Change Feed Pattern
```typescript
// Cosmos DB Change Feed — stream of changes for event-driven architectures
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const container = client.database('stoneai').container('chats');

// Process changes since last checkpoint
async function processChangeFeed() {
  const iterator = container.items.changeFeed({
    changeFeedStartFrom: ChangeFeedStartFrom.Beginning(), // or specific continuation
  });

  while (iterator.hasMoreResults) {
    const { result: items, continuationToken } = await iterator.fetchNext();

    for (const item of items) {
      // Send to analytics, update search index, trigger notifications
      await processChange(item);
    }

    // Save continuationToken for restart
    await saveCheckpoint(continuationToken);
  }
}

// Use cases:
// 1. Replicate to BigQuery/Synapse for analytics
// 2. Update search index (Cognitive Search) in real-time
// 3. Trigger notifications on data changes
// 4. Materialized views for cross-partition queries
// 5. Event sourcing pattern
```

---

## 5. Entra ID (formerly Azure AD) — Enterprise Identity

### Why Entra ID Matters
```
Every Fortune 500 company uses Active Directory.
Azure integrates with it natively. AWS and GCP do not.

Entra ID provides:
  - Single sign-on (SSO) to 3000+ SaaS apps
  - Multi-factor authentication (MFA) built-in
  - Conditional Access policies (device + location + risk-based)
  - B2B collaboration (invite external users)
  - B2C identity (consumer-facing apps)
  - Managed identities (like IAM Roles for Azure resources)
  - Privileged Identity Management (PIM) — just-in-time admin access
```

### Managed Identity — Zero Secrets
```typescript
// Managed Identity = Azure's answer to IAM Roles
// No secrets, no connection strings in code or env vars

import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';

// DefaultAzureCredential automatically uses:
// 1. Managed Identity (when running in Azure)
// 2. Environment variables (for CI/CD)
// 3. Azure CLI credentials (for local dev)
// 4. VS Code credentials (for local dev)
const credential = new DefaultAzureCredential();

// Access Key Vault — no connection string needed
const secretClient = new SecretClient(
  'https://stone-ai-vault.vault.azure.net',
  credential
);
const dbSecret = await secretClient.getSecret('database-url');

// Access Blob Storage — no access key needed
const blobClient = new BlobServiceClient(
  'https://stoneai.blob.core.windows.net',
  credential
);

// The identity's permissions are managed in Azure RBAC
// No secrets to rotate, no keys to leak, no credentials in code
```

### Conditional Access Policies
```json
{
  "displayName": "Require MFA for admin access",
  "state": "enabled",
  "conditions": {
    "users": {
      "includeRoles": ["Global Administrator", "Security Administrator"]
    },
    "applications": {
      "includeApplications": ["All"]
    },
    "locations": {
      "excludeLocations": ["Corporate Network"]
    }
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": [
      "mfa",
      "compliantDevice"
    ]
  },
  "sessionControls": {
    "signInFrequency": {
      "value": 4,
      "type": "hours"
    }
  }
}
```

---

## 6. Azure Arc — Hybrid Cloud

### What Arc Does
```
Azure Arc extends Azure management to:
  - On-premises servers (Windows, Linux)
  - Kubernetes clusters (any distro, anywhere)
  - SQL Server instances (on-prem)
  - VMware vSphere environments
  - AWS/GCP resources (multi-cloud management from Azure)

Key capabilities:
  1. Azure Policy enforcement on non-Azure resources
  2. Azure Monitor for on-prem servers
  3. Microsoft Defender for on-prem workloads
  4. GitOps-based configuration management
  5. Azure RBAC for on-prem access control
  6. Unified inventory across clouds and on-prem
```

### Arc-Enabled Kubernetes
```bash
# Connect any K8s cluster to Azure Arc
az connectedk8s connect \
  --name on-prem-cluster \
  --resource-group hybrid-rg \
  --location eastus

# Apply Azure Policy to on-prem cluster
az policy assignment create \
  --name 'enforce-resource-limits' \
  --scope "/subscriptions/{sub}/resourceGroups/hybrid-rg/providers/Microsoft.Kubernetes/connectedClusters/on-prem-cluster" \
  --policy 'e345eecc-fa47-480f-9e88-67dcc122b164'

# Deploy apps via GitOps (Flux v2)
az k8s-configuration flux create \
  --name stone-ai-config \
  --cluster-name on-prem-cluster \
  --resource-group hybrid-rg \
  --cluster-type connectedClusters \
  --url https://github.com/stone-ai/k8s-config \
  --branch main \
  --kustomization name=infra path=./infrastructure prune=true \
  --kustomization name=apps path=./apps prune=true dependsOn=infra
```

---

## 7. Azure DevOps — Integrated Pipeline

### Pipeline Example
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include: [main]
  paths:
    exclude: [docs/*, '*.md']

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: stone-ai-production

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run lint
            displayName: 'Lint'

          - script: npm run test:unit -- --coverage
            displayName: 'Unit tests'

          - script: npm run build
            displayName: 'Build'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/junit.xml'

          - task: PublishCodeCoverageResults@1
            inputs:
              codeCoverageTool: 'Cobertura'
              summaryFileLocation: 'coverage/cobertura-coverage.xml'

  - stage: DeployStaging
    dependsOn: Build
    jobs:
      - deployment: DeployToStaging
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Production'
                    appType: 'webAppLinux'
                    appName: 'stone-ai-web'
                    deployToSlotOrASE: true
                    slotName: 'staging'
                    package: '$(Pipeline.Workspace)/build.zip'

  - stage: DeployProduction
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: SwapToProduction
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureAppServiceManage@0
                  inputs:
                    azureSubscription: 'Production'
                    action: 'Swap Slots'
                    webAppName: 'stone-ai-web'
                    sourceSlot: 'staging'
                    targetSlot: 'production'
```

---

## 8. Enterprise Integration Patterns

### Microsoft Graph API Integration
```typescript
// Access Microsoft 365 data from your app
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ['https://graph.microsoft.com/.default'],
});

const graphClient = Client.initWithMiddleware({ authProvider });

// Get user's calendar for scheduling
const events = await graphClient
  .api('/users/{user-id}/calendar/events')
  .filter("start/dateTime ge '2026-03-10'")
  .top(10)
  .get();

// Send notification via Teams
await graphClient
  .api('/users/{user-id}/teamwork/sendActivityNotification')
  .post({
    topic: { source: 'text', value: 'Stone AI Alert' },
    activityType: 'systemDefault',
    previewText: { content: 'Your agent task is complete' },
  });
```

### Azure Compliance Features
```
Built-in compliance tools:
  1. Microsoft Purview:     Data governance, classification, lineage tracking
  2. Microsoft Defender:    Cloud security posture management (CSPM)
  3. Azure Policy:          Enforce organizational standards across all resources
  4. Compliance Manager:    Assessment tool for GDPR, HIPAA, SOC 2, etc.
  5. Azure Blueprints:      Repeatable, compliant environment provisioning
  6. Audit logs:            90-day default retention, unlimited with Log Analytics

Certifications (100+):
  SOC 1/2/3, ISO 27001/27017/27018, HIPAA, FedRAMP High,
  GDPR, PCI DSS Level 1, NIST 800-53, CJIS, ITAR, DoD IL5
```

---

## 9. Decision Framework: When to Choose Azure

```
Choose Azure when:
  ✓ Enterprise with existing Microsoft stack (AD, Office 365, Teams)
  ✓ Hybrid cloud requirements (on-prem + cloud)
  ✓ .NET/C# application stack
  ✓ Government/compliance-heavy industries
  ✓ Need global distributed database (Cosmos DB)
  ✓ Existing Enterprise Agreement with Microsoft
  ✓ Power Platform / low-code integration needed
  ✓ SQL Server workloads (Azure SQL MI = easiest migration)

Don't choose Azure for:
  ✗ Pure startup with no Microsoft dependencies (AWS/GCP simpler)
  ✗ Data analytics primary focus (BigQuery > Synapse for most cases)
  ✗ Kubernetes-first without Azure AD needs (GKE better)
  ✗ Cutting-edge serverless (Lambda ecosystem more mature)
```

---

*This seed is maintained by the Cloud Architecture team. Last validated: 2026-03.*
