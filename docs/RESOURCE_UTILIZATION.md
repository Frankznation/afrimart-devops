# AfriMart Kubernetes Resource Utilization Analysis

**Phase 5 Deliverable**

---

## Node Group Sizing

| Node Group | Instance Types   | Min | Desired | Max | Purpose                    |
|------------|------------------|-----|---------|-----|----------------------------|
| On-demand  | t3.medium        | 1   | 2       | 4   | Baseline capacity, HA      |
| Spot       | t3.medium, t3a   | 0   | 1       | 4   | Cost optimization, burst   |

**Per t3.medium node:** 2 vCPU, 4 GiB RAM  
**Total capacity (2 on-demand + 1 spot):** ~6 vCPU, 12 GiB

---

## Pod Resource Allocation

### Backend

| Metric   | Request | Limit | Per Replica |
|----------|---------|-------|-------------|
| CPU      | 100m    | 500m  | 0.1–0.5 core |
| Memory   | 256Mi   | 512Mi | 256–512 MiB  |

**2 replicas:** 200m CPU, 512Mi RAM requested  
**10 replicas (HPA max):** 1 CPU, 2.5 GiB requested

### Frontend

| Metric   | Request | Limit | Per Replica |
|----------|---------|-------|-------------|
| CPU      | 50m     | 200m  | 0.05–0.2 core |
| Memory   | 64Mi    | 128Mi | 64–128 MiB   |

**2 replicas:** 100m CPU, 128Mi RAM requested  
**6 replicas (HPA max):** 300m CPU, 384Mi requested

---

## Storage

| Component      | Size | StorageClass | Usage              |
|----------------|------|--------------|--------------------|
| Backend uploads| 5Gi  | gp3/default  | User uploads (PVC) |
| Logs           | -    | emptyDir     | Ephemeral          |

---

## HPA Targets

| Deployment | Min | Max | Trigger (CPU) |
|------------|-----|-----|---------------|
| Backend    | 2   | 10  | 70%           |
| Frontend   | 2   | 6   | 70%           |

---

## Capacity Planning

- **Low traffic:** 2 backend + 2 frontend ≈ 300m CPU, 640Mi
- **Peak (HPA scaled):** 10 backend + 6 frontend ≈ 1.3 CPU, 2.9 GiB
- **Headroom:** System pods (kube-proxy, AWS node, etc.) ~200–400m CPU per node

**Recommendation:** Start with 2 on-demand + 1 spot. Add nodes or increase instance size if pods are frequently pending.
