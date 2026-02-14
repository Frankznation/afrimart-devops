# AfriMart Backup & Restore Procedures

---

## 1. Database (RDS PostgreSQL)

### Automated Backups

RDS automated backups are enabled by default in the Terraform RDS module:

- **Retention:** 7 days (configurable via `backup_retention_period`)
- **Window:** 03:00–04:00 UTC (configurable via `backup_window`)
- **Storage:** Included in RDS; no extra S3 cost

### Manual Snapshot

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier afrimart-postgres \
  --db-snapshot-identifier afrimart-manual-$(date +%Y%m%d) \
  --region eu-north-1
```

### Restore from Automated Backup

1. AWS Console: **RDS → Databases → Select instance → Actions → Restore to point in time**
2. Choose restore time (within retention window)
3. Restore creates a **new** RDS instance

### Restore from Manual Snapshot

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier afrimart-postgres-restored \
  --db-snapshot-identifier afrimart-manual-YYYYMMDD \
  --db-instance-class db.t3.micro
```

### Update Application

After restore, update `afrimart-secrets` with the new RDS endpoint:

```bash
kubectl create secret generic afrimart-secrets -n afrimart \
  --from-literal=DATABASE_URL="postgresql://user:pass@NEW_ENDPOINT:5432/afrimart" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/backend -n afrimart
```

---

## 2. Application State (S3 Uploads)

### Backup

S3 versioning is enabled in the AfriMart S3 module. For cross-region or explicit backup:

```bash
# Sync to backup bucket (same or different account/region)
aws s3 sync s3://afrimart-uploads s3://afrimart-uploads-backup --region eu-north-1
```

### Restore

```bash
aws s3 sync s3://afrimart-uploads-backup s3://afrimart-uploads --region eu-north-1
```

---

## 3. Container Images (ECR)

Images are retained per ECR lifecycle policy. No additional backup required unless using a different registry.

**Export for air-gapped restore:**
```bash
docker pull 024258572182.dkr.ecr.eu-north-1.amazonaws.com/afrimart/backend:latest
docker save afrimart/backend:latest | gzip > backend-backup.tar.gz
```

---

## 4. Kubernetes Manifests & Config

All manifests and config are in Git. Restore by:

```bash
git clone <repo>
./scripts/k8s-apply.sh
# Recreate secrets manually or via External Secrets
```

---

## 5. ElastiCache Redis

- **No native backup** for Redis cluster mode (cluster-mode disabled) – use RDB snapshots if enabled
- **For ElastiCache:** Enable automatic backups in AWS Console or Terraform; restore creates new cluster
- **Data loss impact:** Session/cache data; repopulate from application on restart

---

## Backup Schedule (Recommended)

| Component   | Method        | Frequency  | Retention |
|------------|---------------|------------|-----------|
| RDS        | Automated     | Daily      | 7 days    |
| RDS        | Manual        | Weekly     | 30 days   |
| S3         | Versioning    | Continuous | Per policy |
| S3         | Sync/backup   | Weekly     | 30 days   |
| K8s/Config | Git           | On change  | Indefinite |
