# afrimart-devops

End-to-end DevOps deployment for the AfriMart e-commerce platform (Terraform, Ansible, Docker, CI/CD).

## Repository Structure

```
├── backend/           # Node.js API (Express, Sequelize, Postgres)
├── frontend/          # React/Vite e-commerce UI
├── docker/            # Docker Compose for local development
├── terraform/         # AWS infrastructure (VPC, EC2, RDS, Redis, S3)
├── ansible/           # Configuration management (Nginx, Node.js, deploy)
└── docs/              # Documentation
    └── DEVOPS_GUIDE.md   # Full Terraform + Ansible implementation guide
```

## Quick Start

1. **Infrastructure (Terraform)**
   ```bash
   cd terraform/environments/dev
   terraform init
   terraform apply -var="db_password=YourSecurePassword"
   # Launch EC2 instance from launch template; note public IP
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

## Documentation

See **[docs/DEVOPS_GUIDE.md](docs/DEVOPS_GUIDE.md)** for:

- Terraform architecture, modules, and usage
- Ansible roles, playbooks, and inventory
- End-to-end deployment steps
- Troubleshooting

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

## Notes

- EC2 instances are created via Launch Template (manual or ASG).
- RDS and Redis run in private subnets.
- Ansible supports dynamic AWS EC2 inventory or static IP.
- For local deploy (no RDS/ElastiCache), use `deploy-with-local-db.yml` which installs Postgres and Redis on EC2.

## License

Private / Educational use.
