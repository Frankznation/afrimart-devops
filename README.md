# afrimart-devops

End-to-end DevOps deployment for the AfriMart e-commerce platform (Terraform, Ansible, Docker, CI/CD).

## Repository Structure

```
├── backend/           # Node.js API (Express, Sequelize, Postgres)
├── frontend/          # React/Vite e-commerce UI
├── docker/            # Docker Compose for local development
├── k8s/               # Kubernetes manifests (Phase 5)
├── helm/              # Helm charts for AfriMart
├── terraform/         # Phase 1: AWS infrastructure
│   ├── backend/       # S3 + DynamoDB for state
│   ├── modules/       # VPC, RDS, Redis, S3, ALB, EC2, IAM, ECR, EKS
│   └── environments/  # dev, eks
├── ansible/           # Configuration management (Nginx, Node.js, deploy)
└── docs/              # Documentation
```

## Quick Start

1. **Infrastructure (Terraform)**
   ```bash
   cd terraform/environments/dev
   terraform init
   terraform apply -var='db_password=YourSecurePassword' -auto-approve
   # EC2 instance is created; get public IP for app deploy
   ```

2. **Server config & deploy (Ansible)**
   ```bash
   cd ansible
   source venv/bin/activate
   # Edit inventory/static.yml with your EC2 public IP
   ansible-playbook -i inventory/static.yml playbooks/site.yml
   cd ../frontend && npm run build && cd ../ansible
   ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml
   ```

3. **Access**: `http://<EC2_PUBLIC_IP>/`

## Phase 1: Terraform (Quick Start)

```bash
# Bootstrap state (optional - for remote state)
cd terraform/backend && terraform init && terraform apply

# Deploy dev infrastructure (run from project root)
cd terraform/environments/dev
terraform init
terraform apply -var='db_password=YourSecurePassword' -auto-approve -input=false
```

> **Tip:** Use single quotes for `db_password` if it contains `!` to avoid shell interpretation.

**Variables:** `enable_alb` (default false), `rds_multi_az`, `rds_instance_class`. See [docs/TERRAFORM_PHASE1.md](docs/TERRAFORM_PHASE1.md).

**Workspaces:** Use `terraform workspace` for dev/staging/production:
```bash
terraform workspace list             # default=dev, staging, prod
terraform workspace select default   # dev (current resources)
terraform workspace select staging   # staging
terraform workspace new staging      # create new workspace (first time)
```

**Get public URL (EC2):**
```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=afrimart*app*" "Name=instance-state-name,Values=running" --query "Reservations[*].Instances[*].PublicIpAddress" --output text --region eu-north-1
```
Site URL: `http://<public-ip>/` (after Ansible deploy)

## Documentation

| Document | Description |
|----------|-------------|
| [docs/TERRAFORM_PHASE1.md](docs/TERRAFORM_PHASE1.md) | **Phase 1: Infrastructure** – Terraform modules, commands |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture diagram (Mermaid) |
| [docs/COST_ESTIMATION.md](docs/COST_ESTIMATION.md) | Cost estimation spreadsheet |
| [docs/DEVOPS_GUIDE.md](docs/DEVOPS_GUIDE.md) | Terraform + Ansible deployment |
| [docs/DOCKER_PHASE3.md](docs/DOCKER_PHASE3.md) | **Phase 3: Containerization** – Docker, ECR, best practices |
| [docs/IMAGE_SIZE_REPORT.md](docs/IMAGE_SIZE_REPORT.md) | **Phase 3: Image size comparison** – optimization report |
| [docs/CI_CD_PHASE4.md](docs/CI_CD_PHASE4.md) | **Phase 4: CI/CD Pipeline** – Jenkins, Jenkinsfile, testing, deployment |
| [docs/JENKINS_PIPELINE_GUIDE.md](docs/JENKINS_PIPELINE_GUIDE.md) | **Jenkins setup & troubleshooting** – credentials, Slack, Manual Approval |
| [docs/JENKINS_SETUP.md](docs/JENKINS_SETUP.md) | Quick Jenkins setup reference |
| [docs/KUBERNETES_PHASE5.md](docs/KUBERNETES_PHASE5.md) | **Phase 5: Kubernetes** – EKS, manifests, Helm |
| [docs/RESOURCE_UTILIZATION.md](docs/RESOURCE_UTILIZATION.md) | **Phase 5: Resource utilization** – sizing analysis |

## Phase 5: Kubernetes / EKS (Quick Start)

```bash
# 1. Deploy EKS cluster
cd terraform/environments/eks
terraform init
terraform apply -var="db_password=YourSecurePassword"

# 2. Configure kubectl
aws eks update-kubeconfig --region eu-north-1 --name afrimart-eks

# 3. Create secret (edit values)
cp k8s/secret.yaml.example k8s/secret.yaml
# Edit k8s/secret.yaml with RDS, Redis, JWT_SECRET from terraform output

# 4. Apply manifests
./scripts/k8s-apply.sh
# Or use Helm: helm install afrimart helm/afrimart -n afrimart -f helm/afrimart/values-dev.yaml
```

See [docs/KUBERNETES_PHASE5.md](docs/KUBERNETES_PHASE5.md) for full setup including AWS Load Balancer Controller.

## Phase 3: Docker (Quick Start)

```bash
# Local development with docker-compose
cd docker
docker compose up -d
# Frontend: http://localhost:3001 | Backend: http://localhost:5001

# Push to ECR (after terraform apply)
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-north-1.amazonaws.com
docker build -t afrimart/backend:latest ./backend
docker tag afrimart/backend:latest <ecr-url>:latest
docker push <ecr-url>:latest
```

## Terraform Outputs (Example)

After `terraform apply`:

| Output | Description |
|--------|-------------|
| `vpc_id` | VPC ID |
| `public_subnet_ids` | Public subnets |
| `private_subnet_ids` | Private subnets |
| `launch_template_id` | EC2 launch template |
| `instance_profile_name` | IAM instance profile |
| `bucket_name` | S3 bucket for uploads |
| `db_endpoint` | RDS PostgreSQL (sensitive) |
| `redis_endpoint` | ElastiCache Redis |
| `devops_user_name` | IAM user for Terraform/infrastructure |
| `workspace` | Current Terraform workspace |

## Notes

- EC2 instances are created via Launch Template (manual or ASG).
- RDS and Redis run in private subnets.
- Ansible supports dynamic AWS EC2 inventory or static IP.
- For local deploy (no RDS/ElastiCache), use `deploy-with-local-db.yml` which installs Postgres and Redis on EC2.

## License

Private / Educational use.
