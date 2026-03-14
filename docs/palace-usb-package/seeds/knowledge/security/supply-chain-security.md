# Supply Chain Security
# Seed: SEC-2 | Category: Cybersecurity | Topic: Software Supply Chain
# RAG Tags: dependency-audit, sbom, container-scanning, trivy, grype, signed-commits, lockfile, dependabot, renovate

---

## Purpose
Securing the software supply chain from dependency vulnerabilities to container images.
Covers auditing tools, SBOM generation, container scanning, signed commits, artifact
verification, and automated dependency management. Every agent that touches deployments
or dependencies must understand these patterns.

---

## 1. The Supply Chain Attack Surface

### Attack Vectors
```
1. DEPENDENCY CONFUSION / SUBSTITUTION
   Attacker publishes malicious package with same name as internal package
   to public npm/PyPI registry. Package manager installs public version.

   Real incidents:
   - Alex Birsan (2021): Hit Apple, Microsoft, PayPal via dependency confusion
   - ua-parser-js (2021): Maintainer account compromised, crypto miner injected
   - event-stream (2018): Social engineering → new maintainer → backdoor

2. TYPOSQUATTING
   Attacker publishes packages with names similar to popular ones:
   - "lodassh" instead of "lodash"
   - "cross-env" was legitimate; "crossenv" was malicious

3. MAINTAINER COMPROMISE
   Attacker gains control of legitimate maintainer's account.
   Publishes malicious version through normal channels.

4. BUILD SYSTEM COMPROMISE
   Attacker compromises CI/CD pipeline or build tools.
   SolarWinds (2020): Build system injected backdoor into legitimate updates.

5. CONTAINER IMAGE POISONING
   Base images with vulnerabilities or backdoors.
   Typosquatting on Docker Hub (e.g., "ngnix" instead of "nginx").

6. LOCKFILE MANIPULATION
   Attacker modifies lockfile to point to different (malicious) package versions.
   Often overlooked in code review because lockfiles are "auto-generated."
```

---

## 2. Dependency Auditing

### npm Ecosystem
```bash
# Built-in audit
npm audit
npm audit --production    # Only check production dependencies (skip devDeps)
npm audit fix             # Auto-fix compatible patches
npm audit fix --force     # Fix with major version bumps (REVIEW CHANGES)

# Better alternative: npm audit signatures (verifies registry signatures)
npm audit signatures      # Verify packages were published by expected maintainers

# Socket.dev — detects supply chain attacks npm audit misses
npx socket scan            # Detects: install scripts, network access, env access, etc.
```

### Python Ecosystem
```bash
# pip-audit (from Google's OSTD team)
pip-audit                          # Audit current environment
pip-audit -r requirements.txt      # Audit requirements file
pip-audit --fix                    # Auto-fix vulnerabilities

# Safety (by SafetyCLI)
safety check --file requirements.txt
safety check --full-report

# Best practice: Use pip-compile (pip-tools) for deterministic builds
pip-compile requirements.in        # Generates requirements.txt with pinned versions
pip-compile --generate-hashes      # Add hashes for verification
```

### Rust Ecosystem
```bash
# cargo-audit
cargo install cargo-audit
cargo audit                        # Check for known vulnerabilities
cargo audit fix                    # Auto-fix (when possible)

# cargo-deny — policy enforcement
cargo install cargo-deny
cargo deny check advisories        # Check for advisories
cargo deny check licenses          # Check license compliance
cargo deny check bans              # Check for banned dependencies
cargo deny check sources           # Verify sources
```

### Universal Tools
```bash
# OSV-Scanner (Google) — multi-ecosystem vulnerability scanner
osv-scanner --lockfile=package-lock.json
osv-scanner --lockfile=requirements.txt
osv-scanner --lockfile=Cargo.lock
osv-scanner -r .                   # Scan entire directory recursively

# Snyk — commercial but free tier available
snyk test                          # Test for vulnerabilities
snyk monitor                       # Continuous monitoring
snyk container test node:20-alpine # Container image scanning
```

---

## 3. SBOM (Software Bill of Materials)

### What is an SBOM?
```
An SBOM is a complete, structured inventory of all components in your software:
  - Direct dependencies
  - Transitive dependencies (dependencies of dependencies)
  - Versions
  - Licenses
  - Source locations
  - Known vulnerabilities

Why it matters:
  - Log4Shell (2021): Organizations spent weeks figuring out if they used Log4j
  - With SBOM: Query SBOM database, get answer in seconds
  - US Executive Order 14028 (2021): Requires SBOMs for software sold to government
  - EU Cyber Resilience Act: Requires SBOMs for all software sold in EU
```

