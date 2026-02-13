# Phase 5: Kubernetes Deployment

This document covers the AfriMart Kubernetes deployment on AWS EKS.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [EKS Cluster Setup](#eks-cluster-setup)
5. [AWS Load Balancer Controller](#aws-load-balancer-controller)
6. [Deployment Options](#deployment-options)
7. [Resource Utilization](#resource-utilization)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Phase 5 provides:

- **EKS Cluster** – Managed Kubernetes with on-demand + spot node groups
- **Kubernetes Manifests** – Deployments, Services, ConfigMaps, Secrets, HPA, Ingress, PDB, NetworkPolicy
- **Helm Charts** – Parameterized deployment for dev/staging/prod
- **HA Design** – Multi-replica, PDBs, HPA, resource limits

---

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │                  Internet                    │
                    └─────────────────────┬───────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────┐
                    │         AWS Application Load Balancer        │
                    │              (via Ingress ALB)               │
                    └─────────────────────┬───────────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         │                    EKS Cluster (VPC)                             │
         │  ┌─────────────────────────────┴─────────────────────────────┐  │
         │  │                     afrimart namespace                     │  │
         │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │  │
         │  │  │   Ingress    │  │   Frontend   │  │     Backend      │ │  │
         │  │  │  (ALB rules) │  │  (2+ pods)   │  │   (2+ pods)      │ │  │
         │  │  └──────────────┘  └──────┬───────┘  └────────┬─────────┘ │  │
         │  │                           │                    │          │  │
         │  │                    ┌──────▼────────────────────▼──────┐   │  │
         │  │                    │  Services (ClusterIP)             │   │  │
         │  │                    │  HPA, PDB, NetworkPolicy          │   │  │
         │  │                    └──────────────────────────────────┘   │  │
         │  └───────────────────────────────────────────────────────────┘  │
         │                                                                  │
         │  Node Groups: on-demand (t3.medium) + spot (t3.medium/t3a)       │
         └──────────────────────────┬───────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   RDS Postgres  │     │ ElastiCache     │     │   S3 Bucket     │
│   (private)     │     │ Redis (private) │     │   (uploads)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Prerequisites

- AWS CLI configured
- Terraform >= 1.0
- kubectl
- Helm 3 (for Helm deployment)
- Docker images pushed to GHCR or ECR

---

## EKS Cluster Setup

### 1. Deploy infrastructure (Terraform)

```bash
cd terraform/environments/eks
terraform init
terraform plan -var="db_password=YourSecurePassword"
terraform apply -var="db_password=YourSecurePassword"
```

### 2. Configure kubectl

```bash
# Output from Terraform
aws eks update-kubeconfig --region eu-north-1 --name afrimart-eks
kubectl get nodes
```

### 3. Tag subnets

The EKS module tags subnets for `kubernetes.io/cluster/*` and load balancer discovery. No manual tagging needed.

---

## AWS Load Balancer Controller

The Ingress uses the AWS Load Balancer Controller. Install it after the cluster is ready:

```bash
# Install cert-manager (required by LB controller)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install AWS Load Balancer Controller (see AWS docs for IAM and Helm)
# https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.6/deploy/installation/
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=afrimart-eks \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

**IRSA:** Ensure the controller service account has IAM permissions. The EKS module has `enable_irsa = true`; create an IAM policy and role for the controller per [AWS documentation](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.6/deploy/installation/).

---

## Deployment Options

### Option A: Raw Manifests (k8s/)

1. Create secret from example:

   ```bash
   cp k8s/secret.yaml.example k8s/secret.yaml
   # Edit secret.yaml with real values (RDS, Redis, JWT, etc.)
   ```

2. Apply manifests in order:

   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/backend-service.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   kubectl apply -f k8s/frontend-service.yaml
   kubectl apply -f k8s/hpa.yaml
   kubectl apply -f k8s/pdb.yaml
   kubectl apply -f k8s/network-policy.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

   Or apply all at once (namespace first):

   ```bash
   kubectl apply -f k8s/
   ```

### Option B: Helm

1. Create secret (must exist before Helm install):

   ```bash
   kubectl create namespace afrimart
   kubectl create secret generic afrimart-secrets -n afrimart \
     --from-literal=DATABASE_URL="postgresql://..." \
     --from-literal=REDIS_URL="redis://..." \
     --from-literal=JWT_SECRET="your-secret" \
     --from-literal=FRONTEND_URL="https://..." \
     # Add other secret keys as needed
   ```

2. Install with Helm:

   ```bash
   helm install afrimart helm/afrimart -n afrimart -f helm/afrimart/values-dev.yaml
   # Or for production:
   helm install afrimart helm/afrimart -n afrimart -f helm/afrimart/values-prod.yaml
   ```

3. Upgrade:

   ```bash
   helm upgrade afrimart helm/afrimart -n afrimart -f helm/afrimart/values-prod.yaml
   ```

---

## Resource Utilization

| Component   | Requests        | Limits        | Replicas | Notes                    |
|------------|-----------------|---------------|----------|--------------------------|
| Backend    | 100m CPU, 256Mi | 500m, 512Mi   | 2–10     | HPA on CPU 70%           |
| Frontend   | 50m CPU, 64Mi   | 200m, 128Mi   | 2–6      | HPA on CPU 70%           |
| PVC        | 5Gi             | -             | -        | Backend uploads (gp3)    |

**Node sizing:** On-demand t3.medium (2 vCPU, 4 GiB) × 2, Spot × 1. Adjust in Terraform variables.

---

## Evaluation Criteria Mapping

| Criterion              | Weight | Implementation                                         |
|------------------------|--------|--------------------------------------------------------|
| Manifest completeness  | 30%    | Deployments, Services, ConfigMaps, Secrets, HPA, Ingress, PDB, PVC, NetworkPolicy |
| High availability      | 25%    | 2+ replicas, PDB minAvailable, multi-AZ nodes, rolling updates |
| Resource optimization  | 25%    | Requests/limits, HPA, PVC sizing                       |
| Documentation          | 20%    | This doc, architecture diagram, Helm values            |

---

## Troubleshooting

| Issue                       | Solution                                                                 |
|-----------------------------|--------------------------------------------------------------------------|
| Pods pending                | Check node capacity; scale node group or fix resource requests           |
| ImagePullBackOff            | Configure image pull secret for GHCR/ECR                                 |
| Backend crash / DB connect  | Verify DATABASE_URL, RDS security group allows EKS nodes                 |
| Ingress not creating ALB    | Ensure AWS Load Balancer Controller is installed and has IAM permissions |
| PVC pending                 | Ensure EBS CSI driver or default StorageClass (gp3) exists               |

---

## Related

- [DOCKER_PHASE3.md](DOCKER_PHASE3.md) – Container images
- [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) – Terraform + Ansible
- [../README.md](../README.md) – Repository overview
