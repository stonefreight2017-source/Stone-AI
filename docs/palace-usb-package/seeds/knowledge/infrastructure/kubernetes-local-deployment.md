# Kubernetes Local Deployment — Palace Infrastructure Seed

## Chaos Directive: Local Kubernetes on the OMEN 45L

This seed covers deploying and managing Kubernetes locally on the OMEN 45L (RTX 5090 32GB, AMD Ryzen, 64GB DDR5, Win11 Pro, 4TB NVMe). The Palace runs AI inference workloads that demand GPU scheduling, persistent storage, and tight resource management. Local K8s gives us production-grade orchestration without cloud dependency — the foundation of sovereign infrastructure.

---

## 1. Choosing a Local Kubernetes Distribution

### 1.1 K3s — Lightweight Production-Grade

K3s is a CNCF-certified Kubernetes distribution built for resource-constrained environments. Despite being lightweight, it runs the full K8s API. For the OMEN, K3s is the primary recommendation because it wastes nothing.

**Installation on WSL2 (Kali):**

```bash
# Download and install K3s
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644

# Verify installation
sudo k3s kubectl get nodes

# Copy kubeconfig for external access
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config

# Set KUBECONFIG
export KUBECONFIG=~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
```

**K3s advantages for the Palace:**
- Single binary, ~70MB RAM overhead for the server
- Embedded SQLite (no etcd needed for single-node)
- Built-in Traefik ingress controller
- Built-in local storage provisioner
- Automatic TLS management for internal comms
- Starts in under 30 seconds

**K3s with GPU support:**

```bash
# Install NVIDIA container toolkit first
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Configure containerd for NVIDIA runtime
sudo nvidia-ctk runtime configure --runtime=containerd
sudo systemctl restart k3s
```

### 1.2 Minikube — Development and Testing

Minikube is better for quick experimentation. It supports multiple drivers (Docker, Hyper-V, WSL2) and has a simpler lifecycle.

```bash
# Install minikube on WSL2
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start with Docker driver and GPU passthrough
minikube start \
  --driver=docker \
  --container-runtime=containerd \
  --gpus=all \
  --cpus=8 \
  --memory=16384 \
  --disk-size=100g

# Enable addons
minikube addons enable metrics-server
minikube addons enable dashboard
minikube addons enable ingress
minikube addons enable storage-provisioner

# Access dashboard
minikube dashboard --url
```

**Minikube vs K3s decision matrix:**

| Factor | K3s | Minikube |
|--------|-----|----------|
| Production similarity | High | Medium |
| Resource overhead | Very low | Medium |
| GPU support | Native with toolkit | Via Docker passthrough |
| Multi-node | Yes (agents) | Yes (profiles) |
| Startup time | ~10s | ~60s |
| Built-in ingress | Traefik | Nginx (addon) |
| Persistence | Survives reboot | Requires explicit save |

**Palace recommendation:** K3s for all production-like workloads. Minikube only for isolated experiments that might break things.

### 1.3 Kind (Kubernetes in Docker) — CI Testing

Kind runs Kubernetes clusters inside Docker containers. Useful for CI pipelines and testing Helm charts.

```bash
# Install kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster with custom config
cat <<EOF | kind create cluster --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
- role: worker
EOF
```

---

## 2. Pod Management and Workload Scheduling

### 2.1 Pod Design Patterns for AI Workloads

**Sidecar pattern for model serving:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vllm-inference
  labels:
    app: vllm
    tier: inference
spec:
  containers:
  - name: vllm-server
    image: vllm/vllm-openai:latest
    args:
      - "--model"
      - "/models/qwen2.5-32b-awq"
      - "--quantization"
      - "awq"
      - "--gpu-memory-utilization"
      - "0.90"
      - "--max-model-len"
      - "32768"
      - "--tensor-parallel-size"
      - "1"
    ports:
    - containerPort: 8000
      name: api
    resources:
      limits:
        nvidia.com/gpu: 1
        memory: "48Gi"
        cpu: "8"
      requests:
        nvidia.com/gpu: 1
        memory: "32Gi"
        cpu: "4"
    volumeMounts:
    - name: model-storage
      mountPath: /models
    - name: shm
      mountPath: /dev/shm
    livenessProbe:
      httpGet:
        path: /health
        port: 8000
      initialDelaySeconds: 120
      periodSeconds: 30
    readinessProbe:
      httpGet:
        path: /health
        port: 8000
      initialDelaySeconds: 60
      periodSeconds: 10
  - name: metrics-exporter
    image: prom/node-exporter:latest
    ports:
    - containerPort: 9100
      name: metrics
    resources:
      limits:
        memory: "128Mi"
        cpu: "100m"
  volumes:
  - name: model-storage
    persistentVolumeClaim:
      claimName: model-pvc
  - name: shm
    emptyDir:
      medium: Memory
      sizeLimit: "16Gi"
  nodeSelector:
    gpu: "true"
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
    effect: NoSchedule