### SBOM Formats
```
SPDX (ISO/IEC 5962:2021):
  - Linux Foundation standard
  - ISO-recognized
  - Formats: JSON, YAML, RDF, tag-value
  - Best for: Compliance, licensing analysis

CycloneDX (OWASP):
  - OWASP standard
  - More security-focused
  - Formats: JSON, XML, Protocol Buffers
  - Best for: Security analysis, vulnerability tracking
  - Supports: VEX (Vulnerability Exploitability eXchange)

RECOMMENDATION: CycloneDX for security teams, SPDX for compliance/legal
```

### Generating SBOMs
```bash
# CycloneDX — npm
npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json

# CycloneDX — Python
pip install cyclonedx-bom
cyclonedx-py environment --output-format json -o sbom.json

# Syft (Anchore) — Universal SBOM generator
# Supports: npm, pip, Go, Rust, Java, Ruby, .NET, container images
syft packages dir:. -o cyclonedx-json > sbom.json
syft packages node:20-alpine -o spdx-json > sbom.json    # Container image

# Trivy (Aqua) — Also generates SBOMs
trivy fs --format cyclonedx --output sbom.json .
trivy image --format cyclonedx --output sbom.json stone-ai:latest
```

### SBOM in CI/CD
```yaml
# GitHub Actions workflow for SBOM generation
name: SBOM Generation
on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom.cyclonedx.json
          artifact-name: sbom

      - name: Scan SBOM for vulnerabilities
        uses: anchore/scan-action@v4
        with:
          sbom: sbom.cyclonedx.json
          fail-build: true
          severity-cutoff: high

      - name: Upload SBOM to release
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v1
        with:
          files: sbom.cyclonedx.json
```

---

## 4. Container Image Scanning

### Trivy (Recommended)
```bash
# Scan container image for vulnerabilities
trivy image stone-ai:latest

# Scan with severity filter
trivy image --severity HIGH,CRITICAL stone-ai:latest

# Scan and fail if vulnerabilities found (CI/CD gating)
trivy image --exit-code 1 --severity CRITICAL stone-ai:latest

# Scan filesystem (source code + dependencies)
trivy fs --severity HIGH,CRITICAL .

# Scan IaC files (Terraform, CloudFormation, Dockerfile)
trivy config .

# Scan for secrets (API keys, passwords in code)
trivy fs --scanners secret .

# Comprehensive scan
trivy image \
  --severity HIGH,CRITICAL \
  --ignore-unfixed \          # Only show fixable vulnerabilities
  --format json \
  --output trivy-report.json \
  stone-ai:latest
```

### Grype (Alternative)
```bash
# Install
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh

# Scan image
grype stone-ai:latest

# Scan with fail threshold
grype stone-ai:latest --fail-on high

# Scan SBOM
grype sbom:sbom.cyclonedx.json
```

### Container Security Best Practices
```dockerfile
# Secure Dockerfile patterns

# 1. Use specific image tags, NEVER :latest in production
FROM node:20.11.1-alpine3.19 AS builder

# 2. Run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# 3. Copy only necessary files (use .dockerignore too)
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --ignore-scripts  # --ignore-scripts prevents postinstall attacks

# 4. Multi-stage build — production image has no build tools
FROM node:20.11.1-alpine3.19 AS production
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# 5. Read-only filesystem where possible
USER appuser
RUN chmod -R 555 /app

# 6. No shell in production image (prevents RCE escalation)
# For distroless: FROM gcr.io/distroless/nodejs20-debian12

# 7. Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost:8080/health || exit 1

# 8. Don't store secrets in image layers
# Use runtime secrets (env vars, mounted secrets, vault)
```

### Image Signing and Verification
```bash
# Cosign (Sigstore) — Sign and verify container images

# Generate key pair (one-time)
cosign generate-key-pair

# Sign image after build
cosign sign --key cosign.key ghcr.io/stone-ai/api:v1.0.0

# Verify image before deployment
cosign verify --key cosign.pub ghcr.io/stone-ai/api:v1.0.0

# Keyless signing (recommended — uses OIDC identity)
cosign sign ghcr.io/stone-ai/api:v1.0.0  # Signs with GitHub Actions OIDC token

# Verify keyless signature
cosign verify \
  --certificate-identity=https://github.com/stone-ai/.github/workflows/build.yml@refs/heads/main \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  ghcr.io/stone-ai/api:v1.0.0

# Enforce verification in Kubernetes
# Use Kyverno or OPA Gatekeeper to reject unsigned images
```

