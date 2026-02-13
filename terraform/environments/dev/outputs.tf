output "aws_region" {
  value = var.aws_region
}

output "workspace" {
  value       = terraform.workspace
  description = "Current Terraform workspace (default=dev, staging, prod)"
}

output "environment" {
  value       = local.environment
  description = "Environment name used for resource naming"
}

output "project_name" {
  value = var.project_name
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

# S3
output "bucket_name" {
  value = module.s3.bucket_name
}

# IAM
output "ec2_role_arn" {
  value = module.iam.ec2_role_arn
}

output "instance_profile_name" {
  value = module.iam.instance_profile_name
}

output "devops_user_arn" {
  value       = module.iam_users.devops_user_arn
  description = "ARN of the DevOps IAM user (for Terraform/infrastructure)"
}

output "devops_user_name" {
  value       = module.iam_users.devops_user_name
  description = "Name of the DevOps IAM user"
}

# EC2
output "launch_template_id" {
  value = module.ec2.launch_template_id
}

# RDS (for Ansible group_vars)
output "db_endpoint" {
  value     = module.rds.db_endpoint
  sensitive = true
}

# Redis (for Ansible group_vars)
output "redis_endpoint" {
  value = module.redis.redis_endpoint
}

# ECR (for CI/CD image push)
output "ecr_backend_url" {
  value       = module.ecr.backend_repository_url
  description = "ECR URL for backend Docker image"
}

output "ecr_frontend_url" {
  value       = module.ecr.frontend_repository_url
  description = "ECR URL for frontend Docker image"
}

# ALB (when enable_alb = true)
output "alb_dns_name" {
  value       = var.enable_alb ? module.alb[0].alb_dns_name : "ALB disabled"
  description = "ALB DNS name for application access"
}
