variable "project_name" {
  type        = string
  description = "Project name used for resource naming"
}

variable "devops_policy_arn" {
  type        = string
  description = "IAM policy ARN for DevOps user (e.g. PowerUserAccess or AdministratorAccess)"
  default     = "arn:aws:iam::aws:policy/PowerUserAccess"
}

variable "create_cicd_user" {
  type        = bool
  description = "Create a separate IAM user for CI/CD pipelines"
  default     = false
}

variable "cicd_policy_arn" {
  type        = string
  description = "IAM policy ARN for CI/CD user"
  default     = "arn:aws:iam::aws:policy/PowerUserAccess"
}

variable "name_suffix" {
  type    = string
  default = ""
}