```

**Init container for model download:**

```yaml
initContainers:
- name: model-downloader
  image: python:3.11-slim
  command:
  - /bin/bash
  - -c
  - |
    pip install huggingface-hub
    python -c "
    from huggingface_hub import snapshot_download
    snapshot_download(
      'Qwen/Qwen2.5-32B-Instruct-AWQ',
      local_dir='/models/qwen2.5-32b-awq',
      local_dir_use_symlinks=False
    )
    "
  volumeMounts:
  - name: model-storage
    mountPath: /models
  resources:
    limits:
      memory: "4Gi"
      cpu: "2"
```

### 2.2 Deployments and ReplicaSets

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stone-ai-api
  namespace: stone-ai
  labels:
    app: stone-ai
    component: api
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: stone-ai
      component: api
  template:
    metadata:
      labels:
        app: stone-ai
        component: api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
    spec:
      containers:
      - name: nextjs
        image: stone-ai/web:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: stone-ai-secrets
              key: database-url
        - name: CLERK_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: stone-ai-secrets
              key: clerk-secret
        resources:
          limits:
            memory: "2Gi"
            cpu: "2"
          requests:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
      imagePullSecrets:
      - name: registry-creds
```

### 2.3 DaemonSets for Node-Level Services

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nvidia-device-plugin
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: nvidia-device-plugin
  template:
    metadata:
      labels:
        name: nvidia-device-plugin
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: nvidia-device-plugin
        image: nvcr.io/nvidia/k8s-device-plugin:v0.14.3
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop: ["ALL"]
        volumeMounts:
        - name: device-plugin
          mountPath: /var/lib/kubelet/device-plugins
      volumes:
      - name: device-plugin
        hostPath:
          path: /var/lib/kubelet/device-plugins
```

### 2.4 Jobs and CronJobs

```yaml
# Database backup CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
  namespace: stone-ai
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 7
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: 3
      activeDeadlineSeconds: 3600
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16
            command:
            - /bin/bash
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d_%H%M%S)
              pg_dump $DATABASE_URL | gzip > /backups/stone-ai-${TIMESTAMP}.sql.gz
              # Keep only last 30 days
              find /backups -name "*.sql.gz" -mtime +30 -delete
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: stone-ai-secrets
                  key: database-url
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          restartPolicy: OnFailure
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
```

---

## 3. Service Mesh and Networking

### 3.1 Kubernetes Services

```yaml
# ClusterIP for internal communication
apiVersion: v1
kind: Service
metadata:
  name: vllm-service
  namespace: stone-ai
spec:
  type: ClusterIP
  selector:
    app: vllm
  ports:
  - port: 8000
    targetPort: 8000
    name: api
  - port: 9100
    targetPort: 9100
    name: metrics

---
# NodePort for external access (development)
apiVersion: v1
kind: Service
metadata:
  name: stone-ai-web
  namespace: stone-ai
spec:
  type: NodePort
  selector:
    app: stone-ai
    component: api
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30080
    name: http

---
# LoadBalancer (for production or MetalLB)
apiVersion: v1
kind: Service
metadata:
  name: stone-ai-lb
  namespace: stone-ai
  annotations:
    metallb.universe.tf/address-pool: default
spec:
  type: LoadBalancer
  selector:
    app: stone-ai
    component: api
  ports:
  - port: 80
    targetPort: 3000
    name: http
  - port: 443
    targetPort: 3000
    name: https
```

### 3.2 MetalLB for Bare-Metal Load Balancing

```yaml
# MetalLB installation
# kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml

apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.240-192.168.1.250

---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: default
  namespace: metallb-system
