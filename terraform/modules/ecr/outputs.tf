output "backend_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR repository URL for backend image"
}

output "backend_repository_arn" {
  value       = aws_ecr_repository.backend.arn
  description = "ECR repository ARN for backend"
}

output "frontend_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR repository URL for frontend image"
}

output "frontend_repository_arn" {
  value       = aws_ecr_repository.frontend.arn
  description = "ECR repository ARN for frontend"
}
