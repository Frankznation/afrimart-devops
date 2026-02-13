output "cluster_id" {
  value       = module.eks.cluster_id
  description = "EKS cluster ID"
}

output "cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  sensitive   = true
  description = "EKS cluster API endpoint"
}

output "cluster_certificate_authority_data" {
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
  description = "Base64-encoded CA cert"
}

output "cluster_oidc_issuer_url" {
  value       = module.eks.cluster_oidc_issuer_url
  description = "OIDC issuer URL for IRSA"
}

output "oidc_provider_arn" {
  value       = module.eks.oidc_provider_arn
  description = "OIDC provider ARN"
}

output "node_security_group_id" {
  value       = module.eks.node_security_group_id
  description = "Node security group ID for EKS workers"
}

output "cluster_primary_security_group_id" {
  value       = module.eks.cluster_primary_security_group_id
  description = "Cluster primary security group ID"
}

output "configure_kubectl" {
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
  description = "Command to configure kubectl"
}