---

## 5. Signed Commits

### Git Commit Signing
```bash
# GPG key setup
gpg --full-generate-key   # RSA 4096, no expiry for code signing
gpg --list-secret-keys --keyid-format LONG

# Configure Git
git config --global user.signingkey ABC123DEF456
git config --global commit.gpgsign true    # Sign all commits by default
git config --global tag.gpgsign true       # Sign all tags

# GitHub: Add GPG public key to profile → Settings → SSH and GPG keys
gpg --armor --export ABC123DEF456 | clip    # Copy public key

# Verify a commit
git log --show-signature -1

# GitHub branch protection: Require signed commits
# Settings → Branches → Branch protection → Require signed commits
```

### SSH Signing (Simpler Alternative)
```bash
# Use existing SSH key for commit signing (GitHub supports this since 2022)
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true

# GitHub: Add SSH key as "Signing Key" (not just "Authentication Key")
```

---

## 6. Lockfile Integrity

### Lockfile Security
```
Lockfile attacks:
  1. Attacker modifies package-lock.json in a PR
  2. Changes a dependency's resolved URL or integrity hash
  3. Points to malicious package version
  4. Code reviewer skips lockfile review (it's "auto-generated")

Defenses:
  1. NEVER manually edit lockfiles
  2. Review lockfile changes in PRs (tools can help)
  3. Use --frozen-lockfile / --ci in CI/CD:
     npm ci                  # Installs exactly what's in lockfile
     yarn install --frozen-lockfile
     pnpm install --frozen-lockfile
  4. Verify integrity hashes match

  5. Use lockfile-lint to validate lockfile:
     npx lockfile-lint --path package-lock.json \
       --type npm \
       --allowed-hosts npm \
       --validate-https \
       --validate-integrity
```

---

## 7. Automated Dependency Management

### Dependabot Configuration
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    open-pull-requests-limit: 10
    reviewers:
      - "stone-ai-security"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "deps"
      include: "scope"
    # Group minor/patch updates to reduce PR noise
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
    # Security updates are always created regardless of schedule
    security-updates:
      enabled: true

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Renovate (More Flexible Alternative)
```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    "security:openssf-scorecard",
    ":dependencyDashboard"
  ],
  "timezone": "America/New_York",
  "schedule": ["before 9am on Monday"],
  "prHourlyLimit": 5,
  "prConcurrentLimit": 10,
  "labels": ["dependencies"],
  "packageRules": [
    {
      "description": "Auto-merge patch updates for trusted packages",
      "matchUpdateTypes": ["patch"],
      "matchPackageNames": ["zod", "pino", "next"],
      "automerge": true,
      "automergeType": "pr",
      "platformAutomerge": true
    },
    {
      "description": "Group all non-major Prisma updates",
      "matchPackagePatterns": ["^@prisma/", "^prisma$"],
      "matchUpdateTypes": ["minor", "patch"],
      "groupName": "prisma"
    },
    {
      "description": "Require manual review for major updates",
      "matchUpdateTypes": ["major"],
      "labels": ["major-update", "needs-review"],
      "automerge": false
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "schedule": ["at any time"]
  }
}
```

---

## 8. CI/CD Security Pipeline

### Supply Chain Security in CI/CD
```yaml
# .github/workflows/security.yml
name: Supply Chain Security
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: npm audit
        run: npm audit --production --audit-level=high

      - name: Lockfile lint
        run: npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https

  container-scan:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t stone-ai:${{ github.sha }} .

      - name: Trivy vulnerability scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: stone-ai:${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH
          exit-code: 1

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif

  sbom-generation:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom.json

      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.json

  secret-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0    # Full history for secret scanning

      - name: Gitleaks scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 9. Supply Chain Security Checklist

```
DAILY (automated):
  □ npm audit / pip-audit running in CI
  □ Container images scanned before deployment
  □ Secret scanning on all commits

WEEKLY:
  □ Review Dependabot/Renovate PRs
  □ Check for new CVEs in critical dependencies
  □ Verify lockfile integrity

MONTHLY:
  □ Generate and review SBOM
  □ Review dependency tree for unnecessary packages
  □ Check OpenSSF Scorecard for critical dependencies
  □ Audit CI/CD pipeline permissions

QUARTERLY:
  □ Full dependency cleanup (remove unused)
  □ Review and update allowed-sources policies
  □ Test incident response for supply chain compromise
  □ Review image signing and verification policies
```

---

*This seed is maintained by the Security team. Last validated: 2026-03.*
