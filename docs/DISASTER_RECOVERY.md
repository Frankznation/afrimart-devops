# AfriMart Disaster Recovery Plan

---

## RTO / RPO

| Metric | Target | Notes |
|--------|--------|------|
| **RTO** (Recovery Time Objective) | 4 hours | Time to restore service after disaster |
| **RPO** (Recovery Point Objective) | 24 hours | Max acceptable data loss (last backup) |

---

## Disaster Scenarios

### 1. RDS Failure

**Impact:** Application cannot serve requests.

**Procedure:**
1. Restore from latest automated backup (RDS Console: Restore to point in time)
2. Create new RDS instance from backup
3. Update `afrimart-secrets` with new endpoint
4. Restart backend: `kubectl rollout restart deployment/backend -n afrimart`
5. Verify application health

**RTO:** ~1–2 hours (RDS restore + DNS/secret update)

---

### 2. EKS Cluster Failure

**Impact:** Full application unavailable.

**Procedure:**
1. Provision new EKS cluster: `cd terraform/environments/eks && terraform apply`
2. Install AWS Load Balancer Controller (if used)
3. Apply manifests: `./scripts/k8s-apply.sh`
4. Create secrets (from AWS Secrets Manager or manual)
5. Deploy monitoring: `./scripts/apply-monitoring.sh`
6. Update DNS/ALB to point to new cluster

**RTO:** ~2–4 hours

---

### 3. Region Failure (eu-north-1)

**Impact:** Complete outage until failover to secondary region.

**Prerequisites:**
- RDS read replica or standby in secondary region
- S3 cross-region replication
- Terraform modules parameterized for region
- ECR images replicated or rebuild from Git

**Procedure:**
1. Promote RDS standby (if configured)
2. Create EKS cluster in secondary region
3. Deploy application and update DATABASE_URL, REDIS_URL
4. Update Route53/global accelerator to failover to new region

**RTO:** 4–8 hours (depends on prep)

---

### 4. Data Corruption / Ransomware

**Procedure:**
1. Isolate affected resources (security groups, disconnect)
2. Restore RDS from point-in-time before compromise
3. Restore S3 from versioning or backup bucket
4. Rotate all secrets (DB password, JWT, AWS keys)
5. Redeploy from known-good container images
6. Conduct forensic review

---

### 5. Redis Failure

**Impact:** Session/cache loss; possible increased DB load.

**Procedure:**
1. ElastiCache: Restore from backup if enabled, or create new cluster
2. Update REDIS_URL in secrets
3. Restart backend
4. Cache repopulates naturally

**RTO:** ~30–60 minutes

---

## Contact & Escalation

| Role         | Responsibility                    |
|--------------|-----------------------------------|
| On-call      | Initial response, runbook execution |
| Platform     | Terraform, EKS, RDS, networking   |
| Application  | Code, DB schema, config           |

---

## DR Drills

**Recommended:** Quarterly DR drill:
1. Restore RDS from backup to new instance
2. Deploy EKS from scratch in new VPC
3. Validate end-to-end application functionality
