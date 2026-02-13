variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs for EKS"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for EKS nodes"
}

variable "kubernetes_version" {
  type        = string
  default     = "1.29"
  description = "Kubernetes version (1.28 deprecated, use 1.29+)"
}

variable "on_demand_instance_types" {
  type        = list(string)
  default     = ["t3.medium"]
  description = "On-demand instance types"
}

variable "on_demand_desired_size" {
  type        = number
  default     = 2
  description = "Desired on-demand node count"
}

variable "on_demand_min_size" {
  type        = number
  default     = 1
  description = "Minimum on-demand nodes"
}

variable "on_demand_max_size" {
  type        = number
  default     = 4
  description = "Maximum on-demand nodes"
}

variable "spot_instance_types" {
  type        = list(string)
  default     = ["t3.medium", "t3a.medium"]
  description = "Spot instance types"
}

variable "spot_desired_size" {
  type        = number
  default     = 1
  description = "Desired spot node count"
}

variable "spot_min_size" {
  type        = number
  default     = 0
  description = "Minimum spot nodes"
}

variable "spot_max_size" {
  type        = number
  default     = 4
  description = "Maximum spot nodes"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags for EKS resources"
}
