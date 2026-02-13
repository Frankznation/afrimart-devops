variable "project_name" {}
variable "vpc_cidr" {}

variable "name_suffix" {
  type        = string
  default     = ""
  description = "Suffix for resource names (e.g. -staging, -prod for workspaces)"
}

variable "eks_cluster_name" {
  type        = string
  default     = ""
  description = "If set, adds EKS subnet tags for ALB discovery"
}