```

### 3.3 Ingress Configuration

```yaml
# Traefik IngressRoute (K3s built-in)
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: stone-ai-ingress
  namespace: stone-ai
spec:
  entryPoints:
  - websecure
  routes:
  - match: Host(`stone-ai.local`)
    kind: Rule
    services:
    - name: stone-ai-web
      port: 3000
    middlewares:
    - name: rate-limit
    - name: compress
  - match: Host(`api.stone-ai.local`)
    kind: Rule
    services:
    - name: vllm-service
      port: 8000
  tls:
    certResolver: default

---
# Rate limiting middleware
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
  namespace: stone-ai
spec:
  rateLimit:
    average: 100
    burst: 200
    period: 1m

---
# Compression middleware
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: compress
  namespace: stone-ai
spec:
  compress:
    excludedContentTypes:
    - application/grpc
```

### 3.4 Network Policies

```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: stone-ai
spec:
  podSelector: {}
  policyTypes:
  - Ingress

---
# Allow web to API communication
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: stone-ai
spec:
  podSelector:
    matchLabels:
      component: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          component: web
    ports:
    - protocol: TCP
      port: 3000

---
# Allow API to vLLM
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-vllm
  namespace: stone-ai
spec:
  podSelector:
    matchLabels:
      app: vllm
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          component: api
    ports:
    - protocol: TCP
      port: 8000
```

### 3.5 Service Mesh with Linkerd

Linkerd is lighter than Istio and better suited for single-node or small-cluster deployments.

```bash
# Install Linkerd CLI
curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/install | sh
export PATH=$PATH:$HOME/.linkerd2/bin

# Pre-check
linkerd check --pre

# Install CRDs and control plane
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -

# Verify
linkerd check

# Inject sidecar into namespace
kubectl get deploy -n stone-ai -o yaml | linkerd inject - | kubectl apply -f -

# Install viz extension for dashboard
linkerd viz install | kubectl apply -f -
linkerd viz dashboard &
```

**Linkerd service profiles for traffic shaping:**

```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: vllm-service.stone-ai.svc.cluster.local
  namespace: stone-ai
spec:
  routes:
  - name: POST /v1/completions
    condition:
      method: POST
      pathRegex: /v1/completions
    timeout: 120s
    isRetryable: false
  - name: GET /health
    condition:
      method: GET
      pathRegex: /health
    timeout: 5s
    isRetryable: true
  retryBudget:
    retryRatio: 0.2
    minRetriesPerSecond: 10
    ttl: 10s
```

---

## 4. GPU Scheduling in Kubernetes

### 4.1 NVIDIA GPU Operator

The GPU Operator automates the management of all NVIDIA software components needed for GPU provisioning.

```bash
# Add NVIDIA Helm repo
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

# Install GPU Operator
helm install --wait --generate-name \
  -n gpu-operator --create-namespace \
  nvidia/gpu-operator \
  --set driver.enabled=false \
  --set toolkit.enabled=true \
  --set devicePlugin.enabled=true \
  --set migManager.enabled=false \
  --set mps.enabled=false
```

### 4.2 GPU Resource Requests

```yaml
# Single GPU pod
resources:
  limits:
    nvidia.com/gpu: 1  # Request 1 GPU (entire RTX 5090)

# Fractional GPU with time-slicing
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: gpu-operator
data:
  any: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        renameByDefault: false
        failRequestsGreaterThanOne: false
        resources:
        - name: nvidia.com/gpu
          replicas: 4  # Split 1 GPU into 4 virtual GPUs
```

### 4.3 GPU Priority and Preemption

```yaml
# High priority for inference
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: gpu-inference-critical
value: 1000000
globalDefault: false
description: "Priority class for production inference workloads"

---
# Lower priority for batch/training
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: gpu-batch
value: 100000
globalDefault: false
preemptionPolicy: PreemptLowerPriority
description: "Priority class for batch GPU workloads"
```

### 4.4 GPU Monitoring in Kubernetes

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: dcgm-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: dcgm-exporter
  template:
    metadata:
      labels:
        app: dcgm-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9400"
    spec:
      containers:
      - name: dcgm-exporter
        image: nvcr.io/nvidia/k8s/dcgm-exporter:3.3.0-3.2.0-ubuntu22.04
        ports:
        - containerPort: 9400
          name: metrics
        securityContext:
          runAsNonRoot: false
          runAsUser: 0
        env:
        - name: DCGM_EXPORTER_KUBERNETES
          value: "true"
        volumeMounts:
        - name: pod-gpu-resources
          mountPath: /var/lib/kubelet/pod-resources
          readOnly: true
      volumes:
      - name: pod-gpu-resources
        hostPath:
          path: /var/lib/kubelet/pod-resources
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
```

