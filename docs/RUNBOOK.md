# AfriMart Monitoring Runbook

Common alerts and remediation steps.

---

## Critical Alerts

### InstanceDown

**Meaning:** A Prometheus scrape target is unreachable for more than 5 minutes.

**Check:**
```bash
kubectl get pods -n afrimart
kubectl get pods -n monitoring
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

**Actions:**
1. Verify pod is running: `kubectl get pods`
2. Check node status: `kubectl get nodes`
3. Restart deployment if needed: `kubectl rollout restart deployment/<name> -n <namespace>`
4. Review events: `kubectl get events -n <namespace> --sort-by='.lastTimestamp'`

---

### AfriMartBackendDown

**Meaning:** Backend has not been reachable for 2 minutes.

**Check:**
```bash
kubectl get pods -n afrimart -l app=backend
kubectl logs -l app=backend -n afrimart --tail=100
kubectl describe pod -l app=backend -n afrimart
```

**Actions:**
1. Check pod status and restarts
2. Verify DATABASE_URL and REDIS_URL in secret
3. Check RDS/ElastiCache security groups allow EKS nodes
4. Restart backend: `kubectl rollout restart deployment/backend -n afrimart`

---

### RedisDown

**Meaning:** Redis exporter unreachable for 5+ minutes.

**Check:**
```bash
kubectl get pods -n monitoring -l app=redis-exporter
kubectl logs -l app=redis-exporter -n monitoring --tail=50
```

**Actions:**
1. Restart redis-exporter: `kubectl rollout restart deployment/redis-exporter -n monitoring`
2. Verify ElastiCache is running and security groups allow EKS nodes
3. Check exporter-credentials secret has correct REDIS_ADDR

---

### PostgresDown

**Meaning:** PostgreSQL exporter unreachable for 5+ minutes.

**Check:**
```bash
kubectl get pods -n monitoring -l app=postgres-exporter
kubectl logs -l app=postgres-exporter -n monitoring --tail=50
```

**Actions:**
1. Restart postgres-exporter: `kubectl rollout restart deployment/postgres-exporter -n monitoring`
2. Verify RDS is running and security groups allow EKS nodes
3. Check exporter-credentials secret has correct DATA_SOURCE_NAME

---

### DatabaseConnectionFailed (High 5xx)

**Meaning:** Backend returning many 5xx errors; may indicate DB or Redis connection issues.

**Check:**
```bash
kubectl logs -l app=backend -n afrimart --tail=200 | grep -i "error\|ECONNREFUSED\|timeout"
kubectl exec -it deploy/backend -n afrimart -- env | grep -E "DATABASE|REDIS"
```

**Actions:**
1. Verify RDS is running and accessible from EKS subnet
2. Verify ElastiCache Redis is running
3. Check secret has correct DATABASE_URL and REDIS_URL
4. Review backend logs for connection errors

---

## Warning Alerts

### HighCPU

**Meaning:** Node CPU usage above 80% for 5 minutes.

**Check:**
```bash
kubectl top nodes
kubectl top pods -n afrimart
```

**Actions:**
1. Identify pods consuming CPU
2. Scale up HPA or add nodes if consistent
3. Review application for optimization

---

### HighMemory

**Meaning:** Node memory usage above 85% for 5 minutes.

**Check:**
```bash
kubectl top nodes
kubectl top pods -n afrimart
```

**Actions:**
1. Identify memory-heavy pods
2. Consider increasing node size or adding nodes
3. Review pod resource limits

---

### HighErrorRate

**Meaning:** 5xx error rate above 5% for 5 minutes.

**Check:**
```bash
kubectl logs -l app=backend -n afrimart --tail=500
# In Prometheus: rate(http_requests_total{status_code=~"5.."}[5m])
```

**Actions:**
1. Correlate with DatabaseConnectionFailed if DB/Redis issues
2. Check for code bugs or deployment issues
3. Review recent deployments: `kubectl rollout history deployment/backend -n afrimart`

---

### HighLatency

**Meaning:** 95th percentile request latency above 2 seconds.

**Check:**
```bash
# Identify slow routes from Prometheus or logs
kubectl logs -l app=backend -n afrimart --tail=200
```

**Actions:**
1. Check database query performance
2. Review N+1 queries or missing indexes
3. Consider caching (Redis) for hot paths

---

## Useful Commands

| Task | Command |
|------|---------|
| Port-forward Grafana | `kubectl port-forward svc/grafana 3000:3000 -n monitoring` |
| Port-forward Prometheus | `kubectl port-forward svc/prometheus 9090:9090 -n monitoring` |
| View backend logs | `kubectl logs -f -l app=backend -n afrimart` |
| Restart backend | `kubectl rollout restart deployment/backend -n afrimart` |
| Check HPA | `kubectl get hpa -n afrimart` |
| Reload Prometheus config | `curl -X POST http://localhost:9090/-/reload` (after port-forward) |
