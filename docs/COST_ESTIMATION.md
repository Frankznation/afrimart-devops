# AfriMart Cost Estimation

**Phase 1 Infrastructure – Monthly Estimate (eu-north-1)**

---

## Summary

| Environment | Est. Monthly | Notes                    |
|-------------|--------------|--------------------------|
| Dev (minimal) | ~$45–60    | Single AZ, no ALB        |
| Dev (full)    | ~$75–95    | With ALB                 |
| Production    | ~$180–250  | Multi-AZ RDS, ALB        |

*Prices approximate; use [AWS Pricing Calculator](https://calculator.aws/) for exact estimates.*

---

## Resource Breakdown (Dev Minimal)

| Resource | Type | Qty | Est. Monthly (USD) | Notes |
|----------|------|-----|--------------------|-------|
| **EC2** | t3.micro | 1 | ~$8 | 750 hrs free tier (12 months) |
| **RDS** | db.t3.micro | 1 | ~$15 | Single-AZ |
| **ElastiCache** | cache.t3.micro | 1 | ~$12 | 750 hrs free tier possible |
| **NAT Gateway** | - | 1 | ~$32 | $0.045/hr + data |
| **EIP** | - | 1 | ~$3.60 | If attached to NAT (included above) |
| **S3** | Standard | <1 GB | ~$0.50 | Storage + requests |
| **ECR** | - | 2 repos | ~$0.20 | 500 MB free tier |
| **Data transfer** | Out | ~5 GB | ~$0.50 | First 1 GB free |
| **Terraform state** | S3 + DynamoDB | - | ~$0.50 | If using remote backend |
| **Total** | | | **~$72** | |

---

## Production Add-Ons

| Resource | Additional Cost | Notes |
|----------|-----------------|-------|
| RDS Multi-AZ | +~$15 | db.t3.micro standby |
| ALB | ~$20 | + $0.008/LCU-hour |
| RDS db.t3.small | +~$30 | Upgrade from micro |
| Backup storage | ~$2/GB | RDS snapshots |
| CloudWatch | ~$3–10 | Logs, metrics |

---

## Cost Optimization Tips

1. **NAT Gateway** – Largest fixed cost; consider NAT instance or VPC endpoints.
2. **RDS** – Use Reserved Instances for production to save ~40%.
3. **EC2** – Use Spot for non-critical workloads.
4. **S3** – Move to Glacier/IA for old uploads.
5. **Shut down** – Stop EC2 and RDS when not in use (dev).

---

## Free Tier (12 months)

- EC2: 750 hrs/month t2/t3.micro
- RDS: 750 hrs db.t2.micro
- ElastiCache: 750 hrs cache.t2.micro
- S3: 5 GB, 20k GET, 2k PUT
- Data transfer: 100 GB out

---

## CSV Export (for spreadsheet)

```csv
Resource,Type,Qty,Unit Cost,Monthly Total,Notes
EC2,t3.micro,1,0.0104,7.49,On-demand
RDS,db.t3.micro,1,0.017,12.24,Single-AZ
ElastiCache,cache.t3.micro,1,0.017,12.24,
NAT Gateway,-,1,0.045,32.40,Hourly + data
S3,Standard,1,0.023,0.50,Per GB
```