---

## 5. Persistent Volumes

### 5.1 Local Storage for Model Files

```yaml
# StorageClass for local NVMe
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-nvme
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain

---
# PersistentVolume pointing to NVMe
apiVersion: v1
kind: PersistentVolume
metadata:
  name: model-storage-pv
  labels:
    type: local
    purpose: models
spec:
  capacity:
    storage: 500Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-nvme
  local:
    path: /mnt/nvme/models
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - omen-45l

---
# PVC for model storage
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-pvc
  namespace: stone-ai
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: local-nvme
  resources:
    requests:
      storage: 500Gi
  selector:
    matchLabels:
      purpose: models
```

### 5.2 Dynamic Provisioning with Longhorn

```bash
# Install Longhorn for distributed storage
helm repo add longhorn https://charts.longhorn.io
helm repo update
helm install longhorn longhorn/longhorn \
  --namespace longhorn-system \
  --create-namespace \
  --set defaultSettings.defaultDataPath="/mnt/nvme/longhorn" \
  --set defaultSettings.defaultReplicaCount=1  # Single node
```

```yaml
# Longhorn StorageClass
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-fast
provisioner: driver.longhorn.io
allowVolumeExpansion: true
parameters:
  numberOfReplicas: "1"
  staleReplicaTimeout: "2880"
  fsType: "ext4"
  diskSelector: "nvme"
  nodeSelector: "storage"
```

### 5.3 Volume Snapshots

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: model-snapshot-20260309
  namespace: stone-ai
spec:
  volumeSnapshotClassName: longhorn-snapshot
  source:
    persistentVolumeClaimName: model-pvc

---
# Restore from snapshot
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-pvc-restored
  namespace: stone-ai
spec:
  dataSource:
    name: model-snapshot-20260309
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 500Gi
  storageClassName: longhorn-fast
```

---

## 6. Helm Charts

### 6.1 Creating a Stone AI Helm Chart

```bash
# Create chart structure
helm create stone-ai
cd stone-ai
```

**Chart.yaml:**

```yaml
apiVersion: v2
name: stone-ai
description: Stone AI Platform - Local Kubernetes Deployment
type: application
version: 1.0.0
appVersion: "1.0.0"
dependencies:
- name: postgresql
  version: "13.2.24"
  repository: "https://charts.bitnami.com/bitnami"
  condition: postgresql.enabled
- name: redis
  version: "18.6.1"
  repository: "https://charts.bitnami.com/bitnami"
  condition: redis.enabled
```

**values.yaml:**

```yaml
global:
  namespace: stone-ai
  domain: stone-ai.local

web:
  replicaCount: 2
  image:
    repository: stone-ai/web
    tag: latest
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: "2"
      memory: "2Gi"
    requests:
      cpu: "500m"
      memory: "512Mi"
  service:
    type: ClusterIP
    port: 3000
  ingress:
    enabled: true
    hosts:
    - host: stone-ai.local
      paths:
      - path: /
        pathType: Prefix

vllm:
  enabled: true
  replicaCount: 1
  image:
    repository: vllm/vllm-openai
    tag: latest
  model: "/models/qwen2.5-32b-awq"
  quantization: "awq"
  gpuMemoryUtilization: "0.90"
  maxModelLen: 32768
  resources:
    limits:
      nvidia.com/gpu: 1
      cpu: "8"
      memory: "48Gi"
    requests:
      nvidia.com/gpu: 1
      cpu: "4"
      memory: "32Gi"
  persistence:
    enabled: true
    storageClass: local-nvme
    size: 500Gi

postgresql:
  enabled: true
  auth:
    postgresPassword: ""
    existingSecret: stone-ai-secrets
  primary:
    persistence:
      storageClass: longhorn-fast
      size: 50Gi
    resources:
      limits:
        cpu: "4"
        memory: "8Gi"

