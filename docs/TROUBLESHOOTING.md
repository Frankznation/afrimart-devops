# AfriMart Troubleshooting Guide

Consolidated guide for common issues and fixes across infrastructure, CI/CD, Kubernetes, monitoring, and security.

---

## Table of Contents

1. [Infrastructure (Terraform)](#1-infrastructure-terraform)
2. [CI/CD (Jenkins)](#2-cicd-jenkins)
3. [Docker & Containers](#3-docker--containers)
4. [Kubernetes / EKS](#4-kubernetes--eks)
5. [Monitoring & Grafana](#5-monitoring--grafana)
6. [Application & Backend](#6-application--backend)
7. [CloudWatch & Logging](#7-cloudwatch--logging)
8. [Quick Reference Commands](#8-quick-reference-commands)

---

## 1. Infrastructure (Terraform)

| Issue | Solution |
|-------|----------|
| **Error acquiring the state lock** | Another process has the lock. Wait or `terraform force-unlock <LOCK_ID>` |
| **Terraform hangs / stagnant** | Check `aws sts get-caller-identity`; verify AWS credentials and network |
| **db_password contains `!` fails** | Use single quotes: `terraform apply -var='db_password=Pass123!'` |
| **State file not found** | Configure S3 backend in `backend.tf`; run `terraform init -reconfigure` |
| **Module not found** | Run `terraform init` in the correct directory (e.g. `terraform/environments/eks`) |
| **RDS/Redis connection refused from EKS** | Verify security group allows EKS node SG on 5432/6379 |

---

## 2. CI/CD (Jenkins)

| Issue | Solution |
|-------|----------|
| **node: command not found** | Ensure "Install Node.js" stage completes; Node is in `$WORKSPACE/node/bin` |
| **tar: xz: Cannot exec** | Pipeline uses `.tar.gz`; ensure agent has `tar` and `gzip` |
| **Tool type 'nodejs' does not have an install** | NodeJS plugin not required; pipeline installs Node inline |
| **Invalid agent type 'docker' specified** | Use `agent any`; Docker plugin not required |
| **Push to ECR: aws/docker not found** | Install AWS CLI and Docker on the Jenkins agent |
| **Slack notifications not received** | Add `slack-webhook` credential (Secret text) with webhook URL |
| **AmazonWebServicesCredentialsBinding not found** | Use Username/Password credential, ID `aws-credentials` (Access Key = username, Secret Key = password) |
| **ESLint: describe/it/expect is not defined** | Jest globals enabled in `backend/.eslintrc.cjs` |
| **npm audit fails build** | Adjust `--audit-level` or use `|| true` for non-blocking scan |

---

## 3. Docker & Containers

| Issue | Solution |
|-------|----------|
| **Build fails: npm ci** | Ensure `package-lock.json` exists and is committed |
| **Frontend blank / wrong API** | Set `VITE_API_URL` build arg (e.g. `http://localhost:5001/api`) |
| **Health check fails** | Backend exposes `/health`; frontend has `/health.html` |
| **ECR push denied** | Run `aws ecr get-login-password \| docker login -u AWS -p-stdin <registry>` |
| **Port already in use** | Change host ports in docker-compose (e.g. `5434:5432`) |
| **Large image size** | Use `.dockerignore`; exclude `node_modules`; run `docker system prune` |
| **Docker build context timeout** | Add `.dockerignore` to exclude large dirs (e.g. `frontend/node_modules`) |

---

## 4. Kubernetes / EKS

| Issue | Solution |
|-------|----------|
| **Pods Pending** | Cluster at capacity. Scale node group, reduce replicas, or scale down other workloads |
| **ImagePullBackOff** | Configure `imagePullSecrets` for ECR; or ensure node IAM role has ECR pull |
| **Backend CrashLoopBackOff / DB connect** | Verify `DATABASE_URL`, `REDIS_URL` in secret; run `./scripts/fix-backend-now.sh` |
| **Ingress not creating ALB** | Install AWS Load Balancer Controller; verify IAM permissions and subnets |
| **PVC Pending** | Ensure EBS CSI driver or default StorageClass (gp3) exists |
| **Uploads not persisting** | Backend uses emptyDir; mount `backend-uploads` PVC for persistence |
| **kubectl: connection refused** | Run `aws eks update-kubeconfig --region eu-north-1 --name afrimart-eks` |
| **Too many pods** | t3.micro has ~11 pods/node; scale down or add nodes |

---

## 5. Monitoring & Grafana

| Issue | Solution |
|-------|----------|
| **Grafana "No data sources found"** | Dashboards use Prometheus UID; ensure Prometheus datasource is provisioned or add manually (URL: `http://prometheus:9090`) |
| **Grafana/Prometheus Pending** | Cluster low on resources; scale frontend/backend to 0 or add nodes |
| **Prometheus targets down** | Check backend pod: `kubectl get pods -n afrimart`; run `fix-backend-now.sh` |
| **No http_requests_total data** | Backend must be Running; verify scrape config and backend `/metrics` |
| **Port 9090/3000 in use** | Use different port: `kubectl port-forward svc/grafana 3001:3000 -n monitoring` |
| **Alerts not in Slack** | Verify webhook in `alertmanager-configmap.yaml`; restart Alertmanager |
| **grafana-dashboards-config not found** | Create ConfigMap: `kubectl create configmap grafana-dashboards-config -n monitoring --from-literal=dashboards.yaml='...'` (see MONITORING_PHASE6) |

---

## 6. Application & Backend

| Issue | Solution |
|-------|----------|
| **Backend ECONNREFUSED to PostgreSQL** | Wrong `DATABASE_URL` or RDS not reachable. Run `./scripts/fix-backend-now.sh` |
| **Backend ECONNREFUSED to Redis** | Wrong `REDIS_URL` or ElastiCache not reachable. Check security groups |
| **502 Bad Gateway** | Backend not ready; check `kubectl get pods -n afrimart` and readiness probe |
| **Frontend shows nginx default** | Remove old nginx deployment; ensure frontend deployment has correct image |
| **JWT/auth errors** | Verify `JWT_SECRET` in secret matches across services |

---

## 7. CloudWatch & Logging

| Issue | Solution |
|-------|----------|
| **No log groups in CloudWatch** | Run `./scripts/setup-cloudwatch-logging.sh`; deploy Fluent Bit |
| **Fluent Bit pods Pending** | Cluster capacity; scale down other workloads |
| **Fluent Bit permission denied** | Add CloudWatch Logs permissions to EKS node role or use IRSA |
| **Logs not appearing** | Ensure Fluent Bit pods are Running; check region (eu-north-1) |

---

## 8. Quick Reference Commands

```bash
# Cluster status
kubectl get pods -A
kubectl get nodes

# Backend
kubectl get pods -n afrimart -l app=backend
kubectl logs -l app=backend -n afrimart --tail=100
kubectl rollout restart deployment/backend -n afrimart

# Fix backend (RDS/Redis)
./scripts/fix-backend-now.sh

# Monitoring
kubectl port-forward svc/grafana 3000:3000 -n monitoring
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
kubectl get pods -n monitoring

# Security scan
./scripts/security-scan.sh

# Terraform
cd terraform/environments/eks
terraform plan -var='db_password=...' -input=false
```

---

## Related Documentation

| Doc | Purpose |
|-----|---------|
| [RUNBOOK.md](RUNBOOK.md) | Alert remediation (InstanceDown, AfriMartBackendDown, etc.) |
| [PROMETHEUS_MONITORING_GUIDELINE.md](PROMETHEUS_MONITORING_GUIDELINE.md) | Prometheus queries, backend fix |
| [JENKINS_PIPELINE_GUIDE.md](JENKINS_PIPELINE_GUIDE.md) | Jenkins setup, credentials, stages |
| [KUBERNETES_PHASE5.md](KUBERNETES_PHASE5.md) | EKS deployment, Helm, ingress |
| [SECURITY_PHASE7.md](SECURITY_PHASE7.md) | Security scanning, secrets, TLS |
