# AfriMart Ansible - Phase 2 Configuration Management

## Directory Structure

```
ansible/
├── ansible.cfg
├── logs/                 # Playbook execution logs (gitignored)
├── requirements.txt
├── requirements.yml
├── inventory/
│   ├── hosts.yml        # Dynamic AWS EC2 inventory
│   └── static.yml       # Static fallback
├── group_vars/
│   ├── all.yml
│   └── dev.yml
├── playbooks/
│   ├── site.yml         # Full provisioning + config
│   ├── configure.yml    # Infrastructure only (no app)
│   └── deploy.yml       # Application deployment only
└── roles/
    ├── common/          # Base packages, user, dirs
    ├── nginx/           # Nginx reverse proxy
    ├── nodejs/          # Node.js 20, PM2
    ├── security/        # Firewall, fail2ban, SSH hardening
    ├── monitoring/      # node_exporter
    └── deploy/          # App deployment, env vars
```

## Prerequisites

1. **Python** and **pip** on your control machine
2. **AWS credentials** (`AWS_PROFILE` or `~/.aws/credentials`)
3. **SSH key** `~/.ssh/afrimarts-key.pem` (same key used by Terraform EC2)
4. **Terraform outputs** for RDS/Redis endpoints

## Setup

```bash
# Install Ansible and dependencies
pip install -r requirements.txt
ansible-galaxy collection install -r requirements.yml

# Get Terraform outputs
cd ../terraform/environments/dev
terraform output
```

## Configure group_vars

Edit `group_vars/dev.yml` with values from Terraform:

```yaml
rds_endpoint: "afrimart-postgres.xxx.eu-north-1.rds.amazonaws.com"
redis_endpoint: "afrimart-redis.xxx.cache.amazonaws.com"
bucket_name: afrimart-uploads
db_password_secret: "YOUR_DB_PASSWORD"  # Same as terraform var
```

## Inventory

### Dynamic (AWS EC2)

Uses tags `Project=afrimart` and running instances in `eu-north-1`:

```bash
ansible-inventory -i inventory/hosts.yml --list
ansible-inventory -i inventory/hosts.yml --graph
```

### Static Fallback

If the AWS plugin fails, edit `inventory/static.yml` and set `EC2_PUBLIC_IP`:

```yaml
ansible_host: 13.xx.xx.xx  # Your EC2 public IP
```

Then run with: `ansible-playbook -i inventory/static.yml playbooks/site.yml`

## Playbook Usage

### 1. Configure infrastructure (no app)

```bash
ansible-playbook playbooks/configure.yml
```

### 2. Deploy application

```bash
# Build frontend first
cd ../frontend && npm run build && cd ../ansible

# Deploy
ansible-playbook playbooks/deploy.yml
```

### 3. Full site (configure + deploy)

```bash
ansible-playbook playbooks/site.yml
# Then run deploy.yml for app
```

### Target specific host

```bash
ansible-playbook playbooks/configure.yml -l tag_Name_afrimart_app_ec2
```

### 4. Capture playbook execution logs

Run playbooks with `tee` to save output and display it in the terminal:

```bash
cd ansible
source venv/bin/activate
mkdir -p logs

# Site playbook (full provisioning: common, nginx, nodejs, security, monitoring)
ansible-playbook -i inventory/static.yml playbooks/site.yml 2>&1 | tee logs/site-$(date +%Y%m%d-%H%M%S).log

# Deploy playbook (Postgres, Redis, app deployment)
ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml 2>&1 | tee logs/deploy-$(date +%Y%m%d-%H%M%S).log

# Configure only (no app)
ansible-playbook -i inventory/static.yml playbooks/configure.yml 2>&1 | tee logs/configure-$(date +%Y%m%d-%H%M%S).log
```

Logs are saved to `ansible/logs/` and excluded from git.

## Roles

| Role       | Purpose                                      |
|-----------|-----------------------------------------------|
| common    | Base packages, `afrimart` user, directories   |
| nginx     | Nginx reverse proxy (frontend + /api → backend) |
| nodejs    | Node.js 20, PM2                               |
| security  | firewalld, fail2ban, SSH hardening            |
| monitoring| node_exporter (Prometheus)                     |
| deploy    | Backend sync, .env, migrations, PM2 start     |

## Idempotency

All playbooks are idempotent. Re-running produces no changes unless configuration or code has changed.

## Troubleshooting

- **Connection refused**: Ensure EC2 security group allows SSH (port 22) from your IP
- **Permission denied (publickey)**: Verify `~/.ssh/afrimarts-key.pem` exists and has `chmod 600`
- **RDS/Redis unreachable**: EC2 must be in same VPC; check security groups allow app SG → RDS/Redis
