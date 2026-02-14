# Phase 6: Monitoring & Observability

Prometheus, Grafana, Alertmanager, and CloudWatch Logs for AfriMart on EKS.

> **Quick reference:** See [PROMETHEUS_MONITORING_GUIDELINE.md](PROMETHEUS_MONITORING_GUIDELINE.md) for a step-by-step guide including Prometheus queries, backend fix, and troubleshooting.

---

## Overview

| Component | Purpose |
|-----------|---------|
| **Prometheus** | Metrics collection, recording rules, alert evaluation |
| **Alertmanager** | Alert routing, Slack notifications |
| **Grafana** | Dashboards for application metrics |
| **Node Exporter** | Optional – host metrics (CPU, memory, disk); excluded by default for small clusters |
| **CloudWatch Logs** | Optional – container log aggregation |

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │            AfriMart Backend              │
                    │         /metrics (Prometheus)            │
                    └────────────────────┬────────────────────┘
                                         │ scrape
    ┌──────────────┐     ┌───────────────▼──────────────┐
    │ Node         │     │         Prometheus           │
    │ Exporter     │────▶│  - Service discovery         │
    │ (DaemonSet)  │     │  - Recording rules           │
    └──────────────┘     │  - Alerting rules            │
                         └───────────────┬──────────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │                │                │
                        ▼                ▼                ▼
                 ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                 │ Alertmanager│  │   Grafana   │  │ CloudWatch  │
                 │ (alerts)    │  │ (dashboards)│  │   Logs      │
                 └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Quick Start

### 1. Apply Monitoring Manifests

```bash
./scripts/apply-monitoring.sh
```

Or apply manually (see `scripts/apply-monitoring.sh` for full list). **Note:** Copy `alertmanager-configmap.example.yaml` to `alertmanager-configmap.yaml` and add your Slack webhook before applying.

### 2. Access Grafana

```bash
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

Open http://localhost:3000 — login: **admin** / **admin** (change in production).

### 3. Access Prometheus

```bash
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
```

Open http://localhost:9090

---

## Dashboards

| Dashboard | Description |
|-----------|-------------|
| **AfriMart Overview** | Backend status, request rate, latency, error % |
| **AfriMart Application** | Request rate, latency p95, 5xx errors, active connections |
| **Infrastructure** | CPU, memory, disk, targets up |

---

## Alerting Rules

### Critical
- **InstanceDown** – Target unreachable for 5m
- **AfriMartBackendDown** – Backend down for 2m
- **DatabaseConnectionFailed** – High 5xx rate (possible DB/Redis issues)

### Warning
- **HighCPU** – CPU > 80% for 5m
- **HighMemory** – Memory > 85% for 5m
- **HighErrorRate** – 5xx rate > 5% for 5m
- **HighLatency** – p95 latency > 2s for 5m

---

## Slack Notifications

1. Create a Slack Incoming Webhook: https://api.slack.com/messaging/webhooks

2. Replace `YOUR_SLACK_WEBHOOK_URL` in `k8s/monitoring/alertmanager-configmap.yaml` with your webhook URL from Slack (Incoming Webhooks app).

3. Optionally use different channels for critical vs warning, or use one channel (e.g. `#alerts`) for all.

4. Apply and restart:
   ```bash
   kubectl apply -f k8s/monitoring/alertmanager-configmap.yaml
   kubectl rollout restart deployment/alertmanager -n monitoring
   ```

---

## CloudWatch Logs (Option B)

To send container logs to CloudWatch:

### 1. Create log group

```bash
aws logs create-log-group --log-group-name /aws/eks/afrimart/application
```

### 2. Deploy Fluent Bit (AWS for Fluent Bit)

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml
```

### 3. Configure log groups in Fluent Bit

See [AWS EKS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-setup-logs.html).

---

## Runbook

See [RUNBOOK.md](RUNBOOK.md) for common alerts and remediation steps.

---

## Evaluation Mapping

| Criterion | Weight | Implementation |
|-----------|--------|----------------|
| Monitoring completeness | 30% | Prometheus, node-exporter, backend metrics, recording rules, alerting rules |
| Dashboard design | 25% | Application, infrastructure, overview dashboards |
| Alert quality | 25% | Critical and warning alerts, Alertmanager routing |
| Documentation | 20% | This doc, runbook, manifest comments |