redis:
  enabled: true
  auth:
    enabled: false
  master:
    persistence:
      storageClass: longhorn-fast
      size: 10Gi

monitoring:
  enabled: true
  prometheus:
    retention: 30d
  grafana:
    adminPassword: ""
    existingSecret: stone-ai-secrets
```

### 6.2 Helm Deployment Commands

```bash
# Install chart
helm install stone-ai ./stone-ai \
  --namespace stone-ai \
  --create-namespace \
  --values values-local.yaml

# Upgrade with new values
helm upgrade stone-ai ./stone-ai \
  --namespace stone-ai \
  --values values-local.yaml \
  --set web.image.tag=v1.2.0

# Rollback
helm rollback stone-ai 1

# Template rendering (dry run)
helm template stone-ai ./stone-ai --values values-local.yaml

# List releases
helm list -n stone-ai

# Show history
helm history stone-ai -n stone-ai
```

### 6.3 Helmfile for Multi-Chart Management

```yaml
# helmfile.yaml
repositories:
- name: bitnami
  url: https://charts.bitnami.com/bitnami
- name: prometheus-community
  url: https://prometheus-community.github.io/helm-charts
- name: grafana
  url: https://grafana.github.io/helm-charts

releases:
- name: stone-ai
  namespace: stone-ai
  chart: ./charts/stone-ai
  values:
  - values/common.yaml
  - values/{{ .Environment.Name }}.yaml

- name: monitoring
  namespace: monitoring
  chart: prometheus-community/kube-prometheus-stack
  values:
  - values/monitoring.yaml

- name: loki
  namespace: monitoring
  chart: grafana/loki-stack
  values:
  - values/loki.yaml

environments:
  local:
    values:
    - gpu.enabled: true
    - web.replicaCount: 1
  staging:
    values:
    - gpu.enabled: false
    - web.replicaCount: 2
```

---

## 7. Namespace Organization

```yaml
# Core namespaces for the Palace
apiVersion: v1
kind: Namespace
metadata:
  name: stone-ai
  labels:
    purpose: application
    env: production

---
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    purpose: observability

---
apiVersion: v1
kind: Namespace
metadata:
  name: inference
  labels:
    purpose: ai-inference
    gpu: required

---
# Resource quotas per namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: inference-quota
  namespace: inference
spec:
  hard:
    requests.cpu: "16"
    requests.memory: "48Gi"
    limits.cpu: "16"
    limits.memory: "64Gi"
    requests.nvidia.com/gpu: "1"
    limits.nvidia.com/gpu: "1"
    pods: "10"
    persistentvolumeclaims: "5"

---
# LimitRange for defaults
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: stone-ai
spec:
  limits:
  - default:
      cpu: "1"
      memory: "1Gi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container
```

---

## 8. Secrets Management

### 8.1 Kubernetes Secrets

```bash
# Create secret from literals
kubectl create secret generic stone-ai-secrets \
  --namespace stone-ai \
  --from-literal=database-url='postgresql://...' \
  --from-literal=clerk-secret='sk_test_...' \
  --from-literal=stripe-secret='sk_test_...' \
  --from-literal=anthropic-key='sk-ant-...'

# Create secret from file
kubectl create secret generic tls-certs \
  --namespace stone-ai \
  --from-file=tls.crt=./certs/server.crt \
  --from-file=tls.key=./certs/server.key
```

### 8.2 Sealed Secrets for Git Storage

```bash
# Install sealed-secrets controller
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system

# Install kubeseal CLI
brew install kubeseal  # or download binary

# Seal a secret
kubectl create secret generic stone-ai-secrets \
  --namespace stone-ai \
  --from-literal=database-url='postgresql://...' \
  --dry-run=client -o yaml | \
  kubeseal --format yaml > sealed-secrets.yaml

# Apply sealed secret (safe to commit to git)
kubectl apply -f sealed-secrets.yaml
```

---

## 9. Monitoring and Troubleshooting

### 9.1 Essential kubectl Commands

```bash
# Cluster overview
kubectl cluster-info
kubectl get nodes -o wide
kubectl top nodes
kubectl top pods -n stone-ai

