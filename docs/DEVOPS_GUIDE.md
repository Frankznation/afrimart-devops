# AfriMart DevOps Implementation Guide

This document describes how Terraform and Ansible were implemented for the AfriMart e-commerce platform deployment.

---

## Table of Contents

1. [Overview](#overview)
2. [Deployment Flow](#deployment-flow)
3. [Terraform](#terraform)
4. [Ansible](#ansible)
5. [End-to-End Deployment](#end-to-end-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The AfriMart deployment pipeline has two main phases:

| Phase | Tool | Purpose |
|-------|------|---------|
| 1. Infrastructure | Terraform | Provisions AWS resources: VPC, EC2, RDS, Redis, S3, security groups |
| 2. Configuration & Deployment | Ansible | Configures the EC2 server and deploys the application |

**Prerequisites:**
- AWS account with credentials configured
- SSH key pair (`afrimarts-key`) created in AWS and saved locally as `~/.ssh/afrimarts-key.pem`

---

## Deployment Flow

```
Terraform apply → EC2 instance running
       ↓
Ansible site.yml → Server configured (Nginx, Node.js, security, monitoring)
       ↓
Ansible deploy-with-local-db.yml → App deployed (Postgres, Redis, backend, frontend)
       ↓
Application live at http://<EC2_PUBLIC_IP>/
```

---

## Terraform

### Directory Structure

```
terraform/
├── environments/
│   └── dev/
│       ├── main.tf        # Module composition
│       ├── variables.tf   # Input variables
│       ├── outputs.tf     # Outputs for Ansible
│       ├── backend.tf     # State backend (S3 optional)
│       └── providers.tf   # AWS provider
└── modules/
    ├── vpc/               # VPC, subnets, IGW, NAT
    ├── security-groups/   # ALB, App, RDS, Redis SGs
    ├── rds/               # PostgreSQL
    ├── redis/             # ElastiCache
    ├── s3/                # S3 bucket for uploads
    ├── iam/               # EC2 instance role
    ├── ec2/               # Launch template
    └── alb/               # Application Load Balancer (optional)
```

### How Terraform Was Set Up

1. **Modular design** – Each AWS resource type lives in its own module under `modules/`.
2. **Environment isolation** – `environments/dev/` contains the dev environment; you can add `staging/`, `prod/`.
3. **Variables** – Sensitive values (e.g. `db_password`) are passed via variables, not hardcoded.
4. **Outputs** – `outputs.tf` exports values needed by Ansible (RDS endpoint, Redis endpoint, etc.).

### Terraform Usage

#### 1. Initialize

```bash
cd terraform/environments/dev
terraform init
```

#### 2. Create tfvars (for secrets)

Create `terraform.tfvars` (gitignored) or pass via CLI:

```hcl
db_password = "YourSecurePassword123!"
```

#### 3. Plan and Apply

```bash
terraform plan
terraform apply
```

#### 4. Capture Outputs

After apply, note the outputs for Ansible:

```bash
terraform output
# db_endpoint, redis_endpoint, vpc_id, public_subnet_ids, etc.
```

#### 5. Launch EC2 Instance

Terraform creates a **launch template**. Manually launch an instance from the AWS console using that template, or use an Auto Scaling Group. Note the instance **public IP** for Ansible.

### Terraform Outputs (Example)

After successful deployment:

| Output | Description |
|--------|-------------|
| `vpc_id` | VPC ID |
| `public_subnet_ids` | Public subnet IDs |
| `private_subnet_ids` | Private subnet IDs |
| `launch_template_id` | EC2 launch template ID |
| `instance_profile_name` | IAM instance profile for EC2 |
| `bucket_name` | S3 bucket for uploads |
| `db_endpoint` | RDS PostgreSQL endpoint (sensitive) |
| `redis_endpoint` | ElastiCache Redis endpoint |

---

## Ansible

### Directory Structure

```
ansible/
├── ansible.cfg
├── requirements.txt
├── requirements.yml
├── logs/                 # Playbook execution logs (gitignored)
├── inventory/
│   ├── hosts.yml        # Dynamic AWS EC2 inventory
│   └── static.yml       # Static fallback (IP-based)
├── group_vars/
│   ├── all.yml          # Shared variables
│   ├── afrimart_app.yml # App-specific overrides
│   └── dev.yml          # Dev environment
├── playbooks/
│   ├── site.yml              # Full provisioning (common, nginx, nodejs, security, monitoring)
│   ├── configure.yml         # Infrastructure config only (no app)
│   ├── deploy-with-local-db.yml  # Deploy with Postgres/Redis on EC2
│   ├── deploy.yml            # Deploy with RDS/ElastiCache
│   └── bootstrap-python.yml  # Bootstrap Python on Amazon Linux 2
└── roles/
    ├── common/          # Base packages, afrimart user, directories
    ├── nginx/           # Nginx reverse proxy (frontend + /api)
    ├── nodejs/          # Node.js via nvm, PM2
    ├── security/        # firewalld, fail2ban, SSH hardening
    ├── monitoring/      # node_exporter (Prometheus)
    ├── deploy/          # App deployment, .env, migrations, PM2
    └── postgres_redis/  # Postgres + Redis on EC2 (local deploy)
```

### How Ansible Was Set Up

1. **Roles** – Each concern (nginx, nodejs, security, etc.) is a reusable role.
2. **Playbooks** – `site.yml` runs all config roles; `deploy-with-local-db.yml` deploys the app with local Postgres/Redis.
3. **Inventory** – Dynamic AWS EC2 plugin (`hosts.yml`) or static (`static.yml`) with EC2 public IP.
4. **Group vars** – `group_vars/` holds environment-specific variables (DB, Redis, secrets).

### Ansible Usage

#### 1. Setup (One-time)

```bash
cd ansible
python3 -m venv venv
source venv/bin/activate   # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
ansible-galaxy collection install -r requirements.yml
```

#### 2. Configure Inventory

**Option A: Static inventory** (recommended when starting)

Edit `inventory/static.yml`:

```yaml
all:
  children:
    afrimart_app:
      hosts:
        afrimart_app_1:
          ansible_host: 51.20.104.21    # Your EC2 public IP
          ansible_user: ec2-user
          ansible_ssh_private_key_file: ~/.ssh/afrimarts-key.pem
```

**Option B: Dynamic AWS EC2**

Ensure AWS credentials are configured. The `hosts.yml` plugin discovers instances with tag `Project=afrimart`.

#### 3. Configure group_vars

For **local deploy** (Postgres + Redis on EC2), edit `group_vars/afrimart_app.yml`:

```yaml
rds_endpoint: ""
redis_endpoint: ""
db_password_secret: "AfrimartLocalDB2024!"
jwt_secret: "your-jwt-secret-change-me"
```

For **RDS/ElastiCache**, use values from Terraform outputs in `group_vars/dev.yml`.

#### 4. Run Playbooks

**Full site provisioning** (Nginx, Node.js, security, monitoring):

```bash
ansible-playbook -i inventory/static.yml playbooks/site.yml 2>&1 | tee logs/site-$(date +%Y%m%d-%H%M%S).log
```

**Deploy application** (with local Postgres/Redis):

```bash
# Build frontend first
cd ../frontend && npm run build && cd ../ansible

ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml 2>&1 | tee logs/deploy-$(date +%Y%m%d-%H%M%S).log
```

#### 5. Capture Logs

Always run with `tee` to save execution logs:

```bash
ansible-playbook -i inventory/static.yml playbooks/site.yml 2>&1 | tee logs/site-$(date +%Y%m%d-%H%M%S).log
```

Logs are stored in `ansible/logs/` (gitignored).

### Ansible Roles Summary

| Role | Purpose |
|------|---------|
| common | Base packages, `afrimart` user, app directories |
| nginx | Nginx reverse proxy; serves frontend and proxies `/api` to backend |
| nodejs | Node.js (nvm), PM2 for process management |
| security | firewalld (ports 22, 80, 443), fail2ban, SSH hardening |
| monitoring | node_exporter for Prometheus metrics |
| deploy | Syncs backend/frontend, creates .env, runs migrations, starts PM2 |
| postgres_redis | Installs Postgres 14 and Redis on EC2 (for local deploy) |

---

## End-to-End Deployment

### First-Time Setup

1. **Terraform**
   ```bash
   cd terraform/environments/dev
   terraform init
   terraform apply -var="db_password=YourSecurePassword"
   # Launch EC2 instance from the launch template
   # Note the public IP
   ```

2. **Update Ansible inventory**
   ```bash
   # Edit ansible/inventory/static.yml
   ansible_host: <EC2_PUBLIC_IP>
   ```

3. **Ansible – provision server**
   ```bash
   cd ansible
   source venv/bin/activate
   ansible-playbook -i inventory/static.yml playbooks/site.yml 2>&1 | tee logs/site-$(date +%Y%m%d-%H%M%S).log
   ```

4. **Build frontend**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

5. **Ansible – deploy app**
   ```bash
   cd ../ansible
   ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml 2>&1 | tee logs/deploy-$(date +%Y%m%d-%H%M%S).log
   ```

6. **Seed database** (if products page is empty)
   ```bash
   ssh -i ~/.ssh/afrimarts-key.pem ec2-user@<EC2_IP>
   sudo -u afrimart bash -c 'export NVM_DIR=/opt/afrimart/.nvm; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; cd /opt/afrimart/backend && npm run seed'
   ```

7. **Verify**
   - Frontend: `http://<EC2_IP>/`
   - API: `http://<EC2_IP>/api/health`
   - Default login: `admin@afrimart.com` / `admin123`

### Subsequent Deployments (Code Changes)

```bash
cd ../frontend && npm run build && cd ../ansible
ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml 2>&1 | tee logs/deploy-$(date +%Y%m%d-%H%M%S).log
```

---

## Troubleshooting

### Terraform

| Issue | Solution |
|-------|----------|
| `backend` not initialized | Run `terraform init` |
| `db_password` required | Pass via `-var="db_password=..."` or `terraform.tfvars` |
| State lock | Check S3 backend; ensure no other apply running |

### Ansible

| Issue | Solution |
|-------|----------|
| Connection refused | EC2 security group must allow SSH (port 22) from your IP |
| Permission denied (publickey) | Verify `~/.ssh/afrimarts-key.pem` exists and `chmod 600` |
| npm not found during deploy | Node is installed via nvm for `afrimart` user; seed uses explicit PATH |
| Products page empty | Run `npm run seed` on server (see step 6 above) |
| Login fails | Seed was fixed to avoid double-hashing; re-run deploy to get updated seed script |

### Application

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check PM2: `ssh ... 'sudo -u afrimart pm2 list'` |
| Blank page | Ensure frontend built with `VITE_API_URL=/api` |
| RDS/Redis unreachable | Use `deploy-with-local-db.yml` for local Postgres/Redis on EC2 |

---

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible AWS EC2 Inventory Plugin](https://docs.ansible.com/ansible/latest/collections/amazon/aws/aws_ec2_inventory.html)
