# AfriMart Compliance Checklist

Reference checklist for security and compliance (CIS, AWS best practices).

---

## 1. AWS / Infrastructure

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | S3 bucket encryption (SSE) | ✅ | Enabled in Terraform S3 module |
| 2 | RDS encryption at rest | ✅ | `storage_encrypted = true` in RDS module |
| 3 | RDS not publicly accessible | ✅ | `publicly_accessible = false` |
| 4 | Security groups least privilege | ✅ | DB/Redis only from app/EKS |
| 5 | ECR repository encryption | ✅ | AES256 in ECR module |
| 6 | Terraform state encrypted | ✅ | S3 backend with encryption |
| 7 | No hardcoded secrets in code | ✅ | Secrets in K8s/Secrets Manager |
| 8 | IAM least privilege | Partial | Review node/service roles |

---

## 2. Kubernetes / EKS

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | Network policies | ✅ | `k8s/network-policy.yaml` |
| 2 | Resource limits on pods | ✅ | In deployments |
| 3 | Non-root containers | ✅ | `runAsNonRoot`, `runAsUser` |
| 4 | Read-only root filesystem | Partial | Consider for production |
| 5 | Secrets not in env from files | ✅ | Use secretRef |
| 6 | Image pull policy | ✅ | `imagePullPolicy: Always` |

---

## 3. Application

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | HTTPS/TLS in production | Partial | Configure ALB + cert-manager |
| 2 | Dependency scanning (npm audit) | ✅ | Jenkins pipeline |
| 3 | Container image scanning (Trivy) | ✅ | Jenkins pipeline |
| 4 | No sensitive data in logs | Review | Audit logging code |
| 5 | Input validation | Review | Per endpoint |

---

## 4. CIS Benchmarks (Summary)

| Benchmark | Scope | Status |
|-----------|-------|--------|
| CIS AWS Foundations | S3, IAM, CloudTrail, etc. | Partial – align with checklist above |
| CIS Kubernetes | EKS control plane, node config | Partial – managed by AWS |
| CIS Docker | Container runtime | Partial – EKS managed nodes |

---

## 5. Actions

1. Enable **CloudTrail** for audit logging (if not already)
2. Enable **AWS Config** for compliance auditing (optional)
3. Schedule **security-scan.sh** in CI (Trivy, tfsec, npm audit)
4. Document and test **backup restore** annually
5. Conduct **DR drill** quarterly
