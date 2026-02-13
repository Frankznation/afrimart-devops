output "cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "configure_kubectl" {
  value       = module.eks.configure_kubectl
  description = "Run this to configure kubectl"
}

output "ecr_backend_url" {
  value = module.ecr.backend_repository_url
}

output "ecr_frontend_url" {
  value = module.ecr.frontend_repository_url
}

output "db_endpoint" {
  value     = module.rds.db_endpoint
  sensitive = true
}

output "redis_endpoint" {
  value = module.redis.redis_endpoint
}

output "bucket_name" {
  value = module.s3.bucket_name
}
