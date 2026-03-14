# Zero Trust Architecture
# Seed: SEC-4 | Category: Cybersecurity | Topic: Zero Trust
# RAG Tags: zero-trust, beyondcorp, micro-segmentation, mtls, spiffe, spire, conditional-access, device-trust

---

## Purpose
Complete zero trust implementation guide. BeyondCorp model, micro-segmentation,
identity-aware proxies, continuous verification, mTLS, SPIFFE/SPIRE, device trust,
and conditional access policies. Includes practical implementation roadmap.

---

## 1. Zero Trust Principles

### The Paradigm Shift
```
TRADITIONAL (Castle-and-Moat):
  "Everything inside the network is trusted"
  - VPN = full network access
  - Firewall at perimeter, soft interior
  - Once inside, lateral movement is easy
  - Assumes internal = safe (false)

ZERO TRUST:
  "Never trust, always verify"
  - No implicit trust based on network location
  - Every request is authenticated and authorized
  - Least-privilege access, just-in-time
  - Assume breach — limit blast radius
  - Continuous verification, not one-time check

Core tenets:
  1. Verify explicitly (always authenticate and authorize)
  2. Use least-privilege access (just enough, just in time)
  3. Assume breach (minimize blast radius, segment access, verify end-to-end encryption)
```

### BeyondCorp Model (Google)
```
Google's implementation of zero trust (in production since 2011):

Key components:
  1. Trust is based on DEVICE + USER + CONTEXT, not network location
  2. All applications are accessed through an identity-aware proxy
  3. No VPN needed — applications are internet-facing but protected
  4. Access decisions combine:
     - User identity (who you are)
     - Device state (is the device managed, updated, encrypted?)
     - Context (location, time, risk score)
     - Resource sensitivity (what you're accessing)

Architecture:
  User + Device
    → Identity-Aware Proxy (IAP)
      → Access Policy Engine (evaluates trust signals)
        → Application (if policy passes)

  Trust signals:
    - Valid user authentication (SSO/MFA)
    - Device certificate (managed by IT)
    - Device health (OS updated, disk encrypted, firewall on)
    - User risk score (behavioral analytics)
    - Network context (not a trust factor, but a signal)
```

---

## 2. Identity-Aware Proxy (IAP)

### Architecture
```
Internet
  ↓
Identity-Aware Proxy (IAP)
  ├── Authenticates user (SSO/OIDC)
  ├── Checks device trust (certificate + health)
  ├── Evaluates access policy
  ├── If ALL checks pass → forwards request to application
  └── If ANY check fails → returns 403

Benefits over VPN:
  - No network-level access (user can't scan internal network)
  - Per-application access control (not all-or-nothing)
  - Works from any network (office, home, coffee shop)
  - No VPN client needed (browser-based)
  - Auditable (every access attempt logged)
```

### Implementation Options
```
Cloud-native IAP:
  - Google Cloud IAP (built into GCP, free)
  - Azure AD Application Proxy
  - AWS Verified Access

Self-hosted IAP:
  - Pomerium (open source, Go-based)
  - Teleport (open source, Go-based)
  - Boundary (HashiCorp, for infrastructure access)
  - Cloudflare Access (SaaS, easy setup)
```

### Pomerium Configuration (Self-Hosted IAP)
```yaml
# pomerium-config.yaml
authenticate_service_url: https://auth.stone-ai.net
identity_provider: oidc
identity_provider_url: https://accounts.google.com
identity_provider_client_id: xxx.apps.googleusercontent.com
identity_provider_client_secret: GOCSPX-xxx

# Route: Internal dashboard — only founder can access
- from: https://admin.stone-ai.net
  to: http://internal-admin:3000
  policy:
    - allow:
        and:
          - email:
              is: founder@stone-ai.net
          - device:
              is:
                enrolled: true
                os: windows
                disk_encryption: true

# Route: API docs — any authenticated team member
- from: https://docs.stone-ai.net
  to: http://internal-docs:8080
  policy:
    - allow:
        and:
          - domain:
              is: stone-ai.net
          - mfa:
              required: true

# Route: Production database — strict access
- from: tcp+https://db.stone-ai.net:5432
  to: tcp://prod-db.internal:5432
  policy:
    - allow:
        and:
          - email:
              is: founder@stone-ai.net
          - groups:
              has: db-admins
          - device:
              is:
                enrolled: true
                disk_encryption: true
                firewall: true
                os_version_min: "10.0.19045"  # Win10 22H2+
```

---

## 3. Micro-Segmentation

