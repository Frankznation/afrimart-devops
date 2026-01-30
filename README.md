# afrimart-devops
End-to-end DevOps deployment for the AfriMart e-commerce platform (Terraform, Ansible, Docker, Kubernetes, CI/CD).

# Afrimart Infrastructure (Terraform)

This repository contains the Terraform code used to provision the core AWS infrastructure for the **Afrimart** application.

The infrastructure is designed using modular Terraform best practices and supports a scalable, secure, and production-ready setup.


## Architecture Overview

The infrastructure provisions the following AWS resources:

- VPC with public and private subnets across 2 Availability Zones
- Internet Gateway and NAT Gateway
- Security Groups (ALB, App, Redis)
- Application Load Balancer
- EC2 Launch Template
- IAM Role and Instance Profile for EC2
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- S3 bucket for application uploads
- Remote-ready modular Terraform structure

> Architecture diagram available in `/docs/architecture.png`

## Terraform Usage

### Initialize Terraform
```bash
terraform init

terraform validate

terraform plan

terraform apply

terraform destroy

---

## 4️⃣ Terraform Outputs (THIS IS WHERE YOUR SCREENSHOT GOES 🔥)

Based on what you showed, add this section **exactly like this**:

```md
## Terraform Outputs

After successful deployment, Terraform produces the following outputs:


```text
aws_region = eu-north-1

bucket_name = afrimart-uploads

ec2_role_arn = arn:aws:iam::024258572182:role/afrimart-ec2-role

instance_profile_name = afrimart-ec2-profile

launch_template_id = lt-010a62b6eec0f5734c

vpc_id = vpc-026dce62dfb51902b

public_subnet_ids = [
  subnet-098a4d80d6cb041b8,
  subnet-01591444762dcebd3
]

private_subnet_ids = [
  subnet-075b9c2e143c09a35,
  subnet-0685041998e3baded
]

---

## 5️⃣ (Optional but high-score bonus) Notes Section

```md
## Notes

- EC2 instances are created using a Launch Template.
- Instances can be launched manually or via an Auto Scaling Group.
- All private services (RDS, Redis) are deployed inside private subnets.
- IAM roles follow the principle of least privilege.
