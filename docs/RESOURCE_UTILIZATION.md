# AfriMart Kubernetes Resource Utilization Analysis

**Phase 5 Deliverable**

---

## Node Group Sizing

| Node Group | Instance Types | Min | Desired | Max | Purpose                    |
|------------|----------------|-----|---------|-----|----------------------------|
| On-demand  | t3.micro       | 1   | 2       | 4   | Baseline capacity, HA      |
| Spot       | t3.micro       | 0   | 1       | 4   | Cost optimization, burst   |

**Per t3.micro node:** 2 vCPU, 1 GiB RAM  
**Total capacity (2 on-demand + 1 spot):** ~6 vCPU, 3 GiB

*Configured in `terraform/environments/eks/variables.tf`. Use t3.medium for higher capacity.*

---

## Pod Resource Allocation

### Backend

| Metric   | Request | Limit | Per Replica |
|----------|---------|-------|-------------|
| CPU      | 100m    | 500m  | 0.1–0.5 core |
| Memory   | 256Mi   | 512Mi | 256–512 MiB  |

**2 replicas (HPA min):** 200m CPU, 512Mi RAM requested  
**10 replicas (HPA max):** 1 CPU, 2.5 GiB requested

*Deployment spec has `replicas: 1`; HPA overrides to min 2 when applied.*

### Frontend

| Metric   | Request | Limit | Per Replica |
|----------|---------|-------|-------------|
| CPU      | 50m     | 200m  | 0.05–0.2 core |
| Memory   | 64Mi    | 128Mi | 64–128 MiB   |

**2 replicas (HPA min):** 100m CPU, 128Mi RAM requested  
**6 replicas (HPA max):** 300m CPU, 384Mi requested

*Deployment spec has `replicas: 1`; HPA overrides to min 2 when applied.*

---

## Storage

| Component       | Size | StorageClass | Usage                                                |
|-----------------|------|--------------|------------------------------------------------------|
| Backend uploads | -    | emptyDir     | Ephemeral (per-pod). PVC `backend-uploads` (5Gi) defined but not mounted. |
| Backend logs    | -    | emptyDir     | Ephemeral                                            |

---

## HPA Targets

| Deployment | Min | Max | Metrics                  | Notes                                        |
|------------|-----|-----|--------------------------|----------------------------------------------|
| Backend    | 2   | 10  | CPU 70%, Memory 80%      | Scale-up/down behavior configured             |
| Frontend   | 2   | 6   | CPU 70%                  | Memory metric not configured                 |

---

## Capacity Planning

- **Low traffic:** 2 backend + 2 frontend ≈ 300m CPU, 640Mi
- **Peak (HPA scaled):** 10 backend + 6 frontend ≈ 1.3 CPU, 2.9 GiB
- **Headroom:** System pods (kube-proxy, AWS node, etc.) ~200–400m CPU per node

**Recommendation:** Start with 2 on-demand + 1 spot. With t3.micro (1 GiB each), capacity is limited—consider t3.small or t3.medium if pods are frequently pending. To enable persistent uploads, mount the `backend-uploads` PVC in the backend deployment.