### Network Micro-Segmentation
```
Traditional flat network:
  [Web Server] ←→ [App Server] ←→ [DB Server] ←→ [Cache]
  All can communicate freely. Breach one = access all.

Micro-segmented network:
  [Web Server] → [App Server] → [DB Server]
       ↓                              ↑
  Only port 443    Only port 8080    Only port 5432
  from internet    from Web SG       from App SG

  Firewall rules between EVERY pair of services:
  - Web → App: Allow port 8080 only
  - App → DB:  Allow port 5432 only
  - App → Cache: Allow port 6379 only
  - Web → DB:  DENY (web should never talk to DB directly)
  - DB → Web:  DENY
  - Cache → DB: DENY
```

### Application-Level Micro-Segmentation
```typescript
// Beyond network segmentation — segment at the application level

// Service-to-service authentication
// Each service has its own identity and can only call authorized services

interface ServiceIdentity {
  name: string;
  allowedTargets: string[];       // Services this service can call
  allowedEndpoints: RegExp[];     // Specific endpoints allowed
}

const SERVICE_POLICIES: Record<string, ServiceIdentity> = {
  'api-gateway': {
    name: 'api-gateway',
    allowedTargets: ['auth-service', 'chat-service', 'billing-service'],
    allowedEndpoints: [/^\/api\/.*$/],
  },
  'chat-service': {
    name: 'chat-service',
    allowedTargets: ['llm-service', 'database-service'],
    allowedEndpoints: [/^\/internal\/chat\/.*$/, /^\/internal\/llm\/.*$/],
  },
  'billing-service': {
    name: 'billing-service',
    allowedTargets: ['database-service', 'notification-service'],
    allowedEndpoints: [/^\/internal\/billing\/.*$/, /^\/internal\/notify\/.*$/],
  },
  // llm-service can ONLY talk to the LLM backend — no database, no other services
  'llm-service': {
    name: 'llm-service',
    allowedTargets: [],  // Only external LLM APIs, no internal services
    allowedEndpoints: [],
  },
};

// Middleware: Verify service-to-service authorization
function authorizeServiceCall(sourceService: string, targetService: string, endpoint: string): boolean {
  const policy = SERVICE_POLICIES[sourceService];
  if (!policy) return false;

  if (!policy.allowedTargets.includes(targetService)) {
    auditLog.alert({
      event: 'unauthorized_service_call',
      source: sourceService,
      target: targetService,
      endpoint,
    });
    return false;
  }

  return true;
}
```

---

## 4. mTLS (Mutual TLS)

### What is mTLS?
```
Regular TLS:
  Client verifies server's certificate (one-way)
  Server doesn't verify client identity via certificate

Mutual TLS:
  Client verifies server's certificate (server is who it claims)
  Server verifies client's certificate (client is who it claims)
  Both sides authenticated at the transport layer

Use cases:
  - Service-to-service communication (microservices)
  - API authentication (client certificates instead of API keys)
  - IoT device authentication
  - Zero trust service mesh
```

### mTLS Implementation
```yaml
# Kubernetes: Istio service mesh with mTLS
# PeerAuthentication enforces mTLS for all services in namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT    # All traffic must be mTLS (PERMISSIVE for migration)

---
# AuthorizationPolicy: Only allow specific services to communicate
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: chat-service-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: chat-service
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/api-gateway"]
      to:
        - operation:
            methods: ["POST"]
            paths: ["/internal/chat/*"]
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/admin-service"]
      to:
        - operation:
            methods: ["GET"]
            paths: ["/internal/chat/stats"]
```

### Certificate Management for mTLS
```
Certificate lifecycle:
  1. Certificate Authority (CA) issues certificates to each service
  2. Certificates have short TTL (24 hours typical)
  3. Automatic rotation before expiry
  4. Revocation via CRL or OCSP

Options:
  - Istio: Built-in CA, automatic certificate rotation
  - SPIFFE/SPIRE: Standard for workload identity (see Section 5)
  - HashiCorp Vault: PKI secrets engine
  - cert-manager (Kubernetes): Automated certificate management

NEVER:
  - Use long-lived certificates (>90 days) for service identity
  - Share certificates between services
  - Store private keys in code or config files
  - Use self-signed certificates without a proper CA chain
```

---

## 5. SPIFFE/SPIRE — Workload Identity

