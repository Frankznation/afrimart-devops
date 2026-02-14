# AfriMart Alerting – Deliverables

Alerting setup for AfriMart EKS with Prometheus and Alertmanager.

---

## Checklist

| Task | Status |
|------|--------|
| Critical alerts (system down, database unreachable) | ✅ |
| Warning alerts (high CPU, memory pressure) | ✅ |
| Notification channels (Slack/Email) | ✅ (Slack configured; Email optional) |
| On-call rotation | ✅ (documented) |

---

## 1. Prometheus Configuration

**Files:**
- `k8s/monitoring/prometheus-configmap.yaml` – scrape config, Alertmanager target
- `k8s/monitoring/prometheus-rules.yaml` – recording and alerting rules

**Alertmanager target:**
```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: [alertmanager.monitoring.svc.cluster.local:9093]
```

---

## 2. Alert Rule Definitions

### Critical Alerts (`severity: critical`)

| Alert | Condition | For | Description |
|-------|-----------|-----|-------------|
| **InstanceDown** | `up == 0` | 5m | Scrape target unreachable |
| **AfriMartBackendDown** | `up{job="afrimart-backend"} == 0` | 2m | Backend unreachable |
| **DatabaseConnectionFailed** | High 5xx rate on backend | 5m | Possible DB/Redis connection failure |
| **RedisDown** | `up{job="redis"} == 0` | 5m | Redis exporter unreachable |
| **PostgresDown** | `up{job="postgres"} == 0` | 5m | PostgreSQL exporter unreachable |

### Warning Alerts (`severity: warning`)

| Alert | Condition | For | Description |
|-------|-----------|-----|-------------|
| **HighCPU** | Node CPU > 80% | 5m | High CPU (requires node-exporter) |
| **HighMemory** | Node memory > 85% | 5m | High memory (requires node-exporter) |
| **HighErrorRate** | 5xx rate > 5% | 5m | Elevated error rate |
| **HighLatency** | p95 latency > 2s | 5m | Slow requests |

**Note:** HighCPU and HighMemory need node-exporter deployed. Without it, these alerts will not fire.

---

## 3. Notification Channels

### Slack (configured)

- **Critical** → `#alerts-critical`
- **Warning** → `#alerts-warning`
- **Default** → `#alerts`

**Setup:** Copy `alertmanager-configmap.example.yaml` to `alertmanager-configmap.yaml`, set `YOUR_SLACK_WEBHOOK_URL`, then apply.

### Email (optional)

Uncomment the `email_configs` block in the Alertmanager config and set:

- `smtp_smarthost`, `smtp_from`, `smtp_auth_username`, `smtp_auth_password`
- `to: 'oncall@example.com'` or a mailing list

### PagerDuty / Opsgenie (on-call rotation)

1. Create a service in PagerDuty or Opsgenie
2. Obtain the integration/webhook key
3. Add `pagerduty_configs` or `webhook_configs` to the `critical` receiver in Alertmanager

---

## 4. On-Call Rotation

Alertmanager does not handle rotation itself. Use:

| Tool | How |
|------|-----|
| **PagerDuty** | Integrate with Alertmanager via `pagerduty_configs`; configure schedules and escalation policies |
| **Opsgenie** | Same idea with `opsgenie_configs` or webhook |
| **Slack** | Use `@channel` in `#alerts-critical`; manage rotation in Slack (e.g. manual or via bot) |
| **Email** | Use a rotating mailing list (e.g. oncall-week1@, oncall-week2@) and update Alertmanager |

---

## 5. Grafana Dashboard JSON Exports

Dashboards are in:

- `k8s/monitoring/dashboards/` (JSON files)
- `k8s/monitoring/grafana-dashboards.yaml` (ConfigMap)

**Export from Grafana:**  
Dashboard → ⋮ → **Share** → **Export** → **Save to file**

---

## 6. Runbook

See **[docs/RUNBOOK.md](RUNBOOK.md)** for:

- Interpretation of each alert
- Commands to run
- Step-by-step remediation

---

## 7. Deploy and Verify

```bash
# Apply rules and config
kubectl apply -f k8s/monitoring/prometheus-rules.yaml
kubectl apply -f k8s/monitoring/prometheus-configmap.yaml

# Alertmanager (after creating alertmanager-configmap.yaml with webhook)
kubectl apply -f k8s/monitoring/alertmanager-configmap.yaml
kubectl apply -f k8s/monitoring/alertmanager-deployment.yaml

# Restart to reload
kubectl rollout restart deployment/prometheus -n monitoring
kubectl rollout restart deployment/alertmanager -n monitoring
```

**Verify alerts:** Prometheus → **Alerts** (port-forward to 9090).
