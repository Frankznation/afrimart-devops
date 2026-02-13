# Phase 1: Infrastructure Provisioning

This document covers the AfriMart Phase 1 Terraform setup and deliverables.

---

## Guidelines

### Command Syntax

- **Run Terraform from the correct directory:** `terraform/environments/dev` (where `main.tf` lives).
- **Use single quotes for password:** If `db_password` contains `!`, use single quotes to avoid shell interpretation:
  ```bash
  terraform apply -var='db_password=AfrimartSecurePass2024!' -auto-approve
  ```
- **Non-interactive mode:** Add `-input=false` to avoid prompts when running in CI or headless.

### Prerequisites

1. AWS CLI configured (`aws configure` or `aws sts get-caller-identity`)
2. Terraform >= 1.0
3. Valid AWS credentials with IAM permissions for EC2, RDS, VPC, S3, etc.

---

## Checklist

### AWS Account Setup
- [x] Create/use AWS account
- [x] Set up IAM users with appropriate permissions
- [x] Configure AWS CLI and credentials

### Terraform Infrastructure
| Module | Status | Description |
|--------|--------|-------------|
| VPC | ✓ | Public + private subnets across 2 AZs |
| IGW + NAT | ✓ | Internet Gateway, NAT Gateway |
| Route tables | ✓ | Public (→ IGW), private (→ NAT) |
| Security groups | ✓ | Web (ALB), App, Database, Redis |
| RDS PostgreSQL | ✓ | Multi-AZ optional for production |
| ElastiCache Redis | ✓ | In private subnets |
| S3 | ✓ | Application uploads, versioning, encryption |
| ALB | ✓ | Optional (set `enable_alb = true` when allowed) |
| Target groups | ✓ | Part of ALB module |
| EC2 launch template | ✓ | For app deployment |
| IAM roles/policies | ✓ | EC2 role, S3, CloudWatch |
| IAM users | ✓ | DevOps user (PowerUserAccess) via `iam-users` module |

### State Management
- [x] S3 backend for Terraform state (`terraform/backend/`)
- [x] DynamoDB table for state locking
- [x] Terraform workspaces for staging/production (`terraform workspace`)

---

## Terraform Commands

### 1. Bootstrap remote state (first time only)

```bash
cd terraform/backend
terraform init
terraform apply
# Note bucket name and DynamoDB table from output
```

### 2. Dev environment

```bash
cd terraform/environments/dev
terraform init
terraform plan -var='db_password=YourSecurePassword' -input=false
terraform apply -var='db_password=YourSecurePassword' -auto-approve -input=false
```

Use single quotes for passwords containing `!` (e.g. `AfrimartSecurePass2024!`).

### 3. Enable S3 backend (after bootstrap)

Copy `backend.tf.example` to `backend.tf`, set bucket name:

```hcl
terraform {
  backend "s3" {
    bucket         = "afrimart-terraform-state-ACCOUNT_ID"
    key            = "dev/terraform.tfstate"
    region         = "eu-north-1"
    dynamodb_table = "afrimart-terraform-lock"
    encrypt        = true
  }
}
```

Then: `terraform init -migrate-state`

### 4. Enable ALB (when account supports it)

```bash
terraform apply -var="db_password=..." -var="enable_alb=true"
```

### 5. Workspaces (dev / staging / production)

```bash
terraform workspace list              # Show workspaces (default=dev)
terraform workspace select default   # Use dev (current resources)
terraform workspace new staging      # Create staging workspace
terraform workspace select staging   # Switch to staging
terraform apply -var="db_password=..."  # Deploy staging (separate resources)
terraform workspace new prod         # Create production workspace
terraform workspace select prod
terraform apply -var="db_password=..." -var="rds_multi_az=true"
```

Each workspace uses isolated state and creates separate resources (e.g. `afrimart-staging-vpc`, `afrimart-prod-postgres`).

### 6. Production RDS (Multi-AZ)

```bash
terraform apply -var='db_password=...' -var="rds_multi_az=true"
```

### 7. Get public URL (EC2)

After `terraform apply`, get the EC2 public IP for your website:

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=afrimart*app*" "Name=instance-state-name,Values=running" \
  --query "Reservations[*].Instances[*].PublicIpAddress" \
  --output text \
  --region eu-north-1
```

Public URL: `http://<public-ip>/` (site loads after Ansible deploy).

---

## Directory Structure

```
terraform/
├── backend/           # Bootstrap: S3 + DynamoDB for state
├── modules/
│   ├── vpc/
│   ├── security-groups/
│   ├── rds/
│   ├── redis/
│   ├── s3/
│   ├── ecr/
│   ├── iam/
│   ├── iam-users/
│   ├── ec2/
│   ├── alb/
│   └── eks/
└── environments/
    ├── dev/           # EC2 + RDS + Redis + S3
    └── eks/           # EKS + full stack
```

---

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Terraform modules | `terraform/modules/` |
| README with commands | [../README.md](../README.md) |
| Architecture diagram | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Cost estimation | [COST_ESTIMATION.md](COST_ESTIMATION.md) |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `dquote>` prompt | Use single quotes for password: `-var='db_password=...'` |
| `No configuration files` | Run from `terraform/environments/dev` |
| Terraform stagnant/hanging | Check state lock: `terraform force-unlock <ID>`; verify `aws sts get-caller-identity` |
| `Error acquiring the state lock` | Another process has lock; wait or force-unlock |

---

## Submission Checklist

For deployment evidence, provide:

1. **Screenshot of Terraform deployed message** – Terminal showing `Apply complete! Resources: X added, Y changed, Z destroyed.`
2. **Public URL** – `http://<EC2_PUBLIC_IP>/` (from AWS CLI or Console).
3. **Screenshot of deployed website** – Browser view of the live site (after Ansible deploy).