### SPIFFE (Secure Production Identity Framework For Everyone)
```
SPIFFE provides cryptographic identities to workloads:
  - Each workload gets a unique SPIFFE ID:
    spiffe://stone-ai.net/service/chat-service
    spiffe://stone-ai.net/service/billing-service

  - Identity is attested, not configured:
    SPIRE agent verifies workload identity through:
    - Kubernetes service account
    - AWS IAM role
    - Process attributes (UID, GID, path)
    - Docker container ID

  - X.509 SVIDs (SPIFFE Verifiable Identity Documents):
    Short-lived certificates (1 hour default)
    Automatically rotated
    Used for mTLS between workloads

Benefits:
  - No secrets to manage (no API keys, passwords, or static certificates)
  - Cross-platform identity (works across Kubernetes, VMs, cloud providers)
  - Automatic rotation (no manual certificate renewal)
  - Attestation-based (identity tied to what the workload IS, not what it has)
```

### SPIRE Architecture
```
SPIRE Server (central authority):
  ├── Issues SVIDs to attested workloads
  ├── Manages registration entries
  ├── Stores CA keys
  └── Federates with other trust domains

SPIRE Agent (per node):
  ├── Attests node identity to SPIRE Server
  ├── Attests workload identity via selectors
  ├── Serves SVIDs to workloads via Workload API
  └── Handles certificate rotation

Flow:
  1. SPIRE Agent starts on node, attests to SPIRE Server
  2. Workload starts, calls SPIRE Agent's Workload API
  3. Agent verifies workload identity (K8s SA, process, etc.)
  4. Agent fetches SVID from Server
  5. Workload uses SVID for mTLS
  6. Agent auto-rotates SVID before expiry
```

### Registration and Configuration
```bash
# Register a workload identity
spire-server entry create \
  -spiffeID spiffe://stone-ai.net/service/chat-service \
  -parentID spiffe://stone-ai.net/node/k8s-node-1 \
  -selector k8s:ns:production \
  -selector k8s:sa:chat-service \
  -ttl 3600  # 1 hour

# Register with Kubernetes workload attestor
spire-server entry create \
  -spiffeID spiffe://stone-ai.net/service/api-gateway \
  -parentID spiffe://stone-ai.net/node/k8s-node-1 \
  -selector k8s:ns:production \
  -selector k8s:sa:api-gateway \
  -selector k8s:container-name:api-gateway

# Federation: Trust workloads from another domain
spire-server bundle set \
  -id spiffe://partner.example.com \
  -path partner-bundle.pem
```

---

## 6. Device Trust

### Device Trust Signals
```
For zero trust, the device's security posture matters as much as the user's identity.

Trust signals to collect:
  1. Device enrollment:    Is this a managed/registered device?
  2. Disk encryption:      Is FileVault/BitLocker enabled?
  3. OS version:           Is the OS up to date?
  4. Firewall:             Is the host firewall enabled?
  5. Screen lock:          Is auto-lock configured?
  6. Antivirus:            Is endpoint protection running?
  7. Jailbreak/root:       Is the device compromised?
  8. Certificate:          Does the device have a valid device certificate?
  9. Last check-in:        When was compliance last verified?
  10. Location:            Is the device in an expected geography?

Implementation options:
  - Microsoft Intune (Windows, macOS, iOS, Android)
  - Jamf (macOS, iOS)
  - Google Endpoint Verification (Chrome OS, Chrome browser)
  - Kolide (cross-platform, Slack-based)
  - CrowdStrike (EDR + device trust)
```

### Conditional Access Policy
```json
{
  "name": "Production Access — Full Trust Required",
  "conditions": {
    "user": {
      "authentication": "mfa_required",
      "groups": ["production-access"],
      "risk_level": "low"
    },
    "device": {
      "enrolled": true,
      "compliant": true,
      "requirements": {
        "disk_encryption": true,
        "firewall_enabled": true,
        "os_updated_within_days": 30,
        "screen_lock_max_minutes": 5,
        "endpoint_protection": "running"
      }
    },
    "context": {
      "allowed_countries": ["US"],
      "allowed_time": "06:00-22:00 EST",
      "impossible_travel": "block"
    }
  },
  "actions": {
    "grant": "allow_with_session_controls",
    "session": {
      "max_duration_hours": 8,
      "re_auth_on_sensitive_action": true,
      "continuous_access_evaluation": true
    }
  },
  "non_compliant_action": {
    "action": "block",
    "message": "Your device does not meet security requirements. Please ensure disk encryption is enabled and OS is updated.",
    "remediation_link": "https://wiki.stone-ai.net/device-compliance"
  }
}
```

---

## 7. Continuous Verification

### Beyond Point-in-Time Authentication
```
Traditional: Authenticate once → session valid for hours/days
Zero Trust:  Continuously evaluate trust throughout the session

Continuous signals:
  - Impossible travel: User in NYC at 10am, London at 10:30am → block
  - Device state change: Firewall disabled mid-session → re-authenticate
  - Risk score change: Unusual access pattern detected → step-up auth
  - Network change: Switched from trusted to untrusted network → re-evaluate
  - Behavior anomaly: Accessing resources never accessed before → challenge
```

