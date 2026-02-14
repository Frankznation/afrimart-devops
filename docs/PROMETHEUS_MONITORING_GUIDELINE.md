# Prometheus & Monitoring Guideline

Complete guide for AfriMart monitoring on EKS with Prometheus, Grafana, and Alertmanager.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Prometheus Setup](#prometheus-setup)
5. [Running Prometheus Queries](#running-prometheus-queries)
6. [Grafana Dashboards](#grafana-dashboards)
7. [Slack Alerting](#slack-alerting)
8. [Backend Metrics Fix](#backend-metrics-fix)
9. [Troubleshooting](#troubleshooting)

---

## Overview

| Component | Purpose |
|-----------|---------|
| **Prometheus** | Scrapes metrics from AfriMart backend `/metrics` endpoint |
| **Alertmanager** | Routes alerts to Slack (critical/warning) |
| **Grafana** | Pre-built dashboards for application and infrastructure metrics |
| **Recording rules** | Pre-computed aggregates (request rate, latency, error rate) |
| **Alerting rules** | InstanceDown, AfriMartBackendDown, HighCPU, HighMemory, etc. |

---

## Prerequisites

- EKS cluster with `kubectl` configured
- AfriMart backend and frontend deployed
- RDS and ElastiCache Redis running (for backend)

---

## Quick Start

### 1. Deploy the monitoring stack

```bash
cd afrimart-devops
./scripts/apply-monitoring.sh
```

Or manually:

```bash
kubectl apply -f k8s/monitoring/namespace.yaml
kubectl apply -f k8s/monitoring/prometheus-rbac.yaml
kubectl apply -f k8s/monitoring/prometheus-configmap.yaml
kubectl apply -f k8s/monitoring/prometheus-rules.yaml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml
kubectl apply -f k8s/monitoring/alertmanager-configmap.example.yaml  # copy to alertmanager-configmap.yaml and add Slack webhook
kubectl apply -f k8s/monitoring/alertmanager-deployment.yaml
kubectl apply -f k8s/monitoring/grafana-configmap.yaml
kubectl apply -f k8s/monitoring/grafana-dashboards-configmap.yaml
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml
kubectl apply -f k8s/monitoring/grafana-deployment.yaml
```

### 2. Access Prometheus

```bash
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
```

Open **http://localhost:9090**

### 3. Access Grafana (when pod is Running)

```bash
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

Open **http://localhost:3000** — login: **admin** / **admin**

---

## Prometheus Setup

### Scrape targets

Prometheus scrapes:

| Job | Target | Purpose |
|-----|--------|---------|
| `prometheus` | localhost:9090 | Self-monitoring |
| `afrimart-backend` | backend.afrimart.svc.cluster.local:80/metrics | Application metrics |

### Configuration files

- `k8s/monitoring/prometheus-configmap.yaml` — scrape config
- `k8s/monitoring/prometheus-rules.yaml` — recording rules and alerting rules

---

## Running Prometheus Queries

### Step-by-step

1. Open **http://localhost:9090**
2. Click the **Graph** tab
3. Enter a query in the expression box
4. Click **Execute**
5. View results in **Table** or **Graph** tab

### Useful queries

| Query | What it shows |
|-------|---------------|
| `up` | All targets: 1 = up, 0 = down |
| `http_requests_total{job="afrimart-backend"}` | Total HTTP requests by route/method/status |
| `rate(http_requests_total{job="afrimart-backend"}[5m])` | Requests per second (5m window) |
| `http_request_duration_seconds_bucket{job="afrimart-backend"}` | Request latency histogram |
| `active_connections{job="afrimart-backend"}` | Active connections |

### Example: Check backend metrics

1. Go to **Graph**
2. Enter: `http_requests_total{job="afrimart-backend"}`
3. Click **Execute**
4. Switch to **Graph** tab to see time series

**Note:** If no data appears, the backend may be down. Fix the backend secret (see [Backend Metrics Fix](#backend-metrics-fix)).

---

## Grafana Dashboards

Pre-provisioned dashboards:

| Dashboard | Panels |
|-----------|--------|
| **AfriMart Overview** | Backend status, request rate, latency p95, error % |
| **AfriMart Application** | Request rate by route, latency p95, 5xx errors, active connections |
| **Infrastructure** | CPU, memory, disk (requires node-exporter) |

---

## Slack Alerting

### Setup

1. Create a Slack Incoming Webhook: https://api.slack.com/messaging/webhooks
2. Copy `alertmanager-configmap.example.yaml` to `alertmanager-configmap.yaml`
3. Replace `YOUR_SLACK_WEBHOOK_URL` with your webhook URL
4. Apply and restart:

```bash
kubectl apply -f k8s/monitoring/alertmanager-configmap.yaml
kubectl rollout restart deployment/alertmanager -n monitoring
```

### Alert channels

- **Critical** → `#alerts-critical` (InstanceDown, AfriMartBackendDown, DatabaseConnectionFailed)
- **Warning** → `#alerts-warning` (HighCPU, HighMemory, HighErrorRate, HighLatency)

---

## Backend Metrics Fix

If the backend is crashlooping (ECONNREFUSED to PostgreSQL/Redis), the secret has wrong `DATABASE_URL`/`REDIS_URL`.

### Run the fix script

```bash
./scripts/fix-backend-now.sh
```

Enter your Terraform `db_password` when prompted. The script will:

1. Get RDS and Redis endpoints from AWS
2. Update `afrimart-secrets` with correct URLs
3. Restart the backend deployment

### Verify

```bash
kubectl get pods -n afrimart -l app=backend
# Wait for 1/1 Running

# In Prometheus (after 1–2 min):
# Query: http_requests_total{job="afrimart-backend"}
# Should return data
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Prometheus targets down | Check backend pod: `kubectl get pods -n afrimart` |
| No `http_requests_total` data | Backend must be Running; run `fix-backend-now.sh` |
| Grafana/Prometheus Pending | Cluster low on resources; scale nodes or reduce replica count |
| Port 9090/3000 in use | Use different port: `kubectl port-forward svc/prometheus 9091:9090 -n monitoring` |
| Alerts not in Slack | Verify webhook URL in `alertmanager-configmap.yaml` and restart Alertmanager |

### Useful commands

```bash
kubectl get pods -n monitoring
kubectl get pods -n afrimart
kubectl logs -l app=backend -n afrimart --tail=50
kubectl rollout restart deployment/backend -n afrimart
```

---

## Related docs

- [MONITORING_PHASE6.md](MONITORING_PHASE6.md) — Phase 6 overview
- [RUNBOOK.md](RUNBOOK.md) — Alert remediation runbook
