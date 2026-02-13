output "devops_user_arn" {
  description = "ARN of the DevOps IAM user"
  value       = aws_iam_user.devops.arn
}

output "devops_user_name" {
  description = "Name of the DevOps IAM user"
  value       = aws_iam_user.devops.name
}

output "cicd_user_arn" {
  description = "ARN of the CI/CD IAM user (if created)"
  value       = var.create_cicd_user ? aws_iam_user.cicd[0].arn : null
}

output "cicd_user_name" {
  description = "Name of the CI/CD IAM user (if created)"
  value       = var.create_cicd_user ? aws_iam_user.cicd[0].name : null
}
