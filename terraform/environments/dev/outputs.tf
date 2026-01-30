output "aws_region" {
  value = var.aws_region
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

# EC2
output "launch_template_id" {
  value = module.ec2.launch_template_id
}
