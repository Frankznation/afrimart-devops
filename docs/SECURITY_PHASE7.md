# Phase 7: Security & Compliance

Security implementation, scanning, backup, and disaster recovery for AfriMart.

---

## Checklist

### 1. Security Implementation

| Task | Status | Implementation |
|------|--------|----------------|
| Secrets management | Partial | Kubernetes Secrets; [AWS Secrets Manager guide](#secrets-management) below |
| SSL/TLS certificates | Partial | ACM + ALB (HTTPS); [cert-manager](#ssl--tls) for Ingress |
| Network security | ✅ | Security groups, NACLs (Terraform); [Network policies](#network-security) |
| IAM best practices | Partial | IRSA for Fluent Bit; node IAM roles; [IAM guide](#iam-best-practices) |
| Encryption at rest | Partial | S3, ECR, RDS (when enabled); [Encryption](#encryption) |

### 2. Security Scanning

| Task | Status | Implementation |
|------|--------|----------------|
| Container image scanning | ✅ | Trivy (Jenkins pipeline); `./scripts/security-scan.sh` |
| Dependency scanning | ✅ | `npm audit` (Jenkins); OWASP Dependency Check in script |
| Infrastructure scanning | ✅ | tfsec; `./scripts/security-scan.sh` |
| Compliance checks | Partial | CIS benchmarks documented; manual checks |

### 3. Backup & DR

| Task | Status | Implementation |
|------|--------|----------------|
| Database backup strategy | ✅ | RDS automated backups; [BACKUP_RESTORE.md](BACKUP_RESTORE.md) |
| Application state backup | Partial | S3 uploads; ECR images; [BACKUP_RESTORE.md](BACKUP_RESTORE.md) |
| Disaster recovery plan | ✅ | [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) |
| RTO/RPO documentation | ✅ | [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) |

---

## Security Implementation Details

### Secrets Management

**Current:** Kubernetes Secrets (`k8s/secret.yaml`) for DATABASE_URL, REDIS_URL, JWT_SECRET. Never commit `secret.yaml`.

**AWS Secrets Manager (recommended for production):**

1. Create secrets in AWS:
   ```bash
   aws secretsmanager create-secret --name afrimart/prod/database --secret-string '{"username":"afrimatadmin","password":"...","host":"...","port":5432,"dbname":"afrimart"}'
   aws secretsmanager create-secret --name afrimart/prod/redis --secret-string '{"url":"redis://..."}'
   aws secretsmanager create-secret --name afrimart/prod/jwt --secret-string '{"secret":"..."}'
   ```

2. Use External Secrets Operator or AWS Secrets Store CSI Driver to sync into Kubernetes:
   ```yaml
   # Example: External Secrets Operator
   apiVersion: external-secrets.io/v1beta1
   kind: ExternalSecret
   metadata:
     name: afrimart-secrets
   spec:
     secretStoreRef:
       name: aws-secrets-manager
       kind: SecretStore
     target:
       name: afrimart-secrets
     data:
       - secretKey: DATABASE_URL
         remoteRef:
           key: afrimart/prod/database
           property: connectionString
   ```

3. Grant EKS node role or IRSA: `secretsmanager:GetSecretValue` for `afrimart/*`.

---

### SSL / TLS

**Current:** ALB listener on 80. For HTTPS:

1. **ACM certificate** (AWS Console or Terraform):
   ```hcl
   resource "aws_acm_certificate" "main" {
     domain_name       = "afrimart.example.com"
     validation_method = "DNS"
   }
   ```

2. **ALB HTTPS listener** – Add listener on 443 with ACM cert; redirect 80→443.

3. **cert-manager (Ingress TLS):**
   ```bash
   helm repo add jetstack https://charts.jetstack.io
   helm install cert-manager jetstack/cert-manager --set installCRDs=true -n cert-manager --create-namespace
   ```
   ```yaml
   # Ingress with TLS
   spec:
     tls:
       - hosts: [afrimart.example.com]
         secretName: afrimart-tls
     rules:
       - host: afrimart.example.com
   ```
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: admin@example.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
         - http01:
             ingress:
               class: nginx
   ```

---

### Network Security

**Security groups (Terraform):**
- ALB: 80, 443 from 0.0.0.0/0
- App: 3000 from ALB only; 22 from SSH CIDR
- DB: 5432 from App SG only
- Redis: 6379 from VPC (EKS node SG)

**Kubernetes NetworkPolicy** (`k8s/network-policy.yaml`):
- Restrict backend/frontend ingress to services only
- Deny all other traffic by default (policy types: Ingress, Egress)

**NACLs:** Subnet NACLs in VPC module; default allow.

---

### IAM Best Practices

- **Least privilege:** EKS node role: ECR pull, CloudWatch, no S3 write unless needed
- **IRSA:** Use IAM Roles for Service Accounts for Fluent Bit, external-secrets, etc.
- **No long-lived keys in pods:** Prefer IRSA over AccessKey/SecretKey in secrets
- **Rotation:** Rotate DB password, JWT secret, and AWS keys periodically

---

### Encryption

| Component | At Rest | In Transit |
|-----------|---------|------------|
| RDS | Enable `storage_encrypted = true` in RDS module | SSL/TLS (enforce in `rds.tf` parameters) |
| ElastiCache | Encryption at rest (Redis 6+) | TLS in-transit (optional) |
| S3 | SSE-S3 (default in module) | HTTPS |
| ECR | AES256 (default in module) | HTTPS |
| EKS etcd | Encrypted (AWS managed) | TLS |

---

## Security Scanning

Run the security scan script:

```bash
./scripts/security-scan.sh
```

**Included:**
- **Trivy** – Container image vulnerability scan
- **tfsec** – Terraform security scan
- **npm audit** – Node.js dependency vulnerabilities
- **OWASP Dependency Check** – Optional (requires `dependency-check` CLI)

---

## Related Documents

- [SECURITY_ASSESSMENT_REPORT.md](SECURITY_ASSESSMENT_REPORT.md) – Assessment findings
- [BACKUP_RESTORE.md](BACKUP_RESTORE.md) – Backup and restore procedures
- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) – DR plan, RTO/RPO
- [COMPLIANCE_CHECKLIST.md](COMPLIANCE_CHECKLIST.md) – Compliance checklist
