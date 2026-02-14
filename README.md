# AfriMart DevOps

End-to-end DevOps deployment for the AfriMart e-commerce platform on AWS. Infrastructure-as-Code, containerization, CI/CD, Kubernetes, monitoring, and security.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Phases](#phases)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Cost & Budget](#cost--budget)
- [License](#license)

---

## Overview

AfriMart DevOps implements a complete deployment pipeline:

| Layer | Technologies |
|-------|--------------|
| **Infrastructure** | Terraform (VPC, RDS, Redis, S3, ECR, EKS) |
| **Configuration** | Ansible (server setup, deployment) |
| **Containers** | Docker, ECR, docker-compose |
| **Orchestration** | Kubernetes (EKS) |
| **CI/CD** | Jenkins (build, test, security scan, deploy) |
| **Monitoring** | Prometheus, Grafana, Alertmanager |
| **Logging** | CloudWatch Logs (Fluent Bit) |
| **Security** | Trivy, tfsec, npm audit, RDS encryption |

**Region:** `eu-north-1` (Stockholm)

---

## Features

- Multi-stage Terraform (dev, EKS environments)
- High-availability design (HPA, PDB, multi-replica)
- Automated backups (RDS 7-day retention)
- Prometheus metrics + Grafana dashboards
- Slack alerting (critical/warning)
- CloudWatch Logs for container logs
- Security scanning (Trivy, tfsec, npm audit)
- Disaster recovery plan and runbooks

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS (eu-north-1)                             │
├─────────────────────────────────────────────────────────────────────┤
│  VPC                                                                 │
│  ├── Public Subnets  → ALB, NAT Gateway                              │
│  └── Private Subnets → EKS Nodes, RDS, ElastiCache Redis             │
│                                                                      │
│  EKS Cluster                                                         │
│  ├── Frontend (React)  ──┐                                           │
│  ├── Backend (Node.js) ──┼──► RDS PostgreSQL                         │
│  └── Monitoring         ──┼──► ElastiCache Redis                     │
│      (Prometheus, Grafana)│   S3 (uploads)                           │
└──────────────────────────┴──────────────────────────────────────────┘
```

**Full diagrams:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | [docs/KUBERNETES_PHASE5.md](docs/KUBERNETES_PHASE5.md)

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| AWS CLI | `aws configure` |
| Terraform >= 1.0 | Infrastructure |
| kubectl | Kubernetes (EKS) |
| Ansible | Config management (optional for EKS path) |
| Docker | Local dev, image build |

---

## Quick Start

### Option A: EC2 + Ansible (Dev)

```bash
# 1. Deploy infrastructure
cd terraform/environments/dev
terraform init
terraform apply -var='db_password=YourSecurePassword' -auto-approve -input=false

# 2. Deploy application
cd ../../ansible
source venv/bin/activate
# Edit inventory with EC2 public IP
ansible-playbook -i inventory/static.yml playbooks/site.yml
ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml

# 3. Access
# http://<EC2_PUBLIC_IP>/
```

### Option B: EKS (Production-style)

```bash
# 1. Deploy EKS cluster
cd terraform/environments/eks
terraform init
terraform apply -var="db_password=YourSecurePassword" -auto-approve -input=false

# 2. Configure kubectl
aws eks update-kubeconfig --region eu-north-1 --name afrimart-eks

# 3. Create secret and deploy
cp k8s/secret.yaml.example k8s/secret.yaml
# Edit k8s/secret.yaml with RDS, Redis, JWT_SECRET (from terraform output)
./scripts/k8s-apply.sh

# 4. Monitoring
./scripts/apply-monitoring.sh
kubectl port-forward svc/grafana 3000:3000 -n monitoring  # http://localhost:3000 (admin/admin)
```

---

## Repository Structure

```
afrimart-devops/
├── backend/              # Node.js API (Express, Sequelize)
├── frontend/             # React/Vite e-commerce UI
├── docker/               # docker-compose for local dev
├── k8s/                  # Kubernetes manifests
│   ├── *.yaml            # Deployments, Services, HPA, Ingress, etc.
│   ├── monitoring/       # Prometheus, Grafana, Alertmanager
│   └── logging/          # CloudWatch/Fluent Bit config
├── helm/                 # Helm charts (values-dev, values-prod)
├── terraform/
│   ├── backend/          # S3 + DynamoDB for state
│   ├── modules/          # VPC, RDS, Redis, S3, ECR, EKS
│   └── environments/     # dev, eks
├── ansible/              # Playbooks, roles, inventory
├── scripts/              # Deployment and utility scripts
└── docs/                 # Documentation
```

---

## Phases

### Phase 1: Infrastructure (Terraform)

- VPC, subnets, security groups
- RDS PostgreSQL, ElastiCache Redis
- S3, ECR, EKS (when using eks environment)

```bash
cd terraform/environments/dev   # or eks
terraform init
terraform apply -var='db_password=...' -auto-approve -input=false
```

📄 [docs/TERRAFORM_PHASE1.md](docs/TERRAFORM_PHASE1.md)

---

### Phase 3: Containerization

- Dockerfiles (multi-stage, Alpine)
- docker-compose for local development
- ECR repositories (Terraform)

```bash
cd docker && docker compose up -d
# Frontend: http://localhost:3001 | Backend: http://localhost:5001
```

📄 [docs/DOCKER_PHASE3.md](docs/DOCKER_PHASE3.md)

---

### Phase 4: CI/CD (Jenkins)

- Jenkinsfile: Checkout → Install Node → Test → Security Scan → Build → Deploy
- npm audit, Trivy image scan
- Manual approval before production

📄 [docs/CI_CD_PHASE4.md](docs/CI_CD_PHASE4.md) | [docs/JENKINS_PIPELINE_GUIDE.md](docs/JENKINS_PIPELINE_GUIDE.md)

---

### Phase 5: Kubernetes (EKS)

- Deployments, Services, HPA, PDB, NetworkPolicy
- Ingress (AWS Load Balancer Controller)
- Helm charts for dev/prod

```bash
./scripts/k8s-apply.sh
# Or: helm install afrimart helm/afrimart -n afrimart -f helm/afrimart/values-dev.yaml
```

📄 [docs/KUBERNETES_PHASE5.md](docs/KUBERNETES_PHASE5.md) | [docs/RESOURCE_UTILIZATION.md](docs/RESOURCE_UTILIZATION.md)

---

### Phase 6: Monitoring

- Prometheus (metrics)
- Grafana (dashboards: AfriMart Overview, Application, Infrastructure, DB, Redis, Business)
- Alertmanager (Slack)
- CloudWatch Logs (Fluent Bit)

```bash
./scripts/apply-monitoring.sh
kubectl port-forward svc/grafana 3000:3000 -n monitoring
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
```

📄 [docs/MONITORING_PHASE6.md](docs/MONITORING_PHASE6.md) | [docs/PROMETHEUS_MONITORING_GUIDELINE.md](docs/PROMETHEUS_MONITORING_GUIDELINE.md)

---

### Phase 7: Security & Compliance

- Secrets management (docs), TLS (ACM/cert-manager)
- Security scanning: Trivy, tfsec, npm audit
- RDS encryption, backup strategy
- Disaster recovery plan

```bash
./scripts/security-scan.sh
```

📄 [docs/SECURITY_PHASE7.md](docs/SECURITY_PHASE7.md) | [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) | [docs/DISASTER_RECOVERY.md](docs/DISASTER_RECOVERY.md)

---

## Scripts

| Script | Purpose |
|--------|---------|
| `./scripts/k8s-apply.sh` | Apply Kubernetes manifests |
| `./scripts/apply-monitoring.sh` | Deploy Prometheus, Grafana, Alertmanager |
| `./scripts/fix-backend-now.sh` | Fix backend secret (RDS/Redis URLs) |
| `./scripts/setup-exporters-secret.sh` | Create exporter credentials for DB/Redis metrics |
| `./scripts/setup-cloudwatch-logging.sh` | Deploy Fluent Bit for CloudWatch Logs |
| `./scripts/security-scan.sh` | Run Trivy, tfsec, npm audit |

---

## Documentation

> **Full index:** [docs/README.md](docs/README.md)

### By Phase

| Phase | Documents |
|-------|-----------|
| **1 – Infrastructure** | [TERRAFORM_PHASE1](docs/TERRAFORM_PHASE1.md), [ARCHITECTURE](docs/ARCHITECTURE.md), [COST_ESTIMATION](docs/COST_ESTIMATION.md) |
| **3 – Containers** | [DOCKER_PHASE3](docs/DOCKER_PHASE3.md), [IMAGE_SIZE_REPORT](docs/IMAGE_SIZE_REPORT.md) |
| **4 – CI/CD** | [CI_CD_PHASE4](docs/CI_CD_PHASE4.md), [JENKINS_PIPELINE_GUIDE](docs/JENKINS_PIPELINE_GUIDE.md), [JENKINS_SETUP](docs/JENKINS_SETUP.md) |
| **5 – Kubernetes** | [KUBERNETES_PHASE5](docs/KUBERNETES_PHASE5.md), [RESOURCE_UTILIZATION](docs/RESOURCE_UTILIZATION.md) |
| **6 – Monitoring** | [MONITORING_PHASE6](docs/MONITORING_PHASE6.md), [PROMETHEUS_MONITORING_GUIDELINE](docs/PROMETHEUS_MONITORING_GUIDELINE.md), [ALERTING](docs/ALERTING.md), [CLOUDWATCH_LOGGING](docs/CLOUDWATCH_LOGGING.md) |
| **7 – Security** | [SECURITY_PHASE7](docs/SECURITY_PHASE7.md), [SECURITY_ASSESSMENT_REPORT](docs/SECURITY_ASSESSMENT_REPORT.md), [BACKUP_RESTORE](docs/BACKUP_RESTORE.md), [DISASTER_RECOVERY](docs/DISASTER_RECOVERY.md), [COMPLIANCE_CHECKLIST](docs/COMPLIANCE_CHECKLIST.md) |

### Operations

| Document | Purpose |
|----------|---------|
| [RUNBOOK](docs/RUNBOOK.md) | Alert remediation (InstanceDown, AfriMartBackendDown, etc.) |
| [TROUBLESHOOTING](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [DEVOPS_GUIDE](docs/DEVOPS_GUIDE.md) | Terraform + Ansible deployment |

---

## Cost & Budget

- **Target:** ~$50/month (use Free Tier where possible)
- **Instance sizing:** t3.micro for EKS nodes, db.t3.micro for RDS
- **Cost controls:** Spot instances, HPA, resource limits, stop resources when idle
- **Details:** [docs/COST_ESTIMATION.md](docs/COST_ESTIMATION.md)

---

## Terraform Outputs (Example)

| Output | Description |
|--------|-------------|
| `vpc_id` | VPC ID |
| `db_endpoint` | RDS PostgreSQL (sensitive) |
| `redis_endpoint` | ElastiCache Redis |
| `bucket_name` | S3 bucket for uploads |
| `ecr_backend_url` | ECR backend repository URL |

---

## License

Private / Educational use.