### Implementation Pattern
```typescript
// continuous-verification.ts

interface TrustScore {
  user: number;      // 0-100
  device: number;    // 0-100
  context: number;   // 0-100
  overall: number;   // Weighted average
}

interface AccessDecision {
  allowed: boolean;
  requireMFA: boolean;
  requireJustification: boolean;
  sessionDuration: number;  // minutes
  monitoringLevel: 'standard' | 'enhanced' | 'forensic';
}

function calculateTrustScore(signals: TrustSignals): TrustScore {
  const user = calculateUserTrust(signals);     // MFA, risk score, behavior
  const device = calculateDeviceTrust(signals); // Compliance, certificate
  const context = calculateContextTrust(signals); // Location, time, network

  return {
    user,
    device,
    context,
    overall: user * 0.4 + device * 0.35 + context * 0.25,
  };
}

function makeAccessDecision(score: TrustScore, resourceSensitivity: 'low' | 'medium' | 'high' | 'critical'): AccessDecision {
  const thresholds = {
    low:      { allow: 30, mfa: 0,  justify: 0,  session: 480 },
    medium:   { allow: 50, mfa: 40, justify: 0,  session: 240 },
    high:     { allow: 70, mfa: 60, justify: 50, session: 60  },
    critical: { allow: 85, mfa: 75, justify: 70, session: 30  },
  };

  const threshold = thresholds[resourceSensitivity];

  return {
    allowed: score.overall >= threshold.allow,
    requireMFA: score.overall < threshold.mfa || score.user < 60,
    requireJustification: score.overall < threshold.justify,
    sessionDuration: threshold.session,
    monitoringLevel: score.overall < 50 ? 'forensic' :
                     score.overall < 70 ? 'enhanced' : 'standard',
  };
}

// Re-evaluate every N minutes based on sensitivity
async function continuousEvaluation(sessionId: string) {
  const session = await getSession(sessionId);
  const freshSignals = await collectTrustSignals(session.userId, session.deviceId);
  const newScore = calculateTrustScore(freshSignals);

  if (newScore.overall < session.minimumTrustScore) {
    await terminateSession(sessionId, 'trust_score_dropped');
    await notifyUser(session.userId, 'Your session was terminated due to a security policy change.');
  }

  if (newScore.device < 40) {
    await requireReAuthentication(sessionId, 'device_compliance_changed');
  }
}
```

---

## 8. Zero Trust Implementation Roadmap

### Phased Approach
```
Phase 1: IDENTITY FOUNDATION (Month 1-2)
  □ Centralized identity provider (Clerk/Entra ID/Okta)
  □ MFA enforced for all users
  □ SSO for all applications
  □ Strong password policies
  □ Session management (short-lived tokens)
  Maturity: Basic zero trust

Phase 2: DEVICE TRUST (Month 3-4)
  □ Device enrollment and management
  □ Device compliance checks (encryption, firewall, OS)
  □ Conditional access based on device state
  □ Device certificate distribution
  Maturity: Enhanced zero trust

Phase 3: NETWORK SEGMENTATION (Month 4-6)
  □ Micro-segmentation between services
  □ Service-to-service authentication (mTLS or JWT)
  □ Remove unnecessary network access
  □ VPC/subnet isolation by sensitivity
  □ Remove VPN dependency (replace with IAP)
  Maturity: Advanced zero trust

Phase 4: CONTINUOUS VERIFICATION (Month 6-9)
  □ Real-time trust scoring
  □ Behavioral analytics
  □ Anomaly detection
  □ Automated response to trust changes
  □ Session-level access controls
  Maturity: Full zero trust

Phase 5: DATA-CENTRIC SECURITY (Month 9-12)
  □ Data classification and labeling
  □ Access based on data sensitivity + trust score
  □ Encryption in transit AND at rest AND in use
  □ DLP (Data Loss Prevention) integration
  □ Audit trail for all data access
  Maturity: Mature zero trust
```

### Quick Wins (Start Today)
```
1. Enable MFA everywhere (biggest single improvement)
2. Implement BOLA checks on every API endpoint
3. Use short-lived tokens (15-60 min access tokens)
4. Network segment databases from public-facing services
5. Log ALL access attempts (authentication + authorization)
6. Require encrypted disks for all team devices
7. Remove standing admin access (use just-in-time elevation)
```

---

*This seed is maintained by the Security team. Last validated: 2026-03.*