# Pod debugging
kubectl describe pod <pod-name> -n stone-ai
kubectl logs <pod-name> -n stone-ai --tail=100 -f
kubectl logs <pod-name> -n stone-ai -c <container-name>  # specific container
kubectl exec -it <pod-name> -n stone-ai -- /bin/bash

# Events (sorted by time)
kubectl get events -n stone-ai --sort-by='.lastTimestamp'

# Resource usage
kubectl describe resourcequota -n stone-ai
kubectl get pv,pvc -n stone-ai

# GPU status
kubectl describe node | grep -A 10 "Allocated resources"
kubectl get pods -n stone-ai -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].resources.limits}{"\n"}{end}'
```

### 9.2 Prometheus ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: stone-ai-monitor
  namespace: monitoring
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: stone-ai
  namespaceSelector:
    matchNames:
    - stone-ai
  endpoints:
  - port: metrics
    interval: 15s
    path: /metrics
```

### 9.3 Alerting Rules

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: stone-ai-alerts
  namespace: monitoring
spec:
  groups:
  - name: stone-ai
    rules:
    - alert: HighGPUMemoryUsage
      expr: DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_TOTAL > 0.95
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "GPU memory usage above 95%"
    - alert: vLLMDown
      expr: up{job="vllm"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "vLLM inference server is down"
    - alert: PodCrashLooping
      expr: increase(kube_pod_container_status_restarts_total{namespace="stone-ai"}[1h]) > 3
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
```

---

## 10. Production Hardening Checklist

### 10.1 Security

- [ ] RBAC configured — no cluster-admin for workloads
- [ ] Pod Security Standards enforced (restricted profile)
- [ ] Network policies deny all by default
- [ ] Secrets encrypted at rest (EncryptionConfiguration)
- [ ] Container images scanned and signed
- [ ] No privileged containers except GPU device plugin
- [ ] Service accounts have minimal permissions
- [ ] API server audit logging enabled

### 10.2 Reliability

- [ ] Resource requests and limits on all containers
- [ ] Liveness and readiness probes on all containers
- [ ] PodDisruptionBudgets for critical workloads
- [ ] Anti-affinity rules to spread replicas
- [ ] Graceful shutdown handlers (preStop hooks)
- [ ] Persistent volumes for stateful data
- [ ] Backup CronJobs verified and tested

### 10.3 Observability

- [ ] Metrics collection (Prometheus)
- [ ] GPU metrics (DCGM exporter)
- [ ] Log aggregation (Loki)
- [ ] Dashboards (Grafana)
- [ ] Alerting rules for critical conditions
- [ ] Distributed tracing (optional: Jaeger/Tempo)

### 10.4 Operational

- [ ] Helm charts versioned in git
- [ ] Sealed secrets for secret management
- [ ] Resource quotas per namespace
- [ ] Limit ranges for default constraints
- [ ] Regular etcd/state backups
- [ ] Documented runbooks for common failures
- [ ] Upgrade strategy documented and tested

---

## 11. OMEN-Specific Configuration Notes

**Resource allocation strategy for 64GB DDR5 + RTX 5090 32GB VRAM:**

| Workload | CPU | RAM | GPU VRAM |
|----------|-----|-----|----------|
| K3s server | 2 cores | 2GB | - |
| vLLM (Qwen 32B AWQ) | 8 cores | 32GB | 28GB |
| PostgreSQL | 4 cores | 8GB | - |
| Redis | 1 core | 2GB | - |
| Next.js (2 replicas) | 4 cores | 4GB | - |
| Monitoring stack | 2 cores | 4GB | - |
| System/WSL2 | 4 cores | 8GB | - |
| **Headroom** | **~4 cores** | **~4GB** | **~4GB** |

**WSL2 memory limit (.wslconfig):**

```ini
[wsl2]
memory=56GB
processors=24
swap=8GB
localhostForwarding=true
nestedVirtualization=true

[experimental]
sparseVhd=true
autoMemoryReclaim=gradual
```

**Key considerations:**
- Single GPU means no tensor parallelism across GPUs — use time-slicing for multi-tenant
- 4TB NVMe provides ample space for model storage, but plan partitioning early
- WSL2 networking requires port forwarding for external access to K3s services
- Docker Desktop conflicts with K3s in WSL2 — use containerd directly

---

*Chaos Infrastructure Seed — Batch 14. The Palace runs its own cluster. No cloud required.*
